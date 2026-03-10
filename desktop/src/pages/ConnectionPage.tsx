import { useEffect, useMemo, useRef, useState } from 'react';

const PROTOCOLS = ['USB Serial (K-Line)', 'USB (J2534)', 'JTAG/SWD', 'Simulator'];
const BAUD_RATES = ['9600', '14400', '19200', '38400', '57600', '115200'];
const PORTS = ['/dev/ttyUSB0', '/dev/ttyACM0', 'COM3', 'COM4', 'Simulated ECU'];
const PARITY_OPTIONS = ['None', 'Even', 'Odd'];

type TimelineStep = {
    label: string;
    detail: string;
    status: 'done' | 'active' | 'pending';
    icon: string;
};

const IDLE_TIMELINE: TimelineStep[] = [
    { label: 'Adapter detected', detail: 'Waiting for transport probe.', status: 'pending', icon: 'usb' },
    { label: 'Physical connection', detail: 'Confirm loom and OBD interface.', status: 'pending', icon: 'cable' },
    { label: 'Protocol negotiation', detail: 'No session started.', status: 'pending', icon: 'sync' },
    { label: 'ECU identification', detail: 'Device identification idle.', status: 'pending', icon: 'memory' },
    { label: 'Security handshake', detail: 'Seed/key flow not requested.', status: 'pending', icon: 'lock' },
    { label: 'Programming session', detail: 'Session not armed.', status: 'pending', icon: 'check_circle' },
];

const CONNECTING_TIMELINE: TimelineStep[] = [
    { label: 'Adapter detected', detail: 'K-Line adapter v2.1 on /dev/ttyUSB0', status: 'done', icon: 'usb' },
    { label: 'Physical connection', detail: 'Port continuity verified.', status: 'done', icon: 'cable' },
    { label: 'Protocol negotiation', detail: 'ISO 14230 fast init accepted.', status: 'done', icon: 'sync' },
    { label: 'ECU identification', detail: 'Reading ECU hardware and firmware IDs.', status: 'active', icon: 'memory' },
    { label: 'Security handshake', detail: 'Seed/key exchange queued.', status: 'pending', icon: 'lock' },
    { label: 'Programming session', detail: 'Programming session (0x02) pending.', status: 'pending', icon: 'check_circle' },
];

const CONNECTED_TIMELINE: TimelineStep[] = [
    { label: 'Adapter detected', detail: 'K-Line adapter v2.1 on /dev/ttyUSB0', status: 'done', icon: 'usb' },
    { label: 'Physical connection', detail: 'OBD-II pinout validated.', status: 'done', icon: 'cable' },
    { label: 'Protocol negotiation', detail: 'ISO 14230 (KWP2000) fast init accepted.', status: 'done', icon: 'sync' },
    { label: 'ECU identification', detail: 'ECU ID 21175-1652 and CVN matched.', status: 'done', icon: 'memory' },
    { label: 'Security handshake', detail: 'Seed/key algorithm 2 approved.', status: 'done', icon: 'lock' },
    { label: 'Programming session', detail: 'Programming session armed and stable.', status: 'active', icon: 'check_circle' },
];

const IDLE_LOGS = [
    'Connection manager ready.',
    'Select transport settings to start a deterministic probe.',
    'Battery voltage check is required before programming mode.',
];

export default function ConnectionPage() {
    const [protocol, setProtocol] = useState(PROTOCOLS[0]);
    const [port, setPort] = useState(PORTS[0]);
    const [baud, setBaud] = useState('57600');
    const [parity, setParity] = useState(PARITY_OPTIONS[0]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>(IDLE_LOGS);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const timeline = isConnected ? CONNECTED_TIMELINE : isConnecting ? CONNECTING_TIMELINE : IDLE_TIMELINE;
    const progress = isConnected ? 100 : isConnecting ? 68 : 12;

    const summaryRows = useMemo(
        () => [
            { label: 'Transport', value: protocol },
            { label: 'Port', value: port },
            { label: 'Baud', value: `${baud} bps` },
            { label: 'Parity', value: parity },
        ],
        [protocol, port, baud, parity]
    );

    const handleConnect = () => {
        if (isConnecting) return;
        setIsConnecting(true);
        setIsConnected(false);
        setLogs([
            'Scanning interface and validating transport settings...',
            `Adapter opened on ${port} at ${baud} bps.`,
            'Protocol negotiation started.',
            'Reading ECU identification and seed/key challenge.',
        ]);

        timerRef.current = window.setTimeout(() => {
            setIsConnecting(false);
            setIsConnected(true);
            setLogs((current) => [
                ...current,
                'ECU identification complete: 21175-1652 / CVN-4E2A1109.',
                'Programming session entered successfully.',
                'Connection ready for diagnostics, backup, and flash preparation.',
            ]);
        }, 2200);
    };

    const handleReset = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setIsConnecting(false);
        setIsConnected(false);
        setLogs(IDLE_LOGS);
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="rs-section-label m-0">Connection Manager</p>
                        <h1 className="mt-2 text-2xl font-black text-[var(--rs-text-primary)]">Hardware interface setup, ECU detection, and session arming</h1>
                        <p className="mt-3 max-w-2xl text-sm text-[var(--rs-text-secondary)]">
                            Configure transport details, verify communication readiness, and establish a deterministic programming session before any read, backup, or flash workflow starts.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`rs-badge ${isConnected ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : isConnecting ? 'border-[var(--rs-accent)]/30 bg-[var(--rs-accent)]/10 text-[var(--rs-accent)]' : 'bg-white/5 text-[var(--rs-text-secondary)]'}`}>
                            <span className="material-symbols-outlined text-sm">{isConnected ? 'check_circle' : isConnecting ? 'sync' : 'cable'}</span>
                            {isConnected ? 'Session Ready' : isConnecting ? 'Negotiating' : 'Idle'}
                        </span>
                        <button onClick={handleReset} className="rs-button-secondary px-4 py-2 text-sm font-semibold">
                            Reset Session
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {summaryRows.map((item) => (
                        <div key={item.label} className="rs-panel rounded-[18px] p-4">
                            <p className="rs-data-label">{item.label}</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--rs-text-primary)]">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] gap-6">
                    <section className="rs-panel-raised rounded-[22px] p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="rs-section-label m-0">Transport Profile</p>
                                <h2 className="mt-2 text-lg font-bold text-[var(--rs-text-primary)]">Connection parameters</h2>
                            </div>
                            <div className="flex gap-2">
                                {PROTOCOLS.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setProtocol(item)}
                                        data-active={protocol === item}
                                        className="rs-toolbar-button px-3 text-xs font-bold"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="rs-data-label">Port</span>
                                <select value={port} onChange={(event) => setPort(event.target.value)} className="rs-input mt-2">
                                    {PORTS.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="rs-data-label">Baud Rate</span>
                                <select value={baud} onChange={(event) => setBaud(event.target.value)} className="rs-input mt-2">
                                    {BAUD_RATES.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="rs-data-label">Data Bits</span>
                                <input defaultValue="8" className="rs-input mt-2" />
                            </label>
                            <label className="block">
                                <span className="rs-data-label">Parity</span>
                                <select value={parity} onChange={(event) => setParity(event.target.value)} className="rs-input mt-2">
                                    {PARITY_OPTIONS.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_220px] gap-4">
                            <div className="rs-surface-muted rounded-[16px] p-4">
                                <p className="rs-section-label m-0">Session Policy</p>
                                <ul className="mt-3 space-y-2 text-sm text-[var(--rs-text-secondary)]">
                                    <li>Battery guidance remains visible until session is armed.</li>
                                    <li>Programming mode is only exposed after ECU identification completes.</li>
                                    <li>Recovery tools stay available if session negotiation fails.</li>
                                </ul>
                            </div>
                            <div className="rs-surface-muted rounded-[16px] p-4">
                                <p className="rs-data-label">Readiness</p>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                                    <div className="h-full rounded-full bg-[var(--rs-accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-[var(--rs-text-primary)]">{progress}% session progress</p>
                                <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">
                                    {isConnected
                                        ? 'Session ready for diagnostics, backup, and controlled flash tasks.'
                                        : isConnecting
                                          ? 'Negotiating ECU access and compatibility policy.'
                                          : 'Probe has not started.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button onClick={handleConnect} disabled={isConnecting} className="rs-button-primary flex items-center gap-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                                <span className={`material-symbols-outlined text-base ${isConnecting ? 'animate-spin' : ''}`}>{isConnecting ? 'progress_activity' : 'travel_explore'}</span>
                                {isConnecting ? 'Negotiating Session' : isConnected ? 'Re-probe ECU' : 'Scan For ECU'}
                            </button>
                            <button className="rs-button-secondary flex items-center gap-2 px-5 py-3 text-sm font-bold">
                                <span className="material-symbols-outlined text-base">monitoring</span>
                                Open Diagnostics
                            </button>
                        </div>
                    </section>

                    <section className="rs-panel rounded-[22px] p-5">
                        <p className="rs-section-label m-0">Detected Session</p>
                        <div className="mt-4 space-y-4">
                            <div className="rs-surface-muted rounded-[16px] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--rs-text-primary)]">ECU identity</p>
                                        <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">
                                            {isConnected ? '21175-1652 / KWP2000 / CVN-4E2A1109' : 'No ECU fingerprint loaded yet.'}
                                        </p>
                                    </div>
                                    <span className={`material-symbols-outlined text-2xl ${isConnected ? 'text-emerald-300' : 'text-[var(--rs-text-tertiary)]'}`}>{isConnected ? 'verified' : 'pending'}</span>
                                </div>
                            </div>
                            <div className="rs-surface-muted rounded-[16px] p-4">
                                <p className="rs-data-label">Available next actions</p>
                                <div className="mt-3 grid gap-2 text-sm text-[var(--rs-text-secondary)]">
                                    <div className="flex items-center justify-between">
                                        <span>Diagnostics stream</span>
                                        <span className={isConnected ? 'text-emerald-300' : 'text-[var(--rs-text-tertiary)]'}>{isConnected ? 'Available' : 'Blocked'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Backup snapshot</span>
                                        <span className={isConnected ? 'text-emerald-300' : 'text-[var(--rs-text-tertiary)]'}>{isConnected ? 'Available' : 'Blocked'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Programming mode</span>
                                        <span className={isConnected ? 'text-emerald-300' : 'text-[var(--rs-text-tertiary)]'}>{isConnected ? 'Armed' : 'Blocked'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <aside className="flex w-[360px] shrink-0 flex-col border-l border-[var(--rs-stroke-soft)] bg-[rgba(9,13,18,0.9)]">
                <div className="border-b border-[var(--rs-stroke-soft)] p-5">
                    <p className="rs-section-label m-0">Connection Sequence</p>
                    <div className="mt-4 space-y-4">
                        {timeline.map((step) => (
                            <div key={step.label} className="flex gap-3">
                                <div
                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                                        step.status === 'done'
                                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                                            : step.status === 'active'
                                              ? 'border-[var(--rs-accent)]/40 bg-[var(--rs-accent)]/10 text-[var(--rs-accent)]'
                                              : 'border-[var(--rs-stroke-soft)] bg-white/[0.02] text-[var(--rs-text-tertiary)]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-base">{step.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-semibold ${step.status === 'pending' ? 'text-[var(--rs-text-secondary)]' : 'text-[var(--rs-text-primary)]'}`}>{step.label}</p>
                                        {step.status === 'active' && <span className="rs-badge border-[var(--rs-accent)]/25 bg-[var(--rs-accent)]/10 text-[var(--rs-accent)]">Active</span>}
                                    </div>
                                    <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">{step.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="shrink-0 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rs-text-tertiary)]">Session Log</div>
                    <div className="flex-1 overflow-y-auto px-5 pb-5 font-mono text-[11px]">
                        {logs.map((line, index) => (
                            <div key={`${line}-${index}`} className="leading-relaxed text-sky-300/90">
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}
