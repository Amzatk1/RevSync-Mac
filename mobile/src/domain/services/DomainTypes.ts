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
    id: string;
    title: string;
    bikeId: string; // ID of the compatible bike model
    stage: number; // 1, 2, 3
    price: number; // in USD
    safetyRating: number; // 0-100
    compatibilityRaw: string[]; // List of ECU HW/SW IDs
    description?: string;
    modificationsRequired?: string[];
    octaneRequired?: number;
    version: string;
    checksum?: string;
}

export interface TuneFilter {
    searchQuery?: string;
    minStage?: number;
    maxStage?: number;
    compatibleBikeId?: string; // If set, only show tunes for this bike
    onlySafe?: boolean; // If true, rating > 80
}

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
    // Legacy support or new features
    getTunesForBike(bikeId: string): Promise<Tune[]>;
    purchaseTune(tuneId: string): Promise<void>;
    downloadTune(tuneId: string): Promise<string>;
    downloadTune(tuneId: string): Promise<string>;
    verifyTuneIntegrity(tune: Tune): Promise<boolean>;
    importTune(tune: Tune): Promise<void>;
}
