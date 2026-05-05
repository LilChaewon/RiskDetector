'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
    onBack?: () => void;  // 뒤로가기 버튼 (없으면 안 보임)
    title?: string;
}

export default function AppHeader({ onBack, title }: AppHeaderProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userPicture, setUserPicture] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUserEmail(localStorage.getItem('userEmail'));
        setUserName(localStorage.getItem('userName'));
        setUserPicture(localStorage.getItem('userPicture'));
    }, []);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleLogout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPicture');
        // 백엔드 쿠키도 삭제 (HttpOnly라 직접 못 지우므로 백엔드에 로그아웃 요청)
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
        fetch(`${apiBase}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        }).catch(() => {}).finally(() => {
            window.location.href = '/login';
        });
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4">
            <div className="w-full max-w-[600px] mx-auto flex items-center justify-between">

                {/* 왼쪽: 뒤로가기 or 로고 */}
                <div className="flex items-center gap-2">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#505967]"
                            aria-label="뒤로가기"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M14 18L8 12L14 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    ) : (
                        <span className="font-bold text-[#059669] text-[17px] tracking-tight">RiskDetector</span>
                    )}
                    {title && (
                        <span className="text-[15px] font-semibold text-[#191F28]">{title}</span>
                    )}
                </div>

                {/* 오른쪽: 햄버거 메뉴 */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="메뉴"
                    >
                        <span className="block w-[18px] h-[2px] bg-[#333D4B] rounded-full" />
                        <span className="block w-[18px] h-[2px] bg-[#333D4B] rounded-full" />
                        <span className="block w-[18px] h-[2px] bg-[#333D4B] rounded-full" />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {menuOpen && (
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">

                            {/* 프로필 영역 */}
                            <div className="px-4 py-3 border-b border-gray-100 bg-[#F8FAF9]">
                                <div className="flex items-center gap-3">
                                    {userPicture ? (
                                        <img
                                            src={userPicture}
                                            alt="프로필"
                                            className="w-8 h-8 rounded-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-[#059669] rounded-full flex items-center justify-center">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                                <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-semibold text-[#191F28]">
                                            {userName || '내 계정'}
                                        </p>
                                        <p className="text-[11px] text-[#8B95A1] truncate max-w-[140px]">
                                            {userEmail || '로그인됨'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 메뉴 항목들 */}
                            <button
                                onClick={() => { setMenuOpen(false); router.push('/upload'); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#333D4B] hover:bg-gray-50 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                홈으로
                            </button>

                            <button
                                onClick={() => { setMenuOpen(false); handleLogout(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#DC2626] hover:bg-red-50 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
