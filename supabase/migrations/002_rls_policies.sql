-- =============================================================================
-- Migration: 002_rls_policies.sql
-- Row Level Security Policies
-- =============================================================================

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_job_video_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_presets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can manage all users
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- VISION_JOBS TABLE POLICIES
-- =============================================================================

-- Users can view their own jobs
CREATE POLICY "Users can view own vision jobs"
  ON vision_jobs FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can create jobs for themselves
CREATE POLICY "Users can create own vision jobs"
  ON vision_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending/failed jobs
CREATE POLICY "Users can update own vision jobs"
  ON vision_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own jobs
CREATE POLICY "Users can delete own vision jobs"
  ON vision_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all jobs (for background processing)
CREATE POLICY "Service role full access to vision jobs"
  ON vision_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- VISION_JOB_VIDEO_PROMPTS TABLE POLICIES
-- =============================================================================

-- Users can view their own video prompts (via job ownership)
CREATE POLICY "Users can view own video prompts"
  ON vision_job_video_prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vision_jobs
      WHERE vision_jobs.id = vision_job_video_prompts.job_id
      AND vision_jobs.user_id = auth.uid()
      AND vision_jobs.deleted_at IS NULL
    )
  );

-- Users can create video prompts for their own jobs
CREATE POLICY "Users can create own video prompts"
  ON vision_job_video_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vision_jobs
      WHERE vision_jobs.id = vision_job_video_prompts.job_id
      AND vision_jobs.user_id = auth.uid()
    )
  );

-- Users can update their own video prompts
CREATE POLICY "Users can update own video prompts"
  ON vision_job_video_prompts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vision_jobs
      WHERE vision_jobs.id = vision_job_video_prompts.job_id
      AND vision_jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vision_jobs
      WHERE vision_jobs.id = vision_job_video_prompts.job_id
      AND vision_jobs.user_id = auth.uid()
    )
  );

-- Service role can manage all video prompts
CREATE POLICY "Service role full access to video prompts"
  ON vision_job_video_prompts FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RATE_LIMIT_BUCKETS TABLE POLICIES
-- =============================================================================

-- Only service role can access rate limits (managed by backend)
CREATE POLICY "Service role only for rate limits"
  ON rate_limit_buckets FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- AUDIT_LOGS TABLE POLICIES
-- =============================================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can view all audit logs
CREATE POLICY "Service role full access to audit logs"
  ON audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- STYLE_PRESETS TABLE POLICIES
-- =============================================================================

-- All authenticated users can view active presets
CREATE POLICY "Authenticated users can view active style presets"
  ON style_presets FOR SELECT
  USING (is_active = TRUE AND auth.role() = 'authenticated');

-- Premium presets require pro/enterprise plan
CREATE POLICY "Premium presets require paid plan"
  ON style_presets FOR SELECT
  USING (
    is_active = TRUE AND (
      is_premium = FALSE OR
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.plan IN ('pro', 'enterprise')
      )
    )
  );

-- Service role can manage all presets
CREATE POLICY "Service role full access to style presets"
  ON style_presets FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- HELPER FUNCTION: Check Job Ownership
-- =============================================================================

CREATE OR REPLACE FUNCTION user_owns_job(job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vision_jobs
    WHERE id = job_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check User Credits
-- =============================================================================

CREATE OR REPLACE FUNCTION user_has_credits(required_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND credits_remaining >= required_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Deduct User Credits
-- =============================================================================

CREATE OR REPLACE FUNCTION deduct_user_credits(amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits_remaining INTO current_credits
  FROM users
  WHERE id = auth.uid()
  FOR UPDATE;
  
  IF current_credits >= amount THEN
    UPDATE users
    SET credits_remaining = credits_remaining - amount
    WHERE id = auth.uid();
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
