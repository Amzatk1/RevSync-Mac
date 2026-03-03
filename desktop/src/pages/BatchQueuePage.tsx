import { useState, useEffect } from 'react';
import api from '../lib/api';

interface QueueItem {
    id: string; vin: string; model: string; icon: string;
    status: 'flashing' | 'verified' | 'queued' | 'failed';
    progress: number; tune: string;
}

const DEFAULT_QUEUE: QueueItem[] = [
    { id: '1', vin: '...A4F2', model: 'Kawasaki ZX-6R', icon: 'two_wheeler', status: 'verified', progress: 100, tune: 'Stage 2 Race (v4.2)' },
    { id: '2', vin: '...B318', model: 'Yamaha YZF-R1M', icon: 'two_wheeler', status: 'flashing', progress: 68, tune: 'Track Day Special' },
    { id: '3', vin: '...C920', model: 'Ducati Panigale V4', icon: 'two_wheeler', status: 'queued', progress: 0, tune: 'MotoGP Replica' },
    { id: '4', vin: '...D711', model: 'BMW S1000RR', icon: 'two_wheeler', status: 'queued', progress: 0, tune: 'Autobahn Sport' },
    { id: '5', vin: '...5A11', model: 'Honda CBR1000RR-R', icon: 'two_wheeler', status: 'failed', progress: 35, tune: 'Custom (1f2a)' },
];

const STAT_CARDS = [
    { label: 'Total Jobs', icon: 'pending_actions', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'In Progress', icon: 'sync', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Success', icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Failed', icon: 'error', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
];

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
    flashing: { label: 'Flashing', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    verified: { label: 'Verified', cls: 'bg-green-500/10 border-green-500/20 text-green-400' },
    queued: { label: 'Queued', cls: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    failed: { label: 'Failed', cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
};

export default function BatchQueuePage() {
    const [queue, setQueue] = useState(DEFAULT_QUEUE);

    // Simulate flashing progress
    useEffect(() => {
        const iv = setInterval(() => {
            setQueue(prev => prev.map(item => {
                if (item.status !== 'flashing') return item;
                const next = item.progress + Math.random() * 5;
                if (next >= 100) return { ...item, status: 'verified' as const, progress: 100 };
                return { ...item, progress: next };
            }));
        }, 1200);
        return () => clearInterval(iv);
    }, []);

    // Try to load real garage data
    useEffect(() => {
        api.get<{ results: any[] }>('/v1/garage/').then(res => {
            if (res.results?.length) {
                const extra = res.results.slice(0, 3).map((v: any, i: number) => ({
                    id: `api-${v.id}`, vin: `...${String(v.vin || 'XXXX').slice(-4)}`,
                    model: `${v.make} ${v.model}`, icon: 'two_wheeler',
                    status: 'queued' as const, progress: 0, tune: `API Tune ${i + 1}`,
                }));
                setQueue(prev => [...prev, ...extra]);
            }
        }).catch(() => { });
    }, []);

    const stats = [
        queue.length,
        queue.filter(q => q.status === 'flashing').length,
        queue.filter(q => q.status === 'verified').length,
        queue.filter(q => q.status === 'failed').length,
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-3xl">queue</span>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Workshop Batch Queue</h1>
                            <p className="text-text-muted text-sm">Multi-ECU Flash Management System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-bg-dark border border-border-dark hover:border-primary/30 text-white rounded-lg text-sm flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>Filter
                        </button>
                        <button className="px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>Add Job
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    {STAT_CARDS.map((card, i) => (
                        <div key={card.label} className={`border rounded-xl p-5 flex items-center gap-4 ${card.bg}`}>
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${card.bg} ${card.color}`}>
                                <span className="material-symbols-outlined text-xl">{card.icon}</span>
                            </div>
                            <div>
                                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{card.label}</p>
                                <p className="text-3xl font-black text-white">{stats[i]}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Queue Table */}
                <div className="bg-panel-dark border border-border-dark rounded-xl overflow-hidden shadow-xl shadow-black/30 flex-1 min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-bg-dark/80 border-b border-border-dark text-[11px] uppercase tracking-wider text-text-muted">
                            <tr>
                                <th className="px-6 py-4">#</th>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4">VIN</th>
                                <th className="px-6 py-4">Tune Package</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map((item, i) => {
                                const badge = STATUS_BADGES[item.status];
                                return (
                                    <tr key={item.id} className="border-b border-border-dark hover:bg-white/[.02] transition-colors">
                                        <td className="px-6 py-4 text-text-muted font-mono">{String(i + 1).padStart(2, '0')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-bg-dark border border-border-dark flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>{item.icon}</span>
                                                </div>
                                                <span className="text-white font-medium">{item.model}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-text-muted font-mono text-xs">{item.vin}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-text-muted bg-bg-dark/30 px-2 py-1 rounded border border-border-dark w-fit">
                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tag</span>
                                                <span className="font-mono text-xs">{item.tune}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${badge.cls}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                                    {item.status === 'flashing' ? 'sync' : item.status === 'verified' ? 'check_circle' : item.status === 'failed' ? 'error' : 'schedule'}
                                                </span>
                                                {badge.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 w-full max-w-xs">
                                                <div className="flex justify-between text-xs">
                                                    <span className={item.status === 'failed' ? 'text-red-500 font-medium' : item.status === 'flashing' ? 'text-amber-400' : item.status === 'verified' ? 'text-green-500' : 'text-text-muted'}>
                                                        {item.status === 'failed' ? 'Write Error' : item.status === 'flashing' ? 'Writing...' : item.status === 'verified' ? 'Complete' : 'Waiting'}
                                                    </span>
                                                    <span className="font-mono text-text-muted">{Math.round(item.progress)}%</span>
                                                </div>
                                                <div className="w-full bg-bg-dark h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-300 ${item.status === 'failed' ? 'bg-red-500' : item.status === 'verified' ? 'bg-green-500' : item.status === 'flashing' ? 'bg-amber-400' : 'bg-border-dark'
                                                        }`} style={{ width: `${item.progress}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 ml-auto text-xs font-medium border border-border-dark rounded px-2.5 py-1.5 hover:border-primary/50">
                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>description</span>Log
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Worker Status */}
                <div className="bg-panel-dark border border-border-dark rounded-xl p-5">
                    <h3 className="text-white font-bold mb-4">Worker Status</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {['Worker 1', 'Worker 2', 'Worker 3', 'Worker 4'].map((w, i) => {
                            const isActive = i === 2;
                            return (
                                <div key={w} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">memory</span>
                                    </div>
                                    <div>
                                        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{w}</p>
                                        <p className="text-white font-bold">{isActive ? 'Flashing' : 'Idle'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Status */}
            <div className="px-6 py-3 bg-panel-dark border-t border-border-dark text-[11px] text-text-muted flex items-center justify-between shrink-0">
                <span>RevSync Pro Workshop v1.5.2</span>
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Connected to RevSync Hub
                </span>
            </div>
        </div>
    );
}
