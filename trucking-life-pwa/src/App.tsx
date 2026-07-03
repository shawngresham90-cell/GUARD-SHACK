// src/App.tsx
//
// Application shell — the provider tree every feature epic plugs into
// (architecture.md:898-900). Provider order is load-bearing:
//
//   QueryClientProvider   — outermost; any provider/route may issue queries
//     └ BrowserRouter     — router context (react-router v7 library mode)
//        └ AuthProvider   — mirrors Supabase session into the Zustand store;
//                           lives inside the router so it/guards can navigate
//           └ Suspense    — innermost; only wraps the lazy route tree. Its
//                           fallback must NOT unmount the providers above.
//
// TanStack Query defaults per architecture.md:697-700 (staleTime 5m, gcTime 1h).
// The QueryClient is a module-scope singleton so it survives re-renders.

import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from '@/routes/AuthProvider';
import { AppRoutes } from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 60 * 60_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
