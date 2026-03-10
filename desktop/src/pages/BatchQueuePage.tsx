import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import type { BatchStats, FlashJob } from '../lib/types';

interface QueueItem {
    id: number;
    model: string;
    vin: string;
    package: string;
    status: 'Queued' | 'Flashing' | 'Verifying' | 'Complete' | 'Failed';
    progress: number;
    operator: string;
    station: string;
    note: string;
}

function mapJobStatus(status: FlashJob['status']): QueueItem['status'] {
    if (status === 'COMPLETED') return 'Complete';
    if (status === 'FLASHING') return 'Flashing';
    if (status === 'VERIFYING') return 'Verifying';
    if (status === 'FAILED') return 'Failed';
    return 'Queued';
}

const DEMO_QUEUE: QueueItem[] = [
    { id: 1, model: 'Kawasaki ZX-6R 2022', vin: 'JKAZX600RFA12345', package: 'Stage2_Race_v4.2.pkg', status: 'Complete', progress: 100, operator: 'Ayo K.', station: 'Bench A', note: 'Verified and archived.' },
    { id: 2, model: 'Yamaha YZF-R1M 2024', vin: 'JYARN70E9X21', package: 'Street_Stage1_v2.1.pkg', status: 'Flashing', progress: 67, operator: 'M. Idris', station: 'Bench B', note: 'Write phase active.' },
    { id: 3, model: 'Honda CBR1000RR 2023', vin: 'JH2SC828B44', package: 'Track_Pack_v3.0.pkg', status: 'Verifying', progress: 92, operator: 'S. Cole', station: 'Bench A', note: 'Checksum verification pending.' },
    { id: 4, model: 'Ducati Panigale V4 2024', vin: 'ZDMV400J8KB12', package: 'Race_ECU_v1.6.pkg', status: 'Queued', progress: 0, operator: 'Ayo K.', station: 'Bench C', note: 'Waiting for operator start.' },
    { id: 5, model: 'Kawasaki ZX-10R 2023', vin: 'JKAZX1000NFA88', package: 'Track_Race_v5.0.pkg', status: 'Failed', progress: 44, operator: 'M. Idris', station: 'Bench D', note: 'Voltage dropped below 12.1V during erase.' },
    { id: 6, model: 'Suzuki GSX-R1000 2022', vin: 'JS1DM11G5K2100', package: 'Stage1_Street.pkg', status: 'Queued', progress: 0, operator: 'S. Cole', station: 'Bench B', note: 'Waiting for vehicle arrival.' },
];

function getStatusTone(status: QueueItem['status']) {
    if (status === 'Complete') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
    if (status === 'Flashing') return 'border-sky-400/30 bg-sky-400/10 text-sky-300';
    if (status === 'Verifying') return 'border-[var(--rs-warning)]/30 bg-[var(--rs-warning)]/10 text-[var(--rs-warning)]';
    if (status === 'Failed') return 'border-[var(--rs-danger)]/30 bg-[var(--rs-danger)]/10 text-[var(--rs-danger)]';
    return 'border-[var(--rs-stroke-soft)] bg-white/[0.04] text-[var(--rs-text-secondary)]';
}

function getProgressColor(status: QueueItem['status']) {
    if (status === 'Complete') return 'var(--rs-success)';
    if (status === 'Flashing') return 'var(--rs-accent)';
    if (status === 'Verifying') return 'var(--rs-warning)';
    if (status === 'Failed') return 'var(--rs-danger)';
    return 'rgba(255,255,255,0.16)';
}

export default function BatchQueuePage() {
    const [queue, setQueue] = useState<QueueItem[]>(DEMO_QUEUE);
    const [selectedJobId, setSelectedJobId] = useState<number>(DEMO_QUEUE[1].id);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get<FlashJob[]>('/v1/garage/flash-jobs/')
            .then((res) => {
                const jobs = Array.isArray(res) ? res : [];
                if (!jobs.length) return;
                const enhanced: QueueItem[] = jobs.map((job, index) => ({
                    id: job.id,
                    model: job.vehicle_detail ? `${job.vehicle_detail.make} ${job.vehicle_detail.model}` : `Vehicle #${job.vehicle}`,
                    vin: job.vehicle_detail?.vin || 'N/A',
                    package: job.tune_detail?.title || 'tune.revsyncpkg',
                    status: mapJobStatus(job.status),
                    progress: job.progress,
                    operator: ['Ayo K.', 'M. Idris', 'S. Cole'][index % 3],
                    station: `Bench ${String.fromCharCode(65 + (index % 4))}`,
                    note: job.status === 'FAILED' ? 'Review log and retry when transport is stable.' : 'Synced from flash job history.',
                }));
                setQueue((current) => [...enhanced, ...current.slice(enhanced.length)]);
                setSelectedJobId((current) => current || enhanced[0]?.id || current);
            })
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setQueue((current) =>
                current.map((item) => {
                    if (item.status === 'Flashing') {
                        const nextProgress = Math.min(item.progress + 5, 100);
                        if (nextProgress >= 100) {
                            return { ...item, progress: 100, status: 'Verifying', note: 'Write phase complete. Running post-write verification.' };
                        }
                        return { ...item, progress: nextProgress };
                    }
                    if (item.status === 'Verifying') {
                        const nextProgress = Math.min(item.progress + 4, 100);
                        if (nextProgress >= 100) {
                            return { ...item, progress: 100, status: 'Complete', note: 'Checksum, signature, and restart validation passed.' };
                        }
                        return { ...item, progress: nextProgress };
                    }
                    return item;
                })
            );
        }, 2200);

        return () => window.clearInterval(timer);
    }, []);

    const filteredQueue = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return queue;
        return queue.filter((item) => [item.model, item.vin, item.package, item.station, item.operator].join(' ').toLowerCase().includes(query));
    }, [queue, search]);

    const selectedJob = filteredQueue.find((item) => item.id === selectedJobId) || queue.find((item) => item.id === selectedJobId) || filteredQueue[0] || queue[0];

    const stats: BatchStats = {
        total: queue.length,
        inProgress: queue.filter((item) => item.status === 'Flashing' || item.status === 'Verifying').length,
        successful: queue.filter((item) => item.status === 'Complete').length,
        failed: queue.filter((item) => item.status === 'Failed').length,
    };

    const retryJob = (jobId: number) => {
        setQueue((current) =>
            current.map((item) =>
                item.id === jobId
                    ? { ...item, status: 'Queued', progress: 0, note: 'Retry queued. Operator must confirm voltage and transport stability.' }
                    : item
            )
        );
        setSelectedJobId(jobId);
    };

    const removeJob = (jobId: number) => {
        setQueue((current) => current.filter((item) => item.id !== jobId));
        if (selectedJobId === jobId) {
            const next = queue.find((item) => item.id !== jobId);
            if (next) setSelectedJobId(next.id);
        }
    };

    const addJob = () => {
        const nextId = Math.max(...queue.map((item) => item.id), 0) + 1;
        const nextJob: QueueItem = {
            id: nextId,
            model: 'Unassigned vehicle',
            vin: 'Pending VIN',
            package: 'staged-package.revsyncpkg',
            status: 'Queued',
            progress: 0,
            operator: 'Unassigned',
            station: 'Bench staging',
            note: 'New job created. Select package and target vehicle before launch.',
        };
        setQueue((current) => [nextJob, ...current]);
        setSelectedJobId(nextId);
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="rs-section-label m-0">Batch Flash Queue</p>
                        <h1 className="mt-2 text-2xl font-black text-[var(--rs-text-primary)]">Workshop-scale queue management for multi-ECU flashing</h1>
                        <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">
                            Track queued, active, verifying, and failed jobs in one controlled surface. Queue operations stay operator-led, and failure context remains attached to each job for retry and audit.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-72">
                            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--rs-text-tertiary)]">search</span>
                            <input value={search} onChange={(event) => setSearch(event.target.value)} className="rs-input pl-10" placeholder="Search queue, VIN, operator, or station" />
                        </div>
                        <button onClick={addJob} className="rs-button-primary flex items-center gap-2 px-4 py-2.5 text-sm font-bold">
                            <span className="material-symbols-outlined text-base">add</span>
                            Add Job
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Total Queue', value: stats.total, icon: 'dns', tone: 'text-[var(--rs-accent)]' },
                        { label: 'In Progress', value: stats.inProgress, icon: 'sync', tone: 'text-[var(--rs-warning)]' },
                        { label: 'Successful', value: stats.successful, icon: 'check_circle', tone: 'text-emerald-300' },
                        { label: 'Failed', value: stats.failed, icon: 'error', tone: 'text-[var(--rs-danger)]' },
                    ].map((item) => (
                        <div key={item.label} className="rs-panel rounded-[18px] p-4">
                            <div className="flex items-center justify-between">
                                <p className="rs-data-label">{item.label}</p>
                                <span className={`material-symbols-outlined text-xl ${item.tone}`}>{item.icon}</span>
                            </div>
                            <p className="mt-3 text-2xl font-black text-[var(--rs-text-primary)]">{item.value}</p>
                        </div>
                    ))}
                </div>

                <section className="rs-panel-raised overflow-hidden rounded-[22px]">
                    <div className="border-b border-[var(--rs-stroke-soft)] px-5 py-4">
                        <div className="grid grid-cols-[minmax(220px,1.3fr)_180px_minmax(220px,1fr)_170px_160px_120px] gap-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rs-text-tertiary)]">
                            <span>Vehicle</span>
                            <span>VIN</span>
                            <span>Package</span>
                            <span>Status</span>
                            <span>Progress</span>
                            <span>Actions</span>
                        </div>
                    </div>
                    <div className="divide-y divide-[var(--rs-stroke-soft)]">
                        {filteredQueue.map((item) => (
                            <div
                                key={item.id}
                                className={`grid cursor-pointer grid-cols-[minmax(220px,1.3fr)_180px_minmax(220px,1fr)_170px_160px_120px] gap-4 px-5 py-4 transition-colors ${
                                    selectedJob?.id === item.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.025]'
                                }`}
                                onClick={() => setSelectedJobId(item.id)}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-[var(--rs-text-primary)]">{item.model}</p>
                                    <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">
                                        {item.station} • {item.operator}
                                    </p>
                                </div>
                                <div className="text-xs font-mono text-[var(--rs-text-secondary)]">{item.vin}</div>
                                <div className="text-sm text-[var(--rs-text-secondary)]">{item.package}</div>
                                <div>
                                    <span className={`rs-badge ${getStatusTone(item.status)}`}>
                                        <span className={`material-symbols-outlined text-sm ${item.status === 'Flashing' ? 'animate-spin' : ''}`}>
                                            {item.status === 'Complete'
                                                ? 'check_circle'
                                                : item.status === 'Flashing'
                                                  ? 'progress_activity'
                                                  : item.status === 'Verifying'
                                                    ? 'fact_check'
                                                    : item.status === 'Failed'
                                                      ? 'error'
                                                      : 'schedule'}
                                        </span>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.progress}%`, background: getProgressColor(item.status) }} />
                                    </div>
                                    <span className="w-9 text-right text-xs font-mono text-[var(--rs-text-secondary)]">{item.progress}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.status === 'Failed' && (
                                        <button onClick={(event) => { event.stopPropagation(); retryJob(item.id); }} className="rs-button-secondary px-3 py-2 text-xs font-bold">
                                            Retry
                                        </button>
                                    )}
                                    <button onClick={(event) => { event.stopPropagation(); removeJob(item.id); }} className="rs-button-secondary px-3 py-2 text-xs font-bold">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <aside className="flex w-[360px] shrink-0 flex-col border-l border-[var(--rs-stroke-soft)] bg-[rgba(9,13,18,0.9)]">
                <div className="border-b border-[var(--rs-stroke-soft)] p-5">
                    <p className="rs-section-label m-0">Job Inspector</p>
                    {selectedJob ? (
                        <div className="mt-4 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-[var(--rs-text-primary)]">{selectedJob.model}</p>
                                <p className="mt-1 text-xs text-[var(--rs-text-secondary)]">{selectedJob.package}</p>
                            </div>
                            <span className={`rs-badge ${getStatusTone(selectedJob.status)}`}>{selectedJob.status}</span>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">Select a queued job to inspect operator notes, progress, and recovery actions.</p>
                    )}
                </div>
                {selectedJob && (
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
                        <div className="rs-surface-muted rounded-[18px] p-4">
                            <p className="rs-data-label">Execution context</p>
                            <div className="mt-3 space-y-2 text-sm text-[var(--rs-text-secondary)]">
                                <div className="flex items-center justify-between">
                                    <span>Operator</span>
                                    <span className="text-[var(--rs-text-primary)]">{selectedJob.operator}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Station</span>
                                    <span className="text-[var(--rs-text-primary)]">{selectedJob.station}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>VIN</span>
                                    <span className="font-mono text-[var(--rs-text-primary)]">{selectedJob.vin}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rs-surface-muted rounded-[18px] p-4">
                            <p className="rs-data-label">Operator note</p>
                            <p className="mt-3 text-sm leading-relaxed text-[var(--rs-text-secondary)]">{selectedJob.note}</p>
                        </div>

                        <div className="rs-surface-muted rounded-[18px] p-4">
                            <p className="rs-data-label">Next action</p>
                            <p className="mt-3 text-sm text-[var(--rs-text-secondary)]">
                                {selectedJob.status === 'Failed'
                                    ? 'Review voltage stability, re-arm transport, and retry only after a fresh compatibility check.'
                                    : selectedJob.status === 'Queued'
                                      ? 'Assign operator confirmation and start when the vehicle is physically connected.'
                                      : selectedJob.status === 'Complete'
                                        ? 'Archive logs or open flash history for post-job review.'
                                        : 'Keep the bench stable until verification completes.'}
                            </p>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
