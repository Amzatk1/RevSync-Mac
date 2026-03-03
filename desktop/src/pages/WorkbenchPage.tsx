import { useState, useEffect } from 'react';
import api from '../lib/api';

const DEMO_HEX = [
    { offset: '00000000', bytes: ['4B', '61', '77', '61', '73', '61', '6B', '69', '20', '48', '65', '61', '76', '79', '20', '49'], ascii: 'Kawasaki Heavy I' },
    { offset: '00000010', bytes: ['6E', '64', '75', '73', '74', '72', '69', '65', '73', '00', '00', '00', 'FF', 'FF', 'FF', 'FF'], ascii: 'ndustries...ÿÿÿÿ' },
    { offset: '00000020', bytes: ['32', '11', '92', '00', '00', '00', '01', '5A', '58', '36', '33', '36', '45', '43', '55', '00'], ascii: '2....ZX636ECU.' },
    { offset: '00000030', bytes: ['AA', '55', '00', '00', 'F0', '0F', 'C7', '45', '00', '00', '00', '00', '00', '00', '00', '00'], ascii: 'ªU..ð.ÇE........' },
    { offset: '00000040', bytes: ['FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF', 'FF'], ascii: 'ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ' },
    { offset: '00000050', bytes: ['00', '01', '02', 'A1', 'B4', 'C3', 'D5', 'E6', 'F7', '08', '19', '2A', '3B', '4C', '5D', '6E'], ascii: '....´ÃÕæ÷...*;L]n' },
    { offset: '00000060', bytes: ['52', '65', '76', '53', '79', '6E', '63', '20', '50', '72', '6F', '00', '00', '00', '00', '00'], ascii: 'RevSync Pro.....' },
];

const HEADER_COLS = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F'];

interface Project { id: string; name: string; }

export default function WorkbenchPage() {
    const [selectedRow, setSelectedRow] = useState(2);
    const [selectedCol, setSelectedCol] = useState(1);
    const [offset, setOffset] = useState('0x0040E2');
    const [projects, setProjects] = useState<Project[]>([]);
    const [notes, setNotes] = useState('Stage 2 map with disabled exhaust valve servo logic. Top speed limiter removed.');
    const [consoleLines] = useState([
        { time: '14:02:22', text: '> Device Connected: K-Line Adapter v2.1 (COM3)', color: 'text-green-500' },
        { time: '14:02:23', text: '> Handshake initiated...', color: 'text-green-500' },
        { time: '14:02:24', text: '> ECU ID Received: 21175-1652', color: 'text-green-500' },
        { time: '14:02:25', text: '> Seed/Key Security Access: Granted', color: 'text-green-500' },
        { time: '14:03:01', text: '> Reading Memory Block 0x0040E0 - 0x0040F0', color: 'text-blue-400' },
    ]);

    useEffect(() => {
        api.get<{ results: any[] }>('/v1/marketplace/browse/').then(res => {
            setProjects(res.results?.map((t: any) => ({ id: t.id, name: t.name })).slice(0, 5) || []);
        }).catch(() => {
            setProjects([{ id: '1', name: 'ZX6R_Race_V2.bin' }, { id: '2', name: 'R1M_Stage1_2023.bin' }]);
        });
    }, []);

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* ── Explorer Panel ───────────────────────────── */}
            <section className="w-60 bg-bg-dark border-r border-border-dark flex flex-col shrink-0">
                <div className="px-4 py-3 border-b border-border-dark flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Explorer</span>
                    <button className="text-text-muted hover:text-white"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_horiz</span></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 text-sm">
                    <div className="mb-2">
                        <div className="flex items-center gap-1 py-1 px-2 text-white cursor-pointer hover:bg-panel-dark rounded">
                            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 16 }}>expand_more</span>
                            <span className="material-symbols-outlined text-primary mr-1" style={{ fontSize: 18 }}>folder_open</span>
                            <span className="text-sm font-medium">Active Projects</span>
                        </div>
                        <div className="pl-6 flex flex-col gap-0.5 mt-1 border-l border-border-dark ml-3">
                            {(projects.length > 0 ? projects : [{ id: '1', name: 'ZX6R_Race_V2.bin' }, { id: '2', name: 'R1M_Stage1_2023.bin' }]).map((p, i) => (
                                <div key={p.id} className={`flex items-center gap-2 py-1 px-2 cursor-pointer rounded truncate text-sm ${i === 0 ? 'text-white bg-primary/10 border-l-2 border-primary' : 'text-text-muted hover:text-white hover:bg-panel-dark'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: i === 0 ? '#60a5fa' : undefined }}>description</span>
                                    <span className="truncate">{p.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-2">
                        <div className="flex items-center gap-1 py-1 px-2 text-text-muted hover:text-white cursor-pointer hover:bg-panel-dark rounded">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                            <span className="material-symbols-outlined mr-1" style={{ fontSize: 18 }}>backup</span>
                            <span className="text-sm font-medium">ECU Backups</span>
                        </div>
                    </div>
                    <div className="mb-2">
                        <div className="flex items-center gap-1 py-1 px-2 text-text-muted hover:text-white cursor-pointer hover:bg-panel-dark rounded">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                            <span className="material-symbols-outlined mr-1" style={{ fontSize: 18 }}>verified</span>
                            <span className="text-sm font-medium">Verified Packages</span>
                        </div>
                    </div>
                </div>
                <div className="p-3 border-t border-border-dark bg-panel-dark">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-green-900 to-black border border-green-800 flex items-center justify-center">
                            <span className="font-bold text-xs text-green-500">K</span>
                        </div>
                        <div>
                            <div className="text-xs text-white font-medium">Kawasaki ZX-6R</div>
                            <div className="text-[10px] text-text-muted">636cc Inline-4</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Main Editor ──────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0e0e11]">
                {/* Editor Tabs */}
                <div className="flex items-center bg-panel-dark border-b border-border-dark">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0e0e11] text-white border-t-2 border-primary text-xs font-medium">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>data_object</span>
                        Hex Editor
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-white hover:bg-white/5 border-t-2 border-transparent text-xs font-medium">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>view_in_ar</span>
                        3D Map
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-white hover:bg-white/5 border-t-2 border-transparent text-xs font-medium">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>table_chart</span>
                        Fuel Tables
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 p-2 border-b border-border-dark">
                    <div className="flex bg-panel-dark border border-border-dark rounded overflow-hidden">
                        <button className="px-2 py-1 hover:bg-white/10 text-text-muted hover:text-white"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>undo</span></button>
                        <button className="px-2 py-1 hover:bg-white/10 text-text-muted hover:text-white"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>redo</span></button>
                    </div>
                    <div className="h-4 w-px bg-border-dark mx-1" />
                    <span className="text-xs text-text-muted">Offset:</span>
                    <input value={offset} onChange={e => setOffset(e.target.value)} className="bg-panel-dark border border-border-dark rounded px-2 py-0.5 text-xs text-primary font-mono w-24 focus:outline-none focus:border-primary" />
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-text-muted">View:</span>
                        <select className="bg-panel-dark border border-border-dark rounded px-2 py-0.5 text-xs text-white focus:outline-none">
                            <option>16 Bytes</option><option>32 Bytes</option><option>8 Bytes</option>
                        </select>
                    </div>
                </div>

                {/* Hex Grid */}
                <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-6">
                    <div className="flex border-b border-border-dark pb-1 mb-1 sticky top-0 bg-[#0e0e11] z-10">
                        <div className="w-24 text-primary opacity-50">Offset</div>
                        <div className="flex-1 flex gap-3">
                            {HEADER_COLS.map(h => <span key={h} className="w-6 text-center text-text-muted text-xs">{h}</span>)}
                        </div>
                        <div className="w-40 pl-4 border-l border-border-dark text-text-muted">ASCII</div>
                    </div>
                    {DEMO_HEX.map((row, ri) => (
                        <div key={row.offset} className={`flex rounded cursor-text ${ri === selectedRow ? 'bg-primary/10' : 'hover:bg-white/5'}`} onClick={() => setSelectedRow(ri)}>
                            <div className="w-24 text-primary opacity-70">{row.offset}</div>
                            <div className="flex-1 flex gap-3">
                                {row.bytes.map((b, ci) => (
                                    <span key={ci} onClick={(e) => { e.stopPropagation(); setSelectedRow(ri); setSelectedCol(ci); }}
                                        className={`w-6 text-center transition-colors ${ri === selectedRow && ci === selectedCol ? 'text-white font-bold bg-primary/40 rounded' : b === 'FF' ? 'text-text-muted' : b === 'AA' || b === '55' ? 'text-orange-400' : 'text-slate-300'}`}>
                                        {b}
                                    </span>
                                ))}
                            </div>
                            <div className="w-40 pl-4 border-l border-border-dark text-emerald-400 opacity-60 text-xs">{row.ascii}</div>
                        </div>
                    ))}
                </div>

                {/* Terminal */}
                <div className="h-44 border-t border-border-dark bg-panel-dark flex flex-col shrink-0">
                    <div className="flex items-center border-b border-border-dark px-2">
                        <button className="px-3 py-1.5 text-xs text-primary border-b-2 border-primary font-medium">Serial Console</button>
                        <button className="px-3 py-1.5 text-xs text-text-muted hover:text-white border-b-2 border-transparent">Problems (0)</button>
                        <button className="px-3 py-1.5 text-xs text-text-muted hover:text-white border-b-2 border-transparent">Output</button>
                    </div>
                    <div className="flex-1 p-2 font-mono text-xs overflow-y-auto terminal-bg">
                        {consoleLines.map((l, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-text-muted">[{l.time}]</span>
                                <span className={l.color}>{l.text}</span>
                            </div>
                        ))}
                        <div className="flex gap-2 animate-pulse"><span className="text-text-muted">[14:03:05]</span><span className="text-white">_</span></div>
                    </div>
                </div>
            </div>

            {/* ── Inspector Panel ──────────────────────────── */}
            <aside className="w-64 bg-panel-dark border-l border-border-dark flex flex-col shrink-0">
                <div className="px-4 py-3 border-b border-border-dark">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Inspector</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
                    {/* Verification Badge */}
                    <div className="bg-black/20 border border-green-900/50 rounded-lg p-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10"><span className="material-symbols-outlined text-green-500" style={{ fontSize: 48 }}>verified_user</span></div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-500" style={{ fontSize: 18 }}>check_circle</span>
                            <h3 className="text-sm font-semibold text-green-400">Package Verified</h3>
                        </div>
                        <p className="text-[11px] text-text-muted mb-3">Digital signature valid.</p>
                        <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex justify-between"><span className="text-text-muted">Algorithm</span><span className="text-white font-mono">ECDSA-SHA256</span></div>
                            <div className="flex justify-between"><span className="text-text-muted">Signed By</span><span className="text-white">RevSync Root CA</span></div>
                        </div>
                    </div>

                    {/* Checksums */}
                    <div className="flex flex-col gap-2">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Checksums</h4>
                        <div className="bg-[#0e0e11] p-2 rounded border border-border-dark">
                            <div className="text-[9px] text-text-muted uppercase mb-0.5">SHA-256</div>
                            <div className="text-xs font-mono text-primary break-all">8f4b2e...a1c9</div>
                        </div>
                        <div className="bg-[#0e0e11] p-2 rounded border border-border-dark flex justify-between items-center">
                            <div>
                                <div className="text-[9px] text-text-muted uppercase mb-0.5">CVN</div>
                                <div className="text-xs font-mono text-white">4E2A1109</div>
                            </div>
                            <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">MATCH</span>
                        </div>
                    </div>

                    {/* Compatibility */}
                    <div className="flex flex-col gap-1.5">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Compatibility</h4>
                        {[['Make', 'Kawasaki'], ['Model', 'Ninja ZX-6R'], ['Year', '2019-2023'], ['Region', 'EU/US']].map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between py-1 border-b border-border-dark border-dashed text-[11px]">
                                <span className="text-text-muted">{k}</span><span className="text-white">{v}</span>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Notes</h4>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                            className="w-full h-20 bg-[#0e0e11] border border-border-dark rounded p-2 text-xs text-white focus:outline-none focus:border-primary resize-none" />
                    </div>

                    <button className="mt-auto w-full bg-primary hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save_as</span>
                        Sign & Save Package
                    </button>
                </div>
            </aside>
        </div>
    );
}
