import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { R2UploadResult } from '@/types/gallery';

// ============================================================
// Cloudflare R2 Storage Service
// ============================================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// Validate R2 configuration
function validateR2Config(): void {
  const missing: string[] = [];
  if (!R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
  if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
  if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  if (!R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');
  if (!R2_PUBLIC_URL) missing.push('R2_PUBLIC_URL');
  
  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(', ')}`);
  }
}

// Create S3 client configured for Cloudflare R2
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;
  
  validateR2Config();
  
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  
  return r2Client;
}

// ============================================================
// Upload Functions
// ============================================================

/**
 * Generate a unique key for storing images
 * Format: studios/{studioId}/galleries/{galleryId}/{type}/{filename}
 */
export function generateImageKey(
  studioId: string,
  galleryId: string,
  type: 'thumbnail' | 'preview' | 'full',
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `studios/${studioId}/galleries/${galleryId}/${type}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Upload an image buffer to R2
 */
export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<R2UploadResult> {
  const client = getR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  
  await client.send(command);
  
  return {
    key,
    url: getPublicUrl(key),
    size: buffer.length,
  };
}

/**
 * Upload multiple images in parallel with concurrency limit
 */
export async function uploadImagesParallel(
  uploads: { buffer: Buffer; key: string; contentType?: string }[],
  concurrency: number = 5
): Promise<R2UploadResult[]> {
  const results: R2UploadResult[] = [];
  
  for (let i = 0; i < uploads.length; i += concurrency) {
    const batch = uploads.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(({ buffer, key, contentType }) =>
        uploadImage(buffer, key, contentType || 'image/jpeg')
      )
    );
    results.push(...batchResults);
  }
  
  return results;
}

// ============================================================
// Delete Functions
// ============================================================

/**
 * Delete an image from R2
 */
export async function deleteImage(key: string): Promise<void> {
  const client = getR2Client();
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  
  await client.send(command);
}

/**
 * Delete multiple images from R2
 */
export async function deleteImages(keys: string[]): Promise<void> {
  await Promise.all(keys.map(key => deleteImage(key)));
}

// ============================================================
// URL Functions
// ============================================================

/**
 * Get public URL for an R2 object
 */
export function getPublicUrl(key: string): string {
  // Remove trailing slash from R2_PUBLIC_URL if present
  const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  return `${baseUrl}/${key}`;
}

/**
 * Extract key from public URL
 */
export function getKeyFromUrl(url: string): string | null {
  const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  if (!url.startsWith(baseUrl)) return null;
  return url.replace(`${baseUrl}/`, '');
}
