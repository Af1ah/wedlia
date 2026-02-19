'use client';

import { FolderOpen, Lock } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

// ============================================================
// Types
// ============================================================

interface Studio {
    id: string;
    subdomain: string;
    displayName: string;
    description?: string | null;
    logo?: string | null;
}

interface Gallery {
    id: string;
    name: string;
    subName?: string;
    coverPhotoKey?: string;
    photoCount: number;
    hasPassword: boolean;
}

interface PortfolioClientProps {
    studio: Studio;
    galleries: Gallery[];
}

// ============================================================
// Portfolio Client Component
// ============================================================

export default function PortfolioClient({ studio, galleries }: PortfolioClientProps) {
    const r2Url = process.env.NEXT_PUBLIC_R2_URL || '';

    return (
        <div className={styles.portfolio}>
            {/* Header */}
            <header className={styles.header}>
                {studio.logo ? (
                    <img src={studio.logo} alt={studio.displayName} className={styles.logo} />
                ) : (
                    <h1 className={styles.studioName}>{studio.displayName}</h1>
                )}
                {studio.description && (
                    <p className={styles.description}>{studio.description}</p>
                )}
            </header>

            {/* Galleries Grid */}
            <main className={styles.main}>
                {galleries.length > 0 ? (
                    <div className={styles.galleriesGrid}>
                        {galleries.map(gallery => (
                            <Link
                                key={gallery.id}
                                href={`/p/${studio.subdomain}/${gallery.id}`}
                                className={styles.galleryCard}
                            >
                                <div className={styles.galleryCover}>
                                    {gallery.coverPhotoKey ? (
                                        <img
                                            src={`${r2Url}/${gallery.coverPhotoKey}`}
                                            alt={gallery.name}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <FolderOpen size={48} />
                                    )}
                                    {gallery.hasPassword && (
                                        <span className={styles.lockBadge}>
                                            <Lock size={14} />
                                        </span>
                                    )}
                                </div>
                                <div className={styles.galleryInfo}>
                                    <h2 className={styles.galleryName}>{gallery.name}</h2>
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
                        <FolderOpen size={64} />
                        <h2>No galleries yet</h2>
                        <p>Check back soon for photos!</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>Powered by My Studios</p>
            </footer>
        </div>
    );
}
