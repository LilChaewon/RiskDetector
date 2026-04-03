import { apiFetch } from './client';

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
}

// 회원가입
export async function signup(email: string, password: string, name: string) {
    const res = await apiFetch<{ success: boolean; data: AuthResponse }>(
        '/auth/signup',
        {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
            mockData: {
                success: true,
                data: {
                    accessToken: 'mock-token-' + Date.now(),
                    refreshToken: 'mock-refresh-' + Date.now(),
                    isNewUser: true
                }
            }
        }
    );

    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    return res.data;
}
// 로그인
export async function login(email: string, password: string) {
    const res = await apiFetch<{ success: boolean; data: AuthResponse }>(
        '/auth/login',
        {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            mockData: {
                success: true,
                data: {
                    accessToken: 'mock-token-' + Date.now(),
                    refreshToken: 'mock-refresh-' + Date.now(),
                    isNewUser: false
                }
            }
        }
    );

    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    return res.data;
}

// 로그아웃
export function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
}