import { google } from 'googleapis';
import { DriveFolder, DriveFile } from '@/types/gallery';

// ============================================================
// Google Drive Service
// ============================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

/**
 * Create an authenticated OAuth2 client
 */
function createOAuth2Client(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

/**
 * Create authenticated Drive API client
 */
function getDriveClient(accessToken: string) {
  const auth = createOAuth2Client(accessToken);
  return google.drive({ version: 'v3', auth });
}

// ============================================================
// Folder Operations
// ============================================================

/**
 * List all shared/public folders the user owns
 */
export async function listSharedFolders(accessToken: string): Promise<DriveFolder[]> {
  const drive = getDriveClient(accessToken);
  
  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and 'me' in owners and visibility != 'limited'",
      fields: 'files(id, name, mimeType, shared, webViewLink)',
      orderBy: 'name',
      pageSize: 100,
    });
    
    const folders = response.data.files || [];
    
    return folders.map(folder => ({
      id: folder.id!,
      name: folder.name!,
      mimeType: folder.mimeType!,
      shared: folder.shared || false,
      webViewLink: folder.webViewLink ?? undefined,
    }));
  } catch (error) {
    console.error('[Google Drive] Error listing folders:', error);
    throw new Error('Failed to list Google Drive folders');
  }
}

/**
 * List all folders (including non-shared) for browsing
 */
export async function listAllFolders(accessToken: string): Promise<DriveFolder[]> {
  const drive = getDriveClient(accessToken);
  
  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and 'me' in owners and trashed=false",
      fields: 'files(id, name, mimeType, shared, webViewLink)',
      orderBy: 'name',
      pageSize: 100,
    });
    
    const folders = response.data.files || [];
    
    return folders.map(folder => ({
      id: folder.id!,
      name: folder.name!,
      mimeType: folder.mimeType!,
      shared: folder.shared || false,
      webViewLink: folder.webViewLink ?? undefined,
    }));
  } catch (error) {
    console.error('[Google Drive] Error listing all folders:', error);
    throw new Error('Failed to list Google Drive folders');
  }
}

// ============================================================
// Image Operations
// ============================================================

/**
 * List images in a folder
 */
export async function listFolderImages(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const drive = getDriveClient(accessToken);
  
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: 'files(id, name, mimeType, size, thumbnailLink, webContentLink, createdTime)',
      orderBy: 'name',
      pageSize: 100,
    });
    
    const files = response.data.files || [];
    
    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size ? parseInt(file.size) : undefined,
      thumbnailLink: file.thumbnailLink ?? undefined,
      webContentLink: file.webContentLink ?? undefined,
      createdTime: file.createdTime ?? undefined,
    }));
  } catch (error) {
    console.error('[Google Drive] Error listing folder images:', error);
    throw new Error('Failed to list folder images');
  }
}

/**
 * Get a single file's metadata
 */
export async function getFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);
  
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, thumbnailLink, webContentLink, createdTime',
    });
    
    const file = response.data;
    
    return {
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size ? parseInt(file.size) : undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      webContentLink: file.webContentLink || undefined,
      createdTime: file.createdTime || undefined,
    };
  } catch (error) {
    console.error('[Google Drive] Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
}

/**
 * Download a file as buffer
 */
export async function downloadFile(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const drive = getDriveClient(accessToken);
  
  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error('[Google Drive] Error downloading file:', error);
    throw new Error('Failed to download file from Google Drive');
  }
}

/**
 * Get the direct download URL for a file
 * Note: This URL requires authentication or file must be publicly shared
 */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Check if a folder is publicly shared
 */
export async function isFolderPublic(
  accessToken: string,
  folderId: string
): Promise<boolean> {
  const drive = getDriveClient(accessToken);
  
  try {
    const response = await drive.permissions.list({
      fileId: folderId,
      fields: 'permissions(type, role)',
    });
    
    const permissions = response.data.permissions || [];
    
    // Check if there's an "anyone" permission (public)
    return permissions.some(p => p.type === 'anyone');
  } catch (error) {
    console.error('[Google Drive] Error checking folder permissions:', error);
    return false;
  }
}
