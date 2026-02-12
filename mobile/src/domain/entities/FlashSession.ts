/**
 * FlashSession — tracks the lifecycle of a single flash operation.
 *
 * States match the backend FlashJob model state machine:
 *   CREATED → PRE_CHECK → BACKING_UP → FLASHING → VERIFYING → COMPLETED
 *                ↓             ↓           ↓           ↓
 *             ABORTED       FAILED      FAILED      RECOVERING
 */
export type FlashSessionStatus =
    | 'created'
    | 'pre_check'
    | 'backing_up'
    | 'flashing'
    | 'verifying'
    | 'completed'
    | 'failed'
    | 'recovering'
    | 'aborted';

export interface FlashSession {
    id: string;
    startTime: number;
    status: FlashSessionStatus;
    progress: number;               // 0–100
    log: string[];

    // Added for full flash lifecycle
    versionId?: string;
    listingId?: string;
    backupPath?: string;            // path to ECU backup file on device
    tuneBinPath?: string;           // path to verified tune.bin
    errorCode?: string;             // machine-readable error
    errorMessage?: string;          // human-readable error

    // Chunk tracking
    totalChunks?: number;
    chunksSent?: number;
    connectionType?: 'BLE' | 'USB';
    deviceId?: string;

    // Timing
    flashStartedAt?: number;
    flashCompletedAt?: number;
}
