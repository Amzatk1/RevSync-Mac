'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import type {
    MarketplaceListing,
    VersionStatusResponse,
    DownloadLinkResponse,
} from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

export default function TuneDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user } = useAuth();

    const [listing, setListing] = useState<MarketplaceListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [owned, setOwned] = useState(false);
    const [status, setStatus] = useState<VersionStatusResponse | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadMeta, setDownloadMeta] = useState<DownloadLinkResponse | null>(null);

    const versionId = listing?.latest_version_id || null;

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get<MarketplaceListing>(`/v1/marketplace/listing/${id}/`);
                setListing(response);
            } catch (err: unknown) {
                const e = err as { uiMessage?: string };
                setError(e?.uiMessage || 'Failed to load listing');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        if (!user || !id) {
            setOwned(false);
            return;
        }

        (async () => {
            try {
                const response = await api.get<{ owns?: boolean; owned?: boolean }>(`/v1/marketplace/purchase-check/${id}/`);
                setOwned(Boolean(response.owned ?? response.owns));
            } catch {
                setOwned(false);
            }
        })();
    }, [user, id]);

    useEffect(() => {
        if (!user || !versionId) {
            setStatus(null);
            return;
        }

        (async () => {
            try {
                const response = await api.get<VersionStatusResponse>(`/v1/marketplace/version-status/${versionId}/`);
                setStatus(response);
            } catch {
                setStatus(null);
            }
        })();
    }, [user, versionId]);

    const handlePurchase = async () => {
        if (!listing) return;
        setPurchasing(true);
        setError('');

        try {
            await api.post('/payments/create-intent/', { listing_id: listing.id });
            setError('Payment intent created. Complete payment from your configured client to unlock entitlement.');
        } catch (err: unknown) {
            const e = err as { uiMessage?: string };
            setError(e?.uiMessage || 'Could not start payment flow');
        } finally {
            setPurchasing(false);
        }
    };

    const handleDownload = async () => {
        if (!versionId) {
            setError('No published version is available for this listing yet.');
            return;
        }

        setDownloading(true);
        setError('');

        try {
            const latestStatus = await api.get<VersionStatusResponse>(`/v1/marketplace/version-status/${versionId}/`);
            setStatus(latestStatus);

            if (!latestStatus.flash_allowed) {
                setError('Download blocked: this version is not currently allowed for flashing.');
                return;
            }

            const response = await api.post<DownloadLinkResponse>(`/v1/marketplace/download/${versionId}/`);
            setDownloadMeta(response);

            if (typeof window !== 'undefined') {
                window.open(response.download_url, '_blank', 'noopener,noreferrer');
            }
        } catch (err: unknown) {
            const e = err as { uiMessage?: string };
            setError(e?.uiMessage || 'Download failed');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Listing Details">
                <div className="flex items-center justify-center py-24">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                </div>
            </AppLayout>
        );
    }

    if (error && !listing) {
        return (
            <AppLayout title="Listing Details">
                <div className="surface-card rounded-3xl py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-300">error</span>
                    <h3 className="mt-3 text-xl font-black text-white">{error}</h3>
                    <Link href="/marketplace" className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-light">
                        ← Back to Marketplace
                    </Link>
                </div>
            </AppLayout>
        );
    }

    if (!listing) return null;

    return (
        <AppLayout title="Listing Details" subtitle="Download gates enforce entitlement + published status verification">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                <Link href="/marketplace" className="font-medium text-text-muted hover:text-primary">
                    Marketplace
                </Link>
                <span className="material-symbols-outlined text-[14px] text-text-muted/60">chevron_right</span>
                <span className="font-semibold text-white">{listing.title}</span>
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <section className="space-y-5 xl:col-span-8">
                    <article className="surface-card rounded-3xl p-6">
                        <h1 className="text-3xl font-black text-white">{listing.title}</h1>
                        <p className="mt-1 text-sm text-text-muted">by {listing.tuner?.business_name || 'Unknown Tuner'}</p>
                        <p className="mt-4 text-sm leading-relaxed text-text-body">{listing.description}</p>
                    </article>

                    <article className="surface-card rounded-3xl p-6">
                        <h2 className="mb-4 text-xl font-black text-white">Compatibility</h2>
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {listing.vehicle_make} {listing.vehicle_model} ({listing.vehicle_year_start}–{listing.vehicle_year_end})
                        </div>
                    </article>

                    <article className="surface-card rounded-3xl p-6">
                        <h2 className="mb-4 text-xl font-black text-white">Verification Gates</h2>
                        <div className="space-y-2 text-sm text-text-body">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-emerald-300">verified</span>
                                Entitlement check before download
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-emerald-300">verified</span>
                                Published/suspension status gate before flashing
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-emerald-300">verified</span>
                                Signed package with hashes payload
                            </div>
                        </div>
                    </article>
                </section>

                <aside className="xl:col-span-4">
                    <div className="surface-card sticky top-24 rounded-3xl p-6">
                        <div className="text-center">
                            <p className="text-4xl font-black text-white">${parseFloat(listing.price).toFixed(2)}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">One-time purchase</p>
                        </div>

                        <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                            <p className="text-text-muted">Latest Version</p>
                            <p className="font-semibold text-white">{listing.latest_version_number ? `v${listing.latest_version_number}` : 'Not published'}</p>
                            <p className="text-text-muted">Version ID</p>
                            <p className="truncate font-mono text-[11px] text-text-body">{versionId || 'N/A'}</p>
                        </div>

                        {status && (
                            <div className={`mt-4 rounded-xl border px-3 py-2 text-xs ${status.flash_allowed ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-red-500/25 bg-red-500/10 text-red-300'}`}>
                                {status.flash_allowed ? 'Flash allowed' : `Flash blocked (${status.status})`}
                            </div>
                        )}

                        {!user ? (
                            <Link
                                href="/login"
                                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-sm font-bold text-white"
                            >
                                Sign in to continue
                            </Link>
                        ) : owned ? (
                            <button
                                onClick={handleDownload}
                                disabled={downloading || !versionId}
                                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-600 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {downloading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                        Download Verified Package
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handlePurchase}
                                disabled={purchasing}
                                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-600 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {purchasing ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                        Start Purchase
                                    </>
                                )}
                            </button>
                        )}

                        {downloadMeta && (
                            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
                                <p className="mb-2 font-bold uppercase tracking-[0.16em] text-text-muted">Verification Snapshot</p>
                                <p className="truncate text-text-body">Tune Hash: {downloadMeta.hashes.tune_hash_sha256}</p>
                                <p className="truncate text-text-body">Package Hash: {downloadMeta.hashes.package_hash_sha256}</p>
                                <p className="truncate text-text-body">Key ID: {downloadMeta.hashes.key_id}</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
