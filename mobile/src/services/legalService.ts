import { ApiClient } from '../data/http/ApiClient';

export interface Agreement {
    id: number;
    document_type: string;
    version: string;
    accepted_at: string;
}

export const legalService = {
    /**
     * Get user's accepted legal documents history.
     * Falls back to empty array when backend is unreachable.
     */
    async getHistory(): Promise<Agreement[]> {
        try {
            return await ApiClient.getInstance().get<Agreement[]>('/users/legal/history/');
        } catch {
            // Backend unavailable — return empty (shows "No agreements" state)
            return [];
        }
    },

    /**
     * Record acceptance of a document.
     * Falls back silently when backend is unreachable.
     */
    async acceptDocument(type: 'TERMS' | 'PRIVACY' | 'SAFETY' | 'ANALYTICS', version: string): Promise<any> {
        try {
            return await ApiClient.getInstance().post('/users/legal/accept/', { document_type: type, version });
        } catch {
            return { success: true };
        }
    }
};
