/**
 * Supabase Storage Utility
 *
 * Handles file uploads to Supabase Storage with user-specific paths for RLS.
 *
 * @module server/utils/supabaseStorage
 * @version 3.0.0
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'brand-assets';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Upload file to Supabase Storage with user-specific path for RLS
 *
 * @param buffer - File buffer
 * @param filename - Original filename
 * @param mimeType - File MIME type
 * @param userId - User ID for RLS path
 * @returns Public URL of uploaded file
 */
export async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  userId: string
): Promise<string> {
  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedFilename.split('.').pop() || 'jpg';

  // User-specific path for RLS: uploads/{userId}/{timestamp}-{filename}
  const storagePath = `uploads/${userId}/${timestamp}-${sanitizedFilename}`;

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Unknown upload error');
  }
}

/**
 * Delete file from Supabase Storage
 *
 * @param fileUrl - Public URL of file to delete
 * @param userId - User ID for verification
 */
export async function deleteFromSupabaseStorage(
  fileUrl: string,
  userId: string
): Promise<void> {
  try {
    // Extract storage path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const storagePath = pathParts.slice(pathParts.indexOf('uploads')).join('/');

    // Verify path belongs to user
    if (!storagePath.startsWith(`uploads/${userId}/`)) {
      throw new Error('Unauthorized: File does not belong to user');
    }

    // Delete from storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error instanceof Error ? error : new Error('Unknown delete error');
  }
}

/**
 * Check if storage bucket exists, create if not
 */
export async function ensureStorageBucket(): Promise<void> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();

    const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (error) {
        console.error('Failed to create storage bucket:', error);
      } else {
        console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
  }
}

// Initialize bucket on module load
ensureStorageBucket().catch(console.error);
