import { apiFetch } from './client';
import type {
  ContractSummary,
  DashboardResponse,
  LegalTip,
  PageResponse,
} from '@/types/api';

export function getDashboard() {
  return apiFetch<DashboardResponse>('/dashboard', { method: 'GET' });
}

export function getContracts(page = 0, size = 20) {
  return apiFetch<PageResponse<ContractSummary>>(`/contracts?page=${page}&size=${size}`, { method: 'GET' });
}

export function getTips(params: { category?: string; q?: string; page?: number; size?: number } = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.q) query.set('q', params.q);
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));
  return apiFetch<PageResponse<LegalTip>>(`/tips?${query.toString()}`, { method: 'GET' });
}

export function getTip(id: number) {
  return apiFetch<LegalTip>(`/tips/${id}`, { method: 'GET' });
}

export function bookmarkTip(id: number) {
  return apiFetch<LegalTip>(`/tips/${id}/bookmark`, { method: 'POST' });
}

export function unbookmarkTip(id: number) {
  return apiFetch<LegalTip>(`/tips/${id}/bookmark`, { method: 'DELETE' });
}
