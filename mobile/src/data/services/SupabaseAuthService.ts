import { AuthService, AuthResult } from '../../domain/services/AuthService';
import { User } from '../../domain/entities/User';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// NOTE: Replace these with actual environment variables in production
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'revsync_session';

export class SupabaseAuthService implements AuthService {
    private supabase;

    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    async signIn(email: string, password: string): Promise<AuthResult> {
        // START: Mock logic for prototype (Supabase requires real creds)
        if ((email === 'demo@revsync.com' && password === 'garage') || (email === 'Amzatk1' && password === 'Hamzaayo1312')) {
            const user: User = {
                id: email === 'Amzatk1' ? 'test-user-001' : 'mock-user-123',
                email: email,
                firstName: email === 'Amzatk1' ? 'Hamza' : 'RevSync',
                lastName: email === 'Amzatk1' ? 'User' : 'Rider',
                createdAt: Date.now(),
            };

            // Persist session securely
            await this.saveSession(user);

            return {
                success: true,
                user
            };
        }
        // END: Mock logic

        return { success: false, error: 'Invalid credentials. Try demo@revsync.com / garage' };
    }

    async signUp(email: string, password: string): Promise<AuthResult> {
        // START: Mock logic
        const user: User = {
            id: 'new-user-' + Date.now(),
            email,
            createdAt: Date.now()
        };

        await this.saveSession(user);

        return {
            success: true,
            user
        };
    }

    async signOut(): Promise<void> {
        await SecureStore.deleteItemAsync(SESSION_KEY);
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
            if (sessionStr) {
                return JSON.parse(sessionStr);
            }
        } catch (e) {
            console.error('Failed to restore session', e);
        }
        return null;
    }

    async resetPassword(email: string): Promise<boolean> {
        return true;
    }

    private async saveSession(user: User) {
        try {
            await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    }

    private mapUser(supabaseUser: any): User {
        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            createdAt: new Date(supabaseUser.created_at).getTime(),
        };
    }
}
