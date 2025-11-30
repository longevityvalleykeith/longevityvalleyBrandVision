/**
 * Phase 3B - Vision Jobs Router
 * 
 * API endpoints for brand analysis (Gemini Vision).
 * This is the foundation that Phase 3C builds upon.
 * 
 * @module server/routers/visionRouter
 * @version 3.0.0
 */

import { TRPCError } from '@trpc/server';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../drizzle/db';
import { visionJobs, auditLogs } from '../../drizzle/schema';
import {
  router,
  protectedProcedure,
  uploadProcedure,
  handleServiceError,
} from '../trpc';
import { PaginationSchema, safeId } from '../../types/validation';
import { processUploadedFile, scanForMalware } from '../utils/fileValidation';
import type { VisionJob, PaginatedResponse } from '../../types';

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

const UploadImageSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  /** Base64 encoded file data */
  data: z.string(),
});

const GetJobSchema = z.object({
  jobId: safeId,
});

const ListJobsSchema = PaginationSchema.extend({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
});

// =============================================================================
// VISION ROUTER
// =============================================================================

export const visionRouter = router({
  /**
   * Upload image for brand analysis
   */
  uploadImage: uploadProcedure
    .input(UploadImageSchema)
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        // Validate and process file
        const validatedFile = await processUploadedFile(
          input.data,
          input.mimeType,
          input.filename
        );

        // Scan for malware
        const scanResult = await scanForMalware(validatedFile.buffer);
        if (!scanResult.safe) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `File rejected: ${scanResult.threat}`,
          });
        }

        // Upload to storage (placeholder - integrate with S3/R2/etc.)
        const imageUrl = await uploadToStorage(validatedFile);

        // Create vision job record
        const [result] = await db.insert(visionJobs).values({
          userId: ctx.userId!,
          imageUrl,
          originalFilename: validatedFile.originalFilename,
          mimeType: validatedFile.mimeType,
          fileSize: validatedFile.size,
          status: 'pending',
        });

        const jobId = result.insertId;

        // Audit log
        await db.insert(auditLogs).values({
          userId: ctx.userId,
          action: 'vision_job_created',
          entityType: 'vision_job',
          entityId: String(jobId),
          details: {
            filename: validatedFile.sanitizedFilename,
            fileSize: validatedFile.size,
            mimeType: validatedFile.mimeType,
          },
          ipAddress: ctx.ip,
        });

        // Queue for processing (integrate with your job queue)
        await queueVisionAnalysis(Number(jobId));

        return {
          jobId: Number(jobId),
          status: 'pending',
          imageUrl,
        };
      }, 'uploadImage');
    }),

  /**
   * Get a specific vision job
   */
  getJob: protectedProcedure
    .input(GetJobSchema)
    .query(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const job = await db.query.visionJobs.findFirst({
          where: and(
            eq(visionJobs.id, input.jobId),
            eq(visionJobs.userId, ctx.userId!),
            isNull(visionJobs.deletedAt)
          ),
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vision job not found',
          });
        }

        return job;
      }, 'getJob');
    }),

  /**
   * List user's vision jobs with pagination
   */
  listJobs: protectedProcedure
    .input(ListJobsSchema)
    .query(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const { page, limit, status } = input;
        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions = [
          eq(visionJobs.userId, ctx.userId!),
          isNull(visionJobs.deletedAt),
        ];

        if (status) {
          conditions.push(eq(visionJobs.status, status));
        }

        // Get total count
        const countResult = await db
          .select({ count: db.$count(visionJobs.id) })
          .from(visionJobs)
          .where(and(...conditions));

        const total = countResult[0]?.count || 0;

        // Get paginated results
        const jobs = await db.query.visionJobs.findMany({
          where: and(...conditions),
          orderBy: [desc(visionJobs.createdAt)],
          limit,
          offset,
        });

        const totalPages = Math.ceil(total / limit);

        const response: PaginatedResponse<VisionJob> = {
          data: jobs as VisionJob[],
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };

        return response;
      }, 'listJobs');
    }),

  /**
   * Cancel a pending job
   */
  cancelJob: protectedProcedure
    .input(GetJobSchema)
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const job = await db.query.visionJobs.findFirst({
          where: and(
            eq(visionJobs.id, input.jobId),
            eq(visionJobs.userId, ctx.userId!)
          ),
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vision job not found',
          });
        }

        if (job.status !== 'pending') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only pending jobs can be cancelled',
          });
        }

        await db
          .update(visionJobs)
          .set({ status: 'cancelled' })
          .where(eq(visionJobs.id, input.jobId));

        // Audit log
        await db.insert(auditLogs).values({
          userId: ctx.userId,
          action: 'vision_job_cancelled',
          entityType: 'vision_job',
          entityId: String(input.jobId),
          ipAddress: ctx.ip,
        });

        return { success: true };
      }, 'cancelJob');
    }),

  /**
   * Delete a job (soft delete)
   */
  deleteJob: protectedProcedure
    .input(GetJobSchema)
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const job = await db.query.visionJobs.findFirst({
          where: and(
            eq(visionJobs.id, input.jobId),
            eq(visionJobs.userId, ctx.userId!)
          ),
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vision job not found',
          });
        }

        // Soft delete
        await db
          .update(visionJobs)
          .set({ deletedAt: new Date() })
          .where(eq(visionJobs.id, input.jobId));

        // Audit log
        await db.insert(auditLogs).values({
          userId: ctx.userId,
          action: 'vision_job_deleted',
          entityType: 'vision_job',
          entityId: String(input.jobId),
          ipAddress: ctx.ip,
        });

        return { success: true };
      }, 'deleteJob');
    }),

  /**
   * Retry a failed job
   */
  retryJob: protectedProcedure
    .input(GetJobSchema)
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const job = await db.query.visionJobs.findFirst({
          where: and(
            eq(visionJobs.id, input.jobId),
            eq(visionJobs.userId, ctx.userId!)
          ),
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vision job not found',
          });
        }

        if (job.status !== 'failed') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only failed jobs can be retried',
          });
        }

        if (job.retryCount >= 3) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Maximum retry attempts reached',
          });
        }

        // Reset status and increment retry count
        await db
          .update(visionJobs)
          .set({
            status: 'pending',
            retryCount: job.retryCount + 1,
            errorMessage: null,
          })
          .where(eq(visionJobs.id, input.jobId));

        // Queue for processing
        await queueVisionAnalysis(input.jobId);

        return { success: true, retryCount: job.retryCount + 1 };
      }, 'retryJob');
    }),
});

// =============================================================================
// HELPER FUNCTIONS (Placeholders - integrate with your services)
// =============================================================================

/**
 * Upload file to storage (placeholder)
 */
async function uploadToStorage(file: {
  buffer: Buffer;
  sanitizedFilename: string;
  mimeType: string;
}): Promise<string> {
  // TODO: Integrate with S3, R2, or other storage
  // For now, return a placeholder URL
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.sanitizedFilename}`;
  
  // In production:
  // const { url } = await s3.upload({
  //   Bucket: process.env.S3_BUCKET,
  //   Key: `uploads/${filename}`,
  //   Body: file.buffer,
  //   ContentType: file.mimeType,
  // });
  
  return `https://storage.example.com/uploads/${filename}`;
}

/**
 * Queue vision analysis job (placeholder)
 */
async function queueVisionAnalysis(jobId: number): Promise<void> {
  // TODO: Integrate with your job queue (BullMQ, SQS, etc.)
  // For now, log the action
  console.log(`[Queue] Vision analysis job queued: ${jobId}`);
  
  // In production:
  // await jobQueue.add('vision-analysis', { jobId }, {
  //   attempts: 3,
  //   backoff: { type: 'exponential', delay: 5000 },
  // });
}

export type VisionRouter = typeof visionRouter;
