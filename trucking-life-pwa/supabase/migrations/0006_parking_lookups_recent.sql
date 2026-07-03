-- Migration 0006 — Parking lookups recent (per-device-hash corridor cache)
-- Story 2.1 (Parking Discovery epic)
--
-- Caches the last lookup time per (device_hash, corridor_key) tuple so the
-- parking-search Edge Function can throttle redundant downstream API calls
-- without persisting any user-keyed location history.
--
-- LOAD-BEARING PRIVACY CONSTRAINT (FR65):
--   - NO user_id column.
--   - NO email, no session_id, no any-other-identifier column.
--   - device_hash is an opaque, client-supplied, rotating string. The server
--     never correlates it back to an account. Rows expire after 24h via
--     pg_cron (see below).
--
-- Access pattern:
--   - Client never queries this table directly.
--   - parking-search Edge Function (Story 2.2) holds the service-role key,
--     reads/writes this table, and enforces device_hash matching in its WHERE
--     clauses. RLS is service-role-only; device_hash filtering is NOT an RLS
--     concern (RLS would need a JWT custom claim for device_hash, which isn't
--     part of the v1 auth model).

CREATE TABLE public.parking_lookups_recent (
  device_hash    text NOT NULL,
  corridor_key   text NOT NULL,
  last_lookup_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_hash, corridor_key)
);

COMMENT ON TABLE public.parking_lookups_recent IS
  'Per-device-hash corridor lookup cache. NEVER user-keyed (FR65). 24h auto-prune via pg_cron. device_hash matching is enforced by the parking-search Edge Function (Story 2.2), not by RLS.';

COMMENT ON COLUMN public.parking_lookups_recent.device_hash IS
  'Opaque, client-supplied, rotating string. NOT linked to any authenticated user. Privacy-by-design (FR65).';

COMMENT ON COLUMN public.parking_lookups_recent.corridor_key IS
  'Compact representation of the requested lookup corridor (e.g., rounded lat/lng/heading bucket). Format owned by the parking-search Edge Function.';

-- Enable RLS. Default-deny posture: no policy match = 0 rows returned.
ALTER TABLE public.parking_lookups_recent ENABLE ROW LEVEL SECURITY;

-- Service-role only. The Edge Function (parking-search, Story 2.2) holds the
-- service-role key; the client never reads/writes this table directly.
-- device_hash matching is enforced INSIDE the Edge Function's WHERE clauses,
-- not via RLS — see header comment for the rationale.
CREATE POLICY parking_lookups_recent_service_role_all
  ON public.parking_lookups_recent
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No GRANT to authenticated or anon — service-role bypasses RLS and grants
-- both, so explicit grants would only widen unintended access.

-- =========================================================================
-- pg_cron 24h auto-prune
-- =========================================================================
-- Why pg_cron and not a Postgres trigger or a Supabase scheduled Edge
-- Function? pg_cron is the native, lowest-overhead, infra-managed answer
-- for periodic DELETEs. Triggers fire per-row on writes (wrong shape);
-- scheduled Edge Functions add network hops and cold-start risk.
--
-- pg_cron is available on all Supabase tiers. The `extensions` schema is
-- pre-created in every Supabase project for exactly this kind of registration.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Prune function: deletes rows older than 24h.
-- SECURITY DEFINER runs the function as its owner (postgres), which bypasses
-- RLS — necessary because the service_role-only policy above would otherwise
-- prevent the scheduled job from seeing any rows.
-- SET search_path = '' satisfies the Supabase security advisor and prevents
-- search-path attacks; the function body uses fully-qualified
-- public.parking_lookups_recent so empty search_path is safe.
CREATE OR REPLACE FUNCTION public.prune_parking_lookups_recent()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.parking_lookups_recent
  WHERE last_lookup_at < (now() - interval '24 hours');
$$;

COMMENT ON FUNCTION public.prune_parking_lookups_recent() IS
  '24h FR65 retention enforcement. Scheduled by pg_cron to run hourly (minute :17). SECURITY DEFINER + service-role-only RLS means only this scheduled job (and the parking-search Edge Function) can delete.';

-- Schedule: every hour at minute :17 (off-the-hour to avoid contention with
-- top-of-hour jobs from other extensions / monitoring).
SELECT cron.schedule(
  'prune-parking-lookups-recent',
  '17 * * * *',
  $$SELECT public.prune_parking_lookups_recent();$$
);
