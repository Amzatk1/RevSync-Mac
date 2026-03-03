'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import api from '@/lib/api';
import type { MarketplaceListing, PaginatedResponse } from '@/lib/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function MarketplacePage() {
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get<PaginatedResponse<MarketplaceListing>>('/v1/marketplace/browse/');
                setListings(res.results || []);
            } catch (err: unknown) {
                const e = err as { uiMessage?: string };
                setError(e?.uiMessage || 'Failed to load marketplace listings');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return listings;
        return listings.filter((listing) => {
            const titleMatch = listing.title.toLowerCase().includes(q);
            const descMatch = listing.description.toLowerCase().includes(q);
            const vehicleMatch = `${listing.vehicle_make} ${listing.vehicle_model}`.toLowerCase().includes(q);
            const tunerMatch = (listing.tuner?.business_name || '').toLowerCase().includes(q);
            return titleMatch || descMatch || vehicleMatch || tunerMatch;
        });
    }, [listings, search]);

    return (
        <AppLayout title="Marketplace" subtitle={`${filtered.length} verified listing${filtered.length !== 1 ? 's' : ''} ready for download + flash`}>
            <section className="mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(20,20,28,0.85),rgba(10,10,14,0.78))] p-4 sm:p-5">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by bike, listing title, or tuner"
                        className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] pl-12 pr-4 text-sm text-white placeholder:text-text-muted/60 focus:border-primary/45 focus:outline-none"
                    />
                </div>
            </section>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                </div>
            )}

            {loading && <LoadingSkeleton rows={6} type="card" />}

            {!loading && !error && (
                <>
                    {filtered.length === 0 ? (
                        <div className="surface-card rounded-3xl py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-text-muted">search_off</span>
                            <h3 className="mt-3 text-xl font-black text-white">No listings found</h3>
                            <p className="mt-1 text-sm text-text-muted">Try adjusting your search keywords.</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {filtered.map((listing, i) => (
                                <Link
                                    key={listing.id}
                                    href={`/marketplace/${listing.id}`}
                                    className="surface-card group rounded-3xl p-5"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-lg font-black text-white group-hover:text-primary">{listing.title}</h3>
                                            <p className="truncate text-sm text-text-muted">{listing.tuner?.business_name || 'Unknown Tuner'}</p>
                                        </div>
                                        <p className="text-2xl font-black text-white">${parseFloat(listing.price).toFixed(0)}</p>
                                    </div>

                                    <div className="mb-4 flex flex-wrap gap-2">
                                        <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                                            Verified
                                        </span>
                                        {listing.latest_version_number && (
                                            <span className="rounded-lg border border-blue-500/25 bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                                                v{listing.latest_version_number}
                                            </span>
                                        )}
                                    </div>

                                    <p className="mb-3 line-clamp-2 text-sm text-text-muted">{listing.description}</p>

                                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                                        <span className="text-text-muted">
                                            {listing.vehicle_make} {listing.vehicle_model} ({listing.vehicle_year_start}-{listing.vehicle_year_end})
                                        </span>
                                        <span className="font-semibold text-primary">View Details →</span>
                                    </div>
                                </Link>
                            ))}
                        </section>
                    )}
                </>
            )}
        </AppLayout>
    );
}
