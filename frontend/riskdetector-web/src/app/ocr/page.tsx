'use client';

import { useRouter } from 'next/navigation';

export default function OcrPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">OCR 텍스트 인식 & 수정</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        현재 페이지는 임시 결과 확인 화면입니다. 실제 OCR 텍스트 비교 컴포넌트가 추후 연결됩니다.
      </p>

      <button
        onClick={() => {
          alert('AI 분석 시작!');
          router.push('/');
        }}
        className="w-full max-w-sm bg-[#059669] text-white py-4 rounded-xl font-bold hover:bg-[#047857] shadow-md transition-colors"
      >
        ✨ AI 분석 시작 (홈으로 이동)
      </button>
    </div>
  );
}
