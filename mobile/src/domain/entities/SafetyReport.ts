export interface SafetyReport {
    score: number; // 0-100
    blockers: string[];
    warnings: string[];
    requiredActions: string[];
    timestamp: number;
}
