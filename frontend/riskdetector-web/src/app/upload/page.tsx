'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MaskingCanvas from '@/components/MaskingCanvas';
import AppHeader from '@/components/AppHeader';
import { uploadOCR } from '@/api/contract';

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
    <main className="min-h-screen bg-[#F2F4F6] flex justify-center p-4 sm:p-6">
      <AppHeader />
      <div className="w-full max-w-[500px] mt-16 sm:mt-24 mb-10">
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#191F28] mb-2 tracking-tight leading-snug">
          어떤 계약서인가요?
        </h1>
        <h2 className="text-[15px] font-medium text-[#8B95A1] mb-10">
          분석할 계약서의 종류를 선택해주세요
        </h2>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => { setContractType('RENTAL'); setStep('upload'); }}
            className="group bg-white rounded-[24px] p-6 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-300 active:scale-[0.98] flex items-center justify-between border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#F2F4F6] rounded-full flex items-center justify-center text-2xl group-hover:bg-[#E8F3FF] transition-colors">
                🏠
              </div>
              <div>
                <p className="font-bold text-[#191F28] text-[18px]">임대차 계약서</p>
                <p className="text-[#8B95A1] text-[14px] mt-1 font-medium">전세, 월세 등 주거/상가 임대차</p>
              </div>
            </div>
            <div className="text-[#B0B8C1] group-hover:text-[#3182F6] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6L16 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
          
          <button
            onClick={() => { setContractType('EMPLOYMENT'); setStep('upload'); }}
            className="group bg-white rounded-[24px] p-6 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-300 active:scale-[0.98] flex items-center justify-between border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#F2F4F6] rounded-full flex items-center justify-center text-2xl group-hover:bg-[#FFF3E1] transition-colors">
                💼
              </div>
              <div>
                <p className="font-bold text-[#191F28] text-[18px]">근로 계약서</p>
                <p className="text-[#8B95A1] text-[14px] mt-1 font-medium">정규직, 계약직, 아르바이트</p>
              </div>
            </div>
            <div className="text-[#B0B8C1] group-hover:text-[#FF8A3D] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6L16 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </main>
  );

  // Step 2: 파일 업로드
  if (step === 'upload') return (
    <main className="min-h-screen bg-[#F2F4F6] flex justify-center p-4 sm:p-6">
      <AppHeader onBack={() => setStep('select-type')} />
      <div className="w-full max-w-[500px] mt-16 sm:mt-24 mb-10">
        <h2 className="text-[26px] sm:text-[28px] font-bold text-[#191F28] mb-2 tracking-tight">
          계약서를 올려주세요
        </h2>
        <p className="text-[15px] font-medium text-[#8B95A1] mb-10">
          <span className={contractType === 'RENTAL' ? "text-[#3182F6] font-bold" : "text-[#FF8A3D] font-bold"}>
            {contractType === 'RENTAL' ? '🏠 임대차' : '💼 근로'}
          </span> 계약서의 전체 페이지가 잘 보이게 찍어주세요
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
          className={`block w-full rounded-[24px] p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'bg-[#E8F3FF] border-2 border-[#3182F6] border-solid shadow-inner scale-[0.98]' 
              : 'bg-white border-2 border-[#E5E8EB] border-dashed hover:border-[#3182F6] hover:bg-[#F9FAFB] shadow-sm'
          }`}
        >
          <div className="w-16 h-16 bg-[#F2F4F6] rounded-full flex items-center justify-center text-3xl mx-auto mb-5 transition-transform duration-300 hover:scale-110">
            📸
          </div>
          <p className="font-bold text-[#333D4B] text-[18px] mb-2">
            {isDragging ? '여기에 놓아주세요' : '사진 선택 또는 드래그'}
          </p>
          <p className="text-[14px] font-medium text-[#8B95A1]">
            여러 장의 이미지도 한 번에 올릴 수 있어요
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
        </label>
      </div>
    </main>
  );

  // Step 3: 마스킹
  if (step === 'masking') return (
    <main className="min-h-screen bg-[#191F28] flex flex-col p-4 sm:p-6 pb-12">
      <div className="w-full max-w-[600px] mx-auto flex-1 flex flex-col pt-4">
        {/* 상단 네비게이션: 뒤로가기 & 진행 상황 */}
        <div className="flex items-center justify-between mb-8">
           <button 
             onClick={() => setStep('upload')} 
             className="text-white flex items-center gap-2 font-bold text-[16px] hover:text-[#8B95A1] transition-colors"
           >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
               <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
             이전으로
           </button>
           <div className="bg-[#333D4B] text-white px-4 py-1.5 rounded-full text-[14px] font-bold shadow-md">
              {currentMaskingIdx + 1} <span className="text-[#8B95A1] font-medium">/ {files.length}</span>
           </div>
        </div>
        
        <div>
           <h2 className="text-[26px] font-bold text-white tracking-tight">개인정보 지우기</h2>
           <p className="text-[15px] font-medium text-[#8B95A1] mt-2 mb-8">
             주민번호 등 민감한 정보를 손가락으로 가려주세요
           </p>
        </div>
        
        <div className="flex-1 bg-black/50 rounded-[28px] overflow-hidden shadow-2xl relative border border-[#333D4B] flex items-center justify-center min-h-[400px]">
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
    try {
      const result = await uploadOCR(masked, contractType);

      if (result.ocrStatus === 'success' || result.ocrStatus === 'partial_success') {
        if (result.ocrStatus === 'partial_success') {
          console.warn('일부 페이지 OCR 처리에 실패했습니다.');
        }
        router.push(`/ocr?contractId=${result.contractId}`);
      } else {
        alert('OCR 처리에 실패했습니다. 다시 시도해주세요.');
        setStep('masking');
      }
    } catch (err) {
      console.error('업로드 실패:', err);
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
      setStep('masking');
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-6">
      <div className="text-center flex flex-col items-center bg-white rounded-[32px] p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] w-full max-w-[400px]">
        <div className="w-16 h-16 border-4 border-[#F2F4F6] border-t-[#3182F6] rounded-full animate-[spin_1s_cubic-bezier(0.5,0.1,0.1,0.8)_infinite] mb-8"></div>
        <h2 className="text-[22px] font-bold text-[#191F28] mb-3 tracking-tight">계약서를 읽고 있어요</h2>
        <p className="text-[16px] font-medium text-[#8B95A1]">내용을 추출하는 중이니 잠시만 기다려주세요</p>
      </div>
    </main>
  );
}