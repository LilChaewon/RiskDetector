'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lightbulb, Loader2, Share2, Sparkles, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RiskTag, { riskMeta } from '@/components/RiskTag';
import { fetchAnalysis } from '@/api/contract';
import type { ContractAnalysisDTO } from '@/types/api';

type Toxic = ContractAnalysisDTO['toxics'][number];
type OcrBlock = NonNullable<ContractAnalysisDTO['ocrBlocks']>[number];
type FilterKey = 'all' | 'warning' | 'review' | 'safe';

function normalizeText(value: string) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
}

function textChunks(value: string, size = 10) {
  const normalized = normalizeText(value);
  if (normalized.length < size) return normalized ? [normalized] : [];
  const chunks: string[] = [];
  for (let i = 0; i <= normalized.length - size; i += Math.max(4, Math.floor(size / 2))) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks;
}

function statusText(status: string) {
  if (status === 'completed') return '분석 완료';
  if (status === 'in_progress') return '분석 중';
  return '분석 실패';
}

function buildAnalysisExportText(data: ContractAnalysisDTO) {
  const lines = [
    `계약서: ${data.title || '업로드된 계약서'}`,
    `분석일: ${new Date(data.createdAt).toLocaleString('ko-KR')}`,
    `독소조항: ${data.toxicCount}건`,
    '',
    '[AI 종합 의견]',
    data.riskdetectorCommentary?.overallComment || '종합 의견 없음',
    data.riskdetectorCommentary?.warningComment ? `주의: ${data.riskdetectorCommentary.warningComment}` : '',
    data.riskdetectorCommentary?.advice ? `제안: ${data.riskdetectorCommentary.advice}` : '',
    '',
    '[조항별 분석 참고]',
  ].filter(Boolean);

  data.toxics.forEach((toxic, index) => {
    lines.push(
      '',
      `${index + 1}. ${toxic.title || '독소조항'}`,
      `위험도: ${riskMeta(toxic.warnLevel).label}`,
      toxic.clause ? `원문: ${toxic.clause}` : '',
      toxic.reason ? `위험 이유: ${toxic.reason}` : '',
      toxic.reasonReference ? `근거: ${toxic.reasonReference}` : ''
    );
  });

  return lines.filter(Boolean).join('\n');
}

function blockText(block: OcrBlock) {
  return normalizeText(block.content || '');
}

function htmlToPlainText(value: string) {
  return value
    .replace(/<\/(h[1-6]|p|div|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function clauseSectionTitle(text: string) {
  const heading = text.split('\n').map((line) => line.trim()).find((line) => /^(제\d+조|전\s*속|계약서)/.test(line));
  return heading || '';
}

function findToxicForBlock(block: OcrBlock, toxics: Toxic[]) {
  const text = blockText(block);
  if (!text) return -1;

  const tagMatchIndex = toxics.findIndex((toxic) => toxic.sourceContractTagIdx === block.tagIdx);
  if (tagMatchIndex >= 0) return tagMatchIndex;

  return toxics.findIndex((toxic) => {
    const sources = [toxic.clause || '', toxic.title || ''].filter(Boolean);
    return sources.some((source) => {
      const normalized = normalizeText(source);
      if (normalized.length < 4) return false;
      if (text.includes(normalized) || normalized.includes(text.slice(0, Math.min(text.length, 24)))) {
        return true;
      }
      return textChunks(source).some((chunk) => chunk.length >= 6 && text.includes(chunk));
    });
  });
}

function highlightNeedle(blockTextValue: string, toxic?: Toxic) {
  if (!toxic) return '';
  const candidates = [toxic.clause, toxic.title].filter(Boolean);
  const normalizedBlock = normalizeText(blockTextValue);

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized.length >= 4 && normalizedBlock.includes(normalized)) {
      return candidate;
    }
  }

  const chunks = textChunks(toxic.clause || toxic.title || '', 14)
    .filter((chunk) => chunk.length >= 8)
    .sort((a, b) => b.length - a.length);
  return chunks.find((chunk) => normalizedBlock.includes(chunk)) || '';
}

function splitByNeedle(text: string, needle: string) {
  if (!needle) return null;
  const normalizedNeedle = normalizeText(needle);
  if (!normalizedNeedle) return null;

  const chars = Array.from(text);
  for (let start = 0; start < chars.length; start += 1) {
    let cursor = start;
    let built = '';

    while (cursor < chars.length && built.length < normalizedNeedle.length) {
      const char = chars[cursor];
      if (!/\s/.test(char)) built += char;
      cursor += 1;
    }

    if (built === normalizedNeedle) {
      return {
        before: chars.slice(0, start).join(''),
        match: chars.slice(start, cursor).join(''),
        after: chars.slice(cursor).join(''),
      };
    }
  }

  return null;
}

function filterMatches(filter: FilterKey, toxic?: Toxic) {
  if (filter === 'all') return true;
  if (filter === 'safe') return !toxic;
  if (!toxic) return false;
  if (filter === 'warning') return (toxic.warnLevel || 0) >= 3;
  return toxic.warnLevel === 2;
}

function shortText(value?: string, limit = 54) {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit).trim()}...` : normalized;
}

function firstAdvice(value?: string) {
  if (!value) return '';
  return value.split(/\s*\/\s*/).map((item) => item.trim()).filter(Boolean)[0] || value;
}

function fallbackOriginBlocks(originContent: string): OcrBlock[] {
  if (!originContent) return [];
  if (typeof window === 'undefined') {
    return [{ id: 'origin-0', category: 'document', content: originContent, tagIdx: 0 }];
  }

  const doc = new DOMParser().parseFromString(`<div>${originContent}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const children = root ? Array.from(root.children) : [];

  if (children.length === 0) {
    return [{ id: 'origin-0', category: 'document', content: originContent, tagIdx: 0 }];
  }

  return children.map((element, index) => ({
    id: `origin-${index}`,
    category: element.tagName.toLowerCase(),
    content: element.outerHTML,
    tagIdx: index,
  }));
}

function DocumentBlock({
  block,
  toxic,
  active,
  onSelect,
}: {
  block: OcrBlock;
  toxic?: Toxic;
  active: boolean;
  onSelect: () => void;
}) {
  const text = htmlToPlainText(block.content || '');
  const heading = clauseSectionTitle(text);
  const body = heading ? text.replace(heading, '').trim() : text;
  const needle = highlightNeedle(text, toxic);
  const split = splitByNeedle(body || text, needle);
  const highlightLevel = toxic?.warnLevel === 2 ? 'review' : 'warning';

  if (!toxic || !split) {
    return (
      <article className={`rd-document-block ${toxic ? `has-risk is-${highlightLevel}` : ''}`}>
        {heading && <h2>{heading}</h2>}
        {(body || (!heading && text)) && <p>{body || text}</p>}
        {toxic && (
          <button type="button" className="rd-block-fallback" onClick={onSelect}>
            <RiskTag level={toxic.warnLevel} />
            <span>{toxic.title || '위험 조항'} 근거 보기</span>
          </button>
        )}
      </article>
    );
  }

  return (
    <article className="rd-document-block">
      {heading && <h2>{heading}</h2>}
      <p>
        {split.before}
        <button
          type="button"
          onClick={onSelect}
          className={`rd-inline-highlight is-${highlightLevel} ${active ? 'is-active' : ''}`}
        >
          {split.match}
        </button>
        {split.after}
      </p>
    </article>
  );
}

function AnalysisResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contractId = searchParams.get('contractId') || '';
  const analysisId = searchParams.get('analysisId') || '';

  const [data, setData] = useState<ContractAnalysisDTO | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invalidAccess = !contractId || !analysisId;

  useEffect(() => {
    if (invalidAccess) return;
    fetchAnalysis(contractId, analysisId)
      .then((res) => {
        if (res.analysisStatus !== 'completed') {
          setError('아직 분석이 완료되지 않았습니다.');
          return;
        }
        setData(res);
      })
      .catch((err) => {
        console.error('분석 결과 조회 오류:', err);
        setError('분석 결과를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [contractId, analysisId, invalidAccess]);

  const selected = selectedIndex === null ? undefined : data?.toxics[selectedIndex];
  const originBlocks = useMemo(
    () => data?.ocrBlocks?.length
      ? data.ocrBlocks
      : fallbackOriginBlocks(data?.originContent || ''),
    [data]
  );
  const warningCount = data?.toxics.filter((t) => (t.warnLevel || 0) >= 3).length || 0;
  const reviewCount = data?.toxics.filter((t) => t.warnLevel === 2).length || 0;
  const safeCount = Math.max(originBlocks.length - (data?.toxics.length || 0), 0);
  const filteredBlocks = useMemo(() => {
    if (!data) return [];
    return originBlocks
      .map((block) => {
        const toxicIndex = findToxicForBlock(block, data.toxics);
        const toxic = toxicIndex >= 0 ? data.toxics[toxicIndex] : undefined;
        return { block, toxicIndex, toxic };
      })
      .filter((item) => filterMatches(filter, item.toxic));
  }, [data, filter, originBlocks]);

  async function handleShare() {
    if (!data) return;
    const shareUrl = window.location.href;
    const shareText = `${data.title || '계약서'} 분석 결과: 독소조항 ${data.toxicCount}건`;

    if (navigator.share) {
      await navigator.share({
        title: 'RiskDetector 분석 결과',
        text: shareText,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
  }

  function exportAnalysisText() {
    if (!data) return;
    const content = buildAnalysisExportText(data);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title || 'riskdetector-analysis'}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function selectToxic(index: number, openMobileContext = false) {
    setSelectedIndex(index);
    const isMobileLayout = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
    if (openMobileContext && isMobileLayout) setMobileContextOpen(true);
  }

  if (invalidAccess) {
    return (
      <AppShell>
        <div className="rd-narrow rounded-2xl bg-white p-8 text-center">
          <p className="text-[16px] font-extrabold">잘못된 접근입니다.</p>
          <button type="button" onClick={() => router.push('/upload')} className="rd-btn mt-6">
            다시 업로드하기
          </button>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rd-narrow flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[var(--rd-blue)]" size={34} />
          <p className="mt-4 text-[14px] font-bold text-[var(--rd-ink-2)]">결과 불러오는 중...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="rd-narrow rounded-2xl bg-white p-8 text-center">
          <p className="text-[16px] font-extrabold">{error || '결과가 없습니다.'}</p>
          <button type="button" onClick={() => router.push('/upload')} className="rd-btn mt-6">
            다시 업로드하기
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rd-result-shell">
        <div className="rd-result-grid">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="rd-section-label">
                  IMO.PDF · {new Date(data.createdAt).toLocaleDateString('ko-KR')} · {statusText(data.analysisStatus)}
                </div>
                <h1 className="mt-2 text-[34px] font-extrabold tracking-tight sm:text-[40px]">
                  {data.title || '업로드된 계약서'}
                </h1>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleShare} className="rd-btn rd-btn-ghost">
                  <Share2 size={15} />
                  공유
                </button>
                <button type="button" onClick={exportAnalysisText} className="rd-btn">
                  <Sparkles size={15} />
                  수정안 내보내기
                </button>
              </div>
            </div>

            <section className="mt-8 grid gap-4 sm:grid-cols-4">
              {[
                ['총 조항', originBlocks.length || data.toxicCount, 0],
                ['주의 필요', warningCount, 3],
                ['확인 권장', reviewCount, 2],
                ['안전', safeCount, 1],
              ].map(([label, value, risk]) => (
                <div key={label} className="rd-stat-card">
                  <div className="text-[12px] font-semibold text-[var(--rd-ink-3)]">{label}</div>
                  <div
                    className="mt-2 text-[31px] font-extrabold"
                    style={{ color: risk === 3 ? 'var(--rd-risk-hi)' : risk === 2 ? 'var(--rd-risk-md)' : risk === 1 ? 'var(--rd-risk-lo)' : 'var(--rd-ink)' }}
                  >
                    {String(value)}
                  </div>
                </div>
              ))}
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                ['all', `전체 ${originBlocks.length || data.toxicCount}`],
                ['warning', `주의 ${warningCount}`],
                ['review', `확인 ${reviewCount}`],
                ['safe', `안전 ${safeCount}`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as FilterKey)}
                  className={`rd-filter-tab ${filter === key ? 'is-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {data.riskdetectorCommentary?.overallComment && (
              <section className="rd-summary-strip">
                <Sparkles size={16} className="text-[var(--rd-blue)]" />
                <p>{data.riskdetectorCommentary.overallComment}</p>
              </section>
            )}

            <section className="rd-document-card">
              {filteredBlocks.map(({ block, toxicIndex, toxic }) => (
                <DocumentBlock
                  key={block.id || block.tagIdx}
                  block={block}
                  toxic={toxic}
                  active={selectedIndex !== null && toxicIndex === selectedIndex}
                  onSelect={() => {
                    if (toxicIndex >= 0) selectToxic(toxicIndex, true);
                  }}
                />
              ))}
            </section>
          </div>

          <aside className="rd-context-panel rd-result-context-panel">
            <ClauseContext toxic={selected} advice={data.riskdetectorCommentary?.advice} onClear={() => setSelectedIndex(null)} />
          </aside>
        </div>
      </div>
      {mobileContextOpen && selected && (
        <div className="rd-mobile-sheet-backdrop lg:hidden" onClick={() => setMobileContextOpen(false)}>
          <div className="rd-mobile-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full p-2 text-[var(--rd-ink-3)] hover:bg-[var(--rd-line-2)]"
              onClick={() => setMobileContextOpen(false)}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <ClauseContext toxic={selected} advice={data.riskdetectorCommentary?.advice} onClear={() => setSelectedIndex(null)} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ClauseContext({ toxic, advice, onClear }: { toxic?: Toxic; advice?: string; onClear?: () => void }) {
  if (!toxic) {
    return (
      <div className="rd-context-empty">
        <div className="rd-section-label">컨텍스트</div>
        <h2 className="mt-3 text-[20px] font-extrabold leading-7">원문의 하이라이트를 클릭해보세요</h2>
        <p className="mt-4 text-[13px] font-semibold leading-7 text-[var(--rd-ink-2)]">
          빨강은 주의가 필요한 조항, 노랑은 한번 확인해볼 조항이에요.
        </p>
        <div className="mt-6 rounded-2xl bg-[var(--rd-line-2)] p-5">
          <div className="flex items-center gap-2 text-[13px] font-extrabold">
            <Lightbulb size={16} className="text-[var(--rd-risk-md)]" />
            팁
          </div>
          <p className="mt-3 text-[13px] font-semibold leading-7 text-[var(--rd-ink-2)]">
            분석 결과는 법률 자문이 아닌 참고 자료예요. 중요한 계약은 전문가 상담도 같이 받아보세요.
          </p>
        </div>
      </div>
    );
  }

  const adviceText = firstAdvice(advice) || '불리한 범위와 기준을 구체적으로 줄이고, 상호 협의 조항을 추가하는 방향으로 수정하는 것이 좋습니다.';

  return (
    <div className="rd-context-detail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="rd-section-label">선택된 조항</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RiskTag level={toxic.warnLevel} />
            <span className="text-[12px] font-bold text-[var(--rd-ink-3)]">{toxic.title || '위험 조항'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-1 text-[var(--rd-ink-3)] hover:bg-[var(--rd-line-2)]"
          aria-label="선택 해제"
        >
          <X size={17} />
        </button>
      </div>
      <h2 className="mt-4 text-[22px] font-extrabold leading-8">{toxic.title}</h2>
      {toxic.reason && (
        <p className="mt-4 text-[14px] font-semibold leading-8 text-[var(--rd-ink-2)]">{toxic.reason}</p>
      )}

      {toxic.clause && (
        <div className="mt-6 rounded-2xl bg-[var(--rd-risk-hi-bg)] p-4">
          <div className="text-[12px] font-extrabold tracking-[0.06em] text-[var(--rd-risk-hi)]">BEFORE</div>
          <div className="mt-2 text-[14px] font-bold leading-7">{shortText(toxic.clause, 64)}</div>
        </div>
      )}

      <div className="mt-3 rounded-2xl bg-[var(--rd-blue-soft)] p-4">
        <div className="text-[12px] font-extrabold tracking-[0.06em] text-[var(--rd-blue)]">AFTER</div>
        <div className="mt-2 text-[14px] font-bold leading-7">{shortText(adviceText, 72)}</div>
      </div>

      {toxic.reasonReference && (
        <div className="mt-6">
          <div className="text-[12px] font-extrabold text-[var(--rd-ink-3)]">관련 근거</div>
          <div className="mt-3 rounded-2xl border border-[var(--rd-line)] bg-white p-4">
            <div className="text-[14px] font-extrabold leading-6">{shortText(toxic.reasonReference, 84)}</div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="rd-btn mt-5 w-full"
        onClick={() => navigator.clipboard?.writeText(
          [
            toxic.title,
            toxic.reason ? `위험 이유: ${toxic.reason}` : '',
            toxic.reasonReference ? `근거: ${toxic.reasonReference}` : '',
            adviceText ? `수정 방향: ${adviceText}` : '',
          ].filter(Boolean).join('\n')
        )}
      >
        <Sparkles size={15} />
        상세 보기 · 전체 근거
      </button>
    </div>
  );
}

export default function AnalysisResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--rd-bg)]">로딩 중...</div>}>
      <AnalysisResultContent />
    </Suspense>
  );
}
