"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MaskingCanvas, MaskingCanvasHandle } from "@/components/MaskingCanvas";
import { uploadContract, ContractType } from "@/api/contracts";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractType = (searchParams.get("type") as ContractType) || "real_estate";
  
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<MaskingCanvasHandle>(null);

  // 파일 브라우저에서 이미지 선택
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      // 이미지 미리보기를 위한 URL 생성
      setImagePreviewUrl(URL.createObjectURL(selected));
    }
  };

  // 1. 마스킹 완료 > 2. 이미지 추출 > 3. 업로드
  const handleUploadSubmit = async () => {
    if (!imagePreviewUrl) return;

    setIsUploading(true);
    try {
      // 캔버스 추출 (수정된 빈 박스들이 그려짐)
      let finalFile = file;
      
      if (canvasRef.current) {
        const maskedFile = await canvasRef.current.exportMaskedFile(file?.name || "masked.png");
        if (maskedFile) {
          finalFile = maskedFile;
        }
      }

      if (!finalFile) throw new Error("파일 처리 실패");

      // API 전송 (Mock)
      const res = await uploadContract(finalFile, contractType);

      // OCR 결과 페이지로 이동
      router.push(`/ocr?id=${res.id}`);
    } catch (err) {
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearMasks = () => {
    canvasRef.current?.clearMasks();
  };

  return (
    <div className="main-content" style={{ margin: "0 auto", maxWidth: "800px" }}>
      <header className="page-header" style={{ marginBottom: "32px" }}>
        <h1 className="page-title">계약서 업로드</h1>
        <p className="page-subtitle">
          {contractType === "real_estate" ? "부동산 임대차" : "고용(근로)"} 계약서 이미지를 업로드해 주세요.
        </p>
      </header>

      <div className="page-body" style={{ paddingTop: "0" }}>
        {!imagePreviewUrl ? (
          // 업로드 박스 (파일 선택 전)
          <label className="upload-area" style={{ display: "block", marginBottom: "32px" }}>
            <div className="upload-icon">📄</div>
            <h3 className="upload-title">클릭하여 이미지 업로드</h3>
            <p className="upload-desc">지원 형태: JPG, PNG 등 이미지 파일</p>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </label>
        ) : (
          // 마스킹 에디터 (파일 선택 후)
          <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "32px" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600" }}>민감정보 마스킹 처리</h3>
              <button className="btn btn-ghost" onClick={handleClearMasks}>
                초기화
              </button>
            </div>
            
            <div style={{ background: "#222", padding: "16px" }}>
              <MaskingCanvas ref={canvasRef} imageSrc={imagePreviewUrl} />
            </div>

            <div style={{ padding: "20px 24px", display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              <button className="btn btn-ghost" onClick={() => setImagePreviewUrl(null)}>취소 및 재선택</button>
              <button 
                className="btn btn-primary" 
                onClick={handleUploadSubmit}
                disabled={isUploading}
              >
                {isUploading ? "업로드 중..." : "안전하게 마스킹 적용 및 업로드 (OCR 분석 시작)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
