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

interface PreferencesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Array<{ key: string; value: unknown }>;
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
            const profile = await ApiClient.getInstance().get<Partial<UserProfile>>('/v1/profile/me/');
            return {
                id: profile.id ?? 0,
                bio: profile.bio ?? '',
                country: profile.country ?? '',
                experience_level: profile.experience_level ?? '',
                riding_style: profile.riding_style ?? '',
                risk_tolerance: profile.risk_tolerance ?? '',
                photo_url: profile.photo_url ?? null,
                has_completed_onboarding: profile.has_completed_onboarding ?? false,
            };
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
     * Onboarding completion is tracked locally in the mobile app store.
     */
    async completeOnboarding(): Promise<{ error: any }> {
        try {
            await ApiClient.getInstance().patch('/v1/profile/me/', {
                has_completed_onboarding: true,
            });
            return { error: null };
        } catch (e) {
            return { error: e };
        }
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
    async toggleFollow(username: string, action: 'follow' | 'unfollow'): Promise<any> {
        return ApiClient.getInstance().post(`/v1/users/${username}/follow/`, { action });
    },

    /**
     * Get/update user preferences.
     * Backend: GET/PATCH /api/v1/preferences/
     */
    async getPreferences(): Promise<any> {
        try {
            const response = await ApiClient.getInstance().get<PreferencesResponse>('/v1/preferences/');
            return Object.fromEntries(response.results.map((item) => [item.key, item.value]));
        } catch {
            return {};
        }
    },

    async updatePreferences(updates: Record<string, any>): Promise<any> {
        const entries = Object.entries(updates);
        const results = await Promise.all(
            entries.map(([key, value]) =>
                ApiClient.getInstance().post('/v1/preferences/', { key, value })
            )
        );
        return Object.fromEntries(entries.map(([key], index) => [key, results[index]]));
    },
};
