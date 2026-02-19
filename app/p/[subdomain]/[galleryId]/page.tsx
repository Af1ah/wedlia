import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';
import GalleryViewClient from './GalleryViewClient';

// ============================================================
// Gallery View Page (Server Component)
// ============================================================

interface PageProps {
    params: Promise<{ subdomain: string; galleryId: string }>;
}

async function getGallery(galleryId: string) {
    const db = getAdminDb();

    const galleryDoc = await db.collection(COLLECTIONS.GALLERIES).doc(galleryId).get();

    if (!galleryDoc.exists) {
        return null;
    }

    const data = galleryDoc.data();
    return {
        id: galleryDoc.id,
        name: data?.name,
        subName: data?.subName,
        description: data?.description,
        studioId: data?.studioId,
        coverPhotoKey: data?.coverPhotoKey,
        hasPassword: !!data?.passwordHash,
        passwordHash: data?.passwordHash,
        photoCount: data?.photoCount || 0,
    };
}

async function getGalleryPhotos(galleryId: string) {
    const db = getAdminDb();

    const photosSnapshot = await db
        .collection(COLLECTIONS.GALLERY_PHOTOS)
        .where('galleryId', '==', galleryId)
        .orderBy('order', 'asc')
        .get();

    return photosSnapshot.docs.map(doc => ({
        id: doc.id,
        thumbnailKey: doc.data().thumbnailKey,
        previewKey: doc.data().previewKey,
        fullKey: doc.data().fullKey,
        driveDownloadUrl: doc.data().driveDownloadUrl,
        fileName: doc.data().fileName,
    }));
}

async function getStudioName(studioId: string) {
    const db = getAdminDb();

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(studioId).get();
    return userDoc.data()?.displayName || 'Studio';
}

export default async function GalleryViewPage({ params }: PageProps) {
    const { subdomain, galleryId } = await params;

    const gallery = await getGallery(galleryId);

    if (!gallery) {
        notFound();
    }

    const photos = await getGalleryPhotos(galleryId);
    const studioName = await getStudioName(gallery.studioId);

    return (
        <GalleryViewClient
            gallery={gallery}
            photos={photos}
            studioName={studioName}
            subdomain={subdomain}
        />
    );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { galleryId } = await params;
    const gallery = await getGallery(galleryId);

    if (!gallery) {
        return { title: 'Not Found' };
    }

    return {
        title: `${gallery.name} | Gallery`,
        description: gallery.description || `View ${gallery.name} - ${gallery.photoCount} photos`,
    };
}
