import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const PRIMARY_NAV = [
    { to: '/workbench', icon: 'apps', label: 'Workbench', short: 'WB' },
    { to: '/connect', icon: 'usb', label: 'Connect', short: 'CN' },
    { to: '/maps', icon: 'grid_view', label: 'Maps', short: 'MP' },
    { to: '/flash', icon: 'bolt', label: 'Flash', short: 'FL' },
    { to: '/diagnostics', icon: 'monitoring', label: 'Diagnostics', short: 'DG' },
    { to: '/batch', icon: 'queue', label: 'Batch', short: 'BQ' },
    { to: '/recovery', icon: 'healing', label: 'Recovery', short: 'RC' },
];

const UTILITY_NAV = [
    { to: '/legal/privacy', icon: 'gavel', label: 'Legal' },
];

function isActive(pathname: string, target: string) {
    return pathname === target || pathname.startsWith(`${target}/`);
}

export default function AppShell({ children }: { children: ReactNode }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const currentLabel = useMemo(
        () => PRIMARY_NAV.find((item) => isActive(location.pathname, item.to))?.label || 'RevSync Pro',
        [location.pathname]
    );

    return (
        <div className="rs-shell flex h-screen overflow-hidden text-[var(--rs-text-primary)]">
            <aside className="rs-rail flex w-[84px] shrink-0 flex-col items-center justify-between px-3 py-4">
                <div className="flex w-full flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
                        <span className="text-lg font-black tracking-tight text-white">RS</span>
                    </div>
                    <div className="rs-badge border-[rgba(99,199,255,0.18)] bg-[rgba(99,199,255,0.08)] text-[var(--rs-accent)]">
                        Pro
                    </div>

                    <nav className="mt-3 flex w-full flex-col gap-2">
                        {PRIMARY_NAV.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive: active }) =>
                                    `group relative flex h-[58px] w-full items-center justify-center rounded-[18px] border ${
                                        active
                                            ? 'border-[rgba(99,199,255,0.22)] bg-[rgba(99,199,255,0.12)] text-[var(--rs-accent)]'
                                            : 'border-transparent bg-transparent text-[var(--rs-text-tertiary)] hover:border-[var(--rs-stroke-soft)] hover:bg-white/[0.03] hover:text-white'
                                    }`
                                }
                                title={item.label}
                            >
                                {({ isActive: active }) => (
                                    <>
                                        <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                        <span className="pointer-events-none absolute left-[74px] hidden rounded-xl border border-white/10 bg-[rgba(10,14,20,0.98)] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_20px_40px_rgba(0,0,0,0.32)] group-hover:block">
                                            {item.label}
                                        </span>
                                        {active && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[var(--rs-accent)]" />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex w-full flex-col items-center gap-2">
                    {UTILITY_NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className="flex h-11 w-full items-center justify-center rounded-2xl border border-transparent text-[var(--rs-text-tertiary)] hover:border-[var(--rs-stroke-soft)] hover:bg-white/[0.03] hover:text-white"
                            title={item.label}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={logout}
                        className="flex h-11 w-full items-center justify-center rounded-2xl border border-transparent text-[var(--rs-text-tertiary)] hover:border-[rgba(234,16,60,0.24)] hover:bg-[rgba(234,16,60,0.08)] hover:text-white"
                        title="Sign out"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="glass flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--rs-stroke-soft)] px-6">
                    <div className="min-w-0">
                        <p className="rs-section-label">RevSync Pro Workspace</p>
                        <div className="mt-1 flex items-center gap-3">
                            <h1 className="truncate text-[1.45rem] font-[800] text-white">{currentLabel}</h1>
                            <span className="rounded-full border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-[var(--rs-text-secondary)]">
                                Safety-first execution
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="rs-toolbar-button min-w-[250px] justify-start">
                            <span className="material-symbols-outlined text-[18px]">search</span>
                            <span className="text-sm">Search commands, projects, or packages</span>
                            <span className="ml-auto rs-kbd">⌘K</span>
                        </button>

                        <div className="rs-badge border-[rgba(46,211,154,0.2)] bg-[rgba(46,211,154,0.09)] text-[var(--rs-success)]">
                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                            System ready
                        </div>

                        <div className="rounded-[16px] border border-[var(--rs-stroke-soft)] bg-white/[0.03] px-3 py-2 text-right">
                            <p className="text-sm font-semibold text-white">{user?.first_name || user?.email}</p>
                            <p className="text-[11px] text-[var(--rs-text-tertiary)]">Operator session</p>
                        </div>
                    </div>
                </header>

                <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>

                <footer className="flex h-9 shrink-0 items-center justify-between border-t border-[var(--rs-stroke-soft)] bg-[rgba(10,14,20,0.96)] px-5 text-[11px] text-[var(--rs-text-secondary)]">
                    <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[var(--rs-accent)]">memory</span>
                            RevSync Pro 2.4.1
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">usb</span>
                            Deterministic USB workflow
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">shield</span>
                            Signed package policy active
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>{currentTime.toLocaleTimeString()}</span>
                        <span className="rs-badge border-[var(--rs-stroke-soft)] bg-white/[0.03] text-[var(--rs-text-secondary)]">Ready for validation</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
