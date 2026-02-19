'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FolderOpen,
    Image,
    Lock,
    Globe,
    Loader2,
    CheckCircle
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// Types
// ============================================================

interface DriveFolder {
    id: string;
    name: string;
    shared: boolean;
}

interface DriveImage {
    id: string;
    name: string;
    thumbnailLink?: string;
    mimeType: string;
}

type Step = 'folder' | 'photos' | 'details';

// ============================================================
// Create Gallery Page - Multi-step Wizard
// ============================================================

export default function CreateGalleryPage() {
    const router = useRouter();

    // Wizard state
    const [currentStep, setCurrentStep] = useState<Step>('folder');

    // Folder selection
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);

    // Photo selection
    const [images, setImages] = useState<DriveImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

    // Gallery details
    const [name, setName] = useState('');
    const [subName, setSubName] = useState('');
    const [description, setDescription] = useState('');
    const [coverPhotoId, setCoverPhotoId] = useState('');
    const [password, setPassword] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Load folders on mount
    useEffect(() => {
        fetchFolders();
    }, []);

    // Load images when folder selected
    useEffect(() => {
        if (selectedFolder) {
            fetchImages(selectedFolder.id);
        }
    }, [selectedFolder]);

    const fetchFolders = async () => {
        try {
            const response = await fetch('/api/drive/folders');
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setFolders(data.folders || []);
            }
        } catch (err) {
            setError('Failed to load Google Drive folders');
        } finally {
            setLoadingFolders(false);
        }
    };

    const fetchImages = async (folderId: string) => {
        setLoadingImages(true);
        try {
            const response = await fetch(`/api/drive/folders/${folderId}/images`);
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setImages(data.images || []);
            }
        } catch (err) {
            setError('Failed to load images from folder');
        } finally {
            setLoadingImages(false);
        }
    };

    const handleFolderSelect = (folder: DriveFolder) => {
        setSelectedFolder(folder);
        setSelectedPhotos(new Set());
        setCoverPhotoId('');
        setCurrentStep('photos');
    };

    const togglePhotoSelection = (photoId: string) => {
        setSelectedPhotos(prev => {
            const next = new Set(prev);
            if (next.has(photoId)) {
                next.delete(photoId);
            } else {
                next.add(photoId);
            }
            return next;
        });
    };

    const selectAllPhotos = () => {
        if (selectedPhotos.size === images.length) {
            setSelectedPhotos(new Set());
        } else {
            setSelectedPhotos(new Set(images.map(i => i.id)));
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Gallery name is required');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Create gallery
            const response = await fetch('/api/galleries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    subName: subName.trim() || undefined,
                    description: description.trim() || undefined,
                    driveFolderId: selectedFolder!.id,
                    driveFolderName: selectedFolder!.name,
                    selectedPhotoIds: Array.from(selectedPhotos),
                    coverPhotoId: coverPhotoId || Array.from(selectedPhotos)[0],
                    password: isPublic ? undefined : password,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            // Start processing images
            await fetch(`/api/galleries/${data.gallery.id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoIds: Array.from(selectedPhotos),
                }),
            });

            router.push('/dashboard/galleries');
        } catch (err) {
            setError('Failed to create gallery');
        } finally {
            setSubmitting(false);
        }
    };

    const steps: { key: Step; label: string }[] = [
        { key: 'folder', label: 'Select Folder' },
        { key: 'photos', label: 'Select Photos' },
        { key: 'details', label: 'Details' },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>Create Gallery</h1>
            </div>

            {/* Steps Indicator */}
            <div className={styles.stepsIndicator}>
                {steps.map((step, index) => (
                    <div
                        key={step.key}
                        className={`${styles.step} ${index <= currentStepIndex ? styles.active : ''}`}
                    >
                        <div className={styles.stepNumber}>
                            {index < currentStepIndex ? <Check size={16} /> : index + 1}
                        </div>
                        <span className={styles.stepLabel}>{step.label}</span>
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {/* Step Content */}
            <div className={styles.stepContent}>
                {/* Step 1: Folder Selection */}
                {currentStep === 'folder' && (
                    <div className={styles.folderStep}>
                        <h2>Select a Google Drive folder</h2>
                        <p className={styles.hint}>Choose a folder containing your photos (15-30 JPEG images)</p>

                        {loadingFolders ? (
                            <div className={styles.loading}>
                                <Loader2 className={styles.spinIcon} size={24} />
                                <p>Loading folders...</p>
                            </div>
                        ) : folders.length > 0 ? (
                            <div className={styles.foldersGrid}>
                                {folders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleFolderSelect(folder)}
                                        className={styles.folderCard}
                                    >
                                        <FolderOpen size={32} />
                                        <span className={styles.folderName}>{folder.name}</span>
                                        {folder.shared && (
                                            <span className={styles.sharedBadge}>Shared</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FolderOpen size={48} />
                                <p>No folders found in your Google Drive</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Photo Selection */}
                {currentStep === 'photos' && (
                    <div className={styles.photosStep}>
                        <div className={styles.photosHeader}>
                            <h2>Select photos from "{selectedFolder?.name}"</h2>
                            <button onClick={selectAllPhotos} className={styles.selectAllBtn}>
                                {selectedPhotos.size === images.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <p className={styles.hint}>
                            Selected: {selectedPhotos.size} / {images.length} photos
                        </p>

                        {loadingImages ? (
                            <div className={styles.loading}>
                                <Loader2 className={styles.spinIcon} size={24} />
                                <p>Loading images...</p>
                            </div>
                        ) : images.length > 0 ? (
                            <div className={styles.photosGrid}>
                                {images.map(image => (
                                    <button
                                        key={image.id}
                                        onClick={() => togglePhotoSelection(image.id)}
                                        className={`${styles.photoCard} ${selectedPhotos.has(image.id) ? styles.selected : ''}`}
                                    >
                                        {image.thumbnailLink ? (
                                            <img src={image.thumbnailLink} alt={image.name} />
                                        ) : (
                                            <Image size={32} />
                                        )}
                                        {selectedPhotos.has(image.id) && (
                                            <div className={styles.selectedOverlay}>
                                                <CheckCircle size={24} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <Image size={48} />
                                <p>No images found in this folder</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Gallery Details */}
                {currentStep === 'details' && (
                    <div className={styles.detailsStep}>
                        <h2>Gallery Details</h2>

                        <div className={styles.formGroup}>
                            <label htmlFor="name">Gallery Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Wedding of John & Jane"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="subName">Sub Name (Optional)</label>
                            <input
                                id="subName"
                                type="text"
                                value={subName}
                                onChange={e => setSubName(e.target.value)}
                                placeholder="e.g., December 2025"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="description">Description (Optional)</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="A brief description of this gallery..."
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Cover Photo</label>
                            <div className={styles.coverPhotoGrid}>
                                {Array.from(selectedPhotos).slice(0, 6).map(photoId => {
                                    const image = images.find(i => i.id === photoId);
                                    return (
                                        <button
                                            key={photoId}
                                            onClick={() => setCoverPhotoId(photoId)}
                                            className={`${styles.coverOption} ${coverPhotoId === photoId ? styles.selectedCover : ''}`}
                                        >
                                            {image?.thumbnailLink ? (
                                                <img src={image.thumbnailLink} alt="" />
                                            ) : (
                                                <Image size={24} />
                                            )}
                                            {coverPhotoId === photoId && (
                                                <CheckCircle className={styles.coverCheck} size={20} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Privacy</label>
                            <div className={styles.privacyOptions}>
                                <button
                                    onClick={() => setIsPublic(true)}
                                    className={`${styles.privacyOption} ${isPublic ? styles.active : ''}`}
                                >
                                    <Globe size={20} />
                                    <div>
                                        <strong>Public</strong>
                                        <span>Anyone with the link can view</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setIsPublic(false)}
                                    className={`${styles.privacyOption} ${!isPublic ? styles.active : ''}`}
                                >
                                    <Lock size={20} />
                                    <div>
                                        <strong>Password Protected</strong>
                                        <span>Require password to view</span>
                                    </div>
                                </button>
                            </div>

                            {!isPublic && (
                                <div className={styles.passwordInput}>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter gallery password"
                                        className={styles.input}
                                    />
                                    <p className={styles.passwordHint}>
                                        If you don't want a public link, enable password protection.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className={styles.navigation}>
                {currentStep !== 'folder' && (
                    <button
                        onClick={() => {
                            if (currentStep === 'photos') setCurrentStep('folder');
                            if (currentStep === 'details') setCurrentStep('photos');
                        }}
                        className={`btn btn-secondary ${styles.navBtn}`}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                )}

                <div className={styles.spacer} />

                {currentStep === 'photos' && selectedPhotos.size > 0 && (
                    <button
                        onClick={() => setCurrentStep('details')}
                        className={`btn btn-primary ${styles.navBtn}`}
                    >
                        Continue
                        <ArrowRight size={18} />
                    </button>
                )}

                {currentStep === 'details' && (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        className={`btn btn-primary ${styles.navBtn}`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className={styles.spinIcon} size={18} />
                                Creating...
                            </>
                        ) : (
                            <>
                                Create Gallery
                                <Check size={18} />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
