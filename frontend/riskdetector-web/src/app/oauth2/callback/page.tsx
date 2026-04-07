'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuth2CallbackPage() {
    const router = useRouter();

    useEffect(() => {
        async function fetchUserAndRedirect() {
            try {
                // 백엔드가 auth_token HttpOnly 쿠키를 심어준 상태에서 유저 정보 조회
                const res = await fetch('http://localhost:8080/api/auth/me', {
                    credentials: 'include', // 쿠키 자동 포함
                });

                if (res.ok) {
                    const data = await res.json();
                    // 로그인 마커 + 사용자 정보 저장
                    localStorage.setItem('accessToken', 'cookie-auth');
                    if (data.email) localStorage.setItem('userEmail', data.email);
                    if (data.name)  localStorage.setItem('userName', data.name);
                    if (data.picture) localStorage.setItem('userPicture', data.picture);
                } else {
                    // 실패해도 일단 로그인 마커만 남김
                    localStorage.setItem('accessToken', 'cookie-auth');
                }
            } catch {
                localStorage.setItem('accessToken', 'cookie-auth');
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
