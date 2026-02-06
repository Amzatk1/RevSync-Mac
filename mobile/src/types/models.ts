export interface Vehicle {
    id: number;
    user: number;
    name: string;
    vehicle_type: 'BIKE' | 'CAR';
    make: string;
    model: string;
    year: number;
    vin?: string;
    ecu_type?: string;
    ecu_id?: string;
    ecu_software_version?: string;
    modifications: string[];
    photo_url?: string;
    public_visibility: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Tune {
    id: string; // UUID
    title: string;
    slug?: string;
    description: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year_start: number;
    vehicle_year_end: number;
    price: string;
    tuner_id?: string;
    tuner_name?: string;

    // Optional Extended
    stage?: number;
    horsepower_gain?: number;
    torque_gain?: number;
    file_size_kb?: number;
    safety_rating?: number;

    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    created_at?: string;
    updated_at?: string;
}

export interface TunerProfile {
    id: number;
    user: number;
    business_name: string;
    bio: string;
    website?: string;
    verified: boolean;
    rating: number;
}

export interface VehicleDefinition {
    id: number;
    vehicle_type: 'BIKE' | 'CAR';
    make: string;
    model: string;
    year: number;
    stock_hp: number;
    stock_torque: number;
}
