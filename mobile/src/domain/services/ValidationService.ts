import { SafetyReport } from '../entities/SafetyReport';
import { Bike, Tune } from './DomainTypes';

export interface ValidationService {
    validateTuneForBike(tune: Tune, bike: Bike | null): Promise<SafetyReport>;
    checkPreFlash(): Promise<SafetyReport>;
}
