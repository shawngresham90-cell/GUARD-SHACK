-- Migration 0003 — Admin allowlist (founder-admin auth domain)
-- Story 1.3 (Foundation, Auth & Onboarding epic)
--
-- Structurally separates founder-admin auth from driver auth (NFR-S4 / FR60).
-- Membership in this table is the SOLE source of the `is_admin` JWT claim,
-- which is stamped by the custom access-token hook in 0011_auth_hooks.sql.
--
-- LOAD-BEARING SECURITY CONSTRAINT (NFR-S4 / FR60):
--   - Writes are service-role only (no anon/authenticated policy → default-deny).
--   - A driver-credentialed token therefore can NEVER self-grant admin, and
--     can never acquire the is_admin claim through any driver signup flow.
--   - The admin schema already exists (0001_init_schemas.sql) with USAGE
--     granted to authenticated; RLS on this table is what actually gates access.

CREATE TABLE admin.admin_users (
  email      text PRIMARY KEY,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by text
);

COMMENT ON TABLE admin.admin_users IS
  'Founder-admin allowlist. Membership is the sole source of the is_admin JWT claim (stamped by public.custom_access_token_hook, 0011). Service-role-only writes — drivers cannot self-grant (NFR-S4 / FR60).';

COMMENT ON COLUMN admin.admin_users.email IS
  'Lowercased email. Matched case-insensitively against auth.users.email by the access-token hook.';

COMMENT ON COLUMN admin.admin_users.granted_at IS
  'When admin was granted.';

COMMENT ON COLUMN admin.admin_users.granted_by IS
  'Email/identifier of the granter. NULL/''bootstrap'' for the first-admin seed (0011a).';

-- Enable RLS. Default-deny posture: no matching policy = 0 rows.
ALTER TABLE admin.admin_users ENABLE ROW LEVEL SECURITY;

-- Service-role only. No anon/authenticated policy by design — drivers must
-- never read or write the allowlist. Service-role bypasses RLS for the
-- admin-management UI (Story 4.2) and the seed migration.
CREATE POLICY admin_users_service_role_all
  ON admin.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
