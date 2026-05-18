'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bookmark, BookmarkCheck, Eye, Loader2, Search, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { bookmarkTip, getTipCategories, getTips, unbookmarkTip } from '@/api/app';
import type { LegalTip } from '@/types/api';

function FeedContent() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState('전체');
  const [categories, setCategories] = useState<string[]>(['전체']);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [tips, setTips] = useState<LegalTip[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileAnswerOpen, setMobileAnswerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const answerRef = useRef<HTMLDivElement | null>(null);

  const selectedTipId = searchParams.get('tip');
  const routeSelectedId = selectedTipId ? Number(selectedTipId) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    getTipCategories()
      .then((items) => {
        setCategories(['전체', ...items.filter(Boolean)]);
      })
      .catch((err) => console.error('tip categories load failed:', err));
  }, []);

  useEffect(() => {
    getTips({
      category: active === '전체' ? undefined : active,
      q: debouncedQ || undefined,
      size: 24,
    })
      .then((page) => setTips(page.content))
      .catch((err) => console.error('tips load failed:', err))
      .finally(() => setLoading(false));
  }, [active, debouncedQ]);

  const selected = useMemo(
    () => tips.find((tip) => tip.id === selectedId)
      || tips.find((tip) => tip.id === routeSelectedId)
      || tips[0],
    [routeSelectedId, selectedId, tips]
  );

  function answerSummary(answer: string) {
    return answer.replace(/\s+/g, ' ').trim().slice(0, 84);
  }

  function categoryLabel(category: string) {
    return category.split('/').pop() || category;
  }

  function tipSummary(tip: LegalTip) {
    return (tip.summary || tip.answer || '').trim();
  }

  function summaryParagraphs(summary: string) {
    return summary
      .replace(/\s+/g, ' ')
      .split(/\n+|(?<=다\.|요\.|니다\.|습니다\.)\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function selectTip(tip: LegalTip, forceScroll = false) {
    setSelectedId(tip.id);
    const mobileLayout = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (mobileLayout) {
      setMobileAnswerOpen(true);
      return;
    }
    if (forceScroll) {
      window.requestAnimationFrame(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  async function toggleBookmark(tip: LegalTip) {
    const updated = tip.bookmarked ? await unbookmarkTip(tip.id) : await bookmarkTip(tip.id);
    setTips((items) => items.map((item) => (item.id === tip.id ? updated : item)));
  }

  return (
    <AppShell>
      <div className="rd-main-inner">
        <div className="rd-section-label">법률 팁</div>
        <h1 className="mt-1 text-[29px] font-extrabold tracking-tight">사회초년생의 법률 Q&A</h1>

        <div className="rd-card mt-5 flex items-center gap-3 px-4 py-3">
          <Search size={17} className="text-[var(--rd-ink-3)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="궁금한 상황을 검색해보세요"
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:text-[var(--rd-ink-3)]"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`rd-pill shrink-0 ${active === category ? 'is-active' : ''}`}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        <section className="rd-hero mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] text-[#7ca4ec]">이번 주 추천</div>
            <h2 className="mt-2 text-[21px] font-extrabold leading-tight">
              계약 전 5분만 투자해도 피할 수 있는 위험 조항
            </h2>
            <p className="mt-2 text-[13px] font-medium text-[#aab7c7]">EasyLaw Q&A를 기반으로 상황별 핵심만 정리했어요.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const recommended = tips[0] || selected;
              if (recommended) selectTip(recommended, true);
            }}
            className="rd-btn rd-btn-white"
          >
            추천 질문 보기
          </button>
        </section>

        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(320px,520px)_minmax(0,1fr)]">
          <section id="tip-list">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold">많이 본 질문</h2>
              <span className="text-[13px] font-bold text-[var(--rd-ink-3)]">{tips.length}개</span>
            </div>
            {loading ? (
              <div className="flex min-h-56 items-center justify-center rounded-2xl bg-white">
                <Loader2 className="animate-spin text-[var(--rd-blue)]" />
              </div>
            ) : (
              <div className="grid gap-3">
                {tips.map((tip) => (
                  <article
                    key={tip.id}
                    className={`rd-card rd-card-hover cursor-pointer p-4 transition ${selected?.id === tip.id ? 'border-[var(--rd-blue)] bg-[var(--rd-blue-soft)] shadow-[0_0_0_3px_rgba(27,100,218,0.12)]' : ''}`}
                    onClick={() => selectTip(tip)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rd-pill">#{categoryLabel(tip.category)}</span>
                        <h3 className="mt-3 text-[15px] font-extrabold leading-6">{tip.question}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleBookmark(tip);
                        }}
                        className="rounded-lg p-1.5 text-[var(--rd-blue)] hover:bg-[var(--rd-blue-soft)]"
                        aria-label={tip.bookmarked ? '북마크 해제' : '북마크'}
                      >
                        {tip.bookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                      </button>
                    </div>
                    <p className="mt-2 line-clamp-1 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
                      {answerSummary(tipSummary(tip))}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[12px] font-bold text-[var(--rd-ink-3)]">
                      <span className="flex items-center gap-1">
                        <Eye size={13} />
                        {tip.viewCount.toLocaleString('ko-KR')}
                      </span>
                      <span>{selected?.id === tip.id ? '선택됨' : '답변 보기'}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside ref={answerRef} className="hidden lg:block">
            <div className="rd-card sticky top-7 max-h-[calc(100vh-56px)] overflow-y-auto p-7">
              <TipAnswerReader
                selected={selected}
                categoryLabel={categoryLabel}
                tipSummary={tipSummary}
                summaryParagraphs={summaryParagraphs}
              />
            </div>
          </aside>
        </div>
      </div>

      {mobileAnswerOpen && selected && (
        <div className="rd-mobile-sheet-backdrop lg:hidden" onClick={() => setMobileAnswerOpen(false)}>
          <div className="rd-mobile-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full p-2 text-[var(--rd-ink-3)] hover:bg-[var(--rd-line-2)]"
              onClick={() => setMobileAnswerOpen(false)}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <TipAnswerReader
              selected={selected}
              categoryLabel={categoryLabel}
              tipSummary={tipSummary}
              summaryParagraphs={summaryParagraphs}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function TipAnswerReader({
  selected,
  categoryLabel,
  tipSummary,
  summaryParagraphs,
}: {
  selected?: LegalTip;
  categoryLabel: (category: string) => string;
  tipSummary: (tip: LegalTip) => string;
  summaryParagraphs: (summary: string) => string[];
}) {
  if (!selected) {
    return <p className="text-[13px] font-medium text-[var(--rd-ink-2)]">질문을 선택하면 답변을 크게 볼 수 있어요.</p>;
  }

  return (
    <>
      <div className="rd-section-label">답변 보기</div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rd-pill">#{categoryLabel(selected.category)}</span>
        <span className="flex items-center gap-1 text-[12px] font-bold text-[var(--rd-ink-3)]">
          <Eye size={13} />
          {selected.viewCount.toLocaleString('ko-KR')}
        </span>
      </div>
      <h2 className="mt-4 text-[23px] font-extrabold leading-9">{selected.question}</h2>
      <div className="mt-5 rounded-2xl bg-[var(--rd-line-2)] p-5">
        <div className="text-[12px] font-extrabold tracking-[0.08em] text-[var(--rd-blue)]">핵심 요약</div>
        <div className="mt-3 space-y-3 text-[15px] font-semibold leading-8 text-[var(--rd-ink-2)]">
          {summaryParagraphs(tipSummary(selected)).map((paragraph, index) => (
            <p key={`${selected.id}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>
      {selected.sourceUrl && (
        <a
          href={selected.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rd-btn rd-btn-ghost mt-4 w-full"
        >
          원문 보기
        </a>
      )}
    </>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <FeedContent />
    </Suspense>
  );
}
