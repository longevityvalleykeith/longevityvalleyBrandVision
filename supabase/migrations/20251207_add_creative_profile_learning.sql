-- Phase 4: Universal Factory Implementation
-- Adds creative_profile column to users table and learning_events table
-- Migration: 20251207_add_creative_profile_learning.sql

-- ============================================================================
-- ADD CREATIVE PROFILE TO USERS TABLE
-- ============================================================================

-- Add the creative_profile JSONB column for storing UserCreativeProfile
-- This stores: biasVector, vocabularyWeights, directorWinRate
ALTER TABLE users
ADD COLUMN IF NOT EXISTS creative_profile JSONB;

-- Add comment for documentation
COMMENT ON COLUMN users.creative_profile IS 'User taste profile with bias vector, vocabulary weights, and director win rates (Phase 4: Studio Head)';

-- ============================================================================
-- CREATE LEARNING_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Foreign key to vision job
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,

  -- Raw Trinity scores from The Eye (objective truth)
  raw_scores JSONB NOT NULL,

  -- All Director pitches presented to user
  director_pitches JSONB NOT NULL,

  -- The Director the user selected
  selected_director_id VARCHAR(50) NOT NULL,

  -- The Learning Delta (objective vs subjective)
  learning_delta JSONB NOT NULL,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR LEARNING_EVENTS
-- ============================================================================

-- Index for user preference analysis
CREATE INDEX IF NOT EXISTS idx_learning_events_user_id
  ON learning_events(user_id);

-- Index for job lookup
CREATE INDEX IF NOT EXISTS idx_learning_events_job_id
  ON learning_events(job_id);

-- Index for director popularity tracking
CREATE INDEX IF NOT EXISTS idx_learning_events_director
  ON learning_events(selected_director_id);

-- Index for temporal analysis
CREATE INDEX IF NOT EXISTS idx_learning_events_created_at
  ON learning_events(created_at);

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own learning events
CREATE POLICY "Users can view own learning events"
  ON learning_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own learning events
CREATE POLICY "Users can create own learning events"
  ON learning_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE learning_events IS 'Phase 4: Silent Observer - Captures user Director selections for training the Studio Head';
COMMENT ON COLUMN learning_events.raw_scores IS 'Raw Trinity scores from The Eye (physics, vibe, logic)';
COMMENT ON COLUMN learning_events.director_pitches IS 'All Director pitches presented with biased scores';
COMMENT ON COLUMN learning_events.selected_director_id IS 'The Director persona the user selected';
COMMENT ON COLUMN learning_events.learning_delta IS 'Delta between objective AI recommendation and subjective user choice';
