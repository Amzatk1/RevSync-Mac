import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';
import type { TuneListing } from '../lib/types';

// Generate realistic fuel map data
function generateMapData(): number[][] {
    const rows = 16; // RPM (1000-9000)
    const cols = 16; // TPS (0-100%)
    const data: number[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < cols; c++) {
            // Realistic fuel enrichment curve
            const base = 10 + (r * 2.5) + (c * 1.8);
            const variation = Math.sin(r * 0.5) * 3 + Math.cos(c * 0.4) * 2;
            row.push(Math.round((base + variation) * 10) / 10);
        }
        data.push(row);
    }
    return data;
}

const RPM_LABELS = ['1000', '1500', '2000', '2500', '3000', '3500', '4000', '4500', '5000', '5500', '6000', '6500', '7000', '7500', '8000', '8500'];
const TPS_LABELS = ['0', '6', '13', '19', '25', '31', '38', '44', '50', '56', '63', '69', '75', '81', '88', '100'];

type UndoEntry = { data: number[][]; desc: string };

export default function MapEditorPage() {
    const [listing, setListing] = useState<TuneListing | null>(null);
    const [mapData, setMapData] = useState<number[][]>(generateMapData);
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [view3D, setView3D] = useState(false);
    const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
    const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);
    const [modified, setModified] = useState(false);

    useEffect(() => {
        api.get<any>('/v1/marketplace/browse/')
            .then(res => { const arr = Array.isArray(res) ? res : res?.results || []; if (arr.length) setListing(arr[0]); })
            .catch(() => { });
    }, []);

    // Cell color based on value
    const getCellColor = useCallback((val: number): string => {
        const min = 8, max = 65;
        const pct = Math.min(1, Math.max(0, (val - min) / (max - min)));
        if (pct < 0.33) return `rgba(59, 130, 246, ${0.3 + pct * 1.5})`; // blue
        if (pct < 0.66) return `rgba(34, 197, 94, ${0.3 + (pct - 0.33) * 1.5})`; // green
        return `rgba(234, 16, 60, ${0.3 + (pct - 0.66) * 1.5})`; // red
    }, []);

    // Push to undo stack
    const pushUndo = useCallback((desc: string) => {
        setUndoStack(prev => [...prev.slice(-20), { data: mapData.map(r => [...r]), desc }]);
        setRedoStack([]);
        setModified(true);
    }, [mapData]);

    // Undo
    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        setRedoStack(r => [...r, { data: mapData.map(row => [...row]), desc: 'redo' }]);
        setMapData(prev.data);
        setUndoStack(u => u.slice(0, -1));
    }, [undoStack, mapData]);

    // Redo
    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack(u => [...u, { data: mapData.map(row => [...row]), desc: 'undo' }]);
        setMapData(next.data);
        setRedoStack(r => r.slice(0, -1));
    }, [redoStack, mapData]);

    // Edit cell
    const startEdit = useCallback((r: number, c: number) => {
        setSelectedCell([r, c]);
        setEditValue(String(mapData[r][c]));
        setIsEditing(true);
    }, [mapData]);

    const commitEdit = useCallback(() => {
        if (!selectedCell || !isEditing) return;
        const [r, c] = selectedCell;
        const val = parseFloat(editValue);
        if (!isNaN(val)) {
            pushUndo(`Edit [${r},${c}]`);
            setMapData(prev => {
                const next = prev.map(row => [...row]);
                next[r][c] = Math.round(val * 10) / 10;
                return next;
            });
        }
        setIsEditing(false);
    }, [selectedCell, isEditing, editValue, pushUndo]);

    // Adjust selected cell
    const adjustSelected = useCallback((delta: number) => {
        if (!selectedCell) return;
        const [r, c] = selectedCell;
        pushUndo(`Adjust [${r},${c}]`);
        setMapData(prev => {
            const next = prev.map(row => [...row]);
            next[r][c] = Math.round((next[r][c] + delta) * 10) / 10;
            return next;
        });
    }, [selectedCell, pushUndo]);

    // Interpolate row/col
    const interpolateRow = useCallback(() => {
        if (!selectedCell) return;
        const [r] = selectedCell;
        pushUndo('Interpolate row');
        setMapData(prev => {
            const next = prev.map(row => [...row]);
            const first = next[r][0], last = next[r][15];
            for (let c = 1; c < 15; c++) {
                next[r][c] = Math.round((first + (last - first) * (c / 15)) * 10) / 10;
            }
            return next;
        });
    }, [selectedCell, pushUndo]);

    // Reset to default
    const resetMap = useCallback(() => {
        pushUndo('Reset to default');
        setMapData(generateMapData());
        setModified(false);
    }, [pushUndo]);

    // Stats
    const stats = useMemo(() => {
        const flat = mapData.flat();
        return {
            min: Math.min(...flat).toFixed(1),
            max: Math.max(...flat).toFixed(1),
            avg: (flat.reduce((a, b) => a + b, 0) / flat.length).toFixed(1),
        };
    }, [mapData]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 bg-panel-dark border-b border-border-dark flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>map</span>
                    <h2 className="text-sm font-bold text-white">{listing?.title || 'Fuel Map'}</h2>
                    {modified && <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={undo} disabled={undoStack.length === 0}
                        className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Undo">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>undo</span>
                    </button>
                    <button onClick={redo} disabled={redoStack.length === 0}
                        className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Redo">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>redo</span>
                    </button>
                    <div className="w-px h-5 bg-border-dark mx-1" />
                    <button onClick={() => adjustSelected(0.5)} disabled={!selectedCell}
                        className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="+0.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    </button>
                    <button onClick={() => adjustSelected(-0.5)} disabled={!selectedCell}
                        className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="-0.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                    </button>
                    <button onClick={interpolateRow} disabled={!selectedCell}
                        className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Interpolate Row">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>straighten</span>
                    </button>
                    <div className="w-px h-5 bg-border-dark mx-1" />
                    <button onClick={() => setView3D(v => !v)}
                        className={`p-1.5 rounded transition-colors ${view3D ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-white hover:bg-white/10'}`} title="Toggle 3D View">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>view_in_ar</span>
                    </button>
                    <button onClick={resetMap}
                        className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Reset Map">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ─── 2D Heatmap ──────────────────── */}
                <div className={`flex-1 overflow-auto p-4 ${view3D ? 'hidden' : ''}`}>
                    <div className="inline-block">
                        {/* TPS header */}
                        <div className="flex ml-14 mb-1">
                            {TPS_LABELS.map((label, i) => (
                                <div key={i} className="w-12 text-center text-[9px] text-text-muted font-mono">{label}%</div>
                            ))}
                        </div>
                        {/* Rows */}
                        {mapData.map((row, r) => (
                            <div key={r} className="flex items-center">
                                <div className="w-14 text-right pr-2 text-[10px] text-text-muted font-mono">{RPM_LABELS[r]}</div>
                                {row.map((val, c) => (
                                    <button key={c}
                                        onClick={() => startEdit(r, c)}
                                        onDoubleClick={() => startEdit(r, c)}
                                        className={`w-12 h-7 text-[10px] font-mono font-medium border border-black/20 heatmap-cell ${selectedCell?.[0] === r && selectedCell?.[1] === c ? 'ring-2 ring-white z-10' : ''
                                            }`}
                                        style={{ background: getCellColor(val) }}>
                                        {val.toFixed(1)}
                                    </button>
                                ))}
                            </div>
                        ))}
                        <div className="flex ml-14 mt-2">
                            <div className="text-[10px] text-text-muted text-center w-full">← TPS (Throttle Position %) →</div>
                        </div>
                    </div>
                </div>

                {/* ─── 3D View ─────────────────────── */}
                {view3D && (
                    <div className="flex-1 flex items-center justify-center p-4 grid-3d">
                        <div className="grid-3d-plane">
                            <svg viewBox="0 0 400 300" className="w-full max-w-lg">
                                {mapData.map((row, r) =>
                                    row.map((val, c) => {
                                        const x = 20 + c * 22;
                                        const y = 260 - r * 14 - val * 1.5;
                                        const opacity = 0.3 + (val / 65) * 0.7;
                                        const hue = val < 25 ? 220 : val < 40 ? 120 : 0;
                                        return (
                                            <rect key={`${r}-${c}`} x={x} y={y} width={20} height={val * 1.5}
                                                fill={`hsla(${hue}, 70%, 50%, ${opacity})`}
                                                stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"
                                                className="hover:opacity-100 cursor-pointer transition-opacity"
                                                onClick={() => { setSelectedCell([r, c]); setView3D(false); }} />
                                        );
                                    })
                                )}
                            </svg>
                        </div>
                    </div>
                )}

                {/* ─── Right sidebar ───────────────── */}
                <aside className="w-64 bg-[#0e0e11] border-l border-border-dark p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
                    {/* Cell Editor */}
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-3">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Cell Editor</h3>
                        {selectedCell ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-text-muted">RPM:</span> <span className="text-white font-bold">{RPM_LABELS[selectedCell[0]]}</span></div>
                                    <div><span className="text-text-muted">TPS:</span> <span className="text-white font-bold">{TPS_LABELS[selectedCell[1]]}%</span></div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase">Value</label>
                                    <div className="flex gap-1 mt-1">
                                        <input value={isEditing ? editValue : mapData[selectedCell[0]][selectedCell[1]].toFixed(1)}
                                            onChange={e => { setEditValue(e.target.value); setIsEditing(true); }}
                                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); }}
                                            onBlur={commitEdit}
                                            className="flex-1 h-8 px-2 bg-bg-dark border border-border-dark rounded text-sm text-white font-mono focus:outline-none focus:border-primary" />
                                        <button onClick={() => adjustSelected(0.5)} className="w-8 h-8 bg-bg-dark border border-border-dark rounded text-text-muted hover:text-white text-sm">+</button>
                                        <button onClick={() => adjustSelected(-0.5)} className="w-8 h-8 bg-bg-dark border border-border-dark rounded text-text-muted hover:text-white text-sm">−</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-text-muted italic">Click a cell to edit</p>
                        )}
                    </div>

                    {/* Map Stats */}
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-3">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Map Statistics</h3>
                        <div className="space-y-2 text-xs">
                            {[
                                { label: 'Min', value: stats.min, color: 'text-blue-400' },
                                { label: 'Max', value: stats.max, color: 'text-red-400' },
                                { label: 'Average', value: stats.avg, color: 'text-green-400' },
                                { label: 'Cells', value: '256', color: 'text-white' },
                                { label: 'Undo History', value: String(undoStack.length), color: 'text-amber-400' },
                            ].map(s => (
                                <div key={s.label} className="flex justify-between">
                                    <span className="text-text-muted">{s.label}</span>
                                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Info */}
                    {listing && (
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Tune Info</h3>
                            <div className="space-y-1 text-xs">
                                <p className="text-white font-medium">{listing.title}</p>
                                <p className="text-text-muted">v{listing.latest_version_number}</p>
                                <p className="text-text-muted">{listing.vehicle_make} {listing.vehicle_model}</p>
                                <p className="text-text-muted">{listing.tuner?.business_name}</p>
                            </div>
                        </div>
                    )}

                    {/* Color Legend */}
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-3">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Legend</h3>
                        <div className="flex items-center gap-1">
                            <div className="h-3 flex-1 rounded" style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.8), rgba(34,197,94,0.8), rgba(234,16,60,0.8))' }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-text-muted mt-1">
                            <span>Lean</span><span>Stoich</span><span>Rich</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
