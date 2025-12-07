'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { trpc, createQueryClient, createTRPCClient } from '@/lib/trpc';
import { AuthProvider, useAuth, setTokenGetter } from '@/client/useAuth';

// Inner component that has access to auth context
function TRPCProviderWithAuth({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const { getAccessToken } = useAuth();

  // Register the token getter for tRPC
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);

  const [trpcClient] = useState(() =>
    createTRPCClient({
      url: '/api/trpc',
      getAuthToken: getAccessToken,
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TRPCProviderWithAuth>{children}</TRPCProviderWithAuth>
    </AuthProvider>
  );
}
