import { apiGet } from "./client";
import type { DashboardStats } from "./mock";

/** 대시보드 통계 조회 */
export function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>("/dashboard/stats");
}
