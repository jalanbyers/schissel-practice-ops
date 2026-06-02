'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session.
  // staleTime: data is considered fresh for 60 s before a background refetch.
  // gcTime: unused cache is garbage-collected after 5 min.
  // No persister configured — PHI boundary: nothing written to localStorage.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:          60_000,
            gcTime:        5 * 60_000,
            retry:              1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
