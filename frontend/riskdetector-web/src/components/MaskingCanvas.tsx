'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
    imageFile: File;
    onMaskingComplete: (maskedFile: File) => void;
}

interface Rect { x: number; y: number; w: number; h: number; }

export default function MaskingCanvas({ imageFile, onMaskingComplete }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [masks, setMasks] = useState<Rect[]>([]);

    // 화면 그리기 함수 (이미지 + 마스크들 + 드래그 미리보기)
    const drawAll = useCallback((img: HTMLImageElement, maskList: Rect[], previewRect?: Rect) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        ctx.fillStyle = 'black';
        maskList.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

        if (previewRect) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
        }
    }, []);

    // 1. 이미지 로드 및 캔버스 초기화 (이미지가 화면에 보임)
    useEffect(() => {
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.src = url;
        img.onload = () => {
            setImage(img);
            const canvas = canvasRef.current;
            if (!canvas) return;

            // 캔버스 해상도를 이미지 원본 크기에 맞춤 (화질 유지)
            canvas.width = img.width;
            canvas.height = img.height;

            drawAll(img, []);
        };
        return () => URL.revokeObjectURL(url);
    }, [imageFile, drawAll]);

    // 좌표 계산 (캔버스 크기가 줄어들어도 정확한 위치 계산)
    function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        setStartPos(getPos(e));
    }

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !image) return;
        const pos = getPos(e);
        const rect = {
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(startPos.x - pos.x),
            h: Math.abs(startPos.y - pos.y)
        };
        drawAll(image, masks, rect); // 실시간 드래그 박스 표시
    }

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !image) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsDrawing(false);
        const pos = getPos(e);
        const rect = {
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(startPos.x - pos.x),
            h: Math.abs(startPos.y - pos.y)
        };

        // 너무 작지 않은 박스만 추가 (실수 방지)
        if (rect.w > 2 && rect.h > 2) {
            const newMasks = [...masks, rect];
            setMasks(newMasks);
            drawAll(image, newMasks);
        } else {
            drawAll(image, masks);
        }
    }

    // "다시 그리기" → 전부 초기화
    function clearMasks() {
        setMasks([]);
        if (image) drawAll(image, []);
    }

    // "마스킹 완료" → 파일로 추출해서 넘기기
    function exportMasked() {
        const canvas = canvasRef.current!;
        if (!image) return;
        drawAll(image, masks); // 마지막으로 깔끔하게 다시 그림

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'masked_contract.jpg', { type: 'image/jpeg' });
            onMaskingComplete(file); // 부모에게 전달
        }, 'image/jpeg', 0.95);
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-300 font-medium">개인정보(이름, 전화번호 등)를 드래그해서 가려주세요.</p>

            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-inner">
                <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto cursor-crosshair touch-none block mx-auto"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => setIsDrawing(false)}
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={clearMasks}
                    className="flex-1 bg-white border border-gray-300 py-3 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                    다시 그리기
                </button>
                <button
                    onClick={exportMasked}
                    className="flex-1 bg-[#1b64da] text-white py-3 rounded-xl font-bold hover:bg-[#0b3d91] shadow-md"
                >
                    마스킹 완료
                </button>
            </div>
        </div>
    );
}
