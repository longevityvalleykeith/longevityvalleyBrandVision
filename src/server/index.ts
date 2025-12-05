/**
 * Phase 3 - Main API Router
 * 
 * Combines all sub-routers into the main application router.
 * 
 * @module server/routers/index
 * @version 3.0.0
 */

import { router, publicProcedure } from '../trpc';
import { visionRouter } from './visionRouter';
import { directorRouter } from './directorRouter';
import { checkDatabaseConnection } from './db';
import { isDeepSeekConfigured, checkDeepSeekHealth } from './services/deepseekDirector';
import { isFluxConfigured, checkFluxHealth } from './services/fluxPreviewer';
import { isKlingConfigured, checkKlingHealth } from './services/klingVideo';

// =============================================================================
// HEALTH CHECK ROUTER
// =============================================================================

const healthRouter = router({
  /**
   * Basic health check - returns OK if server is running
   */
  ping: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
    };
  }),

  /**
   * Detailed health check - checks all dependencies
   */
  detailed: publicProcedure.query(async () => {
    const checks = await Promise.all([
      checkDatabaseConnection().then((ok) => ({ name: 'database', ok })),
      checkDeepSeekHealth().then((ok) => ({ name: 'deepseek', ok })),
      checkFluxHealth().then((ok) => ({ name: 'flux', ok })),
      checkKlingHealth().then((ok) => ({ name: 'kling', ok })),
    ]);

    const allHealthy = checks.every((c) => c.ok);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      checks: checks.reduce(
        (acc, c) => ({ ...acc, [c.name]: c.ok ? 'ok' : 'error' }),
        {} as Record<string, string>
      ),
      config: {
        deepseek: isDeepSeekConfigured(),
        flux: isFluxConfigured(),
        kling: isKlingConfigured(),
      },
    };
  }),
});

// =============================================================================
// MAIN APP ROUTER
// =============================================================================

export const appRouter = router({
  /** Health check endpoints */
  health: healthRouter,
  
  /** Phase 3B - Vision/Brand Analysis */
  vision: visionRouter,
  
  /** Phase 3C - Video Director Mode */
  director: directorRouter,
});

export type AppRouter = typeof appRouter;

// =============================================================================
// EXPORTS FOR CLIENT
// =============================================================================

// Re-export types for client-side usage
export type { VisionRouter } from './visionRouter';
export type { DirectorRouter } from './directorRouter';
