'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAnalysis } from '@/api/contract';

interface Props {
  contractId: string;
  analysisId: string;
}

export default function AnalysisLoadingPage({ contractId, analysisId }: Props) {
  const router = useRouter();
  const [dots, setDots] = useState('.');

  useEffect(() => {
    // 점점점 애니메이션
    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.');
    }, 500);

    // 3초마다 분석 완료 확인
    const pollInterval = setInterval(async () => {
      try {
        const result = await fetchAnalysis(contractId, analysisId);
        // 백엔드가 ResponseDTO 없이 DTO를 바로 반환하므로 .data 없이 접근
        if (result.analysisStatus === 'completed') {
          clearInterval(pollInterval);
          clearInterval(dotInterval);
          router.replace(`/analysis/result?contractId=${contractId}&analysisId=${analysisId}`);
        } else if (result.analysisStatus === 'failed') {
          clearInterval(pollInterval);
          clearInterval(dotInterval);
          alert('분석에 실패했습니다. 다시 시도해주세요.');
          router.back();
        }
      } catch (err) {
        console.error('polling 오류:', err);
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(dotInterval);
    };
  }, [contractId, analysisId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#F2F4F6]">
      {/* 로딩 스피너: 토스 스타일의 부드러운 애니메이션 */}
      <div className="w-16 h-16 border-4 border-[#E5E8EB] border-t-[#3182F6] rounded-full animate-spin" />
      <div className="text-center">
        <h2 className="text-[22px] font-bold text-[#191F28] mb-2 tracking-tight">
          AI가 분석 중입니다{dots}
        </h2>
        <p className="text-[#8B95A1] font-medium text-[15px]">
          계약서의 독소조항을 꼼꼼히 찾고 있어요.<br />
          잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}
