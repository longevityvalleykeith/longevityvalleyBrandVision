/**
 * Phase 3C - Director Router
 *
 * API endpoints for Video Director Mode.
 * Handles storyboard initialization, refinement, and production approval.
 *
 * @module server/routers/directorRouter
 * @version 3.0.1 - Migrated to PostgreSQL
 */

import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { visionJobs, visionJobVideoPrompts } from '../types/schema';
import { 
  router, 
  protectedProcedure, 
  generateProcedure, 
  refineProcedure,
  handleServiceError,
  requireCredits,
} from '../trpc';
import {
  InitDirectorInputSchema,
  RefineStoryboardInputSchema,
  ApproveProductionInputSchema,
  GetDirectorStateInputSchema,
} from '../types/validation';
import type {
  DirectorState,
  VideoScene,
  GeminiAnalysisOutput,
} from '../types';
import { createDirectorState, VALIDATION } from '../types';
import { generateInitialStoryboard, refineScenePrompt } from './services/deepseekDirector';
import { generateFluxPreviews, runFluxRemaster, regenerateScene } from './services/fluxPreviewer';
import { queueBatchVideoGeneration } from './services/klingVideo';
import { STYLE_PRESETS, getStylePreset } from './utils/stylePresets';

// =============================================================================
// DIRECTOR ROUTER
// =============================================================================

export const directorRouter = router({
  /**
   * Initialize Director Mode for a vision job
   * 
   * Flow:
   * 1. Check image quality (Gatekeeper)
   * 2. Optional remaster if quality < 7
   * 3. Generate storyboard via DeepSeek
   * 4. Generate previews via Flux-Schnell
   */
  initDirector: generateProcedure
    .input(InitDirectorInputSchema)
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        // Fetch the vision job
        const job = await db.query.visionJobs.findFirst({
          where: eq(visionJobs.id, input.jobId),
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vision job not found',
          });
        }

        // Verify ownership
        if (job.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this job',
          });
        }

        // Check if job has completed analysis
        if (job.status !== 'completed' || !job.geminiOutput) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Vision job analysis is not complete',
          });
        }

        // Parse Gemini output
        let analysis: GeminiAnalysisOutput;
        try {
          analysis = typeof job.geminiOutput === 'string'
            ? JSON.parse(job.geminiOutput)
            : job.geminiOutput;
        } catch {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to parse vision analysis',
          });
        }

        const qualityScore = analysis.quality_score || 5;

        // GATEKEEPER: Check quality
        if (qualityScore < VALIDATION.MIN_QUALITY_SCORE && !input.forceRemaster) {
          const failedState: DirectorState = createDirectorState(input.jobId, job.imageUrl);
          failedState.stage = 'QUALITY_FAILED';
          failedState.quality_score = qualityScore;
          
          return failedState;
        }

        // REMASTER: If forced or quality is low
        let workingImageUrl = job.imageUrl;
        let isRemastered = false;

        if (input.forceRemaster || qualityScore < VALIDATION.MIN_QUALITY_SCORE) {
          workingImageUrl = await runFluxRemaster(
            job.imageUrl,
            analysis.visual_elements?.focal_points[0] || analysis.visual_elements?.composition
          );
          isRemastered = true;
        }

        // DIRECTOR: Generate storyboard
        const availableStyles = input.preferredStyleId
          ? STYLE_PRESETS.filter(s => s.id === input.preferredStyleId || !s.is_premium)
          : STYLE_PRESETS.filter(s => !s.is_premium || ctx.user?.plan !== 'free');

        const { scenes, selected_style_id, invariant_token } = await generateInitialStoryboard(
          analysis,
          availableStyles
        );

        // PREVIEW: Generate preview images
        const scenesWithPreviews = await generateFluxPreviews(scenes);

        // Build initial state
        const initialState: DirectorState = {
          jobId: input.jobId,
          stage: 'STORYBOARD_REVIEW',
          quality_score: qualityScore,
          source_image_url: workingImageUrl,
          is_remastered: isRemastered,
          selected_style_id,
          invariant_visual_summary: invariant_token,
          scenes: scenesWithPreviews,
          cost_estimate: scenesWithPreviews.length, // 1 credit per scene
          error_message: null,
          started_at: new Date(),
          completed_at: null,
        };

        // Persist to database
        await db
          .insert(visionJobVideoPrompts)
          .values({
            jobId: input.jobId,
            directorOutput: initialState,
            status: 'reviewing',
            remasteredImageUrl: isRemastered ? workingImageUrl : null,
          })
          .onConflictDoUpdate({
            target: visionJobVideoPrompts.jobId,
            set: {
              directorOutput: initialState,
              status: 'reviewing',
              remasteredImageUrl: isRemastered ? workingImageUrl : null,
            },
          });

        return initialState;
      }, 'initDirector');
    }),

  /**
   * Refine storyboard scenes based on user feedback
   * 
   * Traffic Light System:
   * - YELLOW: Tweak with feedback
   * - RED: Complete regeneration
   */
  refineStoryboard: refineProcedure
    .input(RefineStoryboardInputSchema)
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        // Fetch current state
        const promptRecord = await db.query.visionJobVideoPrompts.findFirst({
          where: eq(visionJobVideoPrompts.jobId, input.jobId),
        });

        if (!promptRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Director session not found',
          });
        }

        // Verify ownership via parent job
        const job = await db.query.visionJobs.findFirst({
          where: eq(visionJobs.id, input.jobId),
        });

        if (!job || job.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this session',
          });
        }

        const currentState = promptRecord.directorOutput as DirectorState;

        // Validate state allows refinement
        if (currentState.stage !== 'STORYBOARD_REVIEW') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot refine in stage: ${currentState.stage}`,
          });
        }

        let scenes = [...currentState.scenes];

        // Process each refinement
        const updates = await Promise.all(
          input.refinements.map(async (refine) => {
            const scene = scenes.find((s) => s.id === refine.sceneId);
            
            if (!scene) {
              console.warn(`Scene not found: ${refine.sceneId}`);
              return null;
            }

            // Check attempt limit
            if (scene.attempt_count >= 5) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Scene ${scene.sequence_index} has reached maximum refinement attempts`,
              });
            }

            // Generate new action token
            const newAction = await refineScenePrompt(
              scene,
              refine.feedback || null,
              refine.status === 'RED'
            );

            // Get style for the scene
            const style = getStylePreset(currentState.selected_style_id || '') || STYLE_PRESETS[0];
            if (!style) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'No style preset available',
              });
            }

            // Regenerate preview with new action
            const updatedScene = await regenerateScene(scene, newAction, style.prompt_template);

            return {
              ...updatedScene,
              user_feedback: refine.status === 'YELLOW' ? refine.feedback : null,
            };
          })
        );

        // Merge updates into scenes
        scenes = scenes.map((s) => {
          const updated = updates.find((u) => u && u.id === s.id);
          return updated || s;
        });

        // Update state
        const newState: DirectorState = {
          ...currentState,
          scenes,
        };

        // Persist
        await db
          .update(visionJobVideoPrompts)
          .set({ directorOutput: newState })
          .where(eq(visionJobVideoPrompts.jobId, input.jobId));

        return newState;
      }, 'refineStoryboard');
    }),

  /**
   * Approve scenes for production (Kling video generation)
   */
  approveProduction: generateProcedure
    .input(ApproveProductionInputSchema)
    .use(requireCredits(3)) // 3 credits for video generation
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        // Fetch current state
        const promptRecord = await db.query.visionJobVideoPrompts.findFirst({
          where: eq(visionJobVideoPrompts.jobId, input.jobId),
        });

        if (!promptRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Director session not found',
          });
        }

        // Verify ownership
        const job = await db.query.visionJobs.findFirst({
          where: eq(visionJobs.id, input.jobId),
        });

        if (!job || job.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this session',
          });
        }

        const currentState = promptRecord.directorOutput as DirectorState;

        // Validate all confirmed scenes are GREEN
        const confirmedScenes = currentState.scenes.filter((s) =>
          input.confirmedSceneIds.includes(s.id)
        );

        const nonGreenScenes = confirmedScenes.filter((s) => s.status !== 'GREEN');
        if (nonGreenScenes.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Scenes must be approved (GREEN) before production: ${nonGreenScenes.map(s => s.sequence_index).join(', ')}`,
          });
        }

        // Update state to RENDERING
        const newState: DirectorState = {
          ...currentState,
          stage: 'RENDERING',
        };

        await db
          .update(visionJobVideoPrompts)
          .set({
            directorOutput: newState,
            status: 'rendering',
          })
          .where(eq(visionJobVideoPrompts.jobId, input.jobId));

        // Queue Kling API jobs for approved scenes
        const selectedStyle = getStylePreset(currentState.selected_style_id || '');
        const stylePromptLayer = selectedStyle?.prompt_template;

        // Start video generation in background (don't await)
        queueBatchVideoGeneration(confirmedScenes, stylePromptLayer)
          .then((jobs) => {
            console.log(`Queued ${jobs.length} video generation jobs for jobId ${input.jobId}`);
          })
          .catch((error) => {
            console.error('Error queuing video generation:', error);
          });

        return newState;
      }, 'approveProduction');
    }),

  /**
   * Get current director state
   */
  getDirectorState: protectedProcedure
    .input(GetDirectorStateInputSchema)
    .query(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const promptRecord = await db.query.visionJobVideoPrompts.findFirst({
          where: eq(visionJobVideoPrompts.jobId, input.jobId),
        });

        if (!promptRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Director session not found',
          });
        }

        // Verify ownership
        const job = await db.query.visionJobs.findFirst({
          where: eq(visionJobs.id, input.jobId),
        });

        if (!job || job.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this session',
          });
        }

        return promptRecord.directorOutput as DirectorState;
      }, 'getDirectorState');
    }),

  /**
   * Get available style presets
   */
  getStylePresets: protectedProcedure.query(async ({ ctx }) => {
    // Filter based on user plan
    const userPlan = ctx.user?.plan || 'free';
    
    if (userPlan === 'free') {
      return STYLE_PRESETS.filter((s) => !s.is_premium);
    }
    
    return STYLE_PRESETS;
  }),

  /**
   * Mark a scene as approved (GREEN)
   */
  approveScene: protectedProcedure
    .input(GetDirectorStateInputSchema.extend({
      sceneId: require('zod').z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return handleServiceError(async () => {
        const promptRecord = await db.query.visionJobVideoPrompts.findFirst({
          where: eq(visionJobVideoPrompts.jobId, input.jobId),
        });

        if (!promptRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Director session not found',
          });
        }

        // Verify ownership
        const job = await db.query.visionJobs.findFirst({
          where: eq(visionJobs.id, input.jobId),
        });

        if (!job || job.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this session',
          });
        }

        const currentState = promptRecord.directorOutput as DirectorState;

        // Update scene status
        const scenes = currentState.scenes.map((s) =>
          s.id === input.sceneId ? { ...s, status: 'GREEN' as const } : s
        );

        const newState: DirectorState = {
          ...currentState,
          scenes,
        };

        await db
          .update(visionJobVideoPrompts)
          .set({ directorOutput: newState })
          .where(eq(visionJobVideoPrompts.jobId, input.jobId));

        return newState;
      }, 'approveScene');
    }),
});

export type DirectorRouter = typeof directorRouter;
