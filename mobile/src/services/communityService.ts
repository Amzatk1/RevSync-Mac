import { ApiClient } from '../data/http/ApiClient';

export interface Topic {
    id: number;
    title: string;
    author: string;
    replies_count: number;
    created_at: string;
}

export const communityService = {
    /**
     * Get trending topics.
     * Currently returns placeholder data until community backend endpoint is ready.
     */
    async getTrendingTopics(): Promise<Topic[]> {
        try {
            // Ready for backend — uncomment when endpoint exists:
            // return await ApiClient.getInstance().get<Topic[]>('/community/topics/trending/');

            return new Promise(resolve => {
                setTimeout(() => {
                    resolve([
                        { id: 1, title: '🔥 Best exhaust for R6?', author: 'Rider1', replies_count: 245, created_at: '2h ago' },
                        { id: 2, title: '🔧 ECU Flash vs Power Commander', author: 'TechGuru', replies_count: 128, created_at: '5h ago' },
                        { id: 3, title: 'Track Day Prep Guide', author: 'SpeedDemon', replies_count: 89, created_at: '1d ago' },
                    ]);
                }, 500);
            });
        } catch (error) {
            console.error('Error fetching topics:', error);
            return [];
        }
    }
};
