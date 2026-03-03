'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Purchase, PaginatedResponse } from '@/lib/types';

export default function DownloadsPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<PaginatedResponse<Purchase>>('/v1/marketplace/my-purchases/');
                setPurchases(res.results);
            } catch {
                // empty state fallback
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AppLayout title="My Downloads" subtitle="Purchased tune files ready for flash sessions">
            {loading ? (
                <LoadingSkeleton type="table" rows={5} />
            ) : purchases.length === 0 ? (
                <section className="surface-card rounded-3xl py-20 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                        <span className="material-symbols-outlined text-4xl text-text-muted">download</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">No downloads yet</h3>
                    <p className="mt-2 text-sm text-text-muted">Purchase a tune from marketplace to unlock downloads.</p>
                    <Link
                        href="/marketplace"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-600 px-6 py-3 text-sm font-bold text-white"
                    >
                        <span className="material-symbols-outlined text-[18px]">storefront</span>
                        Browse Marketplace
                    </Link>
                </section>
            ) : (
                <section className="space-y-3">
                    {purchases.map((purchase, i) => (
                        <article
                            key={purchase.id}
                            className="surface-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:p-5"
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/12">
                                <span className="material-symbols-outlined text-[22px] text-primary">music_note</span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-base font-black text-white">{purchase.tune?.name || 'Unknown Tune'}</h3>
                                <p className="mt-1 truncate text-sm text-text-muted">
                                    {purchase.tune?.vehicle_make} {purchase.tune?.vehicle_model} · Stage {purchase.tune?.stage || '?'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                                <div>
                                    <p className="text-base font-black text-white">${parseFloat(purchase.price_paid).toFixed(2)}</p>
                                    <p className="text-xs text-text-muted">{new Date(purchase.created_at).toLocaleDateString()}</p>
                                </div>
                                <button className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/12 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20">
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                    Download
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </AppLayout>
    );
}
