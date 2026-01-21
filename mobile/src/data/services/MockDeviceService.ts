import { DeviceService, DiscoveredDevice } from '../../domain/services/DeviceService';

export class MockDeviceService implements DeviceService {
    state: 'PoweredOff' | 'PoweredOn' | 'Unauthorized' | 'Unknown' = 'PoweredOn';
    private scanning = false;

    async initialize(): Promise<void> {
        console.log('MockDeviceService initialized');
        this.state = 'PoweredOn';
    }

    startScan(onDeviceFound: (device: DiscoveredDevice) => void): void {
        console.log('MockDeviceService: Scanning...');
        this.scanning = true;

        // Simulate finding a device after 1s
        setTimeout(() => {
            if (!this.scanning) return;
            onDeviceFound({
                id: 'mock-device-id',
                name: 'RevSync ECU',
                rssi: -65,
                serviceUUIDs: ['0000ffe0-0000-1000-8000-00805f9b34fb'],
                localName: 'RevSync ECU',
            });
        }, 1000);
    }

    stopScan(): void {
        console.log('MockDeviceService: Scan stopped');
        this.scanning = false;
    }

    async connect(deviceId: string): Promise<void> {
        console.log(`MockDeviceService: Connecting to ${deviceId}...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection delay
        console.log('MockDeviceService: Connected');
    }

    async disconnect(deviceId: string): Promise<void> {
        console.log(`MockDeviceService: Disconnected from ${deviceId}`);
    }

    async sendData(deviceId: string, serviceUUID: string, characteristicUUID: string, dataBase64: string): Promise<void> {
        // console.log(`MockDeviceService: Sent data to ${characteristicUUID}`);
    }

    async readData(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<string> {
        return 'bW9ja19kYXRh'; // "mock_data" in base64
    }

    monitorCharacteristic(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        onValueChange: (error: Error | null, value: string | null) => void
    ): { remove: () => void } {
        return { remove: () => { } };
    }
}
