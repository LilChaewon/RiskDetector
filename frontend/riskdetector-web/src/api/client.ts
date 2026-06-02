import { getSupabaseBrowserClient } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

async function getToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? null;
        if (token) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('isLoggedIn', 'true');
            return token;
        }
    }
    return localStorage.getItem('accessToken');
}

function getGuestId(): string | null {
    if (typeof window === 'undefined') return null;
    const existing = localStorage.getItem('guestId');
    if (existing) return existing;
    const created = `guest-${crypto.randomUUID?.() || Date.now().toString(36)}`;
    localStorage.setItem('guestId', created);
    return created;
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit & { mockData?: T } = {}
): Promise<T> {

    if (IS_MOCK && options.mockData !== undefined) {
        await new Promise(r => setTimeout(r, 500));
        return options.mockData;
    }

    const { mockData: _mockData, ...fetchOptions } = options;
    void _mockData;

    const token = await getToken();
    const headers: Record<string, string> = {};

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // JWT 형식이 아닌 토큰(guest 등)은 헤더에 담지 않음 -> 백엔드가 쿠키를 보게 함
    if (token && token.includes('.')) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const guestId = getGuestId();
    if (guestId) {
        headers['X-Guest-Id'] = guestId;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        credentials: 'include',
        headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `API 에러:${res.status}`);
    }

    return res.json();
}
