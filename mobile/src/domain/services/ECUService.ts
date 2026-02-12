import { Tune } from './DomainTypes';
import { FlashSession } from '../entities/FlashSession';

/**
 * ECUService — defines the full flash lifecycle for communicating with a vehicle ECU.
 *
 * The flow is:
 *   identifyECU → readECU (backup) → enterBootloader → flashTune (chunk loop) →
 *   verifyFlash (read-back) → exitBootloader → clearDTCs
 *
 * Recovery: restoreBackup uses the same chunk protocol to write original data back.
 */
export interface ECUService {
    // ─── Identification ────────────────────────────────────────
    identifyECU(): Promise<{
        ecuId: string;
        hardwareVersion: string;
        firmwareVersion: string;
        calibrationId?: string;
    }>;

    // ─── Backup ────────────────────────────────────────────────
    /** Read full ECU memory to create a backup. Returns local file path. */
    readECU(onProgress?: (percent: number, message?: string) => void): Promise<string>;

    // ─── Bootloader ────────────────────────────────────────────
    /** Transition ECU into bootloader/flash mode. Must be called before flashTune. */
    enterBootloader(): Promise<void>;

    /** Exit bootloader and return ECU to normal application mode. */
    exitBootloader(): Promise<void>;

    // ─── Flashing ──────────────────────────────────────────────
    /**
     * Flash a tune in chunks with ACK/NAK protocol.
     * Calls onProgress for each chunk sent + ACK'd.
     */
    flashTune(
        tune: Tune,
        backupPath: string,
        onProgress?: (percent: number, message?: string) => void,
    ): Promise<void>;

    // ─── Verification ──────────────────────────────────────────
    /** Read-back checksum verification after flashing. */
    verifyFlash(tune: Tune): Promise<boolean>;

    /** Read back a specific memory region for external comparison. Returns base64 data. */
    readChecksum(address: number, length: number): Promise<string>;

    // ─── DTC / Cleanup ─────────────────────────────────────────
    /** Clear Diagnostic Trouble Codes after successful flash. */
    clearDTCs(): Promise<void>;

    // ─── Recovery ──────────────────────────────────────────────
    /** Restore a backup file to the ECU (same chunk protocol as flashTune). */
    restoreBackup(
        backupPath: string,
        onProgress?: (percent: number, message?: string) => void,
    ): Promise<void>;

    // ─── Session State ─────────────────────────────────────────
    getSessionState(): FlashSession;
}
