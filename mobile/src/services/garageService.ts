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
    tune?: number;
    version?: string;
    backup?: number;
    vehicle: number;
    status: string;
    progress: number;
    logs?: Array<{ timestamp: string; message: string }>;
    error_message?: string;
    error_code?: string;
    flash_started_at?: string;
    flash_completed_at?: string;
    chunks_sent?: number;
    total_chunks?: number;
    ecu_read_data?: Record<string, unknown>;
    created_at: string;
    tune_detail?: { title?: string; name?: string };
    version_detail?: { version_number?: string };
}

interface EcuBackup {
    id: number;
    vehicle: number;
    storage_key: string;
    checksum: string;
    file_size_kb: number;
    created_at: string;
    notes?: string;
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

    async getVehicleFlashJobs(vehicleId: number | string): Promise<FlashJob[]> {
        try {
            const response = await this.getFlashJobs();
            return response.results.filter((job) => String(job.vehicle) === String(vehicleId));
        } catch {
            return [];
        }
    },

    async createFlashJob(payload: {
        vehicle: number;
        tune?: string | number;
        version?: string;
        backup?: number;
        connection_type: 'BLE' | 'USB';
        device_id: string;
    }): Promise<FlashJob> {
        return ApiClient.getInstance().post<FlashJob>('/v1/garage/flash-jobs/', payload);
    },

    async updateFlashJob(
        id: number | string,
        payload: {
            status?: string;
            progress?: number;
            log_message?: string;
            error_message?: string;
            error_code?: string;
            ecu_read_data?: Record<string, unknown>;
            chunks_sent?: number;
            total_chunks?: number;
        }
    ): Promise<FlashJob> {
        return ApiClient.getInstance().patch<FlashJob>(`/v1/garage/flash-jobs/${id}/`, payload);
    },

    /**
     * Get ECU backups.
     * Backend: GET /api/v1/garage/backups/
     */
    async getBackups(): Promise<PaginatedResponse<EcuBackup>> {
        return ApiClient.getInstance().get<PaginatedResponse<EcuBackup>>('/v1/garage/backups/');
    },

    async getVehicleBackups(vehicleId: number | string): Promise<EcuBackup[]> {
        try {
            const response = await this.getBackups();
            return response.results.filter((backup) => String(backup.vehicle) === String(vehicleId));
        } catch {
            return [];
        }
    },

    async getBackup(id: number | string): Promise<EcuBackup | null> {
        try {
            const response = await this.getBackups();
            return response.results.find((backup) => String(backup.id) === String(id)) || null;
        } catch {
            return null;
        }
    },

    async createBackup(payload: {
        vehicle: number;
        storage_key: string;
        checksum: string;
        file_size_kb: number;
        notes?: string;
    }): Promise<EcuBackup> {
        return ApiClient.getInstance().post<EcuBackup>('/v1/garage/backups/', payload);
    },
};
