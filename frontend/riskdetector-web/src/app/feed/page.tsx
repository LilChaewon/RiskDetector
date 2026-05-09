'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bookmark, BookmarkCheck, Eye, Loader2, Search } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { bookmarkTip, getTips, unbookmarkTip } from '@/api/app';
import type { LegalTip } from '@/types/api';

const categories = ['전체', '임대차', '근로', '계약', '금융', '부동산'];

function FeedContent() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState('전체');
  const [q, setQ] = useState('');
  const [tips, setTips] = useState<LegalTip[]>([]);
  const [preview, setPreview] = useState<LegalTip | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedTipId = searchParams.get('tip');

  useEffect(() => {
    getTips({
      category: active === '전체' ? undefined : active,
      q: q || undefined,
      size: 24,
    })
      .then((page) => setTips(page.content))
      .catch((err) => console.error('tips load failed:', err))
      .finally(() => setLoading(false));
  }, [active, q]);

  const selected = useMemo(
    () => preview || tips.find((tip) => String(tip.id) === selectedTipId) || tips[0],
    [preview, selectedTipId, tips]
  );

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
              {category}
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
              if (selected) setPreview(selected);
              document.getElementById('tip-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="rd-btn rd-btn-white"
          >
            읽기
          </button>
        </section>

        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
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
              <div className="grid gap-3 md:grid-cols-2">
                {tips.map((tip) => (
                  <article key={tip.id} className="rd-card rd-card-hover p-5" onClick={() => setPreview(tip)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rd-pill">#{tip.category.split('/').pop()}</span>
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
                    <h3 className="mt-3 text-[15px] font-extrabold leading-6">{tip.question}</h3>
                    <p className="mt-2 line-clamp-3 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">
                      {tip.answer}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[12px] font-bold text-[var(--rd-ink-3)]">
                      <Eye size={13} />
                      {tip.viewCount.toLocaleString('ko-KR')}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="hidden lg:block">
            <div className="rd-card sticky top-7 p-5">
              <div className="rd-section-label">미리보기</div>
              {selected ? (
                <>
                  <h2 className="mt-3 text-[19px] font-extrabold leading-7">{selected.question}</h2>
                  <p className="mt-3 max-h-[420px] overflow-auto text-[13px] font-medium leading-7 text-[var(--rd-ink-2)]">
                    {selected.answer}
                  </p>
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
              ) : (
                <p className="mt-3 text-[13px] font-medium text-[var(--rd-ink-2)]">팁을 선택하면 자세히 볼 수 있어요.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <FeedContent />
    </Suspense>
  );
}
