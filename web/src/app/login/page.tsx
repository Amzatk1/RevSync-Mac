'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ email, password });
            router.push('/dashboard');
        } catch (err: unknown) {
            const ex = err as { uiMessage?: string };
            setError(ex?.uiMessage || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-dark px-4 py-10">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.14]" />
            <div className="hero-orb -top-24 right-[-120px] h-[420px] w-[420px] bg-primary/28" />
            <div className="hero-orb bottom-[-160px] left-[-120px] h-[430px] w-[430px] bg-orange-500/20" />

            <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(20,20,28,0.92),rgba(10,10,14,0.9))] lg:grid-cols-2">
                <div className="hidden border-r border-white/10 p-10 lg:block">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-red-500 to-orange-400 text-lg font-black text-white">R</div>
                        <div>
                            <p className="text-xl font-extrabold text-white">RevSync</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Performance Cloud</p>
                        </div>
                    </Link>

                    <h1 className="mt-14 text-4xl font-black leading-tight text-white">Command your bike with a cleaner, safer tuning stack.</h1>
                    <p className="mt-4 text-sm leading-relaxed text-text-muted">
                        Sign in to access your dashboard, purchased tune library, flash history, and role-based workflows.
                    </p>

                    <div className="mt-10 space-y-3">
                        {['Verified tune marketplace', 'Instant download access', 'Secure flash pipeline'].map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
                                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                                <span className="text-sm text-text-body">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 sm:p-10">
                    <div className="mb-8">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Welcome Back</p>
                        <h2 className="mt-2 text-3xl font-black text-white">Sign in to your account</h2>
                        <p className="mt-2 text-sm text-text-muted">Continue where you left off.</p>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-600 text-sm font-bold text-white shadow-[0_12px_30px_rgba(234,16,60,0.35)] hover:from-red-600 hover:to-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-text-muted">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="font-semibold text-primary hover:text-primary-light">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
