'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronRight, FileText, Shield, UploadCloud } from 'lucide-react';
import AppShell from '@/components/AppShell';
import MaskingCanvas from '@/components/MaskingCanvas';
import { uploadOCR } from '@/api/contract';

type ContractType = 'RENTAL' | 'EMPLOYMENT';
type Step = 'select-type' | 'upload' | 'masking' | 'uploading';
type PreparedFile = File | null;

const contractTypes: Array<{
  type: ContractType;
  title: string;
  desc: string;
  accent: string;
}> = [
  { type: 'RENTAL', title: '임대차 계약서', desc: '전세, 월세, 상가 임대차', accent: '#1b64da' },
  { type: 'EMPLOYMENT', title: '근로 계약서', desc: '정규직, 계약직, 아르바이트', accent: '#e0930f' },
];

export default function UploadPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select-type');
  const [contractType, setContractType] = useState<ContractType>('RENTAL');
  const [files, setFiles] = useState<File[]>([]);
  const [preparedFiles, setPreparedFiles] = useState<PreparedFile[]>([]);
  const [currentMaskingIdx, setCurrentMaskingIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function beginUpload(type: ContractType) {
    setContractType(type);
    setStep('upload');
    setError(null);
  }

  function acceptFiles(selected: File[]) {
    const supported = selected.filter(isSupportedFile);
    if (supported.length === 0) {
      setError('JPG, PNG, HEIC 이미지 또는 PDF 파일을 올려주세요.');
      return;
    }

    const firstImageIndex = supported.findIndex(isImageFile);
    setFiles(supported);
    setPreparedFiles(supported.map((file) => (isImageFile(file) ? null : file)));
    setCurrentMaskingIdx(firstImageIndex);
    setError(null);

    if (firstImageIndex === -1) {
      handleUpload(supported);
      return;
    }

    setStep('masking');
  }

  function nextImageIndex(fromIndex: number, list = files) {
    for (let i = fromIndex + 1; i < list.length; i += 1) {
      if (isImageFile(list[i])) return i;
    }
    return -1;
  }

  function handleMaskingComplete(maskedFile: File) {
    const updated = [...preparedFiles];
    updated[currentMaskingIdx] = maskedFile;
    setPreparedFiles(updated);

    const nextIndex = nextImageIndex(currentMaskingIdx);
    if (nextIndex >= 0) {
      setCurrentMaskingIdx(nextIndex);
      return;
    }

    const uploadTargets = updated.filter((file): file is File => Boolean(file));
    handleUpload(uploadTargets);
  }

  async function handleUpload(uploadTargets: File[]) {
    if (uploadTargets.length === 0) {
      setError('업로드할 파일을 찾지 못했습니다. 다시 선택해주세요.');
      setStep('upload');
      return;
    }

    setStep('uploading');
    setError(null);
    try {
      const result = await uploadOCR(uploadTargets, contractType);
      if (result.ocrStatus === 'success' || result.ocrStatus === 'partial_success') {
        router.push(`/ocr?contractId=${result.contractId}`);
        return;
      }
      setError('OCR 처리에 실패했습니다. 다시 시도해주세요.');
      setStep('upload');
    } catch (err) {
      console.error('업로드 실패:', err);
      setError('업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setStep('upload');
    }
  }

  if (step === 'masking') {
    return (
      <main className="min-h-screen bg-[#0d1524] p-4 text-white sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[680px] flex-col">
          <div className="flex items-center justify-between py-2">
            <button type="button" onClick={() => setStep('upload')} className="text-[15px] font-bold text-white/90">
              이전으로
            </button>
            <div className="rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-extrabold">
              {files.slice(0, currentMaskingIdx + 1).filter(isImageFile).length}
              <span className="text-white/45"> / {files.filter(isImageFile).length}</span>
            </div>
          </div>
          <div className="mt-8">
            <h1 className="text-[27px] font-extrabold tracking-tight">개인정보 지우기</h1>
            <p className="mt-2 text-[15px] font-medium text-white/55">
              주민번호 등 민감한 정보를 손가락이나 마우스로 가려주세요.
            </p>
          </div>
          <div className="mt-8 flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-2xl">
            <MaskingCanvas
              imageFile={files[currentMaskingIdx]}
              onMaskingComplete={handleMaskingComplete}
            />
          </div>
        </div>
      </main>
    );
  }

  if (step === 'uploading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1524] p-6 text-white">
        <div className="w-full max-w-[460px] text-center">
          <div className="mx-auto h-20 w-20 rounded-full border-4 border-white/10 border-t-[#3b7bf0] animate-spin" />
          <h1 className="mt-8 text-[23px] font-extrabold tracking-tight">계약서를 읽고 있어요</h1>
          <p className="mt-2 text-[14px] font-medium text-white/55">OCR 분석을 준비하는 중입니다.</p>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="rd-narrow">
        {step === 'select-type' ? (
          <>
            <div className="rd-section-label">새 분석</div>
            <h1 className="mt-1 text-[29px] font-extrabold tracking-tight">어떤 계약서인가요?</h1>
            <p className="mt-2 text-[14px] font-medium text-[var(--rd-ink-2)]">
              계약 유형을 고르면 분석 기준과 법률팁이 더 정확해져요.
            </p>
            <div className="mt-8 grid gap-3">
              {contractTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => beginUpload(item.type)}
                  className="rd-card rd-card-hover flex items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: item.accent }}
                    >
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="text-[17px] font-extrabold">{item.title}</div>
                      <div className="mt-1 text-[13px] font-semibold text-[var(--rd-ink-2)]">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[var(--rd-ink-3)]" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="rd-section-label">계약서 업로드</div>
            <h1 className="mt-1 text-[29px] font-extrabold tracking-tight">계약서를 올려주세요</h1>
            <p className="mt-2 text-[14px] font-medium text-[var(--rd-ink-2)]">
              PDF 파일 또는 전체 페이지가 잘 보이게 찍은 이미지를 여러 장 올릴 수 있어요.
            </p>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                acceptFiles(Array.from(e.dataTransfer.files));
              }}
              className={`mt-8 flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-[var(--rd-blue)] bg-[var(--rd-blue-soft)]'
                  : 'border-[var(--rd-line)] bg-[var(--rd-paper-2)] hover:border-[var(--rd-blue)]'
              }`}
            >
              <UploadCloud size={38} className="text-[var(--rd-ink-3)]" strokeWidth={1.6} />
              <div className="mt-4 text-[18px] font-extrabold">
                {isDragging ? '여기에 놓아주세요' : 'PDF · 사진 선택 또는 드래그'}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[var(--rd-ink-2)]">PDF · JPG · PNG · HEIC · 여러 파일 가능</div>
              <span className="rd-btn mt-5">파일 선택</span>
              <input
                type="file"
                accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
                multiple
                className="hidden"
                onChange={(e) => acceptFiles(Array.from(e.target.files || []))}
              />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rd-card rd-card-hover flex items-center gap-3 p-4 text-left sm:hidden"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]">
                  <Camera size={20} />
                </div>
                <div>
                  <div className="text-[14px] font-extrabold">모바일 촬영</div>
                  <div className="text-[12px] font-semibold text-[var(--rd-ink-2)]">휴대폰에서 바로 찍기</div>
                </div>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => acceptFiles(Array.from(e.target.files || []))}
              />
              <div className="rd-card flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rd-line-2)] text-[var(--rd-ink-2)]">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="text-[14px] font-extrabold">마스킹 지원</div>
                  <div className="text-[12px] font-semibold text-[var(--rd-ink-2)]">이미지는 업로드 전 개인정보 가리기</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-[var(--rd-risk-hi-bg)] p-4 text-[13px] font-bold text-[var(--rd-risk-hi)]">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isSupportedFile(file: File) {
  return isImageFile(file) || isPdfFile(file);
}
