import { getSupabaseBrowserClient, requireSupabaseBrowserClient } from '@/lib/supabase';

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
}

function persistSession(accessToken?: string, refreshToken?: string | null, isNewUser = false) {
    if (!accessToken) return;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('isLoggedIn', 'true');
    return {
        accessToken,
        refreshToken: refreshToken || '',
        isNewUser,
    };
}

// 회원가입
export async function signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const supabase = requireSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name, full_name: name },
        },
    });
    if (error) throw error;
    return persistSession(data.session?.access_token, data.session?.refresh_token, true) || {
        accessToken: '',
        refreshToken: '',
        isNewUser: true,
    };
}
// 로그인
export async function login(email: string, password: string): Promise<AuthResponse> {
    const supabase = requireSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return persistSession(data.session?.access_token, data.session?.refresh_token, false) || {
        accessToken: '',
        refreshToken: '',
        isNewUser: false,
    };
}

export async function signInWithGoogle() {
    const supabase = requireSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/oauth2/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
    });
    if (error) throw error;
}

// 로그아웃
export async function logout() {
    await getSupabaseBrowserClient()?.auth.signOut().catch((err) => {
        console.warn('Supabase sign-out failed:', err);
    });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
}
