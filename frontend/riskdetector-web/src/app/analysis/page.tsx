'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AnalysisLoadingPage from './loading-page';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId') || '';
  const analysisId = searchParams.get('analysisId') || '';

  if (!contractId || !analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--rd-bg)]">
        잘못된 접근입니다.
      </div>
    );
  }

  return <AnalysisLoadingPage contractId={contractId} analysisId={analysisId} />;
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
