import { useState } from 'react';

const SAFETY_CHECKS = [
    { label: 'Battery voltage is above 12.5V', warning: true },
    { label: 'Vehicle connected via JTAG debug port' },
    { label: 'Ignition is ON, engine is OFF' },
    { label: 'Original ROM backup is saved externally' },
    { label: 'Sufficient power supply / UPS connected' },
];

const RECOVERY_LOG = [
    { time: '14:55:01', text: 'JTAG: Initializing bypass module...', type: 'info' },
    { time: '14:55:02', text: 'JTAG: TAP detected → ARM Cortex-M4F', type: 'info' },
    { time: '14:55:03', text: 'JTAG: Halting CPU core...', type: 'info' },
    { time: '14:55:04', text: 'JTAG: Reading flash protection level → Level 2 (CRITICAL)', type: 'warn' },
    { time: '14:55:05', text: 'JTAG: Attempting mass erase bypass...', type: 'info' },
    { time: '14:55:08', text: 'JTAG: Flash erased. Preparing to write recovery image...', type: 'success' },
];

export default function RecoveryPage() {
    const [checks, setChecks] = useState(SAFETY_CHECKS.map(() => false));
    const [phase, setPhase] = useState<'detect' | 'restoring' | 'done'>('detect');
    const [logs, setLogs] = useState(RECOVERY_LOG);
    const allChecked = checks.every(Boolean);

    const startRecovery = () => {
        if (!allChecked) return;
        setPhase('restoring');
        const lines = [
            { time: '14:55:10', text: 'Writing recovery image block 1/16...', type: 'info' },
            { time: '14:55:15', text: 'Writing recovery image block 8/16...', type: 'info' },
            { time: '14:55:20', text: 'Writing recovery image block 16/16... DONE', type: 'success' },
            { time: '14:55:22', text: 'Verifying CRC32... MATCH', type: 'success' },
            { time: '14:55:23', text: 'Recovery complete. ECU is now bootable.', type: 'success' },
        ];
        let i = 0;
        const iv = setInterval(() => {
            if (i >= lines.length) { clearInterval(iv); setPhase('done'); return; }
            setLogs(prev => [...prev, lines[i]]);
            i++;
        }, 600);
    };

    return (
        <div className="flex-1 overflow-y-auto relative">
            <div className="absolute inset-0 danger-gradient pointer-events-none" />
            <div className="absolute inset-0 dot-grid pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-12 flex flex-col gap-6">
                {/* Warning Banner */}
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-5 flex items-start gap-4 animate-fade-up">
                    <span className="material-symbols-outlined text-red-500 text-3xl shrink-0 animate-pulse">warning</span>
                    <div>
                        <h2 className="text-red-400 font-black text-lg uppercase tracking-wider">Emergency ECU Recovery Mode</h2>
                        <p className="text-text-muted text-sm mt-1">This tool writes directly to the ECU flash via JTAG. Incorrect use can permanently damage your ECU. Only proceed if the ECU is in a bricked or non-bootable state.</p>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500" style={{ fontSize: 36 }}>healing</span>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">ECU Recovery Wizard</h1>
                        <p className="text-text-muted text-sm">JTAG Direct Flash • Advanced Debug Interface</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Safety + Actions */}
                    <div className="flex flex-col gap-5">
                        {/* Safety Checklist */}
                        <div className="bg-panel-dark border border-border-dark rounded-xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500">shield</span>Safety Checklist
                            </h3>
                            <div className="flex flex-col gap-2.5">
                                {SAFETY_CHECKS.map((item, i) => (
                                    <label key={i} onClick={() => { const c = [...checks]; c[i] = !c[i]; setChecks(c); }}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checks[i] ? 'bg-green-500/5 border-green-500/20' : 'bg-bg-dark/30 border-border-dark hover:bg-white/5'
                                            }`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${checks[i] ? 'bg-green-500 text-white' : 'border border-slate-500'}`}>
                                            {checks[i] && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
                                        </div>
                                        <span className="text-slate-300 text-sm">{item.label}</span>
                                        {item.warning && <span className="material-symbols-outlined text-red-500 ml-auto" style={{ fontSize: 16 }}>priority_high</span>}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-panel-dark border border-border-dark rounded-xl p-5 flex flex-col">
                                <span className="material-symbols-outlined text-primary text-2xl mb-3">search</span>
                                <h4 className="text-white font-bold text-sm mb-1">Step 1: Detect</h4>
                                <p className="text-text-muted text-xs mb-4 flex-1">Scan JTAG port and identify the bricked ECU hardware ID.</p>
                                <button className="w-full py-2.5 bg-bg-dark border border-border-dark hover:border-primary/30 text-white rounded-lg text-sm font-medium transition-colors">
                                    Run Detection
                                </button>
                            </div>
                            <div className="bg-panel-dark border border-border-dark rounded-xl p-5 flex flex-col">
                                <span className="material-symbols-outlined text-red-500 text-2xl mb-3">restore</span>
                                <h4 className="text-white font-bold text-sm mb-1">Step 2: Restore</h4>
                                <p className="text-text-muted text-xs mb-4 flex-1">Flash the factory ROM image to restore the ECU to a bootable state.</p>
                                <button onClick={startRecovery} disabled={!allChecked || phase === 'restoring'}
                                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${allChecked && phase !== 'restoring' ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                            : 'bg-bg-dark border border-border-dark text-text-muted cursor-not-allowed'
                                        }`}>
                                    {phase === 'done' ? '✓ Restored' : phase === 'restoring' ? 'Restoring...' : 'Flash Recovery Image'}
                                </button>
                            </div>
                        </div>

                        {/* ECU Info */}
                        <div className="bg-panel-dark border border-border-dark rounded-xl p-4">
                            <h4 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>memory</span>Detected Hardware
                            </h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                {[['MCU', 'Renesas SH7058'], ['Flash', '2MB Internal NOR'], ['JTAG ID', '0x4BA00477'], ['State', 'LOCKED (Level 2)']].map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between py-1.5 border-b border-border-dark">
                                        <span className="text-text-muted">{k}</span><span className="text-white font-mono text-xs">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: JTAG Console */}
                    <div className="flex flex-col gap-4">
                        <div className="terminal-bg border border-border-dark rounded-xl p-4 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 14 }}>terminal</span>
                                    <span className="text-[11px] text-text-muted font-bold uppercase tracking-widest">JTAG Console</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${phase === 'restoring' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-[11px] text-text-muted">{phase === 'restoring' ? 'Active' : phase === 'done' ? 'Complete' : 'Idle'}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto font-mono text-xs leading-5">
                                {logs.map((l, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-text-muted shrink-0">[{l.time}]</span>
                                        <span className={l.type === 'warn' ? 'text-yellow-500' : l.type === 'success' ? 'text-green-500' : 'text-gray-400'}>{l.text}</span>
                                    </div>
                                ))}
                                {phase === 'restoring' && <div className="text-green-500 animate-pulse">_</div>}
                            </div>
                        </div>

                        {/* Progress */}
                        {phase !== 'detect' && (
                            <div className="bg-panel-dark border border-border-dark rounded-xl p-5 animate-fade-up">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white font-medium">Recovery Progress</span>
                                    <span className={`font-bold ${phase === 'done' ? 'text-green-500' : 'text-primary'}`}>{phase === 'done' ? '100%' : 'In Progress...'}</span>
                                </div>
                                <div className="w-full bg-bg-dark h-2 rounded-full">
                                    <div className={`h-full rounded-full transition-all duration-700 ${phase === 'done' ? 'bg-green-500 w-full' : 'bg-primary w-3/5 animate-pulse'}`} />
                                </div>
                                <div className="mt-3 text-xs text-text-muted flex justify-between">
                                    <span>Blocks written: {phase === 'done' ? '16/16' : '10/16'}</span>
                                    <span>Est. time: {phase === 'done' ? '0s' : '~5s'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
