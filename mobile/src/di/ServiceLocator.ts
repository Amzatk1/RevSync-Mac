// import { BleDeviceService } from '../data/services/BleDeviceService';
import { ApiBikeService } from '../data/services/ApiBikeService';
import { MockDeviceService } from '../data/services/MockDeviceService';
import { SafetyEngine } from '../domain/safety/SafetyEngine';
import { StandardECUService } from '../data/services/StandardECUService';
import { SupabaseAuthService } from '../data/services/SupabaseAuthService';
import { ApiTuneService } from '../data/services/ApiTuneService';
import { ConsoleAnalyticsService } from '../data/services/ConsoleAnalyticsService';
import { CryptoService } from '../data/services/CryptoService';
import { DownloadService } from '../data/services/DownloadService';

// Singleton instances
// Using BleDeviceService for production
// const deviceService = new BleDeviceService();
// Fallback if needed: const deviceService = new MockDeviceService();
const deviceService = new MockDeviceService();

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
