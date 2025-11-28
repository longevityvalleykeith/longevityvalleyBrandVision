/**
 * Vision Job Queue Worker
 * Polls database for pending jobs and processes them through Gemini + DeepSeek pipeline
 * Supports up to 3 concurrent jobs using in-memory semaphore
 */

import {
  getNextPendingVisionJob,
  getFailedJobsForRetry,
  updateVisionJobStatus,
  completeVisionJob,
  getVisionJobById,
} from "./db";
import { analyzeImageWithGemini } from "./geminiVision";
import { generateMandarinContent } from "./aiContentGenerator";

/**
 * Job Worker Configuration
 */
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_RETRIES = 3;
const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_JOBS = 3; // Process up to 3 jobs in parallel

let isWorkerRunning = false;
let pollIntervalId: NodeJS.Timeout | null = null;
let jobsProcessedToday = 0;
let lastPollTime: Date | null = null;
let activeJobs = 0; // In-memory semaphore for concurrent job tracking

/**
 * Start the job queue worker
 * This runs continuously in the background
 */
export function startJobQueueWorker() {
  if (isWorkerRunning) {
    console.log("[JobWorker] Already running");
    return;
  }

  isWorkerRunning = true;
  console.log("[JobWorker] Started - polling every", POLL_INTERVAL_MS, "ms");
  console.log("[JobWorker] Max concurrent jobs:", MAX_CONCURRENT_JOBS);

  // Initial poll
  pollAndProcessJobs();

  // Continuous polling
  pollIntervalId = setInterval(pollAndProcessJobs, POLL_INTERVAL_MS);
}

/**
 * Stop the job queue worker
 */
export function stopJobQueueWorker() {
  isWorkerRunning = false;
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  console.log("[JobWorker] Stopped");
}

/**
 * Main polling loop - handles up to 3 concurrent jobs
 */
async function pollAndProcessJobs() {
  if (!isWorkerRunning) return;

  lastPollTime = new Date();

  try {
    // Calculate how many new jobs we can start
    const slotsAvailable = MAX_CONCURRENT_JOBS - activeJobs;

    if (slotsAvailable > 0) {
      // Fetch up to `slotsAvailable` pending jobs
      const jobsToProcess: any[] = [];
      for (let i = 0; i < slotsAvailable; i++) {
        const job = await getNextPendingVisionJob();
        if (job) {
          jobsToProcess.push(job);
        } else {
          break; // No more pending jobs
        }
      }

      // Process all fetched jobs in parallel
      if (jobsToProcess.length > 0) {
        console.log(
          `[JobWorker] Starting ${jobsToProcess.length} jobs (${activeJobs} already active)`
        );
        const promises = jobsToProcess.map((job) => processVisionJob(job));
        await Promise.all(promises);
      }
    }

    // Check for failed jobs that need retry
    const failedJobs = await getFailedJobsForRetry();
    if (failedJobs.length > 0 && activeJobs < MAX_CONCURRENT_JOBS) {
      const retrySlots = Math.min(
        failedJobs.length,
        MAX_CONCURRENT_JOBS - activeJobs
      );
      console.log(`[JobWorker] Retrying ${retrySlots} failed jobs`);
      const retryPromises = failedJobs
        .slice(0, retrySlots)
        .map((job) => processVisionJob(job, true));
      await Promise.all(retryPromises);
    }
  } catch (error) {
    console.error("[JobWorker] Polling error:", error);
  }
}

/**
 * Process a single vision job through the pipeline
 */
async function processVisionJob(job: any, isRetry: boolean = false) {
  // Increment active job counter
  activeJobs++;
  console.log(
    `[Job ${job.id}] Starting (active jobs: ${activeJobs}/${MAX_CONCURRENT_JOBS})`
  );

  try {
    // Check timeout
    const elapsedTime = Date.now() - job.createdAt.getTime();
    if (elapsedTime > JOB_TIMEOUT_MS) {
      console.log(
        `[Job ${job.id}] Timeout: ${elapsedTime}ms > ${JOB_TIMEOUT_MS}ms`
      );
      await handleJobError(
        job,
        "timeout",
        new Error("Job exceeded 5-minute timeout")
      );
      return;
    }

    // Step 1: Gemini Vision Analysis
    console.log(`[Job ${job.id}] Step 1: Gemini Vision Analysis`);
    await updateVisionJobStatus(job.id, "gemini_analyzing", 25);

    let geminOutput: string;
    try {
      geminOutput = await analyzeImageWithGemini(
        job.imageUrl,
        job.imageContext || "",
        job.analysisPurpose,
        Number(job.creativityLevel) || 1.0
      );

      // Strip markdown formatting if present
      geminOutput = geminOutput.replace(/```json\n?|\n?```/g, "").trim();

      console.log(
        `[Job ${job.id}] Gemini response: ${geminOutput.substring(0, 100)}...`
      );
    } catch (error) {
      console.error(`[Job ${job.id}] Gemini analysis failed:`, error);
      await handleJobError(job, "gemini", error);
      return;
    }

    // Step 2: DeepSeek Content Generation
    console.log(`[Job ${job.id}] Step 2: DeepSeek Content Generation`);
    await updateVisionJobStatus(job.id, "deepseek_generating", 60);

    let deepseekOutput: string;
    try {
      // Create input object for DeepSeek content generation
      const deepseekInput = {
        productInfo: `Brand Visual Analysis from Gemini:\n${geminOutput}`,
        sellingPoints: job.analysisPurpose,
        targetAudience: job.imageContext || "",
        ctaOffer: job.additionalInstructions,
      };

      const contentPieces = await generateMandarinContent(deepseekInput);
      deepseekOutput = JSON.stringify(contentPieces);

      // Strip markdown formatting if present
      deepseekOutput = deepseekOutput.replace(/```json\n?|\n?```/g, "").trim();

      console.log(
        `[Job ${job.id}] DeepSeek response: ${deepseekOutput.substring(0, 150)}...`
      );
    } catch (error) {
      console.error(`[Job ${job.id}] DeepSeek generation failed:`, error);
      await handleJobError(job, "deepseek", error);
      return;
    }

    // Step 3: Complete the job
    console.log(`[Job ${job.id}] Step 3: Storing outputs`);
    try {
      await completeVisionJob(job.id, geminOutput, deepseekOutput);
      jobsProcessedToday++;
      console.log(`[Job ${job.id}] ✅ COMPLETE`);
    } catch (error) {
      console.error(`[Job ${job.id}] Storage failed:`, error);
      await handleJobError(job, "storage", error);
      return;
    }
  } catch (error) {
    console.error(`[Job ${job.id}] Unexpected error:`, error);
    await handleJobError(job, "unknown", error);
  } finally {
    // Decrement active job counter
    activeJobs--;
    console.log(
      `[Job ${job.id}] Finished (active jobs: ${activeJobs}/${MAX_CONCURRENT_JOBS})`
    );
  }
}

/**
 * Handle job errors with retry logic
 */
async function handleJobError(job: any, stage: string, error: any) {
  const newRetryCount = (job.retryCount || 0) + 1;
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (newRetryCount < MAX_RETRIES) {
    console.log(
      `[Job ${job.id}] Error in ${stage}, retry ${newRetryCount}/${MAX_RETRIES}`
    );
    await updateVisionJobStatus(job.id, "error", 0, {
      errorMessage: `${stage}: ${errorMessage}. Retry ${newRetryCount}/${MAX_RETRIES}`,
      errorStage: stage,
      retryCount: newRetryCount,
    });
  } else {
    console.error(`[Job ${job.id}] Max retries exceeded`);
    await updateVisionJobStatus(job.id, "error", 0, {
      errorMessage: `Failed after ${MAX_RETRIES} retries in ${stage}: ${errorMessage}`,
      errorStage: stage,
      retryCount: newRetryCount,
    });
  }
}

/**
 * Get worker status (for monitoring)
 */
export function getWorkerStatus() {
  return {
    isRunning: isWorkerRunning,
    pollIntervalMs: POLL_INTERVAL_MS,
    maxRetries: MAX_RETRIES,
    jobTimeoutMs: JOB_TIMEOUT_MS,
    maxConcurrentJobs: MAX_CONCURRENT_JOBS,
    activeJobs,
    jobsProcessedToday,
    lastPollTime,
  };
}
