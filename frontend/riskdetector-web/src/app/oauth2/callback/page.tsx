'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuth2CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function fetchUserAndRedirect() {
            try {
                // 1. URL 파라미터로 토큰이 전달된 경우 localStorage에 저장
                const tokenFromUrl = searchParams.get('token');
                if (tokenFromUrl) {
                    localStorage.setItem('accessToken', tokenFromUrl);
                    localStorage.setItem('isLoggedIn', 'true');
                }

                // 2. 백엔드에서 유저 정보 조회
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
                const res = await fetch(`${apiBase}/auth/me`, {
                    credentials: 'include',
                    headers: tokenFromUrl
                        ? { Authorization: `Bearer ${tokenFromUrl}` }
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

            router.replace('/upload');
        }

        fetchUserAndRedirect();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0FDF4] gap-4">
            <div className="w-10 h-10 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#059669] font-medium text-sm">로그인 처리 중...</p>
        </div>
    );
}
