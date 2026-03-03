import { ApiClient } from '../data/http/ApiClient';

export interface Agreement {
    id: number;
    document_type: string;
    version: string;
    accepted_at: string;
}

/**
 * Legal documents service — connects to Django backend.
 * All endpoints under /api/v1/legal/...
 */
export const legalService = {
    /**
     * Get user's accepted legal documents history.
     * Backend: GET /api/v1/legal/history/
     */
    async getHistory(): Promise<Agreement[]> {
        try {
            return await ApiClient.getInstance().get<Agreement[]>('/v1/legal/history/');
        } catch {
            return [];
        }
    },

    /**
     * Record acceptance of a document.
     * Backend: POST /api/v1/legal/accept/
     */
    async acceptDocument(
        type: 'TERMS' | 'PRIVACY' | 'SAFETY' | 'ANALYTICS',
        version: string
    ): Promise<any> {
        return ApiClient.getInstance().post('/v1/legal/accept/', {
            document_type: type,
            version,
        });
    },
};
