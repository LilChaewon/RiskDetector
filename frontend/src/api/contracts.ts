import { apiGet, apiUpload, apiDelete } from "./client";
import type { Contract, RiskItem } from "./mock";

// ─────────────────────────────────────────────
// 계약서 목록 / 상세
// ─────────────────────────────────────────────

/** 업로드된 계약서 전체 목록 조회 */
export function getContracts(): Promise<Contract[]> {
  return apiGet<Contract[]>("/contracts");
}

/** 계약서 단건 조회 */
export function getContract(id: number): Promise<Contract> {
  return apiGet<Contract>(`/contracts/${id}`);
}

// ─────────────────────────────────────────────
// OCR 업로드 및 분석
// ─────────────────────────────────────────────

export type ContractType = "real_estate" | "employment";

/**
 * 계약서 PDF / 이미지를 업로드하고 OCR 분석을 요청합니다.
 *
 * @example
 * const file = e.target.files[0];
 * const contract = await uploadContract(file, "real_estate");
 */
export function uploadContract(
  file: File,
  contractType: ContractType
): Promise<Contract> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("contractType", contractType);
  return apiUpload<Contract>("/contracts/upload", formData);
}

// ─────────────────────────────────────────────
// 위험 항목
// ─────────────────────────────────────────────

/** 특정 계약서의 위험 항목 목록 조회 */
export function getRisksByContract(contractId: number): Promise<RiskItem[]> {
  return apiGet<RiskItem[]>(`/contracts/${contractId}/risks`);
}

/** 전체 위험 항목 조회 */
export function getAllRisks(): Promise<RiskItem[]> {
  return apiGet<RiskItem[]>("/risks");
}

// ─────────────────────────────────────────────
// 계약서 삭제
// ─────────────────────────────────────────────

/** 계약서 삭제 */
export function deleteContract(id: number): Promise<void> {
  return apiDelete<void>(`/contracts/${id}`);
}
