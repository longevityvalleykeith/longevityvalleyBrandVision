/**
 * tRPC Client for Frontend
 *
 * Client-side tRPC hooks and utilities.
 * Re-exports from src/server/trpc.ts for frontend use.
 *
 * @module lib/trpc
 * @version 3.0.0
 */

export { trpc, createQueryClient, createTRPCClient, getErrorMessage, isRateLimited, isAuthError } from '../server/trpc';
export type { AppRouter } from '../server/index';
