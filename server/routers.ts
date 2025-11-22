import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateMandarinContent, generateContentWithVisualContext } from "./aiContentGenerator";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Brand management
  brand: router({
    create: protectedProcedure
      .input(z.object({
        brandName: z.string().min(1),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBrand({
          userId: ctx.user.id,
          brandName: input.brandName,
          logoUrl: input.logoUrl || null,
        });
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getBrandsByUserId(ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBrandById(input.brandId);
      }),
  }),

  // Brand assets management
  brandAsset: router({
    create: protectedProcedure
      .input(z.object({
        brandId: z.number(),
        assetType: z.enum(["photo", "video"]),
        storageUrl: z.string(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBrandAsset({
          brandId: input.brandId,
          assetType: input.assetType,
          storageUrl: input.storageUrl,
          mimeType: input.mimeType || null,
        });
      }),

    listByBrand: protectedProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBrandAssetsByBrandId(input.brandId);
      }),
  }),

  // Freemium content generation
  contentGeneration: router({
    // Submit product details and generate 5 Mandarin content pieces
    generate: protectedProcedure
      .input(z.object({
        productInfo: z.string().min(10),
        sellingPoints: z.string().min(10),
        targetAudience: z.string().optional(),
        painPoints: z.string().optional(),
        scenarios: z.string().optional(),
        ctaOffer: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save the input to database
        const savedInput = await db.createBrandInput({
          userId: ctx.user.id,
          productInfo: input.productInfo,
          sellingPoints: input.sellingPoints,
          targetAudience: input.targetAudience || null,
          painPoints: input.painPoints || null,
          scenarios: input.scenarios || null,
          ctaOffer: input.ctaOffer || null,
        });

        // Generate content using AI
        const generatedPieces = await generateMandarinContent({
          productInfo: input.productInfo,
          sellingPoints: input.sellingPoints,
          targetAudience: input.targetAudience,
          painPoints: input.painPoints,
          scenarios: input.scenarios,
          ctaOffer: input.ctaOffer,
        });

        // Save each generated piece to database
        const savedContent = await Promise.all(
          generatedPieces.map(piece =>
            db.createGeneratedContent({
              inputId: savedInput.id,
              userId: ctx.user.id,
              storyboardMandarin: piece.storyboardMandarin,
              captionMandarin: piece.captionMandarin,
              explanationEnglish: piece.explanationEnglish,
              userFeedbackScore: null,
              userFeedbackText: null,
            })
          )
        );

        return {
          inputId: savedInput.id,
          content: savedContent,
        };
      }),

    // Get user's content generation history
    history: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getBrandInputsByUserId(ctx.user.id);
      }),

    // Get generated content for a specific input
    getByInputId: protectedProcedure
      .input(z.object({ inputId: z.number() }))
      .query(async ({ input }) => {
        return await db.getGeneratedContentByInputId(input.inputId);
      }),

    // Submit feedback on generated content
    submitFeedback: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        score: z.number().min(-1).max(1), // -1 for thumbs down, 1 for thumbs up
        text: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateContentFeedback(
          input.contentId,
          input.score,
          input.text
        );
        return { success: true };
      }),
  }),

  // A.I. Brand Specialist Chat (Premium feature)
  conversation: router({
    create: protectedProcedure
      .input(z.object({
        brandId: z.number().optional(),
        initialMessage: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const messageLog = JSON.stringify([
          { role: "user", content: input.initialMessage, timestamp: Date.now() }
        ]);

        return await db.createConversation({
          userId: ctx.user.id,
          brandId: input.brandId || null,
          messageLog,
        });
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getConversationsByUserId(ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        messageLog: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateConversation(input.conversationId, input.messageLog);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
