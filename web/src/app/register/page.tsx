'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import type { UserRole } from '@/lib/types';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'RIDER' as UserRole,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            router.push('/dashboard');
        } catch (err: unknown) {
            const ex = err as { uiMessage?: string; data?: Record<string, string[]> };
            if (ex?.data) {
                const first = Object.values(ex.data).flat()[0];
                setError(typeof first === 'string' ? first : ex?.uiMessage || 'Registration failed');
            } else {
                setError(ex?.uiMessage || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.1]" />
            <div className="hero-orb -top-24 left-[-120px] h-[420px] w-[420px] bg-sky-400/14" />
            <div className="hero-orb bottom-[-180px] right-[-120px] h-[460px] w-[460px] bg-primary/16" />

            <div className="app-panel-raised relative z-10 w-full max-w-3xl rounded-[30px] p-6 sm:p-10">
                <Link href="/" className="mb-8 inline-flex items-center gap-3">
                    <div className="app-panel flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white">R</div>
                    <div>
                        <p className="text-xl font-extrabold text-white">RevSync</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Create Account</p>
                    </div>
                </Link>

                <div className="mb-7">
                    <p className="section-kicker">Get Started</p>
                    <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Build your tuning workspace</h1>
                    <p className="mt-2 text-sm text-text-muted">Create your account to browse, buy, and flash with confidence.</p>
                </div>

                {error && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">First Name</label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={(e) => set('first_name', e.target.value)}
                                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                                placeholder="Alex"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Last Name</label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={(e) => set('last_name', e.target.value)}
                                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                                placeholder="Rider"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Username</label>
                        <input
                            type="text"
                            required
                            value={form.username}
                            onChange={(e) => set('username', e.target.value)}
                            className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                            placeholder="alexrider"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Email</label>
                            <input
                                type="email"
                            required
                            value={form.email}
                            onChange={(e) => set('email', e.target.value)}
                            className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>
                        <div>
                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Password</label>
                            <input
                                type="password"
                                required
                            minLength={8}
                            value={form.password}
                            onChange={(e) => set('password', e.target.value)}
                            className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                            placeholder="Min. 8 characters"
                        />
                    </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Choose role</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {([
                                ['RIDER', 'sports_motorsports', 'Rider', 'Buy, flash, and track tune performance'],
                                ['TUNER', 'engineering', 'Tuner', 'Publish and manage commercial tunes'],
                            ] as const).map(([role, icon, label, desc]) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => set('role', role)}
                                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                                        form.role === role
                                            ? 'border-sky-400/35 bg-sky-400/10 shadow-[0_0_26px_rgba(99,199,255,0.15)]'
                                            : 'border-white/12 bg-white/[0.02] hover:border-white/25'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined mb-2 block text-[20px] ${form.role === role ? 'text-sky-300' : 'text-text-muted'}`}>{icon}</span>
                                    <p className="text-sm font-bold text-white">{label}</p>
                                    <p className="mt-1 text-xs text-text-muted">{desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="rs-button-primary mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Create Account'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-text-muted">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:text-primary-light">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
