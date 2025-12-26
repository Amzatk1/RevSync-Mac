import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
}

export interface UserProfile {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    has_completed_onboarding?: boolean;
    role?: 'rider' | 'tuner' | 'admin';
    created_at?: string;
    updated_at?: string;
}
