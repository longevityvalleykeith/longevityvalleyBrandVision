'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc, createQueryClient, createTRPCClient } from '@/lib/trpc';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient({
      url: '/api/trpc',
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
