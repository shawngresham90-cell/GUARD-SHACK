// src/modules/auth/AuthCallback.tsx — magic-link landing screen (Story 1.11,
// AC3/AC4/AC5). Eagerly loaded; public (no guard) so the auth roundtrip lands.
//
// This screen REACTS to the session established by supabase-js — it never
// drives the exchange itself. The singleton client uses `detectSessionInUrl:
// true` + `flowType: 'pkce'` (defaults), so it auto-exchanges the magic-link
// tokens from the callback URL and AuthProvider's onAuthStateChange mirrors the
// session into the Zustand store. Therefore:
//   • Read auth state from the store selectors — do NOT add a second
//     onAuthStateChange subscription (AuthProvider owns it).
//   • Do NOT call exchangeCodeForSession (detectSessionInUrl handles it).
//   • The profile upsert runs in a component effect (NOT inside the auth
//     listener) and uses supabase.from(...) — avoiding the documented
//     onAuthStateChange re-entrancy deadlock (architecture.md, Story 1.10).
//
// Once authenticated, we upsert the driver's profile row stamping the cohort
// tag derived from the surviving UTM (FR43/FR44). The upsert is insert-if-absent
// (`ignoreDuplicates: true`) so a returning driver keeps their ORIGINAL cohort —
// it is set once, never re-stamped (FR44). We then route onboarding-aware (FR8):
// `/onboarding` if onboarding is incomplete (`otr_or_local` null), else `/`.

import { useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/core/supabase';
import { useAuthStatus, useAuthUser } from '@/core/store/auth';
import { deriveCohort } from '@/modules/auth/cohort';
import { readPendingUtm, parseUtm, clearPendingUtm } from '@/modules/auth/hooks/useUtmCapture';

/** Where to send the driver after their cohort is committed (AC5 / FR8). */
type Destination = '/onboarding' | '/';

/**
 * Stamp the cohort (write-once) and resolve where the driver goes next.
 *
 * UTM source is read from the surviving `pending_utm` stash, falling back to the
 * callback URL query (the belt-and-suspenders backup appended to
 * `emailRedirectTo`) if localStorage was cleared. The upsert is insert-if-absent
 * so an existing `cohort_tag` is never mutated (FR44).
 */
async function commitCohortAndResolveRoute(userId: string): Promise<Destination> {
  const stashed = readPendingUtm(window.localStorage);
  const fromUrl = parseUtm(window.location.search);
  const cohortTag = deriveCohort(stashed.utm_source ?? fromUrl.utm_source);

  const { error: upsertError } = await supabase.from('profiles').upsert(
    { user_id: userId, cohort_tag: cohortTag },
    {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    },
  );
  if (upsertError) throw upsertError;

  const { data, error: selectError } = await supabase
    .from('profiles')
    .select('otr_or_local')
    .eq('user_id', userId)
    .maybeSingle();
  // `maybeSingle` returns null (not a PGRST116 error) for zero rows, so a valid
  // sign-in is never hard-blocked by a transient read miss — fall through to
  // onboarding. A genuine query error still surfaces the error screen.
  if (selectError) throw selectError;

  clearPendingUtm(window.localStorage);

  // FR8: incomplete onboarding (otr_or_local null, or no row yet) → onboarding,
  // else home.
  return data?.otr_or_local == null ? '/onboarding' : '/';
}

export default function AuthCallback() {
  const status = useAuthStatus();
  const user = useAuthUser();
  const ranRef = useRef(false);

  const {
    mutate,
    isError,
    isSuccess,
    data: destination,
  } = useMutation({
    mutationFn: (userId: string) => commitCohortAndResolveRoute(userId),
  });

  useEffect(() => {
    // Run the upsert exactly once, guarding React StrictMode's double-invoke.
    if (status === 'authenticated' && user && !ranRef.current) {
      ranRef.current = true;
      mutate(user.id);
    }
  }, [status, user, mutate]);

  // Session resolution failed (expired/invalid link) — offer a retry path.
  if (status === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center text-neutral-50">
        <h1 className="text-xl font-semibold">Sign-in link expired</h1>
        <p className="text-sm text-neutral-400">
          That link is no longer valid. Request a fresh one to continue.
        </p>
        <Link to="/auth/login" className="text-sm font-medium text-neutral-100 underline">
          Back to sign in
        </Link>
      </main>
    );
  }

  // Upsert failed after a valid session — surface it rather than hang.
  if (isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center text-neutral-50">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-neutral-400">
          We couldn&apos;t finish signing you in. Please try again.
        </p>
        <Link to="/auth/login" className="text-sm font-medium text-neutral-100 underline">
          Back to sign in
        </Link>
      </main>
    );
  }

  if (isSuccess && destination) {
    return <Navigate to={destination} replace />;
  }

  // status === 'loading', or authenticated with the upsert still in flight.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 p-6 text-center text-neutral-50">
      <h1 className="text-xl font-semibold">Signing you in…</h1>
    </main>
  );
}
