import { Bike, BikeService } from '../../domain/services/DomainTypes';
import { StorageAdapter } from './StorageAdapter';
import { ApiClient } from '../http/ApiClient';

const BIKES_LIST_KEY = 'bikes_list';
const ACTIVE_BIKE_KEY = 'active_bike_id';

const isOfflineLikeError = (error: any) =>
    error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT';

/**
 * Bike service with backend sync + local fallback.
 *
 * Strategy:
 *  - getBikes: try backend GET /v1/garage/, cache locally, fallback to AsyncStorage
 *  - addBike: try backend POST /v1/garage/, save locally too
 *  - setActiveBike: local-only (UI concern, not persisted server-side)
 */
export class ApiBikeService implements BikeService {
    private async fetchAllVehicles(): Promise<any[]> {
        const firstPage = await ApiClient.getInstance().get<{ results?: any[]; next?: string | null } | any[]>('/v1/garage/', {
            params: { page: 1 },
        });

        if (Array.isArray(firstPage)) {
            return firstPage;
        }

        const vehicles = [...(firstPage.results || [])];
        let page = 2;
        let next = firstPage.next;

        while (next) {
            const response = await ApiClient.getInstance().get<{ results?: any[]; next?: string | null }>('/v1/garage/', {
                params: { page },
            });
            vehicles.push(...(response.results || []));
            next = response.next;
            page += 1;
        }

        return vehicles;
    }

    async getBikes(): Promise<Bike[]> {
        // Try backend first
        try {
            const vehicles = await this.fetchAllVehicles();

            const bikes: Bike[] = vehicles.map((v: any) => ({
                id: String(v.id),
                make: v.make,
                model: v.model,
                year: v.year,
                vin: v.vin || undefined,
                ecuId: v.ecu_id || undefined,
                name: v.name || `${v.year} ${v.make} ${v.model}`,
            }));

            // Cache locally for offline use
            await StorageAdapter.set(BIKES_LIST_KEY, bikes);
            return bikes;
        } catch (e) {
            console.warn('ApiBikeService: Backend fetch failed, using local cache', e);
        }

        // Fallback: local cache
        const cached = await StorageAdapter.get<Bike[]>(BIKES_LIST_KEY);
        return cached || [];
    }

    async getActiveBike(): Promise<Bike | null> {
        const activeId = await StorageAdapter.getString(ACTIVE_BIKE_KEY);
        if (!activeId) return null;

        const bikes = await this.getBikes();
        return bikes.find(b => b.id === activeId) || null;
    }

    async setActiveBike(bikeId: string): Promise<void> {
        await StorageAdapter.setString(ACTIVE_BIKE_KEY, bikeId);
    }

    async addBike(bike: Omit<Bike, 'id'>): Promise<Bike> {
        // Try backend first
        try {
            const response = await ApiClient.getInstance().post<any>('/v1/garage/', {
                name: bike.name || `${bike.year} ${bike.make} ${bike.model}`,
                make: bike.make,
                model: bike.model,
                year: bike.year,
                vin: bike.vin || '',
                ecu_id: bike.ecuId || '',
                vehicle_type: 'BIKE',
            });

            const newBike: Bike = {
                id: String(response.id),
                make: response.make,
                model: response.model,
                year: response.year,
                vin: response.vin || undefined,
                ecuId: response.ecu_id || undefined,
                name: response.name,
            };

            // Also save locally
            const bikes = await StorageAdapter.get<Bike[]>(BIKES_LIST_KEY) || [];
            await StorageAdapter.set(BIKES_LIST_KEY, [...bikes, newBike]);
            console.log('ApiBikeService: Bike saved to backend + local', newBike);
            return newBike;
        } catch (e) {
            if (!isOfflineLikeError(e)) {
                throw e;
            }
            console.warn('ApiBikeService: Backend unavailable, saving locally for offline continuity', e);
        }

        // Fallback: local-only for offline continuity
        const id = 'bike_' + Math.random().toString(36).substring(2, 11);
        const newBike: Bike = { ...bike, id };
        const bikes = await StorageAdapter.get<Bike[]>(BIKES_LIST_KEY) || [];
        await StorageAdapter.set(BIKES_LIST_KEY, [...bikes, newBike]);
        console.log('ApiBikeService: Bike saved locally', newBike);
        return newBike;
    }

    async updateBike(bike: Bike): Promise<Bike> {
        // Try backend first
        try {
            const response = await ApiClient.getInstance().patch<any>(`/v1/garage/${bike.id}/`, {
                name: bike.name,
                make: bike.make,
                model: bike.model,
                year: bike.year,
                vin: bike.vin || '',
                ecu_id: bike.ecuId || '',
            });
            console.log('ApiBikeService: Bike updated on backend', response);
        } catch (e) {
            if (!isOfflineLikeError(e)) {
                throw e;
            }
            console.warn('ApiBikeService: Backend unavailable, updating local cache only', e);
        }

        // Update local cache
        const bikes = await StorageAdapter.get<Bike[]>(BIKES_LIST_KEY) || [];
        const updatedList = bikes.map(b => b.id === bike.id ? bike : b);
        await StorageAdapter.set(BIKES_LIST_KEY, updatedList);
        return bike;
    }
}
