# Story 1.3: Wire admin auth domain (admin_users + is_admin access-token hook)

**Status:** in-progress (prod migrations applied + hook logic verified; **only the auth-hook config enablement remains** — needs org-Owner privileges, see Dev Agent Record)

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-3-admin-auth-domain`
**Generated:** 2026-06-01 (Claude, paired with Huffy)
**Branch:** `story-1.3-admin-auth`

## User story
As Huffy, I want admin authentication structurally separate from driver auth via a JWT `is_admin`
claim, so founder-admin endpoints are unreachable from driver-credentialed tokens (NFR-S4 / FR60).

## Acceptance criteria → implementation map
- `admin.admin_users (email PK, granted_at, granted_by)`, RLS service-role-only → `0003_admin_users.sql`.
- `is_admin` claim stamped when email ∈ `admin_users`, absent otherwise → `0011_auth_hooks.sql`
  (`public.custom_access_token_hook`).
- First admin (`shawngresham90@gmail.com`) seeded → `0011a_seed_first_admin.sql`.
- Driver-credentialed JWT carries no `is_admin` claim → enforced by the hook stripping the claim for
  non-allowlisted users; verified by direct hook invocation (see Verification).

## Auth-hook implementation decision (deviation from epic wording)
The epic says "`claim-admin` **Edge Function** … registered as the auth hook." This story implements the
hook as a **Postgres `custom_access_token_hook` function** instead, because:
1. It runs on **every** token issuance — an in-DB function adds no network hop / cold-start, so it can't
   inject login latency or fail on a transient fetch (architecture: "Hook failure blocks login").
2. It's Supabase's recommended pattern for claim enrichment from a DB lookup.
3. Aligns with architecture's "favor boring technology" principle.

The `is_admin` claim semantics, the service-role-only allowlist, and the "drivers can't acquire it"
guarantee (FR60) are identical to the epic's intent. No `supabase/functions/claim-admin/` is created;
if a future need (e.g. external IdP enrichment) requires the HTTP-hook form, it can be added then.

## Files
- `supabase/migrations/0003_admin_users.sql` (new)
- `supabase/migrations/0011_auth_hooks.sql` (new)
- `supabase/migrations/0011a_seed_first_admin.sql` (new)
- `src/core/types/supabase.ts` (regen pending prod apply — admin_users typing)

## Tasks
- [x] Write `0003_admin_users.sql` (table + service-role RLS).
- [x] Write `0011_auth_hooks.sql` (`custom_access_token_hook` + `supabase_auth_admin` grants).
- [x] Write `0011a_seed_first_admin.sql` (Shawn bootstrap, idempotent).
- [x] Local gates green (SQL-only; no TS impact).
- [x] **Apply `0003`/`0011`/`0011a` to prod** — applied 2026-06-05, authorized by Shawn.
- [x] Regen `src/core/types/supabase.ts` (`--linked`, all 3 schemas; `admin_users` + `custom_access_token_hook` now typed).
- [ ] **Enable** the Custom Access Token Hook (config, not SQL) → `public.custom_access_token_hook`. *Blocked: Management API PATCH returns 403 — the available CLI token (Huffy, org Developer role) lacks the privilege. Requires Shawn (org Owner) — see Dev Agent Record for the exact one-step enablement.*
- [x] Verify hook logic on prod (direct invocation for admin + non-admin email).
- [ ] Commit types + PR + CI green + merge.

## Verification (post-apply, post-enable)
Direct hook invocation against prod (no real login needed to prove the claim logic):
```sql
-- admin email → is_admin present
SELECT public.custom_access_token_hook(
  jsonb_build_object('user_id', (SELECT id FROM auth.users WHERE email='shawngresham90@gmail.com'),
                     'claims', '{}'::jsonb)) -> 'claims' -> 'is_admin';
-- non-admin → is_admin absent
SELECT public.custom_access_token_hook(
  jsonb_build_object('user_id', '00000000-0000-0000-0000-000000000000', 'claims', '{}'::jsonb))
  -> 'claims' ? 'is_admin';   -- expect false
```
Plus: confirm `auth.jwt() ->> 'is_admin'` is absent on a driver token (manual, after a real driver login).

## Dev Agent Record
### Completion Notes List
- 2026-06-01 — Migrations authored; SQL-only local gates green. Prod apply blocked by the auto-mode
  safety classifier (admin privilege grant + auth-hook security change require explicit user intent).
  Awaiting authorization to apply + enable + verify, then types regen + PR + merge.
- 2026-06-05 — Shawn authorized "apply + enable + verify". Applied `0003`, `0011`, `0011a` to prod
  (`jgzcwkorjxhbqzdzxwzt`). Verified on prod via direct hook invocation (no real login needed):
  - admin email (`shawngresham90@gmail.com`, seeded) → `is_admin = "true"` (tested via a synthetic
    `auth.users` row inside a rolled-back tx; 0 real users exist yet);
  - case-insensitive allowlist match confirmed (`ShawnGresham90@Gmail.com` → match);
  - non-admin (random uuid) → `is_admin` absent;
  - **forged** `is_admin` on a non-admin claims object → stripped (defensive `claims - 'is_admin'`).
  Grants confirmed: `EXECUTE` on the hook only to `supabase_auth_admin`/`service_role`/`postgres`;
  revoked from `anon`/`authenticated`/`public` (the hook does **not** appear in the security advisor's
  "function executable by anon/authenticated" lints — only the pre-existing 2.1 `prune_parking_lookups_recent`
  does). Types regenerated for all 3 schemas; local gates green (typecheck/lint/format/test/build).
- **REMAINING (Shawn, ~20s, org-Owner only):** enable the Custom Access Token Hook. The Management API
  PATCH (`hook_custom_access_token_enabled=true`,
  `hook_custom_access_token_uri='pg-functions://postgres/public/custom_access_token_hook'`) returns
  **403** with the available CLI token (Huffy = org Developer). Enable it in the dashboard:
  **Authentication → Hooks → Custom Access Token → enable → Postgres function `public.custom_access_token_hook`**.
  No login depends on it yet (0 users; admin UI is Story 4.2), so merging the code ahead of the flip is safe.
