import { BleDeviceService } from '../data/services/BleDeviceService';
import { MockBikeService, MockTuneService } from '../data/services/MockServices';
import { MockDeviceService } from '../data/services/MockDeviceService';
import { SafetyEngine } from '../domain/safety/SafetyEngine';
import { StandardECUService } from '../data/services/StandardECUService';
import { SupabaseAuthService } from '../data/services/SupabaseAuthService';
import { ApiTuneService } from '../data/services/ApiTuneService';

// Singleton instances
// Singleton instances
// NOTE: Using MockDeviceService because the native build is missing or failing.
// This allows the app to run in Expo Go / Simulator without crashing.
// const deviceService = new BleDeviceService();
const deviceService = new MockDeviceService();

// Use ApiTuneService for real data simulation
// const tuneService = new MockTuneService();
const tuneService = new ApiTuneService();
const bikeService = new MockBikeService();
const validationService = new SafetyEngine();
const ecuService = new StandardECUService(deviceService, validationService);
const authService = new SupabaseAuthService();

export const ServiceLocator = {
    getDeviceService: () => deviceService,
    getTuneService: () => tuneService,
    getBikeService: () => bikeService,
    getValidationService: () => validationService,
    getECUService: () => ecuService,
    getAuthService: () => authService,
};
