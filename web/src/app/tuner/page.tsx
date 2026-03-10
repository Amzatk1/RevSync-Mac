'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import api from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { CreatorAnalytics, Tune, PaginatedResponse, UserRole } from '@/lib/types';

export default function TunerDashboardPage() {
    const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [a, t] = await Promise.all([
                    api.get<CreatorAnalytics>('/v1/marketplace/analytics/creator/'),
                    api.get<PaginatedResponse<Tune>>('/v1/marketplace/tunes/'),
                ]);
                setAnalytics(a);
                setTunes(t.results);
            } catch {
                // empty fallback
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const allowedRoles: UserRole[] = ['TUNER', 'CREATOR', 'ADMIN'];
    const publishedCount = useMemo(() => tunes.filter((tune) => tune.status === 'PUBLISHED').length, [tunes]);
    const draftCount = useMemo(() => tunes.filter((tune) => tune.status === 'DRAFT').length, [tunes]);

    const stats = analytics
        ? [
              {
                  label: 'Revenue',
                  value: `$${analytics.total_revenue?.toFixed(2) || '0.00'}`,
                  icon: 'paid',
                  style: 'text-emerald-300 bg-emerald-500/15',
                  helper: 'Gross marketplace revenue',
              },
              {
                  label: 'Active Listings',
                  value: analytics.active_listings,
                  icon: 'inventory_2',
                  style: 'text-sky-300 bg-sky-500/15',
                  helper: `${publishedCount} published`,
              },
              {
                  label: 'Avg Rating',
                  value: analytics.average_rating?.toFixed(1) || '0.0',
                  icon: 'star',
                  style: 'text-amber-300 bg-amber-500/15',
                  helper: 'Customer review average',
              },
              {
                  label: 'Downloads',
                  value: analytics.total_downloads || 0,
                  icon: 'download',
                  style: 'text-primary bg-primary/15',
                  helper: `${draftCount} draft listing${draftCount === 1 ? '' : 's'}`,
              },
          ]
        : [];

    return (
        <AppLayout
            title="Tuner Studio"
            subtitle="Manage releases, monitor commercial performance, and keep listings publish-ready"
            allowedRoles={allowedRoles}
            actions={
                <Link href="/tuner/upload" className="rs-button-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Upload Tune
                </Link>
            }
        >
            <section className="app-panel-raised mb-7 rounded-[30px] p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Creator Workspace</p>
                        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Track release readiness, commercial health, and listing state from one surface.</h2>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            The tuner dashboard prioritizes what actually matters day to day: how many listings are live, which packages are still drafts, and whether
                            recent releases are producing downloads and revenue.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Published', value: publishedCount },
                            { label: 'Drafts', value: draftCount },
                            { label: 'Total Listings', value: tunes.length },
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
                <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
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
                        <h2 className="text-xl font-black text-white">My Tunes</h2>
                        <p className="mt-1 text-xs text-text-muted">Every listing with current release state and pricing visibility.</p>
                    </div>
                    <p className="text-xs text-text-muted">{tunes.length} listings</p>
                </div>

                {loading ? (
                    <LoadingSkeleton type="table" rows={5} />
                ) : tunes.length === 0 ? (
                    <div className="py-16 text-center">
                        <span className="material-symbols-outlined text-4xl text-text-muted">upload_file</span>
                        <p className="mt-2 text-sm text-text-muted">No tunes uploaded yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="px-6 py-3 th-label">Name</th>
                                    <th className="px-6 py-3 th-label">Vehicle</th>
                                    <th className="px-6 py-3 th-label">Stage</th>
                                    <th className="px-6 py-3 th-label">Price</th>
                                    <th className="px-6 py-3 th-label">Status</th>
                                    <th className="px-6 py-3 th-label">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tunes.map((tune) => {
                                    const statusStyle: Record<string, string> = {
                                        PUBLISHED: 'bg-emerald-500/15 text-emerald-300',
                                        DRAFT: 'bg-amber-500/15 text-amber-300',
                                        ARCHIVED: 'bg-zinc-500/15 text-zinc-200',
                                    };

                                    return (
                                        <tr key={tune.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 text-sm font-semibold text-white">{tune.name}</td>
                                            <td className="px-6 py-4 text-sm text-text-body">
                                                {tune.vehicle_make} {tune.vehicle_model}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-body">Stage {tune.stage}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-white">${parseFloat(tune.price).toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${statusStyle[tune.status] || 'bg-zinc-500/15 text-zinc-200'}`}>
                                                    {tune.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/marketplace/${tune.id}`} className="text-sm font-semibold text-sky-300 hover:text-white">
                                                    View listing
                                                </Link>
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
