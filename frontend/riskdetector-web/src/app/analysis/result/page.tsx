'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DOMPurify from 'dompurify';
import { Copy, FileText, Loader2, Share2, Sparkles } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RiskTag, { riskMeta } from '@/components/RiskTag';
import { fetchAnalysis } from '@/api/contract';
import type { ContractAnalysisDTO } from '@/types/api';

type Toxic = ContractAnalysisDTO['toxics'][number];

function overallLevel(toxics: Toxic[]) {
  return toxics.reduce((acc, toxic) => Math.max(acc, toxic.warnLevel || 0), 0);
}

function statusText(status: string) {
  if (status === 'completed') return '분석 완료';
  if (status === 'in_progress') return '분석 중';
  return '분석 실패';
}

function buildRevisionText(data: ContractAnalysisDTO) {
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
    '[조항별 수정 참고]',
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

function AnalysisResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contractId = searchParams.get('contractId') || '';
  const analysisId = searchParams.get('analysisId') || '';

  const [data, setData] = useState<ContractAnalysisDTO | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  const selected = data?.toxics[selectedIndex];
  const level = useMemo(() => overallLevel(data?.toxics || []), [data]);

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

  function exportRevisionText() {
    if (!data) return;
    const content = buildRevisionText(data);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title || 'riskdetector-analysis'}-revision.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
      <div className="rd-main-inner">
        <div className="rd-context-grid">
          <div className="min-w-0">
            <div className="rd-section-label">
              {data.title || '업로드된 계약서'} · {statusText(data.analysisStatus)}
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[29px] font-extrabold tracking-tight sm:text-[32px]">
                분석 결과
              </h1>
              <div className="flex gap-2">
                <button type="button" onClick={handleShare} className="rd-btn rd-btn-ghost">
                  <Share2 size={15} />
                  공유
                </button>
                <button type="button" onClick={exportRevisionText} className="rd-btn">
                  <Sparkles size={15} />
                  수정안 내보내기
                </button>
              </div>
            </div>

            <section className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                ['총 조항', data.originContent ? 'OCR' : '0', 0],
                ['독소조항', data.toxicCount, level],
                ['주의 필요', data.toxics.filter((t) => (t.warnLevel || 0) >= 3).length, 3],
                ['확인 권장', data.toxics.filter((t) => t.warnLevel === 2).length, 2],
              ].map(([label, value, risk]) => (
                <div key={label} className="rd-card p-4">
                  <div className="text-[12px] font-semibold text-[var(--rd-ink-3)]">{label}</div>
                  <div
                    className="mt-1 text-[25px] font-extrabold"
                    style={{ color: risk === 3 ? 'var(--rd-risk-hi)' : risk === 2 ? 'var(--rd-risk-md)' : 'var(--rd-ink)' }}
                  >
                    {String(value)}
                  </div>
                </div>
              ))}
            </section>

            {data.riskdetectorCommentary && (
              <section className="rd-card mt-4 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--rd-blue)]" />
                  <h2 className="text-[16px] font-extrabold">AI 종합 의견</h2>
                  <RiskTag level={level || 1} />
                </div>
                {data.riskdetectorCommentary.overallComment && (
                  <p className="mt-3 text-[14px] font-medium leading-7 text-[var(--rd-ink-2)]">
                    {data.riskdetectorCommentary.overallComment}
                  </p>
                )}
                {data.riskdetectorCommentary.warningComment && (
                  <div className="mt-4 rounded-xl bg-[var(--rd-risk-md-bg)] p-4 text-[13px] font-bold leading-6 text-[var(--rd-risk-md)]">
                    {data.riskdetectorCommentary.warningComment}
                  </div>
                )}
                {data.riskdetectorCommentary.advice && (
                  <div className="mt-3 rounded-xl bg-[var(--rd-blue-soft)] p-4 text-[13px] font-bold leading-6 text-[var(--rd-blue)]">
                    {data.riskdetectorCommentary.advice}
                  </div>
                )}
              </section>
            )}

            <section className="rd-card mt-4 p-5">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[var(--rd-ink-3)]" />
                <h2 className="text-[16px] font-extrabold">원문</h2>
              </div>
              <div
                className="rd-doc mt-4 max-h-[520px] overflow-auto rounded-xl bg-[var(--rd-paper-2)] p-5"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.originContent || '') }}
              />
            </section>

            <section className="mt-6">
              <h2 className="text-[17px] font-extrabold">조항별 분석</h2>
              <div className="mt-3 space-y-3">
                {data.toxics.length === 0 ? (
                  <div className="rd-card p-8 text-center text-[14px] font-bold text-[var(--rd-ink-2)]">
                    발견된 독소조항이 없습니다.
                  </div>
                ) : (
                  data.toxics.map((toxic, index) => {
                    const meta = riskMeta(toxic.warnLevel);
                    return (
                      <button
                        key={`${toxic.title}-${index}`}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`rd-card rd-card-hover w-full p-5 text-left ${
                          selectedIndex === index ? 'border-[var(--rd-blue)]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-[var(--rd-ink-3)]">
                              tag #{toxic.sourceContractTagIdx ?? '-'}
                            </div>
                            <div className="mt-1 text-[15px] font-extrabold leading-6">
                              {toxic.title || `독소조항 ${index + 1}`}
                            </div>
                          </div>
                          <span className={`rd-risk-tag ${meta.className}`}>{meta.label}</span>
                        </div>
                        {toxic.clause && (
                          <p className="mt-3 rounded-xl bg-[var(--rd-paper-2)] p-3 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">
                            {toxic.clause}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <aside className="rd-context-panel">
            <ClauseContext toxic={selected} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function ClauseContext({ toxic }: { toxic?: Toxic }) {
  if (!toxic) {
    return (
      <div className="rd-card p-5">
        <div className="rd-section-label">컨텍스트</div>
        <div className="mt-2 text-[15px] font-extrabold">조항을 선택해보세요</div>
        <p className="mt-2 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">
          왼쪽의 독소조항을 선택하면 위험 이유와 근거를 바로 볼 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="rd-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="rd-section-label">선택된 조항</div>
        <RiskTag level={toxic.warnLevel} />
      </div>
      <h2 className="mt-3 text-[20px] font-extrabold leading-7">{toxic.title}</h2>
      {toxic.reason && (
        <p className="mt-3 text-[13px] font-medium leading-7 text-[var(--rd-ink-2)]">{toxic.reason}</p>
      )}
      {toxic.clause && (
        <div className="mt-4 rounded-xl bg-[var(--rd-risk-hi-bg)] p-4">
          <div className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--rd-risk-hi)]">원문</div>
          <div className="mt-2 text-[13px] font-bold leading-6">{toxic.clause}</div>
        </div>
      )}
      {toxic.reasonReference && (
        <div className="mt-3 rounded-xl bg-[var(--rd-blue-soft)] p-4">
          <div className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--rd-blue)]">법률 근거</div>
          <div className="mt-2 text-[13px] font-bold leading-6">{toxic.reasonReference}</div>
        </div>
      )}
      <button
        type="button"
        className="rd-btn mt-4 w-full"
        onClick={() => navigator.clipboard?.writeText(toxic.reasonReference || toxic.reason || toxic.clause || '')}
      >
        <Copy size={15} />
        근거 복사
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
