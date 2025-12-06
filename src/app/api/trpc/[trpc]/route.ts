/**
 * tRPC API Route Handler
 *
 * Next.js App Router API route for handling tRPC requests.
 * Uses fetch adapter for App Router compatibility.
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/index';
import { db } from '@/server/db';

/**
 * Handle both GET and POST requests
 */
async function handler(req: Request) {
  // Log at the very top - before any processing
  console.log('📥 tRPC Endpoint Hit:', req.url);
  console.log('📊 Method:', req.method);
  console.log('🕐 Timestamp:', new Date().toISOString());

  try {
    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,

      /**
       * Create context for each request
       * Inline implementation to avoid import loops
       */
      createContext: async () => {
        console.log('🔧 Creating tRPC context...');

        const context = {
          db,
          userId: 'test-user-id', // Temporary test user ID
          user: null,
          req: null as any,
          res: null as any,
        };

        console.log('✅ Context created:', {
          hasDb: !!context.db,
          userId: context.userId,
          contextKeys: Object.keys(context),
        });

        return context;
      },

      /**
       * Error handler
       */
      onError: ({ error, path, type }) => {
        console.error('❌ tRPC Error:');
        console.error('  Path:', path);
        console.error('  Type:', type);
        console.error('  Code:', error.code);
        console.error('  Message:', error.message);

        // Safely log error details without causing circular reference errors
        if (error.cause) {
          console.error('  Cause:', error.cause instanceof Error ? error.cause.message : String(error.cause));
        }
      },
    });
  } catch (error) {
    console.error('💥 Fatal error in tRPC handler:');
    console.error(error);

    // Return a proper error response
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export { handler as GET, handler as POST };
