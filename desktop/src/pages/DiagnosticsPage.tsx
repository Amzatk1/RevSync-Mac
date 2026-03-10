import { useState, useEffect, useCallback, useRef } from 'react';

const GAUGES = [
    { id: 'rpm', label: 'RPM', unit: '', min: 0, max: 12000, color: '#ea103c', decimals: 0 },
    { id: 'afr', label: 'AFR', unit: 'lambda', min: 10, max: 18, color: '#22c55e', decimals: 1 },
    { id: 'boost', label: 'Boost', unit: 'PSI', min: -15, max: 25, color: '#63c7ff', decimals: 1 },
    { id: 'ect', label: 'ECT', unit: 'deg C', min: 0, max: 120, color: '#f59e0b', decimals: 0 },
];

const SPARKLINE_PIDS = [
    { id: 'iat', label: 'Intake Air Temp', unit: 'deg C', range: [25, 55], color: '#f59e0b' },
    { id: 'map', label: 'MAP Sensor', unit: 'kPa', range: [30, 120], color: '#63c7ff' },
    { id: 'tps', label: 'Throttle Pos.', unit: '%', range: [0, 100], color: '#22c55e' },
    { id: 'timing', label: 'Ignition Timing', unit: 'deg BTDC', range: [5, 40], color: '#ea103c' },
    { id: 'fuel', label: 'Fuel Pressure', unit: 'bar', range: [2.5, 4.5], color: '#8b5cf6' },
    { id: 'o2', label: 'O2 Voltage', unit: 'V', range: [0, 1], color: '#06b6d4' },
];

function randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export default function DiagnosticsPage() {
    const [isLive, setIsLive] = useState(false);
    const [gaugeValues, setGaugeValues] = useState<Record<string, number>>({
        rpm: 850,
        afr: 14.7,
        boost: -2.0,
        ect: 78,
    });
    const [sparklineData, setSparklineData] = useState<Record<string, number[]>>(() => {
        const init: Record<string, number[]> = {};
        SPARKLINE_PIDS.forEach((pid) => {
            init[pid.id] = Array(40)
                .fill(0)
                .map(() => randomInRange(pid.range[0], pid.range[1]));
        });
        return init;
    });
    const [logEntries, setLogEntries] = useState<string[]>(['[SYS] Diagnostics module initialized', '[INFO] Waiting for live data connection...']);
    const [enabledPids, setEnabledPids] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        SPARKLINE_PIDS.forEach((pid) => {
            init[pid.id] = true;
        });
        return init;
    });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isLive) {
            setLogEntries((prev) => [...prev, `[SYS] Live data stream started at ${new Date().toLocaleTimeString()}`]);
            intervalRef.current = setInterval(() => {
                setGaugeValues({
                    rpm: Math.round(randomInRange(800, 9000)),
                    afr: Math.round(randomInRange(11, 16) * 10) / 10,
                    boost: Math.round(randomInRange(-5, 18) * 10) / 10,
                    ect: Math.round(randomInRange(70, 105)),
                });
                setSparklineData((prev) => {
                    const next: Record<string, number[]> = {};
                    SPARKLINE_PIDS.forEach((pid) => {
                        const arr = [...(prev[pid.id] || [])];
                        arr.push(randomInRange(pid.range[0], pid.range[1]));
                        if (arr.length > 40) arr.shift();
                        next[pid.id] = arr;
                    });
                    return next;
                });
            }, 500);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setLogEntries((prev) => [...prev, '[SYS] Live data stream stopped']);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLive]);

    const togglePid = useCallback((pid: string) => {
        setEnabledPids((prev) => ({ ...prev, [pid]: !prev[pid] }));
    }, []);

    const clearLog = useCallback(() => {
        setLogEntries(['[SYS] Log cleared']);
    }, []);

    const renderGauge = (gauge: (typeof GAUGES)[0], value: number) => {
        const pct = Math.min(1, Math.max(0, (value - gauge.min) / (gauge.max - gauge.min)));
        const radius = 52;
        const circumference = Math.PI * radius;
        const offset = circumference - pct * circumference;

        return (
            <div key={gauge.id} className="rs-panel rounded-[18px] p-4">
                <div className="mb-3 flex items-center justify-between">
                    <span className="rs-section-label m-0 text-[10px]">{gauge.label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rs-text-tertiary)]">{gauge.unit || 'raw'}</span>
                </div>
                <svg viewBox="0 0 120 70" className="h-auto w-full">
                    <path d="M 10 65 A 52 52 0 0 1 110 65" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                    <path
                        d="M 10 65 A 52 52 0 0 1 110 65"
                        fill="none"
                        stroke={gauge.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-300"
                    />
                </svg>
                <div className="-mt-4 text-center">
                    <span className="text-2xl font-black text-[var(--rs-text-primary)]">{value.toFixed(gauge.decimals)}</span>
                </div>
            </div>
        );
    };

    const renderSparkline = (pid: (typeof SPARKLINE_PIDS)[0]) => {
        const data = sparklineData[pid.id] || [];
        const min = pid.range[0];
        const max = pid.range[1];
        const currentVal = data[data.length - 1] ?? 0;
        const points = data
            .map((value, index) => {
                const x = (index / Math.max(data.length - 1, 1)) * 100;
                const y = 30 - ((value - min) / (max - min)) * 28;
                return `${x},${y}`;
            })
            .join(' ');

        if (!enabledPids[pid.id]) return null;

        return (
            <div key={pid.id} className="rs-panel rounded-[16px] p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-semibold text-[var(--rs-text-primary)]">{pid.label}</span>
                    <span className="text-xs font-bold" style={{ color: pid.color }}>
                        {currentVal.toFixed(1)} {pid.unit}
                    </span>
                </div>
                <svg viewBox="0 0 100 32" className="h-6 w-full">
                    <polyline points={points} fill="none" stroke={pid.color} strokeWidth="1.5" strokeLinejoin="round" className="transition-all duration-300" />
                </svg>
            </div>
        );
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="rs-section-label m-0">Live Diagnostics</p>
                        <h1 className="mt-2 text-2xl font-black text-[var(--rs-text-primary)]">Real-time ECU sensor monitoring and data logging</h1>
                    </div>
                    <button onClick={() => setIsLive(!isLive)} className={isLive ? 'rs-button-primary px-5 py-2.5 text-sm font-bold' : 'rs-button-secondary px-5 py-2.5 text-sm font-bold'}>
                        {isLive ? 'Stop Live Stream' : 'Start Live Stream'}
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4">{GAUGES.map((gauge) => renderGauge(gauge, gaugeValues[gauge.id] ?? 0))}</div>

                <div className="grid grid-cols-3 gap-3">{SPARKLINE_PIDS.map((pid) => renderSparkline(pid))}</div>

                <div className="rs-panel-raised rounded-[20px] p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[var(--rs-text-primary)]">Combined Time-Series</h3>
                        <div className="flex items-center gap-2">
                            {isLive && <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--rs-accent)]" />}
                            <span className="text-[10px] text-[var(--rs-text-tertiary)]">{isLive ? 'Recording' : 'Paused'}</span>
                        </div>
                    </div>
                    <svg viewBox="0 0 600 120" className="h-32 w-full">
                        {[0, 30, 60, 90, 120].map((y) => (
                            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                        ))}
                        {SPARKLINE_PIDS.filter((pid) => enabledPids[pid.id]).map((pid) => {
                            const data = sparklineData[pid.id] || [];
                            const points = data
                                .map((value, index) => {
                                    const x = (index / Math.max(data.length - 1, 1)) * 600;
                                    const y = 110 - ((value - pid.range[0]) / (pid.range[1] - pid.range[0])) * 100;
                                    return `${x},${y}`;
                                })
                                .join(' ');
                            return <polyline key={pid.id} points={points} fill="none" stroke={pid.color} strokeWidth="1.5" opacity="0.8" />;
                        })}
                    </svg>
                </div>
            </div>

            <aside className="flex w-72 shrink-0 flex-col border-l border-[var(--rs-stroke-soft)] bg-[rgba(9,13,18,0.88)]">
                <div className="border-b border-[var(--rs-stroke-soft)] p-4">
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rs-text-tertiary)]">Logger Controls</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setIsLive(true)} className="rs-button-secondary flex-1 px-3 py-2 text-xs font-bold">
                            Start
                        </button>
                        <button onClick={() => setIsLive(false)} className="rs-button-secondary flex-1 px-3 py-2 text-xs font-bold">
                            Stop
                        </button>
                        <button onClick={clearLog} className="rs-button-secondary px-3 py-2 text-xs font-bold">
                            Clear
                        </button>
                    </div>
                </div>

                <div className="border-b border-[var(--rs-stroke-soft)] p-4">
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rs-text-tertiary)]">PID Channels</h3>
                    <div className="space-y-1.5">
                        {SPARKLINE_PIDS.map((pid) => (
                            <button key={pid.id} onClick={() => togglePid(pid.id)} className="flex w-full items-center gap-2 rounded-[12px] px-2 py-2 text-xs transition-colors hover:bg-white/5">
                                <div className={`h-3 w-3 rounded-sm border ${enabledPids[pid.id] ? 'border-transparent' : 'border-[var(--rs-stroke-soft)]'}`} style={enabledPids[pid.id] ? { background: pid.color } : {}} />
                                <span className={enabledPids[pid.id] ? 'text-[var(--rs-text-primary)]' : 'text-[var(--rs-text-secondary)]'}>{pid.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rs-text-tertiary)]">Event Log</div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4 font-mono text-[10px]">
                        {logEntries.map((line, index) => (
                            <div
                                key={`${line}-${index}`}
                                className={`leading-relaxed ${
                                    line.includes('[SYS]')
                                        ? 'text-sky-300'
                                        : line.includes('[WARN]')
                                          ? 'text-amber-300'
                                          : 'text-emerald-300/80'
                                }`}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}
