'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MaskingCanvas from '@/components/MaskingCanvas';

type ContractType = 'RENTAL' | 'EMPLOYMENT';
type Step = 'select-type' | 'upload' | 'masking' | 'uploading';

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select-type');
  const [contractType, setContractType] = useState<ContractType>('RENTAL');
  const [files, setFiles] = useState<File[]>([]);
  const [maskedFiles, setMaskedFiles] = useState<File[]>([]);
  const [currentMaskingIdx, setCurrentMaskingIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Step 1: 종류 선택
  if (step === 'select-type') return (
    <main className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6">
      <div className="w-full max-w-[720px]">
        <h1 className="text-2xl font-bold text-center text-[#059669] mb-2">RiskDetector</h1>
        <h2 className="text-lg font-semibold text-center text-gray-700 mb-8">계약서 종류를 선택해 주세요</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { setContractType('RENTAL'); setStep('upload'); }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-[#059669] hover:shadow-md transition-all"
          >
            <p className="text-4xl mb-3">🏠</p>
            <p className="font-bold text-gray-800 text-lg">임대차</p>
            <p className="text-sm text-gray-500 mt-1">전세/월세 계약서</p>
          </button>
          <button
            onClick={() => { setContractType('EMPLOYMENT'); setStep('upload'); }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-[#059669] hover:shadow-md transition-all"
          >
            <p className="text-4xl mb-3">💼</p>
            <p className="font-bold text-gray-800 text-lg">근로</p>
            <p className="text-sm text-gray-500 mt-1">근로 계약서</p>
          </button>
        </div>
      </div>
    </main>
  );

  // Step 2: 파일 업로드
  if (step === 'upload') return (
    <main className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6">
      <div className="w-full max-w-[720px]">
        <button
          onClick={() => setStep('select-type')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
        >
          ← 뒤로
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-2">계약서 사진 업로드</h2>
        <p className="text-sm text-gray-500 mb-6">
          {contractType === 'RENTAL' ? '🏠 임대차' : '💼 근로'} 계약서 · 여러 장 선택 가능
        </p>

        <label
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDrop={e => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (droppedFiles.length > 0) {
              setFiles(droppedFiles);
              setCurrentMaskingIdx(0);
              setMaskedFiles([]);
              setStep('masking');
            }
          }}
          className={`block w-full bg-white border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragging ? 'border-[#059669] bg-emerald-50' : 'border-emerald-300 hover:border-[#059669] hover:bg-emerald-50'
          }`}
        >
          <p className="text-4xl mb-3">📄</p>
          <p className="font-semibold text-gray-700 mb-4">
            {isDragging ? '여기에 이미지를 놓아주세요' : '클릭하거나 드래그해서 이미지 선택'}
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              const selected = Array.from(e.target.files || []);
              if (selected.length > 0) {
                setFiles(selected);
                setCurrentMaskingIdx(0);
                setMaskedFiles([]);
                setStep('masking');
              }
            }}
          />
          <p className="text-sm text-gray-400 mt-3">jpg, png 등 이미지 파일 (여러 장 가능)</p>
        </label>
      </div>
    </main>
  );

  // Step 3: 마스킹
  if (step === 'masking') return (
    <main className="min-h-screen bg-[#F0FDF4] p-6">
      <div className="w-full max-w-[720px] mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-1">개인정보 가리기</h2>
        <p className="text-sm text-gray-500 mb-4">
          {currentMaskingIdx + 1} / {files.length} 페이지 · 드래그해서 민감한 정보를 가려주세요
        </p>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <MaskingCanvas
            imageFile={files[currentMaskingIdx]}
            onMaskingComplete={(maskedFile) => {
              const updated = [...maskedFiles, maskedFile];
              setMaskedFiles(updated);
              if (currentMaskingIdx + 1 < files.length) {
                setCurrentMaskingIdx(i => i + 1);
              } else {
                handleUpload(updated);
              }
            }}
          />
        </div>
      </div>
    </main>
  );

  // Step 4: 업로드 중
  async function handleUpload(masked: File[]) {
    setStep('uploading');
    // TODO: 실제 서버 업로드 로직으로 교체
    await new Promise(r => setTimeout(r, 2000));
    router.push('/ocr?contId=mock-contract-001');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F0FDF4]">
      <div className="text-center">
        <p className="text-[#059669] text-xl font-bold animate-pulse mb-2">업로드 중...</p>
        <p className="text-sm text-gray-400">잠시만 기다려 주세요</p>
      </div>
    </main>
  );
}