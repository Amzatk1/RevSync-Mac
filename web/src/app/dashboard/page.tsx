'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Vehicle, FlashJob, Purchase, PaginatedResponse } from '@/lib/types';

function statusView(status: string) {
    if (status === 'COMPLETED') return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', icon: 'check_circle' };
    if (status === 'FAILED') return { bg: 'bg-red-500/15', text: 'text-red-300', icon: 'error' };
    if (status === 'FLASHING') return { bg: 'bg-sky-500/15', text: 'text-sky-300', icon: 'autorenew' };
    return { bg: 'bg-amber-500/15', text: 'text-amber-300', icon: 'schedule' };
}

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
                // fallback to empty UI states
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const activeBike = vehicles[0];
    const latestFlash = flashJobs[0];

    const totalSpent = useMemo(
        () => purchases.reduce((sum, purchase) => sum + Number.parseFloat(purchase.price_paid || '0'), 0),
        [purchases],
    );

    const completedCount = useMemo(() => flashJobs.filter((job) => job.status === 'COMPLETED').length, [flashJobs]);
    const completionRate = flashJobs.length ? Math.round((completedCount / flashJobs.length) * 100) : 0;

    const dashboardStats = [
        {
            title: 'Tunes Flashed',
            value: flashJobs.length,
            icon: 'bolt',
            helper: `${completedCount} completed`,
            tone: 'text-primary bg-primary/15',
        },
        {
            title: 'Garage Size',
            value: vehicles.length,
            icon: 'two_wheeler',
            helper: activeBike ? `Active: ${activeBike.make} ${activeBike.model}` : 'No active bike',
            tone: 'text-sky-300 bg-sky-500/15',
        },
        {
            title: 'Tune Library',
            value: purchases.length,
            icon: 'inventory_2',
            helper: `$${totalSpent.toFixed(2)} total spend`,
            tone: 'text-emerald-300 bg-emerald-500/15',
        },
        {
            title: 'Success Rate',
            value: `${completionRate}%`,
            icon: 'query_stats',
            helper: latestFlash ? `Last flash ${new Date(latestFlash.created_at).toLocaleDateString()}` : 'No flash history',
            tone: 'text-amber-300 bg-amber-500/15',
        },
    ];

    const activityFeed = useMemo(() => {
        const flashEvents = flashJobs.slice(0, 5).map((job) => ({
            id: `flash-${job.id}`,
            type: 'flash' as const,
            date: job.created_at,
            title: `${job.tune_detail?.name || `Tune #${job.tune || 'N/A'}`}`,
            subtitle: `Flash job ${job.status.toLowerCase()}`,
            status: job.status,
        }));

        const purchaseEvents = purchases.slice(0, 5).map((purchase) => ({
            id: `purchase-${purchase.id}`,
            type: 'purchase' as const,
            date: purchase.created_at,
            title: purchase.tune?.name || 'Tune purchase',
            subtitle: `Purchased for $${Number.parseFloat(purchase.price_paid || '0').toFixed(2)}`,
            status: 'COMPLETED',
        }));

        return [...flashEvents, ...purchaseEvents]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);
    }, [flashJobs, purchases]);

    return (
        <AppLayout
            title={`Welcome back, ${user?.first_name || user?.username || 'Rider'}`}
            subtitle="Operational view of flash activity, bike readiness, and tune entitlements"
        >
            {loading ? (
                <LoadingSkeleton type="stat" />
            ) : (
                <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {dashboardStats.map((stat, idx) => (
                        <article key={stat.title} className="app-panel rounded-[24px] p-4 sm:p-5 animate-fade-up" style={{ animationDelay: `${idx * 70}ms` }}>
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{stat.title}</span>
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}>
                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                </span>
                            </div>
                            <p className="truncate text-2xl font-black text-white">{stat.value}</p>
                            <p className="mt-1 truncate text-xs text-text-muted">{stat.helper}</p>
                        </article>
                    ))}
                </section>
            )}

            <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-12">
                <article className="app-panel-raised relative overflow-hidden rounded-[30px] p-5 sm:p-6 xl:col-span-8 animate-fade-up">
                    <div className="pointer-events-none absolute right-[-70px] top-[-80px] h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-[-90px] left-[-80px] h-56 w-56 rounded-full bg-primary/12 blur-3xl" />

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="section-kicker">Flash Control</p>
                            <h3 className="mt-1 text-2xl font-black text-white">Operational Snapshot</h3>
                        </div>
                        {latestFlash && (
                            <span className="rs-status-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold text-text-body">
                                <span className="material-symbols-outlined text-[14px] text-sky-300">schedule</span>
                                Last job {new Date(latestFlash.created_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <div className="relative z-10 mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Completion Rate</p>
                            <p className="mt-2 text-3xl font-black text-white">{completionRate}%</p>
                            <p className="mt-1 text-xs text-text-muted">Based on recorded flash jobs</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Current Bike</p>
                            <p className="mt-2 text-lg font-bold text-white">{activeBike ? activeBike.name : 'Not assigned'}</p>
                            <p className="mt-1 text-xs text-text-muted">
                                {activeBike ? `${activeBike.year} ${activeBike.make} ${activeBike.model}` : 'Add a bike to tune safely'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Library Value</p>
                            <p className="mt-2 text-3xl font-black text-white">${totalSpent.toFixed(0)}</p>
                            <p className="mt-1 text-xs text-text-muted">Across {purchases.length} purchased tune(s)</p>
                        </div>
                    </div>
                </article>

                <aside className="space-y-5 xl:col-span-4">
                    <article className="app-panel rounded-[28px] p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
                        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Quick Actions</p>
                        <div className="space-y-3">
                            <Link href="/marketplace" className="rs-button-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold">
                                <span className="material-symbols-outlined text-[18px]">bolt</span>
                                Flash New Tune
                            </Link>
                            <Link href="/downloads" className="rs-button-secondary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Open Downloads
                            </Link>
                            <Link href="/settings" className="rs-button-secondary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold">
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                Review Settings
                            </Link>
                        </div>
                    </article>

                    <article className="app-panel rounded-[28px] p-5 sm:p-6 animate-fade-up" style={{ animationDelay: '110ms' }}>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">Bike Details</p>
                        {activeBike ? (
                            <div className="space-y-2">
                                {[
                                    { label: 'ECU', value: activeBike.ecu_type || 'Unknown' },
                                    { label: 'ECU ID', value: activeBike.ecu_id || 'N/A' },
                                    { label: 'VIN', value: activeBike.vin || 'Not set' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-muted">No active bike. Add one from mobile or garage endpoints.</p>
                        )}
                    </article>
                </aside>
            </section>

            <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-12">
                <article className="app-panel overflow-hidden rounded-[30px] xl:col-span-8 animate-fade-up">
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
                            <table className="w-full min-w-[700px]">
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
                                        const view = statusView(job.status);
                                        return (
                                            <tr key={job.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
                                                <td className="px-6 py-4 text-sm text-text-body">{new Date(job.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-white">
                                                    {job.tune_detail?.name || `Tune #${job.tune || 'N/A'}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${view.bg} ${view.text}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{view.icon}</span>
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
                                                                          : 'bg-sky-300'
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
                </article>

                <aside className="app-panel rounded-[30px] p-5 sm:p-6 xl:col-span-4 animate-fade-up" style={{ animationDelay: '90ms' }}>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-black text-white">Recent Activity</h3>
                        <span className="rs-status-chip rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">Live</span>
                    </div>
                    {activityFeed.length === 0 ? (
                        <p className="text-sm text-text-muted">No activity captured yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {activityFeed.map((event) => {
                                const view = statusView(event.status);
                                return (
                                    <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-white">{event.title}</p>
                                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${view.bg} ${view.text}`}>
                                                <span className="material-symbols-outlined text-[12px]">{view.icon}</span>
                                                {event.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted">{event.subtitle}</p>
                                        <p className="mt-1 text-[11px] text-text-muted/80">{new Date(event.date).toLocaleString()}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </aside>
            </section>
        </AppLayout>
    );
}
