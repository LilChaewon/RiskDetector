'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Sparkles, Upload } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RiskTag from '@/components/RiskTag';
import { getDashboard } from '@/api/app';
import type { DashboardResponse } from '@/types/api';

const emptyDashboard: DashboardResponse = {
  user: { name: '게스트', email: null, picture: null, guest: true },
  stats: { totalContracts: 0, completedAnalyses: 0, bookmarkCount: 0, highRiskContracts: 0 },
  recentContracts: [],
  featuredTips: [],
};

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((err) => console.error('dashboard load failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const name = dashboard.user.name || '게스트';

  return (
    <AppShell>
      <div className="rd-main-inner">
        <div className="rd-section-label">대시보드</div>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight text-[var(--rd-ink)] sm:text-[34px]">
          안녕하세요, {name}님
        </h1>
        <p className="mt-2 text-[14px] font-medium text-[var(--rd-ink-2)]">
          오늘도 계약서 똑똑하게 읽어봐요.
        </p>

        <section className="rd-hero mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] text-[#7ca4ec]">
              계약서, 이제 혼자 보지 마세요
            </div>
            <h2 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight sm:text-[28px]">
              PDF · 이미지 · 사진을 올리면<br className="hidden sm:block" />
              독소조항을 바로 찾아드려요
            </h2>
            <p className="mt-3 text-[13px] font-medium leading-6 text-[#aab7c7]">
              임대차 · 근로 · 용역 계약서를 OCR로 읽고, AI가 위험 조항과 수정 제안을 정리합니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/upload" className="rd-btn rd-btn-white min-h-12 px-5 text-[15px]">
                <Upload size={17} />
                계약서 불러오기
              </Link>
              <Link href="/feed" className="rd-btn min-h-12 bg-white/10 px-5 text-[15px] hover:bg-white/15">
                법률 팁 보기
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-right font-mono text-[12px] text-[#aab7c7]">
            <div>분석 {dashboard.stats.completedAnalyses}건 완료</div>
            <div className="mt-1">북마크 {dashboard.stats.bookmarkCount}개 저장</div>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          {[
            ['전체 계약', dashboard.stats.totalContracts],
            ['분석 완료', dashboard.stats.completedAnalyses],
            ['주의 계약', dashboard.stats.highRiskContracts],
            ['북마크', dashboard.stats.bookmarkCount],
          ].map(([label, value]) => (
            <div key={label} className="rd-card p-4">
              <div className="text-[12px] font-semibold text-[var(--rd-ink-3)]">{label}</div>
              <div className="mt-1 text-[25px] font-extrabold text-[var(--rd-ink)]">{String(value)}</div>
            </div>
          ))}
        </section>

        <div className="mt-9 flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold">최근 분석</h2>
          <Link href="/upload" className="flex items-center gap-1 text-[13px] font-bold text-[var(--rd-blue)]">
            새 분석 <ArrowRight size={14} />
          </Link>
        </div>

        <section className="mt-3 grid gap-3 lg:grid-cols-3">
          {loading && [0, 1, 2].map((i) => <div key={i} className="rd-card h-32 animate-pulse bg-white" />)}
          {!loading && dashboard.recentContracts.length === 0 && (
            <Link href="/upload" className="rd-card rd-card-hover flex min-h-36 items-center gap-4 p-5 lg:col-span-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]">
                <FileText size={22} />
              </div>
              <div>
                <div className="font-extrabold">아직 분석한 계약서가 없어요</div>
                <div className="mt-1 text-[13px] font-medium text-[var(--rd-ink-2)]">
                  첫 계약서를 올리면 이곳에서 결과를 다시 볼 수 있어요.
                </div>
              </div>
            </Link>
          )}
          {dashboard.recentContracts.map((contract) => (
            <Link
              key={contract.contractId}
              href={contract.analysisId ? `/analysis/result?contractId=${contract.contractId}&analysisId=${contract.analysisId}` : `/ocr?contractId=${contract.contractId}`}
              className="rd-card rd-card-hover p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rd-pill">{contract.contractType === 'EMPLOYMENT' ? '근로' : '임대차'}</span>
                <RiskTag level={contract.maxWarnLevel || 1} />
              </div>
              <div className="mt-4 text-[16px] font-extrabold">{contract.title || '업로드된 계약서'}</div>
              <div className="mt-3 flex items-center justify-between text-[12px] font-semibold text-[var(--rd-ink-3)]">
                <span>{new Date(contract.createdAt).toLocaleDateString('ko-KR')}</span>
                <span>독소 {contract.toxicCount}건</span>
              </div>
            </Link>
          ))}
        </section>

        <div className="mt-9 flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold">오늘의 법률 팁</h2>
          <Link href="/feed" className="flex items-center gap-1 text-[13px] font-bold text-[var(--rd-blue)]">
            전체 팁 <ArrowRight size={14} />
          </Link>
        </div>
        <section className="mt-3 grid gap-3 lg:grid-cols-2">
          {(dashboard.featuredTips.length ? dashboard.featuredTips.slice(0, 2) : []).map((tip) => (
            <Link key={tip.id} href={`/feed?tip=${tip.id}`} className="rd-card rd-card-hover p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--rd-blue)]">
                <Sparkles size={14} />
                {tip.category}
              </div>
              <div className="mt-2 text-[16px] font-extrabold leading-6">{tip.question}</div>
              <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">
                {tip.answer}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
