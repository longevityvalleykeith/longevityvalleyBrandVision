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
  publicProcedure,
  handleServiceError,
} from '../trpc';
import { PaginationSchema, uuid } from '../types/validation';
import { processUploadedFile, scanForMalware } from './fileValidation';
import type { PaginatedResponse } from '../types';
import { transformVisionJobToAnalysisData, type BrandAnalysisData } from './utils/visionAdapter';
import { uploadToSupabaseStorage } from './utils/supabaseStorage';
import { analyzeBrandImage } from './services/vision';

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
  jobId: uuid,
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
   * Uses system user for demo mode (no auth required)
   */
  uploadImage: publicProcedure
    .input(UploadImageSchema)
    .mutation(async ({ input }) => {
      try {
        // Ensure System User exists for demo mode
        const { users } = await import('../types/schema');

        let systemUser = await db.query.users.findFirst({
          where: eq(users.email, 'admin@longevity.valley'),
        });

        if (!systemUser) {
          const [newUser] = await db.insert(users).values({
            email: 'admin@longevity.valley',
            name: 'System Admin',
            plan: 'enterprise',
            creditsRemaining: 999999,
          }).returning();
          systemUser = newUser!;
        }

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

        // Upload to Supabase Storage
        const imageUrl = await uploadToSupabaseStorage(
          validatedFile.buffer,
          validatedFile.sanitizedFilename,
          validatedFile.mimeType,
          systemUser.id
        );

        // Insert Vision Job
        const [result] = await db.insert(visionJobs).values({
          userId: systemUser.id,
          imageUrl,
          originalFilename: validatedFile.originalFilename,
          mimeType: validatedFile.mimeType,
          fileSize: validatedFile.size,
          status: 'pending',
        }).returning();

        if (!result) {
          throw new Error('DB insert returned no result');
        }

        // Audit log (non-blocking)
        db.insert(auditLogs).values({
          userId: systemUser.id,
          action: 'vision_job_created',
          entityType: 'vision_job',
          entityId: result.id,
          details: {
            filename: validatedFile.sanitizedFilename,
            fileSize: validatedFile.size,
            mimeType: validatedFile.mimeType,
          },
          ipAddress: 'system',
        }).catch(() => { /* Audit log is non-critical */ });

        // Queue for processing (non-blocking)
        queueVisionAnalysis(result.id).catch((err) => {
          console.error('[VisionRouter] Failed to queue analysis:', err.message);
        });

        return {
          success: true,
          jobId: result.id,
          imageUrl: result.imageUrl,
          status: 'pending' as const,
          quality: { score: 0, integrity: 0 },
          brandIdentity: { colors: [], mood: '', typography: '', industry: '' },
          composition: { layout: '', focalPoints: [], styleKeywords: [] },
          createdAt: result.createdAt,
        };

      } catch (error) {
        console.error('[VisionRouter] Upload failed:', error instanceof Error ? error.message : 'Unknown error');

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }),

  /**
   * Get system user ID for demo mode
   * Returns the admin user ID for unauthenticated sessions
   */
  getSystemUser: publicProcedure
    .query(async () => {
      const { users } = await import('../types/schema');

      let systemUser = await db.query.users.findFirst({
        where: eq(users.email, 'admin@longevity.valley'),
      });

      if (!systemUser) {
        // Create system user if it doesn't exist
        const [newUser] = await db.insert(users).values({
          email: 'admin@longevity.valley',
          name: 'System Admin',
          plan: 'premium',
          creditsRemaining: 9999,
        }).returning();
        systemUser = newUser!;
      }

      return {
        userId: systemUser.id,
        email: systemUser.email,
      };
    }),

  /**
   * Get a specific vision job
   * PUBLIC: Job ID (UUID) serves as implicit authorization
   * Full auth integration requires NEXT_PUBLIC_SUPABASE_* env vars
   */
  getJob: publicProcedure
    .input(GetJobSchema)
    .query(async ({ input }) => {
      return handleServiceError(async () => {
        const job = await db.query.visionJobs.findFirst({
          where: and(
            eq(visionJobs.id, input.jobId),
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
          ipAddress: 'unknown',
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
          ipAddress: 'unknown',
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
 * Processes brand image analysis using Gemini Vision API and updates the database.
 *
 * @param jobId - Vision job UUID
 */
async function queueVisionAnalysis(jobId: string): Promise<void> {
  console.log(`[Vision Service] Starting analysis for job: ${jobId}`);

  // Run analysis asynchronously (non-blocking)
  processVisionAnalysis(jobId).catch((error) => {
    console.error(`[Vision Service] Analysis failed for job ${jobId}:`, error);
  });
}

/**
 * Process vision analysis asynchronously
 *
 * @param jobId - Vision job UUID
 */
async function processVisionAnalysis(jobId: string): Promise<void> {
  try {
    // Fetch job from database
    const job = await db.query.visionJobs.findFirst({
      where: eq(visionJobs.id, jobId),
    });

    if (!job) {
      console.error(`[Vision Service] Job not found: ${jobId}`);
      return;
    }

    // Update status to processing
    await db
      .update(visionJobs)
      .set({ status: 'processing' })
      .where(eq(visionJobs.id, jobId));

    // Perform AI analysis with Proprietary Scoring Matrix
    const analysis = await analyzeBrandImage(job.imageUrl);

    // Update job with analysis results including proprietary scores
    // NOTE: Gemini returns scores 0-10, but DB constraint expects 0-1 (normalized)
    const normalizeScore = (score: number) => String((score / 10).toFixed(2));

    await db
      .update(visionJobs)
      .set({
        status: 'completed',
        geminiOutput: analysis,
        // Denormalized proprietary scores for efficient routing queries (normalized to 0-1)
        physicsScore: normalizeScore(analysis.physics_score),
        vibeScore: normalizeScore(analysis.vibe_score),
        logicScore: normalizeScore(analysis.logic_score),
        integrityScore: normalizeScore(analysis.integrity_score),
        processedAt: new Date(),
      })
      .where(eq(visionJobs.id, jobId));

    console.log(`[Vision Service] Analysis completed for job: ${jobId}`);
    console.log(`[Vision Service] Proprietary Scores - Physics: ${analysis.physics_score}, Vibe: ${analysis.vibe_score}, Logic: ${analysis.logic_score}`);
    console.log(`[Vision Service] Recommended Engine: ${analysis.recommended_engine}`);
  } catch (error) {
    console.error(`[Vision Service] Analysis error for job ${jobId}:`, error);

    // Update job with error
    await db
      .update(visionJobs)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Analysis failed',
      })
      .where(eq(visionJobs.id, jobId));
  }
}

export type VisionRouter = typeof visionRouter;
