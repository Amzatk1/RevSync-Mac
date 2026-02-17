import { AuthService, AuthResult } from '../../domain/services/AuthService';
import { User } from '../../domain/entities/User';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'revsync_session';

/**
 * Auth service — bypassed for testing.
 * Any email/password combination succeeds.
 * Session persists across restarts via SecureStore.
 */
export class SupabaseAuthService implements AuthService {

    async signIn(email: string, _password: string): Promise<AuthResult> {
        const user: User = {
            id: `user-${Date.now()}`,
            email,
            firstName: email.split('@')[0] || 'Rider',
            lastName: '',
            createdAt: Date.now(),
        };

        await this.saveSession(user);
        return { success: true, user };
    }

    async signUp(email: string, _password: string): Promise<AuthResult> {
        const user: User = {
            id: `user-${Date.now()}`,
            email,
            firstName: email.split('@')[0] || 'Rider',
            lastName: '',
            createdAt: Date.now(),
        };

        await this.saveSession(user);
        return { success: true, user };
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

    async resetPassword(_email: string): Promise<boolean> {
        return true;
    }

    private async saveSession(user: User) {
        try {
            await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    }
}
