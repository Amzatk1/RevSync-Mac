import { Tune, TuneFilter, TuneService } from '../../domain/services/DomainTypes';
import { StorageAdapter } from './StorageAdapter';
import { ApiClient } from '../http/ApiClient';

const CACHE_KEYS = {
    TUNES_LIST: 'tunes_list_cache',
};

export class ApiTuneService implements TuneService {
    async getTunes(filter?: TuneFilter, page: number = 1): Promise<Tune[]> {
        try {
            // Build query params
            const params: Record<string, string | number | boolean | undefined> = { page };
            if (filter) {
                if (filter.searchQuery) params.q = filter.searchQuery;
                if (filter.compatibleBikeId) params.bike_id = filter.compatibleBikeId;
                if (filter.minStage) params.min_stage = filter.minStage;
                if (filter.onlySafe) params.safe_only = 'true';
            }

            const results = await ApiClient.getInstance().get<Tune[]>('/marketplace/tunes/', { params });

            // Cache successful result (only cache unfiltered results)
            if (!filter || Object.keys(filter).length === 0) {
                await StorageAdapter.set(CACHE_KEYS.TUNES_LIST, results);
            }

            return results;
        } catch (error) {
            console.warn('ApiTuneService: Network failed, trying cache', error);

            // Fallback to cache
            const cached = await StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
            if (cached) {
                let results = cached;
                // Simple client-side filtering for offline cache
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
            return await ApiClient.getInstance().get<Tune>(`/marketplace/tunes/${tuneId}/`);
        } catch (error) {
            console.warn('ApiTuneService: Detail fetch failed', error);
            // Try find in list cache
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

    async purchaseTune(tuneId: string): Promise<void> {
        await ApiClient.getInstance().post('/payments/create-intent/', { listing_id: tuneId });
    }

    async downloadTune(tuneId: string): Promise<string> {
        // In real app, this would get a signed URL and then download file using RN FS
        const response = await ApiClient.getInstance().get<{ download_url: string }>(`/marketplace/tunes/${tuneId}/download/`);
        return response.download_url;
    }

    async verifyTuneIntegrity(tune: Tune): Promise<boolean> {
        // Real logic: hash file and compare with tune.checksum
        return true;
    }

    async importTune(tune: Tune): Promise<void> {
        // Placeholder for local import
    }
}
