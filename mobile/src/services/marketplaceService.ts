import { ApiClient } from '../data/http/ApiClient';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

interface Tune {
    id: string;
    name: string;
    description: string;
    price: string;
    stage: number;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year_start: number;
    vehicle_year_end: number;
    horsepower_gain: string | null;
    torque_gain: string | null;
    creator?: {
        business_name: string;
        is_verified_business: boolean;
    };
    status: string;
    safety_rating: number;
}

/**
 * Standalone marketplace service (used by screens that don't go through ServiceLocator).
 * All endpoints match the Django backend exactly.
 */
export const marketplaceService = {
    /**
     * Browse published tunes (public marketplace).
     * Backend: GET /api/v1/marketplace/browse/
     */
    async getTunes(params?: {
        search?: string;
        make?: string;
        model?: string;
        year?: number;
        stage?: number;
        page?: number;
    }): Promise<PaginatedResponse<Tune>> {
        return ApiClient.getInstance().get<PaginatedResponse<Tune>>(
            '/v1/marketplace/browse/',
            { params }
        );
    },

    /**
     * Get a single tune/listing detail.
     * Backend: GET /api/v1/marketplace/listing/<uuid>/
     */
    async getTune(id: string): Promise<Tune> {
        return ApiClient.getInstance().get<Tune>(`/v1/marketplace/listing/${id}/`);
    },

    /**
     * Check if user already owns a listing.
     * Backend: GET /api/v1/marketplace/purchase-check/<uuid>/
     */
    async checkPurchase(listingId: string): Promise<{ owned: boolean }> {
        return ApiClient.getInstance().get<{ owned: boolean }>(
            `/v1/marketplace/purchase-check/${listingId}/`
        );
    },

    /**
     * Get user's entitlements (purchased tunes).
     * Backend: GET /api/v1/marketplace/entitlements/
     */
    async getEntitlements(): Promise<any[]> {
        return ApiClient.getInstance().get<any[]>('/v1/marketplace/entitlements/');
    },

    /**
     * Get a signed download URL for a version.
     * Backend: POST /api/v1/marketplace/download/<uuid>/
     */
    async getDownloadUrl(versionId: string): Promise<{ download_url: string }> {
        return ApiClient.getInstance().post<{ download_url: string }>(
            `/v1/marketplace/download/${versionId}/`
        );
    },
};
