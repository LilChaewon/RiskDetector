import { apiFetch } from './client';
import type {
    ContractOcrResponse,
    ContractAnalysisResponse,
    CreateAnalysisRequest
} from '@/types/api';

type ContractType = 'RENTAL' | 'EMPLOYMENT';

// 1) 계약서 업로드
export async function uploadContract(type: ContractType, files: File[]) {
    const formData = new FormData();
    formData.append('contractType', type);
    files.forEach(f => formData.append('images', f));

    return apiFetch<{ success: boolean; data: { contractId: string } }>(
        '/contract/upload',
        {
            method: 'POST',
            body: formData,
            mockData: {
                success: true,
                data: { contractId: 'mock-contract-' + Date.now() }
            }
        }
    );
}

// 2) OCR 결과 조회
export async function fetchOcrResult(contId: string) {
    return apiFetch<ContractOcrResponse>(
        `/contract/ocr/${contId}`,
        {
            method: 'GET',
            mockData: {
                success: true, code: 200, message: 'ok',
                userMessage: null, timestamp: '', trace_id: '',
                data: {
                    pageIdx: 0,
                    htmlEntire: '<p>계약서 내용</p>',
                    htmlArray: [
                        { id: 'b1', category: 'p', element: '<p>제1조 목적</p>', tagIdx: 0 },
                        { id: 'b2', category: 'p', element: '<p>임대인과 임차인은 다음과 같이 계약한다</p>', tagIdx: 1 }
                    ]
                }
            }
        }
    );
}

// 3) OCR로 인식된 특정 블록의 텍스트를 수정할 때 사용
export async function updateOcrBlock(contractId: string, blockId: string, element: string) {
    return apiFetch<ContractOcrResponse>(
        `/contract/ocr/${contractId}`,
        {
            method: 'PATCH',
            body: JSON.stringify({ id: blockId, element }),
        }
    );
}

// 4) 수정을 마친 후 AI에게 본격적인 분석을 요청할 때 사용
export async function requestAnalysis(contractId: string, ocrSucceeded: boolean) {
    return apiFetch<{ success: boolean; data: { analysisId: string } }>(
        '/contract/analysis',
        {
            method: 'POST',
            body: JSON.stringify({ contractId, ocrSucceeded: String(ocrSucceeded) }),
        }
    );
}

// 5) AI 분석이 완료된 최종 결과(독소 조항 등)를 가져올 때 사용
export async function fetchAnalysis(contractId: string, analysisId: string) {
    return apiFetch<ContractAnalysisResponse>(
        `/contract/${contractId}/analysis/${analysisId}`,
        {
            method: 'GET',
        }
    );
}
