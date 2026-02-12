import { BleManager, Device, State } from 'react-native-ble-plx';
import { DeviceService, DiscoveredDevice } from '../../domain/services/DeviceService';
import { Platform, PermissionsAndroid } from 'react-native';

export class BleDeviceService implements DeviceService {
    private manager: BleManager;
    state: 'PoweredOff' | 'PoweredOn' | 'Unauthorized' | 'Unknown' = 'Unknown';

    constructor() {
        this.manager = new BleManager();
    }

    async initialize(): Promise<void> {
        if (Platform.OS === 'android') {
            await this.requestAndroidPermissions();
        }

        // Check initial state
        const state = await this.manager.state();
        this.mapState(state);

        // Monitor state changes
        this.manager.onStateChange((newState) => {
            this.mapState(newState);
        }, true);
    }

    private mapState(state: State) {
        if (state === State.PoweredOn) this.state = 'PoweredOn';
        else if (state === State.PoweredOff) this.state = 'PoweredOff';
        else if (state === State.Unauthorized) this.state = 'Unauthorized';
        else this.state = 'Unknown';
    }

    private async requestAndroidPermissions() {
        if (Number(Platform.Version) >= 31) {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
        } else {
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
        }
    }

    startScan(onDeviceFound: (device: DiscoveredDevice) => void): void {
        if (this.state !== 'PoweredOn') {
            console.warn('Bluetooth is not powered on');
            return;
        }

        this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
            if (error) {
                console.error('Scan error:', error);
                return;
            }

            if (device) {
                onDeviceFound({
                    id: device.id,
                    name: device.name,
                    rssi: device.rssi ?? -100,
                    serviceUUIDs: device.serviceUUIDs,
                    localName: device.localName,
                });
            }
        });
    }

    stopScan(): void {
        this.manager.stopDeviceScan();
    }

    async connect(deviceId: string): Promise<void> {
        try {
            this.stopScan();
            const device = await this.manager.connectToDevice(deviceId);
            await device.discoverAllServicesAndCharacteristics();

            // Negotiate MTU for Android to maximize throughput
            if (Platform.OS === 'android') {
                await device.requestMTU(512);
            }
        } catch (error) {
            throw new Error(`Connection failed: ${error}`);
        }
    }

    async disconnect(deviceId: string): Promise<void> {
        await this.manager.cancelDeviceConnection(deviceId);
    }

    async sendData(deviceId: string, serviceUUID: string, characteristicUUID: string, dataBase64: string): Promise<void> {
        // Write without response for speed, or with response for reliability. 
        // For flashing, 'writeWithResponse' is safer to ensure ACKs at BLE layer.
        await this.manager.writeCharacteristicWithResponseForDevice(
            deviceId,
            serviceUUID,
            characteristicUUID,
            dataBase64
        );
    }

    async readData(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<string> {
        const char = await this.manager.readCharacteristicForDevice(
            deviceId,
            serviceUUID,
            characteristicUUID
        );
        return char.value ?? '';
    }

    monitorCharacteristic(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        onValueChange: (error: Error | null, value: string | null) => void
    ): { remove: () => void } {
        const subscription = this.manager.monitorCharacteristicForDevice(
            deviceId,
            serviceUUID,
            characteristicUUID,
            (error, characteristic) => {
                if (error) {
                    onValueChange(error, null);
                } else {
                    onValueChange(null, characteristic?.value ?? null);
                }
            }
        );

        return { remove: () => subscription.remove() };
    }
}
