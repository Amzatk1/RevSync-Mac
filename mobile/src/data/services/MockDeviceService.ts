import { DeviceService, DiscoveredDevice } from '../../domain/services/DeviceService';
import { Buffer } from 'buffer';

// ─── Protocol Constants (mirror StandardECUService) ────────────
const CMD = {
    IDENTIFY: 0x01,
    ENTER_BOOTLOADER: 0x10,
    EXIT_BOOTLOADER: 0x11,
    ERASE_SECTOR: 0x20,
    WRITE_CHUNK: 0x30,
    WRITE_CHUNK_ACK: 0x31,
    WRITE_CHUNK_NAK: 0x32,
    READ_MEMORY: 0x40,
    READ_CHECKSUM: 0x50,
    CLEAR_DTC: 0x60,
    VERIFY_COMPLETE: 0x70,
} as const;

/**
 * MockDeviceService — full protocol simulation for dev/testing in Expo Go.
 *
 * Tracks the last command sent via `sendData` so that `monitorCharacteristic`
 * and `readData` return contextually-correct responses (bootloader ACK,
 * chunk ACK, checksum, DTC clear, etc.).
 */
export class MockDeviceService implements DeviceService {
    state: 'PoweredOff' | 'PoweredOn' | 'Unauthorized' | 'Unknown' = 'PoweredOn';

    /** Tracks the most recent command opcode written to the command characteristic. */
    private lastCommandOpcode: number = 0x00;
    /** Tracks whether we are in simulated bootloader mode. */
    private inBootloader = false;
    /** A fixed SHA-256 hash returned by the mock ECU for verification. */
    private readonly mockHash =
        '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

    // ─── Lifecycle ─────────────────────────────────────────────

    async initialize(): Promise<void> {
        console.log('[MockDeviceService] Initialized');
    }

    // ─── Scanning ──────────────────────────────────────────────

    startScan(onDeviceFound: (device: DiscoveredDevice) => void): void {
        console.log('[MockDeviceService] Starting scan...');
        setTimeout(() => {
            onDeviceFound({
                id: 'mock-ecu-1',
                name: 'RevSync ECU',
                rssi: -50,
                serviceUUIDs: ['0000fff0-0000-1000-8000-00805f9b34fb'],
                localName: 'RevSync-ECU-1',
            });
        }, 500);
        setTimeout(() => {
            onDeviceFound({
                id: 'mock-ecu-2',
                name: 'RevSync ECU (2)',
                rssi: -70,
                serviceUUIDs: ['0000fff0-0000-1000-8000-00805f9b34fb'],
                localName: 'RevSync-ECU-2',
            });
        }, 1200);
    }

    stopScan(): void {
        console.log('[MockDeviceService] Stopped scan');
    }

    // ─── Connection ────────────────────────────────────────────

    async connect(deviceId: string): Promise<void> {
        console.log(`[MockDeviceService] Connected to ${deviceId}`);
    }

    async disconnect(deviceId: string): Promise<void> {
        this.inBootloader = false;
        console.log(`[MockDeviceService] Disconnected from ${deviceId}`);
    }

    // ─── Data ──────────────────────────────────────────────────

    async sendData(
        _deviceId: string,
        _serviceUUID: string,
        characteristicUUID: string,
        dataBase64: string,
    ): Promise<void> {
        const bytes = new Uint8Array(Buffer.from(dataBase64, 'base64'));
        if (bytes.length > 0) {
            this.lastCommandOpcode = bytes[0];

            // Track bootloader state
            if (bytes[0] === CMD.ENTER_BOOTLOADER) this.inBootloader = true;
            if (bytes[0] === CMD.EXIT_BOOTLOADER) this.inBootloader = false;
        }
        // Simulate BLE write latency
        await new Promise(r => setTimeout(r, 3));
    }

    async readData(
        _deviceId: string,
        _serviceUUID: string,
        _characteristicUUID: string,
    ): Promise<string> {
        const opcode = this.lastCommandOpcode;

        // ─── IDENTIFY response ─────────────────────────────
        if (opcode === CMD.IDENTIFY) {
            return this.buildIdentifyResponse();
        }

        // ─── READ_CHECKSUM response ────────────────────────
        if (opcode === CMD.READ_CHECKSUM) {
            return this.buildChecksumResponse();
        }

        // ─── READ_MEMORY response ──────────────────────────
        if (opcode === CMD.READ_MEMORY) {
            return this.buildMemoryReadResponse();
        }

        // Default: generic OK
        return Buffer.from([0x00]).toString('base64');
    }

    // ─── Monitoring (ACK/NAK) ──────────────────────────────────

    monitorCharacteristic(
        _deviceId: string,
        _serviceUUID: string,
        _characteristicUUID: string,
        onValueChange: (error: Error | null, value: string | null) => void,
    ): { remove: () => void } {
        let cancelled = false;

        // Determine the correct ACK response based on last command
        const delayMs = this.lastCommandOpcode === CMD.ENTER_BOOTLOADER ? 50 : 15;

        const timer = setTimeout(() => {
            if (cancelled) return;

            let responseOpcode: number;

            switch (this.lastCommandOpcode) {
                case CMD.ENTER_BOOTLOADER:
                    responseOpcode = CMD.WRITE_CHUNK_ACK; // Bootloader ready ACK
                    break;
                case CMD.WRITE_CHUNK:
                    responseOpcode = CMD.WRITE_CHUNK_ACK; // Chunk accepted
                    break;
                case CMD.VERIFY_COMPLETE:
                    responseOpcode = CMD.WRITE_CHUNK_ACK; // Verify OK ACK
                    break;
                case CMD.CLEAR_DTC:
                    responseOpcode = CMD.WRITE_CHUNK_ACK; // DTC clear ACK
                    break;
                case CMD.EXIT_BOOTLOADER:
                    responseOpcode = CMD.WRITE_CHUNK_ACK; // Exit bootloader ACK
                    break;
                default:
                    responseOpcode = CMD.WRITE_CHUNK_ACK; // Generic ACK
                    break;
            }

            const ackByte = Buffer.from([responseOpcode]);
            onValueChange(null, ackByte.toString('base64'));
        }, delayMs);

        return {
            remove: () => {
                cancelled = true;
                clearTimeout(timer);
            },
        };
    }

    // ─── Response Builders ─────────────────────────────────────

    /** Build the 30-byte ECU identification response. */
    private buildIdentifyResponse(): string {
        const response = new Uint8Array(30);
        response[0] = 0x00; // Status: OK

        // ECU ID (16 bytes): "REVSYNC-ECU-MOCK"
        const ecuIdBytes = Buffer.from('REVSYNC-ECU-MOCK');
        response.set(ecuIdBytes.slice(0, 16), 1);

        // Hardware version: 1.0
        response[17] = 1;
        response[18] = 0;

        // Firmware version: 2.4.1
        response[19] = 2;
        response[20] = 4;
        response[21] = 1;

        // Calibration ID (8 bytes): "STCK2024"
        const calBytes = Buffer.from('STCK2024');
        response.set(calBytes.slice(0, 8), 22);

        return Buffer.from(response).toString('base64');
    }

    /** Build a checksum response: [status, 32-byte SHA-256]. */
    private buildChecksumResponse(): string {
        const hashBytes = Buffer.from(this.mockHash, 'hex');
        const response = new Uint8Array(33);
        response[0] = 0x00; // Status: OK
        response.set(hashBytes, 1);
        return Buffer.from(response).toString('base64');
    }

    /** Build a memory read response: 256 bytes of deterministic data. */
    private buildMemoryReadResponse(): string {
        const data = new Uint8Array(256);
        for (let i = 0; i < data.length; i++) {
            data[i] = (i * 7 + 0x42) & 0xFF; // Deterministic pattern
        }
        return Buffer.from(data).toString('base64');
    }
}
