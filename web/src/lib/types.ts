// ─── Paginated Response ───
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// ─── Auth ───
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface TokenRefreshRequest {
    refresh: string;
}

export interface TokenRefreshResponse {
    access: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: UserRole;
}

// ─── Users ───
export type UserRole = 'RIDER' | 'TUNER' | 'CREATOR' | 'ADMIN';

export interface UserProfile {
    bio: string;
    country: string;
    photo_url: string | null;
    experience_level: string;
    riding_style: string;
    risk_tolerance: string;
    last_active: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_verified: boolean;
    profile: UserProfile;
}

export interface UserPreference {
    key: string;
    value: unknown;
    updated_at: string;
}

// ─── Vehicles ───
export type VehicleType = 'BIKE' | 'CAR';

export interface Vehicle {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    name: string;
    vehicle_type: VehicleType;
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
    user: number;
}

export interface VehicleDefinition {
    id: number;
    created_at: string;
    updated_at: string;
    vehicle_type: VehicleType;
    make: string;
    model: string;
    year: number;
    stock_hp: number;
    stock_torque: number;
}

// ─── Tuner Profiles ───
export type VerificationLevel = 'COMMUNITY' | 'VERIFIED' | 'PRO' | 'MASTER';

export interface TunerReview {
    id: number;
    author: User;
    created_at: string;
    updated_at: string;
    rating: number;
    comment: string;
    tuner: number;
}

export interface TunerCertification {
    id: number;
    created_at: string;
    updated_at: string;
    document_type: string;
    document_url: string;
    is_approved: boolean;
    reviewed_at: string | null;
    tuner: number;
}

export interface TunerProfile {
    id: number;
    user: User;
    certifications: TunerCertification[];
    reviews: TunerReview[];
    created_at: string;
    updated_at: string;
    business_name: string;
    logo_url: string | null;
    specializations: string[];
    years_experience: number;
    verification_level: VerificationLevel;
    is_verified_business: boolean;
    total_downloads: number;
    average_rating: string;
    tunes_published_count: number;
    quality_score: number;
}

// ─── Tunes ───
export type TuneStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Tune {
    id: number;
    creator: TunerProfile;
    created_at: string;
    updated_at: string;
    name: string;
    description: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year_start: number;
    vehicle_year_end: number;
    ecu_compatibility: Record<string, unknown>;
    stage: number;
    horsepower_gain: string | null;
    torque_gain: string | null;
    dyno_chart_url: string | null;
    file_url: string;
    file_size_kb: number;
    price: string;
    status: TuneStatus;
    is_active: boolean;
    published_at: string | null;
    safety_rating: number;
    compatibility_index: number;
    manifest_json: Record<string, unknown>;
    metadata: Record<string, unknown>;
    versions: Record<string, unknown>;
}

// ─── Purchases ───
export interface Purchase {
    id: number;
    user: User;
    tune: Tune;
    created_at: string;
    updated_at: string;
    price_paid: string;
    transaction_id: string;
}

// ─── Flash Jobs ───
export type FlashJobStatus = 'PENDING' | 'FLASHING' | 'COMPLETED' | 'FAILED';

export interface FlashJob {
    id: number;
    tune_detail: Tune;
    created_at: string;
    updated_at: string;
    status: FlashJobStatus;
    progress: number;
    logs: unknown;
    error_message: string;
    user: number;
    vehicle: number;
    tune: number | null;
}

// ─── ECU Backups ───
export interface EcuBackup {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    storage_key: string;
    checksum: string;
    file_size_kb: number;
    notes: string;
    user: number;
    vehicle: number;
}

// ─── Safety Reports ───
export interface SafetyReport {
    id: number;
    created_at: string;
    updated_at: string;
    risk_score: number;
    status: string;
    input_data: unknown;
    analysis_result: unknown;
    recommendations: unknown;
    user: number | null;
    vehicle: number | null;
    tune: number | null;
}

// ─── Creator Analytics ───
export interface CreatorAnalytics {
    total_revenue: number;
    total_downloads: number;
    total_sales: number;
    active_listings: number;
    average_rating: number;
    monthly_revenue: { month: string; revenue: number }[];
}
