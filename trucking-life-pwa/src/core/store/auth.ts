// src/core/store/auth.ts
//
// Zustand auth slice — a synchronous mirror of the Supabase session so guards
// and components can read auth state without awaiting (architecture.md:454, 692).
// One slice, selectors over destructuring (architecture.md:692-694).
//
// `status` starts at 'loading' and only resolves once AuthProvider's first
// getSession() returns — this prevents guards from redirecting an actually-
// authenticated user to /auth/login on the first render tick (the "loading
// flicker" bug). See src/routes/AuthProvider.tsx.
//
// This file is intentionally free of any Supabase *client* import: it is pure
// state, so unit tests (and the guards that read it) never pull in the network
// client or env validation. AuthProvider owns the side effects.

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { readIsAdminClaim } from '@/core/auth/claims';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  status: AuthStatus;
  /** Replace the mirrored session and derive user/isAdmin/status from it. */
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isAdmin: false,
  status: 'loading',
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAdmin: readIsAdminClaim(session?.access_token),
      status: session ? 'authenticated' : 'unauthenticated',
    }),
}));

// Selector hooks — prefer these over reading the whole store.
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useIsAdmin = () => useAuthStore((s) => s.isAdmin);
export const useAuthUser = () => useAuthStore((s) => s.user);
