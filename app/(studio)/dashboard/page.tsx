'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Image, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

// ============================================================
// Types
// ============================================================

interface Gallery {
    id: string;
    name: string;
    subName?: string;
    photoCount: number;
    coverPhotoKey?: string;
    createdAt: string;
}

interface DashboardStats {
    totalGalleries: number;
    totalPhotos: number;
    portfolioUrl: string;
}

// ============================================================
// Studio Dashboard Page
// ============================================================

export default function StudioDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentGalleries, setRecentGalleries] = useState<Gallery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/galleries');
            const data = await response.json();

            if (data.galleries) {
                setRecentGalleries(data.galleries.slice(0, 5));
                setStats({
                    totalGalleries: data.galleries.length,
                    totalPhotos: data.galleries.reduce((acc: number, g: Gallery) => acc + (g.photoCount || 0), 0),
                    portfolioUrl: `${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'studio'}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}`,
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
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

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <Link href="/dashboard/galleries/create" className="btn btn-primary">
                    <Plus size={18} />
                    Create Gallery
                </Link>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FolderOpen size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.totalGalleries || 0}</span>
                        <span className={styles.statLabel}>Galleries</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Image size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.totalPhotos || 0}</span>
                        <span className={styles.statLabel}>Photos</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <ExternalLink size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.portfolioLink}>{stats?.portfolioUrl}</span>
                        <span className={styles.statLabel}>Portfolio URL</span>
                    </div>
                </div>
            </div>

            {/* Recent Galleries */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Galleries</h2>
                    <Link href="/dashboard/galleries" className={styles.viewAll}>
                        View All
                    </Link>
                </div>

                {recentGalleries.length > 0 ? (
                    <div className={styles.galleriesGrid}>
                        {recentGalleries.map(gallery => (
                            <Link
                                key={gallery.id}
                                href={`/dashboard/galleries/${gallery.id}`}
                                className={styles.galleryCard}
                            >
                                <div className={styles.galleryCover}>
                                    {gallery.coverPhotoKey ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_R2_URL || ''}/${gallery.coverPhotoKey}`}
                                            alt={gallery.name}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <FolderOpen size={48} />
                                    )}
                                </div>
                                <div className={styles.galleryInfo}>
                                    <h3 className={styles.galleryName}>{gallery.name}</h3>
                                    {gallery.subName && (
                                        <span className={styles.gallerySubName}>{gallery.subName}</span>
                                    )}
                                    <span className={styles.photoCount}>{gallery.photoCount} photos</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FolderOpen size={48} />
                        <h3>No galleries yet</h3>
                        <p>Create your first gallery by importing photos from Google Drive</p>
                        <Link href="/dashboard/galleries/create" className="btn btn-primary">
                            <Plus size={18} />
                            Create Gallery
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
