---
baseline_commit: 3cbd60645d6a88e3859f48a456e82656286212ec
---

# Story 1.10: Build provider tree + routing skeleton + auth/admin guards

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-10-provider-tree-routing-guards`
**Generated:** 2026-06-14 (Claude, paired with Huffy)
**Depends on:** Story 1.1 (libraries installed), Story 1.2 (profiles table), Story 1.3 (`is_admin` JWT claim), Story 1.9 (PWA SW registration — already mounted in `main.tsx`)
**Unblocks:** Story 1.11 (magic-link auth), 1.12 (Google sign-in), 1.13 (onboarding), 1.14 (settings shell) — and every feature epic that plugs a screen into the route tree.

## Story

As Huffy,
I want `App.tsx` mounting the provider stack, `react-router` routes lazy-loaded for feature modules, and route guards enforcing driver vs. admin auth domains,
so that all subsequent feature epics plug into a stable shell.

## Acceptance Criteria

1. **Provider tree** — `src/main.tsx` mounts `<App />`, and `App.tsx` renders the provider stack in this order: `<QueryClientProvider>` (TanStack Query) → `<BrowserRouter>` (react-router v7 library mode) → `<AuthProvider>` (Zustand-mirrored Supabase session) → `<Suspense>` wrapping the lazy route tree. [Source: epics.md#Story-1.10 AC1; architecture.md:898-900]
2. **Route tree** — `src/routes/index.tsx` defines the route table with **lazy** imports for Parking, HOS, and Admin subtrees, and **eager** imports for Auth, Settings, Onboarding, the auth `callback`, and Disclaimer routes. [Source: epics.md#Story-1.10 AC2; architecture.md:491-505, 903-911]
3. **RequireAuth** — `src/routes/guards/RequireAuth.tsx` redirects unauthenticated users to `/auth/login`. [Source: epics.md#Story-1.10 AC3]
4. **RequireAdmin** — `src/routes/guards/RequireAdmin.tsx` reads the `is_admin` claim (semantically `auth.jwt() ->> 'is_admin' = 'true'`) from the current session and redirects non-admins to `/`. [Source: epics.md#Story-1.10 AC4; architecture.md:388, 910]
5. **Guard tests** — Vitest tests cover both guards' happy-path (renders children) and redirect behavior. [Source: epics.md#Story-1.10 AC5]
6. **Domain isolation, end-to-end** — an unauthenticated visit to `/admin` redirects to `/auth/login`; an authenticated-but-non-admin visit to `/admin` redirects to `/`. [Source: epics.md#Story-1.10 AC6; NFR-S4 / FR60]

## Tasks / Subtasks

- [x] **Task 1 — Supabase anon client + env validation (foundation; AC1, AC3, AC4)**
  - [x] Create `src/core/supabase.ts` exporting a singleton anon client: `createClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` using the generated `Database` type from `src/core/types/supabase.ts`. Use `import.meta.env` (Vite), not `process.env`.
  - [x] Create `src/core/env.ts` that validates `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present at boot and throws a clear error if missing (architecture.md:918 names this file; keep it a thin Zod or manual check — `zod` is already a dependency).
  - [x] Do **not** hardcode keys; `.env.local` and `.env.example` already define the var names. Confirm `src/vite-env.d.ts` types `import.meta.env` for these (Story 1.9 added it — extend the `ImportMetaEnv` interface if the vars aren't declared).
- [x] **Task 2 — Zustand auth slice + AuthProvider (AC1, AC3, AC4)**
  - [x] Create `src/core/store/auth.ts` — a Zustand store mirroring the Supabase session: `{ session: Session | null, user: User | null, isAdmin: boolean, status: 'loading' | 'authenticated' | 'unauthenticated' }`. Expose selectors, not a mega-store (architecture.md:692-695).
  - [x] Create `AuthProvider` (`src/routes/AuthProvider.tsx` or co-located with the store per your judgment — architecture names it as a provider in the tree, file location not pinned). On mount: call `supabase.auth.getSession()`, hydrate the store, then subscribe to `supabase.auth.onAuthStateChange((_event, session) => …)` and keep the store in sync. Unsubscribe on unmount.
  - [x] Derive `isAdmin` from the **access-token claim**, not a column. Prefer `supabase.auth.getClaims()` (supabase-js ≥2.105 supports it) → `claims.is_admin === true`; if you decode manually, read `is_admin` from the JWT payload. **Never** trust a client-set flag. (See Dev Notes — the prod hook that stamps this claim is implemented but not yet *enabled*, so at runtime `is_admin` may be absent until Shawn enables it; the guard must treat absent as non-admin.)
  - [x] Set `status: 'loading'` until the first `getSession()` resolves so guards can render a neutral state instead of falsely redirecting on first paint (see Dev Notes — "loading flicker").
- [x] **Task 3 — Route guards (AC3, AC4, AC6)**
  - [x] `src/routes/guards/RequireAuth.tsx`: while `status === 'loading'` render a neutral fallback (e.g. `null` or `<Skeleton/>`); when `unauthenticated` → `<Navigate to="/auth/login" replace />`; else render `children`.
  - [x] `src/routes/guards/RequireAdmin.tsx`: same loading handling; **first** require auth (unauthenticated → `/auth/login`), **then** require `isAdmin` (authenticated non-admin → `<Navigate to="/" replace />`). Order matters for AC6.
  - [x] Match the existing guard signature/style in `src/routes/guards/RequireHosAck.tsx` (`{ children }: { children: ReactNode }`, named export).
- [x] **Task 4 — Route tree with lazy + eager splitting (AC2)**
  - [x] Create `src/routes/index.tsx`. Lazy: `const Parking = lazy(() => import('../modules/parking/ParkingHome'))`, `Hos = lazy(() => import('../modules/hos/HosHome'))`, `Admin = lazy(() => import('../modules/admin/AdminHome'))`. Eager (static import): Auth (`/auth/login`), the auth `callback` (`/auth/callback`), Onboarding (`/onboarding`), Settings (`/settings`), and the Disclaimer route.
  - [x] **These target screens do not exist yet** — create minimal placeholder components so imports resolve and CI compiles (see Dev Notes — "stub screens are in scope"). Each stub: a tiny default-exported component rendering its name. Put feature stubs at their architecture-correct paths (`src/modules/parking/ParkingHome.tsx`, `src/modules/hos/HosHome.tsx`, `src/modules/admin/AdminHome.tsx`, `src/modules/auth/Login.tsx`, `src/modules/auth/AuthCallback.tsx`, `src/modules/onboarding/Onboarding.tsx`, `src/modules/settings/Settings.tsx`). HOS routes wrap in the existing `<HosShell>`; `/hos/*` stays behind `<RequireHosAck>` (stub already passes through).
  - [x] Wire guards: driver routes under `<RequireAuth>` (except the public set — `/auth/login`, `/auth/callback`, `/onboarding`, and any static disclaimer route); `/admin/*` under `<RequireAdmin>`.
  - [x] Confirm the `bundle-size` CI gate stays green — Parking/HOS/Admin must remain in **separate chunks** (the whole point of `lazy`); verify with `npm run build` that they emit distinct chunk files and the initial bundle stays ≤200KB gz (NFR-P6).
- [x] **Task 5 — Assemble `App.tsx` + simplify `main.tsx` (AC1)**
  - [x] Rewrite `App.tsx`: create the `QueryClient` (module-scope singleton, defaults `staleTime: 5 * 60_000`, `gcTime: 60 * 60_000` per architecture.md:697-700), render `<QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><Suspense fallback={…}><AppRoutes/></Suspense></AuthProvider></BrowserRouter></QueryClientProvider>`.
  - [x] `main.tsx` keeps `<ServiceWorkerManager />` (Story 1.9) and renders `<App />` inside `<StrictMode>`. Do not duplicate providers into `main.tsx`.
- [x] **Task 6 — Tests (AC5, AC6)**
  - [x] `src/routes/guards/RequireAuth.test.tsx`: render inside `<MemoryRouter>` with the auth store mocked to `authenticated` (renders children) and to `unauthenticated` (redirects to `/auth/login`). Also assert the `loading` state does not redirect.
  - [x] `src/routes/guards/RequireAdmin.test.tsx`: cover (a) admin → children, (b) authenticated non-admin → redirect `/`, (c) unauthenticated → redirect `/auth/login`. These three satisfy AC6 at the unit level.
  - [x] Mock the auth store (Zustand) rather than the network — set store state directly per test (architecture.md:692; matches the project's RTL+Vitest convention). Keep tests deterministic; no real Supabase calls.
  - [x] Run the full local gate: `npm run lint && npm run typecheck && npm run test && npm run build`. Optionally a Playwright smoke is **not** required by this story (E2E auth lands in 1.11).

## Dev Notes

### This is a skeleton story — stubs are in scope, not scope creep
AC2 imports `ParkingHome`, `HosHome`, `AdminHome`, plus eager Auth/Settings/Onboarding/callback/Disclaimer screens. **None of these exist** (`find src/modules` today: only `hos/HosShell.tsx`). The route tree cannot type-check or build against missing modules, so creating **minimal placeholder screens at their architecture-correct paths is required by this story**. Keep each stub trivial (a heading with the screen name) — feature epics replace them. Do *not* implement auth logic, parking search, etc. here; that's 1.11+ / Epics 2–4. The deliverable is a *compiling, navigable, guarded shell*.

### The `is_admin` claim is live in code but the prod hook is not yet enabled
Story 1.3 implemented `public.custom_access_token_hook` (stamps `is_admin: true` for allowlisted emails) and applied migrations to prod, **but the Supabase config toggle that activates the hook is still pending** (blocked on org-Owner / Shawn — see `1-3-admin-auth-domain.md` Dev Agent Record). Consequence for this story: a real logged-in admin's token may **not** carry `is_admin` until that toggle flips. Your guard must:
- Read `is_admin` from the **access-token claims** (`supabase.auth.getClaims()` → `claims.is_admin === true`), never from a profile column or client flag (FR60 / NFR-S4 — drivers must not be able to acquire admin by mutating client state).
- Treat **absent or non-`true`** as non-admin (fail closed).
- This means `/admin` correctly redirects everyone to `/` until the hook is enabled — that is the *safe* behavior and satisfies AC6's non-admin path. Note this in your completion notes so Huffy knows admin access is gated on the 1.3 toggle, not a bug here.

### Loading flicker — the subtle guard bug to avoid
`supabase.auth.getSession()` is async. If the guard reads `session === null` during that first tick, it will redirect an *actually-authenticated* user to `/auth/login` on every refresh before the session resolves. Carry an explicit `status: 'loading'` in the auth store, set it `authenticated`/`unauthenticated` only **after** the first `getSession()` resolves, and have guards render a neutral fallback (not a redirect) while `loading`. Test this state explicitly (Task 6).

### React Router v7 — library mode, not framework mode
Use `react-router` (single package, already installed `^7.15.0`) in **library mode**: `BrowserRouter` + `<Routes>`/`<Route>` + `<Navigate>` + `lazy`/`Suspense`. Do **not** adopt framework mode, `createBrowserRouter` data routers, loaders, or actions (architecture.md:231 — "Drop-in `BrowserRouter` patterns; no framework mode / loaders / actions"). The epic AC explicitly says `<BrowserRouter>`. For guard tests, use `MemoryRouter` with `initialEntries`.

### Provider order is load-bearing
`QueryClientProvider` → `BrowserRouter` → `AuthProvider` → `Suspense` (architecture.md:898-900). `AuthProvider` lives **inside** `BrowserRouter` because it (and the guards) use router hooks (`useNavigate`/`<Navigate>`). `QueryClientProvider` is outermost so any provider can issue queries. `Suspense` is innermost, wrapping only the lazy route tree, with a lightweight fallback (`<Skeleton/>` or `null`) — its fallback must not unmount the providers.

### Files this story TOUCHES vs CREATES
- **UPDATE** `src/App.tsx` — currently a static placeholder landing (`src/App.tsx:1-12`). Fully replaced by the provider tree. Nothing in it is worth preserving except the project name string if you want a fallback.
- **UPDATE** `src/main.tsx` — currently renders `<ServiceWorkerManager/>` + `<App/>` in `<StrictMode>` (`src/main.tsx:1-12`). **Preserve `<ServiceWorkerManager/>`** (Story 1.9 PWA registration — removing it breaks the SW/offline + Lighthouse PWA gate). Just ensure `<App/>` now owns the providers.
- **UPDATE** `src/vite-env.d.ts` — extend `ImportMetaEnv` with the `VITE_SUPABASE_*` vars if not already typed.
- **NEW** `src/core/supabase.ts`, `src/core/env.ts`, `src/core/store/auth.ts`, `src/routes/AuthProvider.tsx`, `src/routes/index.tsx`, `src/routes/guards/RequireAuth.tsx`, `src/routes/guards/RequireAdmin.tsx`, plus the placeholder screens under `src/modules/**` and the two guard test files.
- **REUSE, do not modify** `src/routes/guards/RequireHosAck.tsx` (stub already passes through) and `src/modules/hos/HosShell.tsx`.

### Testing standards
- Vitest + React Testing Library + `@testing-library/jest-dom` (configured via `src/test-setup.ts`). Co-locate `*.test.tsx` next to the unit (project convention — see `Disclaimer.test.tsx`, `HosShell.test.tsx`).
- Mock the **Zustand auth store** by setting state directly per test, not by mocking `fetch`/Supabase network. Deterministic, no real auth calls.
- Wrap guard renders in `<MemoryRouter>`; assert redirect by checking the rendered route output or by spying on the resulting location (a tiny `<Routes>` with a `/auth/login` and `/` element you can assert on is the cleanest).
- The `test` CI job runs `vitest run --passWithNoTests`; the two new guard suites must pass. `lint`, `typecheck`, `bundle-size`, `lighthouse` gates must all stay green.

### Project Structure Notes
- All new paths align with architecture.md:897-938 (the canonical source tree). No new top-level directories. `routes/` holds the route table + guards; `core/` holds the supabase client, env validator, and the Zustand `store/` slice; feature stubs live under `src/modules/<feature>/`.
- Variance from architecture's richer route layout (`DriverRoutes.tsx` / `AdminRoutes.tsx` / `PublicRoutes.tsx` subtree files, architecture.md:905-907): you may keep the route tree in a single `routes/index.tsx` for this skeleton if it reads cleanly, or split into those named files — either satisfies AC2. Prefer the split only if `index.tsx` gets unwieldy; document whichever you choose.
- `is_admin` enforcement here is **client-side routing only** (defense-in-depth UX). The *authoritative* enforcement is Supabase RLS + the `is_admin` JWT claim at the data layer (architecture.md:388) — the guard is not a security boundary on its own, and the story should not imply it is.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.10] — user story + 6 acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md:491-505] — routing strategy, lazy/eager split, bundle budget
- [Source: _bmad-output/planning-artifacts/architecture.md:897-938] — canonical source tree (App.tsx, routes/, guards/, core/store/)
- [Source: _bmad-output/planning-artifacts/architecture.md:692-700] — Zustand + TanStack Query conventions
- [Source: _bmad-output/planning-artifacts/architecture.md:381-388] — `is_admin` claim semantics + RLS enforcement
- [Source: _bmad-output/implementation-artifacts/1-3-admin-auth-domain.md] — `is_admin` hook implemented; **config enablement still pending (Shawn)**
- [Source: _bmad-output/implementation-artifacts/1-9-pwa-infrastructure.md] — `ServiceWorkerManager` mounted in `main.tsx` (must be preserved)
- [Source: src/routes/guards/RequireHosAck.tsx] — existing guard signature to mirror

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context) — dev-story workflow, 2026-06-14

### Debug Log References

- **Unit test isolation failure (then fixed):** first `npm test` run failed 4 guard assertions with "found multiple elements" — RTL's automatic DOM cleanup is not registered when vitest runs with `globals: false`, so repeated renders of the same redirect-target text accumulated in jsdom. Fixed by registering `afterEach(cleanup)` in `src/test-setup.ts` (canonical RTL+Vitest-without-globals setup). Re-run: 80/80 pass.
- **CI regression caught pre-merge:** `/` changed from a static landing page to an auth-gated redirect, which breaks the old smoke test; and the new `src/core/env.ts` throws on missing `VITE_SUPABASE_*`, which would white-screen the `e2e` and `lighthouse` CI jobs (they boot the app in a browser but had no Supabase env). Both addressed — see Completion Notes.

### Completion Notes List

- **All 6 ACs satisfied.** Provider tree (QueryClient → BrowserRouter → AuthProvider → Suspense) in `App.tsx`; lazy/eager route tree in `src/routes/index.tsx`; `RequireAuth` + `RequireAdmin` guards with full happy-path + redirect + loading-state test coverage. AC6 (domain isolation) is covered at the unit level by `RequireAdmin.test.tsx` (unauth `/admin`→/auth/login, non-admin `/admin`→/), which is the coverage Task 6 prescribes. The Playwright smoke does **not** exercise `/admin`; it verifies the broader routing skeleton boots and that an unauthenticated `/`→`/auth/login`.
- **`is_admin` is read from the access-token claim** via a pure, fail-closed decoder (`src/core/auth/claims.ts`), not a profile column — drivers cannot manufacture admin (FR60/NFR-S4). ⚠️ **Admin access is currently gated on the Story 1.3 auth-hook enablement** (still pending org-Owner / Shawn). Until that toggle flips, no token carries `is_admin`, so `/admin` correctly redirects everyone to `/`. This is the safe default, not a bug here — but `/admin` will stay inaccessible until 1.3 is finished.
- **Foundation files created beyond the guards** (required for the shell to boot): `src/core/supabase.ts` (typed anon client) and `src/core/env.ts` (boot-time env validation). These are named in architecture.md:915-918 and were not yet present.
- **Decisions / deviations from the story draft (all within intent):**
  - Derived `isAdmin` by **decoding** the JWT payload rather than calling `supabase.auth.getClaims()`. The story allowed either; decode is chosen because (a) this is a UX routing guard, not the security boundary — RLS is — so verification adds no real security, and (b) it avoids the documented `onAuthStateChange` re-entrancy deadlock from calling `supabase.auth.*` inside the listener. The decoder fails closed.
  - **Added Playwright e2e smoke tests** (story marked them optional). Justified: the old smoke test asserted the now-deleted landing page and would have failed CI; the rewrite verifies the new routing skeleton boots end-to-end.
  - **Edited `.github/workflows/ci.yml`** to give the `e2e` and `lighthouse` jobs non-secret placeholder `VITE_SUPABASE_*` values. Required because `env.ts` now fails fast on missing config; these jobs boot the app but hit no real backend. Real values live in Netlify env for deploys.
  - **Edited `src/test-setup.ts`** to register `afterEach(cleanup)` (see Debug Log).
- **Gates run locally — all green:** typecheck, lint, format:check, check:disclaimer-source, unit (80/80), build, size-limit (**149.63 KB gz < 200 KB**, NFR-P6 — Parking/HOS/Admin emit separate chunks), check:ftc, check:rods, e2e (2/2). `lighthouse` not runnable locally (needs lhci+Chrome serving) — relies on CI; app boot under placeholder env is proven by the e2e run.

### File List

**New:**
- `src/core/env.ts`
- `src/core/supabase.ts`
- `src/core/auth/claims.ts`
- `src/core/auth/claims.test.ts`
- `src/core/store/auth.ts`
- `src/routes/AuthProvider.tsx`
- `src/routes/index.tsx`
- `src/routes/guards/RequireAuth.tsx`
- `src/routes/guards/RequireAuth.test.tsx`
- `src/routes/guards/RequireAdmin.tsx`
- `src/routes/guards/RequireAdmin.test.tsx`
- `src/components/Placeholder.tsx`
- `src/modules/parking/ParkingHome.tsx`
- `src/modules/hos/HosHome.tsx`
- `src/modules/admin/AdminHome.tsx`
- `src/modules/auth/Login.tsx`
- `src/modules/auth/AuthCallback.tsx`
- `src/modules/onboarding/Onboarding.tsx`
- `src/modules/settings/Settings.tsx`
- `src/modules/legal/DisclaimerScreen.tsx`

**Modified:**
- `src/App.tsx` (static landing → provider tree)
- `src/vite-env.d.ts` (typed `ImportMetaEnv` for `VITE_SUPABASE_*`)
- `src/test-setup.ts` (register RTL `afterEach(cleanup)`)
- `tests/e2e/smoke.spec.ts` (rewritten for auth-gated routing)
- `.github/workflows/ci.yml` (placeholder Supabase env for `e2e` + `lighthouse` jobs)
- `_bmad-output/implementation-artifacts/1-10-provider-tree-routing-guards.md` (this story)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status tracking)

**Unchanged (verified, not modified):** `src/main.tsx` (already mounts `<ServiceWorkerManager/>` + `<App/>`), `src/routes/guards/RequireHosAck.tsx`, `src/modules/hos/HosShell.tsx`.

## Change Log

| Date | Change |
|------|--------|
| 2026-06-14 | Implemented Story 1.10: provider tree, lazy/eager route skeleton, `RequireAuth`/`RequireAdmin` guards, Supabase anon client + env validation, Zustand auth mirror, route stub screens. All local gates green. Status → review. |

### Review Findings

_Code review 2026-06-16 (3 adversarial layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor). 0 decision-needed, 4 patch, 4 deferred, 6 dismissed as noise/by-design._

- [x] [Review][Patch] No catch-all `*` route — unmatched URLs render a blank `<Routes>`; the architecture's `/admin/*` namespace is also not covered by `RequireAdmin` (only exact `/admin`). [src/routes/index.tsx] — FIXED 2026-06-16: `/admin` → `/admin/*` (guards the whole namespace), added `<Route path="*" element={<Navigate to="/" replace />} />`.
- [x] [Review][Patch] `AuthProvider` has two un-sequenced async writers and `getSession()` has no `.catch` — a rejected/late `getSession()` can pin `status` on `'loading'` forever (all guarded routes blank) or clobber a fresh `SIGNED_IN`. [src/routes/AuthProvider.tsx] — FIXED 2026-06-16: added `.catch` resolving to `unauthenticated`; `hydratedByEvent` flag stops a late `getSession` from clobbering an auth-event update.
- [x] [Review][Patch] `claims.test.ts` coverage gap — no cases for non-object JSON payloads (`null`/array/number), a garbage base64 middle segment, or multi-segment tokens. [src/core/auth/claims.test.ts] — FIXED 2026-06-16: added 3 cases (truthy-non-boolean `is_admin`, non-object JSON payloads, garbage base64 / non-JSON payload). 83/83 unit tests green.
- [x] [Review][Patch] Completion Note overstated AC6 coverage. [this story, Completion Notes] — FIXED 2026-06-16: reworded to state the smoke does not exercise `/admin`; AC6 is unit-covered per Task 6.
- [x] [Review][Defer] `<Suspense fallback={null}>` + no Error Boundary — blank screen during lazy-chunk load and white-screen on chunk-load failure (real for an offline trucker PWA). `fallback={null}` is spec-sanctioned; an error boundary around the lazy tree is the deferred piece. [src/App.tsx:279] — deferred, cross-cutting/out of skeleton scope
- [x] [Review][Defer] `/affiliate-disclosure` is an in-app React route, but architecture.md:505 designates it a Netlify-served static HTML URL — the SPA route may shadow/collide with the static file when static URLs land. [src/routes/index.tsx:913] — deferred, future Netlify-routing story
- [x] [Review][Defer] `/hos` registered as a single route, not the `/hos/*` subtree (`/hos/disclaimer`, `/hos/log`) the task text and architecture name. Sub-routes land in Epic 3. [src/routes/index.tsx:940-951] — deferred, Epic 3
- [x] [Review][Defer] Authenticated user hitting `/auth/login` or `/onboarding` is not redirected away (no "already-signed-in → /" logic). Real redirect lands in Story 1.11. [src/routes/index.tsx:910-912] — deferred, Story 1.11

**Dismissed (by-design / verified):** admin derived from an unverified client-decoded JWT (UX gate only; RLS is the authoritative boundary, documented FR60/NFR-S4); `env.ts` top-level `throw` white-screening on misconfig (intentional fail-fast, documented); CI placeholder Supabase env (necessary, non-secret, commented); `onAuthStateChange` callback not covered by the `active` flag (harmless — store is module-global); `decodeBase64Url` single-char-group throw (caught, fail-closed); `z.url()` API (verified valid on installed zod 4.4.3).
