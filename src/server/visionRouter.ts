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
import { db } from './db';
import { visionJobs, auditLogs, type VisionJob } from '../types/schema';
import {
  router,
  protectedProcedure,
  uploadProcedure,
  handleServiceError,
} from '../trpc';
import { PaginationSchema, safeId } from '../types/validation';
import { processUploadedFile, scanForMalware } from './utils/fileValidation';
import type { PaginatedResponse } from '../types';
import { transformVisionJobToAnalysisData, type BrandAnalysisData } from './utils/visionAdapter';
import { uploadToSupabaseStorage } from './utils/supabaseStorage';

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

        // Upload to Supabase Storage with user-specific path for RLS
        const imageUrl = await uploadToSupabaseStorage(
          validatedFile.buffer,
          validatedFile.sanitizedFilename,
          validatedFile.mimeType,
          ctx.userId!
        );

        // Create vision job record with UUID
        const [result] = await db.insert(visionJobs).values({
          userId: ctx.userId!,
          imageUrl,
          originalFilename: validatedFile.originalFilename,
          mimeType: validatedFile.mimeType,
          fileSize: validatedFile.size,
          status: 'pending',
        }).returning();

        if (!result) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create vision job',
          });
        }

        // Audit log
        await db.insert(auditLogs).values({
          userId: ctx.userId,
          action: 'vision_job_created',
          entityType: 'vision_job',
          entityId: result.id,
          details: {
            filename: validatedFile.sanitizedFilename,
            fileSize: validatedFile.size,
            mimeType: validatedFile.mimeType,
          },
          ipAddress: ctx.req?.socket?.remoteAddress,
        });

        // Queue for processing (integrate with your job queue)
        await queueVisionAnalysis(result.id);

        // Transform to frontend format
        const analysisData = transformVisionJobToAnalysisData(
          result.id,
          result.imageUrl,
          result.status as 'pending',
          null,
          null,
          result.createdAt
        );

        return analysisData;
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

        // Transform to frontend format
        const analysisData = transformVisionJobToAnalysisData(
          job.id,
          job.imageUrl,
          job.status as 'pending' | 'processing' | 'completed' | 'failed',
          job.geminiOutput as any,
          job.errorMessage,
          job.createdAt,
          job.processedAt
        );

        return analysisData;
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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Queue vision analysis job
 *
 * @param jobId - Vision job UUID
 */
async function queueVisionAnalysis(jobId: string): Promise<void> {
  // TODO: Integrate with job queue (BullMQ, SQS, Inngest, etc.)
  // For now, log the action
  console.log(`[Queue] Vision analysis job queued: ${jobId}`);

  // In production:
  // await jobQueue.add('vision-analysis', { jobId }, {
  //   attempts: 3,
  //   backoff: { type: 'exponential', delay: 5000 },
  // });
}

export type VisionRouter = typeof visionRouter;
