/**
 * Auth types — no longer depends on @supabase/supabase-js.
 * Compatible with our Django JWT backend via SupabaseAuthService.
 */

export interface RevSyncUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role?: 'rider' | 'tuner' | 'admin';
    createdAt: number;
}

export interface AuthState {
    user: RevSyncUser | null;
    isLoading: boolean;
}

export interface UserProfile {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    country?: string;
    experience_level?: string;
    riding_style?: string;
    has_completed_onboarding?: boolean;
    role?: 'rider' | 'tuner' | 'admin';
    created_at?: string;
    updated_at?: string;
}
