'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import type { Tune } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const STAGE_COLORS: Record<number, string> = {
    1: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    2: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    3: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
};

export default function TuneDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user } = useAuth();
    const [tune, setTune] = useState<Tune | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [purchased, setPurchased] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const t = await api.get<Tune>(`/v1/marketplace/tunes/${id}/`);
                setTune(t);
            } catch (err: unknown) {
                const e = err as { uiMessage?: string };
                setError(e?.uiMessage || 'Failed to load tune');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handlePurchase = async () => {
        if (!tune) return;
        setPurchasing(true);
        try {
            await api.post('/v1/marketplace/purchase/', { tune_id: tune.id });
            setPurchased(true);
        } catch (err: unknown) {
            const e = err as { uiMessage?: string };
            setError(e?.uiMessage || 'Purchase failed');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Tune Details">
                <div className="flex items-center justify-center py-24">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                </div>
            </AppLayout>
        );
    }

    if (error || !tune) {
        return (
            <AppLayout title="Tune Details">
                <div className="surface-card rounded-3xl py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-300">error</span>
                    <h3 className="mt-3 text-xl font-black text-white">{error || 'Tune not found'}</h3>
                    <Link href="/marketplace" className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-light">
                        ← Back to Marketplace
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Tune Details" subtitle="Review compatibility, gains, and security before purchase">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                <Link href="/marketplace" className="font-medium text-text-muted hover:text-primary">
                    Marketplace
                </Link>
                <span className="material-symbols-outlined text-[14px] text-text-muted/60">chevron_right</span>
                <span className="font-semibold text-white">{tune.name}</span>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <section className="space-y-5 xl:col-span-8">
                    <article className="surface-card rounded-3xl p-6">
                        <div className="mb-5 flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-text-muted">
                                {tune.creator?.logo_url ? (
                                    <img src={tune.creator.logo_url} alt="" className="h-full w-full rounded-xl object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined">person</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-3xl font-black text-white">{tune.name}</h1>
                                <div className="mt-1 flex items-center gap-2 text-sm">
                                    <span className="text-text-muted">by</span>
                                    <span className="font-semibold text-white">{tune.creator?.business_name || 'Unknown'}</span>
                                    {tune.creator?.is_verified_business && (
                                        <span className="material-symbols-outlined text-[16px] text-blue-300">verified</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                            <span className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold ${STAGE_COLORS[tune.stage] || 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30'}`}>
                                Stage {tune.stage}
                            </span>
                            {tune.safety_rating > 0 && (
                                <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                                    Safety {tune.safety_rating}/100
                                </span>
                            )}
                        </div>

                        <p className="text-sm leading-relaxed text-text-body">{tune.description}</p>
                    </article>

                    <article className="surface-card rounded-3xl p-6">
                        <h2 className="mb-4 text-xl font-black text-white">Performance Specs</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[
                                {
                                    label: 'HP Gain',
                                    value: tune.horsepower_gain ? `+${parseFloat(tune.horsepower_gain).toFixed(1)}` : 'N/A',
                                    unit: 'HP',
                                },
                                {
                                    label: 'Torque Gain',
                                    value: tune.torque_gain ? `+${parseFloat(tune.torque_gain).toFixed(1)}` : 'N/A',
                                    unit: 'Nm',
                                },
                                { label: 'Stage', value: `Stage ${tune.stage}`, unit: '' },
                                { label: 'File Size', value: `${tune.file_size_kb}`, unit: 'KB' },
                                { label: 'Compatibility', value: `${tune.compatibility_index || 0}`, unit: '%' },
                                { label: 'Status', value: tune.status, unit: '' },
                            ].map((spec) => (
                                <div key={spec.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{spec.label}</p>
                                    <p className="mt-1 text-lg font-black text-white">
                                        {spec.value}
                                        <span className="ml-1 text-xs font-medium text-text-muted">{spec.unit}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="surface-card rounded-3xl p-6">
                        <h2 className="mb-3 text-xl font-black text-white">Compatibility</h2>
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {tune.vehicle_make} {tune.vehicle_model} ({tune.vehicle_year_start}–{tune.vehicle_year_end})
                        </div>
                    </article>
                </section>

                <aside className="xl:col-span-4">
                    <div className="surface-card sticky top-24 rounded-3xl p-6">
                        <div className="text-center">
                            <p className="text-4xl font-black text-white">${parseFloat(tune.price).toFixed(2)}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">One-time purchase</p>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                            Instant Delivery
                        </div>

                        {purchased ? (
                            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-5 text-center">
                                <span className="material-symbols-outlined text-4xl text-emerald-300">check_circle</span>
                                <p className="mt-2 text-sm font-bold text-emerald-300">Purchased successfully</p>
                                <Link href="/downloads" className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-light">
                                    Go to Downloads →
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handlePurchase}
                                disabled={purchasing || !user}
                                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-600 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {purchasing ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                        Buy Now
                                    </>
                                )}
                            </button>
                        )}

                        <div className="mt-6 border-t border-white/10 pt-5">
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Security Checks</p>
                            <div className="space-y-2.5 text-sm text-text-body">
                                {['Ed25519 signature verification', 'SHA-256 integrity match', 'Safety score validation'].map((item) => (
                                    <div key={item} className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[16px] text-emerald-300">verified</span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
