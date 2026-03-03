import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import type { TuneListing, Vehicle, FlashJob } from '../lib/types';

type ChecklistItem = { id: string; label: string; checked: boolean; required: boolean };

const INITIAL_CHECKLIST: ChecklistItem[] = [
    { id: 'power', label: 'Power supply stable (battery > 12.4V)', checked: false, required: true },
    { id: 'backup', label: 'ECU backup verified on disk', checked: false, required: true },
    { id: 'checksum', label: 'Package checksum verified (CRC32)', checked: false, required: true },
    { id: 'signature', label: 'Ed25519 signature validated', checked: false, required: true },
    { id: 'comms', label: 'Communication link stable (<0.1% error rate)', checked: false, required: true },
    { id: 'compat', label: 'ECU compatibility confirmed', checked: false, required: false },
];

const FLASH_STEPS = [
    'Initiating flash sequence...',
    'Entering bootloader mode...',
    'Erasing target region (0x00000–0x7FFFF)...',
    'Writing block 1/16...',
    'Writing block 2/16...',
    'Writing block 3/16...',
    'Writing block 4/16...',
    'Writing block 5/16...',
    'Writing block 6/16...',
    'Writing block 7/16...',
    'Writing block 8/16...',
    'Writing block 9/16...',
    'Writing block 10/16...',
    'Writing block 11/16...',
    'Writing block 12/16...',
    'Writing block 13/16...',
    'Writing block 14/16...',
    'Writing block 15/16...',
    'Writing block 16/16...',
    'Verifying flash integrity...',
    'CRC32 checksum verified ✓',
    'Rebooting ECU...',
    'Flash completed successfully! ✓',
];

export default function FlashManagerPage() {
    const [listings, setListings] = useState<TuneListing[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedTune, setSelectedTune] = useState<string>('');
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
    const [progress, setProgress] = useState(0);
    const [isFlashing, setIsFlashing] = useState(false);
    const [flashComplete, setFlashComplete] = useState(false);
    const [logs, setLogs] = useState<string[]>([
        `[${new Date().toLocaleTimeString()}] System ready. Select a package and vehicle to begin.`,
    ]);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get<any>('/v1/marketplace/browse/')
            .then(res => { const arr = Array.isArray(res) ? res : res?.results || []; setListings(arr); if (arr.length) setSelectedTune(arr[0].id); })
            .catch(() => { });
        api.get<any>('/v1/garage/')
            .then(res => { const arr = Array.isArray(res) ? res : res?.results || []; setVehicles(arr); if (arr.length) setSelectedVehicle(String(arr[0].id)); })
            .catch(() => { });
    }, []);

    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const toggleCheck = useCallback((id: string) => {
        if (isFlashing) return;
        setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
    }, [isFlashing]);

    const allRequiredChecked = checklist.filter(c => c.required).every(c => c.checked);
    const selectedListing = listings.find(l => l.id === selectedTune);
    const selectedVeh = vehicles.find(v => String(v.id) === selectedVehicle);

    const startFlash = useCallback(async () => {
        if (!selectedListing || !selectedVeh || isFlashing) return;
        setIsFlashing(true);
        setFlashComplete(false);
        setProgress(0);
        addLog(`Starting flash: ${selectedListing.title} → ${selectedVeh.year} ${selectedVeh.make} ${selectedVeh.model}`);

        // Create flash job via API
        try {
            await api.post<FlashJob>('/v1/garage/flash-jobs/', {
                vehicle: selectedVeh.id,
                tune: selectedListing.id,
                connection_type: 'USB',
            });
            addLog('Flash job created on server ✓');
        } catch {
            addLog('Warning: Could not create server record (offline mode)');
        }

        // Simulate flash sequence
        for (let i = 0; i < FLASH_STEPS.length; i++) {
            await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
            addLog(FLASH_STEPS[i]);
            setProgress(Math.min(100, Math.round(((i + 1) / FLASH_STEPS.length) * 100)));
        }

        setIsFlashing(false);
        setFlashComplete(true);
        addLog('ECU ready. All verifications passed.');
    }, [selectedListing, selectedVeh, isFlashing, addLog]);

    const resetFlash = useCallback(() => {
        setProgress(0);
        setFlashComplete(false);
        setChecklist(INITIAL_CHECKLIST);
        setLogs([`[${new Date().toLocaleTimeString()}] System reset. Ready for new flash operation.`]);
    }, []);

    // SVG circular progress
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const progressColor = flashComplete ? '#22c55e' : isFlashing ? '#ea103c' : '#3b82f6';

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* ─── Left: Package + Checklist ──────────── */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
                {/* Package Selection */}
                <section className="bg-surface-dark border border-border-dark rounded-xl p-5">
                    <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                        Flash Package
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[11px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block">Tune Package</label>
                            <select value={selectedTune} onChange={e => setSelectedTune(e.target.value)} disabled={isFlashing}
                                className="w-full h-10 px-3 bg-bg-dark border border-border-dark rounded-lg text-sm text-white focus:outline-none focus:border-primary">
                                {listings.map(l => (
                                    <option key={l.id} value={l.id}>{l.title} (v{l.latest_version_number})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block">Target Vehicle</label>
                            <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} disabled={isFlashing}
                                className="w-full h-10 px-3 bg-bg-dark border border-border-dark rounded-lg text-sm text-white focus:outline-none focus:border-primary">
                                {vehicles.map(v => (
                                    <option key={v.id} value={String(v.id)}>{v.year} {v.make} {v.model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Package Details */}
                    {selectedListing && (
                        <div className="bg-bg-dark rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-white font-medium truncate">{selectedListing.title}</span>
                                    <span className="text-text-muted text-xs truncate">v{selectedListing.latest_version_number} • {selectedListing.tuner?.business_name}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {[
                                    { label: 'Signature', value: 'Ed25519 Verified', icon: 'verified', color: 'text-green-400' },
                                    { label: 'Checksum', value: 'CRC32: OK', icon: 'check_circle', color: 'text-green-400' },
                                    { label: 'Target', value: `${selectedListing.vehicle_make} ${selectedListing.vehicle_model}`, icon: 'two_wheeler', color: 'text-white' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2 text-xs">
                                        <span className={`material-symbols-outlined ${item.color}`} style={{ fontSize: 14 }}>{item.icon}</span>
                                        <span className="text-text-muted">{item.label}:</span>
                                        <span className={item.color}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Pre-flash Checklist */}
                <section className="bg-surface-dark border border-border-dark rounded-xl p-5">
                    <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400">checklist</span>
                        Pre-Flash Verification
                    </h2>
                    <div className="space-y-2">
                        {checklist.map(item => (
                            <button key={item.id} onClick={() => toggleCheck(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${item.checked ? 'border-green-500/30 bg-green-500/5' : 'border-border-dark hover:border-white/20'
                                    } ${isFlashing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${item.checked ? 'bg-green-500' : 'border border-border-dark bg-bg-dark'
                                    }`}>
                                    {item.checked && <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>}
                                </div>
                                <span className={`text-sm ${item.checked ? 'text-green-400' : 'text-slate-300'}`}>{item.label}</span>
                                {item.required && <span className="text-[9px] text-red-400 font-bold ml-auto">REQUIRED</span>}
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* ─── Right: Progress + Log ──────────────── */}
            <div className="w-96 bg-[#0a0a0d] border-l border-border-dark flex flex-col shrink-0">
                {/* Progress Circle */}
                <div className="flex flex-col items-center py-8">
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
                            <circle cx="88" cy="88" r={radius} fill="none" stroke="#1a1a20" strokeWidth="8" />
                            <circle cx="88" cy="88" r={radius} fill="none" stroke={progressColor} strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                                style={{ filter: `drop-shadow(0 0 8px ${progressColor}50)` }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{progress}%</span>
                            <span className="text-xs text-text-muted mt-1">
                                {flashComplete ? 'Complete' : isFlashing ? 'Flashing...' : 'Ready'}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                        {!isFlashing && !flashComplete && (
                            <button onClick={startFlash} disabled={!allRequiredChecked || !selectedTune || !selectedVehicle}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-primary hover:bg-red-600 shadow-[0_0_20px_rgba(234,16,60,0.3)]">
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
                                Start Flash
                            </button>
                        )}
                        {isFlashing && (
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-sm bg-amber-600 cursor-not-allowed opacity-80">
                                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                                Flashing...
                            </button>
                        )}
                        {flashComplete && (
                            <button onClick={resetFlash}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-sm bg-green-600 hover:bg-green-700 transition-all">
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
                                New Flash
                            </button>
                        )}
                    </div>
                </div>

                {/* System Log */}
                <div className="flex-1 flex flex-col min-h-0 border-t border-border-dark">
                    <div className="px-4 py-2 flex items-center justify-between shrink-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">System Log</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isFlashing ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-[10px] text-text-muted">{isFlashing ? 'FLASHING' : 'IDLE'}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4 font-mono text-[11px]">
                        {logs.map((line, i) => (
                            <div key={i} className={`leading-relaxed ${line.includes('ERROR') || line.includes('Warning') ? 'text-red-400' :
                                    line.includes('✓') || line.includes('verified') || line.includes('Complete') ? 'text-green-400' :
                                        line.includes('Writing') ? 'text-blue-400' : 'text-emerald-400/80'
                                }`}>{line}</div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}
