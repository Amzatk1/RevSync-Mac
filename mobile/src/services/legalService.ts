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
     */
    async getHistory(): Promise<Agreement[]> {
        // Ready for backend integration:
        // return await ApiClient.getInstance().get<Agreement[]>('/users/legal/history/');
        return [];
    },

    /**
     * Record acceptance of a document.
     */
    async acceptDocument(type: 'TERMS' | 'PRIVACY' | 'SAFETY' | 'ANALYTICS', version: string): Promise<any> {
        // Ready for backend integration:
        // return await ApiClient.getInstance().post('/users/legal/accept/', { document_type: type, version });
        return { success: true };
    }
};
