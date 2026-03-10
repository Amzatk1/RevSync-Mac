import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import type { TuneListing } from '../lib/types';

function generateMapData(): number[][] {
    const rows = 16;
    const cols = 16;
    const data: number[][] = [];
    for (let row = 0; row < rows; row += 1) {
        const nextRow: number[] = [];
        for (let column = 0; column < cols; column += 1) {
            const base = 10 + row * 2.5 + column * 1.8;
            const variation = Math.sin(row * 0.5) * 3 + Math.cos(column * 0.4) * 2;
            nextRow.push(Math.round((base + variation) * 10) / 10);
        }
        data.push(nextRow);
    }
    return data;
}

const RPM_LABELS = ['1000', '1500', '2000', '2500', '3000', '3500', '4000', '4500', '5000', '5500', '6000', '6500', '7000', '7500', '8000', '8500'];
const TPS_LABELS = ['0', '6', '13', '19', '25', '31', '38', '44', '50', '56', '63', '69', '75', '81', '88', '100'];
const CHANNELS = ['Base fuel', 'Transient enrichment', 'Ignition trim', 'Throttle strategy'];

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
    const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
    const [activityLog, setActivityLog] = useState<string[]>([
        'Map editor ready.',
        'Select a table cell to inspect and modify the active calibration channel.',
    ]);

    useEffect(() => {
        api.get<any>('/v1/marketplace/browse/')
            .then((res) => {
                const results = Array.isArray(res) ? res : res?.results || [];
                if (results.length) setListing(results[0]);
            })
            .catch(() => undefined);
    }, []);

    const addLog = useCallback((message: string) => {
        setActivityLog((current) => [...current.slice(-15), message]);
    }, []);

    const getCellColor = useCallback((value: number): string => {
        const min = 8;
        const max = 65;
        const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
        if (pct < 0.33) return `rgba(99, 199, 255, ${0.22 + pct * 1.25})`;
        if (pct < 0.66) return `rgba(46, 211, 154, ${0.24 + (pct - 0.33) * 1.35})`;
        return `rgba(234, 16, 60, ${0.22 + (pct - 0.66) * 1.4})`;
    }, []);

    const pushUndo = useCallback(
        (description: string) => {
            setUndoStack((current) => [...current.slice(-20), { data: mapData.map((row) => [...row]), desc: description }]);
            setRedoStack([]);
            setModified(true);
        },
        [mapData]
    );

    const undo = useCallback(() => {
        if (!undoStack.length) return;
        const previous = undoStack[undoStack.length - 1];
        setRedoStack((current) => [...current, { data: mapData.map((row) => [...row]), desc: previous.desc }]);
        setMapData(previous.data);
        setUndoStack((current) => current.slice(0, -1));
        addLog(`Undo: ${previous.desc}`);
    }, [undoStack, mapData, addLog]);

    const redo = useCallback(() => {
        if (!redoStack.length) return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack((current) => [...current, { data: mapData.map((row) => [...row]), desc: next.desc }]);
        setMapData(next.data);
        setRedoStack((current) => current.slice(0, -1));
        addLog(`Redo: ${next.desc}`);
    }, [redoStack, mapData, addLog]);

    const startEdit = useCallback(
        (row: number, column: number) => {
            setSelectedCell([row, column]);
            setEditValue(String(mapData[row][column]));
            setIsEditing(true);
        },
        [mapData]
    );

    const commitEdit = useCallback(() => {
        if (!selectedCell || !isEditing) return;
        const [row, column] = selectedCell;
        const nextValue = parseFloat(editValue);
        if (!Number.isNaN(nextValue)) {
            pushUndo(`Manual edit R${row + 1} C${column + 1}`);
            setMapData((current) => {
                const next = current.map((item) => [...item]);
                next[row][column] = Math.round(nextValue * 10) / 10;
                return next;
            });
            addLog(`Updated ${activeChannel} cell at ${RPM_LABELS[row]} RPM / ${TPS_LABELS[column]}% TPS.`);
        }
        setIsEditing(false);
    }, [selectedCell, isEditing, editValue, pushUndo, addLog, activeChannel]);

    const adjustSelected = useCallback(
        (delta: number) => {
            if (!selectedCell) return;
            const [row, column] = selectedCell;
            pushUndo(`Adjust R${row + 1} C${column + 1}`);
            setMapData((current) => {
                const next = current.map((item) => [...item]);
                next[row][column] = Math.round((next[row][column] + delta) * 10) / 10;
                return next;
            });
            addLog(`Adjusted ${activeChannel} by ${delta > 0 ? '+' : ''}${delta.toFixed(1)} at ${RPM_LABELS[row]} RPM / ${TPS_LABELS[column]}% TPS.`);
        },
        [selectedCell, pushUndo, addLog, activeChannel]
    );

    const interpolateRow = useCallback(() => {
        if (!selectedCell) return;
        const [row] = selectedCell;
        pushUndo(`Interpolate row ${row + 1}`);
        setMapData((current) => {
            const next = current.map((item) => [...item]);
            const first = next[row][0];
            const last = next[row][15];
            for (let column = 1; column < 15; column += 1) {
                next[row][column] = Math.round((first + (last - first) * (column / 15)) * 10) / 10;
            }
            return next;
        });
        addLog(`Interpolated row at ${RPM_LABELS[row]} RPM.`);
    }, [selectedCell, pushUndo, addLog]);

    const resetMap = useCallback(() => {
        pushUndo('Reset to generated baseline');
        setMapData(generateMapData());
        setModified(false);
        addLog('Map reset to generated baseline values.');
    }, [pushUndo, addLog]);

    const stats = useMemo(() => {
        const flat = mapData.flat();
        const average = flat.reduce((sum, value) => sum + value, 0) / flat.length;
        return {
            min: Math.min(...flat).toFixed(1),
            max: Math.max(...flat).toFixed(1),
            avg: average.toFixed(1),
            cells: flat.length,
        };
    }, [mapData]);

    const selectedValue = selectedCell ? mapData[selectedCell[0]][selectedCell[1]] : null;

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="rs-section-label m-0">Map Editor</p>
                        <h1 className="mt-2 text-2xl font-black text-[var(--rs-text-primary)]">Calibration table editing with deterministic value control</h1>
                        <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">
                            Edit table cells, compare distribution, and keep undo-safe calibration changes inside a workbench flow that stays legible under dense technical data.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`rs-badge ${modified ? 'border-[var(--rs-warning)]/25 bg-[var(--rs-warning)]/10 text-[var(--rs-warning)]' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'}`}>
                            <span className="material-symbols-outlined text-sm">{modified ? 'edit' : 'verified'}</span>
                            {modified ? 'Unsaved Changes' : 'Baseline Synced'}
                        </span>
                        <button onClick={resetMap} className="rs-button-secondary px-4 py-2 text-sm font-semibold">
                            Reset Table
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 overflow-hidden">
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[var(--rs-stroke-strong)] bg-[linear-gradient(180deg,var(--rs-surface-2),var(--rs-surface-1))] shadow-[var(--rs-shadow-rest)]">
                        <div className="flex items-center justify-between border-b border-[var(--rs-stroke-soft)] px-5 py-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[var(--rs-accent)]">grid_view</span>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--rs-text-primary)]">{listing?.title || 'Fuel Table'}</p>
                                    <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">{listing ? `${listing.vehicle_make} ${listing.vehicle_model} • v${listing.latest_version_number}` : 'Generated baseline calibration'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {CHANNELS.map((channel) => (
                                    <button key={channel} onClick={() => setActiveChannel(channel)} data-active={activeChannel === channel} className="rs-toolbar-button px-3 text-xs font-bold">
                                        {channel}
                                    </button>
                                ))}
                                <button onClick={() => setView3D((current) => !current)} data-active={view3D} className="rs-toolbar-button px-3 text-xs font-bold">
                                    <span className="material-symbols-outlined text-sm">view_in_ar</span>
                                    {view3D ? '2D View' : '3D View'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-[var(--rs-stroke-soft)] px-5 py-3">
                            <div className="flex items-center gap-2">
                                <button onClick={undo} disabled={!undoStack.length} className="rs-button-secondary px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">
                                    Undo
                                </button>
                                <button onClick={redo} disabled={!redoStack.length} className="rs-button-secondary px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">
                                    Redo
                                </button>
                                <button onClick={() => adjustSelected(0.5)} disabled={!selectedCell} className="rs-button-secondary px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">
                                    +0.5
                                </button>
                                <button onClick={() => adjustSelected(-0.5)} disabled={!selectedCell} className="rs-button-secondary px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">
                                    -0.5
                                </button>
                                <button onClick={interpolateRow} disabled={!selectedCell} className="rs-button-secondary px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">
                                    Interpolate Row
                                </button>
                            </div>
                            <div className="text-xs text-[var(--rs-text-tertiary)]">
                                {selectedCell ? `Selection: ${RPM_LABELS[selectedCell[0]]} RPM / ${TPS_LABELS[selectedCell[1]]}% TPS` : 'Select a cell to edit'}
                            </div>
                        </div>

                        {!view3D ? (
                            <div className="flex-1 overflow-auto px-5 py-4">
                                <div className="inline-block min-w-full">
                                    <div className="ml-16 flex mb-2">
                                        {TPS_LABELS.map((label) => (
                                            <div key={label} className="w-12 text-center text-[10px] font-mono text-[var(--rs-text-tertiary)]">
                                                {label}%
                                            </div>
                                        ))}
                                    </div>
                                    {mapData.map((row, rowIndex) => (
                                        <div key={RPM_LABELS[rowIndex]} className="flex items-center">
                                            <div className="w-16 pr-3 text-right text-[10px] font-mono text-[var(--rs-text-tertiary)]">{RPM_LABELS[rowIndex]}</div>
                                            {row.map((value, columnIndex) => (
                                                <button
                                                    key={`${rowIndex}-${columnIndex}`}
                                                    onClick={() => startEdit(rowIndex, columnIndex)}
                                                    onDoubleClick={() => startEdit(rowIndex, columnIndex)}
                                                    className={`heatmap-cell relative h-8 w-12 border border-black/20 text-[10px] font-mono font-semibold ${
                                                        selectedCell?.[0] === rowIndex && selectedCell?.[1] === columnIndex ? 'z-10 ring-2 ring-white/80' : ''
                                                    }`}
                                                    style={{ background: getCellColor(value) }}
                                                >
                                                    {value.toFixed(1)}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid-3d flex flex-1 items-center justify-center overflow-hidden px-5 py-4">
                                <div className="grid-3d-plane">
                                    <svg viewBox="0 0 400 300" className="w-full max-w-3xl">
                                        {mapData.map((row, rowIndex) =>
                                            row.map((value, columnIndex) => {
                                                const x = 20 + columnIndex * 22;
                                                const y = 260 - rowIndex * 14 - value * 1.5;
                                                const opacity = 0.3 + (value / 65) * 0.7;
                                                const hue = value < 25 ? 210 : value < 40 ? 155 : 350;
                                                return (
                                                    <rect
                                                        key={`${rowIndex}-${columnIndex}`}
                                                        x={x}
                                                        y={y}
                                                        width={20}
                                                        height={value * 1.5}
                                                        fill={`hsla(${hue}, 72%, 56%, ${opacity})`}
                                                        stroke="rgba(0,0,0,0.35)"
                                                        strokeWidth="0.5"
                                                        className="cursor-pointer transition-opacity hover:opacity-100"
                                                        onClick={() => {
                                                            setSelectedCell([rowIndex, columnIndex]);
                                                            setView3D(false);
                                                            addLog(`Focused 3D cell at ${RPM_LABELS[rowIndex]} RPM / ${TPS_LABELS[columnIndex]}% TPS.`);
                                                        }}
                                                    />
                                                );
                                            })
                                        )}
                                    </svg>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
                        <div className="rs-panel rounded-[20px] p-4">
                            <p className="rs-section-label m-0">Cell Inspector</p>
                            {selectedCell ? (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rs-surface-muted rounded-[14px] p-3">
                                            <p className="rs-data-label">RPM</p>
                                            <p className="mt-2 font-semibold text-[var(--rs-text-primary)]">{RPM_LABELS[selectedCell[0]]}</p>
                                        </div>
                                        <div className="rs-surface-muted rounded-[14px] p-3">
                                            <p className="rs-data-label">TPS</p>
                                            <p className="mt-2 font-semibold text-[var(--rs-text-primary)]">{TPS_LABELS[selectedCell[1]]}%</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="rs-data-label">Value</label>
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                value={isEditing ? editValue : selectedValue?.toFixed(1) || ''}
                                                onChange={(event) => {
                                                    setEditValue(event.target.value);
                                                    setIsEditing(true);
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') commitEdit();
                                                }}
                                                onBlur={commitEdit}
                                                className="rs-input font-mono"
                                            />
                                            <button onClick={() => adjustSelected(0.5)} className="rs-button-secondary px-3 py-2 text-sm font-bold">+</button>
                                            <button onClick={() => adjustSelected(-0.5)} className="rs-button-secondary px-3 py-2 text-sm font-bold">-</button>
                                        </div>
                                    </div>
                                    <div className="rs-surface-muted rounded-[14px] p-3">
                                        <p className="rs-data-label">Edit note</p>
                                        <p className="mt-2 text-sm text-[var(--rs-text-secondary)]">
                                            Changes affect <span className="text-[var(--rs-text-primary)]">{activeChannel}</span> only. Validate interpolation and compare before publish.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">Select a table cell to inspect its RPM, load axis, and current value.</p>
                            )}
                        </div>

                        <div className="rs-panel rounded-[20px] p-4">
                            <p className="rs-section-label m-0">Map Summary</p>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Min', value: stats.min },
                                    { label: 'Max', value: stats.max },
                                    { label: 'Average', value: stats.avg },
                                    { label: 'Cells', value: String(stats.cells) },
                                    { label: 'Undo Stack', value: String(undoStack.length) },
                                    { label: 'Redo Stack', value: String(redoStack.length) },
                                ].map((item) => (
                                    <div key={item.label} className="rs-surface-muted rounded-[14px] p-3">
                                        <p className="rs-data-label">{item.label}</p>
                                        <p className="mt-2 text-sm font-semibold text-[var(--rs-text-primary)]">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rs-panel rounded-[20px] p-4">
                            <p className="rs-section-label m-0">Color Interpretation</p>
                            <div className="mt-4 h-3 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(99,199,255,0.9), rgba(46,211,154,0.85), rgba(234,16,60,0.85))' }} />
                            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.16em] text-[var(--rs-text-tertiary)]">
                                <span>Lean</span>
                                <span>Balanced</span>
                                <span>Rich</span>
                            </div>
                        </div>

                        <div className="rs-panel rounded-[20px] p-4">
                            <p className="rs-section-label m-0">Editor Log</p>
                            <div className="mt-3 space-y-2 font-mono text-[11px]">
                                {activityLog.map((line, index) => (
                                    <div key={`${line}-${index}`} className="leading-relaxed text-sky-300/85">
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
