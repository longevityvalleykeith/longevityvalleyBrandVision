/**
 * Phase 3 - tRPC Server Configuration
 *
 * Server-side tRPC setup with authentication and middleware support.
 * Base procedures and context definition.
 *
 * @module server/trpc
 * @version 3.0.0
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from './server/db';
import { users } from './types/schema';
import { eq } from 'drizzle-orm';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * Create context for each request
 * Includes database client, user session, and request metadata
 */
export async function createContext({ req, res }: CreateNextContextOptions) {
  // Extract auth token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  let userId: string | null = null;
  let user: typeof users.$inferSelect | null = null;

  // If token exists, validate and fetch user
  if (token) {
    try {
      // TODO: Implement actual token validation with Supabase Auth
      // For now, treat token as userId for development
      userId = token;

      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      }) || null;

      if (!user || user.deletedAt) {
        userId = null;
        user = null;
      }
    } catch (error) {
      console.error('Auth error:', error);
      userId = null;
      user = null;
    }
  }

  return {
    req,
    res,
    db,
    userId,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// =============================================================================
// TRPC INITIALIZATION
// =============================================================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// =============================================================================
// BASE ROUTER AND PROCEDURES
// =============================================================================

export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure (no authentication required)
 */
export const publicProcedure = t.procedure;

/**
 * Authentication middleware
 * Throws UNAUTHORIZED if user is not authenticated
 */
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});

/**
 * Protected procedure (requires authentication)
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Generate procedure (protected + rate limited for generation)
 * Used for AI generation endpoints
 * Rate limit: 10 req/60s
 */
const generateRateLimit = middleware(async ({ ctx, next }) => {
  const { checkRateLimit, RATE_LIMITS } = await import('./server/middleware/rateLimit');

  const identifier = ctx.userId || ctx.req?.socket?.remoteAddress || 'anonymous';
  await checkRateLimit(identifier, RATE_LIMITS['generate']!);

  return next();
});

export const generateProcedure = protectedProcedure.use(generateRateLimit);

/**
 * Refine procedure (protected + rate limited for refinement)
 * Used for refinement endpoints
 * Rate limit: 30 req/60s
 */
const refineRateLimit = middleware(async ({ ctx, next }) => {
  const { checkRateLimit, RATE_LIMITS } = await import('./server/middleware/rateLimit');

  const identifier = ctx.userId || ctx.req?.socket?.remoteAddress || 'anonymous';
  await checkRateLimit(identifier, RATE_LIMITS['refine']!);

  return next();
});

export const refineProcedure = protectedProcedure.use(refineRateLimit);

/**
 * Upload procedure (protected + rate limited for uploads)
 * Used for file upload endpoints
 * Rate limit: 20 req/60s
 */
const uploadRateLimit = middleware(async ({ ctx, next }) => {
  const { checkRateLimit, RATE_LIMITS } = await import('./server/middleware/rateLimit');

  const identifier = ctx.userId || ctx.req?.socket?.remoteAddress || 'anonymous';
  await checkRateLimit(identifier, RATE_LIMITS['upload']!);

  return next();
});

export const uploadProcedure = protectedProcedure.use(uploadRateLimit);

// =============================================================================
// CREDIT REQUIREMENT MIDDLEWARE
// =============================================================================

/**
 * Middleware to check if user has sufficient credits
 *
 * @param minCredits - Minimum credits required
 * @returns Middleware function
 */
export function requireCredits(minCredits: number) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    if (ctx.user.creditsRemaining < minCredits) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient credits. Required: ${minCredits}, Available: ${ctx.user.creditsRemaining}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Standardized error handler for service calls
 * Wraps service errors in appropriate TRPCError types
 *
 * @param fn - Async function to execute
 * @param serviceName - Name of the service for logging
 * @returns Result of the function or throws TRPCError
 */
export async function handleServiceError<T>(
  fn: () => Promise<T>,
  serviceName: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // If it's already a TRPCError, re-throw as is
    if (error instanceof TRPCError) {
      throw error;
    }

    // Log the error for debugging
    console.error(`[${serviceName}] Service error:`, error);

    // Extract error message
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific error patterns
    if (message.includes('API key')) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'External service configuration error',
      });
    }

    if (message.includes('rate limit') || message.includes('quota')) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'External service rate limit exceeded',
      });
    }

    if (message.includes('timeout')) {
      throw new TRPCError({
        code: 'TIMEOUT',
        message: 'Service request timed out',
      });
    }

    // Generic internal server error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Service error: ${message}`,
    });
  }
}
