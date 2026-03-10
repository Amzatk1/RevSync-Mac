'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import type { MarketplaceListing, VersionStatusResponse, DownloadLinkResponse } from '@/lib/types';
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
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400/25 border-t-sky-300" />
                </div>
            </AppLayout>
        );
    }

    if (error && !listing) {
        return (
            <AppLayout title="Listing Details">
                <div className="app-panel rounded-[28px] py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-300">error</span>
                    <h3 className="mt-3 text-xl font-black text-white">{error}</h3>
                    <Link href="/marketplace" className="mt-3 inline-block text-sm font-semibold text-sky-300 hover:text-white">
                        Back to Marketplace
                    </Link>
                </div>
            </AppLayout>
        );
    }

    if (!listing) return null;

    return (
        <AppLayout title="Listing Details" subtitle="Version gating, entitlement checks, and signed package visibility">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                <Link href="/marketplace" className="font-medium text-text-muted hover:text-sky-300">
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
                    <article className="app-panel-raised rounded-[30px] p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="section-kicker">Verified Listing</p>
                                <h1 className="mt-2 text-3xl font-black text-white">{listing.title}</h1>
                                <p className="mt-1 text-sm text-text-muted">by {listing.tuner?.business_name || 'Unknown tuner'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                    Verified
                                </span>
                                {listing.latest_version_number && (
                                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">
                                        v{listing.latest_version_number}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-body">{listing.description}</p>
                    </article>

                    <article className="app-panel rounded-[28px] p-6">
                        <h2 className="mb-4 text-xl font-black text-white">Compatibility</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Vehicle</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {listing.vehicle_make} {listing.vehicle_model}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Supported Years</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {listing.vehicle_year_start} - {listing.vehicle_year_end}
                                </p>
                            </div>
                        </div>
                    </article>

                    <article className="app-panel rounded-[28px] p-6">
                        <h2 className="mb-4 text-xl font-black text-white">Verification Gates</h2>
                        <div className="space-y-3 text-sm text-text-body">
                            {[
                                'Entitlement check before download',
                                'Published or suspended status gate before flashing',
                                'Signed package with downloadable verification hashes',
                                'Flash eligibility state checked against current version',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                                    <span className="material-symbols-outlined text-[16px] text-emerald-300">verified</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <aside className="xl:col-span-4">
                    <div className="app-panel sticky top-24 rounded-[30px] p-6">
                        <div className="text-center">
                            <p className="text-4xl font-black text-white">${parseFloat(listing.price).toFixed(2)}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">One-time purchase</p>
                        </div>

                        <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-text-muted">Latest Version</span>
                                <span className="font-semibold text-white">{listing.latest_version_number ? `v${listing.latest_version_number}` : 'Not published'}</span>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-text-muted">Version ID</span>
                                <span className="truncate font-mono text-[11px] text-text-body">{versionId || 'N/A'}</span>
                            </div>
                        </div>

                        {status && (
                            <div
                                className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
                                    status.flash_allowed
                                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                        : 'border-red-500/25 bg-red-500/10 text-red-300'
                                }`}
                            >
                                {status.flash_allowed ? 'Flash allowed' : `Flash blocked (${status.status})`}
                            </div>
                        )}

                        {!user ? (
                            <Link href="/login" className="rs-button-secondary mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold">
                                Sign in to continue
                            </Link>
                        ) : owned ? (
                            <button
                                onClick={handleDownload}
                                disabled={downloading || !versionId}
                                className="rs-button-primary mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
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
                                className="rs-button-primary mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
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
                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-xs">
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
