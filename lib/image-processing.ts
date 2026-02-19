import sharp from 'sharp';
import { CompressionOptions } from '@/types/gallery';

// ============================================================
// Image Processing Service
// ============================================================

/**
 * Compression presets for different image sizes
 */
export const COMPRESSION_PRESETS = {
  // ~50KB - Fast grid loading thumbnail
  thumbnail: {
    width: 400,
    quality: 70,
    format: 'jpeg' as const,
  },
  // ~500KB - Grid display preview
  preview: {
    width: 1920,
    quality: 80,
    format: 'jpeg' as const,
  },
  // ~3MB - Full view, keep resolution
  full: {
    width: undefined, // Keep original width
    quality: 85,
    format: 'jpeg' as const,
  },
} satisfies Record<string, CompressionOptions>;

// ============================================================
// Compression Functions
// ============================================================

/**
 * Compress an image buffer with given options
 */
export async function compressImage(
  inputBuffer: Buffer,
  options: CompressionOptions
): Promise<Buffer> {
  let pipeline = sharp(inputBuffer);
  
  // Resize if width is specified
  if (options.width) {
    pipeline = pipeline.resize(options.width, undefined, {
      withoutEnlargement: true, // Don't upscale small images
      fit: 'inside',
    });
  }
  
  // Apply format and quality
  if (options.format === 'webp') {
    pipeline = pipeline.webp({ quality: options.quality });
  } else {
    pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true });
  }
  
  return pipeline.toBuffer();
}

/**
 * Generate thumbnail (~50KB for fast grid loading)
 */
export async function generateThumbnail(inputBuffer: Buffer): Promise<Buffer> {
  return compressImage(inputBuffer, COMPRESSION_PRESETS.thumbnail);
}

/**
 * Generate preview (~500KB for grid display)
 */
export async function generatePreview(inputBuffer: Buffer): Promise<Buffer> {
  return compressImage(inputBuffer, COMPRESSION_PRESETS.preview);
}

/**
 * Generate full size (~3MB for dedicated view)
 */
export async function generateFull(inputBuffer: Buffer): Promise<Buffer> {
  return compressImage(inputBuffer, COMPRESSION_PRESETS.full);
}

/**
 * Process an image and generate all three sizes
 */
export async function processImage(inputBuffer: Buffer): Promise<{
  thumbnail: Buffer;
  preview: Buffer;
  full: Buffer;
}> {
  const [thumbnail, preview, full] = await Promise.all([
    generateThumbnail(inputBuffer),
    generatePreview(inputBuffer),
    generateFull(inputBuffer),
  ]);
  
  return { thumbnail, preview, full };
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
  };
}

/**
 * Validate that a buffer is a valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get estimated compressed sizes for an image
 */
export async function estimateCompressedSizes(buffer: Buffer): Promise<{
  original: number;
  thumbnail: number;
  preview: number;
  full: number;
}> {
  const [thumbnail, preview, full] = await Promise.all([
    generateThumbnail(buffer),
    generatePreview(buffer),
    generateFull(buffer),
  ]);
  
  return {
    original: buffer.length,
    thumbnail: thumbnail.length,
    preview: preview.length,
    full: full.length,
  };
}
