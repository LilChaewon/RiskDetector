'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAnalysis } from '@/api/contract';
import type { ContractAnalysisDTO } from '@/types/api';
import AppHeader from '@/components/AppHeader';

function warnLevelMeta(level: number) {
  if (level >= 3) {
    return {
      label: '위험',
      badgeClass: 'bg-[#FEE2E2] text-[#DC2626]',
      borderClass: 'border-l-4 border-[#DC2626]',
      dotClass: 'bg-[#DC2626]',
    };
  }
  if (level === 2) {
    return {
      label: '주의',
      badgeClass: 'bg-[#FEF3C7] text-[#D97706]',
      borderClass: 'border-l-4 border-[#D97706]',
      dotClass: 'bg-[#D97706]',
    };
  }
  return {
    label: '낮음',
    badgeClass: 'bg-[#DCFCE7] text-[#059669]',
    borderClass: 'border-l-4 border-[#059669]',
    dotClass: 'bg-[#059669]',
  };
}

function overallRiskMeta(toxics: ContractAnalysisDTO['toxics']) {
  const max = toxics.reduce((acc, t) => Math.max(acc, t.warnLevel || 0), 0);
  if (max >= 3) {
    return { label: '위험', sub: '독소조항이 다수 발견되었습니다', color: '#DC2626', bg: '#FEE2E2' };
  }
  if (max === 2) {
    return { label: '주의', sub: '검토가 필요한 조항이 있습니다', color: '#D97706', bg: '#FEF3C7' };
  }
  if (toxics.length === 0) {
    return { label: '안전', sub: '특별한 위험 조항은 발견되지 않았습니다', color: '#059669', bg: '#DCFCE7' };
  }
  return { label: '양호', sub: '경미한 주의사항만 있습니다', color: '#059669', bg: '#DCFCE7' };
}

function AnalysisResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contractId = searchParams.get('contractId') || '';
  const analysisId = searchParams.get('analysisId') || '';

  const [data, setData] = useState<ContractAnalysisDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractId || !analysisId) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    fetchAnalysis(contractId, analysisId)
      .then(res => {
        if (res.analysisStatus !== 'completed') {
          setError('아직 분석이 완료되지 않았습니다.');
          return;
        }
        setData(res);
      })
      .catch(err => {
        console.error('분석 결과 조회 오류:', err);
        setError('분석 결과를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [contractId, analysisId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F4F6]">
        <AppHeader title="분석 결과" />
        <div className="pt-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[#E5E8EB] border-t-[#3182F6] rounded-full animate-spin" />
          <p className="text-[#8B95A1] text-[15px]">결과 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#F2F4F6]">
        <AppHeader title="분석 결과" onBack={() => router.back()} />
        <div className="pt-24 px-6 max-w-[600px] mx-auto text-center">
          <p className="text-[#191F28] text-[16px] font-semibold mb-2">{error || '결과가 없습니다.'}</p>
          <button
            onClick={() => router.push('/upload')}
            className="mt-6 bg-[#059669] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#047857] transition-colors"
          >
            다시 업로드하기
          </button>
        </div>
      </main>
    );
  }

  const overall = overallRiskMeta(data.toxics);
  const commentary = data.riskdetectorCommentary;

  return (
    <main className="min-h-screen bg-[#F2F4F6] pb-12">
      <AppHeader title="분석 결과" onBack={() => router.push('/upload')} />

      <div className="pt-20 max-w-[600px] mx-auto px-4 space-y-4">
        {/* 종합 위험도 카드 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-[#8B95A1] font-medium">종합 위험도</span>
            <span
              className="px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ backgroundColor: overall.bg, color: overall.color }}
            >
              {overall.label}
            </span>
          </div>
          <h2 className="text-[22px] font-bold text-[#191F28] tracking-tight mb-1">
            독소조항 {data.toxicCount}건 발견
          </h2>
          <p className="text-[14px] text-[#505967]">{overall.sub}</p>

          {data.summary && (
            <div className="mt-5 pt-5 border-t border-[#F1F3F5]">
              <p className="text-[13px] text-[#8B95A1] font-medium mb-2">요약</p>
              <p className="text-[14px] text-[#333D4B] leading-relaxed">{data.summary}</p>
            </div>
          )}
        </section>

        {/* AI 코멘터리 */}
        {commentary && (commentary.overallComment || commentary.warningComment || commentary.advice) && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#3182F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-[#191F28]">AI 종합 의견</h3>
            </div>

            {commentary.overallComment && (
              <div className="mb-4">
                <p className="text-[12px] text-[#8B95A1] font-semibold mb-1.5">총평</p>
                <p className="text-[14px] text-[#333D4B] leading-relaxed">{commentary.overallComment}</p>
              </div>
            )}

            {commentary.warningComment && (
              <div className="mb-4 p-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]">
                <p className="text-[12px] text-[#C2410C] font-semibold mb-1.5">⚠️ 주의사항</p>
                <p className="text-[14px] text-[#7C2D12] leading-relaxed">{commentary.warningComment}</p>
              </div>
            )}

            {commentary.advice && (
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                <p className="text-[12px] text-[#15803D] font-semibold mb-1.5">💡 조언</p>
                <p className="text-[14px] text-[#14532D] leading-relaxed">{commentary.advice}</p>
              </div>
            )}
          </section>
        )}

        {/* 독소조항 리스트 */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-[16px] font-bold text-[#191F28]">독소조항 상세</h3>
            <span className="text-[13px] text-[#8B95A1] font-medium">{data.toxics.length}건</span>
          </div>

          {data.toxics.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-[15px] text-[#505967]">발견된 독소조항이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.toxics.map((toxic, idx) => {
                const meta = warnLevelMeta(toxic.warnLevel);
                return (
                  <article
                    key={idx}
                    className={`bg-white rounded-2xl p-5 shadow-sm ${meta.borderClass}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="text-[15px] font-bold text-[#191F28] leading-snug flex-1">
                        {toxic.title || `독소조항 ${idx + 1}`}
                      </h4>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>

                    {toxic.clause && (
                      <div className="mb-4 p-3 rounded-lg bg-[#F9FAFB] border border-[#F1F3F5]">
                        <p className="text-[11px] text-[#8B95A1] font-semibold mb-1">원문</p>
                        <p className="text-[13px] text-[#333D4B] leading-relaxed whitespace-pre-wrap">
                          {toxic.clause}
                        </p>
                      </div>
                    )}

                    {toxic.reason && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          <p className="text-[12px] text-[#505967] font-semibold">왜 위험한가요?</p>
                        </div>
                        <p className="text-[13.5px] text-[#333D4B] leading-relaxed pl-3">
                          {toxic.reason}
                        </p>
                      </div>
                    )}

                    {toxic.reasonReference && (
                      <div className="mt-3 pt-3 border-t border-[#F1F3F5]">
                        <p className="text-[11px] text-[#8B95A1] font-semibold mb-1">법률 근거</p>
                        <p className="text-[12.5px] text-[#3182F6] leading-relaxed">
                          {toxic.reasonReference}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => router.push('/upload')}
            className="flex-1 bg-white border border-[#E5E8EB] text-[#333D4B] py-4 rounded-xl font-semibold text-[15px] hover:bg-gray-50 transition-colors"
          >
            다른 계약서 분석
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-[#059669] text-white py-4 rounded-xl font-semibold text-[15px] hover:bg-[#047857] transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AnalysisResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
          로딩 중...
        </div>
      }
    >
      <AnalysisResultContent />
    </Suspense>
  );
}
