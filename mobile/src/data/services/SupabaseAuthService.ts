import { AuthService, AuthResult } from '../../domain/services/AuthService';
import { User } from '../../domain/entities/User';
import { ApiClient } from '../http/ApiClient';

/**
 * Auth service with backend JWT integration.
 *
 * Flow:
 *  1. signIn/signUp → POST to backend → receive JWT access + refresh tokens
 *  2. Store both tokens via ApiClient.setTokens() (persisted in SecureStore)
 *  3. On 401 → ApiClient auto-refreshes using /v1/auth/refresh/
 *
 * NO local bypass — if backend is unreachable, auth fails with a clear error.
 */
export class SupabaseAuthService implements AuthService {

    async signIn(email: string, password: string): Promise<AuthResult> {
        const response = await ApiClient.getInstance().post<{
            access: string;
            refresh: string;
        }>('/v1/auth/login/', { email, password }, { skipAuth: true });

        // Persist both tokens
        await ApiClient.getInstance().setTokens(response.access, response.refresh);

        // Fetch full user profile
        const user = await this.fetchMe();
        if (user) {
            return { success: true, user };
        }

        // Token worked but profile fetch failed — treat as partial success
        return {
            success: true,
            user: {
                id: 'unknown',
                email,
                firstName: email.split('@')[0],
                lastName: '',
                createdAt: Date.now(),
            },
        };
    }

    async signUp(email: string, password: string): Promise<AuthResult> {
        const username = email.split('@')[0] || `user_${Date.now()}`;
        await ApiClient.getInstance().post('/v1/auth/register/', {
            email,
            password,
            username,
            first_name: username,
            last_name: '',
        }, { skipAuth: true });

        // After register, login to get JWT
        return this.signIn(email, password);
    }

    async signOut(): Promise<void> {
        await ApiClient.getInstance().clearTokens();
    }

    async getCurrentUser(): Promise<User | null> {
        // Restore tokens from SecureStore
        const hasTokens = await ApiClient.getInstance().restoreTokens();
        if (!hasTokens) return null;

        // Validate token by fetching user from backend
        try {
            const user = await this.fetchMe();
            return user;
        } catch (e) {
            console.warn('AuthService: Token validation failed', e);
            // Token is invalid and refresh failed — clear everything
            await ApiClient.getInstance().clearTokens();
            return null;
        }
    }

    async resetPassword(_email: string): Promise<boolean> {
        // TODO: Implement password reset via backend
        return false;
    }

    // ─── Helpers ────────────────────────────────────────────────

    private async fetchMe(): Promise<User | null> {
        try {
            const data = await ApiClient.getInstance().get<{
                id: number;
                email: string;
                username: string;
                first_name: string;
                last_name: string;
                role?: string;
                profile?: {
                    bio?: string;
                    photo_url?: string;
                    country?: string;
                    experience_level?: string;
                    riding_style?: string;
                };
            }>('/v1/users/me/');

            return {
                id: String(data.id),
                email: data.email,
                firstName: data.first_name,
                lastName: data.last_name,
                avatarUrl: data.profile?.photo_url || undefined,
                createdAt: Date.now(),
            };
        } catch {
            return null;
        }
    }
}
