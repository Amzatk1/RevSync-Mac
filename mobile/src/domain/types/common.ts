export type Result<T> =
    | { success: true; data: T }
    | { success: false; error: AppError };

export interface AppError {
    code: string;
    message: string;
    uiMessage?: string; // Friendly message for users
    originalError?: any;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    hasMore: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
