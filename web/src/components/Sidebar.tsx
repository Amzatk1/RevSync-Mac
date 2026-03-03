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
    { href: '/downloads', icon: 'download', label: 'My Downloads' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
];

const tunerNav: NavItem[] = [
    { href: '/tuner', icon: 'dashboard', label: 'Dashboard' },
    { href: '/tuner/upload', icon: 'upload_file', label: 'Upload Tune' },
    { href: '/marketplace', icon: 'storefront', label: 'Marketplace' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
];

const adminNav: NavItem[] = [
    { href: '/admin', icon: 'rate_review', label: 'Content Review' },
    { href: '/admin/health', icon: 'monitoring', label: 'System Health' },
    { href: '/marketplace', icon: 'storefront', label: 'Marketplace' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar({ role = 'rider' }: { role?: 'rider' | 'tuner' | 'admin' }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems = role === 'admin' ? adminNav : role === 'tuner' ? tunerNav : riderNav;
    const subtitle = role === 'admin' ? 'Admin Command' : role === 'tuner' ? 'Tuner Studio' : 'Rider Hub';

    const displayName = user ? user.first_name || user.username : 'Guest';

    return (
        <aside className="relative hidden h-screen w-[300px] shrink-0 lg:flex">
            <div className="relative z-10 m-4 flex w-full flex-col rounded-3xl border border-white/10 bg-[linear-gradient(165deg,rgba(23,23,33,0.92),rgba(11,11,16,0.86))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                <Link href="/" className="group mb-7 flex items-center gap-3 rounded-2xl border border-transparent p-2 hover:border-white/10 hover:bg-white/[0.02]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-red-500 to-orange-400 text-xl font-black text-white shadow-[0_0_26px_rgba(234,16,60,0.35)]">
                        R
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-white">RevSync</p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">{subtitle}</p>
                    </div>
                </Link>

                <nav className="flex-1 space-y-2">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted/70">Navigation</p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                                    isActive
                                        ? 'bg-primary/15 text-white ring-1 ring-primary/35'
                                        : 'text-text-muted hover:bg-white/[0.03] hover:text-white'
                                }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-[20px] transition-colors ${
                                        isActive ? 'text-primary' : 'text-text-muted group-hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                                {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(234,16,60,0.8)]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
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
                            className="rounded-lg p-2 text-text-muted hover:bg-red-500/10 hover:text-red-300"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
