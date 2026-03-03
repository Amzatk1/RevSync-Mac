/* ─── TypeScript interfaces for the RevSync API ─────────────── */

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'RIDER' | 'TUNER' | 'CREATOR' | 'ADMIN';
    is_verified: boolean;
    profile?: UserProfile;
    followers_count?: number;
    following_count?: number;
}

export interface UserProfile {
    bio: string;
    country: string;
    photo_url: string | null;
    experience_level: string;
    riding_style: string;
    risk_tolerance: string;
    last_active: string;
}

export interface TunerProfile {
    id: number;
    business_name: string;
    logo_url: string | null;
    verification_level: 'COMMUNITY' | 'VERIFIED' | 'PRO' | 'MASTER';
    average_rating: string;
}

export interface TuneListing {
    id: string; // UUID
    tuner: TunerProfile;
    title: string;
    slug: string;
    description: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year_start: number;
    vehicle_year_end: number;
    price: string; // DecimalField comes as string
    created_at: string;
    latest_version_id: string | null;
    latest_version_number: string | null;
    latest_version_status: string | null;
}

export interface TuneVersion {
    id: string; // UUID
    listing: string; // UUID ref
    version_number: string;
    changelog: string;
    status: 'DRAFT' | 'UPLOADED' | 'VALIDATING' | 'FAILED' | 'READY_FOR_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SUSPENDED';
    file_size_bytes: number;
    signed_at: string | null;
    created_at: string;
}

export interface Vehicle {
    id: number;
    user: number;
    name: string;
    vehicle_type: 'BIKE' | 'CAR';
    make: string;
    model: string;
    year: number;
    vin: string | null;
    ecu_type: string;
    ecu_id: string;
    ecu_software_version: string;
    modifications: string[];
    photo_url: string | null;
    public_visibility: boolean;
    created_at: string;
}

export interface EcuBackup {
    id: number;
    user: number;
    vehicle: number;
    storage_key: string;
    checksum: string;
    file_size_kb: number;
    notes: string;
    created_at: string;
}

export interface FlashJob {
    id: number;
    user: number;
    vehicle: number;
    tune: string | null; // UUID ref
    version: string | null; // UUID ref
    backup: number | null;
    status: 'CREATED' | 'PRE_CHECK' | 'BACKING_UP' | 'FLASHING' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'RECOVERING' | 'ABORTED';
    progress: number;
    logs: Array<{ timestamp: string; message: string }>;
    error_message: string;
    error_code: string;
    connection_type: 'BLE' | 'USB';
    device_id: string;
    ecu_read_data: Record<string, unknown>;
    flash_started_at: string | null;
    flash_completed_at: string | null;
    total_chunks: number;
    chunks_sent: number;
    created_at: string;
    // Nested details from serializer
    tune_detail?: TuneListing;
    version_detail?: TuneVersion;
    vehicle_detail?: Vehicle;
}

export interface Entitlement {
    id: number;
    listing: TuneListing;
    transaction_id: string;
    created_at: string;
}

export interface BatchStats {
    total: number;
    inProgress: number;
    successful: number;
    failed: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
