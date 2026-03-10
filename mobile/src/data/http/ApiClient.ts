import { AppError } from '../../domain/types/common';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const ACCESS_TOKEN_KEY = 'revsync_access_token';
const REFRESH_TOKEN_KEY = 'revsync_refresh_token';

interface ApiRequestConfig extends RequestInit {
    timeout?: number;
    params?: Record<string, string | number | boolean | undefined>;
    skipAuth?: boolean;
}

export class ApiClient {
    private static instance: ApiClient;
    private authToken: string | null = null;
    private refreshToken: string | null = null;
    private refreshPromise: Promise<boolean> | null = null;

    private constructor() { }

    static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }

    setAuthToken(token: string) {
        this.authToken = token;
    }

    setRefreshToken(token: string) {
        this.refreshToken = token;
    }

    getAuthToken(): string | null {
        return this.authToken;
    }

    /**
     * Persist both tokens to SecureStore + set on the client instance.
     */
    async setTokens(access: string, refresh: string) {
        this.authToken = access;
        this.refreshToken = refresh;
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
    }

    /**
     * Restore tokens from SecureStore on app startup.
     */
    async restoreTokens(): Promise<boolean> {
        try {
            const access = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
            const refresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (access) {
                this.authToken = access;
                this.refreshToken = refresh;
                return true;
            }
        } catch (e) {
            console.warn('ApiClient: Failed to restore tokens', e);
        }
        return false;
    }

    /**
     * Clear all tokens (on logout).
     */
    async clearTokens() {
        this.authToken = null;
        this.refreshToken = null;
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }

    // ─── HTTP Methods ─────────────────────────────────────────────

    async get<T>(path: string, config?: ApiRequestConfig): Promise<T> {
        let url = path;
        if (config?.params) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(config.params)) {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            }
            const qs = searchParams.toString();
            if (qs) url = `${path}?${qs}`;
        }
        return this.request<T>(url, { ...config, method: 'GET' });
    }

    async post<T>(path: string, body?: any, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, {
            ...config,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async put<T>(path: string, body?: any, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, {
            ...config,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    async patch<T>(path: string, body?: any, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, {
            ...config,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    async delete<T>(path: string, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, { ...config, method: 'DELETE' });
    }

    // ─── Core Request with Auto-Refresh ──────────────────────────

    private async request<T>(path: string, config: ApiRequestConfig, isRetry = false): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 15000);

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(this.authToken && !config.skipAuth ? { Authorization: `Bearer ${this.authToken}` } : {}),
                ...config.headers,
            };

            const response = await fetch(`${BASE_URL}${path}`, {
                ...config,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // ── Handle 401 → attempt token refresh ──
            if (response.status === 401 && this.refreshToken && !config.skipAuth && !isRetry) {
                const refreshed = await this.attemptTokenRefresh();
                if (refreshed) {
                    // Retry the original request with new token
                    return this.request<T>(path, { ...config, skipAuth: false }, true);
                }
                // Refresh failed — throw auth error
                await this.clearTokens();
                throw {
                    code: 'AUTH_ERROR',
                    message: 'Session expired',
                    uiMessage: 'Your session has expired. Please sign in again.',
                } as AppError;
            }

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: response.statusText };
                }

                throw {
                    code: 'API_ERROR',
                    message: `Request failed with status ${response.status}`,
                    uiMessage: errorData.detail || errorData.message || 'Something went wrong.',
                    data: errorData,
                    status: response.status,
                    originalError: errorData,
                } as AppError;
            }

            // 204 No Content
            if (response.status === 204) return {} as T;

            return await response.json();

        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw {
                    code: 'TIMEOUT',
                    message: 'Request timed out',
                    uiMessage: 'The request took too long. Please check your connection.',
                } as AppError;
            }

            // Re-throw AppErrors
            if (error.code) throw error;

            // Normalize unknown errors
            throw {
                code: 'NETWORK_ERROR',
                message: error.message || 'Network request failed',
                uiMessage: 'Network error. Please check your internet connection.',
                originalError: error,
            } as AppError;
        }
    }

    // ─── Token Refresh ──────────────────────────────────────────

    private async attemptTokenRefresh(): Promise<boolean> {
        // Deduplicate concurrent refresh attempts
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefresh();
        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async doRefresh(): Promise<boolean> {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${BASE_URL}/v1/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: this.refreshToken }),
            });

            if (!response.ok) {
                console.warn('ApiClient: Token refresh returned', response.status);
                await this.clearTokens();
                return false;
            }

            const data = await response.json();
            if (data.access) {
                this.authToken = data.access;
                await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.access);
                // Some backends also rotate refresh tokens
                if (data.refresh) {
                    this.refreshToken = data.refresh;
                    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh);
                }
                return true;
            }
            return false;
        } catch (e) {
            console.warn('ApiClient: Token refresh failed', e);
            await this.clearTokens();
            return false;
        }
    }
}
