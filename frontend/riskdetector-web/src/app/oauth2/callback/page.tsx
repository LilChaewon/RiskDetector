'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requireSupabaseBrowserClient } from '@/lib/supabase';

// useSearchParams()를 사용하는 컴포넌트는 반드시 Suspense로 감싸야 함
function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function fetchUserAndRedirect() {
            try {
                const supabase = requireSupabaseBrowserClient();
                const code = searchParams.get('code');
                if (code) {
                    await supabase.auth.exchangeCodeForSession(code);
                }

                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;
                if (token) {
                    localStorage.setItem('accessToken', token);
                    if (data.session?.refresh_token) {
                        localStorage.setItem('refreshToken', data.session.refresh_token);
                    }
                    localStorage.setItem('isLoggedIn', 'true');
                }

                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
                const res = await fetch(`${apiBase}/auth/me`, {
                    credentials: 'include',
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                });

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('isLoggedIn', 'true');
                    if (data.email)   localStorage.setItem('userEmail', data.email);
                    if (data.name)    localStorage.setItem('userName', data.name);
                    if (data.picture) localStorage.setItem('userPicture', data.picture);
                }
            } catch (err) {
                console.error('로그인 처리 중 오류:', err);
            }

            router.replace('/');
        }

        fetchUserAndRedirect();
    }, [router, searchParams]);

    return null;
}

const Spinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--rd-bg)] gap-4">
        <div className="w-10 h-10 border-4 border-[var(--rd-line)] border-t-[var(--rd-blue)] rounded-full animate-spin" />
        <p className="text-[var(--rd-blue)] font-bold text-sm">로그인 처리 중...</p>
    </div>
);

export default function OAuth2CallbackPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <CallbackHandler />
            <Spinner />
        </Suspense>
    );
}
