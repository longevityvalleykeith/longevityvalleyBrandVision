/**
 * Phase 3C - Kling Video Service
 *
 * Handles physics-heavy video generation using Kling AI.
 * Provides job queuing, status polling, and video retrieval.
 *
 * @module server/services/klingVideo
 * @version 3.0.0
 */

import type { VideoScene } from '../../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const KLING_API_KEY = process.env.KLING_API_KEY;
const KLING_API_URL = 'https://api.klingai.com/v1/videos/generation';
const KLING_STATUS_URL = 'https://api.klingai.com/v1/videos/';

// Video generation settings
const VIDEO_CONFIG = {
  duration: 5, // seconds per scene
  aspect_ratio: '16:9',
  mode: 'professional', // or 'standard' for faster generation
  cfg_scale: 0.5, // Kling-specific: lower = more creative
  seed: -1, // Random seed
};

// Polling configuration
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const MAX_POLL_ATTEMPTS = 180; // 15 minutes max (180 * 5s)
const GENERATION_TIMEOUT_MS = 900000; // 15 minutes

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type VideoJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VideoJob {
  jobId: string;
  sceneId: string;
  status: VideoJobStatus;
  progress: number; // 0-100
  videoUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface KlingVideoRequest {
  prompt: string;
  negative_prompt?: string;
  image_url?: string; // First frame reference
  duration?: number;
  aspect_ratio?: string;
  mode?: string;
  cfg_scale?: number;
  seed?: number;
}

export interface KlingVideoResponse {
  id: string;
  status: string;
  progress: number;
  video_url?: string;
  error?: string;
}

// =============================================================================
// IN-MEMORY JOB QUEUE
// =============================================================================
// TODO: Replace with Redis or database-backed queue in production

const jobQueue = new Map<string, VideoJob>();

/**
 * Get job from queue
 */
export function getJob(jobId: string): VideoJob | undefined {
  return jobQueue.get(jobId);
}

/**
 * Update job in queue
 */
function updateJob(jobId: string, updates: Partial<VideoJob>): void {
  const job = jobQueue.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}

// =============================================================================
// HEALTH CHECKS
// =============================================================================

/**
 * Check if Kling is configured with API key
 */
export function isKlingConfigured(): boolean {
  return Boolean(KLING_API_KEY);
}

/**
 * Check Kling API health
 */
export async function checkKlingHealth(): Promise<boolean> {
  if (!isKlingConfigured()) {
    return false;
  }

  try {
    // Try to hit the API with a simple request
    const response = await fetch(KLING_API_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${KLING_API_KEY}`,
      },
    });

    // Even a 404 means the API is reachable
    return response.status !== 500 && response.status !== 503;
  } catch {
    return false;
  }
}

// =============================================================================
// VIDEO GENERATION
// =============================================================================

/**
 * Queue a video generation job for a scene
 */
export async function queueVideoGeneration(
  scene: VideoScene,
  stylePromptLayer?: string
): Promise<VideoJob> {
  if (!isKlingConfigured()) {
    throw new Error('Kling API key not configured');
  }

  // Combine action token with style layer
  const fullPrompt = stylePromptLayer
    ? `${scene.action_token}, ${stylePromptLayer}`
    : scene.action_token;

  try {
    // Submit generation request to Kling
    const response = await fetch(KLING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KLING_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_url: scene.preview_url, // Use preview as first frame reference
        ...VIDEO_CONFIG,
      } as KlingVideoRequest),
    });

    if (!response.ok) {
      throw new Error(`Kling API error: ${response.statusText}`);
    }

    const data: KlingVideoResponse = await response.json();

    // Create job entry
    const job: VideoJob = {
      jobId: data.id,
      sceneId: scene.id,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
    };

    // Store in queue
    jobQueue.set(data.id, job);

    // Start polling in background
    pollVideoStatus(data.id).catch((error) => {
      console.error(`Error polling video status for job ${data.id}:`, error);
    });

    return job;
  } catch (error) {
    console.error('Error queuing video generation:', error);
    throw error;
  }
}

/**
 * Queue video generation for multiple scenes
 */
export async function queueBatchVideoGeneration(
  scenes: VideoScene[],
  stylePromptLayer?: string
): Promise<VideoJob[]> {
  const jobs: VideoJob[] = [];

  for (const scene of scenes) {
    try {
      const job = await queueVideoGeneration(scene, stylePromptLayer);
      jobs.push(job);

      // Rate limiting: Wait 2 seconds between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error queuing video for scene ${scene.id}:`, error);
      // Create failed job entry
      jobs.push({
        jobId: `failed-${scene.id}`,
        sceneId: scene.id,
        status: 'failed',
        progress: 0,
        error: String(error),
        createdAt: new Date(),
      });
    }
  }

  return jobs;
}

// =============================================================================
// STATUS POLLING
// =============================================================================

/**
 * Poll video generation status until completion or timeout
 */
async function pollVideoStatus(jobId: string): Promise<void> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    try {
      const status = await checkVideoStatus(jobId);

      // Update job in queue
      updateJob(jobId, {
        status: status.status as VideoJobStatus,
        progress: status.progress,
        videoUrl: status.video_url,
        error: status.error,
      });

      // Check if completed or failed
      if (status.status === 'completed') {
        updateJob(jobId, { completedAt: new Date() });
        console.log(`Video generation completed for job ${jobId}`);
        return;
      }

      if (status.status === 'failed') {
        updateJob(jobId, { completedAt: new Date() });
        console.error(`Video generation failed for job ${jobId}:`, status.error);
        return;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      attempts++;
    } catch (error) {
      console.error(`Error polling status for job ${jobId}:`, error);
      attempts++;

      // If we've exceeded max attempts, mark as failed
      if (attempts >= MAX_POLL_ATTEMPTS) {
        updateJob(jobId, {
          status: 'failed',
          error: 'Polling timeout exceeded',
          completedAt: new Date(),
        });
        return;
      }
    }
  }

  // Timeout reached
  updateJob(jobId, {
    status: 'failed',
    error: 'Generation timeout exceeded',
    completedAt: new Date(),
  });
}

/**
 * Check status of a specific video job
 */
export async function checkVideoStatus(jobId: string): Promise<KlingVideoResponse> {
  if (!isKlingConfigured()) {
    throw new Error('Kling API key not configured');
  }

  const response = await fetch(`${KLING_STATUS_URL}${jobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${KLING_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kling API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get status of multiple jobs
 */
export async function checkBatchStatus(jobIds: string[]): Promise<VideoJob[]> {
  return jobIds.map((jobId) => {
    const job = getJob(jobId);
    if (!job) {
      return {
        jobId,
        sceneId: 'unknown',
        status: 'failed',
        progress: 0,
        error: 'Job not found',
        createdAt: new Date(),
      };
    }
    return job;
  });
}

// =============================================================================
// VIDEO RETRIEVAL
// =============================================================================

/**
 * Get completed video URL for a job
 */
export function getVideoUrl(jobId: string): string | undefined {
  const job = getJob(jobId);
  return job?.status === 'completed' ? job.videoUrl : undefined;
}

/**
 * Wait for video generation to complete
 */
export async function waitForCompletion(
  jobId: string,
  timeoutMs: number = GENERATION_TIMEOUT_MS
): Promise<VideoJob> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const job = getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(`Video generation failed: ${job.error}`);
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Video generation timeout for job ${jobId}`);
}

// =============================================================================
// JOB MANAGEMENT
// =============================================================================

/**
 * Get all jobs for a specific scene
 */
export function getJobsForScene(sceneId: string): VideoJob[] {
  return Array.from(jobQueue.values()).filter((job) => job.sceneId === sceneId);
}

/**
 * Cancel a video generation job
 */
export async function cancelVideoJob(jobId: string): Promise<void> {
  const job = getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status === 'completed' || job.status === 'failed') {
    throw new Error(`Cannot cancel ${job.status} job`);
  }

  // TODO: Implement Kling API cancel endpoint when available
  // For now, just mark as failed
  updateJob(jobId, {
    status: 'failed',
    error: 'Cancelled by user',
    completedAt: new Date(),
  });
}

/**
 * Clean up old completed jobs from queue
 */
export function cleanupOldJobs(olderThanMs: number = 3600000): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobQueue.entries()) {
    if (job.completedAt) {
      const age = now - job.completedAt.getTime();
      if (age > olderThanMs) {
        jobQueue.delete(jobId);
        cleaned++;
      }
    }
  }

  return cleaned;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get overall progress for a batch of jobs
 */
export function getBatchProgress(jobIds: string[]): number {
  if (jobIds.length === 0) return 0;

  const totalProgress = jobIds.reduce((sum, jobId) => {
    const job = getJob(jobId);
    return sum + (job?.progress || 0);
  }, 0);

  return Math.round(totalProgress / jobIds.length);
}

/**
 * Check if all jobs in batch are complete
 */
export function isBatchComplete(jobIds: string[]): boolean {
  return jobIds.every((jobId) => {
    const job = getJob(jobId);
    return job?.status === 'completed' || job?.status === 'failed';
  });
}
