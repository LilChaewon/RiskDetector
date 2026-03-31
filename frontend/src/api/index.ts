/**
 * RiskDetector API 레이어 진입점
 *
 * 사용 예시:
 *   import { getContracts, uploadContract } from "@/api";
 *   import { login, logout }               from "@/api";
 *   import { getDashboardStats }           from "@/api";
 */

// 저수준 fetch 래퍼 (필요 시 직접 사용)
export { apiFetch, apiGet, apiPost, apiPut, apiDelete, apiUpload, ApiError } from "./client";

// 도메인 서비스
export * from "./contracts";
export * from "./dashboard";
export * from "./auth";
