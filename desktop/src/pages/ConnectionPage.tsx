import { useState } from 'react';

const PROTOCOLS = ['USB Serial (K-Line)', 'USB (J2534)', 'JTAG/SWD', 'Simulator'];
const BAUD_RATES = ['9600', '14400', '19200', '38400', '57600', '115200'];
const PORTS = ['/dev/ttyUSB0', '/dev/ttyACM0', 'COM3', 'COM4', 'Simulated ECU'];

const TIMELINE_STEPS = [
    { label: 'Adapter Detected', detail: 'K-Line Adapter v2.1 on /dev/ttyUSB0', status: 'done', icon: 'usb' },
    { label: 'Physical Connection', detail: 'OBD-II Port — Pin 7 (K-Line)', status: 'done', icon: 'cable' },
    { label: 'Protocol Negotiation', detail: 'ISO 14230 (KWP2000) Fast Init', status: 'done', icon: 'sync' },
    { label: 'ECU Identification', detail: 'Requesting ECU ID...', status: 'active', icon: 'memory' },
    { label: 'Security Handshake', detail: 'Seed/Key Algorithm 2', status: 'pending', icon: 'lock' },
    { label: 'Session Ready', detail: 'Programming Session (0x02)', status: 'pending', icon: 'check_circle' },
];

export default function ConnectionPage() {
    const [protocol, setProtocol] = useState(PROTOCOLS[0]);
    const [port, setPort] = useState(PORTS[0]);
    const [baud, setBaud] = useState('57600');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = () => {
        setIsConnecting(true);
        setTimeout(() => { setIsConnecting(false); setIsConnected(true); }, 2500);
    };

    const accent = '#19e66f';

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-dark shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-4xl" style={{ color: accent }}>usb</span>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Connection Manager</h1>
                        <p className="text-text-muted text-sm">Hardware Interface & ECU Communication Setup</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Configuration */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Protocol Tabs */}
                    <div className="flex gap-2 mb-6">
                        {PROTOCOLS.map(p => (
                            <button key={p} onClick={() => setProtocol(p)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${protocol === p
                                        ? 'text-white border-transparent shadow-lg' : 'text-text-muted border-border-dark hover:text-white hover:border-white/20'
                                    }`}
                                style={protocol === p ? { background: accent, boxShadow: `0 0 20px ${accent}40` } : {}}>
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Config Form */}
                    <div className="bg-surface-dark border border-border-dark rounded-xl p-6 max-w-xl space-y-5">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">Port</label>
                            <select value={port} onChange={e => setPort(e.target.value)}
                                className="w-full bg-bg-dark border border-border-dark rounded-lg px-4 py-3 text-white text-sm focus:outline-none" style={{ borderColor: port ? `${accent}40` : '' }}>
                                {PORTS.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">Baud Rate</label>
                            <select value={baud} onChange={e => setBaud(e.target.value)}
                                className="w-full bg-bg-dark border border-border-dark rounded-lg px-4 py-3 text-white text-sm focus:outline-none">
                                {BAUD_RATES.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">Data Bits</label>
                                <input defaultValue="8" className="w-full bg-bg-dark border border-border-dark rounded-lg px-4 py-3 text-white text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">Parity</label>
                                <select className="w-full bg-bg-dark border border-border-dark rounded-lg px-4 py-3 text-white text-sm focus:outline-none">
                                    <option>None</option><option>Even</option><option>Odd</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleConnect}
                                className="flex-1 py-3 rounded-lg text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                                style={{ background: isConnecting ? '#444' : accent, boxShadow: isConnecting ? '' : `0 0 20px ${accent}40` }}
                                disabled={isConnecting}>
                                {isConnecting ? (
                                    <><span className="material-symbols-outlined animate-spin text-base">sync</span> Connecting...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-base">search</span> Scan for ECU</>
                                )}
                            </button>
                            <button className="px-4 py-3 rounded-lg text-text-muted border border-border-dark hover:text-white text-sm font-medium transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Success Card */}
                    {isConnected && (
                        <div className="mt-6 max-w-xl rounded-xl p-5 border animate-fade-up relative overflow-hidden"
                            style={{ background: `${accent}10`, borderColor: `${accent}40` }}>
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <span className="material-symbols-outlined text-8xl" style={{ color: accent }}>check_circle</span>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-3xl" style={{ color: accent }}>check_circle</span>
                                <div>
                                    <h3 className="text-white font-bold text-lg">ECU Connected Successfully</h3>
                                    <p className="text-text-muted text-sm">Full diagnostic session established</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-text-muted text-xs">ECU ID</span>
                                    <div className="text-white font-mono">21175-1652</div>
                                </div>
                                <div>
                                    <span className="text-text-muted text-xs">Protocol</span>
                                    <div className="text-white">ISO 14230 (KWP2000)</div>
                                </div>
                                <div>
                                    <span className="text-text-muted text-xs">Firmware</span>
                                    <div className="text-white font-mono">v3.12.4</div>
                                </div>
                                <div>
                                    <span className="text-text-muted text-xs">Calibration</span>
                                    <div className="text-white font-mono">CVN-4E2A1109</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Timeline */}
                <aside className="w-96 bg-panel-dark border-l border-border-dark p-6 overflow-y-auto shrink-0">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base" style={{ color: accent }}>timeline</span>
                        Connection Log
                    </h3>
                    <div className="relative pl-6">
                        {/* Vertical line */}
                        <div className="absolute left-3 top-2 bottom-2 w-0.5" style={{ background: `${accent}30` }} />

                        {TIMELINE_STEPS.map((step, i) => (
                            <div key={i} className="relative flex gap-4 mb-6 last:mb-0">
                                {/* Dot */}
                                <div className={`absolute -left-3.5 w-4 h-4 rounded-full border-2 shrink-0 ${step.status === 'done'
                                        ? 'border-transparent' : step.status === 'active'
                                            ? 'border-transparent animate-pulse-border' : 'bg-bg-dark border-border-dark'
                                    }`} style={step.status === 'done' ? { background: accent } : step.status === 'active' ? { background: accent } : {}}>
                                    {step.status === 'done' && (
                                        <span className="material-symbols-outlined text-white text-[10px] flex items-center justify-center h-full">check</span>
                                    )}
                                </div>
                                <div className="pt-0.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-base ${step.status === 'pending' ? 'text-text-muted' : ''}`}
                                            style={step.status !== 'pending' ? { color: accent } : {}}>{step.icon}</span>
                                        <h4 className={`text-sm font-bold ${step.status === 'pending' ? 'text-text-muted' : 'text-white'}`}>{step.label}</h4>
                                        {step.status === 'active' && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse px-2 py-0.5 rounded" style={{ color: accent, background: `${accent}20` }}>In Progress</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted mt-0.5 font-mono">{step.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-8 p-3 bg-bg-dark border border-border-dark rounded-lg">
                        <div className="flex justify-between mb-1">
                            <span className="text-xs text-text-muted">Overall Progress</span>
                            <span className="text-xs font-bold" style={{ color: accent }}>67%</span>
                        </div>
                        <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: '67%', background: accent }} />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
