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

    const featuredVehicles = useMemo(() => Array.from(new Set(listings.slice(0, 6).map((item) => `${item.vehicle_make} ${item.vehicle_model}`))), [listings]);

    return (
        <AppLayout title="Marketplace" subtitle={`${filtered.length} verified listing${filtered.length !== 1 ? 's' : ''} available with entitlement-aware delivery`}>
            <section className="app-panel-raised mb-6 overflow-hidden rounded-[28px] p-5 sm:p-6">
                <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Verified Inventory</p>
                        <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">Browse fitment-aware tune packages with clear trust signals.</h3>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            Listings are filtered through compatibility, entitlement, and version state before the user reaches a download or flashing decision.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['Signed packages', 'Compatibility scoring', 'Version visibility', 'Recovery-aware delivery'].map((item) => (
                                <span key={item} className="rs-status-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-text-body">
                                    <span className="material-symbols-outlined text-[14px] text-sky-300">verified</span>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by bike, listing title, or tuner"
                                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] pl-12 pr-4 text-sm text-white placeholder:text-text-muted/60 focus:border-sky-400/45 focus:outline-none"
                            />
                        </div>
                        <div className="rs-status-chip inline-flex h-12 items-center rounded-xl px-4 text-sm font-semibold text-text-body">
                            {listings.length} total listings
                        </div>
                    </div>
                </div>

                {featuredVehicles.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {featuredVehicles.map((vehicle) => (
                            <button
                                key={vehicle}
                                onClick={() => setSearch(vehicle)}
                                className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-sky-400/25 hover:text-white"
                            >
                                {vehicle}
                            </button>
                        ))}
                    </div>
                )}
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
                        <div className="app-panel rounded-[28px] py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-text-muted">search_off</span>
                            <h3 className="mt-3 text-xl font-black text-white">No listings found</h3>
                            <p className="mt-1 text-sm text-text-muted">Try a broader bike model, tuner name, or listing title.</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {filtered.map((listing, i) => (
                                <Link
                                    key={listing.id}
                                    href={`/marketplace/${listing.id}`}
                                    className="app-panel premium-hover group rounded-[28px] p-5"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-lg font-black text-white group-hover:text-sky-300">{listing.title}</h3>
                                            <p className="truncate text-sm text-text-muted">{listing.tuner?.business_name || 'Unknown tuner'}</p>
                                        </div>
                                        <p className="text-2xl font-black text-white">${parseFloat(listing.price).toFixed(0)}</p>
                                    </div>

                                    <div className="mb-4 flex flex-wrap gap-2">
                                        <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                                            Verified
                                        </span>
                                        {listing.latest_version_number && (
                                            <span className="rounded-lg border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
                                                v{listing.latest_version_number}
                                            </span>
                                        )}
                                    </div>

                                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-text-muted">{listing.description}</p>

                                    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                                        <div className="flex items-center justify-between gap-4 text-xs">
                                            <span className="text-text-muted">Vehicle</span>
                                            <span className="text-right font-semibold text-text-body">
                                                {listing.vehicle_make} {listing.vehicle_model}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-xs">
                                            <span className="text-text-muted">Model years</span>
                                            <span className="text-right font-semibold text-text-body">
                                                {listing.vehicle_year_start}-{listing.vehicle_year_end}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                                        <span className="text-text-muted">Signed release ready for entitlement checks</span>
                                        <span className="font-semibold text-sky-300">View details</span>
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
