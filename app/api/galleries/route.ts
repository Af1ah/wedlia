import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';
import { Gallery } from '@/types/gallery';

// ============================================================
// GET /api/galleries - List studio's galleries
// POST /api/galleries - Create new gallery
// ============================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'studio') {
      return NextResponse.json(
        { error: 'Unauthorized - Studio access required' },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const studioId = session.user.id;

    const galleriesSnapshot = await db
      .collection(COLLECTIONS.GALLERIES)
      .where('studioId', '==', studioId)
      .orderBy('createdAt', 'desc')
      .get();

    const galleries = galleriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));

    return NextResponse.json({ galleries });
  } catch (error) {
    console.error('[Galleries API] Error fetching galleries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch galleries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'studio') {
      return NextResponse.json(
        { error: 'Unauthorized - Studio access required' },
        { status: 401 }
      );
    }

    const googleAccessToken = session.googleAccessToken;
    
    if (!googleAccessToken) {
      return NextResponse.json(
        { error: 'Google Drive not connected. Please re-login with Google.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      subName,
      description,
      driveFolderId,
      driveFolderName,
      selectedPhotoIds,
      coverPhotoId,
      password,
    } = body;

    // Validate required fields
    if (!name || !driveFolderId || !selectedPhotoIds?.length) {
      return NextResponse.json(
        { error: 'Name, folder and photos are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const studioId = session.user.id;

    // Create the gallery document first
    const galleryRef = db.collection(COLLECTIONS.GALLERIES).doc();
    const now = new Date();

    const galleryData: Omit<Gallery, 'id'> = {
      studioId,
      name,
      subName: subName || null,
      description: description || null,
      coverPhotoKey: '', // Will be set after processing
      coverPhotoId: coverPhotoId || selectedPhotoIds[0],
      isPublic: !password,
      passwordHash: password ? await hashPassword(password) : null,
      driveFolderId,
      driveFolderName,
      sections: [],
      photoCount: selectedPhotoIds.length,
      createdAt: now,
      updatedAt: now,
    };

    await galleryRef.set(galleryData);

    // Return immediately - image processing will be done async
    // For now, we'll do it synchronously but in a production app
    // you'd want to use a background job queue

    return NextResponse.json({
      gallery: {
        id: galleryRef.id,
        ...galleryData,
      },
      message: 'Gallery created. Image processing will begin shortly.',
      processingUrl: `/api/galleries/${galleryRef.id}/process`,
    });
  } catch (error) {
    console.error('[Galleries API] Error creating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to create gallery' },
      { status: 500 }
    );
  }
}

// Simple password hashing using bcrypt
import { hash } from 'bcryptjs';
async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}
