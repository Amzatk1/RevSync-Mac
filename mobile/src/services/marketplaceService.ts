import { ApiClient } from '../data/http/ApiClient';

interface Tune {
    id: string;
    title: string;
    description: string;
    price: number;
    vehicle_make: string;
    vehicle_model: string;
}

export const marketplaceService = {
    /**
     * Get all published tunes.
     */
    async getTunes(params?: { make?: string; model?: string; year?: number }): Promise<Tune[]> {
        try {
            return await ApiClient.getInstance().get<Tune[]>('/marketplace/browse/', { params });
        } catch (error) {
            console.error('Error fetching tunes:', error);
            throw error;
        }
    },

    /**
     * Get a single tune details.
     */
    async getTune(id: string): Promise<Tune> {
        try {
            return await ApiClient.getInstance().get<Tune>(`/marketplace/listing/${id}/`);
        } catch (error) {
            console.error(`Error fetching tune ${id}:`, error);
            throw error;
        }
    },

    /**
     * Purchase a tune.
     */
    async purchaseTune(tuneId: string): Promise<any> {
        try {
            return await ApiClient.getInstance().post(`/marketplace/purchase/${tuneId}/`);
        } catch (error) {
            console.error(`Error purchasing tune ${tuneId}:`, error);
            throw error;
        }
    }
};
