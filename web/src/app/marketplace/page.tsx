'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import api from '@/lib/api';
import type { Tune, PaginatedResponse } from '@/lib/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const STAGES = [0, 1, 2, 3];
const STAGE_LABELS: Record<number, string> = {
    0: 'All Stages',
    1: 'Stage 1',
    2: 'Stage 2',
    3: 'Stage 3',
};
const STAGE_COLORS: Record<number, string> = {
    1: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    2: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    3: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
};

export default function MarketplacePage() {
    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState(0);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState('');

    const fetchTunes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string | number | undefined> = { page };
            if (search) params.search = search;
            if (stage > 0) params.stage = stage;
            const res = await api.get<PaginatedResponse<Tune>>('/v1/marketplace/tunes/', { params });
            setTunes(res.results);
            setTotal(res.count);
        } catch (err: unknown) {
            const e = err as { uiMessage?: string };
            setError(e?.uiMessage || 'Failed to load tunes');
        } finally {
            setLoading(false);
        }
    }, [search, stage, page]);

    useEffect(() => {
        fetchTunes();
    }, [fetchTunes]);

    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const totalPages = Math.ceil(total / 10);

    return (
        <AppLayout title="Marketplace" subtitle={`${total} tune${total !== 1 ? 's' : ''} available`}>
            <section className="mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(20,20,28,0.85),rgba(10,10,14,0.78))] p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by bike, tuner, or keyword"
                            className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] pl-12 pr-4 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {STAGES.map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    setStage(s);
                                    setPage(1);
                                }}
                                className={`rounded-xl px-4 py-2 text-xs font-bold ${
                                    stage === s
                                        ? 'border border-primary/40 bg-primary/16 text-white'
                                        : 'border border-white/12 bg-white/[0.02] text-text-muted hover:text-white'
                                }`}
                            >
                                {STAGE_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                    <button onClick={fetchTunes} className="ml-auto text-xs font-semibold text-primary hover:text-primary-light">
                        Retry
                    </button>
                </div>
            )}

            {loading && <LoadingSkeleton rows={6} type="card" />}

            {!loading && !error && (
                <>
                    {tunes.length === 0 ? (
                        <div className="surface-card rounded-3xl py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-text-muted">search_off</span>
                            <h3 className="mt-3 text-xl font-black text-white">No tunes found</h3>
                            <p className="mt-1 text-sm text-text-muted">Try adjusting your filters or search keywords.</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {tunes.map((tune, i) => (
                                <Link
                                    key={tune.id}
                                    href={`/marketplace/${tune.id}`}
                                    className="surface-card group rounded-3xl p-5"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-lg font-black text-white group-hover:text-primary">{tune.name}</h3>
                                            <p className="truncate text-sm text-text-muted">{tune.creator?.business_name || 'Unknown Tuner'}</p>
                                        </div>
                                        <p className="text-2xl font-black text-white">${parseFloat(tune.price).toFixed(0)}</p>
                                    </div>

                                    <div className="mb-4 flex flex-wrap gap-2">
                                        <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${STAGE_COLORS[tune.stage] || 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30'}`}>
                                            Stage {tune.stage}
                                        </span>
                                        {tune.horsepower_gain && (
                                            <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                                                +{parseFloat(tune.horsepower_gain).toFixed(0)} HP
                                            </span>
                                        )}
                                        {tune.torque_gain && (
                                            <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                                                +{parseFloat(tune.torque_gain).toFixed(0)} Nm
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                                        <span className="text-text-muted">
                                            {tune.vehicle_make} {tune.vehicle_model}
                                        </span>
                                        <span className="font-semibold text-primary">View Details →</span>
                                    </div>
                                </Link>
                            ))}
                        </section>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-9 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ← Previous
                            </button>
                            <span className="px-3 text-sm text-text-muted">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
