'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

// ============================================================
// Types
// ============================================================

interface Gallery {
    id: string;
    name: string;
    subName?: string;
    description?: string;
    hasPassword: boolean;
    photoCount: number;
}

interface Photo {
    id: string;
    thumbnailKey: string;
    previewKey: string;
    fullKey: string;
    driveDownloadUrl: string;
    fileName: string;
}

interface GalleryViewClientProps {
    gallery: Gallery;
    photos: Photo[];
    studioName: string;
    subdomain: string;
}

// ============================================================
// Gallery View Client Component
// ============================================================

export default function GalleryViewClient({
    gallery,
    photos,
    studioName,
    subdomain
}: GalleryViewClientProps) {
    const r2Url = process.env.NEXT_PUBLIC_R2_URL || '';

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Password protection state
    const [isUnlocked, setIsUnlocked] = useState(!gallery.hasPassword);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [checkingPassword, setCheckingPassword] = useState(false);

    // Handle keyboard navigation in lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;

            if (e.key === 'Escape') {
                setLightboxOpen(false);
            } else if (e.key === 'ArrowLeft') {
                navigatePrev();
            } else if (e.key === 'ArrowRight') {
                navigateNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, currentPhotoIndex]);

    const openLightbox = (index: number) => {
        setCurrentPhotoIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = '';
    };

    const navigatePrev = () => {
        setCurrentPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const navigateNext = () => {
        setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setCheckingPassword(true);

        try {
            const response = await fetch(`/api/galleries/${gallery.id}/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success) {
                setIsUnlocked(true);
            } else {
                setPasswordError('Incorrect password');
            }
        } catch (error) {
            setPasswordError('Failed to verify password');
        } finally {
            setCheckingPassword(false);
        }
    };

    const currentPhoto = photos[currentPhotoIndex];

    // Password protection screen
    if (!isUnlocked) {
        return (
            <div className={styles.passwordScreen}>
                <div className={styles.passwordCard}>
                    <Lock size={48} className={styles.lockIcon} />
                    <h1>{gallery.name}</h1>
                    <p>This gallery is password protected</p>

                    <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className={styles.passwordInput}
                            autoFocus
                        />
                        {passwordError && <p className={styles.passwordError}>{passwordError}</p>}
                        <button
                            type="submit"
                            disabled={checkingPassword || !password}
                            className="btn btn-primary"
                        >
                            {checkingPassword ? 'Checking...' : 'Unlock Gallery'}
                        </button>
                    </form>

                    <Link href={`/p/${subdomain}`} className={styles.backLink}>
                        Back to portfolio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.galleryView}>
            {/* Header */}
            <header className={styles.header}>
                <Link href={`/p/${subdomain}`} className={styles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div className={styles.headerInfo}>
                    <h1 className={styles.galleryName}>{gallery.name}</h1>
                    {gallery.subName && (
                        <span className={styles.gallerySubName}>{gallery.subName}</span>
                    )}
                </div>
                <span className={styles.photoCount}>{photos.length} photos</span>
            </header>

            {/* Description */}
            {gallery.description && (
                <p className={styles.description}>{gallery.description}</p>
            )}

            {/* Photos Grid - Masonry-like layout */}
            <div className={styles.photosGrid}>
                {photos.map((photo, index) => (
                    <button
                        key={photo.id}
                        onClick={() => openLightbox(index)}
                        className={styles.photoCard}
                    >
                        <img
                            src={`${r2Url}/${photo.thumbnailKey}`}
                            alt={photo.fileName}
                            loading="lazy"
                        />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxOpen && currentPhoto && (
                <div className={styles.lightbox}>
                    <div className={styles.lightboxOverlay} onClick={closeLightbox} />

                    <div className={styles.lightboxContent}>
                        <img
                            src={`${r2Url}/${currentPhoto.fullKey}`}
                            alt={currentPhoto.fileName}
                        />
                    </div>

                    {/* Controls */}
                    <button onClick={closeLightbox} className={styles.closeBtn}>
                        <X size={24} />
                    </button>

                    <button onClick={navigatePrev} className={`${styles.navBtn} ${styles.prevBtn}`}>
                        <ChevronLeft size={32} />
                    </button>

                    <button onClick={navigateNext} className={`${styles.navBtn} ${styles.nextBtn}`}>
                        <ChevronRight size={32} />
                    </button>

                    {/* Download Link */}
                    <a
                        href={currentPhoto.driveDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.downloadBtn}
                    >
                        <Download size={20} />
                        <span>Download Original</span>
                    </a>

                    {/* Photo Counter */}
                    <div className={styles.photoCounter}>
                        {currentPhotoIndex + 1} / {photos.length}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className={styles.footer}>
                <p>© {studioName} • Powered by My Studios</p>
            </footer>
        </div>
    );
}
