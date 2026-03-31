import { getMockData } from "./mock";

// ─────────────────────────────────────────────
// 환경 변수
// ─────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

if (!API_BASE && process.env.NODE_ENV === "development") {
  console.warn(
    "[client] NEXT_PUBLIC_API_BASE_URL 이 설정되지 않았습니다. " +
      ".env.local 파일을 확인하세요."
  );
}

/**
 * NEXT_PUBLIC_MOCK_MODE=true 로 설정하면 실제 API 호출 없이
 * mock.ts에 등록된 더미 데이터를 반환합니다.
 */
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

// ─────────────────────────────────────────────
// 커스텀 에러
// ─────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─────────────────────────────────────────────
// 토큰 유틸
// ─────────────────────────────────────────────

/** localStorage에서 액세스 토큰을 꺼내옵니다. */
function getToken(): string | null {
  if (typeof window === "undefined") return null; // SSR 안전 처리
  return localStorage.getItem("accessToken");
}

// ─────────────────────────────────────────────
// 공통 fetch 래퍼
// ─────────────────────────────────────────────

/**
 * 공통 fetch 래퍼
 * - MOCK_MODE=true 이면 getMockData()로 더미 데이터를 반환합니다.
 * - body가 FormData(파일 업로드)인 경우 Content-Type을 설정하지 않아
 *   브라우저가 multipart/form-data boundary를 자동으로 처리합니다.
 *
 * @param path    API 경로 (예: "/contracts")
 * @param options fetch RequestInit 옵션
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // ── Mock 모드 ──────────────────────────────
  if (MOCK_MODE) {
    console.info(`[MOCK] ${options.method ?? "GET"} ${path}`);
    return getMockData(path) as T;
  }

  // ── 실제 API 호출 ──────────────────────────
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    // FormData(파일 업로드)일 때는 Content-Type을 설정하지 않음
    // → 브라우저가 multipart/form-data; boundary=... 를 자동 지정
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    // 서버가 보낸 에러 바디를 최대한 수집
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    const message =
      (body as { message?: string })?.message ?? `API 에러: ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  // 204 No Content 처리
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// ─────────────────────────────────────────────
// 편의 함수
// ─────────────────────────────────────────────

/** GET 요청 */
function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

/** POST 요청 (JSON body) */
function apiPost<T>(path: string, data: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT 요청 (JSON body) */
function apiPut<T>(path: string, data: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE 요청 */
function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}

/**
 * 파일 업로드 (OCR용)
 * FormData를 그대로 전달하며, Content-Type은 브라우저가 자동 처리합니다.
 *
 * @example
 * const formData = new FormData();
 * formData.append("file", pdfFile);
 * const result = await apiUpload<Contract>("/contracts/upload", formData);
 */
function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: formData,
    // Content-Type은 apiFetch 내부에서 FormData 감지 후 자동 제외
  });
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────
export { apiFetch, apiGet, apiPost, apiPut, apiDelete, apiUpload };
