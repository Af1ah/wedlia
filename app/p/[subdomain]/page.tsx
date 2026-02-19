import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';
import PortfolioClient from './PortfolioClient';

// ============================================================
// Portfolio Page (Server Component)
// ============================================================

interface PageProps {
    params: Promise<{ subdomain: string }>;
}

async function getStudioBySubdomain(subdomain: string) {
    const db = getAdminDb();

    // First try to find by subdomain in studio_profiles
    const profileSnapshot = await db
        .collection(COLLECTIONS.STUDIO_PROFILES)
        .where('subdomain', '==', subdomain)
        .limit(1)
        .get();

    if (!profileSnapshot.empty) {
        const profile = profileSnapshot.docs[0].data();
        return {
            id: profile.userId,
            subdomain,
            displayName: profile.displayName,
            description: profile.description,
            logo: profile.logo,
        };
    }

    // Fallback: Try to match by username from users collection
    const usersSnapshot = await db
        .collection(COLLECTIONS.USERS)
        .where('role', '==', 'studio')
        .get();

    for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const userSubdomain = userData.displayName?.toLowerCase().replace(/\s+/g, '-');
        if (userSubdomain === subdomain) {
            return {
                id: doc.id,
                subdomain,
                displayName: userData.displayName,
                description: null,
                logo: null,
            };
        }
    }

    return null;
}

async function getStudioGalleries(studioId: string) {
    const db = getAdminDb();

    const galleriesSnapshot = await db
        .collection(COLLECTIONS.GALLERIES)
        .where('studioId', '==', studioId)
        .where('isPublic', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

    return galleriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        subName: doc.data().subName,
        coverPhotoKey: doc.data().coverPhotoKey,
        photoCount: doc.data().photoCount,
        hasPassword: !!doc.data().passwordHash,
    }));
}

export default async function PortfolioPage({ params }: PageProps) {
    const { subdomain } = await params;

    const studio = await getStudioBySubdomain(subdomain);

    if (!studio) {
        notFound();
    }

    const galleries = await getStudioGalleries(studio.id);

    return (
        <PortfolioClient
            studio={studio}
            galleries={galleries}
        />
    );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { subdomain } = await params;
    const studio = await getStudioBySubdomain(subdomain);

    if (!studio) {
        return { title: 'Not Found' };
    }

    return {
        title: `${studio.displayName} | Portfolio`,
        description: studio.description || `View the photography portfolio of ${studio.displayName}`,
    };
}
