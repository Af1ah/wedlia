import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';
import { deleteImages } from '@/lib/r2';

// ============================================================
// GET /api/galleries/[galleryId] - Get gallery details
// DELETE /api/galleries/[galleryId] - Delete gallery
// ============================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'studio') {
      return NextResponse.json(
        { error: 'Unauthorized - Studio access required' },
        { status: 401 }
      );
    }

    const { galleryId } = await params;
    const db = getAdminDb();
    const studioId = session.user.id;

    // Fetch gallery
    const galleryDoc = await db.collection(COLLECTIONS.GALLERIES).doc(galleryId).get();

    if (!galleryDoc.exists) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    const galleryData = galleryDoc.data();

    // Verify ownership
    if (galleryData?.studioId !== studioId) {
      return NextResponse.json(
        { error: 'Unauthorized - Not your gallery' },
        { status: 403 }
      );
    }

    // Fetch photos
    const photosSnapshot = await db
      .collection(COLLECTIONS.GALLERY_PHOTOS)
      .where('galleryId', '==', galleryId)
      .orderBy('order', 'asc')
      .get();

    const photos = photosSnapshot.docs.map(doc => ({
      id: doc.id,
      thumbnailKey: doc.data().thumbnailKey,
      previewKey: doc.data().previewKey,
      fullKey: doc.data().fullKey,
      driveDownloadUrl: doc.data().driveDownloadUrl,
      fileName: doc.data().fileName,
    }));

    return NextResponse.json({
      gallery: {
        id: galleryDoc.id,
        ...galleryData,
        createdAt: galleryData?.createdAt?.toDate?.() || new Date(),
        updatedAt: galleryData?.updatedAt?.toDate?.() || new Date(),
      },
      photos,
    });
  } catch (error) {
    console.error('[Galleries API] Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'studio') {
      return NextResponse.json(
        { error: 'Unauthorized - Studio access required' },
        { status: 401 }
      );
    }

    const { galleryId } = await params;
    const db = getAdminDb();
    const studioId = session.user.id;

    // Fetch gallery to verify ownership
    const galleryDoc = await db.collection(COLLECTIONS.GALLERIES).doc(galleryId).get();

    if (!galleryDoc.exists) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    const galleryData = galleryDoc.data();

    if (galleryData?.studioId !== studioId) {
      return NextResponse.json(
        { error: 'Unauthorized - Not your gallery' },
        { status: 403 }
      );
    }

    // Get all photos to delete from R2
    const photosSnapshot = await db
      .collection(COLLECTIONS.GALLERY_PHOTOS)
      .where('galleryId', '==', galleryId)
      .get();

    // Collect all R2 keys to delete
    const keysToDelete: string[] = [];
    photosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.thumbnailKey) keysToDelete.push(data.thumbnailKey);
      if (data.previewKey) keysToDelete.push(data.previewKey);
      if (data.fullKey) keysToDelete.push(data.fullKey);
    });

    // Delete from R2
    if (keysToDelete.length > 0) {
      try {
        await deleteImages(keysToDelete);
      } catch (error) {
        console.error('[Galleries API] Error deleting R2 images:', error);
        // Continue with deletion even if R2 fails
      }
    }

    // Delete photos from Firestore
    const batch = db.batch();
    photosSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete gallery
    batch.delete(db.collection(COLLECTIONS.GALLERIES).doc(galleryId));

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Galleries API] Error deleting gallery:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
