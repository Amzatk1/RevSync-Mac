import { ApiClient } from '../data/http/ApiClient';

interface Vehicle {
    id: number;
    make: string;
    model: string;
    year: number;
    vin?: string;
    nickname?: string;
}

interface VehicleDefinition {
    id: number;
    make: string;
    model: string;
    year_start: number;
    year_end: number;
}

export const garageService = {
    /**
     * Get all vehicles for the current user.
     */
    async getVehicles(): Promise<Vehicle[]> {
        try {
            return await ApiClient.getInstance().get<Vehicle[]>('/garage/vehicles/');
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            throw error;
        }
    },

    /**
     * Get a single vehicle by ID.
     */
    async getVehicle(id: number): Promise<Vehicle> {
        try {
            return await ApiClient.getInstance().get<Vehicle>(`/garage/vehicles/${id}/`);
        } catch (error) {
            console.error(`Error fetching vehicle ${id}:`, error);
            throw error;
        }
    },

    /**
     * Add a new vehicle to the garage.
     */
    async addVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
        try {
            return await ApiClient.getInstance().post<Vehicle>('/garage/vehicles/', vehicleData);
        } catch (error) {
            console.error('Error adding vehicle:', error);
            throw error;
        }
    },

    /**
     * Update an existing vehicle.
     */
    async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle> {
        try {
            return await ApiClient.getInstance().put<Vehicle>(`/garage/vehicles/${id}/`, updates);
        } catch (error) {
            console.error(`Error updating vehicle ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a vehicle.
     */
    async deleteVehicle(id: number): Promise<void> {
        try {
            await ApiClient.getInstance().delete(`/garage/vehicles/${id}/`);
        } catch (error) {
            console.error(`Error deleting vehicle ${id}:`, error);
            throw error;
        }
    },

    /**
     * Search for vehicle definitions (database of all supported bikes).
     */
    async searchVehicleDefinitions(query: string): Promise<VehicleDefinition[]> {
        try {
            return await ApiClient.getInstance().get<VehicleDefinition[]>('/garage/definitions/', {
                params: { search: query }
            });
        } catch (error) {
            console.error('Error searching definitions:', error);
            return [];
        }
    }
};
