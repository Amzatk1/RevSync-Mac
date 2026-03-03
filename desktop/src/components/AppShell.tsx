import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const NAV_ITEMS = [
    { to: '/workbench', icon: 'home_repair_service', label: 'Workbench' },
    { to: '/connect', icon: 'usb', label: 'Connect' },
    { to: '/maps', icon: 'map', label: 'Map Editor' },
    { to: '/flash', icon: 'bolt', label: 'Flash' },
    { to: '/diagnostics', icon: 'monitoring', label: 'Diagnostics' },
    { to: '/batch', icon: 'queue', label: 'Batch Queue' },
    { to: '/recovery', icon: 'healing', label: 'Recovery' },
];

export default function AppShell({ children }: { children: ReactNode }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const currentPage = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label || 'RevSync Pro';

    return (
        <div className="h-screen flex flex-col bg-bg-dark overflow-hidden select-none">
            {/* ─── Title Bar ──────────────────────────────────────── */}
            <header className="flex items-center justify-between border-b border-border-dark bg-panel-dark px-4 py-2 h-12 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 mr-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>memory</span>
                        <h2 className="text-sm font-semibold tracking-wide text-white">
                            RevSync Pro <span className="text-text-muted font-normal">— {currentPage}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-bg-dark border border-border-dark">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-mono text-text-muted">SYSTEM READY</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                        <span>{user?.first_name || user?.email}</span>
                    </div>
                    <button onClick={logout} className="text-text-muted hover:text-primary transition-colors" title="Sign Out">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* ─── Sidebar ──────────────────────────────────────── */}
                <aside className="w-16 flex flex-col items-center bg-panel-dark border-r border-border-dark py-4 gap-1 shrink-0">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `group relative flex justify-center w-full py-2 transition-colors ${isActive ? '' : ''}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-2 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary/20 text-primary'
                                            : 'text-text-muted hover:text-white hover:bg-border-dark'
                                        }`}>
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <div className="absolute left-14 top-2 bg-black text-xs px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                                        {item.label}
                                    </div>
                                </>
                            )}
                        </NavLink>
                    ))}

                    <div className="mt-auto group relative">
                        <NavLink
                            to="/legal/privacy"
                            className={({ isActive }) =>
                                `p-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-text-muted hover:text-white hover:bg-border-dark'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">gavel</span>
                        </NavLink>
                        <div className="absolute left-14 top-2 bg-black text-xs px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                            Legal
                        </div>
                    </div>
                </aside>

                {/* ─── Content ──────────────────────────────────────── */}
                <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
                    {children}
                </main>
            </div>

            {/* ─── Status Bar ──────────────────────────────────────── */}
            <footer className="h-7 bg-primary text-white flex items-center justify-between px-4 text-[11px] font-medium shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>usb</span>
                        <span>/dev/ttyUSB0</span>
                    </div>
                    <span className="opacity-60">57600 baud</span>
                    <span className="opacity-60">ECU: Simulated</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                    <span>System Ready</span>
                </div>
            </footer>
        </div>
    );
}
