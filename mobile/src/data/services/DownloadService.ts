/**
 * DownloadService — Secure tune package download, extraction, and verification.
 *
 * Implements the Download Verification State Machine:
 *   IDLE → DOWNLOADING → EXTRACTING → HASHING → VERIFYING_SIGNATURE → VERIFIED → READY
 *                                                                    → REJECTED (files purged)
 *
 * Uses the expo-file-system legacy API for file operations (download, delete, move)
 * since it provides downloadAsync with progress callbacks.
 */
import {
    documentDirectory,
    downloadAsync,
    makeDirectoryAsync,
    moveAsync,
    deleteAsync,
    getInfoAsync,
    readDirectoryAsync,
} from 'expo-file-system/legacy';
import { CryptoService } from './CryptoService';
import { ApiClient } from '../http/ApiClient';
import type {
    DownloadUrlResponse,
    DownloadProgress,
    DownloadResult,
    DownloadState,
    TunePackage,
} from '../../domain/services/DomainTypes';

// ─── Constants ─────────────────────────────────────────────────

const TUNES_DIR = `${documentDirectory}tunes/`;
const QUARANTINE_DIR = `${TUNES_DIR}quarantine/`;
const VERIFIED_DIR = `${TUNES_DIR}verified/`;

// ─── Types ─────────────────────────────────────────────────────

type ProgressCallback = (progress: DownloadProgress) => void;

// ─── Service ───────────────────────────────────────────────────

export class DownloadService {
    private cryptoService: CryptoService;
    private currentState: DownloadState = 'IDLE';

    constructor(cryptoService: CryptoService) {
        this.cryptoService = cryptoService;
    }

    // ─── Main Download + Verify Pipeline ───────────────────────

    async downloadAndVerify(
        versionId: string,
        listingId: string,
        onProgress?: ProgressCallback
    ): Promise<DownloadResult> {
        try {
            await this.ensureDirectories();

            // ── Step 1: Get signed download URL from backend ──────
            this.updateState('DOWNLOADING', onProgress, 0, 'Requesting download URL...');

            const urlResponse = await ApiClient.getInstance().post<DownloadUrlResponse>(
                `/v1/marketplace/download/${versionId}/`
            );

            // ── Step 2: Download .revsyncpkg ──────────────────────
            this.updateState('DOWNLOADING', onProgress, 5, 'Downloading tune package...');

            const quarantinePkgPath = `${QUARANTINE_DIR}${versionId}.revsyncpkg`;

            const downloadResult = await downloadAsync(
                urlResponse.download_url,
                quarantinePkgPath
            );

            if (!downloadResult || downloadResult.status !== 200) {
                throw new Error(`Download failed with status ${downloadResult?.status}`);
            }

            this.updateState('DOWNLOADING', onProgress, 65, 'Download complete');

            // ── Step 3: Compute SHA-256 of the package ────────────
            this.updateState('HASHING', onProgress, 70, 'Computing file hash...');

            const localPkgHash = await this.cryptoService.hashFile(quarantinePkgPath);

            // ── Step 4: Verify hashes match server-provided ───────
            this.updateState('VERIFYING_SIGNATURE', onProgress, 80, 'Verifying integrity...');

            const serverHashes = urlResponse.hashes;

            const hashesMatch = localPkgHash === serverHashes.package_hash_sha256;
            if (!hashesMatch) {
                console.error(
                    `Hash mismatch: local=${localPkgHash} server=${serverHashes.package_hash_sha256}`
                );
                await this.purgeFiles(versionId);
                this.updateState('REJECTED', onProgress, 100, 'INTEGRITY FAILURE: File hash mismatch');
                return {
                    success: false,
                    error: 'File integrity check failed — hash mismatch. The file may have been tampered with.',
                    finalState: 'REJECTED',
                };
            }

            // ── Step 5: Verify Ed25519 signature ──────────────────
            this.updateState('VERIFYING_SIGNATURE', onProgress, 90, 'Verifying signature...');

            const signatureB64 = urlResponse.signature_b64;
            const tuneHash = serverHashes.tune_hash_sha256;

            const signatureValid = await this.cryptoService.verifySignature(
                tuneHash,
                signatureB64
            );

            if (!signatureValid) {
                console.error('Signature verification FAILED');
                await this.purgeFiles(versionId);
                this.updateState('REJECTED', onProgress, 100, 'SIGNATURE INVALID: Package rejected');
                return {
                    success: false,
                    error: 'Signature verification failed — this package cannot be trusted.',
                    finalState: 'REJECTED',
                };
            }

            // ── Step 6: Move to verified storage ──────────────────
            this.updateState('VERIFIED', onProgress, 95, 'Package verified ✓');

            const verifiedPkgPath = `${VERIFIED_DIR}${versionId}.revsyncpkg`;
            await moveAsync({ from: quarantinePkgPath, to: verifiedPkgPath });

            const tunePackage: TunePackage = {
                versionId,
                listingId,
                localPkgPath: verifiedPkgPath,
                tuneBinPath: verifiedPkgPath,
                manifestPath: '',
                signatureBase64: signatureB64,
                tuneHashSha256: tuneHash,
                serverHashes,
                signatureVerified: true,
                hashesMatch: true,
                downloadedAt: Date.now(),
            };

            this.updateState('READY', onProgress, 100, 'Ready to flash');

            return { success: true, package: tunePackage, finalState: 'READY' };

        } catch (error: any) {
            console.error('DownloadService: Pipeline error', error);
            await this.purgeFiles(versionId).catch(() => { });
            this.updateState('FAILED', onProgress, 0, error.message || 'Download failed');
            return {
                success: false,
                error: error.uiMessage || error.message || 'Download failed',
                finalState: 'FAILED',
            };
        }
    }

    // ─── Re-Verification ───────────────────────────────────────

    async reverify(tunePackage: TunePackage): Promise<boolean> {
        try {
            const info = await getInfoAsync(tunePackage.localPkgPath);
            if (!info.exists) {
                console.error('Re-verify: Package file missing');
                return false;
            }

            const currentHash = await this.cryptoService.hashFile(tunePackage.localPkgPath);
            if (currentHash !== tunePackage.serverHashes.package_hash_sha256) {
                console.error('Re-verify: Hash changed since download');
                return false;
            }

            const signatureValid = await this.cryptoService.verifySignature(
                tunePackage.tuneHashSha256,
                tunePackage.signatureBase64
            );
            if (!signatureValid) {
                console.error('Re-verify: Signature no longer valid');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Re-verify error:', error);
            return false;
        }
    }

    // ─── Package Management ────────────────────────────────────

    async hasVerifiedPackage(versionId: string): Promise<boolean> {
        const path = `${VERIFIED_DIR}${versionId}.revsyncpkg`;
        const info = await getInfoAsync(path);
        return info.exists;
    }

    async deletePackage(versionId: string): Promise<void> {
        await deleteAsync(`${VERIFIED_DIR}${versionId}.revsyncpkg`, { idempotent: true });
    }

    async listVerifiedPackages(): Promise<string[]> {
        try {
            const files = await readDirectoryAsync(VERIFIED_DIR);
            return files
                .filter(f => f.endsWith('.revsyncpkg'))
                .map(f => f.replace('.revsyncpkg', ''));
        } catch {
            return [];
        }
    }

    getState(): DownloadState {
        return this.currentState;
    }

    // ─── Private Helpers ───────────────────────────────────────

    private async ensureDirectories(): Promise<void> {
        await makeDirectoryAsync(TUNES_DIR, { intermediates: true });
        await makeDirectoryAsync(QUARANTINE_DIR, { intermediates: true });
        await makeDirectoryAsync(VERIFIED_DIR, { intermediates: true });
    }

    private async purgeFiles(versionId: string): Promise<void> {
        console.warn(`DownloadService: Purging files for version ${versionId}`);
        await deleteAsync(`${QUARANTINE_DIR}${versionId}.revsyncpkg`, { idempotent: true });
        await deleteAsync(`${VERIFIED_DIR}${versionId}.revsyncpkg`, { idempotent: true });
    }

    private updateState(
        state: DownloadState,
        onProgress?: ProgressCallback,
        percent: number = 0,
        message: string = '',
        extra?: Partial<DownloadProgress>
    ): void {
        this.currentState = state;
        if (onProgress) {
            onProgress({
                state,
                bytesDownloaded: extra?.bytesDownloaded ?? 0,
                totalBytes: extra?.totalBytes ?? 0,
                percent,
                message,
            });
        }
    }
}
