'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background-dark">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.12]" />
            <div className="hero-orb -top-32 right-[-120px] h-[420px] w-[420px] bg-primary/30" />
            <div className="hero-orb bottom-[-180px] left-[-140px] h-[480px] w-[480px] bg-orange-500/20" />

            <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(9,9,12,0.72)] backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-[1260px] items-center justify-between gap-6 px-5 py-4 lg:px-8">
                    <Link href="/" className="group inline-flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-red-500 to-orange-400 text-lg font-black text-white shadow-[0_0_24px_rgba(234,16,60,0.35)]">
                            R
                        </div>
                        <div>
                            <p className="text-lg font-extrabold text-white">RevSync</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Performance Cloud</p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-7 lg:flex">
                        <a className="text-sm font-medium text-text-muted hover:text-white" href="#features">
                            Features
                        </a>
                        <a className="text-sm font-medium text-text-muted hover:text-white" href="#workflow">
                            Workflow
                        </a>
                        <a className="text-sm font-medium text-text-muted hover:text-white" href="#trust">
                            Trust
                        </a>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {!loading &&
                            (user ? (
                                <Link
                                    href="/dashboard"
                                    className="rounded-xl border border-primary/35 bg-primary/15 px-4 py-2 text-sm font-bold text-white hover:bg-primary/25"
                                >
                                    Open Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="hidden rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-text-muted hover:border-white/30 hover:text-white sm:block"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="rounded-xl bg-gradient-to-r from-primary to-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_28px_rgba(234,16,60,0.35)] hover:from-red-600 hover:to-primary"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            ))}
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex flex-1 flex-col items-center">{children}</main>

            <footer className="relative z-10 mt-20 border-t border-white/10 bg-[rgba(11,11,16,0.75)]">
                <div className="mx-auto flex w-full max-w-[1260px] flex-col gap-10 px-5 py-12 lg:px-8">
                    <div className="flex flex-col justify-between gap-10 md:flex-row">
                        <div className="max-w-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                                Built for Riders + Tuners
                            </div>
                            <h3 className="text-2xl font-extrabold text-white">Fast, safe ECU tuning without the shop friction.</h3>
                            <p className="mt-3 text-sm text-text-muted">
                                RevSync unifies tune discovery, purchase, validation, and flash execution into one premium workflow.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-10 text-sm">
                            <div>
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Platform</p>
                                <div className="space-y-2 text-text-muted">
                                    <a className="block hover:text-white" href="#features">
                                        Features
                                    </a>
                                    <Link className="block hover:text-white" href="/marketplace">
                                        Marketplace
                                    </Link>
                                    <a className="block hover:text-white" href="#workflow">
                                        Workflow
                                    </a>
                                </div>
                            </div>
                            <div>
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Legal</p>
                                <div className="space-y-2 text-text-muted">
                                    <Link className="block hover:text-white" href="/legal/privacy">
                                        Privacy
                                    </Link>
                                    <Link className="block hover:text-white" href="/legal/terms">
                                        Terms
                                    </Link>
                                    <Link className="block hover:text-white" href="/legal/safety-disclaimer">
                                        Safety Disclaimer
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-5 text-xs text-text-muted">
                        © {new Date().getFullYear()} RevSync Performance. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
