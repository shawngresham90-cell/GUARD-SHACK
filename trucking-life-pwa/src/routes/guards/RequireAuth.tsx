// src/routes/guards/RequireAuth.tsx
//
// Driver auth gate (architecture.md:909). Wrap any route that requires a
// signed-in user. Unauthenticated visitors are redirected to /auth/login.
//
// While the session is still resolving (status === 'loading'), render nothing
// rather than redirecting — redirecting here would bounce an actually-
// authenticated user to login on every hard refresh before getSession()
// resolves (see src/core/store/auth.ts).

import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/core/store/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}
