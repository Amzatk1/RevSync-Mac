import React, { createContext, useContext, useEffect, useState } from 'react';
import { ServiceLocator } from '../../di/ServiceLocator';
import { userService } from '../../services/userService';
import type { RevSyncUser, UserProfile } from '../types';

interface AuthContextType {
    user: RevSyncUser | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    signIn: async () => ({}),
    signUp: async () => ({}),
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<RevSyncUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const authService = ServiceLocator.getAuthService();

    const fetchProfile = async () => {
        const userProfile = await userService.getProfile();
        if (userProfile) {
            setProfile({
                id: String(userProfile.id || ''),
                bio: userProfile.bio,
                country: userProfile.country,
                experience_level: userProfile.experience_level,
                riding_style: userProfile.riding_style,
                has_completed_onboarding: userProfile.has_completed_onboarding ?? false,
            });
        }
    };

    // On mount: try to restore session from SecureStore
    useEffect(() => {
        (async () => {
            try {
                const restoredUser = await authService.getCurrentUser();
                if (restoredUser) {
                    setUser({
                        id: restoredUser.id,
                        email: restoredUser.email,
                        firstName: restoredUser.firstName ?? '',
                        lastName: restoredUser.lastName ?? '',
                        avatarUrl: restoredUser.avatarUrl,
                        createdAt: restoredUser.createdAt,
                    });
                    await fetchProfile();
                }
            } catch (e) {
                console.warn('AuthContext: Session restore failed', e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
        try {
            const result = await authService.signIn(email, password);
            if (result.success && result.user) {
                setUser({
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName ?? '',
                    lastName: result.user.lastName ?? '',
                    avatarUrl: result.user.avatarUrl,
                    createdAt: result.user.createdAt,
                });
                await fetchProfile();
                return {};
            }
            return { error: 'Sign in failed' };
        } catch (e: any) {
            return { error: e.uiMessage || e.message || 'Sign in failed' };
        }
    };

    const signUp = async (email: string, password: string): Promise<{ error?: string }> => {
        try {
            const result = await authService.signUp(email, password);
            if (result.success && result.user) {
                setUser({
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName ?? '',
                    lastName: result.user.lastName ?? '',
                    avatarUrl: result.user.avatarUrl,
                    createdAt: result.user.createdAt,
                });
                await fetchProfile();
                return {};
            }
            return { error: 'Sign up failed' };
        } catch (e: any) {
            return { error: e.uiMessage || e.message || 'Sign up failed' };
        }
    };

    const signOut = async () => {
        await authService.signOut();
        setProfile(null);
        setUser(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile();
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, signIn, signUp, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
