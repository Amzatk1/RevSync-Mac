// BLE scanning uses listener/callback pattern for simplicity

export interface DiscoveredDevice {
    id: string;
    name: string | null;
    rssi: number;
    serviceUUIDs: string[] | null;
    localName: string | null;
}

export interface DeviceService {
    state: 'PoweredOff' | 'PoweredOn' | 'Unauthorized' | 'Unknown';

    initialize(): Promise<void>;

    startScan(onDeviceFound: (device: DiscoveredDevice) => void): void;
    stopScan(): void;

    connect(deviceId: string): Promise<void>;
    disconnect(deviceId: string): Promise<void>;

    // Core ECU communication primitives
    sendData(deviceId: string, serviceUUID: string, characteristicUUID: string, dataBase64: string): Promise<void>;
    readData(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<string>;

    // Monitoring
    monitorCharacteristic(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        onValueChange: (error: Error | null, value: string | null) => void
    ): { remove: () => void };
}
