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
import { z } from 'zod';
import { db } from './db';
import { visionJobs, visionJobVideoPrompts, learningEvents, users } from '../types/schema';
import {
  router,
  protectedProcedure,
  publicProcedure,
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
  uuid,
} from '../types/validation';
import type {
  DirectorState,
  VideoScene,
  GeminiAnalysisOutput,
  DirectorPitch,
} from '../types';
import { createDirectorState, VALIDATION } from '../types';
import { generateInitialStoryboard, refineScenePrompt } from './services/deepseekDirector';
import { generateFluxPreviews, runFluxRemaster, regenerateScene } from './services/fluxPreviewer';
import { queueBatchVideoGeneration } from './services/klingVideo';
import { STYLE_PRESETS, getStylePreset } from './utils/stylePresets';
import { analyzeRawPixels, generateDirectorPitch } from './services/vision';
import { DIRECTOR_PERSONAS, getDirectorById } from '@/config/directors';

// =============================================================================
// DIRECTOR ROUTER
// =============================================================================

// =============================================================================
// INPUT SCHEMAS FOR LOUNGE
// =============================================================================

const AnalyzeForLoungeSchema = z.object({
  imageUrl: z.string().url(),
});

const SelectDirectorSchema = z.object({
  jobId: uuid,
  directorId: z.enum(['newtonian', 'visionary', 'minimalist', 'provocateur']),
  rawScores: z.object({
    physics: z.number().min(0).max(10),
    vibe: z.number().min(0).max(10),
    logic: z.number().min(0).max(10),
  }),
});

// =============================================================================
// DIRECTOR ROUTER
// =============================================================================

export const directorRouter = router({
  // ===========================================================================
  // PHASE 4: THE DIRECTOR'S LOUNGE ENDPOINTS
  // ===========================================================================

  /**
   * Analyze image with all 4 Directors (Rashomon Pattern)
   *
   * Returns 4 distinct pitches from each Director persona.
   * This is the main endpoint for The Director's Lounge UI.
   */
  analyze4Directors: publicProcedure
    .input(AnalyzeForLoungeSchema)
    .mutation(async ({ input }) => {
      console.log('[Lounge] Starting 4-Director analysis for:', input.imageUrl);

      // STEP 1: THE EYE - Get raw pixel analysis (cached for all Directors)
      const rawAnalysis = await analyzeRawPixels(input.imageUrl);
      console.log('[Lounge] Raw analysis complete:', {
        physics: rawAnalysis.physics_score,
        vibe: rawAnalysis.vibe_score,
        logic: rawAnalysis.logic_score,
      });

      // STEP 2: THE VOICE - Generate pitches from all 4 Directors in parallel
      const pitchPromises = DIRECTOR_PERSONAS.map(async (director) => {
        try {
          const pitch = await generateDirectorPitch(rawAnalysis, director.id);
          return {
            id: director.id,
            name: director.name,
            avatar: director.avatar,
            archetype: director.archetype,
            quote: director.quote,
            stats: pitch.biased_scores,
            engine: pitch.recommended_engine,
            riskLevel: pitch.risk_level,
            commentary: pitch.three_beat_pulse,
          };
        } catch (error) {
          console.error(`[Lounge] Error generating pitch for ${director.id}:`, error);
          // Return fallback data on error
          return {
            id: director.id,
            name: director.name,
            avatar: director.avatar,
            archetype: director.archetype,
            quote: director.quote,
            stats: { physics: 5, vibe: 5, logic: 5 },
            engine: 'kling' as const,
            riskLevel: 'Safe' as const,
            commentary: {
              vision: 'Analysis unavailable',
              safety: 'Please retry',
              magic: 'Error occurred during analysis',
            },
          };
        }
      });

      const directorPitches = await Promise.all(pitchPromises);

      console.log('[Lounge] All 4 pitches generated successfully');

      return {
        rawScores: {
          physics: rawAnalysis.physics_score,
          vibe: rawAnalysis.vibe_score,
          logic: rawAnalysis.logic_score,
        },
        directors: directorPitches,
        analyzedAt: new Date().toISOString(),
      };
    }),

  /**
   * Record Director selection (Learning Event)
   *
   * Called when user selects a Director in The Lounge.
   * Captures the learning delta for the Studio Head.
   */
  selectDirector: publicProcedure
    .input(SelectDirectorSchema)
    .mutation(async ({ input }) => {
      console.log('[Lounge] Recording Director selection:', input.directorId);

      // Determine objective winner (highest raw score)
      const { physics, vibe, logic } = input.rawScores;
      const objectiveWinner =
        physics >= vibe && physics >= logic ? 'physics' :
        vibe >= physics && vibe >= logic ? 'vibe' : 'logic';

      // Map Director to their dominant score dimension
      const directorDominance: Record<string, 'physics' | 'vibe' | 'logic'> = {
        newtonian: 'physics',
        visionary: 'vibe',
        minimalist: 'logic',
        provocateur: 'physics', // Chaos leans physics
      };

      const subjectiveChoice = directorDominance[input.directorId] ?? 'physics';
      const wasOverride = objectiveWinner !== subjectiveChoice;

      // Get system user for now (will be replaced with auth user)
      let systemUser = await db.query.users.findFirst({
        where: eq(users.email, 'admin@longevity.valley'),
      });

      if (!systemUser) {
        console.warn('[Lounge] System user not found, skipping learning event');
        return {
          success: true,
          learningRecorded: false,
          selectedDirector: input.directorId,
        };
      }

      // Record learning event
      try {
        await db.insert(learningEvents).values({
          userId: systemUser.id,
          jobId: input.jobId,
          rawScores: input.rawScores,
          directorPitches: [], // Will be populated with full pitch data later
          selectedDirectorId: input.directorId,
          learningDelta: {
            objectiveWinner,
            subjectiveChoice,
            wasOverride,
          },
        });

        console.log('[Lounge] Learning event recorded:', {
          directorId: input.directorId,
          wasOverride,
          objectiveWinner,
          subjectiveChoice,
        });

        return {
          success: true,
          learningRecorded: true,
          selectedDirector: input.directorId,
          wasOverride,
        };
      } catch (error) {
        console.error('[Lounge] Failed to record learning event:', error);
        return {
          success: true,
          learningRecorded: false,
          selectedDirector: input.directorId,
        };
      }
    }),

  // ===========================================================================
  // EXISTING PHASE 3C ENDPOINTS (Video Director Mode)
  // ===========================================================================

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

        // Persist to database using the correct schema columns
        await db
          .insert(visionJobVideoPrompts)
          .values({
            jobId: input.jobId,
            productionEngine: 'kling', // Default engine, will be updated on selection
            status: 'reviewing',
            scenesData: scenesWithPreviews,
            remasteredImageUrl: isRemastered ? workingImageUrl : null,
          })
          .onConflictDoUpdate({
            target: visionJobVideoPrompts.jobId,
            set: {
              status: 'reviewing',
              scenesData: scenesWithPreviews,
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

        // Reconstruct DirectorState from schema columns
        const currentScenes = promptRecord.scenesData as DirectorState['scenes'];
        const currentStatus = promptRecord.status;

        // Validate state allows refinement (status should be 'reviewing')
        if (currentStatus !== 'reviewing') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot refine in status: ${currentStatus}`,
          });
        }

        let scenes = [...currentScenes];

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
            // Get style from the job's vision analysis or use default
            const style = STYLE_PRESETS[0];
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

        // Persist updated scenes
        await db
          .update(visionJobVideoPrompts)
          .set({ scenesData: scenes })
          .where(eq(visionJobVideoPrompts.jobId, input.jobId));

        // Return reconstructed state for API response
        const newState: DirectorState = {
          jobId: input.jobId,
          stage: 'STORYBOARD_REVIEW',
          quality_score: 7, // Default
          source_image_url: promptRecord.remasteredImageUrl || '',
          is_remastered: !!promptRecord.remasteredImageUrl,
          selected_style_id: null,
          invariant_visual_summary: '',
          scenes,
          cost_estimate: scenes.length,
          error_message: null,
          started_at: promptRecord.createdAt,
          completed_at: null,
        };

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

        // Get scenes from schema
        const currentScenes = promptRecord.scenesData as DirectorState['scenes'];

        // Validate all confirmed scenes are GREEN
        const confirmedScenes = currentScenes.filter((s) =>
          input.confirmedSceneIds.includes(s.id)
        );

        const nonGreenScenes = confirmedScenes.filter((s) => s.status !== 'GREEN');
        if (nonGreenScenes.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Scenes must be approved (GREEN) before production: ${nonGreenScenes.map(s => s.sequence_index).join(', ')}`,
          });
        }

        // Update status to rendering
        await db
          .update(visionJobVideoPrompts)
          .set({
            status: 'rendering',
          })
          .where(eq(visionJobVideoPrompts.jobId, input.jobId));

        // Get style for video generation
        const selectedStyle = STYLE_PRESETS[0];
        const stylePromptLayer = selectedStyle?.prompt_template;

        // Start video generation in background (don't await)
        queueBatchVideoGeneration(confirmedScenes, stylePromptLayer)
          .then((jobs) => {
            console.log(`Queued ${jobs.length} video generation jobs for jobId ${input.jobId}`);
          })
          .catch((error) => {
            console.error('Error queuing video generation:', error);
          });

        // Return reconstructed state for API response
        const newState: DirectorState = {
          jobId: input.jobId,
          stage: 'RENDERING',
          quality_score: 7,
          source_image_url: promptRecord.remasteredImageUrl || '',
          is_remastered: !!promptRecord.remasteredImageUrl,
          selected_style_id: null,
          invariant_visual_summary: '',
          scenes: currentScenes,
          cost_estimate: confirmedScenes.length,
          error_message: null,
          started_at: promptRecord.createdAt,
          completed_at: null,
        };

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

        // Reconstruct DirectorState from schema columns
        const scenes = promptRecord.scenesData as DirectorState['scenes'];
        const status = promptRecord.status;

        // Map status to stage
        const stageMap: Record<string, DirectorState['stage']> = {
          reviewing: 'STORYBOARD_REVIEW',
          rendering: 'RENDERING',
          completed: 'COMPLETED',
          scripting: 'STORYBOARD_REVIEW',
        };

        const state: DirectorState = {
          jobId: input.jobId,
          stage: stageMap[status ?? 'reviewing'] ?? 'STORYBOARD_REVIEW',
          quality_score: 7,
          source_image_url: promptRecord.remasteredImageUrl || job.imageUrl,
          is_remastered: !!promptRecord.remasteredImageUrl,
          selected_style_id: null,
          invariant_visual_summary: '',
          scenes: scenes ?? [],
          cost_estimate: scenes?.length ?? 0,
          error_message: null,
          started_at: promptRecord.createdAt,
          completed_at: promptRecord.completedAt,
        };

        return state;
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

        // Get current scenes from schema
        const currentScenes = promptRecord.scenesData as DirectorState['scenes'];

        // Update scene status
        const scenes = currentScenes.map((s) =>
          s.id === input.sceneId ? { ...s, status: 'GREEN' as const } : s
        );

        // Persist updated scenes
        await db
          .update(visionJobVideoPrompts)
          .set({ scenesData: scenes })
          .where(eq(visionJobVideoPrompts.jobId, input.jobId));

        // Return reconstructed state for API response
        const newState: DirectorState = {
          jobId: input.jobId,
          stage: 'STORYBOARD_REVIEW',
          quality_score: 7,
          source_image_url: promptRecord.remasteredImageUrl || job.imageUrl,
          is_remastered: !!promptRecord.remasteredImageUrl,
          selected_style_id: null,
          invariant_visual_summary: '',
          scenes,
          cost_estimate: scenes.length,
          error_message: null,
          started_at: promptRecord.createdAt,
          completed_at: null,
        };

        return newState;
      }, 'approveScene');
    }),
});

export type DirectorRouter = typeof directorRouter;
