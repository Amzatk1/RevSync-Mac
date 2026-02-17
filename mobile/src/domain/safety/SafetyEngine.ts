import { Bike, Tune } from '../services/DomainTypes';
import { ValidationService } from '../services/ValidationService';
import { SafetyReport } from '../entities/SafetyReport';

export class SafetyEngine implements ValidationService {

    async validateTuneForBike(tune: Tune, bike: Bike | null): Promise<SafetyReport> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const actions: string[] = [];
        let score = 100;

        // 1. Basic Check
        if (!bike) {
            errors.push('No active bike selected.');
            score = 0;
            return this.createReport(score, errors, warnings, actions);
        }

        // 2. ID Match
        if (tune.bikeId !== bike.id) {
            errors.push(`Tune ID (${tune.bikeId}) does not match Bike ID (${bike.id}).`);
            score -= 50;
        }

        // 3. ECU Compatibility
        if (bike.ecuId) {
            const isCompatible = tune.compatibilityRaw.includes(bike.ecuId);
            if (!isCompatible) {
                errors.push(`Tune not compatible with ECU HW ID: ${bike.ecuId}`);
                score = 0;
            }
        } else {
            warnings.push('ECU not identified yet. Compatibility cannot be fully verified.');
            actions.push('IDENTIFY_ECU');
            score -= 10;
        }

        // 4. Safety Rating
        if (tune.safetyRating < 80) {
            warnings.push(`Tune safety rating is low (${tune.safetyRating}/100).`);
            score -= (100 - tune.safetyRating);
        }

        // 5. Version Check
        if (tune.version.startsWith('0.')) {
            warnings.push('This is a beta tune version.');
            score -= 10;
        }

        return this.createReport(Math.max(0, score), errors, warnings, actions);
    }

    async checkPreFlash(): Promise<SafetyReport> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const actions: string[] = [];
        let score = 100;

        // Battery Check (simulation — requires expo-battery in production)
        const batteryLevel = 0.8;
        if (batteryLevel < 0.2) {
            errors.push('Phone battery critical (< 20%). Connect charger.');
            score = 0;
        } else if (batteryLevel < 0.5) {
            warnings.push('Phone battery low. Recommended to charge.');
        }

        // Device connection verified through DeviceService in production

        return this.createReport(score, errors, warnings, actions);
    }

    private createReport(score: number, blockers: string[], warnings: string[], requiredActions: string[]): SafetyReport {
        return {
            score,
            blockers,
            warnings,
            requiredActions,
            timestamp: Date.now(),
        };
    }
}
