// src/routes/AuthProvider.tsx
//
// Bridges the Supabase auth session into the Zustand auth store
// (architecture.md:454, 899). Mounted inside <BrowserRouter> (so it/guards may
// use router hooks) and inside <QueryClientProvider>.
//
// On mount: hydrate from the persisted session (getSession), then subscribe to
// future auth changes (onAuthStateChange) and keep the store in sync. The
// listener only forwards the `session` object it is handed — it does NOT call
// any other supabase.auth.* method, which would risk the documented
// onAuthStateChange re-entrancy deadlock. The `is_admin` claim is derived
// purely from the session's access token (see src/core/auth/claims.ts).

import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/core/supabase';
import { useAuthStore } from '@/core/store/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let active = true;
    // Once an onAuthStateChange event has populated the store, the initial
    // getSession() result is stale and must not clobber it (the two are
    // independent async writers with no ordering guarantee — e.g. a fast
    // SIGNED_IN could otherwise be overwritten by a late getSession()->null).
    let hydratedByEvent = false;

    // Initial hydration — flips status off 'loading' once resolved.
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && !hydratedByEvent) setSession(data.session);
      })
      .catch(() => {
        // A failed session fetch must still resolve 'loading' →
        // 'unauthenticated'; otherwise status sticks on 'loading' forever and
        // every guarded route renders null (blank screen).
        if (active && !hydratedByEvent) setSession(null);
      });

    // Keep the mirror in sync with sign-in / sign-out / token-refresh events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hydratedByEvent = true;
      setSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setSession]);

  return <>{children}</>;
}
