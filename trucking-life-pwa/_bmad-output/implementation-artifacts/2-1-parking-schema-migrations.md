# Story 2.1: Parking-related migrations (lookups recent + OSM stops + rate limits)

**Status:** done

**Epic:** 2 (Parking Discovery)
**Story Key:** `2-1-parking-schema-migrations`
**Generated:** 2026-05-25
**Author of dev-spec:** Claude (Opus 4.7, 1M context) — paired-planning with Huffy
**Sequencing note:** First migration story since Story 1.2 (Epic 1's Supabase foundation). Numbering follows epics.md:597 verbatim — `0006`, `0007`, `0010`. Reserved slots (per architecture.md:862-868 / epics.md): `0003_admin_users` (Story 1.3 admin auth), `0004_affiliate_slots` + `0005_stan_trigger_config` (affiliate/Stan-trigger story), `0008_email_export_queue`, `0009_affiliate_events_agg`. This story is the blocker for Stories 2.2 (parking-search Edge Function — TPC integration), 2.4 (OSM lookup + ranking), and 2.5 (osm-refresh cron). It ships migrations only — no Edge Functions, no UI, no seed data.

**Scope clarifications (locked 2026-05-25 by Huffy on Shawn's directive):**
- **TPC deferred post-MVP.** No `source / affiliate_url / affiliate_partner / bookable` forward-compat columns on `osm_truck_stops`. When TPC's story is eventually written, a 30-second migration adds them then. `osm_truck_stops` ships strictly OSM-native per architecture.md:334.
- **Curated picks deferred.** No `curated_truck_stops` table in this story. Curated workflow needs product definition first (source of picks, admin UI, ingest path). Stopgap for Shawn adding curated rows before that story exists: insert into `public.osm_truck_stops` with a prefixed `osm_id` like `'shawn_pick_001'`. Zero schema cost; cleanup story can split later if needed.
- **`pg_cron` is explicit DDL, not hand-wave.** The actual `CREATE EXTENSION IF NOT EXISTS pg_cron`, prune function definition, and `cron.schedule(...)` call all live in the same migration file as `parking_lookups_recent` (`0006`).

---

## Story

As **Huffy (the developer)**,
I want **the three Postgres tables `public.parking_lookups_recent`, `public.osm_truck_stops`, and `admin.rate_limits` defined with appropriate RLS policies and a `pg_cron` 24h prune job on `parking_lookups_recent`, plus the regenerated `src/core/types/supabase.ts` reflecting the new tables**,
So that **Stories 2.2 (parking-search Edge Function), 2.3 (state DOT integration), 2.4 (OSM lookup + ranking), and 2.5 (osm-refresh weekly cron) have schema in place to read from and write to, with FR65 (no user-keyed location history) structurally enforced via the absence of any user-identifying column on `parking_lookups_recent`**.

---

## Preconditions

1. ✅ Story 1.1 done — Vite scaffold, `src/core/types/` directory exists.
2. ✅ Story 1.2 done — Supabase CLI installed; production project `jgzcwkorjxhbqzdzxwzt` linked; `admin` and `analytics_agg` schemas created by `0001_init_schemas.sql`; `set_updated_at()` reusable trigger function shipped in `0002_profiles.sql`; conventions established (header format, `(SELECT auth.uid())` subquery wrap, `TO authenticated` clause, `SET search_path = ''` on functions, RLS-enable + per-policy DDL, COMMENT ON for docs, explicit GRANTs).
3. ✅ Story 1.5 done — 8-job CI pipeline; `typecheck` job will catch any breakage from the regenerated `src/core/types/supabase.ts`.
4. ✅ Story 1.6 done — disclaimer source-of-truth (not directly relevant; preserves clean baseline).
5. ✅ Story 1.7 done — `<AffiliateCTA>` + FTC AST scan (not directly relevant; preserves clean baseline).
6. ✅ Story 1.8 done — `<HosShell>` + RODS-grid AST scan (not directly relevant; preserves clean baseline). All 8 sanity gates green on `main` at commit `6545575`.
7. ✅ Working tree on branch `story-2.1-parking-schema` off `main`. (Persistent `_bmad/_config/*` timestamp churn carries across branches; never staged.)
8. ✅ Docker available locally for `supabase start` (local Postgres for migration testing).

**Hard rules in force throughout this story:**
- `parking_lookups_recent` has **NO** `user_id` column and **NO** field that ties a lookup to an authenticated user (FR65). Violating this is a privacy regression — the whole point of the rotating device_hash design is that lookups cannot be re-keyed back to an account.
- **Do NOT re-run Story 1.2 migrations.** `0001_init_schemas.sql` and `0002_profiles.sql` are already applied to production (`jgzcwkorjxhbqzdzxwzt`). This story adds new migration files; existing ones are not touched.
- **Do NOT apply migrations to production.** Huffy reviews the SQL, confirms, and applies via `supabase db push --linked` manually. No `db push` from within the automation in this story.
- **Do NOT paste tokens, credentials, or service-role keys anywhere** — into commits, into `_bmad-output/`, into PR bodies, into commit messages. Production project ref `jgzcwkorjxhbqzdzxwzt` is public (it's in NOTES.md and git history) and OK to reference; the anon key is fine too if needed; the service-role key never appears.

---

## Acceptance Criteria

The epic's AC at epics.md:594–602 decomposes into AC1–AC10 below.

**AC1 — `0006_parking_lookups_recent.sql` ships the table per the architecture contract**

**Given** Story 1.2 migrations are applied
**When** `supabase/migrations/0006_parking_lookups_recent.sql` is written per *Dev Notes → `0006_parking_lookups_recent.sql` contract*
**Then** `public.parking_lookups_recent` exists with columns:
- `device_hash text NOT NULL`
- `corridor_key text NOT NULL`
- `last_lookup_at timestamptz NOT NULL DEFAULT now()`
- `PRIMARY KEY (device_hash, corridor_key)`

**And** the table contains **NO** `user_id` column and **NO** field that ties a lookup to an authenticated user (FR65 — load-bearing)
**And** RLS is enabled on the table
**And** the table is documented via `COMMENT ON TABLE` explaining the FR65 design constraint

**AC2 — `0006` RLS policy: service-role-only access**

**Given** AC1 is in place
**When** the RLS policy on `parking_lookups_recent` is written
**Then** the only policy on the table grants `ALL` operations `TO service_role` with `USING (true)` and `WITH CHECK (true)`
**And** no policy grants any access to `anon` or `authenticated` roles
**And** the policy header comment explicitly states that device_hash matching is enforced **inside the `parking-search` Edge Function** (Story 2.2), not by RLS — the client never queries this table directly; only the Edge Function (holding the service-role key) does

(Note: epics.md:598 wording is "RLS policy allowing access only by matching device hash". The architectural access pattern — client → Edge Function (service role) → Postgres — makes device_hash a *Edge-Function-side* filter, not a JWT-claim-side RLS condition. This interpretation is locked for v1; revisit only if a direct client-to-table read pattern is ever proposed for `parking_lookups_recent`.)

**AC3 — `0006` includes the `pg_cron` 24h prune job as explicit DDL**

**Given** AC1 + AC2 are in place
**When** the same `0006_parking_lookups_recent.sql` migration file is extended with pg_cron DDL
**Then** the file includes `CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;` (Supabase convention — `extensions` schema is pre-created in every Supabase project)
**And** a `public.prune_parking_lookups_recent()` function is defined as `SECURITY DEFINER` with `SET search_path = ''` (passes the Supabase security advisor) and body `DELETE FROM public.parking_lookups_recent WHERE last_lookup_at < (now() - interval '24 hours');`
**And** `cron.schedule('prune-parking-lookups-recent', '17 * * * *', $$SELECT public.prune_parking_lookups_recent();$$)` is called (hourly, minute :17 — off-the-hour to avoid contention)
**And** the function and schedule are documented via `COMMENT ON FUNCTION` explaining the 24h FR65 retention window

**AC4 — `0007_osm_truck_stops.sql` ships the table per the architecture contract**

**Given** Story 1.2 migrations are applied
**When** `supabase/migrations/0007_osm_truck_stops.sql` is written per *Dev Notes → `0007_osm_truck_stops.sql` contract*
**Then** `public.osm_truck_stops` exists with columns:
- `osm_id text PRIMARY KEY`
- `lat numeric NOT NULL`
- `lng numeric NOT NULL`
- `name text` (nullable — some OSM POIs have no `name` tag)
- `amenity text NOT NULL` (`'truck_stop'` or `'parking'`)
- `last_refreshed_at timestamptz NOT NULL DEFAULT now()`
- `raw_tags jsonb` (full Overpass tag bag for future enrichment)

**And** RLS is enabled
**And** the table is documented via `COMMENT ON TABLE` (purpose, refresh cadence, anon-read posture)
**And** the table ships strictly OSM-native — no `source / affiliate_url / affiliate_partner / bookable` columns (TPC deferred post-MVP; future migration adds them when needed)

**AC5 — `0007` RLS policy: anon + authenticated read; service-role write**

**Given** AC4 is in place
**When** the RLS policy on `osm_truck_stops` is written
**Then** a `SELECT` policy `TO anon, authenticated USING (true)` allows public reads
**And** no `INSERT / UPDATE / DELETE` policies are defined — writes go through the `osm-refresh` Edge Function (Story 2.5) using the service-role key, which bypasses RLS by design
**And** `GRANT SELECT ON public.osm_truck_stops TO anon, authenticated;` is issued explicitly (Supabase RLS-enable + grant-explicit posture)

**AC6 — `0010_rate_limits.sql` ships the table in the `admin` schema**

**Given** Story 1.2 migration `0001_init_schemas.sql` created the `admin` schema
**When** `supabase/migrations/0010_rate_limits.sql` is written per *Dev Notes → `0010_rate_limits.sql` contract*
**Then** `admin.rate_limits` exists with columns:
- `bucket text NOT NULL` (e.g., `'tpc'`, `'beacon-stan'` — future story buckets)
- `window_start timestamptz NOT NULL`
- `count integer NOT NULL DEFAULT 1`
- `PRIMARY KEY (bucket, window_start)`

**And** RLS is enabled
**And** the only policy is `ALL TO service_role USING (true) WITH CHECK (true)`
**And** the table is documented via `COMMENT ON TABLE` (sliding-window counter, bucket-keyed, used by Story 2.2 TPC + future beacon endpoints)

**AC7 — Local migration test passes via `supabase db reset`**

**Given** AC1–AC6 are in place
**When** `supabase start` is run (local Docker Postgres) and `supabase db reset` is invoked
**Then** all four migrations (`0001`, `0002`, `0006`, `0007`, `0010`) apply cleanly with no errors
**And** all three new tables exist in local Postgres with the expected columns, types, and RLS state
**And** `cron.schedule()` registers the prune job in `cron.job` (verifiable via `SELECT jobname FROM cron.job;` against the local DB)
**And** the migration is idempotent in the sense that re-running `supabase db reset` produces the same end state (this is `db reset`'s contract; the migrations themselves are not idempotent against a partially-applied state, which is correct — Supabase tracks applied migrations via `supabase_migrations.schema_migrations`)

(Note: `pg_cron` is available in Supabase-hosted Postgres. The **local** Supabase container ships `pg_cron` too as of CLI 2.x. If `CREATE EXTENSION pg_cron` fails locally, fall back to verifying the prune function alone and document this in the Dev Agent Record; production application will still work.)

**AC8 — `src/core/types/supabase.ts` regenerated from local DB**

**Given** AC7 passes
**When** `supabase gen types typescript --local > src/core/types/supabase.ts` is run (after `supabase start`)
**Then** the generated file includes type definitions for the three new tables (`parking_lookups_recent`, `osm_truck_stops`, `rate_limits` under the `admin` schema namespace) in addition to the existing `profiles` types
**And** `npm run typecheck` exits 0 with the regenerated types in place
**And** the file is committed (the architecture's "committed to repo" rule at architecture.md:347 — generated types are source-of-truth for the TS app and must be tracked, not regenerated on demand by every developer)

(If `supabase gen types --local` fails because Docker isn't available, fall back to `supabase gen types --linked` against the linked prod project — **but only after Huffy applies the new migrations to prod** per the review gate. Type regen against a stale prod schema would silently omit the new tables. If neither path works, document the blocker and skip AC8; Story 2.2 will hit the missing types and re-raise.)

**AC9 — All 8 CI gates green on the verification PR**

**Given** AC1–AC8 are in place
**When** the verification PR is opened on `story-2.1-parking-schema`
**Then** all 8 required CI checks (lint, typecheck, unit, e2e, bundle-size, lighthouse, ftc-disclosure, rods-grid) report green
**And** the typecheck job validates the regenerated `src/core/types/supabase.ts` against existing consumers (just `Database` type imports today; no live consumers of the new tables yet)
**And** `format:check` passes (Prettier doesn't format `.sql` files by default; only `.ts/.tsx/.css` are gated — but verify locally with `npm run format:check`)
**And** none of the scanners (`check:ftc`, `check:rods`, `check:disclaimer-source`) regress; this story touches zero `.tsx` and zero `.css` files

**AC10 — Production application is gated on Huffy's review**

**Given** AC9 passes
**When** the PR is approved and ready to merge
**Then** Huffy reviews the three SQL files manually before applying to production
**And** production application uses `supabase db push --linked` against project `jgzcwkorjxhbqzdzxwzt`, **executed by Huffy outside this story's automation**
**And** after production application, Huffy verifies via SQL: tables exist, RLS is on, `cron.job` includes `prune-parking-lookups-recent`
**And** the production-verified state is recorded in `NOTES.md` Done section (Story 2.1) and in this spec's Dev Agent Record → Completion Notes
**And** **only after production verification** does the PR merge to main (matching the Story 1.2 pattern at git history `f07452b chore(story-1.2): migrations applied to TruckLifePWA production`)

---

## Tasks / Subtasks

Execute in order. Each task ends with explicit verification. **Tasks 6+ are gated on Huffy's review of the three SQL files — Tasks 1–5 produce the files; pause for review before running migrations against any live database.**

### Task 1 — Pre-flight verification (AC: preconditions)

- [x] **1.1** `git status -sb` shows `## story-2.1-parking-schema` and only the persistent `_bmad/_config/*` modified files + untracked `.claude/`.
- [x] **1.2** `git log --oneline -3` shows `6545575 Merge pull request #4 from MikeHuffy/feat/story-1-8-hos-shell` at HEAD (or further-forward main commits if other PRs land between spec-write and execution).
- [x] **1.3** All 8 npm gates green locally:
  ```bash
  npm run lint && npm run format:check && npm run typecheck && \
    npm run test && npm run build && \
    npm run check:ftc && npm run check:rods && npm run check:disclaimer-source
  ```
- [x] **1.4** `supabase --version` reports 2.98.2 (devDep from Story 1.2).
- [x] **1.5** `docker --version` and `docker ps` work (needed for `supabase start`).
- [x] **1.6** `ls supabase/migrations/` shows only `0001_init_schemas.sql` and `0002_profiles.sql`.

### Task 2 — Write `supabase/migrations/0006_parking_lookups_recent.sql` (AC: AC1, AC2, AC3)

- [x] **2.1** Create the file with the content from *Dev Notes → `0006_parking_lookups_recent.sql` contract*.
- [x] **2.2** Visually verify: no `user_id`, no `email`, no `auth.uid()` reference, no FK to `auth.users`. (FR65 is enforced by absence; if any of those appear, the file is wrong.)
- [x] **2.3** Visually verify: pg_cron block present — `CREATE EXTENSION`, `prune_parking_lookups_recent()` function, `cron.schedule()` call.

### Task 3 — Write `supabase/migrations/0007_osm_truck_stops.sql` (AC: AC4, AC5)

- [x] **3.1** Create the file with the content from *Dev Notes → `0007_osm_truck_stops.sql` contract*.
- [x] **3.2** Visually verify: no `source`, no `affiliate_url`, no `affiliate_partner`, no `bookable` columns (TPC deferred). Strict OSM-native.

### Task 4 — Write `supabase/migrations/0010_rate_limits.sql` (AC: AC6)

- [x] **4.1** Create the file with the content from *Dev Notes → `0010_rate_limits.sql` contract*.
- [x] **4.2** Visually verify: table is in the `admin` schema (not `public`); only policy is service-role.

### Task 5 — Self-review pass before showing Huffy

- [x] **5.1** All three files use the Story 1.2 conventions: uppercased keywords, header block, `COMMENT ON` documentation, `(SELECT auth.uid())` subquery wrap pattern (where applicable), `TO <role>` clause on every policy, `SET search_path = ''` on every function.
- [x] **5.2** `git diff --stat supabase/migrations/` shows exactly 3 new files; nothing in `0001` or `0002` is touched.
- [x] **5.3** **PAUSE.** Surface the three SQL files to Huffy for review. Do not proceed to Task 6 until Huffy explicitly approves the SQL.

### Task 6 — Local migration test via `supabase db reset` (AC: AC7) — **gated on Huffy's Task 5 approval**

- [x] **6.1** `supabase start` — boots local Postgres + Studio + auth in Docker.
- [x] **6.2** `supabase db reset` — drops local DB, replays all 4 migrations (`0001`, `0002`, `0006`, `0007`, `0010`) from scratch. Verify exit 0 and no errors in output.
- [x] **6.3** Verify table presence:
  ```bash
  supabase db query "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'admin') ORDER BY 1, 2;"
  ```
  Expected rows: `admin.rate_limits`, `public.osm_truck_stops`, `public.parking_lookups_recent`, `public.profiles`.
- [x] **6.4** Verify FR65: no `user_id` column on `parking_lookups_recent`:
  ```bash
  supabase db query "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parking_lookups_recent';"
  ```
  Expected rows: `device_hash`, `corridor_key`, `last_lookup_at`. **If any other column appears, STOP — FR65 is violated.**
- [x] **6.5** Verify RLS is enabled on all three new tables:
  ```bash
  supabase db query "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname IN ('public', 'admin') AND tablename IN ('parking_lookups_recent', 'osm_truck_stops', 'rate_limits');"
  ```
  All three rows must show `rowsecurity = true`.
- [x] **6.6** Verify pg_cron job registered:
  ```bash
  supabase db query "SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'prune-parking-lookups-recent';"
  ```
  Expected: one row, schedule `17 * * * *`, command `SELECT public.prune_parking_lookups_recent();`.
  - **Fallback:** if pg_cron isn't available in the local Supabase container (CLI version-dependent), document this in the Dev Agent Record and skip 6.6; verify the function alone via `\df public.prune_parking_lookups_recent`. Production has pg_cron available; CI doesn't run migrations; the local skip is acceptable.

### Task 7 — Regenerate `src/core/types/supabase.ts` (AC: AC8)

- [x] **7.1** With local Supabase running (`supabase start` from Task 6.1):
  ```bash
  supabase gen types typescript --local > src/core/types/supabase.ts
  ```
- [x] **7.2** `git diff src/core/types/supabase.ts` — verify the new tables appear (`parking_lookups_recent`, `osm_truck_stops` under `public`; `rate_limits` under `admin`).
- [x] **7.3** `npm run typecheck` → exit 0.
- [x] **7.4** `npm run lint` → exit 0 (generated file may have its own ESLint disable directives — Story 1.2's regen should have set the precedent; if lint complains, mirror that pattern).
- [x] **7.5** `npm run format:check` → exit 0.

### Task 8 — Local sanity gates pass (AC: AC9 prep)

- [x] **8.1** `npm run test` → exit 0 (no new tests; existing 29 still pass).
- [x] **8.2** `npm run build` → exit 0 (bundle size unchanged; no new client code).
- [x] **8.3** `npm run check:ftc` → exit 0.
- [x] **8.4** `npm run check:rods` → exit 0.
- [x] **8.5** `npm run check:disclaimer-source` → exit 0.
- [x] **8.6** `supabase stop` — tear down the local container when done (or leave running if continuing immediately to Task 9).

### Task 9 — Commit + push + open verification PR (AC: AC9)

- [x] **9.1** Stage explicitly:
  ```bash
  git add supabase/migrations/0006_parking_lookups_recent.sql \
          supabase/migrations/0007_osm_truck_stops.sql \
          supabase/migrations/0010_rate_limits.sql \
          src/core/types/supabase.ts \
          _bmad-output/implementation-artifacts/2-1-parking-schema-migrations.md
  ```
  (Do NOT stage `_bmad/_config/*` or `.claude/`.)
- [x] **9.2** Commit:
  ```
  feat(story-2.1): parking-related migrations + regenerated supabase types

  - public.parking_lookups_recent: (device_hash, corridor_key,
    last_lookup_at) PK on (device_hash, corridor_key). NO user_id —
    FR65 enforced by absence. RLS: service-role only; device_hash
    matching enforced inside parking-search Edge Function (Story 2.2),
    not by RLS. pg_cron 24h prune (hourly :17) via SECURITY DEFINER
    function with SET search_path = ''.
  - public.osm_truck_stops: OSM-native shape per architecture.md:334.
    Anon + authenticated read; service-role write (osm-refresh Edge
    Function, Story 2.5). No TPC forward-compat columns (TPC deferred
    post-MVP); no curated columns (curated picks deferred to later
    story; stopgap = insert with prefixed osm_id like 'shawn_pick_001').
  - admin.rate_limits: (bucket, window_start, count) PK on
    (bucket, window_start). Service-role only. Used by parking-search
    (Story 2.2 TPC bucket) and future beacon endpoints.
  - src/core/types/supabase.ts: regenerated via supabase gen types
    typescript --local.

  Migration numbering follows epics.md:597 — slots 0003-0005 reserved
  for Story 1.3 (admin auth), 0008-0009 reserved for Story 1.10
  (routes/guards).
  ```
- [x] **9.3** `git push -u origin story-2.1-parking-schema`.
- [x] **9.4** Open PR via `gh pr create` targeting `main`. Title: `Story 2.1: Parking-related migrations + regenerated Supabase types`. Body mirrors Story 1.8's PR body structure (Summary / Story doc / Test plan checklist).
- [x] **9.5** Confirm all 8 CI checks report green. Likely flake points:
  - `lighthouse` — historical flake. Migrations don't change runtime perf; expected to pass.
  - All others — should pass unchanged. This story touches zero `.tsx` files.

### Task 10 — Apply migrations to production (AC: AC10) — **GATED ON HUFFY'S MANUAL EXECUTION**

This task is **executed by Huffy, not by automation.** The spec records it for completeness; do not attempt to script `supabase db push` from inside this story's automated workflow.

- [x] **10.1** Huffy reviews the three SQL files one final time on the PR diff.
- [x] **10.2** Huffy executes:
  ```bash
  supabase link --project-ref jgzcwkorjxhbqzdzxwzt  # if not already linked
  supabase db push --linked
  ```
- [x] **10.3** Huffy verifies in Supabase Studio (or via SQL editor against prod):
  - Three new tables exist with correct columns
  - RLS enabled on all three
  - `cron.job` includes `prune-parking-lookups-recent` with schedule `17 * * * *`
  - `parking_lookups_recent` has NO `user_id` column (FR65 sanity)
- [x] **10.4** Huffy reports verification back; spec's Dev Agent Record → Completion Notes is updated with the prod-applied confirmation.

### Task 11 — Merge + sync + status update

- [ ] **11.1** **After Task 10 verification:** merge the PR via GitHub UI (Create a merge commit, matching the Story 1.2/1.6/1.7/1.8 pattern).
- [ ] **11.2** Locally: `git checkout main && git pull --ff-only origin main`.
- [ ] **11.3** Delete branches: `git branch -d story-2.1-parking-schema && git push origin --delete story-2.1-parking-schema`.
- [x] **11.4** Flip this story file's `Status` field to `done`.
- [x] **11.5** Append a Completion Note to *Dev Agent Record → Completion Notes List* below.
- [x] **11.6** List every file created/modified in *Dev Agent Record → File List*.
- [x] **11.7** Update `NOTES.md`:
  - Done section: add Story 2.1 line (mirror the Story 1.2 line's format — table refs, key design points, prod-applied confirmation).
  - Up Next section: Story 2.2 (`parking-search` Edge Function — needs to drop the TPC integration scope per Shawn's directive; Story 2.2 spec will need a rewrite before it's ready-for-dev). Also surface Stories 2.3 (state DOT) and 2.4 (OSM lookup + ranking) as next candidates, plus Story 2.5 (osm-refresh cron).
  - Pending Shawn section: TPC contract conversation is no longer a blocker (deferred post-MVP) — remove or annotate accordingly.

---

## Dev Notes

### Critical reminders (read before writing SQL)

**Reminder 1 — FR65 is load-bearing.** `parking_lookups_recent` must have no column that ties a lookup to an authenticated user. No `user_id`, no `email`, no `device_id` linked to a profile, no `session_id`. The whole privacy model rests on `device_hash` being an opaque, rotating, client-supplied string the server never persists alongside any identity. If you find yourself reaching for `auth.uid()` or `auth.users(id)` while writing this table, **stop**.

**Reminder 2 — `(SELECT auth.uid())` subquery wrap doesn't apply to this story.** Story 1.2's profiles table uses `(SELECT auth.uid()) = user_id` for per-row caching of the auth function — a Supabase RLS perf best practice. None of the three tables in Story 2.1 use `auth.uid()` at all (parking_lookups_recent and rate_limits are service-role only; osm_truck_stops is anon-read). So the pattern doesn't appear here. That's correct — don't force it in.

**Reminder 3 — `SET search_path = ''` is non-negotiable on functions.** Supabase's security advisor flags any function without `SET search_path = ''` (or a specific safe path). The prune function in `0006` MUST have `SET search_path = ''`. It uses fully-qualified `public.parking_lookups_recent` so the empty search_path is fine. Story 1.2's `set_updated_at()` is the precedent.

**Reminder 4 — `SECURITY DEFINER` on the prune function.** pg_cron jobs run as the user who scheduled them. Inside a Supabase migration, that's typically the `postgres` superuser. The `DELETE` statement needs to bypass RLS on `parking_lookups_recent` (which has service-role-only policies). `SECURITY DEFINER` makes the function run as its owner (postgres), which bypasses RLS — equivalent to service-role access. Without `SECURITY DEFINER`, the prune would silently delete 0 rows because the invoker has no policy match.

**Reminder 5 — pg_cron extension lives in the `extensions` schema.** Supabase pre-creates an `extensions` schema for exactly this purpose. The canonical invocation is `CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;`. The cron extension itself still creates the `cron` schema for `cron.job`, `cron.schedule()`, etc. — that's not configurable. The `WITH SCHEMA extensions` clause is about where the extension *object* registers, not where its functions live.

**Reminder 6 — Don't add geo indexes to `osm_truck_stops` in this story.** Story 2.4 (`parking-search` OSM lookup + ranking) is where query patterns become concrete. Premature index choice (btree on lat? composite? GiST? PostGIS?) without a real query is over-engineering. Ship the table without indexes; Story 2.4 adds the right one. The default PK btree on `osm_id` is enough for keyed lookups (which `osm-refresh` upsert in Story 2.5 needs anyway).

**Reminder 7 — `osm_id` PK has implications for the curated-picks stopgap.** Per the decision lock, Shawn may insert curated rows with `osm_id` like `'shawn_pick_001'`. The PK is `text`, not `bigint`, so prefixed string IDs are fine. No CHECK constraint on `osm_id` shape — keep it permissive. When the curated-picks story arrives, it can either keep using this table (with a `source` column added then) or move curated rows to a dedicated table (cleanly migratable via INSERT-SELECT).

**Reminder 8 — `admin.rate_limits` is in the `admin` schema; the GRANT pattern differs.** Per `0001_init_schemas.sql`, the `admin` schema is granted `USAGE TO authenticated` (but with `ALTER DEFAULT PRIVILEGES IN SCHEMA admin REVOKE ALL ON TABLES FROM anon`). New tables in `admin` don't auto-grant to anon. For `rate_limits`, no GRANT to authenticated or anon is needed — only service-role accesses it, and service-role bypasses both RLS and grant restrictions. Skip the explicit GRANT line entirely.

**Reminder 9 — No Edge Function code in this story.** Story 2.1 is migrations only. If you find yourself writing TypeScript in `supabase/functions/`, **stop**. That's Stories 2.2 / 2.3 / 2.4 / 2.5.

**Reminder 10 — No seed data.** epics.md:645 mentions "and `public.osm_truck_stops` has at least seed data" as a precondition for Story 2.4 — but Story 2.5's `osm-refresh` Edge Function is what populates it (via Overpass API). Story 2.1 ships the empty table. Seed data is Story 2.5's responsibility, or a one-off `INSERT INTO osm_truck_stops ...` in a Story 2.4 fixture for tests.

### `0006_parking_lookups_recent.sql` contract

`supabase/migrations/0006_parking_lookups_recent.sql`. Three logical sections: table + RLS, prune function, pg_cron schedule.

```sql
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
-- SET search_path = '' satisfies the Supabase security advisor; the function
-- body uses fully-qualified public.parking_lookups_recent so empty search_path
-- is safe.
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
```

Notes:
- The pg_cron schedule string `'17 * * * *'` is standard cron syntax: minute=17, every hour, every day, every month, every weekday.
- `cron.schedule()` returns a `bigint` job id; we don't capture it. To unschedule later, `SELECT cron.unschedule('prune-parking-lookups-recent');` by name.
- The migration is **non-idempotent** for the `cron.schedule` call — re-running it would error with "job already scheduled". This is fine: Supabase's migration tracker (`supabase_migrations.schema_migrations`) prevents re-runs. If you ever need to repair, `supabase db reset` is the right tool.

### `0007_osm_truck_stops.sql` contract

`supabase/migrations/0007_osm_truck_stops.sql`. Single table + RLS + read grant.

```sql
-- Migration 0007 — OSM truck stops (Overpass extract cache)
-- Story 2.1 (Parking Discovery epic)
--
-- Mirror of OpenStreetMap truck-stop and HGV-accessible parking POIs,
-- refreshed weekly by the osm-refresh Edge Function (Story 2.5) via the
-- Overpass API. Anon-read so the parking-search Edge Function (Story 2.4
-- OSM lookup) can serve fallback results without privileged DB access.
--
-- SCOPE LOCK (2026-05-25):
--   - TPC deferred post-MVP. NO source/affiliate_url/affiliate_partner/
--     bookable columns. When TPC ships, a small migration adds them.
--   - Curated picks deferred. NO curator_id/notes/why_picked columns.
--     Stopgap: Shawn can insert curated rows with prefixed osm_id like
--     'shawn_pick_001'; the PK is text so this works without schema change.
--
-- Per architecture.md:334, shape is strictly OSM-native.

CREATE TABLE public.osm_truck_stops (
  osm_id            text PRIMARY KEY,
  lat               numeric NOT NULL,
  lng               numeric NOT NULL,
  name              text,
  amenity           text NOT NULL,
  last_refreshed_at timestamptz NOT NULL DEFAULT now(),
  raw_tags          jsonb
);

COMMENT ON TABLE public.osm_truck_stops IS
  'OSM Overpass extract: truck stops and HGV-accessible parking. Refreshed weekly by osm-refresh Edge Function (Story 2.5). Anon-read for parking-search fallback (Story 2.4). Strictly OSM-native shape per architecture.md:334.';

COMMENT ON COLUMN public.osm_truck_stops.osm_id IS
  'OSM feature id (e.g., ''node/12345'', ''way/67890''). TEXT PK accommodates non-OSM stopgap rows like ''shawn_pick_001'' for curated picks (pre-curated-picks-story).';

COMMENT ON COLUMN public.osm_truck_stops.amenity IS
  'OSM amenity tag. Expected values: ''truck_stop'' or ''parking'' (with access=hgv in raw_tags).';

COMMENT ON COLUMN public.osm_truck_stops.raw_tags IS
  'Full OSM tag bag for future enrichment without schema change (e.g., capacity, lighting, fuel, shower flags surfaced later).';

-- Enable RLS. Default-deny posture; explicit policy below grants read.
ALTER TABLE public.osm_truck_stops ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated SELECT. Writes go through the osm-refresh Edge
-- Function (Story 2.5) using the service-role key, which bypasses RLS by
-- design. No INSERT/UPDATE/DELETE policies — service-role doesn't need them.
CREATE POLICY osm_truck_stops_anon_read
  ON public.osm_truck_stops
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit GRANT — Supabase's RLS-enable + grant-explicit posture.
GRANT SELECT ON public.osm_truck_stops TO anon, authenticated;

-- No indexes beyond the PK in this story. Story 2.4 (OSM lookup + ranking)
-- adds the appropriate geo index once query patterns are concrete (likely
-- a btree on (lat, lng) or PostGIS GiST — premature to pick without a real
-- query).
```

Notes:
- `numeric` for lat/lng (not `double precision`): higher precision, deterministic comparisons, no IEEE float surprises in equality checks. Supabase recommends numeric for geo. Costs a tiny bit of space and CPU vs `double precision` — fine for v1.
- `raw_tags jsonb` is the escape hatch for OSM's open tagging model. Story 2.5 can store the full tag dictionary; later stories surface specific tags as columns if needed.
- No `created_at` column — `last_refreshed_at` doubles as both insert time (default `now()`) and update time (the upsert in Story 2.5 sets it explicitly).

### `0010_rate_limits.sql` contract

`supabase/migrations/0010_rate_limits.sql`. Single table + RLS. Simplest of the three.

```sql
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
```

Notes:
- Cleanup strategy is intentionally *not* a pg_cron job — the writing Edge Function deletes its own stale rows during normal writes (a few-line DELETE in the rate-limit logic). One less moving piece than another cron job; total table size stays bounded by the active bucket set times the window count.
- `count integer DEFAULT 1`: a new bucket+window row starts at 1 (the request that created it). Subsequent same-window requests increment via `UPDATE ... SET count = count + 1`. Atomic via upsert: `INSERT INTO admin.rate_limits (bucket, window_start) VALUES ($1, $2) ON CONFLICT (bucket, window_start) DO UPDATE SET count = admin.rate_limits.count + 1 RETURNING count;`. Story 2.2 implements this.

### `src/core/types/supabase.ts` regen note

Not a contract — auto-generated. The `supabase gen types typescript --local` command produces a file that:
- Re-emits the existing `Database` interface including `public.profiles` (from Story 1.2)
- Adds `public.parking_lookups_recent`, `public.osm_truck_stops`
- Adds `admin.rate_limits` under the `Database['admin']['Tables']` namespace

The file will be committed verbatim. Don't hand-edit it. If `typecheck` fails after regen, the diagnostic is in the file's structure or in a downstream consumer that imports a type that has shifted — fix the consumer, not the generated file.

(Story 1.2's regen ran against the linked prod project. Story 2.1's regen against `--local` produces the same shape because the local DB is reset from the same migrations. The difference between `--local` and `--linked` is only meaningful when the linked schema has diverged from the local migrations — which would itself be a bug to fix first.)

---

## Dev Agent Record

### Tasks completed

- Tasks 2–5 — three migration SQL files authored + self-reviewed (committed `f68cb4f`, pre-execution); verified against the Dev Notes contracts this run.
- Task 6 (local Docker test) — **N/A in this environment (no Docker)**; replaced by direct production verification via the Management API SQL query endpoint.
- Task 7 — `src/core/types/supabase.ts` regenerated via `gen types --linked` (`--local` impossible without Docker; ran after prod apply per spec line 140 fallback), schemas `public`+`admin`+`analytics_agg`; prettier-formatted post-gen.
- Task 8 — all 8 local gates green.
- Task 9 — types + docs committed locally; **push/PR/merge pending a GitHub credential** (none configured in this fresh clone).
- Task 10 — migrations applied to prod (`jgzcwkorjxhbqzdzxwzt`) + verified.

### Completion Notes List

- **2026-06-01** — `0006/0007/0010` applied to production `jgzcwkorjxhbqzdzxwzt` via `supabase db push --linked`. All three applied clean; **no pg_cron error** — the `CREATE EXTENSION pg_cron WITH SCHEMA extensions` + `cron.schedule(...)` combination resolved correctly on Supabase-hosted Postgres (the flagged risk did not materialize).
- Production verification (Management API SQL endpoint; Docker/psql unavailable):
  - Tables: `admin.rate_limits`, `public.osm_truck_stops`, `public.parking_lookups_recent` (+ `public.profiles`).
  - **FR65 confirmed** — `parking_lookups_recent` columns = `device_hash, corridor_key, last_lookup_at` only; no `user_id`.
  - RLS enabled on all three.
  - `cron.job` `prune-parking-lookups-recent` registered, schedule `17 * * * *`, command `SELECT public.prune_parking_lookups_recent();`.
- Environment deviations from the as-written Task 1 preconditions: fresh clone after a Chromebook powerwash — Supabase CLI via `npx -y supabase@latest` (not a devDep); Docker unavailable (local `db reset` / `gen types --local` skipped in favor of prod-apply + `--linked` regen + Management-API verification); the three SQL files were already committed (`f68cb4f`).
- `src/core/types/supabase.ts` had **no prior git history** in canon (Story 1.2's type file was never committed) — this story ADDS it.
- Doc fix: corrected the sequencing-note mislabel of reserved slots `0004/0005/0008/0009`.

### File List

- `supabase/migrations/0006_parking_lookups_recent.sql` (committed `f68cb4f`)
- `supabase/migrations/0007_osm_truck_stops.sql` (committed `f68cb4f`)
- `supabase/migrations/0010_rate_limits.sql` (committed `f68cb4f`)
- `src/core/types/supabase.ts` (new — regenerated from prod, `public`+`admin`+`analytics_agg`)
- `_bmad-output/implementation-artifacts/2-1-parking-schema-migrations.md` (this file — status, sequencing fix, Dev Agent Record)
- `NOTES.md` (Done / Up Next / Pending Shawn updated)
