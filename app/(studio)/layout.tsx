'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, FolderOpen, Settings, Home } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import styles from './layout.module.css';

// ============================================================
// Studio Dashboard Layout
// ============================================================

interface StudioLayoutProps {
    children: ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, logout } = useAuth();

    // Redirect if not studio
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'studio')) {
            router.push(ROUTES.LOGIN);
        }
    }, [isLoading, user, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
            </div>
        );
    }

    // Show nothing while redirecting
    if (!user || user.role !== 'studio') {
        return null;
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/dashboard/galleries', label: 'Galleries', icon: FolderOpen },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h1 className={styles.logo}>My Studios</h1>
                </div>

                <nav className={styles.nav}>
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <button
                        onClick={async () => {
                            await logout();
                            router.push(ROUTES.LOGIN);
                        }}
                        className={styles.logoutBtn}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
