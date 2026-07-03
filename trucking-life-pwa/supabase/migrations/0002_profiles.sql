-- Migration 0002 — Driver profile table
-- Story 1.2 (Foundation, Auth & Onboarding epic)
--
-- One row per auth.users record. Owned by the user (RLS).
-- Cohort_tag captures acquisition source: 'day1_stan' (Stan Store buyer at
-- install time) vs 'cold_youtube' (everyone else). Persistent for the
-- account lifetime per FR43, FR44.
--
-- ON DELETE CASCADE on the FK to auth.users means account deletion (Story 6.2
-- delete-account Edge Function, using service-role) automatically removes the
-- profile row.

CREATE TABLE public.profiles (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_tag        text CHECK (cohort_tag IN ('day1_stan', 'cold_youtube')),
  otr_or_local      text CHECK (otr_or_local IN ('otr', 'local')),
  default_state     text,
  dark_mode         boolean DEFAULT true NOT NULL,
  analytics_opt_out boolean DEFAULT false NOT NULL,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.profiles IS
  'Driver profile. One row per auth.users record. cohort_tag captures acquisition source (day1_stan = Stan Store buyer at install; cold_youtube = otherwise).';

COMMENT ON COLUMN public.profiles.cohort_tag IS
  'Acquisition cohort. day1_stan = signed up with utm_source=stan_store; cold_youtube = signed up via cold YouTube/social. Set at signup (Story 1.11) and never mutated (FR44).';

COMMENT ON COLUMN public.profiles.dark_mode IS
  'Dark mode preference. Defaults to true at install per FR48.';

COMMENT ON COLUMN public.profiles.analytics_opt_out IS
  'CCPA/CPRA Right to Opt-Out (FR52). When true, the analytics module no-ops.';

-- Partial index for cohort-segmented retention/monetization analytics.
-- Most users have a cohort_tag; the partial-index predicate keeps the index small.
CREATE INDEX idx_profiles_cohort_tag
  ON public.profiles(cohort_tag)
  WHERE cohort_tag IS NOT NULL;

-- Generic updated_at trigger function — reusable for any future table that needs it.
-- search_path = '' satisfies Supabase security advisor (no mutable search_path).
-- Function only uses now() from pg_catalog, which is always searchable regardless of search_path.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security. Default-deny posture: no policy match = 0 rows returned.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Driver can read their own profile row.
-- (select auth.uid()) is wrapped in a subquery per Supabase RLS perf docs —
-- evaluates once and caches, instead of being called per row.
CREATE POLICY select_profiles_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Driver can insert their own profile row (used by Story 1.11 callback upsert).
CREATE POLICY insert_profiles_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Driver can update their own profile row.
CREATE POLICY update_profiles_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Permissions. Note: DELETE is intentionally NOT granted.
-- Account deletion routes through Story 6.2's delete-account Edge Function,
-- which uses service-role and cascades through auth.users ON DELETE CASCADE.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
