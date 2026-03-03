import { type ReactNode, useState, useEffect } from 'react';
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

const MENU_ITEMS = ['File', 'Edit', 'View', 'Tools', 'Help'];

export default function AppShell({ children }: { children: ReactNode }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const currentPage = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label || 'RevSync Pro';

    return (
        <div className="h-screen flex flex-col bg-bg-dark overflow-hidden select-none font-display">
            {/* ─── Title Bar ──────────────────────────────────────── */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border-dark bg-panel-dark px-4 py-2 h-12 shrink-0">
                <div className="flex items-center gap-4">
                    {/* Mac-style window controls */}
                    <div className="flex gap-2 mr-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-100">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>memory</span>
                        <h2 className="text-sm font-semibold leading-tight tracking-wide">
                            RevSync Pro <span className="text-text-muted font-normal">— {currentPage}</span>
                        </h2>
                    </div>
                </div>

                {/* Menu bar */}
                <div className="flex items-center bg-bg-dark rounded border border-border-dark p-1">
                    {MENU_ITEMS.map(item => (
                        <button key={item} className="px-3 py-1 text-xs text-text-muted hover:text-white transition-colors">
                            {item}
                        </button>
                    ))}
                </div>

                {/* Right side: status + user + window controls */}
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
                    <div className="h-4 w-px bg-border-dark mx-1" />
                    <div className="flex gap-1">
                        <button className="flex items-center justify-center rounded bg-border-dark text-text-muted hover:text-white w-7 h-7 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>minimize</span>
                        </button>
                        <button className="flex items-center justify-center rounded bg-border-dark text-text-muted hover:text-white w-7 h-7 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>crop_square</span>
                        </button>
                        <button className="flex items-center justify-center rounded bg-border-dark text-text-muted hover:text-primary w-7 h-7 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* ─── Sidebar ──────────────────────────────────────── */}
                <aside className="w-16 flex flex-col items-center bg-panel-dark border-r border-border-dark py-4 gap-1 shrink-0 z-10">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className="group relative flex justify-center w-full py-2 transition-colors"
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

                    <div className="mt-auto flex flex-col gap-1">
                        <div className="group relative flex justify-center w-full">
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
                        <div className="group relative flex justify-center w-full">
                            <button className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-border-dark transition-colors">
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                            <div className="absolute left-14 top-2 bg-black text-xs px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                                Settings
                            </div>
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
                <div className="flex items-center gap-4">
                    <span className="opacity-60 font-mono">{currentTime.toLocaleTimeString()}</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                        <span>System Ready</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
