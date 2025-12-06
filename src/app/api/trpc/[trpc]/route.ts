import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/index';
import { db } from '../../../../server/db';

const handler = async (req: Request) => {
  console.log('🔵 tRPC Request:', req.method, req.url);

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      console.log('🟢 Creating context...');
      const context = {
        req: null as any,
        res: null as any,
        db,
        userId: null,
        user: null,
      };
      console.log('✅ Context created:', Object.keys(context));
      return context;
    },
    onError: ({ error, path }) => {
      console.error('❌ tRPC Error on', path, ':', error);
    },
  });
};

export { handler as GET, handler as POST };
