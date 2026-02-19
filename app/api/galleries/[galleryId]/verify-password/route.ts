import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants';
import { compare } from 'bcryptjs';

// ============================================================
// POST /api/galleries/[galleryId]/verify-password
// ============================================================

export async function POST(
  request: Request,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params;
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }
    
    const db = getAdminDb();
    const galleryDoc = await db.collection(COLLECTIONS.GALLERIES).doc(galleryId).get();
    
    if (!galleryDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    const galleryData = galleryDoc.data();
    const passwordHash = galleryData?.passwordHash;
    
    if (!passwordHash) {
      // Gallery is not password protected
      return NextResponse.json({ success: true });
    }
    
    // Verify password
    const isValid = await compare(password, passwordHash);
    
    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[Verify Password API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}
