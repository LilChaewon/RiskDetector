// ─────────────────────────────────────────────────────────────
// Mock 타입 정의
// ─────────────────────────────────────────────────────────────

/** 계약서 종류 */
export type ContractType = "real_estate" | "employment";

/** 위험 수준 */
export type RiskLevel = "critical" | "high" | "medium" | "low";

/** 분석 상태 */
export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";

/** OCR로 업로드된 계약서 */
export interface Contract {
  id: number;
  fileName: string;
  contractType: ContractType;
  uploadedAt: string;
  status: AnalysisStatus;
  /** OCR로 추출된 전체 텍스트 */
  extractedText?: string;
  riskCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/** 계약서 내 탐지된 위험 항목 */
export interface RiskItem {
  id: number;
  contractId: number;
  level: RiskLevel;
  category: string;
  clause: string;        // 위험이 탐지된 원문 조항
  description: string;  // 위험 설명
  suggestion: string;   // 권고 사항
  pageNumber: number;
}

/** 대시보드 통계 */
export interface DashboardStats {
  totalContracts: number;
  analyzedContracts: number;
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  contractTypeBreakdown: {
    real_estate: number;
    employment: number;
  };
}

/** 사용자 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
}

// ─────────────────────────────────────────────────────────────
// Mock 더미 데이터
// ─────────────────────────────────────────────────────────────

const mockContracts: Contract[] = [
  {
    id: 1,
    fileName: "강남구_아파트_임대차계약서_2026.pdf",
    contractType: "real_estate",
    uploadedAt: "2026-03-31T07:00:00Z",
    status: "completed",
    extractedText:
      "본 계약서는 임대인 홍길동과 임차인 김철수 사이에 체결된 임대차계약서입니다...",
    riskCount: { critical: 1, high: 2, medium: 1, low: 1 },
  },
  {
    id: 2,
    fileName: "소프트웨어엔지니어_근로계약서_A사.pdf",
    contractType: "employment",
    uploadedAt: "2026-03-30T09:30:00Z",
    status: "completed",
    extractedText:
      "본 계약은 주식회사 A와 근로자 이영희 간의 근로계약서입니다...",
    riskCount: { critical: 0, high: 1, medium: 3, low: 2 },
  },
  {
    id: 3,
    fileName: "오피스텔_전세계약서_마포구.pdf",
    contractType: "real_estate",
    uploadedAt: "2026-03-29T15:00:00Z",
    status: "completed",
    extractedText: "임대인 박민준은 아래 부동산을 임차인에게 임대함...",
    riskCount: { critical: 2, high: 1, medium: 0, low: 0 },
  },
  {
    id: 4,
    fileName: "프리랜서_용역계약서_B사.pdf",
    contractType: "employment",
    uploadedAt: "2026-03-31T08:00:00Z",
    status: "analyzing",
    riskCount: { critical: 0, high: 0, medium: 0, low: 0 },
  },
];

const mockRisks: RiskItem[] = [
  // ── 계약서 1: 강남구 임대차계약서 ──────────────────────────
  {
    id: 101,
    contractId: 1,
    level: "critical",
    category: "등기부 확인",
    clause:
      "제3조 (보증금) 임차인은 보증금 500,000,000원을 계약 체결 시 전액 지급한다.",
    description:
      "계약서에 근저당 설정 여부 및 선순위 채권 확인 조항이 누락되어 있습니다. 보증금 미반환 위험이 매우 높습니다.",
    suggestion:
      "계약 전 등기부등본을 열람하여 근저당권·가압류 여부를 반드시 확인하세요. 선순위 채권 합계가 보증금의 80%를 초과하면 계약을 지양하세요.",
    pageNumber: 2,
  },
  {
    id: 102,
    contractId: 1,
    level: "high",
    category: "임대인 신원",
    clause: "제1조 (목적) 임대인은 소유권자 또는 적법한 대리인으로 계약을 체결한다.",
    description:
      "실제 등기부상 소유자와 계약 당사자의 일치 여부를 확인하는 조항이 모호하게 기재되어 있습니다. 무권대리 계약 위험이 있습니다.",
    suggestion:
      "임대인의 신분증과 등기부등본상 소유자 일치 여부를 직접 확인하고, 대리인 계약 시 위임장 및 인감증명서를 요구하세요.",
    pageNumber: 1,
  },
  {
    id: 103,
    contractId: 1,
    level: "high",
    category: "계약 해지",
    clause:
      "제8조 (계약 해지) 임대인은 1개월 전 통보로 계약을 해지할 수 있다.",
    description:
      "주택임대차보호법상 임대인의 일방적 해지는 법적 요건을 충족해야 하며, '1개월 전 통보'는 법적 최소 기준(2개월)에 미치지 못합니다.",
    suggestion:
      "주택임대차보호법 제6조의3에 따라 계약 갱신 거절 통보는 만료 2~6개월 전에 이루어져야 합니다. 해당 조항의 수정을 요청하세요.",
    pageNumber: 4,
  },
  {
    id: 104,
    contractId: 1,
    level: "medium",
    category: "원상복구",
    clause: "제10조 (원상복구) 임차인은 퇴거 시 임대 당시 상태로 원상복구해야 한다.",
    description:
      "원상복구 범위가 불명확하게 기재되어 분쟁 발생 소지가 있습니다.",
    suggestion:
      "입주 전 사진 촬영 및 체크리스트를 작성하고, 원상복구 범위를 별지에 구체적으로 명시하도록 협의하세요.",
    pageNumber: 5,
  },
  {
    id: 105,
    contractId: 1,
    level: "low",
    category: "관리비",
    clause: "제5조 (관리비) 관리비는 별도로 협의한다.",
    description: "관리비 항목 및 금액이 명시되지 않아 추후 분쟁 가능성이 있습니다.",
    suggestion: "관리비 세부 항목(공용전기, 청소비 등)과 월 예상 금액을 계약서에 명기하세요.",
    pageNumber: 3,
  },

  // ── 계약서 2: 소프트웨어엔지니어 근로계약서 ────────────────
  {
    id: 201,
    contractId: 2,
    level: "high",
    category: "포괄임금제",
    clause:
      "제6조 (급여) 월 급여 3,500,000원에는 연장·야간·휴일 근무에 대한 수당이 포함된다.",
    description:
      "포괄임금제 적용 시 실제 연장근로 수당이 법정 기준에 미달할 수 있습니다. 개발직군에 대한 포괄임금제는 법원에서 무효로 판단되는 사례가 증가하고 있습니다.",
    suggestion:
      "실제 연장근로 예상 시간을 계산하여 포괄 수당이 법정 기준을 충족하는지 확인하세요. 포괄임금제 무효 시 추가 수당을 청구할 수 있습니다.",
    pageNumber: 3,
  },
  {
    id: 202,
    contractId: 2,
    level: "medium",
    category: "지식재산권",
    clause:
      "제9조 (발명 및 저작권) 재직 중 발생한 모든 결과물의 저작권은 회사에 귀속된다.",
    description:
      "'모든 결과물'의 범위가 업무 외 개인 프로젝트까지 포함될 수 있어 과도한 권리 양도 조항입니다.",
    suggestion:
      "업무와 직접 관련된 결과물로 범위를 한정하고, 개인 시간에 개인 장비로 개발한 결과물은 명시적으로 제외하도록 협의하세요.",
    pageNumber: 5,
  },
  {
    id: 203,
    contractId: 2,
    level: "medium",
    category: "경업금지",
    clause:
      "제11조 (경업금지) 퇴직 후 2년간 동종 업계 취업 및 창업을 금지한다.",
    description:
      "경업금지 기간 2년은 법원에서 과도하다고 판단할 수 있으며, 보상 조항이 없는 경우 무효가 될 가능성이 있습니다.",
    suggestion:
      "경업금지 기간을 1년 이내로 단축하고, 금지에 상응하는 보상 조항(보상금) 추가를 요구하세요.",
    pageNumber: 6,
  },
  {
    id: 204,
    contractId: 2,
    level: "medium",
    category: "수습 기간",
    clause: "제3조 (수습) 수습 기간 3개월 동안 급여의 80%를 지급한다.",
    description:
      "수습 기간 급여 감액은 최저임금 이상이어야 하며, 감액 비율 한도(최저임금의 90%)를 위반할 수 있습니다.",
    suggestion:
      "수습 급여가 최저임금의 90% 이상인지 확인하세요. 2026년 최저임금 기준으로 계산 후 계약서 금액을 검토하세요.",
    pageNumber: 2,
  },
  {
    id: 205,
    contractId: 2,
    level: "low",
    category: "연차",
    clause: "제7조 (휴가) 연차 사용은 1개월 전 사전 신청을 원칙으로 한다.",
    description: "1개월 전 사전 신청 의무는 근로자의 연차 자유 사용권을 침해할 수 있습니다.",
    suggestion: "연차 신청 기간을 합리적인 수준(3~5일 전)으로 조정하도록 협의하세요.",
    pageNumber: 4,
  },
  {
    id: 206,
    contractId: 2,
    level: "low",
    category: "업무 장소",
    clause: "제4조 (근무장소) 근무 장소는 회사의 필요에 따라 변경될 수 있다.",
    description: "근무 장소 변경 시 근로자 동의 없이 일방적으로 전보 발령될 수 있는 조항입니다.",
    suggestion: "근무 장소 변경 시 사전 협의 및 동의 절차를 명시할 것을 요청하세요.",
    pageNumber: 2,
  },

  // ── 계약서 3: 마포구 오피스텔 전세계약서 ───────────────────
  {
    id: 301,
    contractId: 3,
    level: "critical",
    category: "전세사기 위험",
    clause:
      "제2조 (보증금) 전세보증금 200,000,000원은 계약 당일 임대인 계좌로 직접 송금한다.",
    description:
      "전세가율이 시세 대비 90%를 초과합니다. 깡통전세 위험이 있으며, 임대인이 여러 채의 전세계약을 체결한 이력이 있을 수 있습니다.",
    suggestion:
      "국토교통부 실거래가 및 공시지가를 확인하고, 전세가율이 70% 이하인지 점검하세요. HUG 전세보증금 반환보증 가입을 적극 권장합니다.",
    pageNumber: 2,
  },
  {
    id: 302,
    contractId: 3,
    level: "critical",
    category: "확정일자 / 전입신고",
    clause:
      "제6조 (임차인 의무) 임차인은 전입신고를 하지 않는 것을 원칙으로 한다.",
    description:
      "전입신고 금지 조항은 임차인의 대항력과 우선변제권을 박탈하는 불법 조항입니다. 보증금 전액 미반환 위험이 매우 높습니다.",
    suggestion:
      "해당 조항은 주택임대차보호법 위반입니다. 계약 즉시 전입신고 및 확정일자를 받으세요. 이 조항이 삭제되지 않으면 계약을 거절하세요.",
    pageNumber: 3,
  },
  {
    id: 303,
    contractId: 3,
    level: "high",
    category: "선순위 채권",
    clause: "해당 계약서에 선순위 담보대출 관련 조항 없음.",
    description:
      "계약서에 선순위 근저당(담보대출) 정보가 전혀 기재되어 있지 않습니다. 실제 등기부에 근저당 1억 5천만 원이 설정되어 있습니다.",
    suggestion:
      "잔금 지급 전 반드시 등기부등본을 재확인하고, 선순위 채권과 보증금 합산이 시세의 70%를 초과하지 않는지 확인하세요.",
    pageNumber: 1,
  },
];

const mockDashboardStats: DashboardStats = {
  totalContracts: 4,
  analyzedContracts: 3,
  totalRisks: 11,
  criticalCount: 3,
  highCount: 4,
  mediumCount: 4,
  lowCount: 3,
  contractTypeBreakdown: {
    real_estate: 2,
    employment: 2,
  },
};

const mockCurrentUser: User = {
  id: 1,
  name: "홍길동",
  email: "hong@riskdetector.io",
  role: "admin",
};

// ─────────────────────────────────────────────────────────────
// Mock 라우팅 (path → 데이터 매핑)
// ─────────────────────────────────────────────────────────────

const mockStore: Record<string, unknown> = {
  // 계약서 목록 / 상세
  "/contracts": mockContracts,
  "/contracts/1": mockContracts[0],
  "/contracts/2": mockContracts[1],
  "/contracts/3": mockContracts[2],
  "/contracts/4": mockContracts[3],

  // 위험 항목 전체 목록
  "/risks": mockRisks,
  // 계약서별 위험 항목
  "/contracts/1/risks": mockRisks.filter((r) => r.contractId === 1),
  "/contracts/2/risks": mockRisks.filter((r) => r.contractId === 2),
  "/contracts/3/risks": mockRisks.filter((r) => r.contractId === 3),

  // 업로드 시연용 데이터(id: 99)
  "/contracts/99": {
    id: 99,
    fileName: "업로드된_계약서.jpg",
    contractType: "employment",
    uploadedAt: new Date().toISOString(),
    status: "completed",
    extractedText: "사용자가 마스킹 한 파일 원문 스캔 완료...",
    riskCount: { critical: 1, high: 1, medium: 0, low: 0 },
  },
  "/contracts/99/risks": [
    {
      id: 991,
      contractId: 99,
      level: "critical",
      category: "임금 체불",
      clause: "급여 지급일은 익익월 10일로 한다.",
      description: "근로기준법상 임금은 매월 1회 이상 지급되어야 합니다.",
      suggestion: "익월 10일 이내로 지급되도록 수정이 필요합니다.",
      pageNumber: 1,
    },
    {
      id: 992,
      contractId: 99,
      level: "high",
      category: "해고 조항",
      clause: "회사 사정에 따라 언제든 계약을 해지할 수 있다.",
      description: "정당한 사유 없는 해고는 부당해고에 해당합니다.",
      suggestion: "근로기준법 제23조에 따른 절차와 사유를 명시하도록 요구하세요.",
      pageNumber: 2,
    }
  ],

  // 인증된 사용자 정보
  "/users/me": mockCurrentUser,

  // 인증
  "/auth/login": { accessToken: "mock-token-123", user: mockCurrentUser },
  "/auth/signup": { accessToken: "mock-token-123", user: mockCurrentUser },

  // 업로드
  "/contracts/upload": {
    id: 99,
    fileName: "업로드된_계약서.jpg",
    contractType: "unknown",
    uploadedAt: new Date().toISOString(),
    status: "analyzing",
    riskCount: { critical: 0, high: 0, medium: 0, low: 0 },
  },
};

// ─────────────────────────────────────────────────────────────
// getMockData
// ─────────────────────────────────────────────────────────────

/**
 * path에 해당하는 Mock 데이터를 반환합니다.
 * 동적 경로처럼 미등록된 경우 null을 반환하고 경고를 출력합니다.
 */
export function getMockData(path: string): unknown {
  if (path in mockStore) {
    return mockStore[path];
  }
  console.warn(`[MOCK] 등록되지 않은 경로입니다: "${path}"`);
  return null;
}
