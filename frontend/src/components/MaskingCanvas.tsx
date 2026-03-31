"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";

export interface MaskingCanvasHandle {
  /** 캔버스에 그려진 결과물을 File 객체로 내보냅니다. */
  exportMaskedFile: (fileName?: string) => Promise<File | null>;
  /** 마스킹(검은 박스) 기록을 초기화합니다. */
  clearMasks: () => void;
}

interface MaskingCanvasProps {
  imageSrc: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MaskingCanvas = forwardRef<MaskingCanvasHandle, MaskingCanvasProps>(
  ({ imageSrc }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

    // 그려진 다각형(마스킹 영역)
    const [rects, setRects] = useState<Rect[]>([]);
    
    // 드래그 중인 영역
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

    // 1. 이미지 로드 및 캔버스 크기 조정
    useEffect(() => {
      const img = new window.Image();
      img.src = imageSrc;
      img.onload = () => {
        setImageObj(img);
      };
    }, [imageSrc]);

    // 2. 렌더링 루프 (이미지 + 마스킹 박스 그리기)
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const container = containerRef.current;
      if (!canvas || !ctx || !imageObj || !container) return;

      // 컨테이너 크기에 맞춰 캔버스 스케일링
      const ratio = imageObj.width / imageObj.height;
      const displayWidth = container.clientWidth;
      const displayHeight = displayWidth / ratio;
      
      canvas.width = imageObj.width;
      canvas.height = imageObj.height;

      // CSS로 화면 표시 크기 조절
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // a) 원본 이미지 그리기
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

      // b) 비율 스케일 팩터 (화면 좌표 <-> 실제 캔버스 좌표)
      const scaleX = canvas.width / displayWidth;
      const scaleY = canvas.height / displayHeight;

      // c) 저장된 검은 박스 그리기
      ctx.fillStyle = "black";
      rects.forEach(r => {
        ctx.fillRect(r.x, r.y, r.w, r.h);
      });

      // d) 현재 드래그 중인 임시 박스 그리기
      if (isDrawing) {
        const x = Math.min(startPos.x, currentPos.x) * scaleX;
        const y = Math.min(startPos.y, currentPos.y) * scaleY;
        const w = Math.abs(currentPos.x - startPos.x) * scaleX;
        const h = Math.abs(currentPos.y - startPos.y) * scaleY;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // 임시 피드백은 반투명 검정
        ctx.fillRect(x, y, w, h);
      }
    }, [imageObj, rects, isDrawing, startPos, currentPos]);

    // 3. 마우스 이벤트 핸들러
    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      const pos = getMousePos(e);
      setStartPos(pos);
      setCurrentPos(pos);
      setIsDrawing(true);
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      setCurrentPos(getMousePos(e));
    };

    const handlePointerUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const scaleX = canvas.width / container.clientWidth;
      const scaleY = canvas.height / (container.clientWidth / (canvas.width / canvas.height));

      const newRect = {
        x: Math.min(startPos.x, currentPos.x) * scaleX,
        y: Math.min(startPos.y, currentPos.y) * scaleY,
        w: Math.abs(currentPos.x - startPos.x) * scaleX,
        h: Math.abs(currentPos.y - startPos.y) * scaleY,
      };

      // 크기가 너무 작은 클릭은 무시
      if (newRect.w > 5 && newRect.h > 5) {
        setRects(prev => [...prev, newRect]);
      }
    };

    // 4. 외부 인터페이스 (refs 부착)
    useImperativeHandle(ref, () => ({
      clearMasks: () => setRects([]),
      exportMaskedFile: (fileName = "masked_contract.png") => {
        return new Promise((resolve) => {
          const canvas = canvasRef.current;
          if (!canvas) return resolve(null);

          // 최종 텍스처(순수 검정)로 캔버스 덤프
          const ctx = canvas.getContext("2d");
          if (!ctx || !imageObj) return resolve(null);
          
          ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "black";
          rects.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

          canvas.toBlob((blob) => {
            if (!blob) return resolve(null);
            const file = new File([blob], fileName, { type: "image/png" });
            resolve(file);
          }, "image/png");
        });
      }
    }));

    if (!imageSrc) return null;

    return (
      <div 
        ref={containerRef} 
        style={{ width: "100%", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--border)", position: "relative" }}
      >
        <div style={{ position: "absolute", top: "10px", left: "10px", backgroundColor: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "white", pointerEvents: "none" }}>
          드래그하여 이름/주민번호 등 민감정보를 마스킹하세요.
        </div>
        <canvas
          ref={canvasRef}
          style={{ display: "block", cursor: "crosshair", touchAction: "none" }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseOut={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>
    );
  }
);
MaskingCanvas.displayName = "MaskingCanvas";
