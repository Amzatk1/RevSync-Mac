import api from './api';
import { Tune } from '../types/models';

export const marketplaceService = {
    /**
     * Get all published tunes.
     */
    async getTunes(params?: { make?: string; model?: string; year?: number }): Promise<Tune[]> {
        try {
            const response = await api.get<Tune[]>('/marketplace/browse/', { params });
            return response.data;
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
            const response = await api.get<Tune>(`/marketplace/listing/${id}/`);
            return response.data;
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
            const response = await api.post(`/marketplace/purchase/${tuneId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error purchasing tune ${tuneId}:`, error);
            throw error;
        }
    }
};
