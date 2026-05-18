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
    contractId: string;
    analysisId: string;
    title: string;
    contractType: string;
    createdAt: string;
    summary: string;
    analysisStatus: string;
    toxicCount: number;
    ocrBlocks?: HtmlBlock[];
    riskdetectorCommentary: {
        overallComment: string;
        warningComment: string;
        advice: string;
    };
    toxics: Array<{
        title: string;
        clause: string;
        reason: string;
        suggestion?: string;
        reasonReference: string;
        sourceContractTagIdx?: number;
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

export interface UserSummary {
    name: string;
    email: string | null;
    picture: string | null;
    guest: boolean;
}

export interface DashboardStats {
    totalContracts: number;
    completedAnalyses: number;
    bookmarkCount: number;
    highRiskContracts: number;
}

export interface ContractSummary {
    contractId: string;
    analysisId: string | null;
    title: string;
    contractType: string;
    createdAt: string;
    analysisStatus: string;
    toxicCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    maxWarnLevel: number;
}

export interface LegalTip {
    id: number;
    category: string;
    question: string;
    summary?: string;
    answer: string;
    sourceUrl: string;
    viewCount: number;
    bookmarked: boolean;
}

export interface DashboardResponse {
    user: UserSummary;
    stats: DashboardStats;
    recentContracts: ContractSummary[];
    featuredTips: LegalTip[];
}

export interface PageResponse<T> {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
