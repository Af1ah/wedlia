'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, Eye, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
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
    isPublic: boolean;
    createdAt: string;
}

// ============================================================
// Galleries List Page
// ============================================================

export default function GalleriesPage() {
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGalleries();
    }, []);

    const fetchGalleries = async () => {
        try {
            const response = await fetch('/api/galleries');
            const data = await response.json();

            if (data.galleries) {
                setGalleries(data.galleries);
            }
        } catch (error) {
            console.error('Failed to fetch galleries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (galleryId: string) => {
        if (!confirm('Are you sure you want to delete this gallery?')) return;

        try {
            const response = await fetch(`/api/galleries/${galleryId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setGalleries(prev => prev.filter(g => g.id !== galleryId));
            }
        } catch (error) {
            console.error('Failed to delete gallery:', error);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading galleries...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Galleries</h1>
                <Link href="/dashboard/galleries/create" className="btn btn-primary">
                    <Plus size={18} />
                    Create Gallery
                </Link>
            </div>

            {galleries.length > 0 ? (
                <div className={styles.galleriesGrid}>
                    {galleries.map(gallery => (
                        <div key={gallery.id} className={styles.galleryCard}>
                            <Link href={`/dashboard/galleries/${gallery.id}`} className={styles.galleryCover}>
                                {gallery.coverPhotoKey ? (
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_R2_URL || ''}/${gallery.coverPhotoKey}`}
                                        alt={gallery.name}
                                        loading="lazy"
                                    />
                                ) : (
                                    <FolderOpen size={48} />
                                )}
                                <span className={styles.privacyBadge}>
                                    {gallery.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                                </span>
                            </Link>
                            <div className={styles.galleryInfo}>
                                <h3 className={styles.galleryName}>{gallery.name}</h3>
                                {gallery.subName && (
                                    <span className={styles.gallerySubName}>{gallery.subName}</span>
                                )}
                                <span className={styles.photoCount}>{gallery.photoCount} photos</span>
                            </div>
                            <div className={styles.galleryActions}>
                                <Link
                                    href={`/dashboard/galleries/${gallery.id}`}
                                    className={styles.actionBtn}
                                >
                                    <Eye size={16} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(gallery.id)}
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <FolderOpen size={64} />
                    <h2>No galleries yet</h2>
                    <p>Create your first gallery by importing photos from Google Drive</p>
                    <Link href="/dashboard/galleries/create" className="btn btn-primary btn-lg">
                        <Plus size={20} />
                        Create Your First Gallery
                    </Link>
                </div>
            )}
        </div>
    );
}
