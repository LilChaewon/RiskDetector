export interface ResponseDTO<T> {
    success: boolean;
    code: number;
    message: string;
    userMessage: string | null;
    data: T;
    timestamp: string;
    trace_id: string;
}

export interface ContractAnalysisDTO {
    originContent: string;
    summary: string;
    analysisStatus: string;
    toxicCount: number;
    riskdetectorCommentary: {
        overallComment: string;
        warningComment: string;
        advice: string;
    };
    toxics: Array<{
        title: string;
        clause: string;
        reason: string;
        reasonReference: string;
        warnLevel: number;
    }>;
}

export type ContractAnalysisResponse = ContractAnalysisDTO;

export interface HtmlBlock {
    category: string;
    content: string;
    id: string;
    tagIdx: number;
}

export interface ContractOcrHtml {
    contractId: string;
    title: string;
    htmlEntire: string;
    htmlArray: HtmlBlock[];
}

export type ContractOcrResponse = ContractOcrHtml;

export interface CreateAnalysisRequest {
    contractId: string;
    ocrSucceeded: string;
}

export interface OcrContentDto {
    id: string;
    category: string;
    content: string;
    tagIdx: number;
}

export interface OcrUploadResponseBody {
    contractId: string;
    title: string;
    ocrStatus: string;
    contents: OcrContentDto[];
}