import { AuthService, AuthResult } from '../../domain/services/AuthService';
import { User } from '../../domain/entities/User';
import { createClient } from '@supabase/supabase-js';

// NOTE: Replace these with actual environment variables in production
const SUPABASE_URL = 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = 'public-anon-key';

export class SupabaseAuthService implements AuthService {
    private supabase;

    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    async signIn(email: string, password: string): Promise<AuthResult> {
        // START: Mock logic for prototype (Supabase requires real creds)
        if (email === 'demo@revsync.com' && password === 'garage') {
            return {
                success: true,
                user: {
                    id: 'mock-user-123',
                    email: email,
                    firstName: 'RevSync',
                    lastName: 'Rider',
                    createdAt: Date.now(),
                }
            };
        }

        // Test User Hardcode
        if (email === 'Amzatk1' && password === 'Hamzaayo1312') {
            return {
                success: true,
                user: {
                    id: 'test-user-001',
                    email: email,
                    firstName: 'Hamza',
                    lastName: 'User',
                    createdAt: Date.now(),
                }
            };
        }
        // END: Mock logic

        /* Real Implementation:
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        });
    
        if (error) return { success: false, error: error.message };
        
        return {
          success: true,
          user: this.mapUser(data.user)
        };
        */

        return { success: false, error: 'Invalid credentials (try demo@revsync.com / garage)' };
    }

    async signUp(email: string, password: string): Promise<AuthResult> {
        // START: Mock logic
        return {
            success: true,
            user: {
                id: 'new-user-' + Date.now(),
                email,
                createdAt: Date.now()
            }
        };
        // END: Mock logic

        /* Real Implementation:
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, user: this.mapUser(data.user) };
        */
    }

    async signOut(): Promise<void> {
        // await this.supabase.auth.signOut();
    }

    async getCurrentUser(): Promise<User | null> {
        // For now, return null to force login flow on reload
        return null;
        /*
        const { data: { user } } = await this.supabase.auth.getUser();
        return user ? this.mapUser(user) : null;
        */
    }

    async resetPassword(email: string): Promise<boolean> {
        // const { error } = await this.supabase.auth.resetPasswordForEmail(email);
        // return !error;
        return true;
    }

    private mapUser(supabaseUser: any): User {
        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            createdAt: new Date(supabaseUser.created_at).getTime(),
        };
    }
}
