import { useState, useEffect } from 'react';

const CHECKLIST = [
    'ECU Power Supply Stable (>12V)',
    'Original ROM Backup Saved',
    'Checksum Verification Passed',
    'Ignition ON, Engine OFF',
    'Diagnostic Session Active',
    'Security Access Granted',
];

const LOG_LINES = [
    { time: '14:02:15.022', text: 'Initializing connection to ECU ID 0x8F32A1...', color: '' },
    { time: '14:02:15.450', text: 'Security Access (Seed/Key) Algorithm 2...', badge: 'GRANTED', badgeColor: 'text-green-500' },
    { time: '14:02:16.112', text: 'Switching to Programming Session (0x02)... OK', color: '' },
    { time: '14:02:16.890', text: 'Erasing Flash Sector 0x40000 - 0x80000... DONE (780ms)', color: '' },
    { time: '14:02:17.671', text: 'Validating Package Signature (Ed25519)... VALID', color: '' },
];

export default function FlashManagerPage() {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'flashing' | 'done'>('idle');
    const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => true));
    const [logs, setLogs] = useState(LOG_LINES);

    const allChecked = checked.every(Boolean);

    const startFlash = () => {
        if (!allChecked) return;
        setPhase('flashing');
        setProgress(0);
    };

    useEffect(() => {
        if (phase !== 'flashing') return;
        const iv = setInterval(() => {
            setProgress(p => {
                const next = p + Math.random() * 3 + 0.5;
                if (next >= 100) {
                    clearInterval(iv);
                    setPhase('done');
                    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: 'Flash complete. Verifying checksum... OK', badge: 'DONE', badgeColor: 'text-green-500' }]);
                    return 100;
                }
                if (Math.random() > 0.7) {
                    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Writing Block 0x${(0x40000 + Math.floor(next * 512)).toString(16)} (Chunk ${Math.floor(next)}/100)...`, color: '', badge: undefined, badgeColor: undefined }]);
                }
                return next;
            });
        }, 200);
        return () => clearInterval(iv);
    }, [phase]);

    return (
        <div className="flex-1 flex flex-col overflow-y-auto relative">
            <div className="absolute inset-0 dot-grid pointer-events-none" />

            <div className="flex-1 max-w-[1500px] mx-auto p-6 flex flex-col gap-6 z-10 w-full">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">memory</span>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">Flash Manager</h1>
                        <p className="text-text-muted text-sm">Safety-Critical Control Center • v4.2.0</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[400px]">
                    {/* Package + Device */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                        <div className="bg-panel-dark border border-border-dark rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10"><span className="material-symbols-outlined text-6xl">folder_zip</span></div>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-white font-bold">Input Package</h3>
                                <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>Verified
                                </span>
                            </div>
                            <div className="bg-bg-dark/50 rounded-lg p-3 border border-border-dark flex gap-3 items-start mb-3">
                                <div className="w-10 h-10 rounded bg-panel-dark border border-border-dark flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary">code</span>
                                </div>
                                <div className="overflow-hidden">
                                    <span className="text-white text-sm font-medium truncate block">stage2_race_map_v4.revsyncpkg</span>
                                    <span className="text-text-muted text-xs">4.2 MB • 2 hours ago</span>
                                </div>
                            </div>
                            {[['Signature', 'Ed25519 Verified', 'text-green-400'], ['Checksum', 'CRC32: OK', 'text-green-400'], ['Target ECU', 'Bosch MG1CS001', 'text-white']].map(([k, v, c]) => (
                                <div key={k} className="flex justify-between text-sm mb-1">
                                    <span className="text-text-muted">{k}</span><span className={`${c} font-mono text-xs`}>{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[{ label: 'Voltage', val: '12.8', unit: 'V', pct: 80, color: 'bg-green-500' }, { label: 'Temp', val: '42', unit: '°C', pct: 40, color: 'bg-blue-500' }].map(d => (
                                <div key={d.label} className="bg-panel-dark border border-border-dark rounded-xl p-4 flex flex-col gap-1">
                                    <span className="text-text-muted text-[11px] uppercase font-bold tracking-wider">{d.label}</span>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-mono font-bold text-white">{d.val}</span>
                                        <span className="text-sm text-text-muted mb-1">{d.unit}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1 rounded-full mt-2 overflow-hidden">
                                        <div className={`${d.color} h-full`} style={{ width: `${d.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Checklist + Action */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                        <div className="bg-panel-dark border border-border-dark rounded-xl p-6 flex-1 flex flex-col">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">checklist</span>Pre-Flash Verification
                            </h3>
                            <div className="flex-1 flex flex-col gap-2 mb-5">
                                {CHECKLIST.map((item, i) => (
                                    <label key={i} onClick={() => { const c = [...checked]; c[i] = !c[i]; setChecked(c); }}
                                        className="flex items-center gap-3 p-2.5 rounded bg-bg-dark/30 border border-border-dark cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${checked[i] ? 'bg-primary text-white' : 'bg-transparent border border-slate-500'}`}>
                                            {checked[i] && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
                                        </div>
                                        <span className="text-slate-300 text-sm">{item}</span>
                                    </label>
                                ))}
                            </div>
                            <button onClick={startFlash} disabled={!allChecked || phase === 'flashing'}
                                className={`w-full h-14 rounded-lg font-black text-lg uppercase flex items-center justify-center gap-3 transition-all ${phase === 'done' ? 'bg-green-600 text-white' :
                                    phase === 'flashing' ? 'bg-gradient-to-r from-primary to-red-600 text-white shadow-[0_0_20px_rgba(234,16,60,0.4)] border border-red-500' :
                                        allChecked ? 'bg-gradient-to-r from-primary to-red-600 text-white shadow-[0_0_20px_rgba(234,16,60,0.4)] border border-red-500 hover:scale-[1.01] active:scale-[0.99]' :
                                            'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    }`}>
                                <span className={`material-symbols-outlined ${phase === 'flashing' ? 'animate-pulse' : ''}`}>
                                    {phase === 'done' ? 'check_circle' : 'bolt'}
                                </span>
                                {phase === 'done' ? 'FLASH COMPLETE' : phase === 'flashing' ? 'FLASHING IN PROGRESS...' : 'BEGIN FLASH SEQUENCE'}
                            </button>
                            {phase === 'flashing' && (
                                <p className="text-center text-xs text-text-muted mt-2 flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm text-yellow-500">warning</span>
                                    Do not turn off ignition or disconnect power.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Progress Ring */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                        <div className="bg-panel-dark border border-border-dark rounded-xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,16,60,0.1),transparent_70%)]" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="relative w-56 h-56">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-border-dark" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="2" />
                                        <path className="text-primary"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor"
                                            strokeDasharray={`${progress}, 100`} strokeWidth="2" strokeLinecap="round"
                                            style={{ transition: 'stroke-dasharray 0.3s ease', filter: 'drop-shadow(0 0 10px rgba(234,16,60,0.5))' }} />
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                        <span className="text-4xl font-black text-white">{Math.round(progress)}%</span>
                                        <span className={`text-xs font-bold uppercase tracking-widest block ${phase === 'flashing' ? 'text-primary animate-pulse' : phase === 'done' ? 'text-green-500' : 'text-text-muted'}`}>
                                            {phase === 'flashing' ? 'Writing' : phase === 'done' ? 'Complete' : 'Ready'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 text-center space-y-1">
                                    <h4 className="text-white font-medium">{phase === 'flashing' ? `Sector ${Math.floor(progress / 25) + 1} Write` : phase === 'done' ? 'Verification OK' : 'Awaiting Start'}</h4>
                                    <p className="text-text-muted font-mono text-sm">Block: 0x40000 - 0x4FFFF</p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-dark/50 border border-border-dark mt-2">
                                        <span className={`w-2 h-2 rounded-full ${phase === 'flashing' ? 'bg-green-500 animate-pulse' : 'bg-text-muted'}`} />
                                        <span className="text-xs text-text-muted">{phase === 'flashing' ? 'Bus Activity High' : 'Idle'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal */}
                <div className="h-44 terminal-bg rounded-xl border border-border-dark p-4 flex flex-col shrink-0 overflow-hidden">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                        <div className="flex gap-2 items-center">
                            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 14 }}>terminal</span>
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">System Log</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-xs leading-5">
                        {logs.map((l, i) => (
                            <div key={i} className="text-gray-400">
                                <span className="text-gray-600">[{l.time}]</span>{' '}
                                {l.badge ? <>{l.text} <span className={l.badgeColor}>{l.badge}</span></> : l.text}
                            </div>
                        ))}
                        {phase === 'flashing' && <div className="text-white animate-pulse">_</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
