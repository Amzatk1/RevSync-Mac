import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Vehicle } from '../lib/types';

const CRITICAL_CHECKLIST = [
    { label: 'Battery is fully charged and connected', checked: true },
    { label: 'OBD connector is securely plugged in', checked: true },
    { label: 'Ignition is ON, engine is OFF', checked: false },
    { label: 'I accept risk of ECU damage if power is lost', checked: false },
];

const CONSOLE_LINES = [
    { time: '14:45:01.110', text: 'JTAG: Target device detected — ARM Cortex-M4', color: 'text-amber-400' },
    { time: '14:45:01.332', text: 'JTAG: IDCODE = 0x2BA01477 (STM32F4xx)', color: 'text-green-500' },
    { time: '14:45:01.560', text: 'JTAG: Halting CPU...', color: 'text-amber-400' },
    { time: '14:45:02.002', text: 'JTAG: CPU halted at 0x08000000', color: 'text-green-500' },
    { time: '14:45:02.445', text: 'JTAG: Flash unlocked. Ready for operations.', color: 'text-green-500' },
    { time: '14:45:03.001', text: 'Waiting for user command...', color: 'text-gray-500', pulse: true },
];

export default function RecoveryPage() {
    const [checklist, setChecklist] = useState(CRITICAL_CHECKLIST);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        api.get<Vehicle[]>('/v1/garage/')
            .then(res => setVehicles(Array.isArray(res) ? res : []))
            .catch(() => { });
    }, []);

    const toggleCheck = (i: number) => {
        setChecklist(prev => prev.map((item, idx) => idx === i ? { ...item, checked: !item.checked } : item));
    };

    const allChecked = checklist.every(c => c.checked);

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Danger gradient background */}
            <div className="absolute inset-0 danger-gradient pointer-events-none z-0" />

            {/* Emergency Warning Strip */}
            <div className="relative z-10 bg-primary/20 border-b border-primary/30 px-6 py-3 flex items-center gap-3 shrink-0">
                <span className="material-symbols-outlined text-primary animate-pulse text-2xl">warning</span>
                <div>
                    <h2 className="text-primary font-black text-sm uppercase tracking-wider">Emergency Recovery Mode</h2>
                    <p className="text-red-300/80 text-xs">Critical ECU operations. Power interruption may cause permanent damage.</p>
                </div>
                <div className="ml-auto flex items-center gap-2 bg-primary/10 px-3 py-1 rounded border border-primary/30">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold text-primary uppercase">Active</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Left Pane: Recovery Wizard */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-primary text-4xl">healing</span>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">ECU Recovery</h1>
                            <p className="text-text-muted text-sm">Rescue bricked or corrupted ECUs using backup images</p>
                        </div>
                    </div>

                    {/* Recovery Image Section */}
                    <div className="bg-surface-dark border border-primary/20 rounded-xl overflow-hidden mb-6">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">backup</span>
                                    Recovery Source
                                </h3>
                                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">Backup #4</span>
                            </div>
                            <div className="bg-bg-dark p-4 rounded-lg border border-border-dark flex items-center gap-4">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-900/50 to-black border border-amber-800/50 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-amber-500 text-2xl">storage</span>
                                </div>
                                <div>
                                    <div className="text-white font-medium">
                                        {vehicles[0] ? `${vehicles[0].make} ${vehicles[0].model} — Factory ROM` : 'ZX-6R Factory ROM — Original'}
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5">
                                        Saved: {vehicles[0]?.created_at ? new Date(vehicles[0].created_at).toLocaleDateString() : '2024-06-15'} &bull; 4.2 MB &bull; SHA-256 Verified
                                    </div>
                                </div>
                                <span className="ml-auto material-symbols-outlined text-green-500">verified</span>
                            </div>
                        </div>
                    </div>

                    {/* Critical Checklist */}
                    <div className="bg-surface-dark border border-border-dark rounded-xl p-6 mb-6">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500">check_circle</span>
                            Critical Pre-Recovery Checklist
                        </h3>
                        <div className="flex flex-col gap-3">
                            {checklist.map((item, i) => (
                                <label key={i} className="flex items-center gap-3 p-3 rounded bg-bg-dark/50 border border-border-dark cursor-pointer hover:border-white/20 transition-colors"
                                    onClick={() => toggleCheck(i)}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${item.checked ? 'bg-green-600 border-green-500' : 'bg-transparent border-text-muted'
                                        }`}>
                                        {item.checked && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                    </div>
                                    <span className={`text-sm font-medium ${item.checked ? 'text-white' : 'text-text-muted'}`}>{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-4 items-start">
                        <span className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0">dangerous</span>
                        <div>
                            <h4 className="text-red-400 font-bold text-sm mb-1">WARNING: Irreversible Operation</h4>
                            <p className="text-red-300/70 text-xs">This will erase the entire flash memory of the ECU and write the recovery image. Ensure all checks pass before proceeding. Power loss during this operation <strong className="text-red-400">will brick the ECU permanently</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* Right Pane: Action Cards + Console */}
                <aside className="w-[480px] bg-panel-dark border-l border-border-dark flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-6 flex flex-col gap-4 flex-1">
                        {/* Step 1: Reconnect & Detect */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="text-primary font-black text-sm">1</span>
                                </div>
                                <h3 className="text-white font-bold">Reconnect & Detect</h3>
                            </div>
                            <p className="text-text-muted text-xs mb-4">Attempt to establish contact with the bricked ECU using the recovery protocol.</p>
                            <button className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">cable</span>
                                Force Reconnect (Recovery Mode)
                            </button>
                        </div>

                        {/* Step 2: Restore from Backup */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="text-primary font-black text-sm">2</span>
                                </div>
                                <h3 className="text-white font-bold">Restore from Backup</h3>
                            </div>
                            <p className="text-text-muted text-xs mb-4">Flash the selected recovery image onto the ECU. This will replace all ECU programming.</p>
                            <button disabled={!allChecked}
                                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${allChecked
                                        ? 'bg-primary hover:bg-red-600 text-white shadow-[0_0_15px_rgba(234,16,60,0.3)]'
                                        : 'bg-border-dark text-text-muted cursor-not-allowed'
                                    }`}>
                                <span className="material-symbols-outlined text-sm">restore</span>
                                {allChecked ? 'Begin Recovery Flash' : 'Complete Checklist First'}
                            </button>
                        </div>

                        {/* Diagnostic Dump */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-blue-400">download</span>
                                <h3 className="text-white font-bold">Diagnostic Dump</h3>
                            </div>
                            <p className="text-text-muted text-xs mb-3">Export a full crash report and ECU state for support analysis.</p>
                            <button className="w-full py-2.5 rounded-lg border border-border-dark text-text-muted hover:text-white hover:border-white/30 font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">bug_report</span>
                                Export Diagnostic Report
                            </button>
                        </div>

                        {/* JTAG Console */}
                        <div className="bg-black rounded-xl border border-border-dark p-4 flex-1 flex flex-col min-h-[200px]">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
                                <span className="material-symbols-outlined text-amber-400 text-sm">terminal</span>
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">JTAG Console</span>
                            </div>
                            <div className="flex-1 overflow-y-auto font-mono text-xs leading-5">
                                {CONSOLE_LINES.map((line, i) => (
                                    <div key={i} className={`${line.color} ${line.pulse ? 'animate-pulse' : ''}`}>
                                        <span className="text-gray-600">[{line.time}]</span> {line.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
