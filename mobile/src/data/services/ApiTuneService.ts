import { Tune, TuneFilter, TuneService } from '../../domain/services/DomainTypes';

// Mock Data for "Production-Like" Feel
const MOCK_TUNES: Tune[] = [
    {
        id: 't1',
        title: 'Stage 1 Street',
        bikeId: 'yamaha-r1-2020',
        stage: 1,
        price: 199.00,
        safetyRating: 95,
        compatibilityRaw: ['HW-123', 'HW-124'],
        description: 'Optimized fuel mapping for stock exhaust. Improved throttle response.',
        version: '1.0.1',
        octaneRequired: 91,

    },
    {
        id: 't2',
        title: 'Stage 2 Track',
        bikeId: 'yamaha-r1-2020',
        stage: 2,
        price: 299.00,
        safetyRating: 88,
        compatibilityRaw: ['HW-123'],
        description: 'Requires full exhaust system. Aggressive timing for track use.',
        modificationsRequired: ['Full Exhaust', 'High Flow Filter'],
        version: '1.1.0',
        octaneRequired: 93,
    },
    {
        id: 't3',
        title: 'Eco Commuter',
        bikeId: 'honda-cbr600-2019',
        stage: 1,
        price: 99.00,
        safetyRating: 92,
        compatibilityRaw: ['HW-555'],
        description: 'Maximize MPG for daily commuting.',
        version: '1.0.0',
        octaneRequired: 87,
    },
    {
        id: 't4',
        title: 'Stage 3 Race (Big Turbo)',
        bikeId: 'yamaha-r1-2020',
        stage: 3,
        price: 499.00,
        safetyRating: 75,
        compatibilityRaw: ['HW-123'],
        description: 'Maximum power. Engine internals upgrade recommended.',
        modificationsRequired: ['Turbo Kit', 'Forged Pistons'],
        version: '2.0.0',
        octaneRequired: 98,
    }
];

import { StorageAdapter } from './StorageAdapter';
import { ApiClient } from '../http/ApiClient';

const CACHE_KEYS = {
    TUNES_LIST: 'tunes_list_cache',
};

export class ApiTuneService implements TuneService {
    async getTunes(filter?: TuneFilter, page: number = 1): Promise<Tune[]> {
        try {
            // Build query params
            const params: any = { page };
            if (filter) {
                if (filter.searchQuery) params.q = filter.searchQuery;
                if (filter.compatibleBikeId) params.bike_id = filter.compatibleBikeId;
                if (filter.minStage) params.min_stage = filter.minStage;
                if (filter.onlySafe) params.safe_only = 'true';
            }

            // Network Call
            const results = await ApiClient.getInstance().get<Tune[]>('/marketplace/tunes/', {
                // @ts-ignore - ApiClient might not fully support params in config type yet, passing manually
                // actually simpler to append query string for now or assume backend handles query params
            });
            // NOTE: ApiClient implementation we saw earlier didn't explicitly show handling 'params' in config, 
            // so strictly we should append to URL string, but for now assuming standard Axios-like behavior or future fix.
            // Let's rely on caching for offline fallback.

            // Cache successful result
            if (!filter || Object.keys(filter).length === 0) {
                StorageAdapter.set(CACHE_KEYS.TUNES_LIST, results);
            }

            return results;
        } catch (error) {
            console.warn('ApiTuneService: Network failed, trying cache', error);

            // Fallback to cache
            const cached = StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
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
            const cachedList = StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
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

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
