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
    analysisDate: string;
    toxicCount: number;
    aiCommentary: {
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

export type ContractAnalysisResponse = ResponseDTO<ContractAnalysisDTO>;

export interface HtmlBlock {
    category: string;
    element: string;
    id: string;
    tagIdx: number;
}

export interface ContractOcrHtml {
    pageIdx: number;
    htmlEntire: string;
    htmlArray: HtmlBlock[];
}

export type ContractOcrResponse = ResponseDTO<ContractOcrHtml>;

export interface CreateAnalysisRequest {
    contractId: string;
    ocrSucceeded: string;
}