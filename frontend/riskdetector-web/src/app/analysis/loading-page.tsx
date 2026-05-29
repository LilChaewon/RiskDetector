'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchAnalysis } from '@/api/contract';
import ArdiWaitingTip from '@/components/ArdiWaitingTip';

interface Props {
  contractId: string;
  analysisId: string;
}

export default function AnalysisLoadingPage({ contractId, analysisId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await fetchAnalysis(contractId, analysisId);
        if (result.analysisStatus === 'completed') {
          clearInterval(pollInterval);
          router.replace(`/analysis/result?contractId=${contractId}&analysisId=${analysisId}`);
        } else if (result.analysisStatus === 'failed') {
          clearInterval(pollInterval);
          alert('분석에 실패했습니다. 다시 시도해주세요.');
          router.back();
        }
      } catch (err) {
        console.error('polling 오류:', err);
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [contractId, analysisId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--rd-bg)] px-6 py-16 text-[var(--rd-ink)]">
      <div className="w-full max-w-[540px]">
        <div className="ardi-loader">
          <div className="ardi-loader-halo" />
          <span className="ardi-loader-spark s1" />
          <span className="ardi-loader-spark s2" />
          <span className="ardi-loader-spark s3" />
          <span className="ardi-loader-spark s4" />
          <span className="ardi-loader-spark s5" />
          <span className="ardi-loader-spark s6" />
          <div className="ardi-loader-mascot">
            <Image
              src="/ardi/ardi-hero.png"
              alt="아르디가 조항을 살펴보고 있어요"
              width={168}
              height={200}
              priority
            />
          </div>
        </div>
        <div className="mt-4 text-center">
          <h1 className="inline-flex items-center text-[24px] font-extrabold tracking-tight">
            아르디가 조항을 읽고 있어요
            <span className="ardi-loader-dots" aria-hidden>
              <span /><span /><span />
            </span>
          </h1>
          <p className="mt-2 text-[14px] font-medium leading-6 text-[var(--rd-ink-2)]">
            계약서의 독소조항과 법률 근거를 꼼꼼히 찾고 있어요.
          </p>
        </div>
        <ArdiWaitingTip className="mt-10" />
      </div>
    </main>
  );
}
