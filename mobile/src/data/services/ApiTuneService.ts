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

export class ApiTuneService implements TuneService {
    async getTunes(filter?: TuneFilter, page: number = 1): Promise<Tune[]> {
        try {
            const params: Record<string, string | number | boolean | undefined> = { page };
            if (filter) {
                if (filter.searchQuery) params.q = filter.searchQuery;
                if (filter.compatibleBikeId) params.bike_id = filter.compatibleBikeId;
                if (filter.minStage) params.min_stage = filter.minStage;
                if (filter.onlySafe) params.safe_only = 'true';
            }

            const results = await ApiClient.getInstance().get<Tune[]>('/v1/marketplace/browse/', { params });

            if (!filter || Object.keys(filter).length === 0) {
                await StorageAdapter.set(CACHE_KEYS.TUNES_LIST, results);
            }

            return results;
        } catch (error) {
            console.warn('ApiTuneService: Network failed, trying cache', error);
            const cached = await StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
            if (cached) {
                let results = cached;
                if (filter) {
                    if (filter.searchQuery) {
                        const q = filter.searchQuery.toLowerCase();
                        results = results.filter(t => t.title.toLowerCase().includes(q));
                    }
                    if (filter.compatibleBikeId) {
                        results = results.filter(t => t.bikeId === filter.compatibleBikeId);
                    }
                }
                return results;
            }
            throw error;
        }
    }

    async getTuneDetails(tuneId: string): Promise<Tune | null> {
        try {
            return await ApiClient.getInstance().get<Tune>(`/v1/marketplace/listing/${tuneId}/`);
        } catch (error) {
            console.warn('ApiTuneService: Detail fetch failed', error);
            const cachedList = await StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
            if (cachedList) {
                return cachedList.find(t => t.id === tuneId) || null;
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
        return ApiClient.getInstance().post<{ clientSecret: string; publishableKey: string }>(
            '/payments/create-intent/',
            { listing_id: listingId }
        );
    }

    async checkPurchase(listingId: string): Promise<{ owned: boolean }> {
        return ApiClient.getInstance().get<{ owned: boolean }>(
            `/v1/marketplace/purchase-check/${listingId}/`
        );
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
            const entitlements = await ApiClient.getInstance().get<Entitlement[]>(
                '/v1/marketplace/entitlements/'
            );
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
        // Now delegated to CryptoService + DownloadService pipeline
        // Return true if tune has been verified
        return !!tune.signatureBase64 && !!tune.hashSha256;
    }

    async importTune(_tune: Tune): Promise<void> {
        // Placeholder — handled by DownloadService
    }
}
