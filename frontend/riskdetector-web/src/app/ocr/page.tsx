'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { Check, Edit3, FileText, Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getOcrResult, startAnalysis, updateOcrBlock } from '@/api/contract';
import type { ContractOcrHtml } from '@/types/api';

function OcrContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId') || '';
  const router = useRouter();

  const [ocrResult, setOcrResult] = useState<ContractOcrHtml | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    getOcrResult(contractId)
      .then(setOcrResult)
      .catch((err) => console.error('OCR 결과 조회 중 오류:', err))
      .finally(() => setLoading(false));
  }, [contractId]);

  function handleEdit(id: string, currentText: string) {
    setEditingId(id);
    setEditText(currentText.replace(/<[^>]+>/g, ''));
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      await updateOcrBlock(contractId, id, editText);
      setEditingId(null);
      setOcrResult(await getOcrResult(contractId));
    } finally {
      setSaving(false);
    }
  }

  async function handleStartAnalysis() {
    setStarting(true);
    try {
      const res = await startAnalysis(contractId);
      router.push(`/analysis?contractId=${contractId}&analysisId=${res.analysisId}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <AppShell>
      <div className="rd-narrow">
        <div className="rd-section-label">OCR 확인</div>
        <h1 className="mt-1 text-[29px] font-extrabold tracking-tight">계약서 내용을 확인해주세요</h1>
        <p className="mt-2 text-[14px] font-medium leading-6 text-[var(--rd-ink-2)]">
          잘못 읽힌 문장은 클릭해서 수정할 수 있어요. 확인이 끝나면 AI 분석을 시작합니다.
        </p>

        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-white p-10">
            <Loader2 className="animate-spin text-[var(--rd-blue)]" size={30} />
            <p className="mt-4 text-[14px] font-bold text-[var(--rd-ink-2)]">OCR 결과 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#0d1524] p-5 text-white">
              <FileText size={22} className="text-[#7ca4ec]" />
              <div>
                <div className="text-[15px] font-extrabold">{ocrResult?.title || '업로드된 계약서'}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-white/55">
                  {ocrResult?.htmlArray.length || 0}개 블록 인식됨
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {ocrResult?.htmlArray.map((item) => (
                <article
                  key={item.id}
                  className="rd-card rd-card-hover p-4"
                  onClick={() => handleEdit(item.id, item.content)}
                >
                  {editingId === item.id ? (
                    <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-28 w-full rounded-xl border border-[var(--rd-line)] bg-white px-4 py-3 text-[14px] leading-6 outline-none focus:border-[var(--rd-blue)]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="rd-btn rd-btn-ghost">
                          취소
                        </button>
                        <button type="button" onClick={() => handleSave(item.id)} className="rd-btn" disabled={saving}>
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Edit3 size={16} className="mt-1 shrink-0 text-[var(--rd-ink-3)]" />
                      <div
                        className="rd-doc min-w-0"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={starting || !ocrResult}
              className="rd-btn mt-6 min-h-14 w-full text-[16px]"
            >
              {starting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              AI 독소조항 분석 시작
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function OcrPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">로딩 중...</div>}>
      <OcrContent />
    </Suspense>
  );
}
