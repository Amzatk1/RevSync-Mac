import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Simulated gauge data ────────────────────────────────────────────
const GAUGES = [
    { id: 'rpm', label: 'RPM', unit: '', min: 0, max: 12000, color: '#ea103c', decimals: 0 },
    { id: 'afr', label: 'AFR', unit: 'λ', min: 10, max: 18, color: '#22c55e', decimals: 1 },
    { id: 'boost', label: 'Boost', unit: 'PSI', min: -15, max: 25, color: '#3b82f6', decimals: 1 },
    { id: 'ect', label: 'ECT', unit: '°C', min: 0, max: 120, color: '#f59e0b', decimals: 0 },
];

const SPARKLINE_PIDS = [
    { id: 'iat', label: 'Intake Air Temp', unit: '°C', range: [25, 55], color: '#f59e0b' },
    { id: 'map', label: 'MAP Sensor', unit: 'kPa', range: [30, 120], color: '#3b82f6' },
    { id: 'tps', label: 'Throttle Pos.', unit: '%', range: [0, 100], color: '#22c55e' },
    { id: 'timing', label: 'Ignition Timing', unit: '°BTDC', range: [5, 40], color: '#ea103c' },
    { id: 'fuel', label: 'Fuel Pressure', unit: 'bar', range: [2.5, 4.5], color: '#8b5cf6' },
    { id: 'o2', label: 'O2 Voltage', unit: 'V', range: [0, 1], color: '#06b6d4' },
];

function randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export default function DiagnosticsPage() {
    const [isLive, setIsLive] = useState(false);
    const [gaugeValues, setGaugeValues] = useState<Record<string, number>>({
        rpm: 850, afr: 14.7, boost: -2.0, ect: 78,
    });
    const [sparklineData, setSparklineData] = useState<Record<string, number[]>>(() => {
        const init: Record<string, number[]> = {};
        SPARKLINE_PIDS.forEach(p => { init[p.id] = Array(40).fill(0).map(() => randomInRange(p.range[0], p.range[1])); });
        return init;
    });
    const [logEntries, setLogEntries] = useState<string[]>([
        '[SYS] Diagnostics module initialized',
        '[INFO] Waiting for live data connection...',
    ]);
    const [enabledPids, setEnabledPids] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        SPARKLINE_PIDS.forEach(p => { init[p.id] = true; });
        return init;
    });
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Live data simulation
    useEffect(() => {
        if (isLive) {
            setLogEntries(prev => [...prev, `[SYS] Live data stream started at ${new Date().toLocaleTimeString()}`]);
            intervalRef.current = setInterval(() => {
                setGaugeValues({
                    rpm: Math.round(randomInRange(800, 9000)),
                    afr: Math.round(randomInRange(11, 16) * 10) / 10,
                    boost: Math.round(randomInRange(-5, 18) * 10) / 10,
                    ect: Math.round(randomInRange(70, 105)),
                });
                setSparklineData(prev => {
                    const next: Record<string, number[]> = {};
                    SPARKLINE_PIDS.forEach(p => {
                        const arr = [...(prev[p.id] || [])];
                        arr.push(randomInRange(p.range[0], p.range[1]));
                        if (arr.length > 40) arr.shift();
                        next[p.id] = arr;
                    });
                    return next;
                });
            }, 500);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                setLogEntries(prev => [...prev, `[SYS] Live data stream stopped`]);
            }
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isLive]);

    const togglePid = useCallback((pid: string) => {
        setEnabledPids(prev => ({ ...prev, [pid]: !prev[pid] }));
    }, []);

    const clearLog = useCallback(() => { setLogEntries(['[SYS] Log cleared']); }, []);

    // SVG Gauge Component
    const renderGauge = (gauge: typeof GAUGES[0], value: number) => {
        const pct = Math.min(1, Math.max(0, (value - gauge.min) / (gauge.max - gauge.min)));
        const radius = 52;
        const circumference = Math.PI * radius; // half circle
        const offset = circumference - pct * circumference;

        return (
            <div key={gauge.id} className="bg-surface-dark border border-border-dark rounded-xl p-4 flex flex-col items-center">
                <svg viewBox="0 0 120 70" className="w-full h-auto gauge-ring" style={{ '--gauge-color': gauge.color + '80' } as any}>
                    <path d="M 10 65 A 52 52 0 0 1 110 65" fill="none" stroke="#1a1a20" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 10 65 A 52 52 0 0 1 110 65" fill="none" stroke={gauge.color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        className="transition-all duration-300" />
                </svg>
                <div className="-mt-4 text-center">
                    <span className="text-2xl font-black text-white">{value.toFixed(gauge.decimals)}</span>
                    <span className="text-xs text-text-muted ml-1">{gauge.unit}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-1">{gauge.label}</span>
            </div>
        );
    };

    // SVG Sparkline
    const renderSparkline = (pid: typeof SPARKLINE_PIDS[0]) => {
        const data = sparklineData[pid.id] || [];
        const min = pid.range[0], max = pid.range[1];
        const currentVal = data[data.length - 1] ?? 0;
        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 30 - ((v - min) / (max - min)) * 28;
            return `${x},${y}`;
        }).join(' ');

        if (!enabledPids[pid.id]) return null;

        return (
            <div key={pid.id} className="bg-surface-dark border border-border-dark rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white truncate">{pid.label}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: pid.color }}>{currentVal.toFixed(1)} {pid.unit}</span>
                    </div>
                    <svg viewBox="0 0 100 32" className="w-full h-6">
                        <polyline points={points} fill="none" stroke={pid.color} strokeWidth="1.5" strokeLinejoin="round" className="transition-all duration-300" />
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl text-primary">monitoring</span>
                            Live Diagnostics
                        </h1>
                        <p className="text-text-muted text-sm ml-10">Real-time ECU sensor monitoring and data logging</p>
                    </div>
                    <button onClick={() => setIsLive(!isLive)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${isLive ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(234,16,60,0.3)]'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            }`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isLive ? 'stop' : 'play_arrow'}</span>
                        {isLive ? 'Stop Live' : 'Start Live'}
                    </button>
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-4 gap-4">
                    {GAUGES.map(g => renderGauge(g, gaugeValues[g.id] ?? 0))}
                </div>

                {/* Sparklines */}
                <div className="grid grid-cols-3 gap-3">
                    {SPARKLINE_PIDS.map(p => renderSparkline(p))}
                </div>

                {/* Time-series Chart Area */}
                <div className="bg-surface-dark border border-border-dark rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">Combined Time-Series</h3>
                        <div className="flex items-center gap-1">
                            {isLive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            <span className="text-[10px] text-text-muted">{isLive ? 'Recording' : 'Paused'}</span>
                        </div>
                    </div>
                    <svg viewBox="0 0 600 120" className="w-full h-32">
                        {/* Grid lines */}
                        {[0, 30, 60, 90, 120].map(y => (
                            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#2a2a30" strokeWidth="0.5" />
                        ))}
                        {SPARKLINE_PIDS.filter(p => enabledPids[p.id]).map(pid => {
                            const data = sparklineData[pid.id] || [];
                            const points = data.map((v, i) => {
                                const x = (i / (data.length - 1)) * 600;
                                const y = 110 - ((v - pid.range[0]) / (pid.range[1] - pid.range[0])) * 100;
                                return `${x},${y}`;
                            }).join(' ');
                            return <polyline key={pid.id} points={points} fill="none" stroke={pid.color} strokeWidth="1.5" opacity="0.7" />;
                        })}
                    </svg>
                </div>
            </div>

            {/* ─── Right Sidebar ──────────────────────── */}
            <aside className="w-64 bg-[#0a0a0d] border-l border-border-dark flex flex-col shrink-0">
                {/* Logger Controls */}
                <div className="p-4 border-b border-border-dark">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Logger Controls</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setIsLive(true)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-green-600/20 text-green-400 text-xs font-bold hover:bg-green-600/30 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span> Start
                        </button>
                        <button onClick={() => setIsLive(false)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-red-600/20 text-red-400 text-xs font-bold hover:bg-red-600/30 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>stop</span> Stop
                        </button>
                        <button onClick={clearLog}
                            className="flex items-center justify-center px-2 py-1.5 rounded bg-white/5 text-text-muted text-xs font-bold hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                        </button>
                    </div>
                </div>

                {/* PID Toggle List */}
                <div className="p-4 border-b border-border-dark">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">PID Channels</h3>
                    <div className="space-y-1.5">
                        {SPARKLINE_PIDS.map(pid => (
                            <button key={pid.id} onClick={() => togglePid(pid.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-white/5">
                                <div className={`w-3 h-3 rounded-sm border ${enabledPids[pid.id] ? 'border-transparent' : 'border-border-dark'}`}
                                    style={enabledPids[pid.id] ? { background: pid.color } : {}} />
                                <span className={enabledPids[pid.id] ? 'text-white' : 'text-text-muted'}>{pid.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted shrink-0">Event Log</div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4 font-mono text-[10px]">
                        {logEntries.map((line, i) => (
                            <div key={i} className={`leading-relaxed ${line.includes('[SYS]') ? 'text-blue-400' : line.includes('[WARN]') ? 'text-amber-400' : 'text-emerald-400/70'
                                }`}>{line}</div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}
