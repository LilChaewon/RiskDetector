'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuth2CallbackPage() {
    const router = useRouter();

    useEffect(() => {
        async function fetchUserAndRedirect() {
            try {
                // 1. URL에서 토큰 추출
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                if (token) {
                    localStorage.setItem('accessToken', token);
                }

                // 2. 백엔드에서 유저 정보 조회 (쿠키 혹은 헤더 토큰 사용)
                const res = await fetch('http://localhost:8080/api/auth/me', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
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
