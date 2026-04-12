'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuth2CallbackPage() {
    const router = useRouter();

    useEffect(() => {
        async function fetchUserAndRedirect() {
            try {
                // 1. 백엔드에서 유저 정보 조회 (HttpOnly 쿠키 기반 인증)
                const res = await fetch('http://localhost:8080/api/auth/me', {
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('isLoggedIn', 'true'); // 토큰 대신 단순 마커 저장
                    if (data.email) localStorage.setItem('userEmail', data.email);
                    if (data.name)  localStorage.setItem('userName', data.name);
                    if (data.picture) localStorage.setItem('userPicture', data.picture);
                }
            } catch (err) {
                console.error('로그인 처리 중 오류:', err);
            }

            router.replace('/upload');
        }

        fetchUserAndRedirect();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0FDF4] gap-4">
            <div className="w-10 h-10 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#059669] font-medium text-sm">로그인 처리 중...</p>
        </div>
    );
}
