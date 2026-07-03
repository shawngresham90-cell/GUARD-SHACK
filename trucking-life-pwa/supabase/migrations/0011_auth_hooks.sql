-- Migration 0011 — Auth hooks (custom access-token hook → is_admin claim)
-- Story 1.3 (Foundation, Auth & Onboarding epic)
--
-- Implements the `is_admin` JWT claim wiring (NFR-S4 / FR60). On every token
-- issuance Supabase Auth calls this Postgres "Custom Access Token Hook"; if the
-- signing-in user's email is in admin.admin_users (0003), the hook stamps
-- claim `is_admin = 'true'`. Otherwise the claim is explicitly stripped, so a
-- driver-credentialed token NEVER carries it.
--
-- WHY A POSTGRES-FUNCTION HOOK (not an HTTP/Edge-Function hook):
--   The hook runs on EVERY login. A Postgres function runs in-DB with no
--   network hop and no cold start, so it cannot add login latency or fail
--   open/closed on a transient fetch. Architecture's "Hook failure blocks
--   login" risk is minimized by keeping this in-process. This is Supabase's
--   recommended pattern for claim enrichment from a DB lookup. (Deviation from
--   the epic's "claim-admin Edge Function" wording — see the Story 1.3 spec
--   §"Auth-hook implementation decision" for rationale.)
--
-- ENABLEMENT (not SQL — done once per project after this migration applies):
--   Dashboard → Authentication → Hooks → "Custom Access Token" →
--     enable, point at `public.custom_access_token_hook`.
--   Or Management API PATCH /v1/projects/{ref}/config/auth:
--     hook_custom_access_token_enabled = true
--     hook_custom_access_token_uri = 'pg-functions://postgres/public/custom_access_token_hook'

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  claims     jsonb;
  user_email text;
  admin_flag boolean;
BEGIN
  -- Resolve the signing-in user's email.
  SELECT u.email INTO user_email
  FROM auth.users u
  WHERE u.id = (event->>'user_id')::uuid;

  -- Allowlist membership is the sole source of admin authority.
  SELECT EXISTS (
    SELECT 1
    FROM admin.admin_users a
    WHERE lower(a.email) = lower(user_email)
  ) INTO admin_flag;

  claims := event->'claims';

  IF admin_flag THEN
    claims := jsonb_set(claims, '{is_admin}', '"true"');
  ELSE
    -- Defensive: ensure the claim is absent for non-admins (and never carried
    -- over from a stale/forged claims object).
    claims := claims - 'is_admin';
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS
  'Supabase Custom Access Token Hook. Stamps is_admin=''true'' iff the user''s email is in admin.admin_users (0003); strips it otherwise. Sole mechanism for the is_admin claim (NFR-S4 / FR60).';

-- Supabase Auth runs hooks as the `supabase_auth_admin` role. Grant it exactly
-- what the hook needs and revoke from everyone else (drivers must not be able
-- to call the hook directly).
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

GRANT USAGE ON SCHEMA admin TO supabase_auth_admin;
GRANT SELECT ON admin.admin_users TO supabase_auth_admin;
