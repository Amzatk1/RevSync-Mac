import api from './api';
import { Vehicle, VehicleDefinition } from '../types/models';

export const garageService = {
    /**
     * Get all vehicles for the current user.
     */
    async getVehicles(): Promise<Vehicle[]> {
        try {
            const response = await api.get<Vehicle[]>('/garage/');
            return response.data;
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
            const response = await api.get<Vehicle>(`/garage/${id}/`);
            return response.data;
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
            const response = await api.post<Vehicle>('/garage/', vehicleData);
            return response.data;
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
            const response = await api.patch<Vehicle>(`/garage/${id}/`, updates);
            return response.data;
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
            await api.delete(`/garage/${id}/`);
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
            const response = await api.get<VehicleDefinition[]>('/garage/definitions/', {
                params: { search: query }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching definitions:', error);
            return [];
        }
    }
};
