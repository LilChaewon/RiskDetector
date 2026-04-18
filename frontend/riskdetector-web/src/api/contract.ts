import { apiFetch } from './client';
import type {
    ContractOcrResponse,
    ContractAnalysisResponse,
    OcrUploadResponseBody
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

// 1-b) 계약서 업로드 + OCR 요청 (실제 API 연동)
export async function uploadOCR(files: File[], contractType: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('contractType', contractType);
    formData.append('title', '업로드된 계약서'); // 백엔드에서 요구하는 title 파라미터

    // apiFetch를 사용해 JWT 토큰(Authorization 헤더)이 자동으로 포함되도록 수정
    return apiFetch<OcrUploadResponseBody>(
        '/ocr/upload',
        {
            method: 'POST',
            body: formData,
        }
    );
}

// 2) OCR 결과 조회
export async function getOcrResult(contractId: string) {
    return apiFetch<ContractOcrResponse>(
        `/ocr/${contractId}`,
        {
            method: 'GET',
            mockData: {
                contractId: 'mock-ocr-1',
                title: '임대차 계약서',
                htmlEntire: '<p>제1조 (목적) 본 계약은 임대차를 목적으로 한다.</p>',
                htmlArray: [
                    { id: 'el_0', category: 'paragraph', content: '<p>제1조 (목적) 본 계약은 임대차를 목적으로 한다.</p>', tagIdx: 1000 },
                ]
            }
        }
    );
}

// 3) OCR로 인식된 특정 블록의 텍스트를 수정할 때 사용
export async function updateOcrBlock(contractId: string, blockId: string, text: string) {
    return apiFetch<ContractOcrResponse>(
        `/ocr/${contractId}`,
        {
            method: 'PATCH',
            body: JSON.stringify({ id: blockId, content: text }),
        }
    );
}

// 4) 수정을 마친 후 AI에게 본격적인 분석을 요청할 때 사용
export async function startAnalysis(contractId: string) {
    return apiFetch<{ analysisId: string }>(
        '/analysis',
        {
            method: 'POST',
            body: JSON.stringify({ contractId, ocrSucceeded: 'true' }),
            mockData: { analysisId: 'mock-analysis-1' }
        }
    );
}

// 5) AI 분석이 완료된 최종 결과(독소 조항 등)를 가져올 때 사용
export async function fetchAnalysis(contractId: string, analysisId: string) {
    return apiFetch<ContractAnalysisResponse>(
        `/analysis/${analysisId}`,
        {
            method: 'GET',
        }
    );
}
