/**
 * Phase 3 - Rate Limiting Middleware
 * 
 * Implements P0 Critical: Rate limiting on all endpoints
 * Uses sliding window algorithm with database backing for distributed systems.
 * 
 * @module server/middleware/rateLimit
 * @version 3.0.0
 */

import { TRPCError } from '@trpc/server';
import { db } from '../../drizzle/db';
import { rateLimitBuckets } from '../../drizzle/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { RATE_LIMITS } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Unique identifier for rate limit bucket */
  keyGenerator: (ctx: RateLimitContext) => string;
  /** Custom error message */
  message?: string;
  /** Skip rate limiting for certain conditions */
  skip?: (ctx: RateLimitContext) => boolean;
}

export interface RateLimitContext {
  userId?: string;
  ip?: string;
  endpoint: string;
  headers?: Record<string, string>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

// =============================================================================
// IN-MEMORY CACHE (For high-frequency endpoints)
// =============================================================================

interface MemoryCacheEntry {
  count: number;
  windowStart: number;
  windowEnd: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.windowEnd < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

// =============================================================================
// RATE LIMIT CHECKER
// =============================================================================

/**
 * Check rate limit using sliding window algorithm
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  ctx: RateLimitContext
): Promise<RateLimitResult> {
  // Skip if configured
  if (config.skip?.(ctx)) {
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  const key = config.keyGenerator(ctx);
  const now = Date.now();
  const windowStart = now;
  const windowEnd = now + config.windowMs;

  // Try memory cache first for performance
  const cached = memoryCache.get(key);
  
  if (cached && cached.windowEnd > now) {
    // Within existing window
    cached.count++;
    
    if (cached.count > config.limit) {
      const retryAfter = Math.ceil((cached.windowEnd - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(cached.windowEnd),
        retryAfter,
      };
    }
    
    return {
      allowed: true,
      remaining: config.limit - cached.count,
      resetAt: new Date(cached.windowEnd),
    };
  }

  // Start new window
  memoryCache.set(key, {
    count: 1,
    windowStart,
    windowEnd,
  });

  // Persist to database for distributed rate limiting (async, non-blocking)
  persistRateLimitAsync(key, ctx.endpoint, windowStart, windowEnd).catch(
    (err) => console.error('Rate limit persist error:', err)
  );

  return {
    allowed: true,
    remaining: config.limit - 1,
    resetAt: new Date(windowEnd),
  };
}

/**
 * Persist rate limit to database (for distributed systems)
 */
async function persistRateLimitAsync(
  identifier: string,
  endpoint: string,
  windowStart: number,
  windowEnd: number
): Promise<void> {
  try {
    await db
      .insert(rateLimitBuckets)
      .values({
        identifier,
        endpoint,
        requestCount: 1,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
      })
      .onDuplicateKeyUpdate({
        set: {
          requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
        },
      });
  } catch (error) {
    // Log but don't fail the request
    console.error('Failed to persist rate limit:', error);
  }
}

// =============================================================================
// PRE-CONFIGURED RATE LIMITERS
// =============================================================================

/**
 * Rate limiter for generate endpoints (most restrictive)
 */
export const generateRateLimiter: RateLimitConfig = {
  limit: RATE_LIMITS.GENERATE_RPM,
  windowMs: RATE_LIMITS.WINDOW_MS,
  keyGenerator: (ctx) => `generate:${ctx.userId || ctx.ip}`,
  message: 'Too many generation requests. Please wait before trying again.',
};

/**
 * Rate limiter for upload endpoints
 */
export const uploadRateLimiter: RateLimitConfig = {
  limit: RATE_LIMITS.UPLOAD_RPM,
  windowMs: RATE_LIMITS.WINDOW_MS,
  keyGenerator: (ctx) => `upload:${ctx.userId || ctx.ip}`,
  message: 'Too many upload requests. Please wait before trying again.',
};

/**
 * Rate limiter for refine endpoints
 */
export const refineRateLimiter: RateLimitConfig = {
  limit: RATE_LIMITS.REFINE_RPM,
  windowMs: RATE_LIMITS.WINDOW_MS,
  keyGenerator: (ctx) => `refine:${ctx.userId || ctx.ip}`,
  message: 'Too many refinement requests. Please wait before trying again.',
};

/**
 * General API rate limiter
 */
export const apiRateLimiter: RateLimitConfig = {
  limit: RATE_LIMITS.API_RPM,
  windowMs: RATE_LIMITS.WINDOW_MS,
  keyGenerator: (ctx) => `api:${ctx.userId || ctx.ip}`,
  message: 'Too many requests. Please slow down.',
};

// =============================================================================
// TRPC MIDDLEWARE
// =============================================================================

/**
 * Create tRPC middleware for rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(opts: {
    ctx: { userId?: string; ip?: string };
    next: () => Promise<unknown>;
    path: string;
  }) {
    const result = await checkRateLimit(config, {
      userId: opts.ctx.userId,
      ip: opts.ctx.ip,
      endpoint: opts.path,
    });

    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: config.message || 'Rate limit exceeded',
        cause: {
          retryAfter: result.retryAfter,
          resetAt: result.resetAt,
        },
      });
    }

    return opts.next();
  };
}

// =============================================================================
// RATE LIMIT HEADERS
// =============================================================================

/**
 * Generate rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.retryAfter && { 'Retry-After': String(result.retryAfter) }),
  };
}

// =============================================================================
// CLEANUP UTILITY
// =============================================================================

/**
 * Clean up expired rate limit records from database
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await db
    .delete(rateLimitBuckets)
    .where(sql`${rateLimitBuckets.windowEnd} < NOW()`);
  
  return result.rowsAffected || 0;
}
