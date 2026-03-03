'use client';

import { useState, useEffect } from 'react';
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
                    })
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

    return (
        <AppLayout title="My Downloads" subtitle="Only verified, entitlement-backed versions can be downloaded">
            {loading ? (
                <LoadingSkeleton type="table" rows={5} />
            ) : entitlements.length === 0 ? (
                <section className="surface-card rounded-3xl py-20 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                        <span className="material-symbols-outlined text-4xl text-text-muted">download</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">No downloads yet</h3>
                    <p className="mt-2 text-sm text-text-muted">Purchase a listing to unlock verified downloads.</p>
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
                    {entitlements.map((row, i) => {
                        const versionId = row.listing.latest_version_id;
                        const status = statusMap[row.id];
                        const canDownload = Boolean(versionId) && Boolean(status?.flash_allowed);
                        const isDownloading = Boolean(downloadingMap[row.id]);

                        return (
                            <article
                                key={row.id}
                                className="surface-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:p-5"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/12">
                                    <span className="material-symbols-outlined text-[22px] text-primary">verified</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-base font-black text-white">{row.listing.title}</h3>
                                    <p className="mt-1 truncate text-sm text-text-muted">
                                        {row.listing.vehicle_make} {row.listing.vehicle_model} · v{row.listing.latest_version_number || 'N/A'}
                                    </p>
                                    {status ? (
                                        <p className={`mt-1 text-xs font-semibold ${status.flash_allowed ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {status.flash_allowed ? 'Flash allowed' : `Flash blocked (${status.status})`}
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-xs text-text-muted">Status unavailable</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                                    <div>
                                        <p className="text-base font-black text-white">${parseFloat(row.listing.price).toFixed(2)}</p>
                                        <p className="text-xs text-text-muted">{new Date(row.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <button
                                        onClick={() => handleDownload(row)}
                                        disabled={!canDownload || isDownloading}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/12 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {isDownloading ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
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
