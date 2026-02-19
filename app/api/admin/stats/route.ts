import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';

// ============================================================
// Admin Stats API
// ============================================================

export async function GET() {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const db = getAdminDb();

        // Get users count by role
        const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
        interface UserDoc {
            id: string;
            role?: string;
            email?: string;
            displayName?: string;
            createdAt?: { toDate?: () => Date };
        }
        const users: UserDoc[] = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        const userStats = {
            total: users.length,
            studios: users.filter(u => u.role === 'studio').length,
            clients: users.filter(u => u.role === 'client').length,
            admins: users.filter(u => u.role === 'admin').length,
        };

        // Get galleries count
        const galleriesSnapshot = await db.collection(COLLECTIONS.GALLERIES).get();
        const galleriesCount = galleriesSnapshot.size;

        // Get studios with details
        const studiosSnapshot = await db.collection(COLLECTIONS.STUDIOS).get();
        const studios = await Promise.all(
            studiosSnapshot.docs.map(async (doc) => {
                const studioData = doc.data();
                const studioId = doc.id;

                // Get gallery count for this studio
                const studioGalleries = await db
                    .collection(COLLECTIONS.GALLERIES)
                    .where('studioId', '==', studioId)
                    .get();

                // Get portfolios for media counts
                const portfoliosSnapshot = await db
                    .collection(COLLECTIONS.PORTFOLIOS)
                    .where('studioId', '==', studioId)
                    .get();

                let imageCount = 0;
                let videoCount = 0;

                portfoliosSnapshot.docs.forEach(pDoc => {
                    const pData = pDoc.data();
                    imageCount += pData.imageCount || 0;
                    videoCount += pData.videoCount || 0;
                });

                return {
                    id: studioId,
                    name: studioData.name || studioData.displayName || 'Unknown Studio',
                    email: studioData.email || '',
                    imageCount,
                    videoCount,
                    galleryCount: studioGalleries.size,
                    subscription: studioData.subscription || 'free',
                    createdAt: studioData.createdAt?.toDate?.()?.toISOString() || null,
                };
            })
        );

        // Also get user-based studios (users with role 'studio')
        const studioUsers = users.filter(u => u.role === 'studio');
        const studioUserIds = studioUsers.map(u => u.id);
        
        // Merge with studios collection data
        const mergedStudios = studioUsers.map(user => {
            const existingStudio = studios.find(s => s.email === user.email);
            if (existingStudio) {
                return existingStudio;
            }
            return {
                id: user.id,
                name: user.displayName || 'Unknown Studio',
                email: user.email || '',
                imageCount: 0,
                videoCount: 0,
                galleryCount: 0,
                subscription: 'free',
                createdAt: user.createdAt?.toDate?.()?.toISOString() || null,
            };
        });

        // Remove duplicates
        const uniqueStudios = mergedStudios.filter((studio, index, self) =>
            index === self.findIndex(s => s.email === studio.email)
        );

        return NextResponse.json({
            users: userStats,
            galleries: galleriesCount,
            studios: uniqueStudios,
        });
    } catch (error) {
        console.error('[Admin Stats] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
