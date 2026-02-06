import { AnalyticsService } from '../../domain/services/AnalyticsService';

export class ConsoleAnalyticsService implements AnalyticsService {
    logEvent(eventName: string, params?: Record<string, any>): void {
        console.log(`[Telemetry] ${eventName}`, params || '');
    }

    setUser(userId: string): void {
        console.log(`[Telemetry] User set: ${userId}`);
    }
}
