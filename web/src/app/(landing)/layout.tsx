'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
    { href: '#features', label: 'Capabilities' },
    { href: '#workflow', label: 'Workflow' },
    { href: '#platforms', label: 'Platforms' },
    { href: '#trust', label: 'Trust' },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    return (
        <div className="app-shell relative flex min-h-screen w-full flex-col overflow-hidden bg-background-dark text-text-body">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.06]" />
            <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.16]" />
            <div className="hero-orb -top-24 right-[-120px] h-[420px] w-[420px] bg-primary/26" />
            <div className="hero-orb bottom-[-220px] left-[-110px] h-[480px] w-[480px] bg-sky-400/12" />

            <div className="accent-line relative z-20 border-b border-white/10 bg-[rgba(8,11,17,0.88)] backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-5 py-2.5 text-[11px] font-semibold text-text-muted lg:px-8">
                    <p className="hidden sm:block">Cryptographically signed tune delivery with compatibility scoring, backup-first execution, and recovery workflows.</p>
                    <p className="sm:hidden">Signed tune delivery and recovery-first flashing.</p>
                    <div className="rs-status-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                        <span className="material-symbols-outlined text-[12px] text-emerald-300">verified</span>
                        Safety Gates Active
                    </div>
                </div>
            </div>

            <header className="glass sticky top-0 z-50 border-b border-white/10">
                <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-6 px-5 py-4 lg:px-8">
                    <Link href="/" className="group inline-flex items-center gap-3">
                        <div className="app-panel-raised flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white">R</div>
                        <div>
                            <p className="text-lg font-extrabold text-white">RevSync</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Performance Command Layer</p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-7 lg:flex">
                        {navItems.map((item) => (
                            <a key={item.href} className="text-sm font-semibold text-text-muted hover:text-white" href={item.href}>
                                {item.label}
                            </a>
                        ))}
                        <Link className="text-sm font-semibold text-text-muted hover:text-white" href="/downloads">
                            Downloads
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {!loading &&
                            (user ? (
                                <Link href="/dashboard" className="rs-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">
                                    Open Workspace
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-text-muted hover:border-white/20 hover:text-white sm:block">
                                        Sign In
                                    </Link>
                                    <Link href="/register" className="rs-button-primary rounded-xl px-4 py-2 text-sm font-bold">
                                        Create Account
                                    </Link>
                                </>
                            ))}
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex flex-1 flex-col items-center">{children}</main>

            <footer className="relative z-10 mt-16 border-t border-white/10 bg-[rgba(8,11,17,0.9)]">
                <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-5 py-12 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-[1.25fr_0.85fr_0.85fr]">
                        <div className="max-w-xl">
                            <div className="rs-status-chip mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                                Premium safety-critical tuning infrastructure
                            </div>
                            <h3 className="text-2xl font-extrabold text-white">Desktop-grade control, mobile-grade guidance, and a trust-first marketplace.</h3>
                            <p className="mt-3 text-sm text-text-muted">
                                RevSync unifies tune discovery, entitlement, validation, and guided flashing into one restrained interface language across every surface.
                            </p>
                        </div>

                        <div>
                            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Platform</p>
                            <div className="space-y-2 text-sm text-text-muted">
                                <a className="block hover:text-white" href="#features">
                                    Capabilities
                                </a>
                                <Link className="block hover:text-white" href="/marketplace">
                                    Marketplace
                                </Link>
                                <Link className="block hover:text-white" href="/downloads">
                                    Downloads
                                </Link>
                                <Link className="block hover:text-white" href="/legal">
                                    Legal Center
                                </Link>
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Policies</p>
                            <div className="space-y-2 text-sm text-text-muted">
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

                    <div className="border-t border-white/10 pt-5 text-xs text-text-muted">© {new Date().getFullYear()} RevSync Performance. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
}
