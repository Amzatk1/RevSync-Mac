import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import type { Vehicle } from '../lib/types';

const CRITICAL_CHECKLIST = [
    { label: 'Battery is fully charged and externally supported', checked: true },
    { label: 'OBD or bench harness is secured with no movement', checked: true },
    { label: 'Ignition is ON and engine remains OFF', checked: false },
    { label: 'Recovery image has been verified against the target ECU', checked: false },
    { label: 'I understand power loss can permanently damage the ECU', checked: false },
];

const IDLE_LINES = [
    '[RECOVERY] Tooling initialized.',
    '[INFO] Awaiting operator confirmation before recovery session starts.',
];

export default function RecoveryPage() {
    const [checklist, setChecklist] = useState(CRITICAL_CHECKLIST);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [recoveryState, setRecoveryState] = useState<'idle' | 'detecting' | 'ready' | 'recovering' | 'complete'>('idle');
    const [consoleLines, setConsoleLines] = useState<string[]>(IDLE_LINES);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        api.get<Vehicle[]>('/v1/garage/')
            .then((res) => setVehicles(Array.isArray(res) ? res : []))
            .catch(() => setVehicles([]));

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const toggleCheck = (index: number) => {
        if (recoveryState === 'recovering') return;
        setChecklist((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, checked: !item.checked } : item)));
    };

    const allChecked = checklist.every((item) => item.checked);
    const primaryVehicle = vehicles[0];

    const statusRows = useMemo(
        () => [
            { label: 'Recovery source', value: primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model} factory ROM` : 'Factory ROM backup #4' },
            { label: 'Integrity', value: 'SHA-256 verified' },
            { label: 'Transport', value: 'Bench + JTAG fallback armed' },
            { label: 'Policy', value: 'Fail-closed recovery mode' },
        ],
        [primaryVehicle]
    );

    const runDetection = () => {
        setRecoveryState('detecting');
        setConsoleLines([
            '[RECOVERY] Probing bench connection.',
            '[JTAG] Target device detected: ARM Cortex-M4.',
            '[JTAG] Halting CPU and checking flash lock bits.',
            '[RECOVERY] Awaiting operator flash command.',
        ]);

        timerRef.current = window.setTimeout(() => {
            setRecoveryState('ready');
            setConsoleLines((current) => [...current, '[READY] ECU halted and recovery transport is stable.']);
        }, 1600);
    };

    const startRecovery = () => {
        if (!allChecked) return;
        setRecoveryState('recovering');
        setConsoleLines([
            '[RECOVERY] Recovery flash started.',
            '[ERASE] Clearing target flash regions.',
            '[WRITE] Writing factory recovery image.',
            '[VERIFY] Verifying checksum and restart policy.',
        ]);

        timerRef.current = window.setTimeout(() => {
            setRecoveryState('complete');
            setConsoleLines((current) => [...current, '[SUCCESS] Recovery image verified. ECU ready for controlled reconnect.']);
        }, 2400);
    };

    const resetRecovery = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setRecoveryState('idle');
        setChecklist(CRITICAL_CHECKLIST);
        setConsoleLines(IDLE_LINES);
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div className="rs-panel-raised rounded-[22px] border-[var(--rs-danger)]/25 p-5">
                    <div className="flex items-start justify-between gap-6">
                        <div className="max-w-3xl">
                            <p className="rs-section-label m-0 text-[var(--rs-danger)]">Emergency Recovery Mode</p>
                            <h1 className="mt-2 text-2xl font-black text-[var(--rs-text-primary)]">Restore a non-responsive ECU using verified backup media</h1>
                            <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">
                                Recovery mode keeps the workspace fail-closed. Flashing stays blocked until transport is stable, the correct backup is selected, and the operator confirms all preconditions.
                            </p>
                        </div>
                        <span className={`rs-badge ${recoveryState === 'complete' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : recoveryState === 'recovering' ? 'border-[var(--rs-danger)]/30 bg-[var(--rs-danger)]/10 text-[var(--rs-danger)]' : 'border-[var(--rs-warning)]/30 bg-[var(--rs-warning)]/10 text-[var(--rs-warning)]'}`}>
                            <span className="material-symbols-outlined text-sm">{recoveryState === 'complete' ? 'check_circle' : recoveryState === 'recovering' ? 'warning' : 'shield'}</span>
                            {recoveryState === 'complete' ? 'Recovered' : recoveryState === 'recovering' ? 'Critical Operation' : 'Guarded'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {statusRows.map((item) => (
                        <div key={item.label} className="rs-panel rounded-[18px] p-4">
                            <p className="rs-data-label">{item.label}</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--rs-text-primary)]">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-6">
                    <section className="rs-panel rounded-[22px] p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="rs-section-label m-0">Recovery Source</p>
                                <h2 className="mt-2 text-lg font-bold text-[var(--rs-text-primary)]">Selected backup image</h2>
                            </div>
                            <span className="rs-badge border-[var(--rs-warning)]/25 bg-[var(--rs-warning)]/10 text-[var(--rs-warning)]">Backup #4</span>
                        </div>

                        <div className="rs-surface-muted rounded-[18px] p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[var(--rs-warning)]/20 bg-[var(--rs-warning)]/10">
                                    <span className="material-symbols-outlined text-2xl text-[var(--rs-warning)]">storage</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--rs-text-primary)]">
                                        {primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model} Factory Recovery ROM` : 'ZX-6R Factory Recovery ROM'}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">
                                        {primaryVehicle?.created_at ? new Date(primaryVehicle.created_at).toLocaleDateString() : '2025-06-15'} • 4.2 MB • SHA-256 verified • Signed recovery manifest
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-2xl text-emerald-300">verified</span>
                            </div>
                        </div>

                        <div className="mt-5">
                            <p className="rs-section-label m-0">Critical Checklist</p>
                            <div className="mt-3 space-y-2">
                                {checklist.map((item, index) => (
                                    <button
                                        key={item.label}
                                        onClick={() => toggleCheck(index)}
                                        className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                                            item.checked
                                                ? 'border-emerald-400/20 bg-emerald-400/5'
                                                : 'border-[var(--rs-stroke-soft)] bg-white/[0.02] hover:border-[var(--rs-stroke-strong)]'
                                        } ${recoveryState === 'recovering' ? 'cursor-not-allowed opacity-60' : ''}`}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${item.checked ? 'border-emerald-400/40 bg-emerald-400 text-[#04110c]' : 'border-[var(--rs-stroke-soft)] bg-transparent'}`}>
                                            {item.checked && <span className="material-symbols-outlined text-sm">check</span>}
                                        </div>
                                        <span className={`text-sm ${item.checked ? 'text-[var(--rs-text-primary)]' : 'text-[var(--rs-text-secondary)]'}`}>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 rounded-[18px] border border-[var(--rs-danger)]/20 bg-[var(--rs-danger)]/8 p-4">
                            <p className="text-sm font-bold text-[var(--rs-danger)]">Irreversible operation</p>
                            <p className="mt-2 text-xs leading-relaxed text-[var(--rs-text-secondary)]">
                                Recovery mode erases and rewrites the full ECU image. If transport fails or supply voltage drops during write, the ECU can remain unusable until bench recovery succeeds.
                            </p>
                        </div>
                    </section>

                    <section className="rs-panel-raised rounded-[22px] p-5">
                        <p className="rs-section-label m-0">Action Stack</p>
                        <div className="mt-4 space-y-4">
                            <div className="rs-surface-muted rounded-[18px] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[var(--rs-accent)]/12 text-sm font-black text-[var(--rs-accent)]">1</div>
                                    <p className="text-sm font-semibold text-[var(--rs-text-primary)]">Reconnect and detect</p>
                                </div>
                                <p className="mt-3 text-xs text-[var(--rs-text-secondary)]">Establish a bench or recovery transport, halt the ECU, and confirm the image target before write operations are exposed.</p>
                                <button onClick={runDetection} disabled={recoveryState === 'recovering'} className="rs-button-secondary mt-4 w-full px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                                    {recoveryState === 'detecting' ? 'Detecting Recovery Session' : recoveryState === 'ready' || recoveryState === 'complete' ? 'Re-check Connection' : 'Force Reconnect'}
                                </button>
                            </div>

                            <div className="rs-surface-muted rounded-[18px] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[var(--rs-primary)]/12 text-sm font-black text-[var(--rs-primary)]">2</div>
                                    <p className="text-sm font-semibold text-[var(--rs-text-primary)]">Restore from backup</p>
                                </div>
                                <p className="mt-3 text-xs text-[var(--rs-text-secondary)]">Start a full erase/write/verify sequence only when every checklist item is complete and transport stability has been confirmed.</p>
                                <button
                                    onClick={startRecovery}
                                    disabled={!allChecked || (recoveryState !== 'ready' && recoveryState !== 'complete')}
                                    className="rs-button-primary mt-4 w-full px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {recoveryState === 'recovering' ? 'Recovery In Progress' : recoveryState === 'complete' ? 'Re-run Recovery' : 'Begin Recovery Flash'}
                                </button>
                            </div>

                            <div className="rs-surface-muted rounded-[18px] p-4">
                                <p className="rs-data-label">Support and evidence</p>
                                <div className="mt-3 space-y-2 text-sm text-[var(--rs-text-secondary)]">
                                    <div className="flex items-center justify-between">
                                        <span>Diagnostic dump</span>
                                        <span className="text-[var(--rs-text-primary)]">Available</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Crash report bundle</span>
                                        <span className="text-[var(--rs-text-primary)]">Available</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Operator reset</span>
                                        <button onClick={resetRecovery} className="text-sm font-semibold text-[var(--rs-accent)] hover:text-white">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <aside className="flex w-[380px] shrink-0 flex-col border-l border-[var(--rs-stroke-soft)] bg-[rgba(9,13,18,0.9)]">
                <div className="border-b border-[var(--rs-stroke-soft)] p-5">
                    <p className="rs-section-label m-0">Recovery Console</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--rs-text-secondary)]">
                        <span>Transport state</span>
                        <span className={recoveryState === 'complete' ? 'text-emerald-300' : recoveryState === 'recovering' ? 'text-[var(--rs-danger)]' : 'text-[var(--rs-warning)]'}>
                            {recoveryState}
                        </span>
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[11px]">
                        {consoleLines.map((line, index) => (
                            <div
                                key={`${line}-${index}`}
                                className={`leading-relaxed ${
                                    line.includes('[SUCCESS]')
                                        ? 'text-emerald-300'
                                        : line.includes('[ERASE]') || line.includes('[WRITE]')
                                          ? 'text-[var(--rs-warning)]'
                                          : line.includes('[READY]')
                                            ? 'text-sky-300'
                                            : 'text-[var(--rs-text-secondary)]'
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
