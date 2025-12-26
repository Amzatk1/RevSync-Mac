import { supabase } from './supabase';
import { UserProfile } from '../auth/types';

export const userService = {
    /**
     * Fetch the user's profile from the 'profiles' table.
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return data as UserProfile;
        } catch (e) {
            console.error('Unexpected error fetching profile:', e);
            return null;
        }
    },

    /**
     * Create or update a user profile.
     */
    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: any }> {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });

            return { error };
        } catch (e) {
            return { error: e };
        }
    },

    /**
     * Mark onboarding as completed for the user.
     */
    async completeOnboarding(userId: string): Promise<{ error: any }> {
        return this.updateProfile(userId, { has_completed_onboarding: true } as any);
    }
};
