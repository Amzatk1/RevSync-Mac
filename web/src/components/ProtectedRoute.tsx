'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { UserRole } from '@/lib/types';

interface Props {
    children: ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
        if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
            router.replace('/dashboard');
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-text-muted text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
