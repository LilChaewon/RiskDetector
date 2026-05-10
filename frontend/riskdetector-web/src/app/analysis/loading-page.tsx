'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAnalysis } from '@/api/contract';

interface Props {
  contractId: string;
  analysisId: string;
}

const waitingTips = [
  {
    title: '“수리비는 전부 세입자 부담”이라고 썼다면?',
    body: '민법 제623조상 임대인은 목적물을 사용·수익에 필요한 상태로 유지할 의무가 있어요. 구조적 하자나 노후에 의한 수리비 전가는 무효로 볼 여지가 있습니다.',
  },
  {
    title: '계약기간이 지나치게 길다면?',
    body: '전속계약이나 장기 용역계약은 기간, 갱신, 해지 조건이 균형 있게 적혀 있는지 확인해야 해요. 일방에게만 과도하게 묶이는 조항은 위험 신호입니다.',
  },
  {
    title: '손해배상액이 너무 크다면?',
    body: '위약금이나 손해배상 예정액이 실제 손해보다 과도하면 감액되거나 불공정 조항으로 볼 여지가 있어요. 산정 기준이 구체적인지 확인해보세요.',
  },
  {
    title: '권리를 전부 넘긴다고 되어 있다면?',
    body: '저작권, 초상권, 2차적 저작물 작성권처럼 핵심 권리를 포괄 양도하는 조항은 범위와 기간, 대가가 명확해야 합니다.',
  },
  {
    title: '“언제든 해지 가능”이 한쪽에게만 있다면?',
    body: '해지권이 한쪽에게만 유리하게 적혀 있으면 계약 균형이 무너질 수 있어요. 상대방의 해지 사유와 통지 기간도 함께 확인해야 합니다.',
  },
  {
    title: '자동 갱신 조항은 조용히 넘어가기 쉬워요',
    body: '계약 만료 전에 별도 통지가 없으면 자동 연장되는 조항은 해지 가능 기간과 통지 방식이 명확해야 안전합니다.',
  },
  {
    title: '비밀유지 조항에도 범위가 필요해요',
    body: '비밀유지 의무는 대상 정보, 기간, 예외 사유가 구체적이어야 해요. 지나치게 넓은 비밀유지 조항은 이후 활동을 묶을 수 있습니다.',
  },
  {
    title: '정산 기준이 흐리면 분쟁이 생기기 쉬워요',
    body: '수익 배분은 총매출인지 순수익인지, 비용 공제 항목이 무엇인지 명확해야 합니다. “회사 기준에 따른다”만 있으면 위험할 수 있어요.',
  },
  {
    title: '관할 법원 조항도 확인해보세요',
    body: '분쟁이 생겼을 때 어디 법원에서 다툴지 정하는 조항입니다. 지나치게 먼 곳으로만 정해져 있으면 실제 대응이 어려워질 수 있어요.',
  },
  {
    title: '동의 없이 권리 양도 가능하다는 문구는 조심',
    body: '계약상 지위나 권리를 제3자에게 넘길 수 있다는 조항은 상대방 동의 요건이 있는지 확인해야 합니다.',
  },
  {
    title: '수정·보완은 말보다 기록이 중요해요',
    body: '계약 내용을 나중에 바꿀 수 있다면 구두 합의가 아니라 서면 또는 전자문서로 남기도록 되어 있는지 확인하세요.',
  },
];

function randomTipIndex(except?: number) {
  if (waitingTips.length <= 1) return 0;
  let next = Math.floor(Math.random() * waitingTips.length);
  while (next === except) {
    next = Math.floor(Math.random() * waitingTips.length);
  }
  return next;
}

export default function AnalysisLoadingPage({ contractId, analysisId }: Props) {
  const router = useRouter();
  const [dots, setDots] = useState('.');
  const [tipIndex, setTipIndex] = useState(() => randomTipIndex());

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'));
    }, 500);

    const tipInterval = setInterval(() => {
      setTipIndex((index) => randomTipIndex(index));
    }, 4500);

    const pollInterval = setInterval(async () => {
      try {
        const result = await fetchAnalysis(contractId, analysisId);
        if (result.analysisStatus === 'completed') {
          clearInterval(pollInterval);
          clearInterval(dotInterval);
          clearInterval(tipInterval);
          router.replace(`/analysis/result?contractId=${contractId}&analysisId=${analysisId}`);
        } else if (result.analysisStatus === 'failed') {
          clearInterval(pollInterval);
          clearInterval(dotInterval);
          clearInterval(tipInterval);
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
      clearInterval(tipInterval);
    };
  }, [contractId, analysisId, router]);

  const tip = waitingTips[tipIndex];

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
            {tip.title}
          </div>
          <p className="mt-3 text-[13px] font-medium leading-7 text-[#c6d1df]">
            {tip.body}
          </p>
        </div>
      </div>
    </main>
  );
}
