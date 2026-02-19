import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listAllFolders, listSharedFolders } from '@/lib/google-drive';

// ============================================================
// GET /api/drive/folders - List Drive folders
// ============================================================

export async function GET(request: Request) {
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

    // Check query params for filter type
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let folders;
    if (filter === 'shared') {
      folders = await listSharedFolders(googleAccessToken);
    } else {
      folders = await listAllFolders(googleAccessToken);
    }

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('[Drive Folders API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Drive folders' },
      { status: 500 }
    );
  }
}
