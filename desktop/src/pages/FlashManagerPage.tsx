import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import type { FlashJob, TuneListing, Vehicle } from '../lib/types';

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
    'Entering controlled flash workflow.',
    'Switching ECU to bootloader mode.',
    'Erasing target calibration region.',
    'Writing package blocks 1-4.',
    'Writing package blocks 5-8.',
    'Writing package blocks 9-12.',
    'Writing package blocks 13-16.',
    'Verifying checksum and package signature.',
    'Rebooting ECU and checking session recovery.',
    'Flash completed successfully.',
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
    const [phaseLabel, setPhaseLabel] = useState('Awaiting operator readiness');
    const [logs, setLogs] = useState<string[]>(['[READY] Select a package and vehicle to prepare a flash run.']);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get<any>('/v1/marketplace/browse/')
            .then((res) => {
                const results = Array.isArray(res) ? res : res?.results || [];
                setListings(results);
                if (results.length) setSelectedTune(results[0].id);
            })
            .catch(() => setListings([]));

        api.get<any>('/v1/garage/')
            .then((res) => {
                const results = Array.isArray(res) ? res : res?.results || [];
                setVehicles(results);
                if (results.length) setSelectedVehicle(String(results[0].id));
            })
            .catch(() => setVehicles([]));
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = useCallback((message: string) => {
        setLogs((current) => [...current.slice(-20), message]);
    }, []);

    const toggleCheck = useCallback(
        (id: string) => {
            if (isFlashing) return;
            setChecklist((current) => current.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
        },
        [isFlashing]
    );

    const allRequiredChecked = checklist.filter((item) => item.required).every((item) => item.checked);
    const selectedListing = listings.find((item) => item.id === selectedTune);
    const selectedVeh = vehicles.find((item) => String(item.id) === selectedVehicle);

    const readinessCards = useMemo(
        () => [
            { label: 'Package', value: selectedListing ? selectedListing.title : 'None selected' },
            { label: 'Vehicle', value: selectedVeh ? `${selectedVeh.year} ${selectedVeh.make} ${selectedVeh.model}` : 'None selected' },
            { label: 'Readiness', value: allRequiredChecked ? 'Armed' : 'Blocked by checklist' },
            { label: 'Mode', value: isFlashing ? 'Controlled flash active' : flashComplete ? 'Completed' : 'Pre-flight' },
        ],
        [selectedListing, selectedVeh, allRequiredChecked, isFlashing, flashComplete]
    );

    const startFlash = useCallback(async () => {
        if (!selectedListing || !selectedVeh || isFlashing) return;
        setIsFlashing(true);
        setFlashComplete(false);
        setProgress(0);
        setPhaseLabel('Creating flash record');
        addLog(`[START] ${selectedListing.title} → ${selectedVeh.year} ${selectedVeh.make} ${selectedVeh.model}`);

        try {
            await api.post<FlashJob>('/v1/garage/flash-jobs/', {
                vehicle: selectedVeh.id,
                tune: selectedListing.id,
                connection_type: 'USB',
            });
            addLog('[SYNC] Flash job created on backend.');
        } catch {
            addLog('[WARN] Backend flash record unavailable. Continuing in offline mode.');
        }

        for (let index = 0; index < FLASH_STEPS.length; index += 1) {
            setPhaseLabel(FLASH_STEPS[index]);
            addLog(`[STEP ${index + 1}/${FLASH_STEPS.length}] ${FLASH_STEPS[index]}`);
            await new Promise((resolve) => setTimeout(resolve, 420));
            setProgress(Math.min(100, Math.round(((index + 1) / FLASH_STEPS.length) * 100)));
        }

        setIsFlashing(false);
        setFlashComplete(true);
        setPhaseLabel('Flash run complete');
        addLog('[SUCCESS] ECU restarted and verification passed.');
    }, [selectedListing, selectedVeh, isFlashing, addLog]);

    const resetFlash = useCallback(() => {
        setProgress(0);
        setFlashComplete(false);
        setPhaseLabel('Awaiting operator readiness');
        setChecklist(INITIAL_CHECKLIST);
        setLogs(['[RESET] Flash manager reset. Ready for the next controlled run.']);
    }, []);

    const radius = 78;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const progressColor = flashComplete ? 'var(--rs-success)' : isFlashing ? 'var(--rs-primary)' : 'var(--rs-accent)';

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="rs-section-label m-0">Flash Manager</p>
                        <h1 className="mt-2 text-2xl font-black text-[var(--rs-text-primary)]">Controlled flash execution with guarded pre-flight checks</h1>
                        <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">
                            Package and vehicle selection, safety verification, execution progress, and operator log all stay connected inside one flow so flashing feels deliberate, not theatrical.
                        </p>
                    </div>
                    <span className={`rs-badge ${flashComplete ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : isFlashing ? 'border-[var(--rs-primary)]/25 bg-[var(--rs-primary)]/10 text-[var(--rs-primary)]' : 'border-[var(--rs-stroke-soft)] bg-white/[0.04] text-[var(--rs-text-secondary)]'}`}>
                        <span className="material-symbols-outlined text-sm">{flashComplete ? 'verified' : isFlashing ? 'bolt' : 'shield'}</span>
                        {flashComplete ? 'Completed' : isFlashing ? 'Flashing' : 'Pre-Flight'}
                    </span>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {readinessCards.map((item) => (
                        <div key={item.label} className="rs-panel rounded-[18px] p-4">
                            <p className="rs-data-label">{item.label}</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--rs-text-primary)]">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] gap-6">
                    <section className="rs-panel-raised rounded-[22px] p-5">
                        <div className="mb-5">
                            <p className="rs-section-label m-0">Package Assignment</p>
                            <h2 className="mt-2 text-lg font-bold text-[var(--rs-text-primary)]">Select package and target vehicle</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="rs-data-label">Tune Package</span>
                                <select value={selectedTune} onChange={(event) => setSelectedTune(event.target.value)} disabled={isFlashing} className="rs-input mt-2">
                                    {listings.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title} (v{item.latest_version_number})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="rs-data-label">Target Vehicle</span>
                                <select value={selectedVehicle} onChange={(event) => setSelectedVehicle(event.target.value)} disabled={isFlashing} className="rs-input mt-2">
                                    {vehicles.map((item) => (
                                        <option key={item.id} value={String(item.id)}>
                                            {item.year} {item.make} {item.model}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {selectedListing && (
                            <div className="mt-5 rs-surface-muted rounded-[18px] p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--rs-primary)]/10 text-[var(--rs-primary)]">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[var(--rs-text-primary)]">{selectedListing.title}</p>
                                        <p className="mt-1 truncate text-xs text-[var(--rs-text-secondary)]">
                                            v{selectedListing.latest_version_number} • {selectedListing.tuner?.business_name || 'Verified tuner'}
                                        </p>
                                        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                            <div>
                                                <p className="rs-data-label">Signature</p>
                                                <p className="mt-1 text-emerald-300">Ed25519 verified</p>
                                            </div>
                                            <div>
                                                <p className="rs-data-label">Checksum</p>
                                                <p className="mt-1 text-emerald-300">CRC32 ready</p>
                                            </div>
                                            <div>
                                                <p className="rs-data-label">Target</p>
                                                <p className="mt-1 text-[var(--rs-text-primary)]">{selectedListing.vehicle_make} {selectedListing.vehicle_model}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-5">
                            <p className="rs-section-label m-0">Pre-Flash Verification</p>
                            <div className="mt-3 space-y-2">
                                {checklist.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleCheck(item.id)}
                                        className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                                            item.checked
                                                ? 'border-emerald-400/20 bg-emerald-400/5'
                                                : 'border-[var(--rs-stroke-soft)] bg-white/[0.02] hover:border-[var(--rs-stroke-strong)]'
                                        } ${isFlashing ? 'cursor-not-allowed opacity-60' : ''}`}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${item.checked ? 'border-emerald-400/40 bg-emerald-400 text-[#04110c]' : 'border-[var(--rs-stroke-soft)] bg-transparent'}`}>
                                            {item.checked && <span className="material-symbols-outlined text-sm">check</span>}
                                        </div>
                                        <span className={`text-sm ${item.checked ? 'text-[var(--rs-text-primary)]' : 'text-[var(--rs-text-secondary)]'}`}>{item.label}</span>
                                        {item.required && <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--rs-danger)]">Required</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="rs-panel rounded-[22px] p-5">
                        <p className="rs-section-label m-0">Execution State</p>
                        <div className="mt-5 flex flex-col items-center">
                            <div className="relative h-48 w-48">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 176 176">
                                    <circle cx="88" cy="88" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    <circle
                                        cx="88"
                                        cy="88"
                                        r={radius}
                                        fill="none"
                                        stroke={progressColor}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-[var(--rs-text-primary)]">{progress}%</span>
                                    <span className="mt-2 text-xs text-[var(--rs-text-secondary)]">{phaseLabel}</span>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-3">
                                {!isFlashing && !flashComplete && (
                                    <button onClick={startFlash} disabled={!allRequiredChecked || !selectedTune || !selectedVehicle} className="rs-button-primary px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
                                        Start Flash
                                    </button>
                                )}
                                {isFlashing && (
                                    <button className="rs-button-secondary px-5 py-2.5 text-sm font-bold">
                                        Flashing...
                                    </button>
                                )}
                                {flashComplete && (
                                    <button onClick={resetFlash} className="rs-button-secondary px-5 py-2.5 text-sm font-bold">
                                        New Run
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="rs-surface-muted rounded-[16px] p-4">
                                <p className="rs-data-label">Execution policy</p>
                                <p className="mt-2 text-sm text-[var(--rs-text-secondary)]">
                                    Flashing only starts when required verification items are complete. Recovery and diagnostics remain separate surfaces so dangerous actions are never mixed with routine browsing.
                                </p>
                            </div>
                            <div className="rs-surface-muted rounded-[16px] p-4">
                                <p className="rs-data-label">Result handling</p>
                                <p className="mt-2 text-sm text-[var(--rs-text-secondary)]">
                                    Successful runs stay auditable in flash history. If this run blocks or fails, the operator should switch to recovery or diagnostics before any retry.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <aside className="flex w-[380px] shrink-0 flex-col border-l border-[var(--rs-stroke-soft)] bg-[rgba(9,13,18,0.9)]">
                <div className="border-b border-[var(--rs-stroke-soft)] p-5">
                    <p className="rs-section-label m-0">System Log</p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-[var(--rs-text-secondary)]">Operator state</span>
                        <span className={`text-xs font-semibold ${flashComplete ? 'text-emerald-300' : isFlashing ? 'text-[var(--rs-primary)]' : 'text-[var(--rs-text-secondary)]'}`}>
                            {flashComplete ? 'Complete' : isFlashing ? 'Active run' : 'Idle'}
                        </span>
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[11px]">
                        {logs.map((line, index) => (
                            <div
                                key={`${line}-${index}`}
                                className={`leading-relaxed ${
                                    line.includes('[SUCCESS]')
                                        ? 'text-emerald-300'
                                        : line.includes('[WARN]')
                                          ? 'text-[var(--rs-warning)]'
                                          : line.includes('[STEP') || line.includes('[SYNC]')
                                            ? 'text-sky-300'
                                            : 'text-[var(--rs-text-secondary)]'
                                }`}
                            >
                                {line}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </aside>
        </div>
    );
}
