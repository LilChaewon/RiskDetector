'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, ChevronRight, FileText, UploadCloud } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { uploadOCR } from '@/api/contract';

type ContractType = 'RENTAL' | 'EMPLOYMENT';
type Step = 'select-type' | 'upload' | 'uploading';

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
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  function beginUpload(type: ContractType) {
    setContractType(type);
    setStep('upload');
    setError(null);
  }

  async function acceptFiles(selected: File[]) {
    setPreparing(true);
    setError(null);

    const supported = selected.filter(isSupportedFile);
    if (supported.length === 0) {
      setError('JPG, PNG, HEIC 이미지 또는 PDF 파일을 올려주세요.');
      setPreparing(false);
      return;
    }

    try {
      const uploadFiles = await expandPdfFiles(supported);
      handleUpload(uploadFiles);
    } catch (err) {
      console.error('파일 준비 실패:', err);
      setError('PDF를 페이지별 이미지로 변환하지 못했습니다. 다른 파일로 다시 시도해주세요.');
    } finally {
      setPreparing(false);
    }
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

  if (step === 'uploading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--rd-bg)] p-6 text-[var(--rd-ink)]">
        <div className="w-full max-w-[460px] text-center">
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
                src="/ardi/ardi-working.png"
                alt="아르디가 계약서를 읽고 있어요"
                width={152}
                height={152}
                unoptimized
                priority
              />
            </div>
          </div>
          <h1 className="mt-4 inline-flex items-center text-[23px] font-extrabold tracking-tight">
            아르디가 계약서를 읽고 있어요
            <span className="ardi-loader-dots" aria-hidden>
              <span /><span /><span />
            </span>
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--rd-ink-2)]">OCR 분석을 준비하는 중입니다.</p>
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
                {preparing ? '파일을 준비하고 있어요' : isDragging ? '여기에 놓아주세요' : 'PDF · 사진 선택 또는 드래그'}
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

            <div className="mt-3 sm:hidden">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rd-card rd-card-hover flex w-full items-center gap-3 p-4 text-left"
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

async function expandPdfFiles(files: File[]) {
  const expanded: File[] = [];

  for (const file of files) {
    if (isPdfFile(file)) {
      expanded.push(...await pdfToImageFiles(file));
    } else {
      expanded.push(file);
    }
  }

  return expanded;
}

async function pdfToImageFiles(file: File) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: File[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas context is not available');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('PDF page image export failed'));
      }, 'image/jpeg', 0.92);
    });

    const baseName = file.name.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '_') || 'contract';
    pages.push(new File([blob], `${baseName}__pdf_page_${String(pageNumber).padStart(3, '0')}.jpg`, {
      type: 'image/jpeg',
    }));
  }

  return pages;
}
