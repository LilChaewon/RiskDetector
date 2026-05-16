'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bookmark,
  FileText,
  Home,
  Lightbulb,
  LogIn,
  LogOut,
  Plus,
  User,
} from 'lucide-react';
import AuthChoiceDialog from '@/components/AuthChoiceDialog';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/upload', label: '분석', icon: FileText },
  { href: '/feed', label: '법률팁', icon: Lightbulb },
  { href: '/my', label: '내 정보', icon: User },
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInitialAuth, setShowInitialAuth] = useState(false);

  useEffect(() => {
    const syncLoginState = () => {
      const token = localStorage.getItem('accessToken');
      const loginFlag = localStorage.getItem('isLoggedIn') === 'true';
      const authChoiceSeen = sessionStorage.getItem('rdAuthChoiceSeen') === 'true';
      const shouldAskAuthChoice = !authChoiceSeen && !loginFlag && pathname !== '/login' && pathname !== '/oauth2/callback';

      setIsLoggedIn(loginFlag || Boolean(token && token !== 'guest'));
      setShowInitialAuth(shouldAskAuthChoice);
    };

    syncLoginState();
    window.addEventListener('storage', syncLoginState);
    return () => window.removeEventListener('storage', syncLoginState);
  }, [pathname]);

  function completeInitialAuth() {
    sessionStorage.setItem('rdAuthChoiceSeen', 'true');
    setShowInitialAuth(false);
    setIsLoggedIn(false);
  }

  async function logout() {
    await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch((err) => console.warn('logout cookie cleanup failed:', err));

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    router.push('/login');
  }

  return (
    <div className="rd-shell">
      <aside className="rd-sidebar">
        <Link href="/" className="rd-logo">
          <span>RD</span>
          <span className="rd-logo-dot" />
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rd-nav-item ${isActive(pathname, item.href) ? 'is-active' : ''}`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rd-section-label mt-6 px-3">빠른 실행</div>
        <div className="mt-3 flex flex-col gap-2">
          <Link href="/upload" className="rd-btn w-full">
            <Plus size={15} />
            새 분석
          </Link>
          <Link href="/feed" className="rd-nav-item">
            <Bookmark size={16} />
            북마크
          </Link>
        </div>

        <div className="absolute bottom-5 left-4 right-4 flex flex-col gap-2">
          {isLoggedIn ? (
            <button type="button" onClick={logout} className="rd-nav-item text-left">
              <LogOut size={16} />
              로그아웃
            </button>
          ) : (
            <Link href="/login" className="rd-nav-item">
              <LogIn size={16} />
              로그인
            </Link>
          )}
        </div>
      </aside>

      <main className="rd-main">
        <div className="rd-mobile-top">
          <Link href="/" className="text-[20px] font-extrabold tracking-tight">RD</Link>
          {!pathname.startsWith('/analysis') && !pathname.startsWith('/upload') && (
            <Link href="/upload" className="rd-btn min-h-9 px-3 text-[12px]">
              <Plus size={14} />
              분석
            </Link>
          )}
        </div>
        {children}
      </main>

      <nav className="rd-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? 'is-active' : ''}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showInitialAuth && <AuthChoiceDialog required onComplete={completeInitialAuth} />}
    </div>
  );
}
