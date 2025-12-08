/**
 * Vision Data Adapter
 *
 * Transforms database 'geminiOutput' (JSONB) into frontend 'BrandAnalysisData' interface.
 * Provides a clean separation between database schema and frontend data structures.
 *
 * @module server/utils/visionAdapter
 * @version 3.0.0
 */

import type { GeminiAnalysisOutput } from '@/types';
import { getDirectorById } from '@/config/directors';

// =============================================================================
// FRONTEND TYPES
// =============================================================================

/**
 * Frontend-friendly brand analysis data structure
 */
export interface BrandAnalysisData {
  /** Unique job identifier */
  jobId: string;

  /** Original uploaded image URL */
  imageUrl: string;

  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** Brand visual identity */
  brandIdentity: {
    /** Primary brand colors (hex codes) */
    colors: string[];
    /** Typography style description */
    typography?: string;
    /** Overall mood/feeling */
    mood: string;
    /** Industry category */
    industry?: string;
  };

  /** Visual composition analysis */
  composition: {
    /** Composition description */
    layout: string;
    /** Key focal points */
    focalPoints: string[];
    /** Style keywords */
    styleKeywords: string[];
  };

  /** Quality metrics */
  quality: {
    /** Overall quality score (0-10) */
    score: number;
    /** Image integrity score (0-1) */
    integrity: number;
  };

  /** Proprietary Scoring Matrix (The Trinity) */
  proprietaryScores?: {
    /** Physics score (0-10): Motion complexity, realism */
    physics: number;
    /** Vibe score (0-10): Emotional resonance, aesthetic */
    vibe: number;
    /** Logic score (0-10): Narrative clarity, brand safety */
    logic: number;
    /** Scoring rationale explanations */
    rationale?: {
      physics: string;
      vibe: string;
      logic: string;
    };
  };

  /** Director Commentary - Film Director style explanation of routing decision */
  directorCommentary?: string;

  /** Recommended video production engine */
  recommendedEngine?: 'kling' | 'luma';

  /** Recommended style preset ID (if applicable) */
  recommendedStyleId?: string;

  /** Rashomon Effect - All 4 director pitches (Phase 4 enhancement) */
  allDirectorPitches?: Array<{
    directorId: string;
    directorName: string;
    avatar: string;
    threeBeatPulse: {
      vision: string;
      safety: string;
      magic: string;
    };
    commentary: string;
    sceneBoard: {
      start: { time: string; visual: string; camera: string };
      middle: { time: string; visual: string; camera: string };
      end: { time: string; visual: string; camera: string };
    };
    biasedScores: {
      physics: number;
      vibe: number;
      logic: number;
    };
    recommendedEngine: 'kling' | 'luma';
    recommendedStyleId: string;
    riskLevel: 'Safe' | 'Balanced' | 'Experimental';
  }>;

  /** Recommended director ID (based on raw scores) */
  recommendedDirectorId?: string;

  /** Error message (if status is 'failed') */
  errorMessage?: string;

  /** Timestamps */
  createdAt: Date;
  processedAt?: Date;
}

// =============================================================================
// ADAPTER FUNCTIONS
// =============================================================================

/**
 * Transform database geminiOutput to frontend BrandAnalysisData
 *
 * @param jobId - Vision job ID
 * @param imageUrl - Original image URL
 * @param status - Processing status
 * @param geminiOutput - Raw Gemini analysis output (JSONB from database)
 * @param errorMessage - Error message if failed
 * @param createdAt - Job creation timestamp
 * @param processedAt - Job completion timestamp
 * @returns Frontend-friendly BrandAnalysisData
 */
export function transformVisionJobToAnalysisData(
  jobId: string,
  imageUrl: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  geminiOutput: GeminiAnalysisOutput | null | undefined,
  errorMessage?: string | null,
  createdAt?: Date,
  processedAt?: Date | null
): BrandAnalysisData {
  // Default empty analysis for pending/processing states
  const defaultAnalysis: BrandAnalysisData = {
    jobId,
    imageUrl,
    status,
    brandIdentity: {
      colors: [],
      mood: 'Analyzing...',
    },
    composition: {
      layout: 'Analysis in progress...',
      focalPoints: [],
      styleKeywords: [],
    },
    quality: {
      score: 0,
      integrity: 0,
    },
    createdAt: createdAt || new Date(),
    processedAt: processedAt || undefined,
  };

  // If failed, include error message
  if (status === 'failed') {
    return {
      ...defaultAnalysis,
      errorMessage: errorMessage || 'Analysis failed',
    };
  }

  // If no gemini output yet, return default
  if (!geminiOutput) {
    return defaultAnalysis;
  }

  // Transform gemini output to frontend format
  const result: BrandAnalysisData = {
    jobId,
    imageUrl,
    status,
    brandIdentity: {
      colors: geminiOutput.brand_attributes?.primary_colors || [],
      typography: geminiOutput.brand_attributes?.typography_style,
      mood: geminiOutput.brand_attributes?.mood || 'Unknown',
      industry: geminiOutput.brand_attributes?.industry,
    },
    composition: {
      layout: geminiOutput.visual_elements?.composition || 'Not analyzed',
      focalPoints: geminiOutput.visual_elements?.focal_points || [],
      styleKeywords: geminiOutput.visual_elements?.style_keywords || [],
    },
    quality: {
      score: geminiOutput.quality_score || 0,
      integrity: geminiOutput.integrity_score || 0,
    },
    recommendedStyleId: geminiOutput.recommended_style_id,
    recommendedEngine: geminiOutput.recommended_engine,
    createdAt: createdAt || new Date(),
    processedAt: processedAt || undefined,
  };

  // Add proprietary scores if available
  if (geminiOutput.physics_score !== undefined) {
    result.proprietaryScores = {
      physics: geminiOutput.physics_score,
      vibe: geminiOutput.vibe_score,
      logic: geminiOutput.logic_score,
      rationale: geminiOutput.scoring_rationale,
    };
  }

  // Add director commentary if available
  if (geminiOutput.director_commentary) {
    result.directorCommentary = geminiOutput.director_commentary;
  }

  // Add Rashomon Effect data if available (all 4 director pitches)
  if (geminiOutput.all_director_pitches && Array.isArray(geminiOutput.all_director_pitches)) {
    result.allDirectorPitches = geminiOutput.all_director_pitches.map((pitch) => {
      const director = getDirectorById(pitch.director_id);
      return {
        directorId: pitch.director_id,
        directorName: director?.name || pitch.director_id,
        avatar: director?.avatar || '🎬',
        threeBeatPulse: pitch.three_beat_pulse,
        commentary: pitch.director_commentary,
        sceneBoard: pitch.scene_board,
        biasedScores: pitch.biased_scores,
        recommendedEngine: pitch.recommended_engine,
        recommendedStyleId: pitch.recommended_style_id,
        riskLevel: pitch.risk_level,
      };
    });
  }

  // Add recommended director ID
  if (geminiOutput.recommended_director_id) {
    result.recommendedDirectorId = geminiOutput.recommended_director_id;
  }

  return result;
}

/**
 * Transform array of vision jobs to array of BrandAnalysisData
 *
 * @param jobs - Array of vision job database records
 * @returns Array of frontend-friendly BrandAnalysisData
 */
export function transformVisionJobsToAnalysisDataArray(
  jobs: Array<{
    id: string;
    imageUrl: string;
    status: string;
    geminiOutput?: unknown;
    errorMessage?: string | null;
    createdAt: Date;
    processedAt?: Date | null;
  }>
): BrandAnalysisData[] {
  return jobs.map((job) =>
    transformVisionJobToAnalysisData(
      job.id,
      job.imageUrl,
      job.status as 'pending' | 'processing' | 'completed' | 'failed',
      job.geminiOutput as GeminiAnalysisOutput | null | undefined,
      job.errorMessage,
      job.createdAt,
      job.processedAt
    )
  );
}

/**
 * Extract primary brand color (most dominant)
 *
 * @param analysisData - Brand analysis data
 * @returns Primary color hex code or null
 */
export function getPrimaryBrandColor(analysisData: BrandAnalysisData): string | null {
  return analysisData.brandIdentity.colors[0] || null;
}

/**
 * Check if analysis is complete and high quality
 *
 * @param analysisData - Brand analysis data
 * @returns True if analysis is complete with quality score >= 7
 */
export function isHighQualityAnalysis(analysisData: BrandAnalysisData): boolean {
  return (
    analysisData.status === 'completed' &&
    analysisData.quality.score >= 7 &&
    analysisData.quality.integrity >= 0.8
  );
}

/**
 * Get user-friendly status message
 *
 * @param analysisData - Brand analysis data
 * @returns Human-readable status message
 */
export function getStatusMessage(analysisData: BrandAnalysisData): string {
  switch (analysisData.status) {
    case 'pending':
      return 'Waiting to process...';
    case 'processing':
      return 'Analyzing your brand...';
    case 'completed':
      return 'Analysis complete!';
    case 'failed':
      return analysisData.errorMessage || 'Analysis failed';
    default:
      return 'Unknown status';
  }
}
