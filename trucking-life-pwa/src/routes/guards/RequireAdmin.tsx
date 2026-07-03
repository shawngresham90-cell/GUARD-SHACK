// src/routes/guards/RequireAdmin.tsx
//
// Founder-admin gate (architecture.md:910, FR60). Semantically equivalent to
// the data-layer rule `auth.jwt() ->> 'is_admin' = 'true'`: the `is_admin`
// claim is read from the current session's access token (src/core/auth/claims.ts).
//
// Order is load-bearing for AC6:
//   1. still loading            → render nothing (no premature redirect)
//   2. not signed in            → /auth/login  (same as RequireAuth)
//   3. signed in but not admin  → /            (driver home)
//   4. admin                    → render children
//
// This is defense-in-depth UX only. The authoritative boundary is Postgres RLS
// + the server-stamped JWT claim — a forged client claim grants no real access.
// NOTE: the prod auth hook that stamps `is_admin` is implemented but not yet
// enabled (Story 1.3), so this currently redirects everyone away from /admin.

import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/core/store/auth';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
