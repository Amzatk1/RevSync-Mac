import { Tune } from './DomainTypes';
import { FlashSession } from '../entities/FlashSession';

export interface ECUService {
    identifyECU(): Promise<{ ecuId: string; hardwareVersion: string; firmwareVersion: string }>;
    readECU(onProgress?: (percent: number, message?: string) => void): Promise<string>; // Returns path to backup file
    flashTune(tune: Tune, backupPath: string, onProgress?: (percent: number, message?: string) => void): Promise<void>;
    verifyFlash(tune: Tune): Promise<boolean>;
    getSessionState(): FlashSession;
}
