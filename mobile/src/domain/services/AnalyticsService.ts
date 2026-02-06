export interface AnalyticsService {
    logEvent(eventName: string, params?: Record<string, any>): void;
    setUser(userId: string): void;
}
