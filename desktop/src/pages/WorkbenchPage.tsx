import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../lib/api';
import type { TuneListing, Vehicle } from '../lib/types';

// ─── Generate hex data ───────────────────────────────────────────────
function generateHexData(seed: number = 0): number[] {
    const data: number[] = [];
    for (let i = 0; i < 256; i++) {
        data.push(Math.floor(Math.abs(Math.sin(i + seed) * 255)) % 256);
    }
    return data;
}

// ─── Command Palette ─────────────────────────────────────────────────
interface PaletteCommand {
    id: string; label: string; icon: string; action: () => void; category: string;
}

export default function WorkbenchPage() {
    const [listings, setListings] = useState<TuneListing[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedListing, setSelectedListing] = useState<TuneListing | null>(null);
    const [hexData, setHexData] = useState<number[]>(generateHexData(0));
    const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
    const [consoleInput, setConsoleInput] = useState('');
    const [consoleLog, setConsoleLog] = useState<string[]>([
        '> RevSync Pro Serial Console v2.4.1',
        '> Type "help" for available commands',
        '> Waiting for connection...',
    ]);
    const [showPalette, setShowPalette] = useState(false);
    const [paletteSearch, setPaletteSearch] = useState('');
    const [explorerExpanded, setExplorerExpanded] = useState<Record<string, boolean>>({ tunes: true, vehicles: false });
    const consoleEndRef = useRef<HTMLDivElement>(null);

    // Fetch data
    useEffect(() => {
        api.get<any>('/v1/marketplace/browse/')
            .then(res => setListings(Array.isArray(res) ? res : res?.results || []))
            .catch(() => { });
        api.get<any>('/v1/garage/')
            .then(res => setVehicles(Array.isArray(res) ? res : res?.results || []))
            .catch(() => { });
    }, []);

    // Keyboard shortcut for command palette
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowPalette(p => !p);
                setPaletteSearch('');
            }
            if (e.key === 'Escape') setShowPalette(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // auto scroll console
    useEffect(() => { consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [consoleLog]);

    // Select listing → reload hex
    const selectListing = useCallback((listing: TuneListing) => {
        setSelectedListing(listing);
        setHexData(generateHexData(listing.title.charCodeAt(0)));
        setConsoleLog(prev => [...prev, `> Loaded: ${listing.title} (v${listing.latest_version_number || '?'})`]);
    }, []);

    // Console command handler
    const handleConsoleCommand = useCallback((cmd: string) => {
        const trimmed = cmd.trim().toLowerCase();
        setConsoleLog(prev => [...prev, `$ ${cmd}`]);

        if (trimmed === 'help') {
            setConsoleLog(prev => [...prev,
                '  help          — Show this menu',
                '  status        — ECU connection status',
                '  info          — Current tune info',
                '  clear         — Clear console',
                '  identify      — Read ECU ID',
                '  read [addr]   — Read memory at address',
                '  version       — Firmware version',
            ]);
        } else if (trimmed === 'clear') {
            setConsoleLog(['> Console cleared']);
        } else if (trimmed === 'status') {
            setConsoleLog(prev => [...prev, '  ECU: Simulated | Port: /dev/ttyUSB0 | Baud: 57600 | Status: READY']);
        } else if (trimmed === 'info') {
            if (selectedListing) {
                setConsoleLog(prev => [...prev,
                `  Tune: ${selectedListing.title}`,
                `  Version: ${selectedListing.latest_version_number || 'N/A'}`,
                `  Vehicle: ${selectedListing.vehicle_make} ${selectedListing.vehicle_model}`,
                `  Price: $${selectedListing.price}`,
                ]);
            } else {
                setConsoleLog(prev => [...prev, '  No tune loaded. Select one from Project Explorer.']);
            }
        } else if (trimmed === 'identify') {
            setConsoleLog(prev => [...prev, '  Sending IDENTIFY request...', '  ECU ID: 21175-1652 (Keihin)', '  FW: K-ECU-636-v3.1.2']);
        } else if (trimmed.startsWith('read ')) {
            const addr = trimmed.slice(5);
            const val = Math.floor(Math.random() * 256);
            setConsoleLog(prev => [...prev, `  [${addr}] = 0x${val.toString(16).toUpperCase().padStart(2, '0')} (${val})`]);
        } else if (trimmed === 'version') {
            setConsoleLog(prev => [...prev, '  RevSync Pro v2.4.1 (Build 8902)', '  Protocol: K-Line UDS v1.2']);
        } else {
            setConsoleLog(prev => [...prev, `  Unknown command: "${trimmed}". Type "help" for available commands.`]);
        }
        setConsoleInput('');
    }, [selectedListing]);

    // Command palette commands
    const commands: PaletteCommand[] = useMemo(() => [
        ...listings.map(l => ({
            id: `open-${l.id}`, label: `Open ${l.title}`, icon: 'folder_open',
            action: () => { selectListing(l); setShowPalette(false); }, category: 'Tunes',
        })),
        { id: 'cmd-connect', label: 'Connect to ECU', icon: 'usb', action: () => { window.location.hash = '/connect'; setShowPalette(false); }, category: 'Actions' },
        { id: 'cmd-flash', label: 'Open Flash Manager', icon: 'bolt', action: () => { window.location.href = '/flash'; setShowPalette(false); }, category: 'Navigation' },
        { id: 'cmd-maps', label: 'Open Map Editor', icon: 'map', action: () => { window.location.href = '/maps'; setShowPalette(false); }, category: 'Navigation' },
        { id: 'cmd-diag', label: 'Open Diagnostics', icon: 'monitoring', action: () => { window.location.href = '/diagnostics'; setShowPalette(false); }, category: 'Navigation' },
        { id: 'cmd-recovery', label: 'Open Recovery', icon: 'healing', action: () => { window.location.href = '/recovery'; setShowPalette(false); }, category: 'Navigation' },
        { id: 'cmd-batch', label: 'Open Batch Queue', icon: 'queue', action: () => { window.location.href = '/batch'; setShowPalette(false); }, category: 'Navigation' },
        { id: 'cmd-clear', label: 'Clear Console', icon: 'delete', action: () => { setConsoleLog(['> Console cleared']); setShowPalette(false); }, category: 'Actions' },
        { id: 'cmd-identify', label: 'Identify ECU', icon: 'fingerprint', action: () => { handleConsoleCommand('identify'); setShowPalette(false); }, category: 'Actions' },
    ], [listings, selectListing, handleConsoleCommand]);

    const filteredCommands = paletteSearch
        ? commands.filter(c => c.label.toLowerCase().includes(paletteSearch.toLowerCase()))
        : commands;

    return (
        <div className="flex-1 flex overflow-hidden relative">
            {/* ─── Project Explorer ───────────────────── */}
            <aside className="w-60 bg-[#0e0e11] border-r border-border-dark flex flex-col shrink-0 overflow-y-auto">
                <div className="p-3 border-b border-border-dark flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Explorer</span>
                    <button onClick={() => api.get<any>('/v1/marketplace/browse/').then(res => setListings(Array.isArray(res) ? res : res?.results || [])).catch(() => { })}
                        className="text-text-muted hover:text-white transition-colors" title="Refresh">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                </div>

                {/* Tunes section */}
                <div>
                    <button onClick={() => setExplorerExpanded(p => ({ ...p, tunes: !p.tunes }))}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">{explorerExpanded.tunes ? 'expand_more' : 'chevron_right'}</span>
                        TUNES ({listings.length})
                    </button>
                    {explorerExpanded.tunes && listings.map(listing => (
                        <button key={listing.id} onClick={() => selectListing(listing)}
                            className={`w-full text-left flex items-center gap-2 px-6 py-1.5 text-xs transition-colors truncate ${selectedListing?.id === listing.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}>
                            <span className="material-symbols-outlined text-sm">description</span>
                            <span className="truncate">{listing.title}</span>
                        </button>
                    ))}
                </div>

                {/* Vehicles section */}
                <div>
                    <button onClick={() => setExplorerExpanded(p => ({ ...p, vehicles: !p.vehicles }))}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">{explorerExpanded.vehicles ? 'expand_more' : 'chevron_right'}</span>
                        GARAGE ({vehicles.length})
                    </button>
                    {explorerExpanded.vehicles && vehicles.map(v => (
                        <div key={v.id} className="flex items-center gap-2 px-6 py-1.5 text-xs text-slate-400">
                            <span className="material-symbols-outlined text-sm">two_wheeler</span>
                            <span className="truncate">{v.year} {v.make} {v.model}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ─── Hex Editor ────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Tab bar */}
                <div className="h-9 bg-[#0e0e11] border-b border-border-dark flex items-center px-2 shrink-0">
                    {selectedListing ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-panel-dark rounded-t border border-b-0 border-border-dark text-xs text-white">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>memory</span>
                            {selectedListing.title}
                            <button onClick={() => setSelectedListing(null)} className="ml-2 text-text-muted hover:text-white">×</button>
                        </div>
                    ) : (
                        <span className="text-xs text-text-muted italic px-3">No file open — select a tune from Explorer or press Ctrl+K</span>
                    )}
                </div>

                {/* Hex grid */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                    {selectedListing ? (
                        <div>
                            <div className="flex gap-1 mb-2 text-text-muted sticky top-0 bg-bg-dark pb-1">
                                <span className="w-16 text-right pr-2">Offset</span>
                                {Array.from({ length: 16 }, (_, i) => (
                                    <span key={i} className="w-7 text-center">{i.toString(16).toUpperCase().padStart(2, '0')}</span>
                                ))}
                                <span className="ml-4">ASCII</span>
                            </div>
                            {Array.from({ length: 16 }, (_, row) => (
                                <div key={row} className="flex gap-1 hover:bg-white/[0.02]">
                                    <span className="w-16 text-right pr-2 text-primary/60">{(row * 16).toString(16).toUpperCase().padStart(6, '0')}</span>
                                    {Array.from({ length: 16 }, (_, col) => {
                                        const offset = row * 16 + col;
                                        const val = hexData[offset] ?? 0;
                                        return (
                                            <button key={col}
                                                onClick={() => setSelectedOffset(offset)}
                                                className={`w-7 text-center rounded cursor-pointer transition-colors ${selectedOffset === offset ? 'bg-primary text-white' : 'text-slate-300 hover:bg-primary/20'
                                                    }`}>
                                                {val.toString(16).toUpperCase().padStart(2, '0')}
                                            </button>
                                        );
                                    })}
                                    <span className="ml-4 text-text-muted">
                                        {Array.from({ length: 16 }, (_, col) => {
                                            const val = hexData[row * 16 + col] ?? 0;
                                            return val >= 32 && val <= 126 ? String.fromCharCode(val) : '.';
                                        }).join('')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-5xl text-text-muted/30">data_object</span>
                                <p className="text-text-muted mt-3">Select a tune from the explorer or press <kbd className="px-1.5 py-0.5 bg-border-dark rounded text-xs">Ctrl+K</kbd> to open command palette</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status bar */}
                {selectedOffset !== null && (
                    <div className="h-7 bg-[#0a0a0d] border-t border-border-dark flex items-center px-4 text-[11px] text-text-muted gap-6 shrink-0">
                        <span>Offset: 0x{selectedOffset.toString(16).toUpperCase().padStart(4, '0')}</span>
                        <span>Value: 0x{(hexData[selectedOffset] ?? 0).toString(16).toUpperCase().padStart(2, '0')} ({hexData[selectedOffset] ?? 0})</span>
                        <span>Row: {Math.floor(selectedOffset / 16)} Col: {selectedOffset % 16}</span>
                    </div>
                )}
            </div>

            {/* ─── Inspector + Console ────────────────── */}
            <aside className="w-72 bg-[#0e0e11] border-l border-border-dark flex flex-col shrink-0">
                {/* Inspector */}
                <div className="p-3 border-b border-border-dark">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Inspector</h3>
                    {selectedListing ? (
                        <div className="space-y-2">
                            {[
                                { label: 'Title', value: selectedListing.title },
                                { label: 'Tuner', value: selectedListing.tuner?.business_name || 'Unknown' },
                                { label: 'Version', value: selectedListing.latest_version_number || 'N/A' },
                                { label: 'Vehicle', value: `${selectedListing.vehicle_make} ${selectedListing.vehicle_model}` },
                                { label: 'Years', value: `${selectedListing.vehicle_year_start}–${selectedListing.vehicle_year_end}` },
                                { label: 'Price', value: `$${parseFloat(selectedListing.price).toFixed(2)}` },
                                { label: 'ID', value: selectedListing.id.slice(0, 8) + '...' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between text-xs">
                                    <span className="text-text-muted">{item.label}</span>
                                    <span className="text-white font-medium truncate ml-2">{item.value}</span>
                                </div>
                            ))}
                            <div className="mt-3 pt-3 border-t border-border-dark">
                                <div className="text-[10px] text-text-muted uppercase mb-1">Description</div>
                                <p className="text-xs text-slate-400 line-clamp-3">{selectedListing.description}</p>
                            </div>
                            <div className="bg-[#0a0a0d] p-2 rounded border border-border-dark mt-2">
                                <div className="text-[10px] text-text-muted uppercase mb-1">Package Hash</div>
                                <div className="text-xs font-mono text-primary break-all">{selectedListing.latest_version_id?.slice(0, 16) || 'N/A'}</div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-text-muted italic">No tune selected</p>
                    )}
                </div>

                {/* Serial Console */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-border-dark shrink-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Serial Console</span>
                        <button onClick={() => setConsoleLog(['> Console cleared'])} className="text-text-muted hover:text-white text-xs" title="Clear">
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 terminal-bg font-mono text-[11px]">
                        {consoleLog.map((line, i) => (
                            <div key={i} className={`leading-relaxed ${line.startsWith('$') ? 'text-primary' : line.includes('ERROR') ? 'text-red-400' : line.includes('✓') ? 'text-green-400' : 'text-emerald-400/80'}`}>
                                {line}
                            </div>
                        ))}
                        <div ref={consoleEndRef} />
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if (consoleInput.trim()) handleConsoleCommand(consoleInput); }}
                        className="flex items-center border-t border-border-dark shrink-0">
                        <span className="text-primary text-xs px-2 font-mono">$</span>
                        <input value={consoleInput} onChange={e => setConsoleInput(e.target.value)}
                            className="flex-1 bg-transparent text-xs text-white py-2 focus:outline-none font-mono placeholder:text-text-muted/50"
                            placeholder="Type a command..." />
                        <button type="submit" className="px-2 text-text-muted hover:text-primary transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* ─── Command Palette Modal ──────────────── */}
            {showPalette && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-24 bg-black/60" onClick={() => setShowPalette(false)}>
                    <div className="w-[500px] bg-panel-dark border border-border-dark rounded-xl command-shadow animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dark">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>terminal</span>
                            <input value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-text-muted" placeholder="Type a command..." autoFocus />
                            <kbd className="text-[10px] text-text-muted bg-border-dark px-1.5 py-0.5 rounded">ESC</kbd>
                        </div>
                        <div className="max-h-72 overflow-y-auto py-2">
                            {filteredCommands.length === 0 ? (
                                <div className="text-center py-8 text-text-muted text-sm">No matching commands</div>
                            ) : (
                                filteredCommands.map(cmd => (
                                    <button key={cmd.id} onClick={cmd.action}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-primary/10 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>{cmd.icon}</span>
                                        <span className="flex-1 text-left">{cmd.label}</span>
                                        <span className="text-[10px] text-text-muted uppercase">{cmd.category}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
