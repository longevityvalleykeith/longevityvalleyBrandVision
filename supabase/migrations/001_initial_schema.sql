-- =============================================================================
-- Migration: 001_initial_schema.sql
-- Longevity Valley Brand Content Factory
-- Version: 2.0.0
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE vision_job_status AS ENUM (
  'pending',
  'analyzing', 
  'completed',
  'flagged',
  'failed'
);

CREATE TYPE video_prompt_status AS ENUM (
  'scripting',
  'preview_generation',
  'review',
  'rendering',
  'completed',
  'failed'
);

CREATE TYPE production_engine AS ENUM (
  'KLING',
  'LUMA',
  'GEMINI_PRO'
);

CREATE TYPE traffic_light AS ENUM (
  'PENDING',
  'GREEN',
  'YELLOW',
  'RED'
);

CREATE TYPE user_plan AS ENUM (
  'free',
  'pro',
  'enterprise'
);

-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  plan user_plan DEFAULT 'free' NOT NULL,
  credits_remaining INTEGER DEFAULT 10 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT credits_non_negative CHECK (credits_remaining >= 0)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: vision_jobs (Phase 3B - Brand Analysis)
-- =============================================================================

CREATE TABLE vision_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Original Upload
  image_url TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash VARCHAR(64),  -- SHA256 for deduplication
  
  -- Style Reference (Generated during analysis)
  style_reference_url TEXT,
  brand_essence_prompt TEXT,
  
  -- Analysis Results
  status vision_job_status DEFAULT 'pending' NOT NULL,
  analysis_data JSONB,  -- Full Gemini output
  
  -- Scores (denormalized for efficient routing queries)
  physics_score DECIMAL(3,2),
  vibe_score DECIMAL(3,2),
  logic_score DECIMAL(3,2),
  integrity_score DECIMAL(3,2),
  
  -- Error Tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB
  CONSTRAINT valid_scores CHECK (
    (physics_score IS NULL OR (physics_score >= 0 AND physics_score <= 1)) AND
    (vibe_score IS NULL OR (vibe_score >= 0 AND vibe_score <= 1)) AND
    (logic_score IS NULL OR (logic_score >= 0 AND logic_score <= 1)) AND
    (integrity_score IS NULL OR (integrity_score >= 0 AND integrity_score <= 1))
  ),
  CONSTRAINT retry_limit CHECK (retry_count <= 5)
);

-- Indexes (P0 Critical: All foreign keys and query columns)
CREATE INDEX idx_vision_jobs_user_id ON vision_jobs(user_id);
CREATE INDEX idx_vision_jobs_status ON vision_jobs(status);
CREATE INDEX idx_vision_jobs_created_at ON vision_jobs(created_at DESC);
CREATE INDEX idx_vision_jobs_user_status ON vision_jobs(user_id, status);
CREATE INDEX idx_vision_jobs_file_hash ON vision_jobs(file_hash);
CREATE INDEX idx_vision_jobs_routing ON vision_jobs(physics_score, vibe_score, logic_score) 
  WHERE status = 'completed';

-- Updated_at trigger
CREATE TRIGGER vision_jobs_updated_at
  BEFORE UPDATE ON vision_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: vision_job_video_prompts (Phase 3C - The Director)
-- =============================================================================

CREATE TABLE vision_job_video_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  
  -- Routing Decision
  production_engine production_engine NOT NULL,
  routing_reason TEXT,
  
  -- Workflow State
  status video_prompt_status DEFAULT 'scripting' NOT NULL,
  
  -- Scene Data (JSONB array)
  scenes_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Conversation Context (for YELLOW flow)
  conversation_history JSONB DEFAULT '[]'::jsonb,
  
  -- External API Tracking
  external_job_id VARCHAR(100),
  
  -- Cost Tracking
  credits_used DECIMAL(10,2) DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT credits_non_negative CHECK (credits_used >= 0)
);

-- Indexes
CREATE INDEX idx_video_prompts_job_id ON vision_job_video_prompts(job_id);
CREATE INDEX idx_video_prompts_status ON vision_job_video_prompts(status);
CREATE INDEX idx_video_prompts_engine ON vision_job_video_prompts(production_engine);
CREATE INDEX idx_video_prompts_external_job ON vision_job_video_prompts(external_job_id) 
  WHERE external_job_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER video_prompts_updated_at
  BEFORE UPDATE ON vision_job_video_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: rate_limit_buckets (P0 Critical)
-- =============================================================================

CREATE TABLE rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) NOT NULL,  -- user_id:endpoint or ip:endpoint
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 0 NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Unique constraint for upsert
  UNIQUE(identifier, endpoint)
);

-- Indexes
CREATE INDEX idx_rate_limit_window_end ON rate_limit_buckets(window_end);

-- =============================================================================
-- TABLE: audit_logs
-- =============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- TABLE: style_presets (Optional - for predefined styles)
-- =============================================================================

CREATE TABLE style_presets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  prompt_layer TEXT NOT NULL,
  hidden_ref_url TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_style_presets_category ON style_presets(category);
CREATE INDEX idx_style_presets_active ON style_presets(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- FUNCTIONS: Utility Functions
-- =============================================================================

-- Function to determine production engine based on scores
CREATE OR REPLACE FUNCTION determine_production_engine(
  p_physics_score DECIMAL,
  p_vibe_score DECIMAL,
  p_logic_score DECIMAL
) RETURNS production_engine AS $$
BEGIN
  -- Priority: Physics > Vibe > Logic
  IF p_physics_score >= 0.7 THEN
    RETURN 'KLING';
  ELSIF p_vibe_score >= 0.7 THEN
    RETURN 'LUMA';
  ELSIF p_logic_score >= 0.7 THEN
    RETURN 'GEMINI_PRO';
  ELSE
    -- Default to LUMA for balanced content
    RETURN 'LUMA';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if job should be flagged
CREATE OR REPLACE FUNCTION should_flag_job(
  p_integrity_score DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_integrity_score IS NOT NULL AND p_integrity_score < 0.4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean up expired rate limit buckets
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_buckets
  WHERE window_end < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS: Auto-flag low integrity jobs
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_flag_low_integrity()
RETURNS TRIGGER AS $$
BEGIN
  IF should_flag_job(NEW.integrity_score) AND NEW.status != 'flagged' THEN
    NEW.status := 'flagged';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vision_jobs_auto_flag
  BEFORE UPDATE OF integrity_score ON vision_jobs
  FOR EACH ROW
  EXECUTE FUNCTION auto_flag_low_integrity();

-- =============================================================================
-- COMMENTS: Documentation
-- =============================================================================

COMMENT ON TABLE users IS 'User accounts for the Brand Content Factory';
COMMENT ON TABLE vision_jobs IS 'Phase 3B: Brand analysis jobs from uploaded images';
COMMENT ON TABLE vision_job_video_prompts IS 'Phase 3C: Video director sessions linked to vision jobs';
COMMENT ON TABLE rate_limit_buckets IS 'Rate limiting state for API endpoints';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and debugging';

COMMENT ON COLUMN vision_jobs.style_reference_url IS 'Processed derivative image for downstream agents (Flux img2img output)';
COMMENT ON COLUMN vision_jobs.brand_essence_prompt IS 'Distilled brand description for prompt injection';
COMMENT ON COLUMN vision_jobs.physics_score IS 'Score 0-1 indicating liquid/physics dynamics content';
COMMENT ON COLUMN vision_jobs.vibe_score IS 'Score 0-1 indicating aesthetic/mood-driven content';
COMMENT ON COLUMN vision_jobs.logic_score IS 'Score 0-1 indicating text/logical content';
COMMENT ON COLUMN vision_jobs.integrity_score IS 'Score 0-1 indicating input authenticity (< 0.4 = flagged)';

COMMENT ON COLUMN vision_job_video_prompts.scenes_data IS 'JSON array of SceneData objects with traffic light status';
COMMENT ON COLUMN vision_job_video_prompts.conversation_history IS 'Context for YELLOW flow conversational edits';

COMMENT ON FUNCTION determine_production_engine IS 'Routes content to appropriate production engine based on scores';
COMMENT ON FUNCTION should_flag_job IS 'Checks if job should be flagged for low integrity';
