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
   * OPERATION BUNKER BUSTER: Simplified DB write with guaranteed system user
   */
  uploadImage: publicProcedure
    .input(UploadImageSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('⚡️ OPERATION BUNKER BUSTER - uploadImage received');
        console.log('🔍 Context check:', {
          hasDb: !!ctx.db,
          hasUserId: !!ctx.userId,
          contextKeys: Object.keys(ctx),
        });
        console.log('📥 Input:', {
          filename: input.filename,
          mimeType: input.mimeType,
          dataLength: input.data.length,
        });

        // STEP A: Ensure System User exists
        console.log('👤 STEP A: Verifying System User...');
        const { users } = await import('../types/schema');

        let systemUser = await db.query.users.findFirst({
          where: eq(users.email, 'admin@longevity.valley'),
        });

        if (!systemUser) {
          console.log('⚠️ System User not found. Creating...');
          const [newUser] = await db.insert(users).values({
            email: 'admin@longevity.valley',
            name: 'System Admin',
            plan: 'enterprise',
            creditsRemaining: 999999,
          }).returning();
          systemUser = newUser!;
          console.log('✅ System User Created:', systemUser.id);
        } else {
          console.log('✅ System User Found:', systemUser.id);
        }

        console.log('👤 System User Verified:', systemUser.id);

        // Validate and process file
        console.log('📝 Validating file...');
        const validatedFile = await processUploadedFile(
          input.data,
          input.mimeType,
          input.filename
        );
        console.log('✅ File validated');

        // Scan for malware
        console.log('🔍 Scanning for malware...');
        const scanResult = await scanForMalware(validatedFile.buffer);

        if (!scanResult.safe) {
          console.error('❌ Malware detected:', scanResult.threat);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `File rejected: ${scanResult.threat}`,
          });
        }
        console.log('✅ Malware scan passed');

        // Upload to Supabase Storage
        console.log('☁️ Uploading to Supabase Storage...');
        const imageUrl = await uploadToSupabaseStorage(
          validatedFile.buffer,
          validatedFile.sanitizedFilename,
          validatedFile.mimeType,
          systemUser.id
        );
        console.log('✅ File uploaded:', imageUrl);

        // STEP B: Insert Vision Job
        console.log('💾 STEP B: Attempting DB Insert...');
        console.log('📊 Insert values:', {
          userId: systemUser.id,
          imageUrl,
          originalFilename: validatedFile.originalFilename,
          mimeType: validatedFile.mimeType,
          fileSize: validatedFile.size,
          status: 'pending',
        });

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

        console.log('✅ DB Insert Complete. ID:', result.id);

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
        }).catch(err => console.error('Audit log failed:', err));

        // Queue for processing (non-blocking)
        queueVisionAnalysis(result.id).catch(err => console.error('Queue failed:', err));

        // STEP C: Simplified Return
        console.log('📤 Returning simplified response...');
        const response = {
          success: true,
          jobId: result.id,
          imageUrl: result.imageUrl,
          status: 'pending' as const,
          quality: { score: 0, integrity: 0 },
          brandIdentity: { colors: [], mood: '', typography: '', industry: '' },
          composition: { layout: '', focalPoints: [], styleKeywords: [] },
          createdAt: result.createdAt,
        };

        console.log('✅ Response:', response);
        console.log('🎉 OPERATION BUNKER BUSTER COMPLETE!');

        return response;

      } catch (error) {
        // STEP D: Error handling
        console.error('❌ DB WRITE FAILED:', error instanceof Error ? error.message : error);
        console.error('🔴 Full error:', error);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Database write failed',
        });
      }
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
    await db
      .update(visionJobs)
      .set({
        status: 'completed',
        geminiOutput: analysis,
        // Denormalized proprietary scores for efficient routing queries
        physicsScore: String(analysis.physics_score),
        vibeScore: String(analysis.vibe_score),
        logicScore: String(analysis.logic_score),
        integrityScore: String(analysis.integrity_score),
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
