// src/modules/auth/hooks/useUtmCapture.ts
//
// UTM capture + survival across the magic-link roundtrip (AR14 / NFR-I5,
// architecture.md:113, 375, 730).
//
// The magic-link returns the visitor to the SAME origin/browser, so a UTM
// object stashed in localStorage under `pending_utm` survives the round-trip
// and is read back in <AuthCallback> to derive the acquisition cohort. The UTM
// is ALSO appended to `emailRedirectTo` as a belt-and-suspenders backup (AC2),
// read from the URL if localStorage was cleared.
//
// LOAD-BEARING ORDERING (AC2): `pending_utm` MUST be written BEFORE the
// `signInWithOtp` call. The hook exposes a `stashUtm()` function the form calls
// synchronously on submit, before awaiting the OTP request — so even if the OTP
// promise rejects or the tab is closed mid-flight, the cohort attribution is
// already persisted.
//
// Parse/serialize are pure functions with injected `Storage`/search-string
// (mirrors the src/pwa/installPrompt.ts convention) so they unit-test in jsdom
// without touching real `window`/`localStorage`.

import { useCallback } from 'react';
import { siteUrl } from '@/core/siteUrl';

/** localStorage key the captured UTM object is stashed under (read in AuthCallback). */
export const PENDING_UTM_KEY = 'pending_utm';

/** The UTM params we capture. All optional — a visitor may arrive with none. */
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

/**
 * Parse the recognised `utm_*` params out of a URL search string (e.g.
 * `window.location.search`). Unknown params are ignored; absent UTM yields `{}`.
 */
export function parseUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return utm;
}

/**
 * Persist the UTM object to storage under `pending_utm`. Best-effort: a
 * SecurityError/QuotaExceededError (private mode, full quota) must never break
 * the sign-in flow — the redirect-URL backup still carries the UTM.
 */
export function stashPendingUtm(storage: Storage, utm: Utm): void {
  try {
    storage.setItem(PENDING_UTM_KEY, JSON.stringify(utm));
  } catch {
    // Non-fatal: emailRedirectTo carries the UTM as a backup (AC2).
  }
}

/**
 * Read and JSON-parse the stashed UTM. Returns `{}` on absence or any corruption
 * so callers can derive a cohort unconditionally (deriveCohort treats empty as
 * cold_youtube).
 */
export function readPendingUtm(storage: Storage): Utm {
  try {
    const raw = storage.getItem(PENDING_UTM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    // Must be a plain object — `typeof [] === 'object'`, so exclude arrays too.
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Utm) : {};
  } catch {
    return {};
  }
}

/**
 * Build the magic-link `emailRedirectTo` — `siteUrl('/auth/callback')` with the
 * captured `utm_*` appended (AC2 backup survival channel, read in AuthCallback
 * if localStorage was cleared). `siteUrl()` normalises slashes; we go through
 * `URL` so query params are encoded safely.
 */
export function buildEmailRedirectTo(utm: Utm): string {
  const url = new URL(siteUrl('/auth/callback'));
  for (const [key, value] of Object.entries(utm)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Best-effort removal of the stash once the cohort has been committed. */
export function clearPendingUtm(storage: Storage): void {
  try {
    storage.removeItem(PENDING_UTM_KEY);
  } catch {
    // ignore — a stale stash is harmless (re-derives the same cohort).
  }
}

export interface UseUtmCapture {
  /** The UTM captured from the current URL at hook-call time. */
  utm: Utm;
  /**
   * Persist the captured UTM to localStorage. Call this on form submit BEFORE
   * initiating the OTP request (AC2). Returns the stashed UTM for convenience.
   */
  stashUtm: () => Utm;
}

/**
 * Capture `utm_*` from the current URL and expose a `stashUtm()` the form calls
 * before `signInWithOtp`. SSR/test-safe: falls back to empty search/no-op
 * storage when `window` is absent.
 */
export function useUtmCapture(): UseUtmCapture {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const utm = parseUtm(search);

  const stashUtm = useCallback(() => {
    if (typeof window !== 'undefined') stashPendingUtm(window.localStorage, utm);
    return utm;
    // `utm` is derived from the URL which is stable for the lifetime of the
    // screen; re-deriving on every render would churn the callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return { utm, stashUtm };
}
