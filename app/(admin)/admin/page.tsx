'use client';

import { useEffect, useState } from 'react';
import { Users, Image, Video, Grid3X3, Crown } from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// Types
// ============================================================

interface UserStats {
    total: number;
    studios: number;
    clients: number;
    admins: number;
}

interface Studio {
    id: string;
    name: string;
    email: string;
    imageCount: number;
    videoCount: number;
    galleryCount: number;
    subscription: string;
    createdAt: string | null;
}

interface AdminStats {
    users: UserStats;
    galleries: number;
    studios: Studio[];
}

// ============================================================
// Admin Dashboard Page
// ============================================================

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
                <button onClick={fetchStats} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <h2 className={styles.pageTitle}>Overview</h2>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.users.total || 0}</span>
                        <span className={styles.statLabel}>Total Users</span>
                    </div>
                    <div className={styles.statBreakdown}>
                        <span>{stats?.users.studios || 0} Studios</span>
                        <span>{stats?.users.clients || 0} Clients</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Grid3X3 size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.galleries || 0}</span>
                        <span className={styles.statLabel}>Total Galleries</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Crown size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.studios.length || 0}</span>
                        <span className={styles.statLabel}>Active Studios</span>
                    </div>
                </div>
            </div>

            {/* Studios Table */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Studio Details</h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Studio Name</th>
                                <th>Email</th>
                                <th>
                                    <span className={styles.headerIcon}>
                                        <Image size={14} /> Images
                                    </span>
                                </th>
                                <th>
                                    <span className={styles.headerIcon}>
                                        <Video size={14} /> Videos
                                    </span>
                                </th>
                                <th>
                                    <span className={styles.headerIcon}>
                                        <Grid3X3 size={14} /> Galleries
                                    </span>
                                </th>
                                <th>Subscription</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.studios && stats.studios.length > 0 ? (
                                stats.studios.map((studio) => (
                                    <tr key={studio.id}>
                                        <td className={styles.studioName}>{studio.name}</td>
                                        <td className={styles.studioEmail}>{studio.email}</td>
                                        <td>{studio.imageCount}</td>
                                        <td>{studio.videoCount}</td>
                                        <td>{studio.galleryCount}</td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[studio.subscription] || ''}`}>
                                                {studio.subscription}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className={styles.emptyState}>
                                        No studios found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Users List */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>User Statistics</h3>
                <div className={styles.userStatsGrid}>
                    <div className={styles.userStatItem}>
                        <span className={styles.userStatLabel}>Studio Accounts</span>
                        <span className={styles.userStatValue}>{stats?.users.studios || 0}</span>
                    </div>
                    <div className={styles.userStatItem}>
                        <span className={styles.userStatLabel}>Client Accounts</span>
                        <span className={styles.userStatValue}>{stats?.users.clients || 0}</span>
                    </div>
                    <div className={styles.userStatItem}>
                        <span className={styles.userStatLabel}>Admin Accounts</span>
                        <span className={styles.userStatValue}>{stats?.users.admins || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
