'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

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

    useEffect(() => {
        setMasks([]);
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.src = url;
        img.onload = () => {
            setImage(img);
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = img.width;
            canvas.height = img.height;
            drawAll(img, []);
        };
        return () => URL.revokeObjectURL(url);
    }, [imageFile, drawAll]);

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
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !image) return;
        const pos = getPos(e);
        const rect = {
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(startPos.x - pos.x),
            h: Math.abs(startPos.y - pos.y),
        };
        drawAll(image, masks, rect);
    };

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !image) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsDrawing(false);
        const pos = getPos(e);
        const rect = {
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(startPos.x - pos.x),
            h: Math.abs(startPos.y - pos.y),
        };
        if (rect.w > 2 && rect.h > 2) {
            const newMasks = [...masks, rect];
            setMasks(newMasks);
            drawAll(image, newMasks);
        } else {
            drawAll(image, masks);
        }
    };

    function undoLastMask() {
        const newMasks = masks.slice(0, -1);
        setMasks(newMasks);
        if (image) drawAll(image, newMasks);
    }

    function clearMasks() {
        setMasks([]);
        if (image) drawAll(image, []);
    }

    function exportMasked() {
        const canvas = canvasRef.current!;
        if (!image) return;
        drawAll(image, masks);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'masked_contract.jpg', { type: 'image/jpeg' });
            onMaskingComplete(file);
        }, 'image/jpeg', 0.95);
    }

    return (
        <div className="flex w-full flex-col gap-4 p-4">
            {/* 안내 & 마스킹 개수 */}
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-white/60">
                    드래그해서 가릴 영역을 선택하세요
                </p>
                {masks.length > 0 && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold text-white">
                        {masks.length}개 가려짐
                    </span>
                )}
            </div>

            {/* 캔버스 */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                <canvas
                    ref={canvasRef}
                    className="block h-auto max-h-[52vh] w-full cursor-crosshair touch-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => setIsDrawing(false)}
                />
            </div>

            {/* 보조 버튼 */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={undoLastMask}
                    disabled={masks.length === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-[14px] font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
                >
                    <RotateCcw size={15} />
                    되돌리기
                </button>
                <button
                    type="button"
                    onClick={clearMasks}
                    disabled={masks.length === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-[14px] font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
                >
                    <Trash2 size={15} />
                    전체 지우기
                </button>
            </div>

            {/* 완료 버튼 */}
            <button
                type="button"
                onClick={exportMasked}
                className="w-full rounded-xl bg-[#1b64da] py-4 text-[15px] font-extrabold text-white shadow-lg transition hover:bg-[#1452b8]"
            >
                마스킹 완료
            </button>
        </div>
    );
}
