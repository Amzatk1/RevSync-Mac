'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { UserRole } from '@/lib/types';

function roleSidebarType(role?: UserRole): 'rider' | 'tuner' | 'admin' {
    if (role === 'ADMIN') return 'admin';
    if (role === 'TUNER' || role === 'CREATOR') return 'tuner';
    return 'rider';
}

export default function AppLayout({
    children,
    title,
    subtitle,
    allowedRoles,
    actions,
}: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    allowedRoles?: UserRole[];
    actions?: React.ReactNode;
}) {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <div className="relative flex min-h-screen w-full overflow-hidden text-text-body">
                <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.13]" />
                <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.2]" />
                <div className="hero-orb -top-24 left-[10%] h-72 w-72 bg-primary/30" />
                <div className="hero-orb bottom-[-180px] right-[-60px] h-96 w-96 bg-orange-500/20" />

                <Sidebar role={roleSidebarType(user?.role)} />

                <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="glass-heavy accent-line sticky top-0 z-30 border-b border-white/10">
                        <div className="mx-auto flex w-full max-w-[1520px] items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                            <div className="min-w-0">
                                <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                                    RevSync Workspace
                                </p>
                                <h2 className="truncate text-2xl font-extrabold text-white sm:text-[1.78rem]">{title}</h2>
                                {subtitle && <p className="mt-1 line-clamp-1 text-sm text-text-muted">{subtitle}</p>}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {actions}
                                <button
                                    aria-label="Search"
                                    className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-text-muted hover:border-primary/40 hover:text-white sm:inline-flex"
                                >
                                    <span className="material-symbols-outlined mr-1 text-[16px]">search</span>
                                    Search
                                </button>
                                <button
                                    aria-label="Notifications"
                                    className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-text-muted hover:border-primary/40 hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(11,11,16,0.9)]" />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="relative flex-1 overflow-y-auto">
                        <div className="mx-auto w-full max-w-[1520px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-8 lg:pt-8">{children}</div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
