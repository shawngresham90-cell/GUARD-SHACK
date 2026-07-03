-- Migration 0011a — Seed first admin (bootstrap). One-time.
-- Story 1.3 (Foundation, Auth & Onboarding epic)
--
-- Adds the founder (Shawn) to the admin allowlist so the first admin exists
-- before any admin UI ships (Story 4.2). Idempotent — safe to re-run.
-- Service-role / migration context only (admin.admin_users is service-role RLS).

INSERT INTO admin.admin_users (email, granted_by)
VALUES ('shawngresham90@gmail.com', 'bootstrap')
ON CONFLICT (email) DO NOTHING;
