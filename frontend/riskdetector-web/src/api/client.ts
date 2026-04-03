const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit & { mockData?: T } = {}
): Promise<T> {

    if (IS_MOCK && options.mockData !== undefined) {
        await new Promise(r => setTimeout(r, 500));
        return options.mockData;
    }

    const { mockData, ...fetchOptions } = options;

    const token = getToken();
    const headers: Record<string, string> = {};

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `API 에러:${res.status}`);
    }

    return res.json();
}