-- Migration 0010 — Rate limit counters (sliding-window, bucket-keyed)
-- Story 2.1 (Parking Discovery epic)
--
-- Generic sliding-window rate-limit storage. Bucket strings namespace
-- different rate-limited endpoints:
--   - 'tpc'         → TPC affiliate API (Story 2.2)
--   - 'beacon-stan' → Stan trigger beacon endpoint (Story 5.x)
--   - future buckets added by future stories without schema change.
--
-- Access pattern: only the Edge Functions that need rate-limiting touch
-- this table, using the service-role key. No client access ever.

CREATE TABLE admin.rate_limits (
  bucket       text NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket, window_start)
);

COMMENT ON TABLE admin.rate_limits IS
  'Sliding-window rate-limit counters. bucket namespaces endpoints (e.g., ''tpc'', ''beacon-stan''). Used by Edge Functions; service-role-only access. Cleanup of stale rows is the responsibility of the writing Edge Function (delete rows where window_start < threshold during normal writes — keeps the table small without a separate cron job).';

COMMENT ON COLUMN admin.rate_limits.bucket IS
  'Endpoint namespace. Story 2.2 uses ''tpc''. Future stories add their own buckets.';

COMMENT ON COLUMN admin.rate_limits.window_start IS
  'Truncated timestamp for the sliding window (e.g., date_trunc(''minute'', now()) for per-minute buckets). Granularity is owned by the writing Edge Function.';

-- Enable RLS. Default-deny posture.
ALTER TABLE admin.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service-role only. No client should ever query this table.
CREATE POLICY rate_limits_service_role_all
  ON admin.rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No GRANT to authenticated or anon. The admin schema's USAGE was granted
-- to authenticated in 0001_init_schemas.sql, but without an authenticated
-- policy on this table, authenticated callers see zero rows by default-deny.
-- Service-role bypasses RLS regardless.
