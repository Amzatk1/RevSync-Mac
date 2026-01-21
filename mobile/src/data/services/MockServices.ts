import { Bike, BikeService, Tune, TuneService, TuneFilter } from '../../domain/services/DomainTypes';

export class MockBikeService implements BikeService {
    private bikes: Bike[] = [
        { id: '1', make: 'Yamaha', model: 'MT-07', year: 2021, ecuId: 'Denso-SH7058', name: 'My Yamaha MT-07' }
    ];
    private activeBikeId: string | null = '1';

    async getBikes(): Promise<Bike[]> {
        return this.bikes;
    }

    async addBike(bike: Omit<Bike, 'id'>): Promise<Bike> {
        const newBike = { ...bike, id: Math.random().toString() };
        this.bikes.push(newBike);
        return newBike;
    }

    async updateBike(bike: Bike): Promise<Bike> {
        const index = this.bikes.findIndex(b => b.id === bike.id);
        if (index === -1) throw new Error("Bike not found");
        this.bikes[index] = bike;
        return bike;
    }

    async setActiveBike(bikeId: string): Promise<void> {
        this.activeBikeId = bikeId;
    }

    async getActiveBike(): Promise<Bike | null> {
        return this.bikes.find(b => b.id === this.activeBikeId) || null;
    }
}

export class MockTuneService implements TuneService {
    private tunes: Tune[] = [
        {
            id: 't1',
            name: 'Stage 1 Street',
            bikeId: '1',
            version: '1.0.2',
            price: 199,
            description: 'Smoother throttle, +5HP',
            safetyRating: 95,
            compatibilityRaw: ['Denso-SH7058'],
            stage: 1,
            checksum: 'abc12345',
        }
    ];

    async getTunes(filter?: TuneFilter, page?: number): Promise<Tune[]> {
        return this.tunes;
    }

    async getTuneDetails(tuneId: string): Promise<Tune | null> {
        return this.tunes.find(t => t.id === tuneId) || null;
    }

    async getRecommendTunes(bikeId: string): Promise<Tune[]> {
        return this.tunes.filter(t => t.bikeId === bikeId);
    }

    // Legacy / Unused in Mock
    async getTunesForBike(bikeId: string): Promise<Tune[]> { return []; }
    async purchaseTune(tuneId: string): Promise<void> { }
    async downloadTune(tuneId: string): Promise<string> { return ''; }
    async verifyTuneIntegrity(tune: Tune): Promise<boolean> { return true; }
    async importTune(tune: Tune): Promise<void> {
        this.tunes.push(tune);
    }
}
