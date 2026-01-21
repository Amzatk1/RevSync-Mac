import { Tune, TuneFilter, TuneService } from '../../domain/services/DomainTypes';

// Mock Data for "Production-Like" Feel
const MOCK_TUNES: Tune[] = [
    {
        id: 't1',
        name: 'Stage 1 Street',
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
        name: 'Stage 2 Track',
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
        name: 'Eco Commuter',
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
        name: 'Stage 3 Race (Big Turbo)',
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

export class ApiTuneService implements TuneService {
    async getTunes(filter?: TuneFilter, page: number = 1): Promise<Tune[]> {
        await this.delay(600);

        let results = MOCK_TUNES;

        if (filter) {
            if (filter.searchQuery) {
                const q = filter.searchQuery.toLowerCase();
                results = results.filter(t => t.name.toLowerCase().includes(q));
            }
            if (filter.compatibleBikeId) {
                results = results.filter(t => t.bikeId === filter.compatibleBikeId);
            }
            if (filter.minStage !== undefined) {
                results = results.filter(t => t.stage >= filter.minStage!);
            }
            if (filter.onlySafe) {
                results = results.filter(t => t.safetyRating >= 85);
            }
        }

        return results;
    }

    async getTuneDetails(tuneId: string): Promise<Tune | null> {
        await this.delay(300);
        return MOCK_TUNES.find(t => t.id === tuneId) || null;
    }

    async getRecommendTunes(bikeId: string): Promise<Tune[]> {
        await this.delay(500);
        return MOCK_TUNES.filter(t => t.bikeId === bikeId && t.safetyRating > 90);
    }

    // Stub implementations for full interface compliance
    async getTunesForBike(bikeId: string): Promise<Tune[]> {
        return this.getRecommendTunes(bikeId);
    }

    async purchaseTune(tuneId: string): Promise<void> {
        await this.delay(1000);
        console.log(`Purchased tune ${tuneId}`);
    }

    async downloadTune(tuneId: string): Promise<string> {
        await this.delay(2000);
        return `/local/path/to/${tuneId}.bin`;
    }

    async verifyTuneIntegrity(tune: Tune): Promise<boolean> {
        await this.delay(500);
        return true;
    }

    async importTune(tune: Tune): Promise<void> {
        await this.delay(300);
        MOCK_TUNES.push(tune);
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
