import { useState } from 'react';

const RPM_LABELS = ['1000', '2000', '3000', '4000', '5000', '6000', '8000', '10000', '12000', '13500', '15000', '16000'];
const TPS_LABELS = ['100', '90', '80', '70', '60', '50', '40', '30', '20', '10', '0'];

// Realistic AFR fuel map data (RPM × TPS)
const FUEL_MAP: number[][] = [
    [13.2, 13.1, 13.0, 12.9, 12.8, 12.8, 12.7, 12.6, 12.5, 12.4, 12.3, 12.2],
    [13.5, 13.4, 13.3, 13.2, 13.1, 13.0, 12.9, 12.8, 12.7, 12.6, 12.5, 12.4],
    [13.8, 13.7, 13.6, 13.5, 13.4, 13.3, 13.2, 13.1, 13.0, 12.9, 12.8, 12.7],
    [14.0, 13.9, 13.8, 13.7, 13.6, 13.5, 13.4, 13.3, 13.2, 13.1, 13.0, 12.9],
    [14.2, 14.1, 14.0, 13.9, 13.8, 13.7, 13.6, 13.5, 13.4, 13.3, 13.2, 13.1],
    [14.4, 14.3, 14.2, 14.1, 14.0, 13.9, 13.8, 13.7, 13.6, 13.5, 13.4, 13.3],
    [14.5, 14.4, 14.3, 14.2, 14.1, 14.0, 13.9, 13.8, 13.7, 13.6, 13.5, 13.4],
    [14.6, 14.5, 14.4, 14.3, 14.2, 14.1, 14.0, 13.9, 13.8, 13.7, 13.6, 13.5],
    [14.7, 14.6, 14.5, 14.4, 14.3, 14.2, 14.1, 14.0, 13.9, 13.8, 13.7, 13.6],
    [14.7, 14.7, 14.7, 14.7, 14.6, 14.5, 14.4, 14.3, 14.2, 14.1, 14.0, 13.9],
    [14.7, 14.7, 14.7, 14.7, 14.7, 14.7, 14.7, 14.7, 14.7, 14.7, 14.7, 14.7],
];

function getCellColor(val: number): string {
    if (val <= 12.5) return 'bg-map-high/90';
    if (val <= 13.0) return 'bg-map-high/60';
    if (val <= 13.5) return 'bg-map-mid/80';
    if (val <= 14.0) return 'bg-map-low/60';
    if (val <= 14.4) return 'bg-map-low/30';
    return 'bg-map-low/10';
}

export default function MapEditorPage() {
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 4 });
    const [mapData, setMapData] = useState(FUEL_MAP);
    const [adjustVal, setAdjustVal] = useState('1.0');

    const applyAdjust = (pct: number) => {
        if (!selectedCell) return;
        const copy = mapData.map(r => [...r]);
        copy[selectedCell.row][selectedCell.col] = +(copy[selectedCell.row][selectedCell.col] * (1 + pct / 100)).toFixed(1);
        setMapData(copy);
    };

    const sv = selectedCell ? mapData[selectedCell.row][selectedCell.col] : null;

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* ── Main Editor Area ─────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 bg-bg-dark">
                {/* Context Header */}
                <div className="flex items-center justify-between border-b border-border-dark px-6 py-3 bg-panel-dark/50">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                            <span>Projects</span><span className="material-symbols-outlined" style={{ fontSize: 12 }}>chevron_right</span>
                            <span>YZF-R1 2024 Stage 2</span><span className="material-symbols-outlined" style={{ fontSize: 12 }}>chevron_right</span>
                            <span className="text-primary">Fuel Map 1</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            Fuel Map: Main Injection
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">CYL 1-4</span>
                        </h1>
                    </div>
                    <div className="flex items-center bg-bg-dark rounded-lg p-1 border border-border-dark">
                        <button className="p-2 text-text-muted hover:text-white hover:bg-panel-dark rounded"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>undo</span></button>
                        <button className="p-2 text-text-muted hover:text-white hover:bg-panel-dark rounded"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>redo</span></button>
                        <div className="w-px h-5 bg-border-dark mx-1" />
                        <button className="p-2 text-text-muted hover:text-white hover:bg-panel-dark rounded"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_out</span></button>
                        <button className="p-2 text-text-muted hover:text-white hover:bg-panel-dark rounded"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_in</span></button>
                        <div className="w-px h-5 bg-border-dark mx-1" />
                        <button className="flex items-center gap-2 px-3 py-1.5 text-white bg-panel-dark rounded text-sm font-medium">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>view_in_ar</span>3D View
                        </button>
                        <button className="p-2 text-primary hover:bg-primary/10 rounded"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>palette</span></button>
                    </div>
                </div>

                {/* Split: 2D + 3D */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 2D Heatmap */}
                    <div className="flex-1 overflow-auto p-6 relative">
                        <div className="absolute top-4 left-4 z-10 bg-panel-dark/90 backdrop-blur border border-border-dark p-2 rounded text-[11px] font-mono text-text-muted">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-map-low rounded-sm" /> Lean / Low Load</div>
                            <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 bg-map-high rounded-sm" /> Rich / High Load</div>
                        </div>
                        <div className="min-w-[700px] pl-10 pb-12">
                            <div className="flex">
                                {/* Y-axis labels */}
                                <div className="flex flex-col justify-between pr-2 text-right text-[10px] font-mono text-amber-400 py-0.5" style={{ height: TPS_LABELS.length * 32 }}>
                                    {TPS_LABELS.map(l => <div key={l}>{l}%</div>)}
                                </div>
                                {/* Grid */}
                                <div className="grid gap-px bg-bg-dark border border-border-dark" style={{ gridTemplateColumns: `repeat(${RPM_LABELS.length}, 1fr)` }}>
                                    {mapData.map((row, ri) => row.map((val, ci) => (
                                        <div key={`${ri}-${ci}`}
                                            onClick={() => setSelectedCell({ row: ri, col: ci })}
                                            className={`${getCellColor(val)} heatmap-cell flex items-center justify-center text-[10px] font-mono h-8 min-w-[52px] cursor-pointer ${selectedCell?.row === ri && selectedCell?.col === ci ? 'ring-2 ring-white ring-inset z-10' : ''}`}>
                                            <span className="text-white/90">{val.toFixed(1)}</span>
                                        </div>
                                    )))}
                                </div>
                            </div>
                            {/* X-axis labels */}
                            <div className="flex ml-8 mt-2" style={{ gap: 0 }}>
                                {RPM_LABELS.map(l => (
                                    <div key={l} className="flex-1 text-center text-[9px] font-mono text-primary -rotate-45 origin-top-left translate-y-2">{l}</div>
                                ))}
                            </div>
                            <div className="text-center text-primary text-xs font-bold tracking-widest mt-10 ml-8">ENGINE SPEED (RPM)</div>
                        </div>
                    </div>

                    {/* 3D Surface */}
                    <div className="w-[40%] bg-panel-dark border-l border-border-dark flex flex-col relative overflow-hidden">
                        <div className="flex-1 flex items-center justify-center grid-3d bg-gradient-to-b from-bg-dark to-panel-dark">
                            <div className="grid-3d-plane relative w-[260px] h-[260px] bg-black/20 border border-slate-700 rounded">
                                <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
                                            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="#555" strokeWidth="0.5" />
                                        </pattern>
                                        <linearGradient id="heatGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                            <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
                                            <stop offset="100%" stopColor="#ea103c" stopOpacity="0.8" />
                                        </linearGradient>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                    <path d="M0,260 C50,220 100,240 150,130 S250,40 260,0 L260,260 Z" fill="url(#heatGrad)" fillOpacity="0.5" stroke="white" strokeWidth="1" />
                                    <path d="M0,260 Q130,220 260,260" fill="none" stroke="#ea103c" strokeWidth="2" />
                                    <path d="M50,260 Q150,180 260,220" fill="none" stroke="#ea103c" strokeWidth="1" opacity="0.5" />
                                </svg>
                                <div className="absolute -bottom-8 left-0 text-amber-400 text-[11px] font-bold">TPS →</div>
                                <div className="absolute -bottom-8 right-0 text-primary text-[11px] font-bold">← RPM</div>
                                <div className="absolute -top-6 left-0 text-white text-[11px] font-bold">AFR ↑</div>
                            </div>
                        </div>
                        <div className="p-4 bg-panel-dark border-t border-border-dark flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-text-muted uppercase tracking-widest">Selected Cell</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">{sv?.toFixed(1) || '—'}</span>
                                    <span className="text-xs text-text-muted">AFR</span>
                                </div>
                            </div>
                            <div className="text-right text-xs">
                                <div className="text-amber-400">TPS: <span className="text-white font-mono">{selectedCell ? TPS_LABELS[selectedCell.row] : '—'}%</span></div>
                                <div className="text-primary">RPM: <span className="text-white font-mono">{selectedCell ? RPM_LABELS[selectedCell.col] : '—'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Sidebar: Tools ──────────────────────── */}
            <aside className="w-64 bg-panel-dark border-l border-border-dark flex flex-col shrink-0">
                <div className="p-4 border-b border-border-dark">
                    <h3 className="text-sm font-bold text-white mb-3">Map Selection</h3>
                    <select className="w-full bg-bg-dark border border-border-dark text-slate-300 text-sm rounded-lg p-2.5 focus:ring-primary focus:border-primary">
                        <option>Fuel Map (Cyl 1-4)</option><option>Ignition Map (Cyl 1-4)</option><option>Secondary Injection</option><option>ETV Base Map</option>
                    </select>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Quick Adjust */}
                    <div>
                        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">Quick Adjust</h4>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            {[{ label: '+1%', val: 1, color: 'text-green-500' }, { label: '-1%', val: -1, color: 'text-red-500' }, { label: '+5%', val: 5, color: 'text-green-500' }, { label: '-5%', val: -5, color: 'text-red-500' }].map(b => (
                                <button key={b.label} onClick={() => applyAdjust(b.val)}
                                    className="flex flex-col items-center p-2.5 rounded bg-bg-dark hover:bg-primary/20 border border-border-dark hover:border-primary transition-colors">
                                    <span className={`text-xs font-bold ${b.color}`}>{b.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={adjustVal} onChange={e => setAdjustVal(e.target.value)} className="w-full bg-bg-dark border border-border-dark text-white text-sm rounded px-3 py-2 text-center" />
                            <button className="bg-primary hover:bg-red-600 text-white px-4 rounded font-bold text-sm">=</button>
                            <button className="bg-panel-dark border border-border-dark hover:bg-white/5 text-white px-4 rounded font-bold text-sm">×</button>
                        </div>
                    </div>
                    {/* Interpolation */}
                    <div>
                        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">Interpolation</h4>
                        {[{ icon: 'linear_scale', label: 'Horizontal Smooth' }, { icon: 'linear_scale', label: 'Vertical Smooth', rotate: true }, { icon: 'blur_on', label: '2D Interpolate' }].map(i => (
                            <button key={i.label} className="flex items-center gap-3 w-full p-2 text-sm text-slate-300 hover:text-white hover:bg-bg-dark rounded transition-colors">
                                <span className={`material-symbols-outlined text-text-muted ${i.rotate ? 'rotate-90' : ''}`}>{i.icon}</span>{i.label}
                            </button>
                        ))}
                    </div>
                    {/* Live Data */}
                    <div className="pt-4 border-t border-border-dark">
                        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />Live Telemetry
                        </h4>
                        {[{ label: 'RPM', val: '12,450', pct: 75, color: 'bg-primary' }, { label: 'TPS', val: '88%', pct: 88, color: 'bg-amber-400' }, { label: 'Lambda', val: '0.88', pct: 60, color: 'bg-green-500' }].map(d => (
                            <div key={d.label} className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-text-muted">{d.label}</span><span className={`font-mono font-bold ${d.color === 'bg-primary' ? 'text-primary' : d.color === 'bg-amber-400' ? 'text-amber-400' : 'text-green-500'}`}>{d.val}</span>
                                </div>
                                <div className="h-1.5 w-full bg-bg-dark rounded-full overflow-hidden"><div className={`h-full ${d.color}`} style={{ width: `${d.pct}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-3 border-t border-border-dark text-[10px] text-text-muted text-center">RevSync Pro v2.4.1</div>
            </aside>
        </div>
    );
}
