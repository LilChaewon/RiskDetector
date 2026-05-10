'use client';

import { useRouter } from 'next/navigation';
import { LogIn, UserRound } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export default function LoginPage() {
  const router = useRouter();

  function handleGoogleLogin() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  }

  async function handleGuestLogin() {
    await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch((err) => console.warn('guest mode cookie cleanup failed:', err));

    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPicture');
    localStorage.removeItem('userEmail');
    localStorage.setItem('accessToken', 'guest');
    localStorage.setItem('userName', '게스트');
    localStorage.setItem('isLoggedIn', 'false');
    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', `guest-${crypto.randomUUID?.() || Date.now().toString(36)}`);
    }
    router.replace('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--rd-bg)] p-6">
      <section className="w-full max-w-[430px] rounded-[24px] border border-[var(--rd-line)] bg-white p-8 shadow-[var(--rd-shadow)]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d1524] text-white">
            RD
          </div>
          <h1 className="mt-4 text-[26px] font-extrabold tracking-tight">RiskDetector</h1>
          <p className="mt-2 text-[14px] font-semibold leading-6 text-[var(--rd-ink-2)]">
            계약서 속 위험 조항을 AI가 찾아드립니다.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--rd-line)] bg-white px-4 py-3 text-[14px] font-extrabold text-[var(--rd-ink)] hover:bg-[var(--rd-paper-2)]"
          >
            <LogIn size={18} />
            Google로 로그인
          </button>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--rd-line)] bg-[var(--rd-paper-2)] px-4 py-3 text-[14px] font-extrabold text-[var(--rd-ink-2)] hover:text-[var(--rd-ink)]"
          >
            <UserRound size={18} />
            게스트로 둘러보기
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] font-semibold leading-5 text-[var(--rd-ink-3)]">
          게스트 모드는 이 브라우저의 설치형 앱 안에서 분석 기록을 이어서 보여줍니다.
        </p>
      </section>
    </main>
  );
}
