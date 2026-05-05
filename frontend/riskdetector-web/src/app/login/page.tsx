'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    function handleGoogleLogin() {
        // OAuth 엔드포인트는 /api 하위가 아니라 백엔드 루트(/oauth2/...)에 있다.
        // 로컬 개발 fallback으로만 localhost:8080 사용.
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        window.location.href = `${backendUrl}/oauth2/authorization/google`;
    }

    function handleGuestLogin() {
        // 이전 구글 계정 정보 완전 초기화
        localStorage.removeItem('userPicture');
        localStorage.removeItem('userEmail');
        // 게스트 정보 설정
        localStorage.setItem('accessToken', 'guest');
        localStorage.setItem('userName', '게스트');
        router.replace('/upload');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0FDF4]">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[400px] flex flex-col gap-4">

                {/* 로고 */}
                <div className="text-center mb-2">
                    <h1 className="text-2xl font-bold text-[#059669]">RiskDetector</h1>
                    <p className="text-sm text-gray-400 mt-1">계약서 속 위험 조항을 AI가 찾아드립니다</p>
                </div>

                {/* Google 로그인 */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 border border-gray-200
                               rounded-xl py-3 text-sm font-medium text-gray-700
                               hover:bg-gray-50 transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                    </svg>
                    Google로 로그인
                </button>

                {/* 구분선 */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300">또는</span>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* 게스트 모드 */}
                <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-200
                               rounded-xl py-3 text-sm font-medium text-gray-400
                               hover:bg-gray-50 hover:text-gray-500 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    게스트로 둘러보기
                </button>

                <p className="text-center text-[11px] text-gray-300 mt-1">
                    게스트 모드는 일부 기능이 제한될 수 있어요
                </p>
            </div>
        </div>
    );
}