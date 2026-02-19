'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { AuthUser, UserRole } from '@/types';
import { auth } from '@/lib/firebase/config';

// ============================================================
// Auth Context Types
// ============================================================

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isStudio: boolean;
    isClient: boolean;
    isAdmin: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    googleLogin: () => Promise<void>;
    logout: () => Promise<void>;
}

// ============================================================
// Auth Context
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// Auth Provider
// ============================================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { data: session, status } = useSession();

    // Sign in to Firebase Auth when session has a token
    React.useEffect(() => {
        const syncFirebase = async () => {
            const token = session?.firebaseToken;

            if (token && auth) {
                try {
                    const currentUser = auth.currentUser;

                    if (!currentUser || currentUser.uid !== session?.user.id) {
                        const { signInWithCustomToken } = await import('firebase/auth');
                        await signInWithCustomToken(auth, token);
                    }
                } catch (err: unknown) {
                    console.error('[AuthContext] Firebase Auth Sync Error:', err);

                    const errorCode = (err as { code?: string })?.code;
                    if (
                        errorCode === 'auth/invalid-custom-token' ||
                        errorCode === 'auth/custom-token-expired' ||
                        errorCode === 'auth/argument-error'
                    ) {
                        console.log('[AuthContext] Token expired or invalid, signing out...');
                        try {
                            const { signOut: firebaseSignOut } = await import('firebase/auth');
                            await firebaseSignOut(auth);
                        } catch (signOutErr) {
                            console.error('[AuthContext] Firebase sign out error:', signOutErr);
                        }
                        await signOut({ redirect: true, callbackUrl: '/login' });
                    }
                }
            } else if (!token && auth?.currentUser) {
                try {
                    const { signOut: firebaseSignOut } = await import('firebase/auth');
                    await firebaseSignOut(auth);
                } catch (signOutErr) {
                    console.error('[AuthContext] Firebase sign out error:', signOutErr);
                }
            }
        };
        syncFirebase();
    }, [session]);

    const isLoading = status === 'loading';
    const isAuthenticated = !!session?.user;

    const user: AuthUser | null = session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
        }
        : null;

    const isStudio = user?.role === 'studio';
    const isClient = user?.role === 'client';
    const isAdmin = user?.role === 'admin';

    const login = async (
        email: string,
        password: string,
        role: UserRole
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const providerId = role === 'studio' ? 'studio-login' : 'client-login';

            const result = await signIn(providerId, {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                return { success: false, error: result.error };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed',
            };
        }
    };

    const logout = async (): Promise<void> => {
        await signOut({ redirect: false });
    };

    const googleLogin = async (): Promise<void> => {
        await signIn('google', { callbackUrl: '/' });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                isStudio,
                isClient,
                isAdmin,
                login,
                googleLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================
// useAuth Hook
// ============================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

// ============================================================
// Auth Guard Components
// ============================================================

interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
    requiredRole?: UserRole;
}

export function AuthGuard({ children, fallback, requiredRole }: AuthGuardProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return fallback || <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return fallback || null;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return fallback || null;
    }

    return <>{children}</>;
}

export function StudioGuard({ children, fallback }: Omit<AuthGuardProps, 'requiredRole'>) {
    return (
        <AuthGuard requiredRole="studio" fallback={fallback}>
            {children}
        </AuthGuard>
    );
}

export function ClientGuard({ children, fallback }: Omit<AuthGuardProps, 'requiredRole'>) {
    return (
        <AuthGuard requiredRole="client" fallback={fallback}>
            {children}
        </AuthGuard>
    );
}

export function AdminGuard({ children, fallback }: Omit<AuthGuardProps, 'requiredRole'>) {
    return (
        <AuthGuard requiredRole="admin" fallback={fallback}>
            {children}
        </AuthGuard>
    );
}
