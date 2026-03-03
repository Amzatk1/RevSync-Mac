import { ApiBikeService } from '../data/services/ApiBikeService';
import { MockDeviceService } from '../data/services/MockDeviceService';
import { SafetyEngine } from '../domain/safety/SafetyEngine';
import { StandardECUService } from '../data/services/StandardECUService';
import { SupabaseAuthService } from '../data/services/SupabaseAuthService';
import { ApiTuneService } from '../data/services/ApiTuneService';
import { ConsoleAnalyticsService } from '../data/services/ConsoleAnalyticsService';
import { CryptoService } from '../data/services/CryptoService';
import { DownloadService } from '../data/services/DownloadService';
import type { DeviceService } from '../domain/services/DeviceService';

// Singleton instances
// DEV: MockDeviceService for Expo Go — never ships in release builds
// PRODUCTION: BleDeviceService (requires expo-dev-client native build)
const deviceService: DeviceService = __DEV__
    ? new MockDeviceService()
    : new (require('../data/services/BleDeviceService').BleDeviceService)();

const tuneService = new ApiTuneService();
const bikeService = new ApiBikeService();
const validationService = new SafetyEngine();
const ecuService = new StandardECUService(deviceService, validationService);
const authService = new SupabaseAuthService();
const analyticsService = new ConsoleAnalyticsService();

// New Phase 2 services
const cryptoService = new CryptoService();
const downloadService = new DownloadService(cryptoService);

export const ServiceLocator = {
    getDeviceService: () => deviceService,
    getTuneService: () => tuneService,
    getBikeService: () => bikeService,
    getValidationService: () => validationService,
    getECUService: () => ecuService,
    getAuthService: () => authService,
    getAnalyticsService: () => analyticsService,

    // Phase 2: Crypto & Download
    getCryptoService: () => cryptoService,
    getDownloadService: () => downloadService,
};
