/**
 * Phase 3 - tRPC Client Configuration
 * 
 * Client-side tRPC setup with React Query integration.
 * 
 * @module client/lib/trpc
 * @version 3.0.0
 */

import { createTRPCReact, httpLink, TRPCClientError } from '@trpc/react-query';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';
import type { AppRouter } from './index';

// =============================================================================
// TRPC CLIENT
// =============================================================================

export const trpc = createTRPCReact<AppRouter>();

// =============================================================================
// QUERY CLIENT CONFIGURATION
// =============================================================================

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 30 seconds
        staleTime: 30 * 1000,
        // Cache time: 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry logic
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (error instanceof TRPCClientError) {
            const code = error.data?.code;
            if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
              return false;
            }
            // Don't retry on validation errors
            if (code === 'BAD_REQUEST') {
              return false;
            }
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false,
        onError: (error) => {
          console.error('Mutation error:', error);
        },
      },
    },
  });
}

// =============================================================================
// TRPC CLIENT CONFIGURATION
// =============================================================================

export function createTRPCClient(opts: { url: string; getAuthToken?: () => string | null }) {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpLink({
        url: opts.url,
        headers: () => {
          const headers: Record<string, string> = {};

          const token = opts.getAuthToken?.();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          return headers;
        },
      }),
    ],
  });
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Extract user-friendly error message from tRPC error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    // Handle specific error codes
    const code = error.data?.code;
    
    switch (code) {
      case 'UNAUTHORIZED':
        return 'Please log in to continue.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'TOO_MANY_REQUESTS':
        const retryAfter = error.data?.cause?.retryAfter;
        return retryAfter 
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Too many requests. Please slow down.';
      case 'BAD_REQUEST':
        // Check for validation errors
        if (error.data?.zodError) {
          const zodErrors = error.data.zodError;
          const firstError = Object.values(zodErrors)[0];
          if (Array.isArray(firstError) && firstError[0]) {
            return firstError[0];
          }
        }
        return error.message || 'Invalid request.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}

/**
 * Check if error is a specific tRPC error code
 */
export function isTRPCError(error: unknown, code: string): boolean {
  return error instanceof TRPCClientError && error.data?.code === code;
}

/**
 * Check if error is due to rate limiting
 */
export function isRateLimited(error: unknown): boolean {
  return isTRPCError(error, 'TOO_MANY_REQUESTS');
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return isTRPCError(error, 'UNAUTHORIZED') || isTRPCError(error, 'FORBIDDEN');
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { AppRouter };
