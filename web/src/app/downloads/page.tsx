'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type {
    MarketplaceEntitlement,
    VersionStatusResponse,
    DownloadLinkResponse,
    PaginatedResponse,
} from '@/lib/types';

type StatusMap = Record<string, VersionStatusResponse | null>;
type DownloadMap = Record<string, boolean>;

export default function DownloadsPage() {
    const [entitlements, setEntitlements] = useState<MarketplaceEntitlement[]>([]);
    const [statusMap, setStatusMap] = useState<StatusMap>({});
    const [loading, setLoading] = useState(true);
    const [downloadingMap, setDownloadingMap] = useState<DownloadMap>({});

    useEffect(() => {
        (async () => {
            try {
                const response = await api.get<PaginatedResponse<MarketplaceEntitlement> | MarketplaceEntitlement[]>('/v1/marketplace/entitlements/');
                const rows = Array.isArray(response) ? response : (response.results || []);
                setEntitlements(rows);

                const statusEntries = await Promise.all(
                    rows.map(async (row) => {
                        const versionId = row.listing.latest_version_id;
                        if (!versionId) return [row.id, null] as const;
                        try {
                            const status = await api.get<VersionStatusResponse>(`/v1/marketplace/version-status/${versionId}/`);
                            return [row.id, status] as const;
                        } catch {
                            return [row.id, null] as const;
                        }
                    }),
                );

                setStatusMap(Object.fromEntries(statusEntries));
            } catch {
                // empty state fallback
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDownload = async (row: MarketplaceEntitlement) => {
        const versionId = row.listing.latest_version_id;
        if (!versionId) return;

        setDownloadingMap((prev) => ({ ...prev, [row.id]: true }));

        try {
            const latestStatus = await api.get<VersionStatusResponse>(`/v1/marketplace/version-status/${versionId}/`);
            setStatusMap((prev) => ({ ...prev, [row.id]: latestStatus }));

            if (!latestStatus.flash_allowed) return;

            const payload = await api.post<DownloadLinkResponse>(`/v1/marketplace/download/${versionId}/`);
            if (typeof window !== 'undefined') {
                window.open(payload.download_url, '_blank', 'noopener,noreferrer');
            }
        } finally {
            setDownloadingMap((prev) => ({ ...prev, [row.id]: false }));
        }
    };

    const downloadReadyCount = useMemo(
        () => entitlements.filter((row) => Boolean(row.listing.latest_version_id) && Boolean(statusMap[row.id]?.flash_allowed)).length,
        [entitlements, statusMap],
    );

    return (
        <AppLayout title="My Downloads" subtitle="Entitlement-backed releases with explicit version and safety state">
            <section className="app-panel-raised mb-6 rounded-[28px] p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Release Library</p>
                        <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">Only verified versions move from entitlement to download.</h3>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted">
                            RevSync keeps purchase state, version readiness, and flash eligibility visible before a package ever leaves the marketplace pipeline.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Entitlements', value: entitlements.length },
                            { label: 'Ready to download', value: downloadReadyCount },
                            { label: 'Blocked or pending', value: Math.max(entitlements.length - downloadReadyCount, 0) },
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
                <LoadingSkeleton type="table" rows={5} />
            ) : entitlements.length === 0 ? (
                <section className="app-panel rounded-[28px] py-20 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                        <span className="material-symbols-outlined text-4xl text-text-muted">download</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">No downloads yet</h3>
                    <p className="mt-2 text-sm text-text-muted">Purchase a listing to unlock verified download and flash access.</p>
                    <Link href="/marketplace" className="rs-button-primary mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold">
                        <span className="material-symbols-outlined text-[18px]">storefront</span>
                        Browse Marketplace
                    </Link>
                </section>
            ) : (
                <section className="space-y-3">
                    {entitlements.map((row, i) => {
                        const versionId = row.listing.latest_version_id;
                        const status = statusMap[row.id];
                        const canDownload = Boolean(versionId) && Boolean(status?.flash_allowed);
                        const isDownloading = Boolean(downloadingMap[row.id]);

                        return (
                            <article
                                key={row.id}
                                className="app-panel flex flex-col gap-4 rounded-[24px] p-4 sm:flex-row sm:items-center sm:p-5"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10">
                                    <span className="material-symbols-outlined text-[22px] text-sky-300">verified</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="truncate text-base font-black text-white">{row.listing.title}</h3>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                                status?.flash_allowed
                                                    ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-300'
                                                    : 'border-amber-500/30 bg-amber-500/12 text-amber-300'
                                            }`}
                                        >
                                            {status?.flash_allowed ? 'ready' : status?.status || 'pending'}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-sm text-text-muted">
                                        {row.listing.vehicle_make} {row.listing.vehicle_model} · v{row.listing.latest_version_number || 'N/A'}
                                    </p>
                                    <p className={`mt-1 text-xs font-semibold ${status?.flash_allowed ? 'text-emerald-300' : 'text-text-muted'}`}>
                                        {status?.flash_allowed ? 'Flash allowed after verification' : 'Waiting for a releasable version or additional checks'}
                                    </p>
                                </div>

                                <div className="grid gap-2 sm:min-w-[230px] sm:justify-items-end">
                                    <div className="text-left sm:text-right">
                                        <p className="text-base font-black text-white">${parseFloat(row.listing.price).toFixed(2)}</p>
                                        <p className="text-xs text-text-muted">Purchased {new Date(row.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <button
                                        onClick={() => handleDownload(row)}
                                        disabled={!canDownload || isDownloading}
                                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold ${
                                            canDownload ? 'rs-button-primary' : 'rs-button-secondary opacity-60'
                                        } disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                        )}
                                        Download
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </AppLayout>
    );
}
