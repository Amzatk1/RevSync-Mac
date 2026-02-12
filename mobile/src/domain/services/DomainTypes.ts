// ─── Core Entities ──────────────────────────────────────────────

export interface Bike {
    id: string;
    make: string;
    model: string;
    year: number;
    vin?: string;
    ecuId?: string; // If identified
    name: string; // Display name
}

export interface Tune {
    id: string;             // listing ID
    title: string;
    bikeId: string;
    stage: number;
    price: number;
    safetyRating: number;
    compatibilityRaw: string[];
    description?: string;
    modificationsRequired?: string[];
    octaneRequired?: number;
    version: string;
    checksum?: string;

    // Added for secure download + flash pipeline (optional for backwards compat)
    listingId?: string;
    versionId?: string;
    versionState?: TuneVersionState;
    signatureBase64?: string;
    hashSha256?: string;
}

export type TuneVersionState =
    | 'DRAFT'
    | 'UPLOADED'
    | 'VALIDATING'
    | 'FAILED'
    | 'READY_FOR_REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'SUSPENDED';

// ─── Secure Download & Verification ────────────────────────────

/** Result from POST /marketplace/download/{version_id}/ */
export interface DownloadUrlResponse {
    download_url: string;
    signature_url: string;
    hashes_url: string;
    signature_b64: string;
    hashes: HashesJson;
    expires_at: string;
}

/** hashes.json from the server (matches backend generate_hashes_json output) */
export interface HashesJson {
    version_id: string;
    tune_hash_sha256: string;
    manifest_hash_sha256: string;
    package_hash_sha256: string;
    algorithm: 'sha256';
    key_id: string;
    signed_at: string;
}

/** Local package after download + extract */
export interface TunePackage {
    versionId: string;
    listingId: string;
    localPkgPath: string;       // .revsyncpkg file
    tuneBinPath: string;        // extracted tune.bin
    manifestPath: string;       // extracted manifest.json
    signatureBase64: string;    // server-provided signature
    tuneHashSha256: string;     // locally computed SHA-256 of tune.bin
    serverHashes: HashesJson;   // server-provided hashes
    signatureVerified: boolean;
    hashesMatch: boolean;
    downloadedAt: number;       // timestamp
}

/** Download state machine (matches implementation plan) */
export type DownloadState =
    | 'IDLE'
    | 'DOWNLOADING'
    | 'EXTRACTING'
    | 'HASHING'
    | 'VERIFYING_SIGNATURE'
    | 'VERIFIED'
    | 'REJECTED'
    | 'READY'
    | 'FAILED';

export interface DownloadProgress {
    state: DownloadState;
    bytesDownloaded: number;
    totalBytes: number;
    percent: number;
    message: string;
}

export interface DownloadResult {
    success: boolean;
    package?: TunePackage;
    error?: string;
    finalState: DownloadState;
}

// ─── Entitlements ──────────────────────────────────────────────

export interface Entitlement {
    id: string;
    listingId: string;
    listingTitle: string;
    isActive: boolean;
    isRevoked: boolean;
    purchasedAt: string;
    revokedAt?: string;
}

// ─── Pre-Flash Gate ────────────────────────────────────────────

export interface FlashPreCheck {
    signatureVerified: boolean;
    hashesMatch: boolean;
    serverStatusOk: boolean;     // version still PUBLISHED
    ecuMatches: boolean;         // ECU read matches tune manifest
    backupExists: boolean;       // verified backup on device
    batteryOk: boolean;          // battery ≥ threshold
    rssiOk: boolean;             // BLE signal ≥ threshold
    allPassed: boolean;          // AND of all above
    blockers: string[];          // human-readable reasons
}

// ─── Version Status ────────────────────────────────────────────

export interface VersionStatusResponse {
    version_id: string;
    status: TuneVersionState;
    flash_allowed: boolean;
    has_entitlement: boolean;
    reason?: string;
}

// ─── Filters ───────────────────────────────────────────────────

export interface TuneFilter {
    searchQuery?: string;
    minStage?: number;
    maxStage?: number;
    compatibleBikeId?: string;
    onlySafe?: boolean;
}

// ─── Service Interfaces ────────────────────────────────────────

export interface BikeService {
    getBikes(): Promise<Bike[]>;
    getActiveBike(): Promise<Bike | null>;
    setActiveBike(bikeId: string): Promise<void>;
    addBike(bike: Omit<Bike, 'id'>): Promise<Bike>;
    updateBike(bike: Bike): Promise<Bike>;
}

export interface TuneService {
    getTunes(filter?: TuneFilter, page?: number): Promise<Tune[]>;
    getTuneDetails(tuneId: string): Promise<Tune | null>;
    getRecommendTunes(bikeId: string): Promise<Tune[]>;
    getTunesForBike(bikeId: string): Promise<Tune[]>;
    purchaseTune(tuneId: string): Promise<void>;
    downloadTune(tuneId: string): Promise<string>;
    verifyTuneIntegrity(tune: Tune): Promise<boolean>;
    importTune(tune: Tune): Promise<void>;

    // New secure endpoints
    getDownloadUrl(versionId: string): Promise<DownloadUrlResponse>;
    checkVersionStatus(versionId: string): Promise<VersionStatusResponse>;
    getEntitlements(): Promise<Entitlement[]>;
    checkPurchase(listingId: string): Promise<{ owned: boolean }>;
    createPaymentIntent(listingId: string): Promise<{ clientSecret: string; publishableKey: string }>;
}
