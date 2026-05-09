'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Bookmark,
  ChevronRight,
  FileText,
  HelpCircle,
  Mail,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RiskTag from '@/components/RiskTag';
import { getDashboard, getTips } from '@/api/app';
import type { DashboardResponse, LegalTip } from '@/types/api';

type SectionKey = 'history' | 'bookmarks' | 'notifications' | 'support' | 'terms';

const menuItems: Array<{ key: SectionKey; label: string; icon: LucideIcon }> = [
  { key: 'history', label: '내 분석 기록', icon: FileText },
  { key: 'bookmarks', label: '저장한 팁', icon: Bookmark },
  { key: 'notifications', label: '알림 설정', icon: Bell },
  { key: 'support', label: '고객센터', icon: HelpCircle },
  { key: 'terms', label: '이용약관 · 개인정보', icon: ShieldCheck },
];

function getSavedNotice(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(key);
  return saved === null ? fallback : saved === 'true';
}

export default function MyPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [bookmarkedTips, setBookmarkedTips] = useState<LegalTip[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>('history');
  const [analysisNotice, setAnalysisNotice] = useState(() => getSavedNotice('rdAnalysisNotice', true));
  const [tipNotice, setTipNotice] = useState(() => getSavedNotice('rdTipNotice', false));

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((err) => console.error('profile dashboard load failed:', err));

    getTips({ size: 100 })
      .then((page) => setBookmarkedTips(page.content.filter((tip) => tip.bookmarked)))
      .catch((err) => console.error('bookmarked tips load failed:', err));
  }, []);

  const user = dashboard?.user;
  const stats = dashboard?.stats;
  const statCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: '분석한 계약', value: stats?.totalContracts ?? 0, icon: FileText },
    { label: '저장한 팁', value: stats?.bookmarkCount ?? 0, icon: Bookmark },
    { label: '주의 계약', value: stats?.highRiskContracts ?? 0, icon: ShieldCheck },
  ];
  const recentContracts = dashboard?.recentContracts ?? [];

  const sectionTitle = useMemo(() => {
    return menuItems.find((item) => item.key === activeSection)?.label ?? '내 분석 기록';
  }, [activeSection]);

  function updateNotice(kind: 'analysis' | 'tip', checked: boolean) {
    if (kind === 'analysis') {
      setAnalysisNotice(checked);
      localStorage.setItem('rdAnalysisNotice', String(checked));
      return;
    }
    setTipNotice(checked);
    localStorage.setItem('rdTipNotice', String(checked));
  }

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

        <section className="rd-card mt-5 divide-y divide-[var(--rd-line-2)] p-1">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`flex w-full items-center justify-between px-4 py-4 text-left ${
                activeSection === key ? 'text-[var(--rd-blue)]' : ''
              }`}
            >
              <span className="flex items-center gap-3 text-[14px] font-bold">
                <Icon size={17} />
                {label}
              </span>
              <ChevronRight size={16} className="text-[var(--rd-ink-3)]" />
            </button>
          ))}
        </section>

        <section className="rd-card mt-4 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-extrabold">{sectionTitle}</h2>
            {activeSection === 'history' && (
              <Link href="/upload" className="rd-btn min-h-9 px-3 text-[12px]">
                새 분석
              </Link>
            )}
          </div>

          {activeSection === 'history' && (
            <div className="grid gap-3">
              {recentContracts.length === 0 ? (
                <EmptyState
                  title="아직 분석한 계약서가 없어요"
                  description="계약서를 올리면 분석 결과가 이곳에 쌓입니다."
                  actionHref="/upload"
                  actionLabel="계약서 올리기"
                />
              ) : (
                recentContracts.map((contract) => (
                  <Link
                    key={contract.contractId}
                    href={
                      contract.analysisId
                        ? `/analysis/result?contractId=${contract.contractId}&analysisId=${contract.analysisId}`
                        : `/ocr?contractId=${contract.contractId}`
                    }
                    className="rounded-xl border border-[var(--rd-line)] p-4 transition hover:border-[var(--rd-blue)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14px] font-extrabold">{contract.title || '업로드된 계약서'}</span>
                      <RiskTag level={contract.maxWarnLevel || 1} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[12px] font-semibold text-[var(--rd-ink-3)]">
                      <span>{new Date(contract.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>독소 {contract.toxicCount}건</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeSection === 'bookmarks' && (
            <div className="grid gap-3">
              {bookmarkedTips.length === 0 ? (
                <EmptyState
                  title="저장한 법률 팁이 없어요"
                  description="법률 팁에서 북마크를 누르면 이곳에서 다시 볼 수 있습니다."
                  actionHref="/feed"
                  actionLabel="법률 팁 보기"
                />
              ) : (
                bookmarkedTips.map((tip) => (
                  <Link key={tip.id} href={`/feed?tip=${tip.id}`} className="rounded-xl border border-[var(--rd-line)] p-4 transition hover:border-[var(--rd-blue)]">
                    <div className="text-[12px] font-bold text-[var(--rd-blue)]">{tip.category}</div>
                    <div className="mt-2 text-[14px] font-extrabold leading-6">{tip.question}</div>
                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">{tip.answer}</p>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="grid gap-3">
              <NoticeToggle
                title="분석 완료 알림"
                description="분석 결과가 준비되면 앱 안에서 확인할 수 있게 표시합니다."
                checked={analysisNotice}
                onChange={(checked) => updateNotice('analysis', checked)}
              />
              <NoticeToggle
                title="법률 팁 추천"
                description="새로 볼 만한 Q&A 추천을 켜거나 끕니다."
                checked={tipNotice}
                onChange={(checked) => updateNotice('tip', checked)}
              />
            </div>
          )}

          {activeSection === 'support' && (
            <div className="rounded-xl border border-[var(--rd-line)] p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 text-[var(--rd-blue)]" size={18} />
                <div>
                  <div className="text-[14px] font-extrabold">문의가 필요하면 이메일로 보내주세요</div>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">
                    오류 화면, 계약서 분석 단계, 로그인 문제처럼 재현 정보가 있으면 더 빠르게 확인할 수 있어요.
                  </p>
                  <a href="mailto:support@riskdetector.app" className="rd-btn mt-4 min-h-9 px-3 text-[12px]">
                    메일 보내기
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'terms' && (
            <div className="grid gap-3 text-[13px] font-medium leading-6 text-[var(--rd-ink-2)]">
              <p className="rounded-xl border border-[var(--rd-line)] p-4">
                RiskDetector는 계약서 OCR과 AI 분석을 제공하며, 분석 결과는 법률 자문을 대체하지 않습니다.
              </p>
              <p className="rounded-xl border border-[var(--rd-line)] p-4">
                업로드된 계약서는 분석 목적에 필요한 범위에서 처리됩니다. 개인정보가 포함된 영역은 업로드 전에 마스킹하는 것을 권장합니다.
              </p>
            </div>
          )}
        </section>

        <div className="mt-6 text-center text-[11px] font-bold text-[var(--rd-ink-3)]">RD · PWA v1.0.0</div>
      </div>
    </AppShell>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--rd-line)] p-5 text-center">
      <div className="text-[14px] font-extrabold">{title}</div>
      <p className="mt-2 text-[13px] font-medium text-[var(--rd-ink-2)]">{description}</p>
      <Link href={actionHref} className="rd-btn mt-4 min-h-9 px-3 text-[12px]">
        {actionLabel}
      </Link>
    </div>
  );
}

function NoticeToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--rd-line)] p-4">
      <span>
        <span className="block text-[14px] font-extrabold">{title}</span>
        <span className="mt-1 block text-[12px] font-medium leading-5 text-[var(--rd-ink-2)]">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[var(--rd-blue)]"
      />
    </label>
  );
}
