export interface FlashSession {
    id: string;
    startTime: number;
    status: 'initializing' | 'backing_up' | 'flashing' | 'verifying' | 'completed' | 'failed';
    progress: number;
    log: string[];
}
