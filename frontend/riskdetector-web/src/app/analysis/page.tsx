--Active: 1776052593594@@127.0.0.1@5432
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AnalysisLoadingPage from './loading-page';
import AppHeader from '@/components/AppHeader';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId') || '';
  const analysisId = searchParams.get('analysisId') || '';

  if (!contractId || !analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        잘못된 접근입니다.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F4F6]">
      <AppHeader title="AI 독소조항 분석" />
      <AnalysisLoadingPage contractId={contractId} analysisId={analysisId} />
    </main>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
