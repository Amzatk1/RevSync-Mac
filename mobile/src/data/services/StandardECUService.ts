import { ECUService } from '../../domain/services/ECUService';
import { FlashSession, FlashSessionStatus } from '../../domain/entities/FlashSession';
import { DeviceService } from '../../domain/services/DeviceService';
import { Tune } from '../../domain/services/DomainTypes';
import { ValidationService } from '../../domain/services/ValidationService';
import { Buffer } from 'buffer';
import { readAsStringAsync, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

// ─── BLE Protocol Constants ────────────────────────────────────

const ECU_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const CMD_CHAR_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';  // Write commands
const DATA_CHAR_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';  // Write data chunks
const RESPONSE_CHAR_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';  // Read responses / notifications

// Command opcodes (application-level protocol)
const CMD = {
    IDENTIFY: 0x01,
    ENTER_BOOTLOADER: 0x10,
    EXIT_BOOTLOADER: 0x11,
    ERASE_SECTOR: 0x20,
    WRITE_CHUNK: 0x30,
    WRITE_CHUNK_ACK: 0x31,  // Expected response: ACK
    WRITE_CHUNK_NAK: 0x32,  // Expected response: NAK (retry)
    READ_MEMORY: 0x40,
    READ_CHECKSUM: 0x50,
    CLEAR_DTC: 0x60,
    VERIFY_COMPLETE: 0x70,
} as const;

// Chunk sizes and limits
const CHUNK_SIZE = 256;         // bytes per BLE write (fits easily within 512-byte MTU)
const MAX_RETRIES = 3;          // retries per chunk on NAK
const ACK_TIMEOUT_MS = 5000;    // timeout waiting for ACK per chunk

// ─── Helpers ───────────────────────────────────────────────────

/** Build a command frame: [opcode, ...payload] → base64 */
function buildCommand(opcode: number, payload: number[] = []): string {
    const buf = Buffer.from([opcode, ...payload]);
    return buf.toString('base64');
}

/** Parse a base64 response into bytes */
function parseResponse(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}

// ─── StandardECUService ────────────────────────────────────────

export class StandardECUService implements ECUService {
    private deviceService: DeviceService;
    private validationService: ValidationService;
    private currentSession: FlashSession | null = null;
    private isFlashing = false;
    private connectedDeviceId: string | null = null;
    private connectionMonitor: { remove: () => void } | null = null;
    private bleDisconnected = false;

    constructor(deviceService: DeviceService, validationService: ValidationService) {
        this.deviceService = deviceService;
        this.validationService = validationService;
    }

    /** Set the connected device ID (called by DeviceConnectScreen after pairing) */
    setConnectedDevice(deviceId: string) {
        this.connectedDeviceId = deviceId;
    }

    private getDeviceId(): string {
        if (!this.connectedDeviceId) {
            throw new Error('No BLE device connected. Pair device first.');
        }
        return this.connectedDeviceId;
    }

    // ─── Identification ────────────────────────────────────────

    async identifyECU(): Promise<{
        ecuId: string;
        hardwareVersion: string;
        firmwareVersion: string;
        calibrationId?: string;
    }> {
        const deviceId = this.getDeviceId();

        await this.deviceService.sendData(
            deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
            buildCommand(CMD.IDENTIFY)
        );

        const responseB64 = await this.deviceService.readData(
            deviceId, ECU_SERVICE_UUID, RESPONSE_CHAR_UUID
        );

        const data = parseResponse(responseB64);

        // Protocol: [status, ecuId(16 bytes), hwMajor, hwMinor, fwMajor, fwMinor, fwPatch, calId(8 bytes)]
        if (data.length < 22) {
            // Fallback for mock/dev devices
            return {
                ecuId: 'ECU-' + Buffer.from(data.slice(1, 5)).toString('hex').toUpperCase(),
                hardwareVersion: `${data[17] || 1}.${data[18] || 0}`,
                firmwareVersion: `${data[19] || 2}.${data[20] || 4}.${data[21] || 1}`,
            };
        }

        const ecuId = Buffer.from(data.slice(1, 17)).toString('utf-8').replace(/\0/g, '').trim();
        const hwVersion = `${data[17]}.${data[18]}`;
        const fwVersion = `${data[19]}.${data[20]}.${data[21]}`;
        const calId = data.length >= 30
            ? Buffer.from(data.slice(22, 30)).toString('utf-8').replace(/\0/g, '').trim()
            : undefined;

        return { ecuId, hardwareVersion: hwVersion, firmwareVersion: fwVersion, calibrationId: calId };
    }

    // ─── Backup (Read ECU) ─────────────────────────────────────

    async readECU(onProgress?: (percent: number, message?: string) => void): Promise<string> {
        const deviceId = this.getDeviceId();
        this.updateSession('backing_up');

        const readSizeBytes = 256 * 1024; // 256 KB typical ECU image
        const totalChunks = Math.ceil(readSizeBytes / CHUNK_SIZE);
        const chunks: Uint8Array[] = [];

        onProgress?.(0, 'Reading ECU memory...');

        for (let i = 0; i < totalChunks; i++) {
            const address = i * CHUNK_SIZE;
            const addrBytes = [
                (address >> 24) & 0xFF,
                (address >> 16) & 0xFF,
                (address >> 8) & 0xFF,
                address & 0xFF,
                (CHUNK_SIZE >> 8) & 0xFF,
                CHUNK_SIZE & 0xFF,
            ];

            await this.deviceService.sendData(
                deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
                buildCommand(CMD.READ_MEMORY, addrBytes)
            );

            const responseB64 = await this.deviceService.readData(
                deviceId, ECU_SERVICE_UUID, RESPONSE_CHAR_UUID
            );
            chunks.push(parseResponse(responseB64));

            const percent = ((i + 1) / totalChunks) * 100;
            onProgress?.(percent, `Reading block ${i + 1}/${totalChunks}`);
        }

        // Combine all chunks and save as backup file
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        const backupB64 = Buffer.from(combined).toString('base64');
        const backupPath = `${require('expo-file-system/legacy').documentDirectory}backups/backup_${Date.now()}.bin`;

        await require('expo-file-system/legacy').makeDirectoryAsync(
            `${require('expo-file-system/legacy').documentDirectory}backups/`,
            { intermediates: true }
        );
        await writeAsStringAsync(backupPath, backupB64, { encoding: EncodingType.Base64 });

        this.updateSession('backing_up', 100, [`Backup saved: ${backupPath}`]);
        onProgress?.(100, 'Backup complete');

        return backupPath;
    }

    // ─── Bootloader ────────────────────────────────────────────

    async enterBootloader(): Promise<void> {
        const deviceId = this.getDeviceId();

        await this.deviceService.sendData(
            deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
            buildCommand(CMD.ENTER_BOOTLOADER)
        );

        // Wait for bootloader to initialize
        await this.waitForAck(deviceId, 'Bootloader ACK', 10000);
        this.addLog('ECU entered bootloader mode');
    }

    async exitBootloader(): Promise<void> {
        const deviceId = this.getDeviceId();

        await this.deviceService.sendData(
            deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
            buildCommand(CMD.EXIT_BOOTLOADER)
        );

        // Small delay for ECU to restart application
        await new Promise(r => setTimeout(r, 2000));
        this.addLog('ECU exited bootloader, restarting application');
    }

    // ─── Flash Tune (Chunk Protocol) ───────────────────────────

    async flashTune(
        tune: Tune,
        backupPath: string,
        onProgress?: (percent: number, message?: string) => void,
    ): Promise<void> {
        if (this.isFlashing) throw new Error('Flash already in progress');
        this.isFlashing = true;

        const deviceId = this.getDeviceId();

        this.currentSession = {
            id: Date.now().toString(),
            startTime: Date.now(),
            status: 'created',
            progress: 0,
            log: ['Session created'],
            versionId: tune.versionId,
            listingId: tune.listingId,
            backupPath,
            connectionType: 'BLE',
            deviceId,
            flashStartedAt: Date.now(),
        };

        try {
            // 0. Start BLE disconnect monitoring
            this.startConnectionMonitor(deviceId);

            // 1. Enter bootloader
            this.updateSession('pre_check');
            onProgress?.(0, 'Entering bootloader mode...');
            await this.enterBootloader();

            // 2. Read tune binary
            this.updateSession('flashing');
            onProgress?.(2, 'Loading tune binary...');

            const tuneBinPath = tune.checksum
                ? `${require('expo-file-system/legacy').documentDirectory}tunes/verified/${tune.versionId}.revsyncpkg`
                : backupPath;

            const tuneB64 = await readAsStringAsync(tuneBinPath, {
                encoding: EncodingType.Base64,
            });
            const tuneBytes = new Uint8Array(Buffer.from(tuneB64, 'base64'));

            // 3. Calculate chunks
            const totalChunks = Math.ceil(tuneBytes.length / CHUNK_SIZE);
            this.currentSession.totalChunks = totalChunks;
            this.currentSession.chunksSent = 0;

            this.addLog(`Flashing ${tuneBytes.length} bytes in ${totalChunks} chunks`);
            onProgress?.(3, `0 / ${totalChunks} chunks`);

            // 4. Send each chunk with ACK/NAK retry + exponential backoff
            for (let i = 0; i < totalChunks; i++) {
                this.assertConnected();

                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, tuneBytes.length);
                const chunk = tuneBytes.slice(start, end);

                let sent = false;
                let retries = 0;

                while (!sent && retries < MAX_RETRIES) {
                    // Build chunk frame: [WRITE_CHUNK, chunkIndex(2B), length(2B), ...data]
                    const header = [
                        (i >> 8) & 0xFF, i & 0xFF,           // chunk index
                        (chunk.length >> 8) & 0xFF, chunk.length & 0xFF,  // length
                    ];
                    const frame = Buffer.from([CMD.WRITE_CHUNK, ...header, ...chunk]);

                    await this.deviceService.sendData(
                        deviceId, ECU_SERVICE_UUID, DATA_CHAR_UUID,
                        frame.toString('base64')
                    );

                    // Wait for ACK/NAK
                    const ack = await this.waitForAck(deviceId, `Chunk ${i}`, ACK_TIMEOUT_MS);

                    if (ack === CMD.WRITE_CHUNK_ACK) {
                        sent = true;
                    } else if (ack === CMD.WRITE_CHUNK_NAK) {
                        retries++;
                        this.addLog(`NAK on chunk ${i}, retrying (${retries}/${MAX_RETRIES})`);
                        // Exponential backoff: 500ms, 1000ms, 2000ms
                        await new Promise(r => setTimeout(r, Math.pow(2, retries - 1) * 500));
                    } else {
                        retries++;
                        this.addLog(`Unexpected response 0x${ack.toString(16)} on chunk ${i}, retrying`);
                        await new Promise(r => setTimeout(r, Math.pow(2, retries - 1) * 500));
                    }
                }

                if (!sent) {
                    throw new Error(`Chunk ${i} failed after ${MAX_RETRIES} retries`);
                }

                this.currentSession.chunksSent = i + 1;
                const percent = 5 + ((i + 1) / totalChunks) * 85; // 5-90% range
                this.currentSession.progress = percent;
                onProgress?.(percent, `Chunk ${i + 1}/${totalChunks}`);
            }

            // 5. Signal flash complete to ECU
            await this.deviceService.sendData(
                deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
                buildCommand(CMD.VERIFY_COMPLETE)
            );
            await this.waitForAck(deviceId, 'Verify complete ACK', 10000);

            // 6. Verify flash
            this.updateSession('verifying');
            onProgress?.(92, 'Verifying flash integrity...');
            const verified = await this.verifyFlash(tune);

            if (!verified) {
                throw new Error('Flash verification failed — checksum mismatch');
            }

            // 7. Clear DTCs
            onProgress?.(96, 'Clearing diagnostic codes...');
            await this.clearDTCs();

            // 8. Exit bootloader
            onProgress?.(98, 'Exiting bootloader...');
            await this.exitBootloader();

            // 9. Done
            this.updateSession('completed', 100);
            this.currentSession.flashCompletedAt = Date.now();
            this.addLog('Flash completed successfully');
            onProgress?.(100, 'Flash complete!');

        } catch (error: any) {
            this.updateSession('failed');
            this.currentSession!.errorCode = error.code || 'FLASH_ERROR';
            this.currentSession!.errorMessage = error.message;
            this.addLog(`FATAL: ${error.message}`);

            // Attempt to safely exit bootloader
            try {
                await this.exitBootloader();
            } catch {
                this.addLog('WARNING: Could not exit bootloader');
            }

            throw error;
        } finally {
            this.stopConnectionMonitor();
            this.isFlashing = false;
        }
    }

    // ─── Verification ──────────────────────────────────────────

    async verifyFlash(tune: Tune): Promise<boolean> {
        const deviceId = this.getDeviceId();

        // Request ECU to compute and report its checksum
        await this.deviceService.sendData(
            deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
            buildCommand(CMD.READ_CHECKSUM)
        );

        const responseB64 = await this.deviceService.readData(
            deviceId, ECU_SERVICE_UUID, RESPONSE_CHAR_UUID
        );
        const data = parseResponse(responseB64);

        // Protocol: [status, hash(32 bytes SHA-256)]
        if (data[0] !== 0x00) {
            this.addLog('Verification failed: ECU reported error');
            return false;
        }

        const ecuHash = Buffer.from(data.slice(1, 33)).toString('hex').toLowerCase();
        const expectedHash = tune.hashSha256?.toLowerCase();

        if (expectedHash && ecuHash !== expectedHash) {
            this.addLog(`Checksum mismatch: ECU=${ecuHash.slice(0, 12)}... Expected=${expectedHash.slice(0, 12)}...`);
            return false;
        }

        this.addLog(`Verification OK: ${ecuHash.slice(0, 16)}...`);
        return true;
    }

    async readChecksum(address: number, length: number): Promise<string> {
        const deviceId = this.getDeviceId();
        const addrBytes = [
            (address >> 24) & 0xFF, (address >> 16) & 0xFF,
            (address >> 8) & 0xFF, address & 0xFF,
            (length >> 24) & 0xFF, (length >> 16) & 0xFF,
            (length >> 8) & 0xFF, length & 0xFF,
        ];

        await this.deviceService.sendData(
            deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
            buildCommand(CMD.READ_CHECKSUM, addrBytes)
        );

        return await this.deviceService.readData(
            deviceId, ECU_SERVICE_UUID, RESPONSE_CHAR_UUID
        );
    }

    // ─── DTC Clearing ──────────────────────────────────────────

    async clearDTCs(): Promise<void> {
        const deviceId = this.getDeviceId();

        await this.deviceService.sendData(
            deviceId, ECU_SERVICE_UUID, CMD_CHAR_UUID,
            buildCommand(CMD.CLEAR_DTC)
        );

        await this.waitForAck(deviceId, 'Clear DTC ACK', 5000);
        this.addLog('Diagnostic codes cleared');
    }

    // ─── Recovery ──────────────────────────────────────────────

    async restoreBackup(
        backupPath: string,
        onProgress?: (percent: number, message?: string) => void,
    ): Promise<void> {
        const deviceId = this.getDeviceId();
        this.isFlashing = true;

        this.currentSession = {
            id: Date.now().toString(),
            startTime: Date.now(),
            status: 'recovering',
            progress: 0,
            log: ['Recovery session started'],
            backupPath,
            connectionType: 'BLE',
            deviceId,
        };

        try {
            // Start BLE disconnect monitoring
            this.startConnectionMonitor(deviceId);

            // Enter bootloader
            onProgress?.(0, 'Entering bootloader for recovery...');
            await this.enterBootloader();

            // Read backup file
            onProgress?.(3, 'Loading backup...');
            const backupB64 = await readAsStringAsync(backupPath, {
                encoding: EncodingType.Base64,
            });
            const backupBytes = new Uint8Array(Buffer.from(backupB64, 'base64'));

            const totalChunks = Math.ceil(backupBytes.length / CHUNK_SIZE);
            this.currentSession.totalChunks = totalChunks;

            // Send all chunks (same protocol as flashTune)
            for (let i = 0; i < totalChunks; i++) {
                this.assertConnected();

                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, backupBytes.length);
                const chunk = backupBytes.slice(start, end);

                let sent = false;
                let retries = 0;

                while (!sent && retries < MAX_RETRIES) {
                    const header = [
                        (i >> 8) & 0xFF, i & 0xFF,
                        (chunk.length >> 8) & 0xFF, chunk.length & 0xFF,
                    ];
                    const frame = Buffer.from([CMD.WRITE_CHUNK, ...header, ...chunk]);

                    await this.deviceService.sendData(
                        deviceId, ECU_SERVICE_UUID, DATA_CHAR_UUID,
                        frame.toString('base64')
                    );

                    const ack = await this.waitForAck(deviceId, `Recovery chunk ${i}`, ACK_TIMEOUT_MS);

                    if (ack === CMD.WRITE_CHUNK_ACK) {
                        sent = true;
                    } else {
                        retries++;
                        // Exponential backoff on retry
                        await new Promise(r => setTimeout(r, Math.pow(2, retries - 1) * 500));
                    }
                }

                if (!sent) {
                    throw new Error(`Recovery chunk ${i} failed after ${MAX_RETRIES} retries`);
                }

                this.currentSession.chunksSent = i + 1;
                const percent = 5 + ((i + 1) / totalChunks) * 90;
                onProgress?.(percent, `Restoring chunk ${i + 1}/${totalChunks}`);
            }

            // Exit bootloader
            onProgress?.(97, 'Exiting bootloader...');
            await this.exitBootloader();

            // Clear DTCs
            onProgress?.(99, 'Clearing diagnostic codes...');
            await this.clearDTCs();

            this.updateSession('completed', 100);
            this.addLog('Recovery completed successfully');
            onProgress?.(100, 'Recovery complete!');

        } catch (error: any) {
            this.updateSession('failed');
            this.currentSession!.errorCode = 'RECOVERY_ERROR';
            this.currentSession!.errorMessage = error.message;
            this.addLog(`RECOVERY FAILED: ${error.message}`);
            throw error;
        } finally {
            this.stopConnectionMonitor();
            this.isFlashing = false;
        }
    }

    // ─── Session ───────────────────────────────────────────────

    getSessionState(): FlashSession {
        if (!this.currentSession) {
            return {
                id: '',
                startTime: 0,
                status: 'created',
                progress: 0,
                log: [],
            };
        }
        return { ...this.currentSession };
    }

    // ─── Private Helpers ───────────────────────────────────────

    /** Wait for an ACK response from the ECU. Returns the response opcode. */
    private async waitForAck(deviceId: string, context: string, timeoutMs: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const timer = setTimeout(() => {
                monitor.remove();
                reject(new Error(`Timeout waiting for ${context}`));
            }, timeoutMs);

            const monitor = this.deviceService.monitorCharacteristic(
                deviceId,
                ECU_SERVICE_UUID,
                RESPONSE_CHAR_UUID,
                (error, value) => {
                    clearTimeout(timer);
                    monitor.remove();

                    if (error) {
                        reject(new Error(`BLE error during ${context}: ${error.message}`));
                        return;
                    }

                    if (value) {
                        const data = parseResponse(value);
                        resolve(data[0]); // First byte is the response opcode
                    } else {
                        reject(new Error(`Empty response for ${context}`));
                    }
                }
            );
        });
    }

    private updateSession(status: FlashSessionStatus, progress?: number, extraLog?: string[]) {
        if (this.currentSession) {
            this.currentSession.status = status;
            if (progress !== undefined) this.currentSession.progress = progress;
            if (extraLog) this.currentSession.log.push(...extraLog);
        }
    }

    private addLog(msg: string) {
        if (this.currentSession) {
            this.currentSession.log.push(msg);
        }
        console.log(`[ECU] ${msg}`);
    }

    // ─── BLE Disconnect Detection ──────────────────────────────

    /**
     * Start monitoring the BLE connection for unexpected disconnects.
     * If the connection drops mid-flash, `bleDisconnected` is set so the
     * chunk loop can throw a specific error.
     */
    private startConnectionMonitor(deviceId: string) {
        this.bleDisconnected = false;
        this.connectionMonitor = this.deviceService.monitorCharacteristic(
            deviceId,
            ECU_SERVICE_UUID,
            RESPONSE_CHAR_UUID,
            (error) => {
                if (error && this.isFlashing) {
                    this.bleDisconnected = true;
                    this.addLog(`BLE DISCONNECT detected: ${error.message}`);
                }
            },
        );
    }

    private stopConnectionMonitor() {
        if (this.connectionMonitor) {
            this.connectionMonitor.remove();
            this.connectionMonitor = null;
        }
    }

    /** Throw immediately if BLE has disconnected. */
    private assertConnected() {
        if (this.bleDisconnected) {
            const err = new Error('BLE connection lost during flash. Initiate recovery.');
            (err as any).code = 'BLE_DISCONNECT';
            throw err;
        }
    }
}
