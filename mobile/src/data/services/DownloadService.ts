/**
 * DownloadService — Secure tune package download, verification, and local artifact management.
 *
 * Mobile does not ship with a zip extraction dependency, so the trusted backend validation
 * pipeline now publishes extracted `manifest.json` and `tune.bin` artifacts alongside the
 * signed `.revsyncpkg`. The client downloads all three, verifies them against backend hashes,
 * and only then marks the package ready to flash.
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
import { StorageAdapter } from './StorageAdapter';
import type {
    DownloadUrlResponse,
    DownloadProgress,
    DownloadResult,
    DownloadState,
    TunePackage,
} from '../../domain/services/DomainTypes';

const TUNES_DIR = `${documentDirectory}tunes/`;
const QUARANTINE_DIR = `${TUNES_DIR}quarantine/`;
const VERIFIED_DIR = `${TUNES_DIR}verified/`;
const VERIFIED_PACKAGE_METADATA_KEY = 'verified_package_metadata';

type ProgressCallback = (progress: DownloadProgress) => void;

function quarantinePackageDir(versionId: string): string {
    return `${QUARANTINE_DIR}${versionId}/`;
}

function verifiedPackageDir(versionId: string): string {
    return `${VERIFIED_DIR}${versionId}/`;
}

function packagePaths(baseDir: string) {
    return {
        localPkgPath: `${baseDir}package.revsyncpkg`,
        manifestPath: `${baseDir}manifest.json`,
        tuneBinPath: `${baseDir}tune.bin`,
    };
}

export class DownloadService {
    private cryptoService: CryptoService;
    private currentState: DownloadState = 'IDLE';

    constructor(cryptoService: CryptoService) {
        this.cryptoService = cryptoService;
    }

    async downloadAndVerify(
        versionId: string,
        listingId: string,
        onProgress?: ProgressCallback
    ): Promise<DownloadResult> {
        try {
            await this.ensureDirectories();
            await this.purgeFiles(versionId);

            const quarantineDir = quarantinePackageDir(versionId);
            const quarantinePaths = packagePaths(quarantineDir);
            await makeDirectoryAsync(quarantineDir, { intermediates: true });

            this.updateState('DOWNLOADING', onProgress, 0, 'Requesting download URL...');

            const urlResponse = await ApiClient.getInstance().post<DownloadUrlResponse>(
                `/v1/marketplace/download/${versionId}/`
            );

            this.updateState('DOWNLOADING', onProgress, 5, 'Downloading verified package...');
            await this.downloadArtifact(urlResponse.download_url, quarantinePaths.localPkgPath);

            this.updateState('DOWNLOADING', onProgress, 35, 'Downloading validation manifest...');
            await this.downloadArtifact(urlResponse.manifest_url, quarantinePaths.manifestPath);

            this.updateState('DOWNLOADING', onProgress, 55, 'Downloading verified tune binary...');
            await this.downloadArtifact(urlResponse.tune_bin_url, quarantinePaths.tuneBinPath);

            this.updateState('HASHING', onProgress, 70, 'Computing artifact hashes...');

            const localPkgHash = await this.cryptoService.hashFile(quarantinePaths.localPkgPath);
            const localManifestHash = await this.cryptoService.hashFile(quarantinePaths.manifestPath);
            const localTuneHash = await this.cryptoService.hashFile(quarantinePaths.tuneBinPath);

            const serverHashes = urlResponse.hashes;
            const hashesMatch =
                localPkgHash === serverHashes.package_hash_sha256 &&
                localManifestHash === serverHashes.manifest_hash_sha256 &&
                localTuneHash === serverHashes.tune_hash_sha256;

            if (!hashesMatch) {
                await this.reject(versionId, onProgress, 'Integrity verification failed. Re-download required.');
                return {
                    success: false,
                    error: 'File integrity check failed — validated artifacts no longer match the signed hashes.',
                    finalState: 'REJECTED',
                };
            }

            this.updateState('VERIFYING_SIGNATURE', onProgress, 88, 'Verifying signature...');

            const signatureValid = await this.cryptoService.verifySignature(
                localTuneHash,
                urlResponse.signature_b64
            );

            if (!signatureValid) {
                await this.reject(versionId, onProgress, 'Signature verification failed. Package rejected.');
                return {
                    success: false,
                    error: 'Signature verification failed — this package cannot be trusted.',
                    finalState: 'REJECTED',
                };
            }

            this.updateState('VERIFIED', onProgress, 95, 'Package verified ✓');

            const verifiedDir = verifiedPackageDir(versionId);
            const verifiedPaths = packagePaths(verifiedDir);
            await makeDirectoryAsync(verifiedDir, { intermediates: true });

            await moveAsync({ from: quarantinePaths.localPkgPath, to: verifiedPaths.localPkgPath });
            await moveAsync({ from: quarantinePaths.manifestPath, to: verifiedPaths.manifestPath });
            await moveAsync({ from: quarantinePaths.tuneBinPath, to: verifiedPaths.tuneBinPath });
            await deleteAsync(quarantineDir, { idempotent: true });

            const tunePackage: TunePackage = {
                versionId,
                listingId,
                localPkgPath: verifiedPaths.localPkgPath,
                tuneBinPath: verifiedPaths.tuneBinPath,
                manifestPath: verifiedPaths.manifestPath,
                signatureBase64: urlResponse.signature_b64,
                tuneHashSha256: localTuneHash,
                serverHashes,
                signatureVerified: true,
                hashesMatch: true,
                downloadedAt: Date.now(),
            };

            await this.savePackageMetadata(tunePackage);
            this.updateState('READY', onProgress, 100, 'Ready to flash');

            return { success: true, package: tunePackage, finalState: 'READY' };
        } catch (error: any) {
            console.error('DownloadService: Pipeline error', error);
            await this.purgeFiles(versionId).catch(() => {});
            this.updateState('FAILED', onProgress, 0, error.message || 'Download failed');
            return {
                success: false,
                error: error.uiMessage || error.message || 'Download failed',
                finalState: 'FAILED',
            };
        }
    }

    async reverify(tunePackage: TunePackage): Promise<boolean> {
        try {
            const [pkgInfo, manifestInfo, tuneInfo] = await Promise.all([
                getInfoAsync(tunePackage.localPkgPath),
                getInfoAsync(tunePackage.manifestPath),
                getInfoAsync(tunePackage.tuneBinPath),
            ]);

            if (!pkgInfo.exists || !manifestInfo.exists || !tuneInfo.exists) {
                console.error('Re-verify: Missing local validated artifact');
                return false;
            }

            const [currentPkgHash, currentManifestHash, currentTuneHash] = await Promise.all([
                this.cryptoService.hashFile(tunePackage.localPkgPath),
                this.cryptoService.hashFile(tunePackage.manifestPath),
                this.cryptoService.hashFile(tunePackage.tuneBinPath),
            ]);

            if (currentPkgHash !== tunePackage.serverHashes.package_hash_sha256) {
                console.error('Re-verify: Package hash changed since download');
                return false;
            }
            if (currentManifestHash !== tunePackage.serverHashes.manifest_hash_sha256) {
                console.error('Re-verify: Manifest hash changed since download');
                return false;
            }
            if (currentTuneHash !== tunePackage.serverHashes.tune_hash_sha256) {
                console.error('Re-verify: Tune hash changed since download');
                return false;
            }

            const signatureValid = await this.cryptoService.verifySignature(
                currentTuneHash,
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

    async hasVerifiedPackage(versionId: string): Promise<boolean> {
        const verified = packagePaths(verifiedPackageDir(versionId));
        const [pkgInfo, manifestInfo, tuneInfo] = await Promise.all([
            getInfoAsync(verified.localPkgPath),
            getInfoAsync(verified.manifestPath),
            getInfoAsync(verified.tuneBinPath),
        ]);
        return pkgInfo.exists && manifestInfo.exists && tuneInfo.exists;
    }

    async getVerifiedPackage(versionId: string): Promise<TunePackage | null> {
        const metadata = await this.loadPackageMetadata(versionId);
        if (!metadata) {
            return null;
        }
        return (await this.hasVerifiedPackage(versionId)) ? metadata : null;
    }

    async getVerifiedTuneBinPath(versionId: string): Promise<string | null> {
        const pkg = await this.getVerifiedPackage(versionId);
        return pkg?.tuneBinPath ?? null;
    }

    async deletePackage(versionId: string): Promise<void> {
        await this.deletePackageMetadata(versionId);
        await this.purgeFiles(versionId);
    }

    async listVerifiedPackages(): Promise<string[]> {
        try {
            const entries = await readDirectoryAsync(VERIFIED_DIR);
            return entries
                .map((entry) => entry.replace('.revsyncpkg', ''))
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    getState(): DownloadState {
        return this.currentState;
    }

    private async downloadArtifact(url: string, destination: string): Promise<void> {
        const result = await downloadAsync(url, destination);
        if (!result || result.status !== 200) {
            throw new Error(`Download failed with status ${result?.status}`);
        }
    }

    private async ensureDirectories(): Promise<void> {
        await makeDirectoryAsync(TUNES_DIR, { intermediates: true });
        await makeDirectoryAsync(QUARANTINE_DIR, { intermediates: true });
        await makeDirectoryAsync(VERIFIED_DIR, { intermediates: true });
    }

    private async purgeFiles(versionId: string): Promise<void> {
        const quarantinePaths = packagePaths(quarantinePackageDir(versionId));
        const verifiedPaths = packagePaths(verifiedPackageDir(versionId));

        await deleteAsync(quarantinePaths.localPkgPath, { idempotent: true });
        await deleteAsync(quarantinePaths.manifestPath, { idempotent: true });
        await deleteAsync(quarantinePaths.tuneBinPath, { idempotent: true });
        await deleteAsync(verifiedPaths.localPkgPath, { idempotent: true });
        await deleteAsync(verifiedPaths.manifestPath, { idempotent: true });
        await deleteAsync(verifiedPaths.tuneBinPath, { idempotent: true });
        await deleteAsync(quarantinePackageDir(versionId), { idempotent: true });
        await deleteAsync(verifiedPackageDir(versionId), { idempotent: true });
        await deleteAsync(`${QUARANTINE_DIR}${versionId}.revsyncpkg`, { idempotent: true });
        await deleteAsync(`${VERIFIED_DIR}${versionId}.revsyncpkg`, { idempotent: true });
    }

    private async reject(
        versionId: string,
        onProgress?: ProgressCallback,
        message: string = 'Package rejected'
    ): Promise<void> {
        await this.deletePackageMetadata(versionId);
        await this.purgeFiles(versionId);
        this.updateState('REJECTED', onProgress, 100, message);
    }

    private async loadAllPackageMetadata(): Promise<Record<string, TunePackage>> {
        return (await StorageAdapter.get<Record<string, TunePackage>>(VERIFIED_PACKAGE_METADATA_KEY)) || {};
    }

    private async savePackageMetadata(tunePackage: TunePackage): Promise<void> {
        const current = await this.loadAllPackageMetadata();
        current[tunePackage.versionId] = tunePackage;
        await StorageAdapter.set(VERIFIED_PACKAGE_METADATA_KEY, current);
    }

    private async loadPackageMetadata(versionId: string): Promise<TunePackage | null> {
        const current = await this.loadAllPackageMetadata();
        return current[versionId] || null;
    }

    private async deletePackageMetadata(versionId: string): Promise<void> {
        const current = await this.loadAllPackageMetadata();
        if (!current[versionId]) {
            return;
        }
        delete current[versionId];
        await StorageAdapter.set(VERIFIED_PACKAGE_METADATA_KEY, current);
    }

    private updateState(
        state: DownloadState,
        onProgress?: ProgressCallback,
        percent: number = 0,
        message: string = '',
        extra?: Partial<DownloadProgress>
    ): void {
        this.currentState = state;
        onProgress?.({
            state,
            bytesDownloaded: extra?.bytesDownloaded ?? 0,
            totalBytes: extra?.totalBytes ?? 0,
            percent,
            message,
        });
    }
}
