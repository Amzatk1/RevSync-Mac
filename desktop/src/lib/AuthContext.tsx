import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from './api';

interface User {
    id: number; email: string; username: string; first_name: string; last_name: string;
    role?: string;
}

interface AuthCtx {
    user: User | null; isLoading: boolean;
    login: (email: string, password: string) => Promise<string | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, isLoading: true, login: async () => null, logout: () => { } });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (api.getAccessToken()) {
            api.get<User>('/v1/users/me/').then(setUser).catch(() => api.clearTokens()).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string): Promise<string | null> => {
        try {
            const res = await api.post<{ access: string; refresh: string }>('/v1/auth/login/', { email, password });
            api.setTokens(res.access, res.refresh);
            const me = await api.get<User>('/v1/users/me/');
            setUser(me);
            return null;
        } catch (e: any) { return e.uiMessage || 'Login failed'; }
    };

    const logout = () => { api.clearTokens(); setUser(null); };

    return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
