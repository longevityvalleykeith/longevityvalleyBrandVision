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
// GEMINI ANALYSIS OUTPUT
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
  quality_score: number; // 0-10
  integrity_score: number; // 0-1
  recommended_style_id?: string;
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
  user_feedback?: string;
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

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: 'luxury' | 'tech' | 'nature' | 'dramatic' | 'minimal';
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
// TYPE EXPORTS
// =============================================================================

// Re-export validation schemas as types
export type { z } from 'zod';
