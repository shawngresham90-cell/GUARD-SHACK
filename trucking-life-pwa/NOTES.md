# Build Progress — Huffy's Update

**As of 2026-06-01**

## Done
- BMAD planning complete (brief, PRD, architecture, epics, readiness)
- GitHub + Git + credentials configured (PAT now carries `workflow` scope)
- Node 20 LTS via nvm
- Story 1.1 — Vite + React + TS + Tailwind v4 + vite-plugin-pwa scaffold; locked stack installed; ESLint/Prettier/Vitest/Playwright wired; smoke E2E spec; Netlify deploy live at trucking-life-pwa.netlify.app
- Story 1.5 — 8-job GitHub Actions CI pipeline (lint/typecheck/unit/e2e/bundle-size/lighthouse/ftc-disclosure/rods-grid); branch protection on `main` requires all 8 checks; stub scanners at `scripts/ci/` ready for AST/snapshot tightening in 1.7 + 3.x
- Story 1.6 — Canonical disclaimer source-of-truth at `src/core/disclaimers.ts` (5 verbatim PRD constants); `<Disclaimer kind="...">` render primitive at `src/components/Disclaimer.tsx`; custom `no-restricted-syntax` ESLint rule + out-of-band `check:disclaimer-source` CI scanner enforce the rule structurally; 10 unit tests cover string-equality and per-kind rendering
- Story 1.2 — Supabase production project (TruckLifePWA, ref `jgzcwkorjxhbqzdzxwzt`, in Shawn's org with Huffy as Developer) live; migrations `0001_init_schemas.sql` (admin + analytics_agg schemas) and `0002_profiles.sql` (profiles table + 3 RLS policies + `set_updated_at()` trigger) applied to prod and verified via SQL
- Story 1.7 — `<AffiliateCTA>` composition contract at `src/components/AffiliateCTA.tsx` (FR15/FR34/FR35 enforced sibling rendering of `<Disclaimer kind="ftc">`); `AffiliateSlot` minimal v1 type at `src/core/types/affiliate.ts`; FTC CI gate tightened from regex stub to TypeScript Compiler API AST walk (`<a>`/`<button>` with affiliate-URL `href` outside an `<AffiliateCTA>` ancestor fails the build); `tests/fixtures/affiliate-cta/{known-good,known-bad}.tsx` test bench; scanner exports `scanFile()` for Vitest; 8 new tests pass (5 AffiliateCTA + 3 scanner); `vite.config.ts` test.include extended to `scripts/**/*.test.{ts,tsx}` so tool-level tests are discoverable
- Story 1.8 — `<HosShell>` composition contract + RODS-grid scanner tightened from regex stub to a real AST/CSS-class scan over `[data-hos-screen]` subtrees; stub `RequireHosAck` route guard (merged PR #4)
- Story 2.1 — Parking schema migrations applied to prod (`jgzcwkorjxhbqzdzxwzt`) and verified via SQL: `0006_parking_lookups_recent.sql` (per-device-hash corridor cache, **NO user_id — FR65**, service-role-only RLS, pg_cron 24h prune hourly at :17), `0007_osm_truck_stops.sql` (OSM-native shape, anon+authenticated read; TPC + curated picks deferred), `0010_rate_limits.sql` (`admin` schema, sliding-window counters, service-role-only). RLS on all three. Types regenerated at `src/core/types/supabase.ts` (`public`+`admin`+`analytics_agg`)

- Story 1.3 — Admin auth domain **DONE** (PR #6, `25c38fc`). Migrations `0003_admin_users` (allowlist, service-role-only RLS), `0011_auth_hooks` (`public.custom_access_token_hook` stamping `is_admin`; EXECUTE locked to `supabase_auth_admin`/`service_role`/`postgres`), `0011a_seed_first_admin` (Shawn) applied to prod (`jgzcwkorjxhbqzdzxwzt`) on 2026-06-05 and verified by direct hook invocation (admin→`is_admin "true"`, case-insensitive match, non-admin→absent, forged claim→stripped). Types regenerated. **Custom Access Token Hook enabled in auth config (2026-06-05, confirmed via Management API GET: `hook_custom_access_token_enabled=true`, uri `pg-functions://postgres/public/custom_access_token_hook`).** Claim now mints on every login. Fully complete.

## In Progress
- **Story 1.9** — PWA infrastructure **in review** (dev-story complete). injectManifest custom SW at `src/pwa/sw.ts` with the NFR-S7 `activate` cache-partition assertion (`src/pwa/partition.ts`, reused by Story 2.10); three cache namespaces (`parking-results-v1` / `affiliate-config-v1` / `static-assets-v1`); hand-authored `public/manifest.json` + generated icon set (192/512/maskable/apple-touch); iOS A2HS + Android `beforeinstallprompt` primitives (`src/pwa/installPrompt.ts`); SW registered via `useRegisterSW`. 23 new tests; all 8 CI gates green locally. **AC7 (Lighthouse-installable) pending the Netlify preview deploy** — verify on PR.

## Up Next
- **Story 2.2** — `parking-search` Edge Function. **TPC integration DROPPED** (deferred post-MVP per Shawn's directive); the 2.2 spec needs a rewrite before it's ready-for-dev. Consumes `parking_lookups_recent` (device-hash throttle) + `admin.rate_limits`.
- **Story 2.4** — OSM lookup + ranking; adds the geo index on `osm_truck_stops` (deferred from 2.1 until query patterns are concrete). **Story 2.5** — `osm-refresh` weekly cron (writes `osm_truck_stops` via service-role). **Story 2.3** — state DOT data.
- **Story 1.3** — Admin auth domain (`admin.admin_users` table + `claim-admin` Edge Function + `is_admin` JWT claim wiring). Unblocked by Story 1.2 (admin schema exists). Will seed `shawngresham90@gmail.com` as the first admin.
- **Story 1.4** — Netlify env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PLAUSIBLE_DOMAIN`) per environment, custom domain `app.truckinglifewithshawn.com`, preview deploys per PR. The base Netlify auto-deploy is live from Story 1.1; this story formalizes the full deploy contract.
- Stories 1.10 → 1.14 — provider tree + routing + guards, magic-link auth + UTM survival, Google sign-in, two-question onboarding, Settings shell. All independent of Shawn. (1.9 PWA infra now in review.)

## Pending Shawn
- ~~TPC API contract conversation~~ — **no longer a blocker** (TPC deferred post-MVP per Shawn's 2026-05-25 directive).
- **Audience device-mix survey** — 5-min YouTube/TikTok/FB story.

No blockers on Huffy's side. Pace is holding.
