/**
 * Phase 3 - Rate Limiting Middleware
 *
 * Implements sliding window rate limiting using PostgreSQL.
 * Protects API endpoints from abuse per FINAL-DEV_SPEC:5.3.
 *
 * @module server/middleware/rateLimit
 * @version 3.0.0
 */

import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { rateLimitBuckets } from '../../types/schema';
import { eq, and, gt } from 'drizzle-orm';

// =============================================================================
// RATE LIMIT CONFIGURATIONS
// =============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Endpoint identifier */
  endpoint: string;
}

/**
 * Predefined rate limits per endpoint type
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  upload: {
    maxRequests: 20,
    windowSeconds: 60,
    endpoint: 'vision.upload',
  },
  generate: {
    maxRequests: 10,
    windowSeconds: 60,
    endpoint: 'director.initDirector',
  },
  refine: {
    maxRequests: 30,
    windowSeconds: 60,
    endpoint: 'director.refineStoryboard',
  },
  production: {
    maxRequests: 5,
    windowSeconds: 60,
    endpoint: 'director.approveProduction',
  },
  // More lenient limits for read operations
  query: {
    maxRequests: 100,
    windowSeconds: 60,
    endpoint: 'query',
  },
} as const;

// =============================================================================
// RATE LIMIT CHECKER
// =============================================================================

/**
 * Check if a request is within rate limits
 *
 * @param identifier - User ID or IP address
 * @param config - Rate limit configuration
 * @returns True if request is allowed, throws TRPCError if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);
  const windowEnd = new Date(now.getTime() + config.windowSeconds * 1000);

  // Build composite identifier
  const compositeIdentifier = `${identifier}:${config.endpoint}`;

  try {
    // Find existing bucket for this identifier and endpoint
    const existingBucket = await db.query.rateLimitBuckets.findFirst({
      where: and(
        eq(rateLimitBuckets.identifier, compositeIdentifier),
        eq(rateLimitBuckets.endpoint, config.endpoint),
        gt(rateLimitBuckets.windowEnd, now)
      ),
    });

    if (existingBucket) {
      // Bucket exists and is still valid
      if (existingBucket.requestCount >= config.maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil(
          (existingBucket.windowEnd.getTime() - now.getTime()) / 1000
        );

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowSeconds}s. Retry after ${retryAfter}s.`,
        });
      }

      // Increment request count
      await db
        .update(rateLimitBuckets)
        .set({
          requestCount: existingBucket.requestCount + 1,
        })
        .where(eq(rateLimitBuckets.id, existingBucket.id));

      return true;
    } else {
      // Create new bucket
      await db.insert(rateLimitBuckets).values({
        identifier: compositeIdentifier,
        endpoint: config.endpoint,
        requestCount: 1,
        windowStart,
        windowEnd,
      });

      return true;
    }
  } catch (error) {
    // If it's already a TRPCError (rate limit exceeded), re-throw
    if (error instanceof TRPCError) {
      throw error;
    }

    // Log other errors but don't block the request
    console.error('Rate limit check failed:', error);
    return true; // Fail open for database errors
  }
}

// =============================================================================
// CLEANUP UTILITY
// =============================================================================

/**
 * Clean up expired rate limit buckets
 * Should be called periodically (e.g., via cron job)
 *
 * @returns Number of buckets deleted
 */
export async function cleanupExpiredBuckets(): Promise<number> {
  const now = new Date();

  try {
    const result = await db
      .delete(rateLimitBuckets)
      .where(gt(now, rateLimitBuckets.windowEnd));

    // Note: Drizzle doesn't return affected rows count by default
    // Consider adding a COUNT query if needed
    console.log(`Cleaned up expired rate limit buckets at ${now.toISOString()}`);
    return 0; // Placeholder
  } catch (error) {
    console.error('Failed to cleanup rate limit buckets:', error);
    return 0;
  }
}

// =============================================================================
// MIDDLEWARE FACTORY
// =============================================================================

/**
 * Create a rate limiting middleware for tRPC procedures
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * ```ts
 * const uploadProcedure = protectedProcedure
 *   .use(createRateLimitMiddleware(RATE_LIMITS.upload));
 * ```
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async ({ ctx, next }: { ctx: any; next: any }) => {
    // Extract identifier (userId or IP address)
    const identifier = ctx.userId || ctx.req?.ip || 'anonymous';

    // Check rate limit
    await checkRateLimit(identifier, config);

    // Proceed to next middleware/procedure
    return next();
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get current rate limit status for an identifier
 *
 * @param identifier - User ID or IP address
 * @param endpoint - Endpoint name
 * @returns Current status or null if no bucket exists
 */
export async function getRateLimitStatus(
  identifier: string,
  endpoint: string
): Promise<{
  requestCount: number;
  maxRequests: number;
  windowEnd: Date;
  remaining: number;
} | null> {
  const now = new Date();
  const compositeIdentifier = `${identifier}:${endpoint}`;

  const bucket = await db.query.rateLimitBuckets.findFirst({
    where: and(
      eq(rateLimitBuckets.identifier, compositeIdentifier),
      eq(rateLimitBuckets.endpoint, endpoint),
      gt(rateLimitBuckets.windowEnd, now)
    ),
  });

  if (!bucket) {
    return null;
  }

  const config = Object.values(RATE_LIMITS).find(c => c.endpoint === endpoint);
  const maxRequests = config?.maxRequests || 100;

  return {
    requestCount: bucket.requestCount,
    maxRequests,
    windowEnd: bucket.windowEnd,
    remaining: Math.max(0, maxRequests - bucket.requestCount),
  };
}

/**
 * Reset rate limit for a specific identifier and endpoint
 * Useful for admin operations or testing
 *
 * @param identifier - User ID or IP address
 * @param endpoint - Endpoint name
 */
export async function resetRateLimit(
  identifier: string,
  endpoint: string
): Promise<void> {
  const compositeIdentifier = `${identifier}:${endpoint}`;

  await db
    .delete(rateLimitBuckets)
    .where(
      and(
        eq(rateLimitBuckets.identifier, compositeIdentifier),
        eq(rateLimitBuckets.endpoint, endpoint)
      )
    );
}
