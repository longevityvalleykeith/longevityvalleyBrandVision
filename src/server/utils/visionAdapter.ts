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

  /** Recommended style preset ID (if applicable) */
  recommendedStyleId?: string;

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
  return {
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
    createdAt: createdAt || new Date(),
    processedAt: processedAt || undefined,
  };
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
