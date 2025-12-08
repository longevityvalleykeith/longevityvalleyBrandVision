/**
 * Phase 3 - Core Types & Constants
 *
 * Single Source of Truth for all TypeScript types.
 *
 * @module types/index
 * @version 3.0.0
 */

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

export const VALIDATION = {
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILENAME_LENGTH: 255,
  MAX_FEEDBACK_LENGTH: 500,
  MIN_QUALITY_SCORE: 7.0,
  MAX_PROMPT_LENGTH: 2000,
  MAX_SCENES: 10,
  MAGIC_BYTES: {
    JPEG: [0xFF, 0xD8, 0xFF] as const,
    PNG: [0x89, 0x50, 0x4E, 0x47] as const,
    WEBP: [0x52, 0x49, 0x46, 0x46] as const, // + WEBP at offset 8
  } as const,
} as const;

export const RATE_LIMITS = {
  GENERATE_RPM: 10, // Generate endpoint: 10 requests per minute
  UPLOAD_RPM: 20, // Upload endpoint: 20 requests per minute
  REFINE_RPM: 30, // Refine endpoint: 30 requests per minute
  API_RPM: 60, // General API: 60 requests per minute
  WINDOW_MS: 60000, // 1 minute window
} as const;

// =============================================================================
// ENUMS
// =============================================================================

export type TrafficLightStatus = 'PENDING' | 'GREEN' | 'YELLOW' | 'RED';

export type DirectorStage =
  | 'IDLE'
  | 'QUALITY_CHECK'
  | 'QUALITY_FAILED'
  | 'REMASTERING'
  | 'STORYBOARD_REVIEW'
  | 'RENDERING'
  | 'COMPLETED';

export type VisionJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type VideoPromptStatus =
  | 'idle'
  | 'reviewing'
  | 'rendering'
  | 'completed'
  | 'failed';

export type ProductionEngine = 'KLING' | 'LUMA' | 'GEMINI_PRO';

export type UserPlan = 'free' | 'pro' | 'enterprise';

// =============================================================================
// UNIVERSAL ADAPTER PATTERN (Multi-Domain Input)
// =============================================================================

/**
 * Source types for the Universal Adapter
 * Enables Legacy and Neuromorphic integration
 */
export type UniversalSourceType = 'IMAGE_UPLOAD' | 'LEGACY_SQL' | 'BIOMETRIC_SENSOR';

/**
 * Domain types for routing to appropriate scoring matrices
 */
export type UniversalDomain = 'BRAND' | 'HEALTH' | 'FINANCE';

/**
 * Universal Input - Standardized interface for all data sources
 *
 * Legacy Integration: Convert old SQL data into this format
 * Neuromorphic Ready: Swap processing logic, keep interface identical
 */
export interface UniversalInput {
  /** The type of data source */
  sourceType: UniversalSourceType;
  /** Raw payload from the source */
  rawData: unknown;
  /** Domain determines which scoring matrix to use */
  domain: UniversalDomain;
  /** Optional metadata about the source */
  metadata?: {
    sourceId?: string;
    timestamp?: Date;
    userId?: string;
  };
}

/**
 * Universal Analysis - Standardized output from The Eye
 *
 * Contains only objective facts, no interpretation
 */
export interface UniversalAnalysis {
  /** Objective facts extracted from input (colors, vitals, revenue, etc.) */
  objectiveFacts: Record<string, unknown>;
  /** Confidence score for the analysis (0-1) */
  integrityScore: number;
  /** Domain-specific scores */
  scores: {
    /** Brand: Physics | Health: Biomarker | Finance: Risk */
    primary: number;
    /** Brand: Vibe | Health: Trend | Finance: Growth */
    secondary: number;
    /** Brand: Logic | Health: Urgency | Finance: Stability */
    tertiary: number;
  };
  /** Rationale for each score */
  rationale: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  /** Timestamp of analysis */
  analyzedAt: Date;
}

// =============================================================================
// USER CREATIVE PROFILE (The Taste Profile)
// =============================================================================

/**
 * User's creative bias vector
 * Updated via Weighted Moving Average (recent choices matter more)
 */
export interface UserBiasVector {
  /** Does user prefer realistic motion? (0-1) */
  physicsAffinity: number;
  /** Does user prefer abstract beauty? (0-1) */
  vibeAffinity: number;
  /** Does user accept AI hallucinations? (0-1) */
  riskTolerance: number;
  /** Does user prefer short commentary? (0-1) */
  brevityPreference: number;
}

/**
 * Director performance tracking for a user
 */
export interface DirectorPerformance {
  wins: number;
  losses: number;
  streak: number;
  lastSelected?: Date;
}

/**
 * User Creative Profile - The evolving taste profile
 *
 * Stored as JSONB in user_preferences column
 * Updated by the Studio Head after each selection
 */
export interface UserCreativeProfile {
  /** The user this profile belongs to */
  userId: string;

  /** The bias vector (0-1 weights) */
  biasVector: UserBiasVector;

  /** Words that appeared in winning vs losing pitches */
  vocabularyWeights: Record<string, number>;

  /** Per-director win/loss tracking */
  directorWinRate: Record<string, DirectorPerformance>;

  /** Total selections made (for weighting calculations) */
  totalSelections: number;

  /** Profile version for migrations */
  version: number;

  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Create a default UserCreativeProfile for new users
 */
export function createDefaultUserProfile(userId: string): UserCreativeProfile {
  return {
    userId,
    biasVector: {
      physicsAffinity: 0.5,
      vibeAffinity: 0.5,
      riskTolerance: 0.3,
      brevityPreference: 0.5,
    },
    vocabularyWeights: {},
    directorWinRate: {},
    totalSelections: 0,
    version: 1,
    updatedAt: new Date(),
  };
}

// =============================================================================
// LEARNING EVENT (For Training Data Collection)
// =============================================================================

/**
 * Learning Event - Captures user selection for training
 *
 * Stored in learning_events table for the Studio Head to process
 */
export interface LearningEvent {
  /** Unique event ID */
  id: string;
  /** User who made the selection */
  userId: string;
  /** The vision job this relates to */
  jobId: string;
  /** Raw Trinity scores from The Eye */
  rawScores: {
    physics: number;
    vibe: number;
    logic: number;
  };
  /** All Director pitches presented */
  directorPitches: Array<{
    directorId: string;
    biasedScores: { physics: number; vibe: number; logic: number };
    recommendedEngine: 'kling' | 'luma';
  }>;
  /** The Director the user selected */
  selectedDirectorId: string;
  /** The Delta: objective vs subjective choice */
  learningDelta: {
    /** Which score dimension was highest objectively */
    objectiveWinner: 'physics' | 'vibe' | 'logic';
    /** Which score dimension the user preferred */
    subjectiveChoice: 'physics' | 'vibe' | 'logic';
    /** Did user override the AI's recommendation? */
    wasOverride: boolean;
  };
  /** Timestamp of selection */
  createdAt: Date;
}

// =============================================================================
// TWO-STEP ARCHITECTURE: THE EYE (Raw Analysis)
// =============================================================================

/**
 * RawPixelAnalysis - Objective, Director-agnostic image analysis
 *
 * This is the output of "The Eye" - pure pixel analysis without
 * any personality or interpretation layered on top.
 *
 * Cached and reused when users switch Directors.
 */
export interface RawPixelAnalysis {
  /** Detected brand attributes from pixels */
  brand_attributes: {
    primary_colors: string[];
    typography_style?: string;
    mood: string;
    industry?: string;
  };

  /** Visual composition analysis */
  visual_elements: {
    composition: string;
    focal_points: string[];
    style_keywords: string[];
    /** Detected objects in the scene */
    detected_objects?: string[];
    /** OCR text found in image */
    detected_text?: string[];
  };

  /** Quality metrics */
  quality_score: number; // 0-10
  integrity_score: number; // 0-1

  /** The Trinity - Raw scores before Director bias applied */
  physics_score: number; // 0-10: Motion complexity
  vibe_score: number; // 0-10: Emotional impact
  logic_score: number; // 0-10: Narrative clarity

  /** Brief rationale for each score */
  scoring_rationale: {
    physics: string;
    vibe: string;
    logic: string;
  };

  /** Timestamp of analysis */
  analyzed_at: Date;
}

// =============================================================================
// TWO-STEP ARCHITECTURE: THE VOICE (Director Pitch)
// =============================================================================

/**
 * SceneBoardFrame - A single keyframe in the video timeline
 */
export interface SceneBoardFrame {
  /** Timestamp (e.g., "0s", "2.5s", "5s") */
  time: string;
  /** Visual description for this moment */
  visual: string;
  /** Camera movement/position */
  camera: string;
}

/**
 * SceneBoard - Temporal breakdown of the video
 */
export interface SceneBoard {
  start: SceneBoardFrame;
  middle: SceneBoardFrame;
  end: SceneBoardFrame;
}

/**
 * DirectorPitch - The Director's interpretation of raw analysis
 *
 * This is the output of "The Voice" - a specific Director's
 * creative interpretation with their personality, biases, and style.
 */
export interface DirectorPitch {
  /** The Director who created this pitch */
  director_id: string;

  /** The 3-Beat Pulse commentary */
  three_beat_pulse: {
    vision: string; // What's the subject?
    safety: string; // What must we protect?
    magic: string; // Why this engine? What feeling?
  };

  /** Formatted director commentary with emojis */
  director_commentary: string;

  /** Temporal scene breakdown */
  scene_board: SceneBoard;

  /** Biased scores (after Director multipliers applied) */
  biased_scores: {
    physics: number;
    vibe: number;
    logic: number;
  };

  /** Final routing decision */
  recommended_engine: 'kling' | 'luma';

  /** Style preset recommendation */
  recommended_style_id: string;

  /** Risk level based on Director profile */
  risk_level: 'Safe' | 'Balanced' | 'Experimental';

  /** Timestamp of pitch generation */
  generated_at: Date;
}

// =============================================================================
// GEMINI ANALYSIS OUTPUT (Legacy + Combined)
// =============================================================================

export interface GeminiAnalysisOutput {
  brand_attributes: {
    primary_colors: string[];
    typography_style?: string;
    mood: string;
    industry?: string;
  };
  visual_elements: {
    composition: string;
    focal_points: string[];
    style_keywords: string[];
  };
  // Legacy scores (kept for backwards compatibility)
  quality_score: number; // 0-10
  integrity_score: number; // 0-1

  // Proprietary Scoring Matrix (The Trinity)
  physics_score: number; // 0-10: Motion complexity, camera movement potential, dynamic elements
  vibe_score: number; // 0-10: Emotional resonance, aesthetic appeal, brand alignment
  logic_score: number; // 0-10: Narrative clarity, message coherence, call-to-action strength

  // Scoring rationale (brief explanations for each score)
  scoring_rationale?: {
    physics: string;
    vibe: string;
    logic: string;
  };

  // Director Commentary - Film Director style explanation of routing decision
  director_commentary?: string;

  // Scene Board (temporal breakdown)
  scene_board?: SceneBoard;

  recommended_style_id?: string;
  recommended_engine?: 'kling' | 'luma'; // Based on physics vs vibe scores

  // Director metadata (when using Two-Step Architecture)
  director_id?: string;

  // Rashomon Effect - All 4 director pitches (Phase 4 enhancement)
  all_director_pitches?: DirectorPitch[];
  recommended_director_id?: string;
}

// =============================================================================
// VIDEO SCENE
// =============================================================================

export interface VideoScene {
  id: string;
  sequence_index: number;
  action_token: string; // Descriptive prompt for the scene
  status: TrafficLightStatus;
  preview_url?: string;
  video_url?: string;
  user_feedback?: string | null;
  engine?: ProductionEngine;
  attempt_count: number; // Number of refinement attempts
}

// =============================================================================
// DIRECTOR STATE
// =============================================================================

export interface DirectorState {
  jobId: string;
  stage: DirectorStage;
  quality_score: number;
  source_image_url: string;
  is_remastered: boolean;
  selected_style_id: string | null;
  invariant_visual_summary: string;
  scenes: VideoScene[];
  cost_estimate: number; // in credits
  error_message: string | null;
  started_at: Date;
  completed_at: Date | null;
}

// =============================================================================
// REFINE ACTION
// =============================================================================

export interface RefineAction {
  sceneId: string;
  status: 'YELLOW' | 'RED';
  feedback?: string;
}

// =============================================================================
// VISION JOB
// =============================================================================

export interface VisionJob {
  id: number;
  user_id: string;
  image_url: string;
  status: VisionJobStatus;
  gemini_output?: GeminiAnalysisOutput;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// VIDEO PROMPT
// =============================================================================

export interface VideoPrompt {
  id: number;
  job_id: number;
  director_output: DirectorState;
  status: VideoPromptStatus;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// USER
// =============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  plan: UserPlan;
  credits_remaining: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// =============================================================================
// STYLE PRESET
// =============================================================================

export type StyleCategory = 'luxury' | 'tech' | 'nature' | 'dramatic' | 'minimal';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: StyleCategory;
  prompt_template: string;
  negative_prompt?: string;
  is_premium: boolean;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create an initial DirectorState with default values
 */
export function createDirectorState(jobId: string, source_image_url: string): DirectorState {
  return {
    jobId,
    stage: 'IDLE',
    quality_score: 0,
    source_image_url,
    is_remastered: false,
    selected_style_id: null,
    invariant_visual_summary: '',
    scenes: [],
    cost_estimate: 0,
    error_message: null,
    started_at: new Date(),
    completed_at: null,
  };
}

// =============================================================================
// CULTURAL DNA EXPORTS (Phase 3A-B)
// =============================================================================

// Re-export all cultural types and schemas
export * from './cultural';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Re-export validation schemas as types
export type { z } from 'zod';
