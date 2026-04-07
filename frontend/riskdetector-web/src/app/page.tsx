'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.replace('/upload');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-[#F0FDF4]">
      <h1 className="text-4xl font-bold text-[#059669]">
        RiskDetector
      </h1>
      <p className="text-gray-500 text-center text-sm max-w-md">
        계약서 속 위험 조항을 AI가 찾아드립니다
      </p>

      {loggedIn ? (
        <div className="flex flex-col gap-3 w-full max-w-[720px]">
          <button
            onClick={() => router.push('/upload')}
            className="w-full bg-[#059669] text-white py-3 rounded-xl font-medium
                       hover:bg-[#047857] transition-colors"
          >
            계약서 분석하기
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setLoggedIn(false);
            }}
            className="w-full py-3 rounded-xl font-medium border border-[#059669]
                       text-[#059669] hover:bg-[#F0FDF4] transition-colors bg-white"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="bg-[#059669] text-white px-8 py-3 rounded-xl font-medium
                     hover:bg-[#047857] transition-colors"
        >
          시작하기
        </button>
      )}
    </div>
  );
}
