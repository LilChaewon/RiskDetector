'use client';

import { useSearchParams } from 'next/navigation';
import AnalysisLoadingPage from './loading-page';
import AppHeader from '@/components/AppHeader';

export default function AnalysisPage() {
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
