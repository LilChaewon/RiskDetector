'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOcrResult, updateOcrBlock, startAnalysis } from '@/api/contract';
import type { ContractOcrHtml } from '@/types/api';
import DOMPurify from 'dompurify';

function OcrContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId')!;
  const router = useRouter();

  const [ocrResult, setOcrResult] = useState<ContractOcrHtml | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      getOcrResult(contractId)
        .then(res => {
          console.log('OCR 결과 공식 응답:', res);
          setOcrResult(res);
        })
        .catch(err => console.error('OCR 결과 조회 중 오류:', err))
        .finally(() => setLoading(false));
    }
  }, [contractId]);

  async function handleEdit(id: string, currentText: string) {
    setEditingId(id);
    // HTML 태그 제거해서 텍스트만 편집
    setEditText(currentText.replace(/<[^>]+>/g, ''));
  }

  async function handleSave(id: string) {
    await updateOcrBlock(contractId, id, editText);
    setEditingId(null);
    // 새로고침해서 반영된 내용 표시
    const updated = await getOcrResult(contractId);
    setOcrResult(updated);
  }

  async function handleStartAnalysis() {
    const res = await startAnalysis(contractId);
    router.push(`/analysis?contractId=${contractId}&analysisId=${res.analysisId}`);
  }

  if (loading) return <div className="p-6 text-center">OCR 결과 불러오는 중...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4 text-gray-800">계약서 내용 확인</h1>
      <p className="text-sm text-gray-500 mb-6">
        잘못 읽힌 부분을 클릭해서 수정하세요.
      </p>

      <div className="space-y-4 mb-8">
        {ocrResult?.htmlArray.map(item => (
          <div
            key={item.id}
            className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-sm"
            onClick={() => handleEdit(item.id, item.content)}
          >
            {editingId === item.id ? (
              <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleSave(item.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleStartAnalysis}
        className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] shadow-lg transition-transform active:scale-[0.98]"
      >
        AI 독소조항 분석 시작
      </button>
    </div>
  );
}

export default function OcrPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">로딩 중...</div>}>
      <OcrContent />
    </Suspense>
  );
}
