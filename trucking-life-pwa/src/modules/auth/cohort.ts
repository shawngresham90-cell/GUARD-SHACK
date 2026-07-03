// src/modules/auth/cohort.ts
//
// Cohort attribution — the single, pure mapping from a landing-page UTM source
// to the acquisition cohort stamped on a driver's profile (FR43/FR44,
// architecture.md:375). Kept dependency-free so it is trivially unit-testable
// and reusable by Story 1.12 (Google sign-in) without dragging in the Supabase
// client.
//
// FR44: the cohort is set ONCE, at first profile creation, and never mutated.
// This helper only *derives* the tag; the write-once guarantee lives in the
// AuthCallback upsert (`ignoreDuplicates: true`).
//
// The generated Supabase types model `profiles.cohort_tag` as `string | null`
// (the Postgres CHECK constraint does not surface as a TS enum), so the literal
// union below is hand-authored and is the source of truth for valid tag values.

/** The two acquisition cohorts at v1 (architecture.md:375; migration 0002 CHECK). */
export type CohortTag = 'day1_stan' | 'cold_youtube';

/**
 * Map a UTM source to a cohort tag.
 *
 * `stan_store` traffic is the warm "day-one" funnel (Shawn's Stan store link);
 * everything else — including absent/empty UTM — is treated as cold YouTube
 * traffic. Deliberately total (never throws, no `null` return) so callers never
 * have to handle an "unknown cohort" branch.
 */
export function deriveCohort(utmSource: string | null | undefined): CohortTag {
  return utmSource === 'stan_store' ? 'day1_stan' : 'cold_youtube';
}
