import { ApiClient } from '../data/http/ApiClient';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

interface Vehicle {
    id: number;
    name: string;
    make: string;
    model: string;
    year: number;
    vin?: string;
    ecu_type?: string;
    ecu_id?: string;
    vehicle_type: string;
}

interface VehicleDefinition {
    id: number;
    make: string;
    model: string;
    year_start: number;
    year_end: number;
}

interface FlashJob {
    id: number;
    tune: number;
    vehicle: number;
    status: string;
    progress: number;
    created_at: string;
    tune_detail?: { name: string };
}

/**
 * Standalone garage service.
 * All endpoints match the Django backend: /api/v1/garage/...
 */
export const garageService = {
    /**
     * Get all vehicles for the current user.
     * Backend: GET /api/v1/garage/
     */
    async getVehicles(): Promise<PaginatedResponse<Vehicle>> {
        return ApiClient.getInstance().get<PaginatedResponse<Vehicle>>('/v1/garage/');
    },

    /**
     * Get a single vehicle by ID.
     * Backend: GET /api/v1/garage/<id>/
     */
    async getVehicle(id: number): Promise<Vehicle> {
        return ApiClient.getInstance().get<Vehicle>(`/v1/garage/${id}/`);
    },

    /**
     * Add a new vehicle to the garage.
     * Backend: POST /api/v1/garage/
     */
    async addVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
        return ApiClient.getInstance().post<Vehicle>('/v1/garage/', vehicleData);
    },

    /**
     * Update an existing vehicle.
     * Backend: PATCH /api/v1/garage/<id>/
     */
    async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle> {
        return ApiClient.getInstance().patch<Vehicle>(`/v1/garage/${id}/`, updates);
    },

    /**
     * Delete a vehicle.
     * Backend: DELETE /api/v1/garage/<id>/
     */
    async deleteVehicle(id: number): Promise<void> {
        await ApiClient.getInstance().delete(`/v1/garage/${id}/`);
    },

    /**
     * Search for vehicle definitions (database of all supported bikes).
     * Backend: GET /api/v1/garage/definitions/?search=<query>
     */
    async searchVehicleDefinitions(query: string): Promise<VehicleDefinition[]> {
        try {
            const res = await ApiClient.getInstance().get<PaginatedResponse<VehicleDefinition>>(
                '/v1/garage/definitions/',
                { params: { search: query } }
            );
            return res.results;
        } catch {
            return [];
        }
    },

    /**
     * Get flash jobs history.
     * Backend: GET /api/v1/garage/flash-jobs/
     */
    async getFlashJobs(): Promise<PaginatedResponse<FlashJob>> {
        return ApiClient.getInstance().get<PaginatedResponse<FlashJob>>('/v1/garage/flash-jobs/');
    },

    /**
     * Get ECU backups.
     * Backend: GET /api/v1/garage/backups/
     */
    async getBackups(): Promise<PaginatedResponse<any>> {
        return ApiClient.getInstance().get<PaginatedResponse<any>>('/v1/garage/backups/');
    },
};
