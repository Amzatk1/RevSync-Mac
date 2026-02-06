import { AppError } from '../../domain/types/common';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.revsync.com/v1';

interface ApiRequestConfig extends RequestInit {
    timeout?: number;
}

export class ApiClient {
    private static instance: ApiClient;
    private authToken: string | null = null;

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

    async get<T>(path: string, config?: ApiRequestConfig): Promise<T> {
        return this.request<T>(path, { ...config, method: 'GET' });
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

    // ... put, delete, etc.

    private async request<T>(path: string, config: ApiRequestConfig): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 100000); // Default 10s timeout

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
                ...config.headers,
            };

            const response = await fetch(`${BASE_URL}${path}`, {
                ...config,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Try to parse error response
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: response.statusText };
                }

                throw {
                    code: 'API_ERROR',
                    message: `Request failed with status ${response.status}`,
                    uiMessage: errorData.message || 'Something went wrong.',
                    originalError: errorData,
                } as AppError;
            }

            // For 204 No Content
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
}
