const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiRequestConfig extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
    timeout?: number;
}

class ApiClient {
    private static instance: ApiClient;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private refreshPromise: Promise<string | null> | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('revsync_access');
            this.refreshToken = localStorage.getItem('revsync_refresh');
        }
    }

    static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }

    setTokens(access: string, refresh: string) {
        this.accessToken = access;
        this.refreshToken = refresh;
        if (typeof window !== 'undefined') {
            localStorage.setItem('revsync_access', access);
            localStorage.setItem('revsync_refresh', refresh);
        }
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('revsync_access');
            localStorage.removeItem('revsync_refresh');
        }
    }

    getAccessToken() { return this.accessToken; }

    async get<T>(path: string, config?: ApiRequestConfig): Promise<T> {
        let url = path;
        if (config?.params) {
            const sp = new URLSearchParams();
            for (const [k, v] of Object.entries(config.params)) {
                if (v !== undefined && v !== null) sp.append(k, String(v));
            }
            const qs = sp.toString();
            if (qs) url = `${path}?${qs}`;
        }
        return this.request<T>(url, { ...config, method: 'GET' });
    }

    async post<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, {
            ...config,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, {
            ...config,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, {
            ...config,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(path: string, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, { ...config, method: 'DELETE' });
    }

    private async request<T>(path: string, config: ApiRequestConfig, isRetry = false): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 15000);

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
                ...((config.headers as Record<string, string>) || {}),
            };

            const response = await fetch(`${BASE_URL}${path}`, {
                ...config,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // Token expired — try to refresh once
            if (response.status === 401 && !isRetry && this.refreshToken) {
                const newToken = await this.tryRefresh();
                if (newToken) {
                    return this.request<T>(path, config, true);
                }
                // Refresh failed — force logout
                this.clearTokens();
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('revsync_auth_notice', 'Session expired. Please sign in again.');
                    window.location.href = '/login?reason=session-expired';
                }
                throw { code: 'AUTH_EXPIRED', message: 'Session expired', uiMessage: 'Please sign in again.' };
            }

            if (!response.ok) {
                let errorData: Record<string, unknown>;
                try { errorData = await response.json(); } catch { errorData = { message: response.statusText }; }
                throw {
                    code: 'API_ERROR',
                    status: response.status,
                    message: `Request failed: ${response.status}`,
                    uiMessage: (errorData.detail as string) || (errorData.message as string) || 'Something went wrong.',
                    data: errorData,
                };
            }

            if (response.status === 204) return {} as T;
            return await response.json();

        } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error && typeof error === 'object' && 'name' in error && (error as { name: string }).name === 'AbortError') {
                throw { code: 'TIMEOUT', message: 'Request timed out', uiMessage: 'The request took too long.' };
            }
            if (error && typeof error === 'object' && 'code' in error) throw error;
            const e = error as Error;
            throw {
                code: 'NETWORK_ERROR',
                message: e?.message || 'Network request failed',
                uiMessage: 'Network error — check your connection.',
            };
        }
    }

    private async tryRefresh(): Promise<string | null> {
        // Deduplicate concurrent refresh calls
        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = (async () => {
            try {
                const res = await fetch(`${BASE_URL}/v1/auth/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: this.refreshToken }),
                });
                if (!res.ok) return null;
                const data = await res.json();
                this.accessToken = data.access;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('revsync_access', data.access);
                }
                return data.access as string;
            } catch {
                return null;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }
}

export const api = ApiClient.getInstance();
export default api;
