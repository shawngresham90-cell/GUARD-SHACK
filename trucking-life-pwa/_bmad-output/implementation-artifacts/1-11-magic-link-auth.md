---
baseline_commit: e2a230bfa527ea6b783ab2de0d55e479bcfa2b73
---

# Story 1.11: Magic-link auth + UTM survival across roundtrip

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-11-magic-link-auth`
**Generated:** 2026-06-16 (Claude, paired with Huffy)
**Depends on:** Story 1.10 (provider tree, route table, `AuthProvider`, Zustand auth store, guards — all merged), Story 1.2 (`public.profiles` table + RLS, migration `0002_profiles.sql` applied)
**Unblocks:** Story 1.12 (Google sign-in — reuses the same `useUtmCapture` + `/auth/callback` cohort/onboarding routing), 1.13 (onboarding fills `otr_or_local`/`default_state`), 1.14 (settings reads account email/prefs). Epic 5 cohort attribution depends on the `cohort_tag` written here.

## Story

As a visitor,
I want to sign up or sign in with my email via a magic-link, with my UTM parameters preserved across the auth roundtrip,
so that my acquisition source (cohort) is correctly attributed.

_(FR1 sign-up via magic-link, FR3 sign-in on any device, FR4 no passwords, FR42 UTM tagging survives the roundtrip, NFR-I5 attribution not lost between landing-page click and signed-in state.)_

## Acceptance Criteria

1. **Magic-link form, no password** — `/auth/login` renders a `<MagicLinkForm>` (a native `<form>` with one labelled email `<input>` + submit, no form library). **No password field exists anywhere in the auth flow** (FR4). The screen keeps an `<h1>` with accessible name **"Sign in"** (the existing E2E smoke asserts `getByRole('heading', { name: 'Sign in' })`). [Source: epics.md#Story-1.11; architecture.md:458, 732]
2. **UTM captured to `localStorage` BEFORE the OTP call** — `useUtmCapture` writes the UTM object to `localStorage` under key **`pending_utm`** _before_ calling `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <callback_url_with_utm> } })`. The `emailRedirectTo` is built from `siteUrl('/auth/callback')` with the captured `utm_*` appended as query params (belt-and-suspenders survival). [Source: epics.md#Story-1.11 AC2; architecture.md:113, 375, 730; AR14]
3. **Magic-link delivery + callback landing** — submitting a valid email triggers Supabase magic-link delivery (Supabase SMTP at v1); clicking the email link returns the browser to `/auth/callback`. The supabase-js client auto-detects the session in the callback URL (`detectSessionInUrl` default `true`); `AuthProvider`'s `onAuthStateChange` flips the Zustand store to `authenticated`. [Source: epics.md#Story-1.11; architecture.md:730]
4. **Cohort derivation + profile upsert in `<AuthCallback>`** — once the session is `authenticated`, `<AuthCallback>` reads `pending_utm` (falling back to the URL query if localStorage was cleared), derives the cohort tag — **`day1_stan` if `utm_source === 'stan_store'`, else `cold_youtube`** — upserts `public.profiles` (conflict target **`user_id`**) with the cohort tag **without overwriting an existing `cohort_tag`** (FR44: cohort is set once, never mutated), then clears `pending_utm`. [Source: epics.md#Story-1.11 AC4; architecture.md:375; migration `0002_profiles.sql`; FR43/FR44]
5. **Onboarding-aware routing** — after the upsert, navigate (`replace`) to **`/onboarding` if `profiles.otr_or_local` is null**, else to **`/`** (parking home). [Source: epics.md#Story-1.11; FR8]
6. **Tests** — Vitest unit tests cover cohort derivation (both branches + absent UTM) and the UTM-capture write-before-OTP ordering; a Playwright E2E (`tests/e2e/auth-warm-cohort.spec.ts`) covers the UTM-preservation happy path with the Supabase auth network call mocked/intercepted. All 8 CI gates stay green. [Source: epics.md#Story-1.11 AC; architecture.md:1062]

## Tasks / Subtasks

- [x] **Task 1 — Cohort derivation helper (pure, testable) (AC4)**
  - [x] Create `src/modules/auth/cohort.ts` exporting a pure `deriveCohort(utmSource: string | null | undefined): 'day1_stan' | 'cold_youtube'` — returns `'day1_stan'` iff `utmSource === 'stan_store'`, else `'cold_youtube'`. Define and export a `CohortTag` string-literal union here (the generated `profiles.cohort_tag` type is only `string | null`, so the literal union must be hand-authored).
  - [x] Co-locate `src/modules/auth/cohort.test.ts`: `stan_store → day1_stan`; any other source → `cold_youtube`; `null`/`undefined`/`''` → `cold_youtube`.
- [x] **Task 2 — `useUtmCapture` hook + UTM stash (AC2)**
  - [x] Create `src/modules/auth/hooks/useUtmCapture.ts`. Capture all present `utm_*` params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) from `window.location.search` into a plain object. Expose a function the form calls on submit that **writes `pending_utm` to `localStorage` BEFORE returning/initiating the OTP call** (ordering is load-bearing — AC2). Factor the parse/serialize logic into pure functions (inject `Storage`/search-string for jsdom testability — mirror the `src/pwa/installPrompt.ts` pure-function-with-injected-deps convention).
  - [x] Co-locate a `.test.ts` asserting: UTM parsed from a query string into the object; `pending_utm` written to a mock `Storage`; missing UTM yields an object that derives `cold_youtube`.
- [x] **Task 3 — `<MagicLinkForm>` component (AC1, AC2)**
  - [x] Create `src/modules/auth/components/MagicLinkForm.tsx` (named export). Native `<form>`: a `<label htmlFor>` + email `<input type="email" required>` (the label is required for the Lighthouse a11y ≥95 gate, NFR-A7) and a submit button. On submit: call `useUtmCapture`'s stash function, then `await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })` where `emailRedirectTo` is built per AC2 (see Dev Notes — URL construction). Render a "check your email" confirmation state on success and an inline error on failure. Keep it lean — auth is in the **eager** bundle (bundle-size ≤200 KB gz gate). **No password field.**
  - [x] Co-locate `MagicLinkForm.test.tsx`: mock `@/core/supabase`, assert (a) submitting writes `pending_utm` to localStorage **before** `signInWithOtp` is invoked, (b) `signInWithOtp` is called with an `emailRedirectTo` containing `/auth/callback` and the captured `utm_*`, (c) no element of type `password` is rendered.
- [x] **Task 4 — Flesh out `Login` screen (AC1)**
  - [x] Replace the `<Placeholder>` stub in `src/modules/auth/Login.tsx` with the real screen rendering `<h1>Sign in</h1>` + `<MagicLinkForm>`. Keep it a default export, eager-loaded, public (no guard). Preserve the "Sign in" heading exactly (E2E smoke depends on it).
- [x] **Task 5 — Real `<AuthCallback>` logic (AC3, AC4, AC5)**
  - [x] Replace the stub in `src/modules/auth/AuthCallback.tsx`. Read auth state from `useAuthStore` selectors (`useAuthStatus`, `useAuthUser`) — **do NOT add a second `onAuthStateChange` subscription** (`AuthProvider` already owns it) and **do NOT call `exchangeCodeForSession`** (`detectSessionInUrl` handles it).
  - [x] While `status === 'loading'`, render a neutral "Signing you in…" state. While `unauthenticated` after resolution (e.g. expired/invalid link), show an error + link back to `/auth/login`.
  - [x] Once `authenticated`: in an effect, run the cohort upsert mutation **once** (guard against React StrictMode double-invoke), then route. Use a TanStack Query `useMutation` wrapping the upsert (architecture.md:411 — driver CRUD goes through supabase-js + TanStack Query).
  - [x] Upsert: derive cohort from `pending_utm` (`deriveCohort`), call `supabase.from('profiles').upsert({ user_id, cohort_tag }, { onConflict: 'user_id', ignoreDuplicates: true })` so a returning user's existing `cohort_tag` is **not** re-stamped (FR44). `user_id` = `user.id` from the store. Then read `profiles.otr_or_local` (select after upsert, or in the same round-trip) and `localStorage.removeItem('pending_utm')`.
  - [x] Route with `<Navigate replace>` / `useNavigate(..., { replace: true })`: `otr_or_local == null` → `/onboarding`, else `/`. `replace` so the token-bearing callback URL leaves no history entry.
- [x] **Task 6 — Tests + E2E (AC6)**
  - [x] Unit suites from Tasks 1–3 + an `AuthCallback.test.tsx` driving `useAuthStore.setState({ status, user })` and a mocked `@/core/supabase` to assert: cohort upsert called with the derived tag and `ignoreDuplicates: true`; `pending_utm` cleared; navigates to `/onboarding` when `otr_or_local` null and `/` otherwise. Use `MemoryRouter` + a tiny `<Routes>` with `/onboarding` and `/` targets to assert the redirect (same pattern as `RequireAdmin.test.tsx`).
  - [x] Create `tests/e2e/auth-warm-cohort.spec.ts`: visit `/auth/login?utm_source=stan_store&utm_campaign=carnivore`, submit an email, and assert `pending_utm` is in `localStorage` with `utm_source=stan_store` and that the OTP request fired with the right `emailRedirectTo`. **Mock the Supabase auth network call** via Playwright `page.route(...)` interception (no real email roundtrip in CI). Optionally simulate the callback to assert `day1_stan` derivation. Note: no Supabase mocking infra exists in `tests/e2e/` yet — you are adding the first instance; keep the interception helper reusable for Story 1.12.
  - [x] Run the full local gate: `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build && npm run test:e2e`. **`format:check` is part of the `lint` CI job — run it locally** (a missed Prettier nit failed CI in Story 1.10).

### Review Findings

_Adversarial code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor), 2026-06-17. Acceptance Auditor: all 6 ACs satisfied, no spec violations. Decision item (callback "expired link" race) dismissed — supabase-js `getSession()` awaits URL-token detection, so a valid link cannot flash the expired state._

- [x] [Review][Patch] Email is not trimmed and `<form noValidate>` disables the native `required`/`type=email` gate, so empty/whitespace/padded emails reach `signInWithOtp` [src/modules/auth/components/MagicLinkForm.tsx] — FIXED: removed `noValidate`, trim + empty-guard before the OTP call; tests added.
- [x] [Review][Patch] Form allows rapid double-submit (button `disabled` is async state, not a synchronous in-flight guard) → two `signInWithOtp` calls → spurious "rate limited" error [src/modules/auth/components/MagicLinkForm.tsx] — FIXED: early-return in-flight guard (`status === 'submitting'`); test added.
- [x] [Review][Patch] Post-upsert `.select(...).single()` throws PGRST116 on zero rows; harden with `.maybeSingle()` + null→`/onboarding` default so a valid sign-in is never hard-blocked (also closes the untested select-error branch) [src/modules/auth/AuthCallback.tsx] — FIXED: switched to `.maybeSingle()`; zero-row + read-error tests added.
- [x] [Review][Patch] `readPendingUtm` accepts a JSON array as a valid UTM object (`typeof [] === 'object'`); add `!Array.isArray` to the guard [src/modules/auth/hooks/useUtmCapture.ts] — FIXED: array excluded from the object guard; test added.

## Dev Notes

### Brownfield: reuse the 1.10 plumbing — do NOT reinvent
Story 1.10 shipped and merged the entire auth substrate. **Build on it; do not recreate it.**
- `src/core/supabase.ts` — singleton typed anon client. **No options passed**, so `detectSessionInUrl: true` and `flowType: 'pkce'` are the supabase-js defaults: the client auto-exchanges the magic-link tokens from the callback URL. `<AuthCallback>` must **react** to the established session, never call `exchangeCodeForSession`.
- `src/core/store/auth.ts` — Zustand store `{ session, user, isAdmin, status: 'loading'|'authenticated'|'unauthenticated' }` with `setSession()` and selectors `useAuthStatus()`, `useAuthUser()`, `useIsAdmin()`. Read session state from these.
- `src/routes/AuthProvider.tsx` — already runs `getSession()` + `onAuthStateChange` and mirrors into the store (with a `hydratedByEvent` guard + `.catch`). **Do not add a second auth subscription.** Constraint carried from 1.10: **never call other `supabase.auth.*` inside an `onAuthStateChange` callback** (re-entrancy deadlock). The upsert runs in a component effect, not inside that listener, and uses `supabase.from('profiles')` — safe.
- `src/core/siteUrl.ts` — `siteUrl('/auth/callback')` resolves `VITE_SITE_URL` → `window.location.origin` → `http://localhost:3000`. **Use it for `emailRedirectTo`; never hardcode a callback URL.**
- `src/core/auth/claims.ts` — fail-closed `is_admin` reader. Not needed here, but note: **Story 1.11 is driver auth only — it must never touch/grant `is_admin`.** Driver signup can never acquire admin (AR12 / NFR-S4); the same flow is reused for admin later but the claim is server-stamped only.

### The `profiles` table already exists — client upsert is the ONLY way a row is created
Migration `supabase/migrations/0002_profiles.sql` is applied. There is **no trigger on `auth.users`** that auto-creates a profile, so this story's `AuthCallback` upsert is the first and only writer of the row.
- **PK is `user_id`** (uuid, FK → `auth.users(id)`), **not `id`**. Upsert `onConflict: 'user_id'`.
- Columns: `user_id` (PK), `cohort_tag text CHECK IN ('day1_stan','cold_youtube')` nullable, `otr_or_local text CHECK IN ('otr','local')` nullable, `default_state text` nullable, `dark_mode boolean DEFAULT true`, `analytics_opt_out boolean DEFAULT false`, `created_at`, `updated_at` (trigger-maintained).
- **RLS is default-deny with own-row policies** (`insert/select/update_profiles_own`: `auth.uid() = user_id`). The upsert is safe because you write `user_id = user.id = auth.uid()`. DELETE is intentionally not granted. Trust RLS — it's the real boundary.
- **FR44 — cohort is set once, never mutated.** A naive `upsert({ user_id, cohort_tag })` would re-stamp cohort on every login. Use `{ onConflict: 'user_id', ignoreDuplicates: true }` (insert-if-absent) so a returning user keeps their original cohort. Leave `otr_or_local`/`default_state` null — Story 1.13 onboarding fills them.
- Generated types: `src/core/types/supabase.ts` — use `TablesInsert<'profiles'>` / `Tables<'profiles'>`. `cohort_tag` and `otr_or_local` are typed `string | null` (no generated enum) — hardcode the literal values from your own `CohortTag` union.

### UTM survival mechanism (AR14 / NFR-I5)
The magic-link returns the user to the **same origin/browser**, so `localStorage.pending_utm` survives the roundtrip. The UTM is **also** appended to `emailRedirectTo` as a query-string backup (read it in `AuthCallback` if `pending_utm` was cleared). Order is load-bearing: **write `pending_utm` BEFORE `signInWithOtp`** (AC2). A documented cookie fallback exists in the architecture but is **not** an AC — localStorage + redirect-URL is sufficient.

**Building `emailRedirectTo`:** `siteUrl()` normalizes slashes, so construct safely — e.g. `const url = new URL(siteUrl('/auth/callback')); Object.entries(utm).forEach(([k,v]) => url.searchParams.set(k, v)); const emailRedirectTo = url.toString();`

### File structure — module layout for `src/modules/auth/`
This is the first real feature module. Adopt the architecture's module hard-rule structure (architecture.md:625–640) **without relocating the already-wired route screens**:
- **Keep at module root** (route-level screens, default export, already imported by `routes/index.tsx`): `Login.tsx`, `AuthCallback.tsx`.
- **New sub-pieces:** `src/modules/auth/components/MagicLinkForm.tsx` (named export), `src/modules/auth/hooks/useUtmCapture.ts`, `src/modules/auth/cohort.ts`.
- Path alias `@/*` → `src/*`. React Router v7 **library mode** — import from `'react-router'` (not `react-router-dom`).
- `routes/index.tsx` already maps `/auth/login`, `/auth/callback`, `/onboarding`, `/` and a catch-all `* → /`. **No route-table changes needed** — only the screen internals change.

### Analytics (light touch — keep for Epic 5, but follow the rule if firing)
If you emit signup telemetry (`auth.signup_started` / `auth.signup_completed`), the **cohort tag goes in as an event prop, NEVER as a user identifier** — no `user_id`, no raw email (architecture.md:709–711). Respect `analytics_opt_out`. Full cohort-analytics wiring is Epic 5; do not over-build here.

### Supabase config caveat (not app code — flag for Shawn)
For magic-link to land locally, the dev origin must be in Supabase's redirect allow-list. `supabase/config.toml` currently allows `:3000` origins; the Vite dev server is `:5173`. `siteUrl()` resolves `window.location.origin` in dev, so confirm the running origin is allow-listed in the Supabase dashboard. Also NFR-S3 wants 15-min single-use links (dashboard/config setting, not code).

### Testing standards
- Vitest v4, `environment: 'jsdom'`, **`globals: false`** — import `{ describe, it, expect, vi, beforeEach }` from `'vitest'` explicitly. `src/test-setup.ts` already registers `afterEach(cleanup)`.
- Co-locate `*.test.ts(x)` next to source (project convention).
- **Drive auth state via `useAuthStore.setState({...})`** in `beforeEach` (see `src/routes/guards/RequireAuth.test.tsx` / `RequireAdmin.test.tsx`). **No real network in unit tests** — `vi.mock('@/core/supabase', ...)` returning fake `auth.signInWithOtp` and `from().upsert()/.select()`. Prefer pure functions (`deriveCohort`, UTM parse) that test without mocks.
- Playwright: `tests/e2e/`, baseURL `http://localhost:5173`, chromium, auto-starts `npm run dev` (`playwright.config.ts`). Mock Supabase auth via `page.route()`. You're adding the first network-mocked e2e — make the interception reusable for 1.12.
- CI gates to keep green: `lint` (eslint **+ `format:check`**), `typecheck`, `unit`, `e2e`, `bundle-size` (≤200 KB gz — auth is eager, keep the form lean), `lighthouse` (Perf≥90/A11y≥95 — label the email input), `check:disclaimer-source` (don't inline disclaimer copy), `rods-grid`/`ftc`.

### Previous-story intelligence (1.10, just merged)
- Guards render `null` while `status==='loading'` and redirect on `unauthenticated`. `/` is auth-gated → an unauthenticated visit bounces to `/auth/login` (the smoke test relies on this; keep the "Sign in" heading).
- `AuthProvider` got a `.catch` (failed `getSession` resolves to `unauthenticated`, not stuck `loading`) + `hydratedByEvent` guard — don't regress it.
- Repo conventions confirmed: heavy file-header comments citing `architecture.md` line numbers; default export for screens, named export for shared components; zod v4 API (`z.url()`); `@/` imports; co-located tests; `<Placeholder>` is the stub helper to remove when implementing a real screen.
- A missed `format:check` (Prettier) failed the `lint` CI job in 1.10 — run `npm run format:check` before pushing.

### Project Structure Notes
- New files: `src/modules/auth/cohort.ts`(+test), `src/modules/auth/hooks/useUtmCapture.ts`(+test), `src/modules/auth/components/MagicLinkForm.tsx`(+test), `src/modules/auth/AuthCallback.test.tsx`, `tests/e2e/auth-warm-cohort.spec.ts`.
- Modified: `src/modules/auth/Login.tsx` (stub → real), `src/modules/auth/AuthCallback.tsx` (stub → real).
- **No migration, no route-table, no env-var, no provider-tree changes.** Variance from architecture.md's `api/authApi.ts` + `index.ts` module surface: deferred — direct default-import of screens (current `routes/index.tsx` pattern) is retained; an `index.ts` barrel can be added when cross-module imports actually appear.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.11] — user story + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md:113, 375, 730] — UTM survival, magic-link redirect, `signInWithOtp`
- [Source: _bmad-output/planning-artifacts/architecture.md:625-640, 732] — module structure hard-rule, auth UI location
- [Source: _bmad-output/planning-artifacts/architecture.md:411, 698-700] — TanStack Query for driver CRUD, query/mutation conventions
- [Source: _bmad-output/planning-artifacts/architecture.md:709-711] — analytics cohort-as-prop rule
- [Source: _bmad-output/planning-artifacts/architecture.md:366-389] — two trust domains / AR12 / NFR-S4
- [Source: _bmad-output/planning-artifacts/architecture.md:1062] — e2e spec `auth-warm-cohort.spec.ts`
- [Source: _bmad-output/planning-artifacts/prd.md] — FR1, FR3, FR4, FR8, FR42, FR43, FR44, NFR-I5, NFR-S3, NFR-A7
- [Source: supabase/migrations/0002_profiles.sql] — profiles schema, CHECK values, RLS own-row policies, no auth trigger, FR44 cohort comment
- [Source: src/core/supabase.ts, src/core/store/auth.ts, src/routes/AuthProvider.tsx, src/core/siteUrl.ts] — reused 1.10 plumbing
- [Source: src/modules/auth/Login.tsx, src/modules/auth/AuthCallback.tsx] — stubs to flesh out
- [Source: src/routes/guards/RequireAdmin.test.tsx, src/pwa/installPrompt.ts] — test + pure-function conventions to mirror

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context) — dev-story workflow.

### Debug Log References

- Lint surfaced two issues fixed before completion: (1) unused `waitFor` import in `AuthCallback.test.tsx`; (2) `react-refresh/only-export-components` — `buildEmailRedirectTo` could not be exported alongside the `<MagicLinkForm>` component, so it was relocated into the UTM module (`useUtmCapture.ts`), where it belongs as the AC2 backup-channel URL builder.
- A missed Prettier nit (from 1.10) was pre-empted: `npm run format` reformatted 3 new files; `format:check` then clean.

### Completion Notes List

- **AC1** — `/auth/login` renders `<h1>Sign in</h1>` + a native `<MagicLinkForm>` (one labelled email input, submit button, no form library). No password field anywhere (asserted in unit + e2e). "Sign in" heading preserved for the existing smoke test.
- **AC2** — `useUtmCapture` stashes `pending_utm` to `localStorage` **before** `signInWithOtp`; ordering asserted in unit (snapshot of localStorage at OTP-call time) and e2e. `emailRedirectTo` built via `new URL(siteUrl('/auth/callback'))` with captured `utm_*` appended (backup survival channel).
- **AC3** — `<AuthCallback>` reacts to the session established by supabase-js (`detectSessionInUrl` default); no second `onAuthStateChange`, no `exchangeCodeForSession`. Reads `useAuthStatus`/`useAuthUser`.
- **AC4** — cohort derived (`deriveCohort`: `stan_store → day1_stan`, else `cold_youtube`) from surviving `pending_utm` (URL-query fallback). Upsert `profiles` on conflict `user_id` with `ignoreDuplicates: true` so an existing `cohort_tag` is never re-stamped (FR44). `pending_utm` cleared after commit. Upsert runs once via a `useRef` StrictMode guard inside a TanStack `useMutation`.
- **AC5** — after upsert, `<Navigate replace>` to `/onboarding` when `profiles.otr_or_local` is null, else `/`. `replace` keeps the token-bearing URL out of history.
- **AC6** — Vitest unit suites for cohort derivation, UTM parse/stash, MagicLinkForm ordering, and AuthCallback routing/upsert; Playwright `auth-warm-cohort.spec.ts` (warm + cold paths) with a **reusable** Supabase OTP interception helper (`tests/e2e/helpers/supabaseAuth.ts`) — first network-mocked e2e, kept reusable for Story 1.12.
- **Gates run locally:** lint ✅, format:check ✅, typecheck ✅, unit (108 tests / 18 files) ✅, build ✅, bundle-size **151.76 KB gz / 200 KB** ✅, e2e (4) ✅, check:disclaimer-source/ftc/rods ✅. Lighthouse (lhci) not run locally — email input is `<label htmlFor>`-associated for the A11y ≥95 gate.
- **No app-code deviations from the story plan.** No migration, route-table, env-var, or provider-tree changes. `baseline_commit` (`e2a230b`) preserved from the draft.
- **Flagged for Shawn (config, not code):** dev origin `:5173` must be in Supabase's redirect allow-list for magic-link to land locally; NFR-S3 15-min single-use link expiry is a dashboard/config setting.

### File List

**New**
- `src/modules/auth/cohort.ts`
- `src/modules/auth/cohort.test.ts`
- `src/modules/auth/hooks/useUtmCapture.ts`
- `src/modules/auth/hooks/useUtmCapture.test.ts`
- `src/modules/auth/components/MagicLinkForm.tsx`
- `src/modules/auth/components/MagicLinkForm.test.tsx`
- `src/modules/auth/AuthCallback.test.tsx`
- `tests/e2e/helpers/supabaseAuth.ts`
- `tests/e2e/auth-warm-cohort.spec.ts`

**Modified**
- `src/modules/auth/Login.tsx` (stub → real screen)
- `src/modules/auth/AuthCallback.tsx` (stub → real cohort-upsert + routing logic)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-16 | Story drafted with full developer context (profiles upsert/FR44, UTM survival, reuse of 1.10 auth plumbing, e2e mocking guidance). Status → ready-for-dev. |
| 2026-06-16 | Implemented magic-link auth: cohort derivation, UTM capture/survival, MagicLinkForm, real Login + AuthCallback (write-once cohort upsert, onboarding-aware routing). Added unit + e2e (reusable Supabase OTP mock). All local gates green (bundle 151.76 KB gz). Status → review. |
| 2026-06-17 | Adversarial code review (3 layers): all 6 ACs satisfied. Applied 4 patches — email trim + native validation, double-submit in-flight guard, `.maybeSingle()` profile-read hardening, array-reject in `readPendingUtm`; +6 tests (114 unit total). Decision item (callback expired-link race) dismissed. All gates green. Status → done. |
