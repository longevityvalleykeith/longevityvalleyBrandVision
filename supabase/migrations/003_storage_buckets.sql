-- =============================================================================
-- Migration: 003_storage_buckets.sql
-- Supabase Storage Configuration
-- =============================================================================

-- =============================================================================
-- CREATE STORAGE BUCKETS
-- =============================================================================

-- Bucket for original user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  FALSE,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket for processed style references
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'style-references',
  'style-references',
  FALSE,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket for preview images (Flux output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'previews',
  'previews',
  TRUE,  -- Public for easy embedding
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket for final video outputs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  TRUE,  -- Public for easy embedding
  104857600,  -- 100MB limit
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE POLICIES: uploads bucket
-- =============================================================================

-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- STORAGE POLICIES: style-references bucket
-- =============================================================================

-- Service role can write style references
CREATE POLICY "Service role can write style references"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'style-references' AND
    auth.role() = 'service_role'
  );

-- Users can view their own style references
CREATE POLICY "Users can view own style references"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'style-references' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role full access to style references
CREATE POLICY "Service role full access to style references"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'style-references' AND
    auth.role() = 'service_role'
  );

-- =============================================================================
-- STORAGE POLICIES: previews bucket (public)
-- =============================================================================

-- Anyone can view previews (public bucket)
CREATE POLICY "Public read access to previews"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'previews');

-- Service role can write previews
CREATE POLICY "Service role can write previews"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'previews' AND
    auth.role() = 'service_role'
  );

-- Service role can delete previews
CREATE POLICY "Service role can delete previews"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'previews' AND
    auth.role() = 'service_role'
  );

-- =============================================================================
-- STORAGE POLICIES: videos bucket (public)
-- =============================================================================

-- Anyone can view videos (public bucket)
CREATE POLICY "Public read access to videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

-- Service role can write videos
CREATE POLICY "Service role can write videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.role() = 'service_role'
  );

-- Service role can delete videos
CREATE POLICY "Service role can delete videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    auth.role() = 'service_role'
  );

-- =============================================================================
-- HELPER FUNCTION: Generate Storage Path
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_storage_path(
  p_user_id UUID,
  p_job_id UUID,
  p_filename VARCHAR
) RETURNS TEXT AS $$
BEGIN
  RETURN p_user_id::text || '/' || p_job_id::text || '/' || p_filename;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- HELPER FUNCTION: Get Public URL
-- =============================================================================

CREATE OR REPLACE FUNCTION get_public_url(
  p_bucket_id TEXT,
  p_path TEXT
) RETURNS TEXT AS $$
DECLARE
  supabase_url TEXT;
BEGIN
  -- This will be replaced with actual Supabase URL during deployment
  supabase_url := current_setting('app.supabase_url', TRUE);
  IF supabase_url IS NULL THEN
    supabase_url := 'https://YOUR_PROJECT.supabase.co';
  END IF;
  
  RETURN supabase_url || '/storage/v1/object/public/' || p_bucket_id || '/' || p_path;
END;
$$ LANGUAGE plpgsql STABLE;
