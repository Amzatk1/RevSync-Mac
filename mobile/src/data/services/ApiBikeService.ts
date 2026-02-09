import { Bike, BikeService } from '../../domain/services/DomainTypes';
import { ApiClient } from '../http/ApiClient';
import { StorageAdapter } from './StorageAdapter';

const ACTIVE_BIKE_KEY = 'active_bike_id';
const CACHE_KEYS = {
    BIKES_LIST: 'bikes_list_cache',
};

export class ApiBikeService implements BikeService {
    async getBikes(): Promise<Bike[]> {
        try {
            const bikes = await ApiClient.getInstance().get<Bike[]>('/garage/vehicles/');
            await StorageAdapter.set(CACHE_KEYS.BIKES_LIST, bikes);
            return bikes;
        } catch (error) {
            console.warn('ApiBikeService: Network failed, using cache', error);
            const cached = await StorageAdapter.get<Bike[]>(CACHE_KEYS.BIKES_LIST);
            if (cached) return cached;
            throw error;
        }
    }

    async getActiveBike(): Promise<Bike | null> {
        const id = await StorageAdapter.getString(ACTIVE_BIKE_KEY);
        if (!id) return null;

        const bikes = await this.getBikes();
        return bikes.find(b => b.id === id) || null;
    }

    async setActiveBike(bikeId: string): Promise<void> {
        await StorageAdapter.setString(ACTIVE_BIKE_KEY, bikeId);
    }

    async addBike(bike: Omit<Bike, 'id'>): Promise<Bike> {
        const newBike = await ApiClient.getInstance().post<Bike>('/garage/vehicles/', bike);
        // Refresh cache
        await this.getBikes();
        return newBike;
    }

    async updateBike(bike: Bike): Promise<Bike> {
        const updated = await ApiClient.getInstance().put<Bike>(`/garage/vehicles/${bike.id}/`, bike); // Assuming backend supports PUT
        // Refresh cache
        await this.getBikes();
        return updated;
    }
}
