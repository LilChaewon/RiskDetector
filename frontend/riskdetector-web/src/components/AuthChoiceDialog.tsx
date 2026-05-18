'use client';

import { LogIn, UserRound, X } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export default function AuthChoiceDialog({
  onComplete,
  onClose,
  required = false,
}: {
  onComplete?: () => void;
  onClose?: () => void;
  required?: boolean;
}) {
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
    onComplete?.();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm">
      <section className="relative w-full max-w-[430px] rounded-[24px] border border-[var(--rd-line)] bg-white p-8 shadow-[var(--rd-shadow)]">
        {!required && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-[var(--rd-ink-3)] hover:bg-[var(--rd-line-2)]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        )}

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d1524] text-white">
            RD
          </div>
          <h2 className="mt-4 text-[24px] font-extrabold tracking-tight">어떻게 시작할까요?</h2>
          <p className="mt-2 text-[14px] font-semibold leading-6 text-[var(--rd-ink-2)]">
            Google로 로그인하거나 게스트로 바로 둘러볼 수 있어요.
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
    </div>
  );
}
