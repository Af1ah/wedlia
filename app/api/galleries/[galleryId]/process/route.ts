import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';
import { downloadFile, getDownloadUrl } from '@/lib/google-drive';
import { processImage } from '@/lib/image-processing';
import { uploadImage, generateImageKey, deleteImages } from '@/lib/r2';
import { FieldValue } from 'firebase-admin/firestore';

// ============================================================
// POST /api/galleries/[galleryId]/process - Process and upload images
// ============================================================

export async function POST(
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

    const googleAccessToken = session.googleAccessToken;
    
    if (!googleAccessToken) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 403 }
      );
    }

    const { galleryId } = await params;
    const body = await request.json();
    const { photoIds } = body;

    if (!photoIds?.length) {
      return NextResponse.json(
        { error: 'Photo IDs are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const studioId = session.user.id;

    // Verify gallery ownership
    const galleryRef = db.collection(COLLECTIONS.GALLERIES).doc(galleryId);
    const galleryDoc = await galleryRef.get();
    
    if (!galleryDoc.exists || galleryDoc.data()?.studioId !== studioId) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    const results: {
      success: string[];
      failed: string[];
    } = { success: [], failed: [] };

    // Process photos in batches of 3 (to avoid memory issues)
    const batchSize = 3;
    for (let i = 0; i < photoIds.length; i += batchSize) {
      const batch = photoIds.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (photoId: string) => {
        try {
          // Download from Drive
          const buffer = await downloadFile(googleAccessToken, photoId);
          
          // Process into three sizes
          const { thumbnail, preview, full } = await processImage(buffer);
          
          // Generate keys and upload to R2
          const fileName = `${photoId}.jpg`;
          
          const [thumbnailResult, previewResult, fullResult] = await Promise.all([
            uploadImage(
              thumbnail,
              generateImageKey(studioId, galleryId, 'thumbnail', fileName)
            ),
            uploadImage(
              preview,
              generateImageKey(studioId, galleryId, 'preview', fileName)
            ),
            uploadImage(
              full,
              generateImageKey(studioId, galleryId, 'full', fileName)
            ),
          ]);
          
          // Save photo document to Firestore
          const photoRef = db.collection(COLLECTIONS.GALLERY_PHOTOS).doc();
          await photoRef.set({
            galleryId,
            driveFileId: photoId,
            fileName,
            thumbnailKey: thumbnailResult.key,
            previewKey: previewResult.key,
            fullKey: fullResult.key,
            driveDownloadUrl: getDownloadUrl(photoId),
            order: photoIds.indexOf(photoId),
            createdAt: FieldValue.serverTimestamp(),
          });
          
          results.success.push(photoId);
        } catch (error) {
          console.error(`[Process] Failed to process photo ${photoId}:`, error);
          results.failed.push(photoId);
        }
      }));
    }

    // Update gallery with cover photo if this was the first processing
    const galleryData = galleryDoc.data();
    if (!galleryData?.coverPhotoKey && results.success.length > 0) {
      const coverPhotoId = galleryData?.coverPhotoId || results.success[0];
      const coverPhoto = await db
        .collection(COLLECTIONS.GALLERY_PHOTOS)
        .where('galleryId', '==', galleryId)
        .where('driveFileId', '==', coverPhotoId)
        .limit(1)
        .get();
      
      if (!coverPhoto.empty) {
        await galleryRef.update({
          coverPhotoKey: coverPhoto.docs[0].data().previewKey,
          photoCount: results.success.length,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.success.length}/${photoIds.length} photos`,
      results,
    });
  } catch (error) {
    console.error('[Process API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process images' },
      { status: 500 }
    );
  }
}
