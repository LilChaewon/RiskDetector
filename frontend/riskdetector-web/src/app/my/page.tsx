'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bookmark, ChevronRight, FileText, Moon, User, type LucideIcon } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getDashboard } from '@/api/app';
import type { DashboardResponse } from '@/types/api';

export default function MyPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((err) => console.error('profile dashboard load failed:', err));
  }, []);

  const user = dashboard?.user;
  const stats = dashboard?.stats;
  const statCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: '분석한 계약', value: stats?.totalContracts ?? 0, icon: FileText },
    { label: '저장한 팁', value: stats?.bookmarkCount ?? 0, icon: Bookmark },
    { label: '주의 계약', value: stats?.highRiskContracts ?? 0, icon: Moon },
  ];

  return (
    <AppShell>
      <div className="rd-narrow">
        <div className="rd-section-label">내 정보</div>
        <h1 className="mt-1 text-[29px] font-extrabold tracking-tight">계정 · 설정</h1>

        <section className="rd-card mt-5 flex items-center gap-4 p-5">
          {user?.picture ? (
            <Image
              src={user.picture}
              alt="프로필"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]">
              <User size={25} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-extrabold">{user?.name || '게스트'}님</div>
            <div className="mt-1 truncate text-[13px] font-semibold text-[var(--rd-ink-2)]">
              {user?.email || '로그인 없이 둘러보는 중'}
            </div>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-3 gap-3">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rd-card p-4 text-center">
              <Icon className="mx-auto text-[var(--rd-blue)]" size={18} />
              <div className="mt-2 text-[22px] font-extrabold">{value}</div>
              <div className="mt-1 text-[11px] font-bold text-[var(--rd-ink-3)]">{label}</div>
            </div>
          ))}
        </section>

        <section className="rd-hero mt-4 flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] text-[#7ca4ec]">PRO 멤버십</div>
            <div className="mt-1 text-[16px] font-extrabold">무제한 분석 · 전문가 연결</div>
          </div>
          <button type="button" className="rd-btn rd-btn-white">시작하기</button>
        </section>

        <section className="rd-card mt-5 divide-y divide-[var(--rd-line-2)] p-1">
          {['내 분석 기록', '저장한 팁', '전문가 상담 내역', '알림 설정', '고객센터', '이용약관 · 개인정보'].map((item) => (
            <button key={item} type="button" className="flex w-full items-center justify-between px-4 py-4 text-left">
              <span className="text-[14px] font-bold">{item}</span>
              <ChevronRight size={16} className="text-[var(--rd-ink-3)]" />
            </button>
          ))}
        </section>

        <div className="mt-6 text-center text-[11px] font-bold text-[var(--rd-ink-3)]">RD · PWA v1.0.0</div>
      </div>
    </AppShell>
  );
}
