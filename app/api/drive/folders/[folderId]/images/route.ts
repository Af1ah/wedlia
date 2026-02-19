import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listFolderImages } from '@/lib/google-drive';

// ============================================================
// GET /api/drive/folders/[folderId]/images - List images in folder
// ============================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ folderId: string }> }
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
        { error: 'Google Drive not connected. Please re-login with Google.' },
        { status: 403 }
      );
    }

    const { folderId } = await params;
    
    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    const images = await listFolderImages(googleAccessToken, folderId);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('[Drive Images API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder images' },
      { status: 500 }
    );
  }
}
