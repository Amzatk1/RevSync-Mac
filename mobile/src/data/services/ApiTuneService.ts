import {
    Tune,
    TuneFilter,
    TuneService,
    DownloadUrlResponse,
    VersionStatusResponse,
    Entitlement,
} from '../../domain/services/DomainTypes';
import { StorageAdapter } from './StorageAdapter';
import { ApiClient } from '../http/ApiClient';

const CACHE_KEYS = {
    TUNES_LIST: 'tunes_list_cache',
    ENTITLEMENTS: 'entitlements_cache',
};

interface RawListing {
    id: string;
    title: string;
    description?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year_start?: number;
    vehicle_year_end?: number;
    price?: string | number;
    latest_version_id?: string | null;
    latest_version_number?: string | null;
    latest_version_status?: string | null;
}

interface RawEntitlement {
    id: string;
    listing: RawListing;
    transaction_id: string;
    created_at: string;
}

function toNumber(value: unknown, fallback: number): number {
    const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
    return Number.isFinite(n) ? n : fallback;
}

function normalizeVersionState(raw?: string | null): Tune['versionState'] {
    if (!raw) return undefined;
    const allowed = new Set([
        'DRAFT',
        'UPLOADED',
        'VALIDATING',
        'FAILED',
        'READY_FOR_REVIEW',
        'APPROVED',
        'PUBLISHED',
        'SUSPENDED',
    ]);
    return allowed.has(raw) ? (raw as Tune['versionState']) : undefined;
}

function mapListingToTune(raw: RawListing): Tune {
    const make = raw.vehicle_make || 'Unknown';
    const model = raw.vehicle_model || 'Model';
    const y0 = raw.vehicle_year_start || 0;
    const y1 = raw.vehicle_year_end || y0;

    return {
        id: raw.id,
        title: raw.title,
        bikeId: `${make}:${model}:${y0}-${y1}`,
        stage: 1,
        price: toNumber(raw.price, 0),
        safetyRating: raw.latest_version_id ? 92 : 60,
        compatibilityRaw: [`${make} ${model}`, `${y0}-${y1}`],
        description: raw.description || '',
        modificationsRequired: [],
        octaneRequired: 91,
        version: raw.latest_version_number || '0.0.0',
        listingId: raw.id,
        versionId: raw.latest_version_id || undefined,
        versionState: normalizeVersionState(raw.latest_version_status),
    };
}

function mapEntitlement(raw: RawEntitlement): Entitlement {
    return {
        id: raw.id,
        listingId: raw.listing?.id || '',
        listingTitle: raw.listing?.title || 'Tune Listing',
        isActive: true,
        isRevoked: false,
        purchasedAt: raw.created_at,
    };
}

export class ApiTuneService implements TuneService {
    async getTunes(filter?: TuneFilter, page: number = 1): Promise<Tune[]> {
        try {
            const params: Record<string, string | number | boolean | undefined> = { page };
            const response = await ApiClient.getInstance().get<{ results?: RawListing[] } | RawListing[]>('/v1/marketplace/browse/', { params });
            const rawList = Array.isArray(response) ? response : (response.results || []);
            let mapped = rawList.map(mapListingToTune);

            if (filter?.searchQuery) {
                const q = filter.searchQuery.toLowerCase();
                mapped = mapped.filter((t) => {
                    const matchTitle = t.title.toLowerCase().includes(q);
                    const matchDesc = (t.description || '').toLowerCase().includes(q);
                    const matchCompat = (t.compatibilityRaw || []).some((x) => x.toLowerCase().includes(q));
                    return matchTitle || matchDesc || matchCompat;
                });
            }

            if (filter?.minStage) {
                mapped = mapped.filter((t) => t.stage >= filter.minStage!);
            }

            if (filter?.onlySafe) {
                mapped = mapped.filter((t) => t.safetyRating >= 80);
            }

            if (!filter || Object.keys(filter).length === 0) {
                await StorageAdapter.set(CACHE_KEYS.TUNES_LIST, mapped);
            }

            return mapped;
        } catch (error) {
            console.warn('ApiTuneService: Network failed, trying cache', error);
            const cached = await StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
            if (cached) {
                return cached;
            }
            return [];
        }
    }

    async getTuneDetails(tuneId: string): Promise<Tune | null> {
        try {
            const raw = await ApiClient.getInstance().get<RawListing>(`/v1/marketplace/listing/${tuneId}/`);
            return mapListingToTune(raw);
        } catch (error) {
            console.warn('ApiTuneService: Detail fetch failed', error);
            const cachedList = await StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
            if (cachedList) {
                return cachedList.find((t) => t.id === tuneId) || null;
            }
            return null;
        }
    }

    async getRecommendTunes(bikeId: string): Promise<Tune[]> {
        return this.getTunes({ compatibleBikeId: bikeId, onlySafe: true });
    }

    async getTunesForBike(bikeId: string): Promise<Tune[]> {
        return this.getTunes({ compatibleBikeId: bikeId });
    }

    // ─── Purchase Flow ─────────────────────────────────────────

    async purchaseTune(tuneId: string): Promise<void> {
        await ApiClient.getInstance().post('/payments/create-intent/', { listing_id: tuneId });
    }

    async createPaymentIntent(
        listingId: string
    ): Promise<{ clientSecret: string; publishableKey: string }> {
        const response = await ApiClient.getInstance().post<{ clientSecret: string; publishableKey?: string }>(
            '/payments/create-intent/',
            { listing_id: listingId }
        );

        return {
            clientSecret: response.clientSecret,
            publishableKey: response.publishableKey || '',
        };
    }

    async checkPurchase(listingId: string): Promise<{ owned: boolean }> {
        const response = await ApiClient.getInstance().get<{ owns?: boolean; owned?: boolean }>(
            `/v1/marketplace/purchase-check/${listingId}/`
        );
        return { owned: Boolean(response.owned ?? response.owns) };
    }

    // ─── Secure Download ───────────────────────────────────────

    async getDownloadUrl(versionId: string): Promise<DownloadUrlResponse> {
        return ApiClient.getInstance().post<DownloadUrlResponse>(
            `/v1/marketplace/download/${versionId}/`
        );
    }

    async downloadTune(tuneId: string): Promise<string> {
        // Legacy — returns a signed URL string
        const response = await this.getDownloadUrl(tuneId);
        return response.download_url;
    }

    // ─── Version Status ────────────────────────────────────────

    async checkVersionStatus(versionId: string): Promise<VersionStatusResponse> {
        return ApiClient.getInstance().get<VersionStatusResponse>(
            `/v1/marketplace/version-status/${versionId}/`
        );
    }

    // ─── Entitlements ──────────────────────────────────────────

    async getEntitlements(): Promise<Entitlement[]> {
        try {
            const raw = await ApiClient.getInstance().get<RawEntitlement[]>('/v1/marketplace/entitlements/');
            const entitlements = raw.map(mapEntitlement);
            await StorageAdapter.set(CACHE_KEYS.ENTITLEMENTS, entitlements);
            return entitlements;
        } catch (error) {
            console.warn('ApiTuneService: Entitlements fetch failed, trying cache', error);
            const cached = await StorageAdapter.get<Entitlement[]>(CACHE_KEYS.ENTITLEMENTS);
            return cached || [];
        }
    }

    // ─── Verification (Legacy) ─────────────────────────────────

    async verifyTuneIntegrity(tune: Tune): Promise<boolean> {
        return !!tune.signatureBase64 && !!tune.hashSha256;
    }

    async importTune(_tune: Tune): Promise<void> {
        // Placeholder — handled by DownloadService
    }
}
