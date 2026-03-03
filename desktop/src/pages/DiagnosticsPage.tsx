import { useState, useEffect } from 'react';

function GaugeRing({ value, max, label, unit, color, peak, peakLabel }: {
    value: number; max: number; label: string; unit: string; color: string; peak: string; peakLabel: string;
}) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="bg-panel-dark border border-border-dark rounded-xl p-5 flex flex-col items-center relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-b ${color.replace('text-', 'from-')}/10 to-transparent opacity-50`} />
            <div className="flex justify-between w-full z-10">
                <span className="text-sm font-medium text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <div className="relative w-36 h-36 my-3 z-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-border-dark" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className={color} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeDasharray={`${pct}, 100`} strokeLinecap="round" strokeWidth="3"
                        style={{ filter: `drop-shadow(0 0 8px currentColor)`, transition: 'stroke-dasharray 0.5s ease' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-white tracking-tighter">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                    <span className="text-[11px] text-text-muted">{unit}</span>
                </div>
            </div>
            <div className="w-full flex justify-between items-end z-10 border-t border-border-dark pt-2 mt-1">
                <span className="text-[11px] text-text-muted">{peak}</span>
                <span className={`text-[11px] font-bold ${color}`}>{peakLabel}</span>
            </div>
        </div>
    );
}

function SparkTile({ label, value, icon, color, path }: { label: string; value: string; icon: string; color: string; path: string }) {
    return (
        <div className="bg-panel-dark border border-border-dark rounded-lg p-3 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-[11px] text-text-muted font-medium">{label}</span>
                    <span className="text-lg font-bold text-white">{value}</span>
                </div>
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 16 }}>{icon}</span>
            </div>
            <div className="h-7 w-full bg-border-dark/30 rounded overflow-hidden">
                <svg className={`w-full h-full ${color}`} viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>
        </div>
    );
}

export default function DiagnosticsPage() {
    const [rpm, setRpm] = useState(14500);
    const [afr, setAfr] = useState(12.8);
    const [boost, setBoost] = useState(18.5);
    const [egt, setEgt] = useState(1350);

    useEffect(() => {
        const iv = setInterval(() => {
            setRpm(p => Math.max(8000, Math.min(16000, p + (Math.random() - 0.48) * 400)));
            setAfr(p => Math.max(11, Math.min(15, +(p + (Math.random() - 0.5) * 0.3).toFixed(1))));
            setBoost(p => Math.max(10, Math.min(22, +(p + (Math.random() - 0.45) * 0.5).toFixed(1))));
            setEgt(p => Math.max(1100, Math.min(1550, Math.round(p + (Math.random() - 0.5) * 30))));
        }, 800);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-5">
                {/* Gauges */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <GaugeRing value={Math.round(rpm)} max={16500} label="Engine Speed" unit="RPM" color="text-primary" peak={`Pk: ${Math.round(rpm * 1.05)}`} peakLabel="+2%" />
                    <GaugeRing value={afr} max={18} label="Air/Fuel" unit="AFR" color="text-accent-green" peak="Target: 13.0" peakLabel="Stable" />
                    <GaugeRing value={boost} max={25} label="Boost Pressure" unit="PSI" color="text-accent-blue" peak="Pk: 21.0 PSI" peakLabel="+0.5%" />
                    <GaugeRing value={egt} max={1800} label="Exhaust Gas" unit="°F" color="text-accent-orange" peak="Limit: 1550°F" peakLabel="Normal" />
                </section>

                {/* Sparklines */}
                <section className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                    <SparkTile label="Coolant" value="185°F" icon="water_drop" color="text-accent-green" path="M0 15 Q 10 12 20 14 T 40 10 T 60 12 T 80 8 T 100 10" />
                    <SparkTile label="Oil Temp" value="210°F" icon="oil_barrel" color="text-accent-orange" path="M0 18 Q 20 16 40 15 T 70 14 T 100 12" />
                    <SparkTile label="Battery" value="14.2V" icon="bolt" color="text-accent-green" path="M0 10 L 20 10 L 25 5 L 30 15 L 35 10 L 100 10" />
                    <SparkTile label="TPS" value="100%" icon="speed" color="text-primary" path="M0 18 L 20 18 L 40 2 L 60 2 L 80 18 L 100 18" />
                    <SparkTile label="Intake Air" value="95°F" icon="air" color="text-accent-blue" path="M0 10 Q 25 12 50 10 T 100 10" />
                    <SparkTile label="Gear" value="4" icon="settings" color="text-white" path="M0 15 L 15 15 L 16 12 L 30 12 L 31 9 L 45 9 L 46 6 L 65 6 L 66 9 L 80 9 L 81 12 L 100 12" />
                </section>

                {/* Telemetry Chart */}
                <section className="flex-1 min-h-[280px] bg-panel-dark border border-border-dark rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white text-sm font-bold uppercase tracking-wide">Live Telemetry (60s Window)</h3>
                        <div className="flex gap-3">
                            <span className="flex items-center gap-1 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-primary" />RPM</span>
                            <span className="flex items-center gap-1 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-accent-blue" />Boost</span>
                            <span className="flex items-center gap-1 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-accent-green" />TPS</span>
                        </div>
                    </div>
                    <div className="relative w-full flex-1 overflow-hidden rounded bg-[#1f1618] border border-border-dark/50">
                        {/* Grid */}
                        <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 opacity-10 pointer-events-none">
                            {Array.from({ length: 48 }).map((_, i) => <div key={i} className="border-r border-b border-white/20" />)}
                        </div>
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 200">
                            <path d="M0,160 Q40,140 100,40 T200,40 T300,160 T400,40 T600,20 T800,40 T1000,100 L1200,160" fill="none" stroke="#ea103c" strokeWidth="2" strokeOpacity="0.8" />
                            <path d="M0,180 Q100,170 200,160 T400,120 T600,120 T800,140 T1000,120 T1200,130" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.8" />
                            <path d="M0,190 L200,190 L210,20 L600,20 L610,190 L900,190 L910,20 L1200,20" fill="none" stroke="#0bda92" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="4 4" />
                        </svg>
                        <div className="absolute right-[10%] top-0 bottom-0 w-0.5 bg-white/40 border-r border-dashed border-white/30" />
                    </div>
                </section>
            </div>

            {/* Sidebar */}
            <aside className="w-64 bg-panel-dark border-l border-border-dark flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 flex flex-col gap-5">
                    <div>
                        <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-3">Logger</h3>
                        <div className="p-3 rounded-lg bg-bg-dark border border-border-dark flex flex-col gap-1.5 mb-3">
                            <div className="flex justify-between text-xs"><span className="text-text-muted">Session ID</span><span className="text-white font-mono">#0921-A</span></div>
                            <div className="flex justify-between text-xs"><span className="text-text-muted">Duration</span><span className="text-accent-green font-mono">04:21.05</span></div>
                        </div>
                        <button className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-[0_0_15px_rgba(234,16,60,0.3)] flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">fiber_manual_record</span>STOP LOGGING
                        </button>
                        <button className="w-full h-9 mt-2 rounded-lg bg-bg-dark hover:bg-border-dark border border-border-dark text-white text-sm font-medium flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flag</span>Add Marker
                        </button>
                    </div>

                    <div className="h-px bg-border-dark" />

                    <div>
                        <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-3">Configuration</h3>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[11px] text-text-muted mb-1 block">Sample Rate</label>
                                <select className="w-full bg-bg-dark border border-border-dark rounded text-white text-sm p-2 focus:ring-1 focus:ring-primary focus:border-primary">
                                    <option>10 Hz</option><option>50 Hz</option><option>100 Hz (High Res)</option><option>500 Hz</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] text-text-muted mb-1 block">PID Group</label>
                                <select className="w-full bg-bg-dark border border-border-dark rounded text-white text-sm p-2 focus:ring-1 focus:ring-primary focus:border-primary">
                                    <option>Basic Engine</option><option>Full Race Telemetry</option><option>Suspension Data</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border-dark" />

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white text-sm font-bold uppercase tracking-wide">Monitored PIDs</h3>
                            <span className="text-xs text-primary font-bold">12 Active</span>
                        </div>
                        {[['Spark Adv.', '32°'], ['Injector DC', '82%'], ['Knock Volts', '0.4v'], ['Wheel Speed R', '142mph']].map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between text-xs p-2 rounded bg-bg-dark border border-border-dark mb-1.5">
                                <span className="text-text-muted">{k}</span><span className="text-white font-mono">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-4 bg-bg-dark border-t border-border-dark">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: 18 }}>save</span>
                        <div className="overflow-hidden">
                            <span className="text-[11px] font-bold text-white uppercase">Logging to:</span>
                            <span className="text-[11px] text-text-muted truncate font-mono block">zx6r_session_001.csv</span>
                            <span className="text-[10px] text-text-muted">14.2 MB written</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
