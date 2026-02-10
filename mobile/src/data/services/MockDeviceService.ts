import { DeviceService, DiscoveredDevice } from '../../domain/services/DeviceService';

const MOCK_DEVICES: DiscoveredDevice[] = [
    {
        id: 'mock-1',
        name: 'RevSync Mock ECU 1',
        rssi: -50,
        serviceUUIDs: ['0000180A-0000-1000-8000-00805F9B34FB'],
        localName: 'MockECU-1',
    },
    {
        id: 'mock-2',
        name: 'RevSync Mock ECU 2',
        rssi: -68,
        serviceUUIDs: ['0000180A-0000-1000-8000-00805F9B34FB'],
        localName: 'MockECU-2',
    },
];

export class MockDeviceService implements DeviceService {
    state: 'PoweredOff' | 'PoweredOn' | 'Unauthorized' | 'Unknown' = 'PoweredOn';

    private scanTimers: ReturnType<typeof setTimeout>[] = [];

    async initialize(): Promise<void> {
        this.state = 'PoweredOn';
    }

    startScan(onDeviceFound: (device: DiscoveredDevice) => void): void {
        this.stopScan();

        MOCK_DEVICES.forEach((device, index) => {
            const timer = setTimeout(() => onDeviceFound(device), 350 * (index + 1));
            this.scanTimers.push(timer);
        });
    }

    stopScan(): void {
        this.scanTimers.forEach(clearTimeout);
        this.scanTimers = [];
    }

    async connect(deviceId: string): Promise<void> {
        console.log(`[MockDeviceService] Connected to ${deviceId}`);
    }

    async disconnect(deviceId: string): Promise<void> {
        console.log(`[MockDeviceService] Disconnected from ${deviceId}`);
    }

    async sendData(deviceId: string, serviceUUID: string, characteristicUUID: string, dataBase64: string): Promise<void> {
        console.log('[MockDeviceService] sendData', { deviceId, serviceUUID, characteristicUUID, size: dataBase64.length });
    }

    async readData(_deviceId: string, _serviceUUID: string, _characteristicUUID: string): Promise<string> {
        return '';
    }

    monitorCharacteristic(
        _deviceId: string,
        _serviceUUID: string,
        _characteristicUUID: string,
        onValueChange: (error: Error | null, value: string | null) => void
    ): { remove: () => void } {
        const timer = setTimeout(() => onValueChange(null, ''), 500);
        return {
            remove: () => clearTimeout(timer),
        };
    }
}
