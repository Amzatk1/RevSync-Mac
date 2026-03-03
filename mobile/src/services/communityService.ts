import { ApiClient } from '../data/http/ApiClient';

export interface Topic {
    id: number;
    title: string;
    author: string;
    replies_count: number;
    created_at: string;
}

export interface Conversation {
    id: number;
    participants: string[];
    last_message?: string;
    updated_at: string;
}

/**
 * Community & Chat service — connects to Django backend.
 * Chat endpoints: /api/chat/...
 *
 * Note: 'topics/trending' has no backend endpoint yet — returns empty gracefully.
 */
export const communityService = {
    /**
     * Get trending topics (placeholder until backend adds this endpoint).
     */
    async getTrendingTopics(): Promise<Topic[]> {
        try {
            return await ApiClient.getInstance().get<Topic[]>('/chat/topics/trending/');
        } catch {
            // Endpoint may not exist yet — return empty gracefully
            return [];
        }
    },

    /**
     * Get user's conversations.
     * Backend: GET /api/chat/conversations/
     */
    async getConversations(): Promise<Conversation[]> {
        try {
            return await ApiClient.getInstance().get<Conversation[]>('/chat/conversations/');
        } catch {
            return [];
        }
    },

    /**
     * Get messages in a conversation.
     * Backend: GET /api/chat/conversations/<id>/messages/
     */
    async getMessages(conversationId: number): Promise<any[]> {
        try {
            return await ApiClient.getInstance().get<any[]>(
                `/chat/conversations/${conversationId}/messages/`
            );
        } catch {
            return [];
        }
    },

    /**
     * Send a message in a conversation.
     * Backend: POST /api/chat/conversations/<id>/messages/
     */
    async sendMessage(conversationId: number, content: string): Promise<any> {
        return ApiClient.getInstance().post(
            `/chat/conversations/${conversationId}/messages/`,
            { content }
        );
    },

    /**
     * Start a new chat with a user.
     * Backend: POST /api/chat/start/<username>/
     */
    async startChat(username: string): Promise<Conversation> {
        return ApiClient.getInstance().post<Conversation>(`/chat/start/${username}/`);
    },
};
