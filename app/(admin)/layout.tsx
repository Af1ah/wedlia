'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';

// ============================================================
// Admin Layout
// ============================================================

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { user, isLoading, isAdmin, logout } = useAuth();

    // Redirect if not admin (in useEffect to avoid state update during render)
    useEffect(() => {
        if (!isLoading && (!user || !isAdmin)) {
            router.push(ROUTES.LOGIN);
        }
    }, [isLoading, user, isAdmin, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="animate-spin" style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--border-light)',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%',
                }} />
            </div>
        );
    }

    // Show nothing while redirecting
    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="app-wrapper">
            {/* Admin Header */}
            <header style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <h1 style={{
                        fontSize: 'var(--text-xl)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--color-primary)',
                    }}>
                        Admin Dashboard
                    </h1>
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        padding: 'var(--space-1) var(--space-2)',
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--text-inverse)',
                        borderRadius: 'var(--radius-full)',
                    }}>
                        Admin
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {user.email}
                    </span>
                    <button
                        onClick={async () => {
                            await logout();
                            router.push(ROUTES.LOGIN);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content" style={{ padding: 'var(--space-6)' }}>
                {children}
            </main>
        </div>
    );
}
