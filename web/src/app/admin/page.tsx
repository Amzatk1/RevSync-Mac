'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Tune, PaginatedResponse, UserRole } from '@/lib/types';

export default function AdminPage() {
    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchTunes = async () => {
        try {
            const res = await api.get<PaginatedResponse<Tune>>('/v1/marketplace/tunes/');
            setTunes(res.results);
        } catch {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTunes();
    }, []);

    const handleAction = async (id: number, action: 'publish' | 'archive') => {
        setActionLoading(id);
        try {
            await api.post(`/v1/marketplace/tunes/${id}/${action}/`);
            await fetchTunes();
        } catch {
            // no-op
        } finally {
            setActionLoading(null);
        }
    };

    const pending = useMemo(() => tunes.filter((tune) => tune.status === 'DRAFT'), [tunes]);
    const published = useMemo(() => tunes.filter((tune) => tune.status === 'PUBLISHED'), [tunes]);
    const archived = useMemo(() => tunes.filter((tune) => tune.status === 'ARCHIVED'), [tunes]);
    const allowedRoles: UserRole[] = ['ADMIN'];

    const stats = [
        {
            label: 'Pending Review',
            value: pending.length,
            icon: 'pending',
            style: 'text-amber-300 bg-amber-500/15',
            helper: 'Listings waiting for moderator action',
        },
        {
            label: 'Published',
            value: published.length,
            icon: 'check_circle',
            style: 'text-emerald-300 bg-emerald-500/15',
            helper: 'Live marketplace listings',
        },
        {
            label: 'Archived',
            value: archived.length,
            icon: 'archive',
            style: 'text-zinc-200 bg-zinc-500/15',
            helper: 'Removed from active distribution',
        },
    ];

    return (
        <AppLayout title="Content Review" subtitle="Approve, reject, and govern tune submissions" allowedRoles={allowedRoles}>
            <section className="app-panel-raised mb-7 rounded-[30px] p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Moderation Queue</p>
                        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Keep tune distribution controlled, reviewable, and operationally clean.</h2>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            This view exists to move draft submissions through approval or removal with clear queue visibility. It should feel closer to moderation
                            software than to a generic marketing dashboard.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Draft queue', value: pending.length },
                            { label: 'Published', value: published.length },
                            { label: 'Archived', value: archived.length },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                                <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {loading ? (
                <LoadingSkeleton type="stat" />
            ) : (
                <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {stats.map((stat) => (
                        <article key={stat.label} className="app-panel rounded-[24px] p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{stat.label}</span>
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.style}`}>
                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                </span>
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className="mt-1 text-xs text-text-muted">{stat.helper}</p>
                        </article>
                    ))}
                </section>
            )}

            <section className="app-panel overflow-hidden rounded-[30px]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-black text-white">Review Queue</h2>
                        <p className="mt-1 text-xs text-text-muted">Draft submissions waiting on moderator action.</p>
                    </div>
                    {pending.length > 0 && (
                        <span className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">{pending.length} pending</span>
                    )}
                </div>

                {loading ? (
                    <LoadingSkeleton type="table" rows={5} />
                ) : pending.length === 0 ? (
                    <div className="py-16 text-center">
                        <span className="material-symbols-outlined text-4xl text-emerald-300">check_circle</span>
                        <p className="mt-2 text-sm text-text-muted">All clear. No pending tune reviews.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px]">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="px-6 py-3 th-label">Tune</th>
                                    <th className="px-6 py-3 th-label">Tuner</th>
                                    <th className="px-6 py-3 th-label">Vehicle</th>
                                    <th className="px-6 py-3 th-label">Stage</th>
                                    <th className="px-6 py-3 th-label">Price</th>
                                    <th className="px-6 py-3 th-label">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map((tune) => (
                                    <tr key={tune.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-sm font-semibold text-white">{tune.name}</td>
                                        <td className="px-6 py-4 text-sm text-text-body">{tune.creator?.business_name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-sm text-text-body">
                                            {tune.vehicle_make} {tune.vehicle_model}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-body">Stage {tune.stage}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-white">${parseFloat(tune.price).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(tune.id, 'publish')}
                                                    disabled={actionLoading === tune.id}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(tune.id, 'archive')}
                                                    disabled={actionLoading === tune.id}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
