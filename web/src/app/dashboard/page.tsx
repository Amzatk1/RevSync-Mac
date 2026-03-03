'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Vehicle, FlashJob, Purchase, PaginatedResponse } from '@/lib/types';

export default function DashboardPage() {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [flashJobs, setFlashJobs] = useState<FlashJob[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [vRes, fRes, pRes] = await Promise.all([
                    api.get<PaginatedResponse<Vehicle>>('/v1/garage/'),
                    api.get<PaginatedResponse<FlashJob>>('/v1/garage/flash-jobs/'),
                    api.get<PaginatedResponse<Purchase>>('/v1/marketplace/my-purchases/'),
                ]);
                setVehicles(vRes.results);
                setFlashJobs(fRes.results);
                setPurchases(pRes.results);
            } catch {
                // graceful fallback - empty states
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const activeBike = vehicles[0];
    const latestFlash = flashJobs[0];
    const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
        COMPLETED: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', icon: 'check_circle' },
        FAILED: { bg: 'bg-red-500/15', text: 'text-red-300', icon: 'error' },
        FLASHING: { bg: 'bg-blue-500/15', text: 'text-blue-300', icon: 'autorenew' },
        PENDING: { bg: 'bg-amber-500/15', text: 'text-amber-300', icon: 'schedule' },
    };

    const stats = [
        {
            icon: 'bolt',
            label: 'Tunes Flashed',
            value: flashJobs.length,
            chip: 'text-primary bg-primary/15',
        },
        {
            icon: 'two_wheeler',
            label: 'Bikes Registered',
            value: vehicles.length,
            chip: 'text-blue-300 bg-blue-500/15',
        },
        {
            icon: 'shopping_bag',
            label: 'Purchases',
            value: purchases.length,
            chip: 'text-emerald-300 bg-emerald-500/15',
        },
        {
            icon: 'schedule',
            label: 'Last Flash',
            value: latestFlash ? new Date(latestFlash.created_at).toLocaleDateString() : 'Never',
            chip: 'text-orange-300 bg-orange-500/15',
        },
    ];

    return (
        <AppLayout
            title={`Welcome back, ${user?.first_name || user?.username || 'Rider'}`}
            subtitle="Live overview of bikes, flash jobs, and purchased tunes"
        >
            {loading ? (
                <LoadingSkeleton type="stat" />
            ) : (
                <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <article key={stat.label} className="surface-card rounded-2xl p-4 sm:p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{stat.label}</span>
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.chip}`}>
                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                </span>
                            </div>
                            <p className="truncate text-2xl font-black text-white">{stat.value}</p>
                        </article>
                    ))}
                </section>
            )}

            <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-12">
                <article className="surface-card rounded-3xl p-5 sm:p-6 xl:col-span-8">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white">Active Bike</h3>
                        {activeBike && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                Connected
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="h-24 rounded-xl skeleton-shimmer" />
                    ) : activeBike ? (
                        <>
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                                    <span className="material-symbols-outlined text-[30px] text-primary">two_wheeler</span>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-white">{activeBike.name}</p>
                                    <p className="text-sm text-text-muted">
                                        {activeBike.year} {activeBike.make} {activeBike.model}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {[
                                    { label: 'ECU', value: activeBike.ecu_type || 'Unknown' },
                                    { label: 'ECU ID', value: activeBike.ecu_id || 'N/A' },
                                    { label: 'VIN', value: activeBike.vin || 'Not set' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-10 text-center">
                            <span className="material-symbols-outlined text-4xl text-text-muted">add_circle</span>
                            <p className="mt-2 text-sm text-text-muted">No bikes registered yet.</p>
                        </div>
                    )}
                </article>

                <aside className="xl:col-span-4">
                    <div className="surface-card rounded-3xl p-5 sm:p-6">
                        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Quick Actions</p>
                        <div className="space-y-3">
                            <Link
                                href="/marketplace"
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-600 text-sm font-bold text-white"
                            >
                                <span className="material-symbols-outlined text-[18px]">bolt</span>
                                Flash New Tune
                            </Link>
                            <Link
                                href="/downloads"
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] text-sm font-semibold text-white"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                My Downloads
                            </Link>
                            <Link
                                href="/settings"
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] text-sm font-semibold text-white"
                            >
                                <span className="material-symbols-outlined text-[18px]">settings</span>
                                Settings
                            </Link>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="surface-card overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                    <h3 className="text-lg font-black text-white">Flash History</h3>
                    <p className="text-xs font-medium text-text-muted">{flashJobs.length} total entries</p>
                </div>

                {loading ? (
                    <LoadingSkeleton type="table" rows={4} />
                ) : flashJobs.length === 0 ? (
                    <div className="py-14 text-center">
                        <span className="material-symbols-outlined text-4xl text-text-muted">history</span>
                        <p className="mt-2 text-sm text-text-muted">No flash history yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px]">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="px-6 py-3 th-label">Date</th>
                                    <th className="px-6 py-3 th-label">Tune</th>
                                    <th className="px-6 py-3 th-label">Status</th>
                                    <th className="px-6 py-3 th-label">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flashJobs.slice(0, 10).map((job) => {
                                    const sc = statusConfig[job.status] || {
                                        bg: 'bg-zinc-500/15',
                                        text: 'text-zinc-200',
                                        icon: 'help',
                                    };
                                    return (
                                        <tr key={job.id} className="border-b border-white/6 last:border-0 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 text-sm text-text-body">{new Date(job.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-white">
                                                {job.tune_detail?.name || `Tune #${job.tune || 'N/A'}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                                                    <span className="material-symbols-outlined text-[14px]">{sc.icon}</span>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                job.status === 'COMPLETED'
                                                                    ? 'bg-emerald-400'
                                                                    : job.status === 'FAILED'
                                                                    ? 'bg-red-400'
                                                                    : 'bg-primary'
                                                            }`}
                                                            style={{ width: `${job.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-8 text-right text-xs font-medium text-text-muted">{job.progress}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
