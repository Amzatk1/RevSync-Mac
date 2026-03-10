'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface NavItem {
    href: string;
    icon: string;
    label: string;
}

const riderNav: NavItem[] = [
    { href: '/marketplace', icon: 'storefront', label: 'Marketplace' },
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/downloads', icon: 'download', label: 'Downloads' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
];

const tunerNav: NavItem[] = [
    { href: '/tuner', icon: 'dashboard', label: 'Dashboard' },
    { href: '/tuner/upload', icon: 'upload_file', label: 'Upload' },
    { href: '/marketplace', icon: 'storefront', label: 'Marketplace' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
];

const adminNav: NavItem[] = [
    { href: '/admin', icon: 'rate_review', label: 'Review' },
    { href: '/admin/health', icon: 'monitoring', label: 'Health' },
    { href: '/marketplace', icon: 'storefront', label: 'Marketplace' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
];

function isItemActive(pathname: string, href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

export default function Sidebar({ role = 'rider' }: { role?: 'rider' | 'tuner' | 'admin' }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems = role === 'admin' ? adminNav : role === 'tuner' ? tunerNav : riderNav;
    const subtitle = role === 'admin' ? 'Admin Command' : role === 'tuner' ? 'Tuner Studio' : 'Rider Hub';
    const displayName = user ? user.first_name || user.username : 'Guest';

    return (
        <>
            <aside className="relative hidden h-screen w-[306px] shrink-0 lg:flex">
                <div className="app-panel relative z-10 m-4 flex w-full flex-col rounded-3xl p-4">
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(90%_70%_at_80%_0%,rgba(99,199,255,0.12),transparent_65%)]" />

                    <Link href="/" className="group relative z-10 mb-6 flex items-center gap-3 rounded-2xl border border-transparent p-2 hover:border-white/10 hover:bg-white/[0.02]">
                        <div className="app-panel-raised flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-black text-white">R</div>
                        <div>
                            <p className="text-xl font-extrabold text-white">RevSync</p>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">{subtitle}</p>
                        </div>
                    </Link>

                    <div className="relative z-10 mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">System Pulse</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-text-muted">Safety checks</span>
                            <span className="font-bold text-emerald-300">Active</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-sky-400 to-primary" />
                        </div>
                    </div>

                    <nav className="relative z-10 flex-1 space-y-2">
                        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted/70">Navigation</p>
                        {navItems.map((item) => {
                            const active = isItemActive(pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                                        active ? 'bg-sky-400/10 text-white ring-1 ring-sky-400/30' : 'text-text-muted hover:bg-white/[0.03] hover:text-white'
                                    }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[20px] transition-colors ${
                                            active ? 'text-sky-300' : 'text-text-muted group-hover:text-white'
                                        }`}
                                    >
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                    {active && <span className="ml-auto h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(99,199,255,0.45)]" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="relative z-10 mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900 text-text-muted">
                                {user?.profile?.photo_url ? (
                                    <img src={user.profile.photo_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined">person</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                                <p className="truncate text-xs text-text-muted">{user?.email || 'No email'}</p>
                            </div>
                            <button
                                onClick={logout}
                                title="Sign out"
                                aria-label="Sign out"
                                className="rounded-lg p-2 text-text-muted hover:bg-primary/10 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2 lg:hidden">
                <div className="glass mx-auto flex max-w-xl items-center justify-between rounded-2xl border border-white/10 px-2 py-2">
                    {navItems.slice(0, 4).map((item) => {
                        const active = isItemActive(pathname, item.href);
                        return (
                            <Link
                                key={`mobile-${item.href}`}
                                href={item.href}
                                className={`flex min-w-[72px] flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-semibold ${
                                    active ? 'bg-sky-400/12 text-white' : 'text-text-muted'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-sky-300' : 'text-text-muted'}`}>{item.icon}</span>
                                <span className="mt-1 leading-none">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
