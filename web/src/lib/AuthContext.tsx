'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import type { User, LoginRequest, RegisterRequest } from '@/lib/types';

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextValue extends AuthState {
    login: (creds: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

    const fetchUser = useCallback(async () => {
        try {
            const user = await api.get<User>('/v1/users/me/');
            setState({ user, loading: false, error: null });
        } catch {
            setState({ user: null, loading: false, error: null });
        }
    }, []);

    // On mount — if we have a token, fetch the user
    useEffect(() => {
        if (api.getAccessToken()) {
            fetchUser();
        } else {
            setState({ user: null, loading: false, error: null });
        }
    }, [fetchUser]);

    const login = async (creds: LoginRequest) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const res = await api.post<{ access: string; refresh: string }>('/v1/auth/login/', creds);
            api.setTokens(res.access, res.refresh);
            await fetchUser();
        } catch (err: unknown) {
            const e = err as { uiMessage?: string };
            setState(prev => ({ ...prev, loading: false, error: e?.uiMessage || 'Login failed' }));
            throw err;
        }
    };

    const register = async (data: RegisterRequest) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await api.post('/v1/auth/register/', data);
            // Auto-login after registration
            const res = await api.post<{ access: string; refresh: string }>('/v1/auth/login/', {
                email: data.email,
                password: data.password,
            });
            api.setTokens(res.access, res.refresh);
            await fetchUser();
        } catch (err: unknown) {
            const e = err as { uiMessage?: string };
            setState(prev => ({ ...prev, loading: false, error: e?.uiMessage || 'Registration failed' }));
            throw err;
        }
    };

    const logout = () => {
        api.clearTokens();
        setState({ user: null, loading: false, error: null });
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    const refreshUser = fetchUser;

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
