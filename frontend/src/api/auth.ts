import { apiGet, apiPost } from "./client";
import type { User } from "./mock";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

/** 로그인 — accessToken을 localStorage에 저장합니다. */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const data = await apiPost<LoginResponse>("/auth/login", credentials);
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", data.accessToken);
  }
  return data;
}

/** 로그아웃 — localStorage 토큰을 제거합니다. */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
}

/** 현재 로그인 사용자 정보 조회 */
export function getMe(): Promise<User> {
  return apiGet<User>("/users/me");
}
