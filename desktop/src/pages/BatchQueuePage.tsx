import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { FlashJob, BatchStats } from '../lib/types';

const SIDEBAR_NAV = [
    { icon: 'dashboard', label: 'Dashboard', active: false },
    { icon: 'map', label: 'Tuning Map', active: false },
    { icon: 'monitoring', label: 'Diagnostics', active: false },
    { icon: 'bolt', label: 'Batch Flash', active: true },
    { icon: 'history', label: 'Flash History', active: false },
    { icon: 'settings', label: 'Settings', active: false },
];

interface QueueItem {
    id: number;
    model: string;
    vin: string;
    package: string;
    status: 'Queued' | 'Flashing' | 'Verifying' | 'Complete' | 'Failed';
    progress: number;
}

const DEMO_QUEUE: QueueItem[] = [
    { id: 1, model: 'Kawasaki ZX-6R 2022', vin: 'JKAZX600RFA12345', package: 'Stage2_Race_v4.2.pkg', status: 'Complete', progress: 100 },
    { id: 2, model: 'Yamaha YZF-R1M 2024', vin: 'JYARN70E9X21', package: 'Street_Stage1_v2.1.pkg', status: 'Flashing', progress: 67 },
    { id: 3, model: 'Honda CBR1000RR 2023', vin: 'JH2SC828B44', package: 'Track_Pack_v3.0.pkg', status: 'Verifying', progress: 92 },
    { id: 4, model: 'Ducati Panigale V4 2024', vin: 'ZDMV400J8KB12', package: 'Race_ECU_v1.6.pkg', status: 'Queued', progress: 0 },
    { id: 5, model: 'Kawasaki ZX-10R 2023', vin: 'JKAZX1000NFA88', package: 'Track_Race_v5.0.pkg', status: 'Failed', progress: 44 },
    { id: 6, model: 'Suzuki GSX-R1000 2022', vin: 'JS1DM11G5K2100', package: 'Stage1_Street.pkg', status: 'Queued', progress: 0 },
];

function getStatusBadge(status: QueueItem['status']) {
    const map: Record<string, { bg: string; text: string; icon: string }> = {
        Complete: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-500', icon: 'check_circle' },
        Flashing: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: 'sync' },
        Verifying: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: 'fact_check' },
        Queued: { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-400', icon: 'schedule' },
        Failed: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-500', icon: 'error' },
    };
    const s = map[status];
    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
            <span className={`material-symbols-outlined text-sm ${status === 'Flashing' ? 'animate-spin' : ''}`}>{s.icon}</span>
            {status}
        </span>
    );
}

function getProgressColor(status: QueueItem['status']): string {
    if (status === 'Complete') return '#22c55e';
    if (status === 'Flashing') return '#135bec';
    if (status === 'Verifying') return '#f59e0b';
    if (status === 'Failed') return '#ef4444';
    return '#555';
}

export default function BatchQueuePage() {
    const [queue, setQueue] = useState<QueueItem[]>(DEMO_QUEUE);
    const accent = '#135bec';

    const stats: BatchStats = {
        total: queue.length,
        inProgress: queue.filter(q => q.status === 'Flashing' || q.status === 'Verifying').length,
        successful: queue.filter(q => q.status === 'Complete').length,
        failed: queue.filter(q => q.status === 'Failed').length,
    };

    // Try to enhance with real data
    useEffect(() => {
        api.get<FlashJob[]>('/v1/garage/flash-jobs/')
            .then(res => {
                const jobs = Array.isArray(res) ? res : [];
                if (jobs.length > 0) {
                    // Merge API data with defaults
                    const enhanced = jobs.map((j, i) => ({
                        id: j.id,
                        model: j.vehicle_detail ? `${j.vehicle_detail.make} ${j.vehicle_detail.model}` : `Vehicle #${j.vehicle}`,
                        vin: j.vehicle_detail?.vin || 'N/A',
                        package: j.tune_detail?.title || 'tune.revsyncpkg',
                        status: j.status === 'COMPLETED' ? 'Complete' as const : j.status === 'FLASHING' ? 'Flashing' as const : j.status === 'VERIFYING' ? 'Verifying' as const : j.status === 'FAILED' ? 'Failed' as const : 'Queued' as const,
                        progress: j.progress,
                    }));
                    setQueue([...enhanced, ...DEMO_QUEUE.slice(enhanced.length)]);
                }
            })
            .catch(() => { });
    }, []);

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Workshop Sidebar */}
            <aside className="w-56 bg-[#0a0a12] border-r border-border-dark flex flex-col shrink-0">
                <div className="p-5 border-b border-border-dark">
                    <h2 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: accent }}>precision_manufacturing</span>
                        Workshop
                    </h2>
                    <p className="text-text-muted text-xs mt-0.5">Enterprise Edition</p>
                </div>
                <nav className="flex-1 p-3 flex flex-col gap-1">
                    {SIDEBAR_NAV.map(item => (
                        <div key={item.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${item.active
                            ? 'text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
                            }`} style={item.active ? { background: `${accent}20`, borderLeft: `3px solid ${accent}` } : {}}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: item.active ? accent : '' }}>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </nav>
                <div className="p-4 border-t border-border-dark">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: accent }}>RS</div>
                        <div>
                            <div className="text-xs text-white font-medium">RevSync Shop</div>
                            <div className="text-[10px] text-text-muted">Pro License</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border-dark flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl" style={{ color: accent }}>queue</span>
                            Batch Flash Queue
                        </h1>
                        <p className="text-text-muted text-sm ml-10">Workshop-scale multi-ECU firmware deployment</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center bg-bg-dark rounded-lg border border-border-dark px-3 py-2 gap-2 w-64">
                            <span className="material-symbols-outlined text-text-muted text-sm">search</span>
                            <input className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-white placeholder-text-muted w-full" placeholder="Search queue..." />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold text-sm transition-all hover:brightness-110"
                            style={{ background: accent, boxShadow: `0 0 20px ${accent}40` }}>
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Job
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 px-6 py-4 shrink-0">
                    {[
                        { label: 'Total Queue', value: stats.total, icon: 'dns', color: accent },
                        { label: 'In Progress', value: stats.inProgress, icon: 'sync', color: '#f59e0b' },
                        { label: 'Successful', value: stats.successful, icon: 'check_circle', color: '#22c55e' },
                        { label: 'Failed', value: stats.failed, icon: 'error', color: '#ef4444' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                                <span className="material-symbols-outlined text-2xl" style={{ color: s.color }}>{s.icon}</span>
                            </div>
                            <div>
                                <p className="text-text-muted text-xs uppercase font-bold tracking-wider">{s.label}</p>
                                <p className="text-white text-2xl font-black">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Queue Table */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border-dark bg-bg-dark/50">
                                    <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">Bike Model</th>
                                    <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">VIN</th>
                                    <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">Package</th>
                                    <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">Status</th>
                                    <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3 w-40">Progress</th>
                                    <th className="text-center text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3 w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.map((item, i) => (
                                    <tr key={item.id} className="border-b border-border-dark last:border-b-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-text-muted">two_wheeler</span>
                                                <span className="text-sm text-white font-medium">{item.model}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-mono text-text-muted">{item.vin}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-slate-300">{item.package}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-bg-dark rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.progress}%`, background: getProgressColor(item.status) }} />
                                                </div>
                                                <span className="text-xs font-mono text-text-muted w-8 text-right">{item.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {item.status === 'Failed' && (
                                                    <button className="p-1 rounded text-amber-400 hover:bg-amber-400/10 transition-colors" title="Retry">
                                                        <span className="material-symbols-outlined text-sm">replay</span>
                                                    </button>
                                                )}
                                                <button className="p-1 rounded text-text-muted hover:text-white hover:bg-white/10 transition-colors" title="Details">
                                                    <span className="material-symbols-outlined text-sm">info</span>
                                                </button>
                                                <button className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Remove">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
