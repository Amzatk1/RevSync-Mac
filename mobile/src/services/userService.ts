import { ApiClient } from '../data/http/ApiClient';

export interface UserProfile {
    id: number;
    bio: string;
    country: string;
    experience_level: string;
    riding_style: string;
    risk_tolerance: string;
    photo_url: string | null;
    has_completed_onboarding: boolean;
}

/**
 * User profile service — connects to Django backend /api/v1/profile/me/.
 * Replaces the old Supabase-based service.
 */
export const userService = {
    /**
     * Fetch the current user's profile.
     * Backend: GET /api/v1/profile/me/
     */
    async getProfile(): Promise<UserProfile | null> {
        try {
            return await ApiClient.getInstance().get<UserProfile>('/v1/profile/me/');
        } catch (e) {
            console.warn('userService: Profile fetch failed', e);
            return null;
        }
    },

    /**
     * Update the current user's profile.
     * Backend: PATCH /api/v1/profile/me/
     */
    async updateProfile(updates: Partial<UserProfile>): Promise<{ error: any }> {
        try {
            await ApiClient.getInstance().patch('/v1/profile/me/', updates);
            return { error: null };
        } catch (e) {
            return { error: e };
        }
    },

    /**
     * Mark onboarding as completed.
     * Backend: PATCH /api/v1/profile/me/
     */
    async completeOnboarding(): Promise<{ error: any }> {
        return this.updateProfile({ has_completed_onboarding: true } as any);
    },

    /**
     * Get another user's public profile.
     * Backend: GET /api/v1/users/<username>/
     */
    async getUserByUsername(username: string): Promise<any | null> {
        try {
            return await ApiClient.getInstance().get<any>(`/v1/users/${username}/`);
        } catch {
            return null;
        }
    },

    /**
     * Follow/unfollow a user.
     * Backend: POST /api/v1/users/<username>/follow/
     */
    async toggleFollow(username: string): Promise<any> {
        return ApiClient.getInstance().post(`/v1/users/${username}/follow/`);
    },

    /**
     * Get/update user preferences.
     * Backend: GET/PATCH /api/v1/preferences/
     */
    async getPreferences(): Promise<any> {
        try {
            return await ApiClient.getInstance().get<any>('/v1/preferences/');
        } catch {
            return {};
        }
    },

    async updatePreferences(updates: Record<string, any>): Promise<any> {
        return ApiClient.getInstance().patch('/v1/preferences/', updates);
    },
};
