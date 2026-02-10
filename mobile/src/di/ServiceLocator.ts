// import { BleDeviceService } from '../data/services/BleDeviceService';
import { ApiBikeService } from '../data/services/ApiBikeService';
import { MockDeviceService } from '../data/services/MockDeviceService';
import { SafetyEngine } from '../domain/safety/SafetyEngine';
import { StandardECUService } from '../data/services/StandardECUService';
import { SupabaseAuthService } from '../data/services/SupabaseAuthService';
import { ApiTuneService } from '../data/services/ApiTuneService';
import { ConsoleAnalyticsService } from '../data/services/ConsoleAnalyticsService';
import { DeviceService } from '../domain/services/DeviceService';

// Singleton instances
// Using BleDeviceService for production
// const deviceService = new BleDeviceService();
// Fallback if needed: const deviceService: DeviceService = new MockDeviceService();
const deviceService: DeviceService = new MockDeviceService();

const tuneService = new ApiTuneService();
const bikeService = new ApiBikeService();
const validationService = new SafetyEngine();
const ecuService = new StandardECUService(deviceService, validationService);
const authService = new SupabaseAuthService();
const analyticsService = new ConsoleAnalyticsService();

export const ServiceLocator = {
    getDeviceService: () => deviceService,
    getTuneService: () => tuneService,
    getBikeService: () => bikeService,
    getValidationService: () => validationService,
    getECUService: () => ecuService,
    getAuthService: () => authService,
    getAnalyticsService: () => analyticsService,
};
