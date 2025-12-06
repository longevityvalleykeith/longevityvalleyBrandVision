/**
 * Longevity Valley - Supabase Client
 * 
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';
// Note: Database type generation moved to Drizzle schema
// import type { Database } from '../types/database';

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// =============================================================================
// CLIENT INSTANCES
// =============================================================================

/**
 * Public Supabase client (for browser/client-side)
 * Uses anon key with RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'longevity-valley',
    },
  },
});

/**
 * Service role client (for server-side only)
 * Bypasses RLS - use with caution
 */
export function createServiceClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl!, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// STORAGE HELPERS
// =============================================================================

export const STORAGE_BUCKETS = {
  UPLOADS: 'uploads',
  STYLE_REFERENCES: 'style-references',
  PREVIEWS: 'previews',
  VIDEOS: 'videos',
} as const;

/**
 * Generate storage path for a file
 */
export function generateStoragePath(
  userId: string,
  jobId: string,
  filename: string
): string {
  return `${userId}/${jobId}/${filename}`;
}

/**
 * Get public URL for a storage object
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload file to storage
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ url: string; path: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const url = getPublicUrl(bucket, data.path);
  return { url, path: data.path };
}

/**
 * Delete file from storage
 */
export async function deleteFromStorage(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(`Auth error: ${error.message}`);
  }
  
  return user;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Session error: ${error.message}`);
  }
  
  return session;
}

// =============================================================================
// REALTIME HELPERS
// =============================================================================

/**
 * Subscribe to job status changes
 */
export function subscribeToJobStatus(
  jobId: string,
  callback: (status: string) => void
) {
  return supabase
    .channel(`job-${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vision_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        callback(payload.new.status);
      }
    )
    .subscribe();
}

/**
 * Subscribe to video prompt status changes
 */
export function subscribeToVideoPromptStatus(
  promptId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`prompt-${promptId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vision_job_video_prompts',
        filter: `id=eq.${promptId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}
