-- Migration 0001 — Init schemas
-- Story 1.2 (Foundation, Auth & Onboarding epic)
--
-- Creates the two non-default schemas the architecture requires.
-- The `public` schema already exists by default.
--
-- After this migration:
--   - public:        driver-facing tables (RLS-protected)
--   - admin:         founder admin tables (RLS gated by is_admin JWT claim)
--   - analytics_agg: aggregate, non-user-keyed metrics

CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS analytics_agg;

-- Schema-level USAGE grants. Per-table RLS policies provide the actual access control.
-- Anon is NOT granted USAGE on admin/analytics_agg; only authenticated callers can
-- reference these schemas in queries, and individual table RLS still gates rows.
GRANT USAGE ON SCHEMA admin TO authenticated;
GRANT USAGE ON SCHEMA analytics_agg TO authenticated;

-- Restrict default privileges on future objects in these schemas. Each migration
-- that creates a table will explicitly GRANT only what's needed.
ALTER DEFAULT PRIVILEGES IN SCHEMA admin REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics_agg REVOKE ALL ON TABLES FROM anon;
