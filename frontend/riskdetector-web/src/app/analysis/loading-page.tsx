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
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'));
    }, 500);

    const pollInterval = setInterval(async () => {
      try {
        const result = await fetchAnalysis(contractId, analysisId);
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
    <main className="flex min-h-screen items-center justify-center bg-[#0d1524] px-6 py-16 text-white">
      <div className="w-full max-w-[540px]">
        <div className="mx-auto h-20 w-20 rounded-full border-[3px] border-white/10 border-t-[#3b7bf0] animate-spin" />
        <div className="mt-8 text-center">
          <h1 className="text-[24px] font-extrabold tracking-tight">조항을 읽고 있어요{dots}</h1>
          <p className="mt-2 text-[14px] font-medium leading-6 text-white/55">
            계약서의 독소조항과 법률 근거를 꼼꼼히 찾고 있어요.
          </p>
        </div>
        <div className="rd-hero mt-10 bg-white/5 p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7ca4ec]">기다리는 동안</div>
          <div className="mt-2 text-[18px] font-extrabold leading-7">
            “수리비는 전부 세입자 부담”이라고 썼다면?
          </div>
          <p className="mt-3 text-[13px] font-medium leading-7 text-[#c6d1df]">
            민법 제623조상 임대인은 목적물을 사용·수익에 필요한 상태로 유지할 의무가 있어요.
            구조적 하자나 노후에 의한 수리비 전가는 무효로 볼 여지가 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}
