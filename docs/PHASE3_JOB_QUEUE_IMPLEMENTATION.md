# Phase 3: Job Queue Implementation with Drizzle Polling

## Overview

This phase implements a **database-backed job queue** using Drizzle ORM with a polling mechanism. The architecture is:

1. **Frontend** submits an image upload → creates a `visionJob` record with status `pending`
2. **Backend worker** polls the database every 2 seconds for `pending` jobs
3. **Worker processes** the job through Gemini → DeepSeek pipeline
4. **Database updates** job status and outputs as pipeline progresses
5. **Frontend SSE listener** polls the database for status updates (Phase 4)

---

## Step-by-Step Implementation

### Step 1: Add Schema to Drizzle

**File**: `drizzle/schema.ts`

Add the three new tables (from BRAND_VISION_SCHEMA.md) to the existing schema.

```bash
# After editing schema.ts, run:
pnpm db:push
```

**Verify**: Check that `visionJobs`, `visionJobSessions`, and `visionJobOutputs` tables exist in your database.

---

### Step 2: Create Database Helper Functions

**File**: `server/db.ts`

Add these helper functions to query and update vision jobs:

```typescript
import { eq, and, lt, isNull } from "drizzle-orm";
import {
  visionJobs,
  visionJobSessions,
  visionJobOutputs,
  type VisionJob,
  type InsertVisionJob,
} from "../drizzle/schema";

/**
 * Create a new vision job
 */
export async function createVisionJob(
  userId: number,
  imageUrl: string,
  imageContext: string,
  analysisPurpose: string,
  outputFormat: string,
  creativityLevel: number,
  additionalInstructions?: string
): Promise<VisionJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(visionJobs).values({
    userId,
    imageUrl,
    imageContext,
    analysisPurpose,
    outputFormat,
    creativityLevel,
    additionalInstructions,
    status: "pending",
    progress: 0,
  });

  // Get the inserted job
  const jobId = result.insertId;
  const jobs = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.id, jobId));

  if (!jobs[0]) throw new Error("Failed to create vision job");
  return jobs[0];
}

/**
 * Get the next pending job for processing
 * FIFO order: oldest pending job first
 */
export async function getNextPendingVisionJob(): Promise<VisionJob | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.status, "pending"))
    .orderBy(visionJobs.createdAt)
    .limit(1);

  return result[0] || null;
}

/**
 * Update vision job status and progress
 */
export async function updateVisionJobStatus(
  jobId: number,
  status: VisionJob["status"],
  progress: number,
  updates?: {
    geminOutput?: string;
    deepseekOutput?: string;
    errorMessage?: string;
    errorStage?: string;
    retryCount?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
    progress,
    updatedAt: new Date(),
  };

  if (updates?.geminOutput) {
    updateData.geminOutput = updates.geminOutput;
    updateData.geminAnalyzedAt = new Date();
  }

  if (updates?.deepseekOutput) {
    updateData.deepseekOutput = updates.deepseekOutput;
    updateData.deepseekGeneratedAt = new Date();
  }

  if (updates?.errorMessage) {
    updateData.errorMessage = updates.errorMessage;
  }

  if (updates?.errorStage) {
    updateData.errorStage = updates.errorStage;
  }

  if (updates?.retryCount !== undefined) {
    updateData.retryCount = updates.retryCount;
  }

  if (status === "complete") {
    updateData.completedAt = new Date();
  }

  await db.update(visionJobs).set(updateData).where(eq(visionJobs.id, jobId));
}

/**
 * Get vision job by ID
 */
export async function getVisionJobById(jobId: number): Promise<VisionJob | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.id, jobId));

  return result[0] || null;
}

/**
 * Get all jobs for a user (for history/dashboard)
 */
export async function getUserVisionJobs(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<VisionJob[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.userId, userId))
    .orderBy(visionJobs.createdAt)
    .limit(limit)
    .offset(offset);
}

/**
 * Get failed jobs that need retry
 * Returns jobs with status='error' and retryCount < maxRetries
 */
export async function getFailedJobsForRetry(): Promise<VisionJob[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(visionJobs)
    .where(
      and(
        eq(visionJobs.status, "error"),
        lt(visionJobs.retryCount, visionJobs.maxRetries)
      )
    )
    .orderBy(visionJobs.updatedAt)
    .limit(5); // Process max 5 retries per cycle
}

/**
 * Mark job as complete and store outputs
 */
export async function completeVisionJob(
  jobId: number,
  geminOutput: string,
  deepseekOutput: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update job status
  await updateVisionJobStatus(jobId, "complete", 100, {
    geminOutput,
    deepseekOutput,
  });

  // Get job details for output storage
  const job = await getVisionJobById(jobId);
  if (!job) throw new Error("Job not found");

  // Parse outputs for structured storage
  let geminData: any = {};
  let deepseekData: any = [];

  try {
    const geminParsed = JSON.parse(geminOutput);
    geminData = {
      colors_primary: geminParsed.colors?.primary,
      colors_secondary: geminParsed.colors?.secondary,
      colors_description: geminParsed.colors?.description,
      mood: geminParsed.mood_and_tone?.mood,
      tone: geminParsed.mood_and_tone?.tone,
      composition_layout: geminParsed.composition?.layout,
      brand_personality: geminParsed.brand_insights?.brand_personality,
      perceived_industry: geminParsed.brand_insights?.perceived_industry,
      target_audience: geminParsed.brand_insights?.target_audience,
    };

    deepseekData = JSON.parse(deepseekOutput);
  } catch (e) {
    console.error("Failed to parse AI outputs:", e);
  }

  // Store structured outputs for dataset training
  await db.insert(visionJobOutputs).values({
    jobId,
    userId: job.userId,
    colors_primary: geminData.colors_primary,
    colors_secondary: geminData.colors_secondary,
    colors_description: geminData.colors_description,
    mood: geminData.mood,
    tone: geminData.tone,
    composition_layout: geminData.composition_layout,
    brand_personality: geminData.brand_personality,
    perceived_industry: geminData.perceived_industry,
    target_audience: geminData.target_audience,
    content_pieces: deepseekData,
    isTrainingData: true, // Mark all outputs as training data
  });
}
```

---

### Step 3: Create the Job Queue Worker

**File**: `server/visionJobWorker.ts`

This is the **core polling mechanism** that runs continuously:

```typescript
import { getNextPendingVisionJob, updateVisionJobStatus, getFailedJobsForRetry, completeVisionJob } from "./db";
import { analyzeImageWithGemini } from "./geminiVision";
import { generateContentWithDeepSeek } from "./aiContentGenerator";

/**
 * Job Worker Configuration
 */
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // Wait 5 seconds before retry

let isWorkerRunning = false;

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

  // Initial poll
  pollAndProcessJobs();

  // Continuous polling
  setInterval(pollAndProcessJobs, POLL_INTERVAL_MS);
}

/**
 * Stop the job queue worker
 */
export function stopJobQueueWorker() {
  isWorkerRunning = false;
  console.log("[JobWorker] Stopped");
}

/**
 * Main polling loop
 */
async function pollAndProcessJobs() {
  try {
    // Check for pending jobs
    const pendingJob = await getNextPendingVisionJob();

    if (pendingJob) {
      console.log(`[JobWorker] Processing job ${pendingJob.id}`);
      await processVisionJob(pendingJob);
    }

    // Check for failed jobs that need retry
    const failedJobs = await getFailedJobsForRetry();
    for (const job of failedJobs) {
      console.log(`[JobWorker] Retrying failed job ${job.id}`);
      await processVisionJob(job, true);
    }
  } catch (error) {
    console.error("[JobWorker] Polling error:", error);
  }
}

/**
 * Process a single vision job through the pipeline
 */
async function processVisionJob(job: any, isRetry: boolean = false) {
  try {
    // Step 1: Gemini Vision Analysis
    console.log(`[Job ${job.id}] Step 1: Gemini Vision Analysis`);
    await updateVisionJobStatus(job.id, "gemini_analyzing", 25);

    let geminOutput: string;
    try {
      geminOutput = await analyzeImageWithGemini(
        job.imageUrl,
        job.imageContext,
        job.analysisPurpose,
        job.creativityLevel
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
      deepseekOutput = await generateContentWithDeepSeek(
        geminOutput,
        job.imageContext,
        job.analysisPurpose,
        job.outputFormat,
        job.creativityLevel,
        job.additionalInstructions
      );
    } catch (error) {
      console.error(`[Job ${job.id}] DeepSeek generation failed:`, error);
      await handleJobError(job, "deepseek", error);
      return;
    }

    // Step 3: Complete the job
    console.log(`[Job ${job.id}] Step 3: Storing outputs`);
    await completeVisionJob(job.id, geminOutput, deepseekOutput);

    console.log(`[Job ${job.id}] ✅ COMPLETE`);
  } catch (error) {
    console.error(`[Job ${job.id}] Unexpected error:`, error);
    await handleJobError(job, "storage", error);
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
  };
}
```

---

### Step 4: Integrate Worker into Server Startup

**File**: `server/_core/index.ts`

Add the worker startup in your Express server initialization:

```typescript
import { startJobQueueWorker } from "../visionJobWorker";

// In your server startup function (after Express app is created):

// Start the background job queue worker
startJobQueueWorker();

console.log("[Server] Vision Job Queue Worker started");
```

---

### Step 5: Create tRPC Procedures for Job Management

**File**: `server/routers.ts`

Add these procedures to allow frontend to create jobs and query status:

```typescript
import { z } from "zod";
import {
  createVisionJob,
  getVisionJobById,
  getUserVisionJobs,
} from "./db";

export const appRouter = router({
  // ... existing routers ...

  visionPipeline: router({
    /**
     * Create a new vision job
     * Frontend calls this after uploading an image
     */
    createJob: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
          imageContext: z.string().optional(),
          analysisPurpose: z.string(),
          outputFormat: z.enum([
            "bullet_points",
            "detailed_analysis",
            "social_media_post",
          ]),
          creativityLevel: z.number().min(0).max(2).default(1),
          additionalInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const job = await createVisionJob(
          ctx.user.id,
          input.imageUrl,
          input.imageContext || "",
          input.analysisPurpose,
          input.outputFormat,
          input.creativityLevel,
          input.additionalInstructions
        );

        return {
          jobId: job.id,
          status: job.status,
          message: "Job created and queued for processing",
        };
      }),

    /**
     * Get job status and progress
     * Frontend polls this via SSE (Phase 4)
     */
    getJobStatus: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await getVisionJobById(input.jobId);

        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Verify user owns this job
        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this job",
          });
        }

        return {
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          geminOutput: job.geminOutput ? JSON.parse(job.geminOutput) : null,
          deepseekOutput: job.deepseekOutput
            ? JSON.parse(job.deepseekOutput)
            : null,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        };
      }),

    /**
     * Get user's job history
     */
    getJobHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const jobs = await getUserVisionJobs(
          ctx.user.id,
          input.limit,
          input.offset
        );

        return jobs.map((job) => ({
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          imageUrl: job.imageUrl,
          analysisPurpose: job.analysisPurpose,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        }));
      }),
  }),
});
```

---

## Drizzle Polling Mechanism - Deep Dive

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ Every 2 seconds:                                            │
│                                                              │
│ 1. SELECT * FROM visionJobs WHERE status='pending'          │
│    ORDER BY createdAt LIMIT 1                               │
│                                                              │
│ 2. If job found:                                            │
│    - UPDATE status='gemini_analyzing', progress=25          │
│    - Call Gemini API                                        │
│    - UPDATE status='deepseek_generating', progress=60       │
│    - Call DeepSeek API                                      │
│    - UPDATE status='complete', progress=100                 │
│                                                              │
│ 3. If job failed:                                           │
│    - UPDATE status='error', retryCount++                    │
│    - If retryCount < maxRetries: mark for retry             │
│                                                              │
│ 4. SELECT * FROM visionJobs WHERE status='error'            │
│    AND retryCount < maxRetries LIMIT 5                      │
│    - Retry failed jobs                                      │
│                                                              │
│ 5. Sleep 2 seconds, repeat                                  │
└─────────────────────────────────────────────────────────────┘
```

### Why Drizzle Polling is Ideal for MVP

| Aspect | Benefit |
|--------|---------|
| **No External Dependencies** | No Redis, RabbitMQ, or message broker needed |
| **Simple** | Just SQL queries on a table you already have |
| **Reliable** | Database is your source of truth |
| **Observable** | Can query job status directly from DB |
| **Scalable for MVP** | Handles 100+ jobs/day easily |
| **Cost Effective** | No additional infrastructure |

### Performance Considerations

**Database Queries per Minute:**
- 30 polls/min × 2 queries = 60 queries/min
- Each query: ~1ms (indexed on status)
- Total: ~60ms/min overhead

**Index Strategy:**
```sql
CREATE INDEX idx_status ON visionJobs(status);
CREATE INDEX idx_userId_status ON visionJobs(userId, status);
CREATE INDEX idx_createdAt ON visionJobs(createdAt);
```

These indexes ensure:
- `SELECT WHERE status='pending'` → O(1) lookup
- `SELECT WHERE userId=X AND status=Y` → Fast user-specific queries
- `ORDER BY createdAt` → Efficient sorting

---

## Testing the Job Queue

### Test 1: Create a Job

```bash
curl -X POST http://localhost:3000/api/trpc/visionPipeline.createJob \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://www.longevityvalley.ai/test-image.jpg",
    "analysisPurpose": "Brand analysis for wellness product",
    "outputFormat": "detailed_analysis",
    "creativityLevel": 1.0
  }'
```

**Expected Response:**
```json
{
  "jobId": 1,
  "status": "pending",
  "message": "Job created and queued for processing"
}
```

### Test 2: Monitor Job Progress

```bash
# Poll every 2 seconds
for i in {1..30}; do
  curl http://localhost:3000/api/trpc/visionPipeline.getJobStatus?jobId=1
  sleep 2
done
```

**Expected Progression:**
```
pending (0%) → gemini_analyzing (25%) → deepseek_generating (60%) → complete (100%)
```

---

## Summary

**Phase 3 Deliverables:**
- ✅ Database schema with `visionJobs` table
- ✅ Helper functions for job CRUD operations
- ✅ Background worker with polling mechanism
- ✅ tRPC procedures for job creation and status queries
- ✅ Error handling and retry logic

**Next Phase**: Phase 4 will implement SSE for real-time progress streaming to the frontend.

---

## Estimated Credits: 300-400
- Database schema and migrations: 50 credits
- Helper functions: 100 credits
- Worker implementation: 150 credits
- tRPC procedures: 100 credits

**Total Phase 3: 300-400 credits**
