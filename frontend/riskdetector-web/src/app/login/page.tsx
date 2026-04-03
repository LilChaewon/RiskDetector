'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup } from '@/api/auth';

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
            router.push('/');
        } catch (err: any) {
            setError(err.message || '오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0FDF4]">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[720px]">

                {/* 제목 */}
                <h1 className="text-2xl font-bold mb-6 text-center text-[#059669]">
                    RiskDetector
                </h1>

                {/* 탭 버튼 */}
                <div className="flex mb-6 border-b">
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors ${mode === 'login'
                                ? 'border-b-2 border-[#059669] text-[#059669] font-bold'
                                : 'text-gray-400'
                            }`}
                        onClick={() => setMode('login')}
                    >
                        로그인
                    </button>

                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors ${mode === 'signup'
                                ? 'border-b-2 border-[#059669] text-[#059669] font-bold'
                                : 'text-gray-400'
                            }`}
                        onClick={() => setMode('signup')}
                    >
                        회원가입
                    </button>

                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* 회원가입일 때만 이름 */}
                    {mode === 'signup' && (
                        <input
                            type="text"
                            placeholder="이름"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#059669]"
                            required
                        />
                    )}

                    {/* 이메일 */}
                    <input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#059669]"
                        required
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#059669]"
                        required
                    />
                    {/* 에러 */}
                    {error && (
                        <p className="text-sm text-[#DC2626]">{error}</p>
                    )}

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#059669] text-white py-3 rounded-xl font-medium
                       disabled:opacity-50 hover:bg-[#047857] transition-colors"
                    >
                        {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
                    </button>

                </form>
            </div>
        </div>
    );
}