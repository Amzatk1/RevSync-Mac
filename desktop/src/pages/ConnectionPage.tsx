import { useState } from 'react';

type Tab = 'usb' | 'jtag' | 'sim';
type Step = { label: string; status: 'done' | 'active' | 'pending'; detail: string };

const STEPS: Step[] = [
    { label: 'Port Discovery', status: 'done', detail: 'USB 2.0 FS — VID:PID 0403:6001 (FTDI)' },
    { label: 'Firmware Sync', status: 'done', detail: 'Adapter FW v2.3 • CAN/K-Line capable' },
    { label: 'Baud Negotiation', status: 'done', detail: '57600 bps established (auto-detected)' },
    { label: 'Protocol Init', status: 'done', detail: 'ISO 14230 (K-Line) initialized' },
    { label: 'Seed/Key Auth', status: 'active', detail: 'Awaiting ECU response...' },
    { label: 'Ready', status: 'pending', detail: '' },
];

export default function ConnectionPage() {
    const [tab, setTab] = useState<Tab>('usb');
    const [port, setPort] = useState('auto');
    const [baud, setBaud] = useState('57600');
    const [protocol, setProtocol] = useState('can');
    const [steps, setSteps] = useState(STEPS);
    const [scanning, setScanning] = useState(false);

    const handleScan = () => {
        setScanning(true);
        const newSteps = steps.map(s => ({ ...s, status: 'pending' as const }));
        setSteps(newSteps);
        let i = 0;
        const iv = setInterval(() => {
            setSteps(prev => prev.map((s, j) => ({
                ...s,
                status: j < i ? 'done' as const : j === i ? 'active' as const : 'pending' as const,
            })));
            i++;
            if (i > newSteps.length) {
                clearInterval(iv);
                setScanning(false);
            }
        }, 800);
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 lg:p-12">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Config */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Connection Manager</h1>
                            <p className="text-text-muted">Configure ECU interface parameters and initiate handshake.</p>
                        </div>

                        <div className="bg-panel-dark border border-border-dark rounded-xl overflow-hidden shadow-2xl shadow-black/40">
                            {/* Tabs */}
                            <div className="flex border-b border-border-dark">
                                {([['usb', 'USB / Serial'], ['jtag', 'JTAG'], ['sim', 'Simulator']] as [Tab, string][]).map(([key, label]) => (
                                    <button key={key} onClick={() => setTab(key)}
                                        className={`flex-1 py-3 text-sm font-bold transition-all ${tab === key ? 'text-white border-b-2 border-primary bg-white/5' : 'text-text-muted hover:text-white border-b-2 border-transparent'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 flex flex-col gap-5">
                                {tab === 'usb' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2 block">Port Interface</label>
                                                <select value={port} onChange={e => setPort(e.target.value)}
                                                    className="w-full h-12 px-4 bg-bg-dark border border-border-dark rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                                                    <option value="auto">Auto-Detect (COM3)</option><option value="com1">COM1</option><option value="com2">COM2</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2 block">Baud Rate</label>
                                                <select value={baud} onChange={e => setBaud(e.target.value)}
                                                    className="w-full h-12 px-4 bg-bg-dark border border-border-dark rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                                                    <option value="57600">57600 bps</option><option value="115200">115200 bps</option><option value="9600">9600 bps</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2 block">Protocol</label>
                                            <select value={protocol} onChange={e => setProtocol(e.target.value)}
                                                className="w-full h-12 px-4 bg-bg-dark border border-border-dark rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                                                <option value="can">CAN-Bus (ISO 15765-4)</option><option value="kline">K-Line (ISO 14230)</option><option value="kwp">KWP2000</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {tab === 'jtag' && (
                                    <div className="p-8 text-center">
                                        <span className="material-symbols-outlined text-text-muted mb-3" style={{ fontSize: 48 }}>developer_board</span>
                                        <h3 className="text-white font-bold mb-2">JTAG Debug Interface</h3>
                                        <p className="text-text-muted text-sm mb-4">Attach a JTAG adapter (J-Link, ST-Link) for low-level ECU programming and memory access.</p>
                                        <div className="bg-bg-dark border border-border-dark rounded-lg p-4 text-left">
                                            {[['Interface', 'J-Link via SWD'], ['Clock Speed', '4 MHz'], ['Target', 'Renesas SH7058']].map(([k, v]) => (
                                                <div key={k} className="flex justify-between text-sm py-1"><span className="text-text-muted">{k}</span><span className="text-white font-mono">{v}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {tab === 'sim' && (
                                    <div className="p-8 text-center">
                                        <span className="material-symbols-outlined text-text-muted mb-3" style={{ fontSize: 48 }}>smart_toy</span>
                                        <h3 className="text-white font-bold mb-2">ECU Simulator</h3>
                                        <p className="text-text-muted text-sm mb-4">Test your workflow without a physical ECU connected. Simulates full protocol responses.</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Kawasaki ZX-6R', 'Yamaha R1M', 'Ducati V4', 'Honda CBR1000RR'].map(m => (
                                                <button key={m} className="p-3 bg-bg-dark border border-border-dark rounded-lg text-sm text-white hover:border-primary hover:bg-primary/5 transition-colors">{m}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button onClick={handleScan} disabled={scanning}
                                    className="mt-2 w-full h-14 bg-primary hover:bg-red-600 text-white font-bold text-lg rounded-lg shadow-[0_0_20px_rgba(234,16,60,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    <span className={`material-symbols-outlined ${scanning ? 'animate-spin' : ''}`}>{scanning ? 'progress_activity' : 'search'}</span>
                                    {scanning ? 'Scanning...' : 'Scan for ECU'}
                                </button>
                            </div>
                        </div>

                        {/* Success Card */}
                        {steps.every(s => s.status === 'done') && (
                            <div className="bg-gradient-to-r from-green-500/10 to-panel-dark border border-green-500/30 rounded-xl p-5 flex items-start gap-4 animate-fade-up">
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0 border border-green-500/40">
                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">ECU Connected Successfully</h3>
                                    <p className="text-text-muted text-sm mb-3">Kawasaki ZX-6R (2022) · ECU ID: 21166-1652 · K-Line ISO 14230</p>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20">
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>memory</span>Read ECU
                                        </button>
                                        <button className="px-4 py-2 bg-bg-dark border border-border-dark hover:border-primary/30 text-white rounded-lg text-sm font-medium">ECU Info</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Connection Log */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-muted">receipt_long</span>Handshake Log
                        </h3>
                        <div className="bg-panel-dark border border-border-dark rounded-xl p-5 flex-1">
                            <div className="flex flex-col gap-0 relative">
                                <div className="absolute left-3 top-4 bottom-4 w-px bg-border-dark" />
                                {steps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-4 relative py-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${step.status === 'done' ? 'bg-green-500/20 text-green-500 border border-green-500/50' :
                                                step.status === 'active' ? 'bg-primary/20 text-primary border border-primary/50 animate-pulse' :
                                                    'bg-bg-dark text-text-muted border border-border-dark'
                                            }`}>
                                            {step.status === 'done' ? <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                                                : step.status === 'active' ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 14 }}>progress_activity</span>
                                                    : <span className="text-xs">{i + 1}</span>}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-medium ${step.status === 'done' ? 'text-white' : step.status === 'active' ? 'text-primary' : 'text-text-muted'}`}>{step.label}</h4>
                                            {step.detail && <p className={`text-xs mt-0.5 font-mono ${step.status === 'active' ? 'text-primary/70' : 'text-text-muted'}`}>{step.detail}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
