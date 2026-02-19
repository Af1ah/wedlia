// ============================================================
// Gallery Types
// ============================================================

/**
 * Google Drive folder metadata
 */
export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  shared: boolean;
  webViewLink?: string;
}

/**
 * Google Drive file/image metadata
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime?: string;
}

/**
 * Photo stored in gallery with multiple resolutions
 */
export interface GalleryPhoto {
  id: string;
  galleryId: string;
  driveFileId: string;
  fileName: string;
  // R2 storage keys
  thumbnailKey: string;  // ~50KB for fast grid
  previewKey: string;    // ~500KB for grid display
  fullKey: string;       // ~3MB for dedicated view
  // Direct Drive link for download
  driveDownloadUrl: string;
  order: number;
  createdAt: Date;
}

/**
 * Gallery section for organizing photos
 */
export interface GallerySection {
  id: string;
  name: string;
  photoIds: string[];
  order: number;
}

/**
 * Gallery document stored in Firestore
 */
export interface Gallery {
  id: string;
  studioId: string;
  name: string;
  subName?: string;
  description?: string;
  // Cover image (R2 key)
  coverPhotoKey: string;
  coverPhotoId: string;
  // Privacy settings
  isPublic: boolean;
  passwordHash?: string; // bcrypt hash if password protected
  // Source Drive folder
  driveFolderId: string;
  driveFolderName: string;
  // Organization
  sections: GallerySection[];
  photoCount: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Studio profile for portfolio pages
 */
export interface StudioProfile {
  id: string;
  userId: string;
  subdomain: string; // unique subdomain for portfolio
  displayName: string;
  logo?: string;
  description?: string;
  contactEmail?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gallery creation request payload
 */
export interface CreateGalleryRequest {
  name: string;
  subName?: string;
  description?: string;
  driveFolderId: string;
  driveFolderName: string;
  selectedPhotoIds: string[];
  coverPhotoId: string;
  password?: string;
  sections?: { name: string; photoIds: string[] }[];
}

/**
 * Image compression options
 */
export interface CompressionOptions {
  width?: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

/**
 * R2 upload result
 */
export interface R2UploadResult {
  key: string;
  url: string;
  size: number;
}
