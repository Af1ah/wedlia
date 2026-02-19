'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Copy, Lock, Globe, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
    studioId: string;
    coverPhotoKey?: string;
    isPublic: boolean;
    photoCount: number;
    driveFolderName: string;
    createdAt: string;
}

interface Photo {
    id: string;
    thumbnailKey: string;
    previewKey: string;
    fullKey: string;
    driveDownloadUrl: string;
    fileName: string;
}

// ============================================================
// Gallery Detail Page (Dashboard)
// ============================================================

export default function GalleryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const galleryId = params.galleryId as string;

    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const r2Url = process.env.NEXT_PUBLIC_R2_URL || '';

    useEffect(() => {
        fetchGalleryData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [galleryId]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;

            if (e.key === 'Escape') {
                setLightboxOpen(false);
                document.body.style.overflow = '';
            } else if (e.key === 'ArrowLeft') {
                setCurrentPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, photos.length]);

    const fetchGalleryData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch gallery details
            const galleryRes = await fetch(`/api/galleries/${galleryId}`);
            if (!galleryRes.ok) {
                if (galleryRes.status === 404) {
                    setError('Gallery not found');
                } else {
                    setError('Failed to load gallery');
                }
                return;
            }

            const galleryData = await galleryRes.json();
            setGallery(galleryData.gallery);
            setPhotos(galleryData.photos || []);
        } catch (err) {
            console.error('Error fetching gallery:', err);
            setError('Failed to load gallery');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this gallery? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/galleries/${galleryId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/dashboard/galleries');
            } else {
                alert('Failed to delete gallery');
            }
        } catch (err) {
            console.error('Error deleting gallery:', err);
            alert('Failed to delete gallery');
        }
    };

    const copyShareLink = () => {
        // TODO: Get actual subdomain from user profile
        const shareUrl = `${window.location.origin}/p/studio/${galleryId}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

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

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading gallery...</p>
            </div>
        );
    }

    if (error || !gallery) {
        return (
            <div className={styles.error}>
                <p>{error || 'Gallery not found'}</p>
                <Link href="/dashboard/galleries" className="btn btn-secondary">
                    <ArrowLeft size={18} />
                    Back to Galleries
                </Link>
            </div>
        );
    }

    const currentPhoto = photos[currentPhotoIndex];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/dashboard/galleries" className={styles.backLink}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.title}>{gallery.name}</h1>
                        {gallery.subName && (
                            <p className={styles.subName}>{gallery.subName}</p>
                        )}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={copyShareLink} className="btn btn-secondary">
                        <Copy size={18} />
                        Copy Link
                    </button>
                    <button onClick={handleDelete} className="btn btn-danger">
                        <Trash2 size={18} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Gallery Info */}
            <div className={styles.infoBar}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Photos</span>
                    <span className={styles.infoValue}>{photos.length}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.infoValue}>
                        {gallery.isPublic ? (
                            <><Globe size={14} /> Public</>
                        ) : (
                            <><Lock size={14} /> Password Protected</>
                        )}
                    </span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Source</span>
                    <span className={styles.infoValue}>{gallery.driveFolderName}</span>
                </div>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 ? (
                <div className={styles.photoGrid}>
                    {photos.map((photo, index) => (
                        <div
                            key={photo.id}
                            className={styles.photoCard}
                            onClick={() => openLightbox(index)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`${r2Url}/${photo.previewKey}`}
                                alt={photo.fileName}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyPhotos}>
                    <p>No photos in this gallery yet.</p>
                    <p className={styles.hint}>
                        Photos may still be processing. Refresh the page to check.
                    </p>
                </div>
            )}

            {/* Lightbox */}
            {lightboxOpen && currentPhoto && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    <button className={styles.closeBtn} onClick={closeLightbox}>
                        <X size={24} />
                    </button>

                    <button
                        className={`${styles.navBtn} ${styles.prevBtn}`}
                        onClick={(e) => { e.stopPropagation(); navigatePrev(); }}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`${r2Url}/${currentPhoto.fullKey}`}
                            alt={currentPhoto.fileName}
                        />
                    </div>

                    <button
                        className={`${styles.navBtn} ${styles.nextBtn}`}
                        onClick={(e) => { e.stopPropagation(); navigateNext(); }}
                    >
                        <ChevronRight size={32} />
                    </button>

                    <div className={styles.lightboxInfo}>
                        <span>{currentPhotoIndex + 1} / {photos.length}</span>
                        <a
                            href={currentPhoto.driveDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.downloadBtn}
                            onClick={e => e.stopPropagation()}
                        >
                            <Download size={18} />
                            Download Original
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
