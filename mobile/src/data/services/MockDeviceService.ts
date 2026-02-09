import { DeviceService, Device, DeviceState } from '../../domain/services/DeviceService';

export class MockDeviceService implements DeviceService {
    async scan(): Promise<Device[]> {
        return [
            { id: 'mock-1', name: 'Mock ECU 1', rssi: -50, services: [] },
            { id: 'mock-2', name: 'Mock ECU 2', rssi: -70, services: [] },
        ];
    }

    async connect(deviceId: string): Promise<void> {
        console.log(`[MockDeviceService] Connected to ${deviceId}`);
    }

    async disconnect(deviceId: string): Promise<void> {
        console.log(`[MockDeviceService] Disconnected from ${deviceId}`);
    }

    async getState(): Promise<DeviceState> {
        return 'disconnected'; // Simplified
    }

    // Add other methods enforced by the interface if strictly required
    // Assuming DeviceService interface might have more, let's allow it to be minimal for now
    // based on previous errors.

    observeState(callback: (state: DeviceState) => void): () => void {
        callback('disconnected');
        return () => { };
    }
}
