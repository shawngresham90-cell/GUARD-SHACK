---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
status: 'complete'
lastStep: 8
completedAt: '2026-05-07'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-trucking.md
  - _bmad-output/planning-artifacts/product-brief-trucking-distillate.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-05-07.md
workflowType: 'architecture'
project_name: 'trucking'
user_name: 'huffy'
date: '2026-05-07'
audience: 'Huffy (sole developer); designed for direct, clean code handoff'
---

# Architecture Decision Document — Trucking Life with Shawn

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

_Audience note: Huffy is the sole developer and will implement directly. Decisions optimize for **clean handoff to code** — concrete tech choices, file/folder layout, exact contracts, and the shortest path to a v1 ship in 4–6 weeks of full-time work._

## Locked Inputs (pre-decided — do not re-litigate)

These are commitments Huffy carried in. Subsequent sections build *on* these, not *around* them.

### Deployment

- **Host:** Netlify, auto-deploy from `main` branch on GitHub.
- **Custom domain:** `app.truckinglifewithshawn.com` (owned).
- **Preview deploys:** every PR gets a Netlify preview URL for QA before merge.
- **Secrets:** Supabase `URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` live in Netlify environment configuration only. Service-role key is server-side (Edge Functions) only — never in client bundles. `.env.example` is committed; `.env` is git-ignored.

### Library stack (v1, locked)

| Concern | Library | Rationale |
|---|---|---|
| Build / dev server | **Vite** | Already implied; defaults only |
| Styling | **Tailwind CSS** | Locked |
| Routing | **React Router** | Locked |
| Server-state / data fetching | **TanStack Query (React Query)** | Caching layer over Supabase queries |
| Client state | **Zustand** | Lighter than Redux; fits PWA |
| Service worker | **Workbox** | Google toolkit; cache strategies per route |
| IndexedDB wrapper | **Dexie.js** | Used for HOS local-only store |
| Date math | **date-fns** | HOS clock calculations |
| Unit / component tests | **Vitest + React Testing Library** | |
| E2E | **Playwright** | Parking flow + HOS flow happy paths |
| Lint / format | **ESLint + Prettier** | Vite defaults; nothing more |

### Repo & dev-environment constraints

- **Solo dev across two machines** (Chromebook + Windows). Architecture must be Git-friendly: clean module boundaries, no machine-specific tooling, no monorepo orchestrators.
- **No monorepo tooling** (Nx, Turborepo, Lerna). Single PWA, single `package.json`, single `node_modules`.
- **Minimal build tooling.** Vite defaults + ESLint + Prettier. No custom Webpack, no Babel macros, no codegen pipelines beyond what Vite ships.
- **CI:** GitHub Actions wired up by Huffy after architecture lands. Design the CI structure so the gates from the PRD (Lighthouse Performance ≥90, Lighthouse Accessibility ≥95, bundle ≤200KB gz, FTC-disclosure render check, RODS-grid heuristic, lint, unit, E2E) can be added as discrete jobs without re-architecting the build.

## Project Context Analysis

### Requirements Overview

**Functional Requirements (66 total, 8 groups):**

| Group | FRs | Architectural shape |
|---|---|---|
| Auth & Onboarding | FR1–FR8 | Magic-link + Google OAuth via Supabase; no passwords; 2-question onboarding; iOS A2HS inline + Android `beforeinstallprompt` |
| Parking Discovery | FR9–FR18 | Direction-aware lookup, TPC prioritization, public-source fallback, SW offline cache, FTC disclosure adjacent to every CTA |
| HOS Tracker | FR19–FR31 | Regulated UI surface; tap-to-ack with min dwell; permanent footer; 90-day re-ack; 4-status plain-English; local-only IndexedDB; never transmit; no export v1 |
| Affiliate & Monetization Engine | FR32–FR37 | Multi-vertical JSON schema (parking/fuel/load-board/insurance); only TPC wired; ≤15-min config propagation; CI gate verifies disclosure-as-sibling |
| Stan Store Cross-Promotion | FR38–FR42 | Trigger-based (5-lookup, 10-hour, HOS-violation, settings panel); UTM that survives magic-link |
| Cohort & Attribution | FR43–FR46 | Day-1 vs cold-YouTube tagging at signup, persistent forever; verified-email export pipeline |
| Settings, Privacy & Account | FR47–FR55 | Settings + CCPA/CPRA Right-to-Know, Right-to-Delete, opt-out; public privacy + affiliate-disclosure URLs |
| Founder Admin & Operations | FR56–FR60 | Strictly distinct admin auth; slot config UI; per-slot impression+CTR analytics; trigger config |
| Cross-Cutting & Compliance | FR61–FR66 | Single-source disclaimer module; CI gates: FTC sibling, RODS-grid heuristic, Lighthouse Perf ≥90, A11y ≥95; no user-keyed analytics; no server-side parking-history persistence |

**Non-Functional Requirements (40 total):**

- **Performance (P1–P8):** Cold-open <2s 4G p75; first parking result <3s online / <1s cached p80; magic-link <30s median; HOS entry ≤5 taps / ≤10s; SW cache hit ≥90% (48h corridor); bundle ≤200KB gz; affiliate config propagation ≤15min p95; Lighthouse Perf ≥90.
- **Security (S1–S8):** Server-side-only secrets; TLS 1.2+; magic-link 15-min single-use; admin auth strictly distinct from driver; deletion ≤30d; aggregate-only analytics; SW/HOS cache partitioning enforced; no HOS data over the wire.
- **Scalability (SC1–SC5):** ≥75K monthly sessions; ≥30 lookups/s sustained, 5x burst; TPC rate-limit graceful fallback; ≥50 concurrent slots; TPC outage doesn't show "service down."
- **Accessibility (A1–A8):** WCAG 2.1 AA contrast; Lighthouse A11y ≥95; ≥48dp/44pt targets; keyboard focus; alt text; `prefers-reduced-motion`; labeled fields; UX token contrast verified pre-ship.
- **Integration & Reliability (I1–I6):** TPC-down → fallback in same lookup, no error toast; state-DOT outage → graceful degrade; OSM weekly refresh + cache; offline → cached results with timestamp; UTM survives auth roundtrip; aggregate logs only.
- **Compliance (C1–C5):** Affiliate-CTA → FTC disclosure sibling (CI); HOS footer disclaimer (runtime + lawyer review); no 24-cell HOS grid (CI); CCPA flows always reachable; canonical strings single-source.

### Five load-bearing architectural shapes

These are the constraints that drive structure rather than feature behavior:

1. **Two cache partitions, two trust domains.** Service-Worker Cache API (parking results, aggressive caching, ≥90% hit on 48h corridor) and IndexedDB-via-Dexie (HOS, local-only, 30-day auto-prune) live in strictly partitioned scopes. They aren't "different stores" — they're different *trust domains* with different retention rules and different security postures.

2. **HOS is a regulated UI surface, not just a feature.** Every HOS render path is governed by canonical-string discipline (FR61, NFR-C5), tap-to-ack with min dwell (FR19, FR20), permanent footer (FR21), 90-day re-ack (FR22), and a build-time RODS-grid heuristic (FR62). This forces: a single `disclaimers.ts` source-of-truth imported never inlined; an HOS layout shell that owns disclaimer placement (children can't opt out); and a CI snapshot that fails on any 24-cell horizontal grid in the HOS bundle.

3. **Affiliate engine: generic schema in v1, only TPC configured.** FR32 demands the slot schema accept parking/fuel/load-board/insurance shapes from day one. FR36 demands ≤15-min propagation via SW cache. FR35 demands every CTA render with a disclosure component as a sibling. The validation thesis is: adding affiliate #2 in <3 days post-v1. The architectural commitment is paying the genericity cost upfront.

4. **CI gates shape architecture, not just the pipeline.** FR35 forces a composed `<AffiliateCTA disclosure={…} />` pattern that the linter / snapshot test can statically verify. FR62 forces HOS components to avoid generated grid layouts that would false-positive. FR63/64 force route-level code-splitting so the bundle budget holds. NFR-P6 forces lazy-loading of Parking and HOS modules off the home shell. These aren't optimizations — they're contracts the architecture must support.

5. **Two strictly distinct auth domains.** Driver auth (magic-link, Google, no passwords) and Founder admin auth (NFR-S4: driver creds cannot reach admin under any circumstance). This is row-level / function-level enforcement at the Supabase layer, not a feature flag — admin endpoints are protected by an `is_admin` claim that drivers cannot acquire through the driver signup flow.

### Cross-cutting concerns inventory

| Concern | Surfaces touched | Mechanism |
|---|---|---|
| Disclaimer rendering (HOS / parking / FTC) | Every HOS screen; every affiliate CTA; every parking result set | Single-source `disclaimers.ts`; layout components own placement; CI snapshot verifies |
| Cohort tagging (Day-1 vs cold-YouTube) | Signup; persisted forever; all analytics events | UTM captured pre-magic-link → Supabase user metadata at insert |
| UTM survival across magic-link auth | Landing → email → return | URL-state preservation in magic-link redirect_to; cookie fallback |
| Analytics (aggregate-only) | Every event surface | Plausible (preferred) or PostHog anonymous mode wrapper; no user keys |
| Offline detection | Parking lookup UX; install prompts | `navigator.onLine` + Workbox SW status messages |
| Affiliate config propagation | Every affiliate CTA on every screen | `affiliate-config.json` boot fetch + Workbox stale-while-revalidate |
| Per-slot impression / CTR telemetry | Every affiliate CTA render and click | Lightweight Edge Function beacon, aggregated, no user keys |
| Privacy policy + affiliate disclosure links | App footer; onboarding; deletion flow | Static SSR-eligible routes; stable URLs |
| Verified-email export pipeline (FR46) | Founder-owned-channel ingestion | Scheduled Supabase Edge Function; only batch surface in v1 |

### Project Scale Assessment

- **Complexity level:** Medium. Most surfaces are execution; the regulated HOS surface and the generic-affiliate-engine-with-only-one-vertical-wired are the two non-trivial bits.
- **Primary technical domain:** Mobile-first PWA with offline-first parking + local-only regulated logbook + a small founder admin surface.
- **Architectural component groups (12 total):**
  - 7 front-end modules: Shell/Routing, Auth, Parking, HOS, Affiliate Slots, Admin, Settings/Privacy
  - 4 platform layers: SW/Cache (Workbox), IndexedDB (Dexie), Supabase data layer, Disclaimers/Compliance core
  - 1 server-side surface: Supabase Edge Functions (affiliate-key proxy, verified-email export, telemetry beacon)
- **Integrations at v1:** 4 outbound (TPC, state DOT APIs N-of-50, OSM Overpass, Stan Store deep-links), 2 internal (Supabase, magic-link email transport).

### Technical Constraints & Dependencies

Carried forward into all subsequent decisions:

- **Stack lock-ins** (Locked Inputs section): React + Vite + Tailwind + React Router + TanStack Query + Zustand + Workbox + Dexie + date-fns + Vitest + RTL + Playwright; ESLint + Prettier; no monorepo.
- **Platform lock-ins** (PRD): Supabase (auth, Postgres, Edge Functions); Netlify host; iOS Safari 16.4+ primary, Android Chrome latest 2; aggregate-only analytics; ≤200KB initial bundle gz.
- **Regulatory lock-ins** (PRD): no RODS-grid; tap-to-ack + min dwell; 90-day re-ack; canonical disclaimers single-source; CCPA flows live at install; FTC disclosure adjacent to every affiliate CTA.
- **Schedule lock-in:** 4–6 weeks of full-time Huffy for v1 covering parking + HOS + cross-cutting infra. The architecture must not require any unscheduled work to ship.

### Cross-cutting concerns that aren't obvious from the FR list

- **The audience device-mix survey is a build input, not just a launch gate.** iOS Safari evicts IndexedDB after 7 days of non-use. If iOS share is high, the "30-day client-side HOS retention" guarantee weakens and either (a) the disclaimer must mention this, or (b) export-on-demand becomes a v1 requirement, not v1.5+. Treat the survey as gating *which* architecture lands, not just whether to launch.
- **Affiliate config propagation is the only sub-15-min SLA in the system.** Everything else is request-time. This argues for a versioned `affiliate-config.json` with stale-while-revalidate via Workbox; the founder admin save flips a version field, and clients reconcile within one SW cache cycle.
- **The verified-email export pipeline (FR46) implies a scheduled Edge Function** — the only batch-shaped surface in v1. Calling it out now so it doesn't become an emergency add-on near launch.
- **The "founder admin is strictly distinct from driver auth" requirement is structural, not a feature toggle.** It's enforced at Supabase row-level / RPC-level — admin endpoints check an `is_admin` claim that drivers cannot acquire through any driver signup flow. This shapes the data model (a separate `admin_users` table or a hardened claim on `auth.users`) and the API surface (admin RPCs in their own schema).

## Starter Template Evaluation

### Primary Technology Domain

**Mobile-first PWA, single-page React, client-side static SPA hosted on Netlify, with Supabase as the only first-party backend (auth + Postgres + Edge Functions).**

### Options considered (rejected, with reason)

| Option | Why not |
|---|---|
| **Next.js / T3 Stack** | SSR-first, file-based routing forces App Router patterns, RSC mental model. PWA story is bolted on. Conflicts with React Router lock-in. |
| **Remix / RR v7 framework mode** | Wants its own server runtime and SSR model. Static-bundle-on-Netlify deploy doesn't need it. Library mode wins. |
| **Astro** | Content-first SSG; PWA app shell isn't its strength. |
| **Custom from scratch (no scaffold)** | Buys nothing — Vite's `react-ts` template is already minimal and PRD-aligned. |

### Selected Starter: `npm create vite@latest` with `react-ts` template

The official Vite scaffold is the canonical baseline for the locked stack. Smallest possible starting surface — no opinions to delete, no shims to fight.

**Rationale:** every locked library (React Router, TanStack Query, Zustand, Workbox, Dexie, Tailwind v4, Vitest, Playwright) is designed to layer cleanly on top of Vite + React + TypeScript. No starter prescribes the *combination* the PRD demands; trying to find a "perfect" starter for this stack delays Sprint 0 by a week with no upside.

**Initialization Command** (versions verified May 2026):

```bash
npm create vite@latest trucking-life-app -- --template react-ts
cd trucking-life-app
npm install
```

Requires Node ≥ 18; **Node 20 LTS** recommended for Netlify build parity.

### Layered libraries (concrete install commands)

```bash
# Routing
npm install react-router

# Server-state cache (Supabase queries)
npm install @tanstack/react-query

# Client state
npm install zustand

# Supabase client
npm install @supabase/supabase-js

# IndexedDB wrapper for HOS local storage
npm install dexie

# Date math for HOS clock calculations
npm install date-fns

# Service worker / PWA via Workbox
npm install -D vite-plugin-pwa

# Tailwind v4 (Vite-native plugin, no postcss config file needed)
npm install -D tailwindcss @tailwindcss/vite

# Test stack
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test

# Lint / format
npm install -D prettier eslint-config-prettier
```

### Architectural Decisions Provided / Implied by Starter

**Language & Runtime**
- **TypeScript** strict mode (Vite `react-ts` default).
- **React 19** (current stable; no v1 features warrant a downshift).
- **Node 20 LTS** for build parity with Netlify.

**Styling Solution**
- **Tailwind CSS v4** via the first-party `@tailwindcss/vite` plugin.
- No `tailwind.config.js`; tokens live in CSS via `@theme` directive (Mossy Oak palette + `#FFEB00` carry here in v1.05 UX pass).
- 5x faster full builds, ~100x faster incremental — fits the "minimal build tooling" constraint.

**Build Tooling**
- **Vite 6** with defaults; only Vite plugins added are `@tailwindcss/vite` and `vite-plugin-pwa`.
- Bundle splitting: route-level lazy-loading via `React.lazy`; Parking and HOS modules chunked off the home shell to hold ≤200KB gz initial bundle.
- No custom Webpack, no Babel macros, no codegen pipelines beyond what Vite ships.

**Routing**
- **React Router v7** in **library mode** (`react-router` single import; no framework mode / loaders / actions). Drop-in `BrowserRouter` patterns; future-compatible if framework mode ever wanted.

**Testing Framework**
- **Vitest** (reuses Vite's transformer — zero config drift between dev/build/test).
- **React Testing Library** + `@testing-library/user-event` + `@testing-library/jest-dom`.
- **Playwright** for E2E (parking happy path, HOS happy path, admin auth gate).

**Code Organization** (baseline; Step 4 will lock the contract)

```
trucking-life-app/
├── public/
│   ├── manifest.json
│   ├── icons/              # PWA icon set, including maskable
│   └── _redirects          # Netlify SPA fallback + stable URLs
├── src/
│   ├── main.tsx            # Entry; registers SW
│   ├── App.tsx             # Shell: provider tree (QueryClient, Auth, Router)
│   ├── routes/             # React Router route tree (lazy-loaded modules)
│   ├── modules/
│   │   ├── auth/           # Magic-link + Google + admin auth-domain split
│   │   ├── parking/        # TPC + fallback + offline cache hooks
│   │   ├── hos/            # IndexedDB layer + components + disclaimer shell
│   │   ├── affiliate/      # Slot engine, config fetch, render adapter
│   │   ├── admin/          # Founder admin surfaces (separate auth gate)
│   │   └── settings/       # Settings, CCPA flows, more-from-Shawn
│   ├── core/
│   │   ├── disclaimers.ts  # SOURCE OF TRUTH — canonical strings
│   │   ├── supabase.ts     # Supabase client (anon, browser-side)
│   │   ├── analytics.ts    # Plausible/PostHog wrapper, no user keys
│   │   ├── store/          # Zustand stores
│   │   └── types/          # Shared TS types incl. supabase-generated types
│   ├── components/         # Cross-module presentational components
│   └── styles/
│       └── index.css       # @import "tailwindcss"; + @theme tokens
├── tests/
│   ├── unit/
│   └── e2e/
├── supabase/
│   ├── migrations/         # SQL migrations (versioned, committed)
│   └── functions/          # Edge Functions
├── .github/
│   └── workflows/          # CI: lint, unit, e2e, lighthouse, bundle, FTC-render, RODS-grid
├── .env.example            # Committed — variable names only
├── vite.config.ts          # Vite + Tailwind plugin + PWA plugin
└── tsconfig.json
```

**Development Experience**
- HMR via Vite dev server.
- Vitest watch mode integrated with Vite's transformer.
- Netlify preview deploys on every PR for QA before merge.
- `.env.example` committed; `.env.local` gitignored.
- Prettier + ESLint run pre-commit (Husky optional in v1; can skip for solo-dev simplicity and rely on CI gates).

**Note:** Project initialization using the command above should be the **first implementation story** — a single PR producing a deployable empty shell on a Netlify preview URL. That's the definition of "Sprint 0 done."

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (block implementation):**
- Postgres schema + RLS strategy
- Driver-vs-admin auth domain enforcement
- Cache partition contracts (SW vs IndexedDB vs server)
- Affiliate slot config schema + propagation flow
- Edge Function inventory and contracts
- Netlify + Supabase environment wiring

**Important Decisions (shape the build):**
- Analytics tool choice + integration shape
- TPC integration via proxy (not client-direct)
- State DOT / OSM normalization location
- Magic-link email transport
- Bundle-splitting boundaries
- Error-handling pattern

**Deferred Decisions (post-MVP):**
- HOS export pipeline (v1.5+) — no surface to design until then
- Real-time anything (no v1 use case)
- Push notifications (v1.5+; iOS Safari ≥16.4 required)

### Data Architecture

**Database:** Supabase **Postgres 15** (managed). Single project; one logical database.

**Schema layout:**

| Schema | Purpose |
|---|---|
| `public` | Driver-facing tables, RLS-protected |
| `admin` | Founder admin tables and RPC functions, gated |
| `analytics_agg` | Aggregate, non-user-keyed metrics |

HOS data does **not** exist server-side; it lives exclusively in client IndexedDB.

**Tables (v1):**

| Table | Schema | Purpose | RLS |
|---|---|---|---|
| `auth.users` | (Supabase managed) | Account email, OAuth identity | (Supabase managed) |
| `profiles` | `public` | Cohort tag, OTR/local, default state, dark-mode pref, analytics opt-out | row owner only |
| `parking_lookups_recent` | `public` | Last ≤5 lookups per device hash; never user-keyed location history | own device hash only |
| `osm_truck_stops` | `public` | OSM Overpass extract refreshed weekly | anon read |
| `affiliate_slots` | `admin` | Slot config (vertical, image, copy, code, UTM, on/off, version) | admin write |
| `affiliate_slots_public` (view) | `public` | Read-only projection of `enabled=true`, no admin metadata | anon read |
| `affiliate_events_agg` | `analytics_agg` | Daily-aggregated impressions/clicks per slot; never user-keyed | admin read; service-role write |
| `stan_trigger_config` | `admin` | Trigger thresholds (5 lookups, 10 hours, etc.) | admin only |
| `email_export_queue` | `admin` | Verified-email export pipeline state | admin only |
| `admin_users` | `admin` | Admin allowlist (email, granted_at, granted_by) | admin only |
| `rate_limits` | `admin` | Sliding-window counters for TPC and beacon endpoints | service-role only |

**Critical (NFR-S8 + FR29 + FR65):** there is **no** `parking_history` and **no** `hos_entries` server-side. `parking_lookups_recent` caches *which corridor* was searched by a rotating device hash for ≤24h, never user-keyed.

**Migrations:** Supabase CLI (`supabase migration new`, `supabase db push`). Versioned and committed under `supabase/migrations/`. Linear, no branching. Preview Supabase project on PR; production via manual `supabase db push --linked`.

**Generated types:** `supabase gen types typescript --linked > src/core/types/supabase.ts` after every migration; committed to repo.

**Validation:**
- Server-side: Postgres CHECK constraints + RLS policies; trust the database.
- Client-side: **Zod** schemas on every Supabase response and every form input. (`npm install zod`.)

**Caching strategy (multi-tier):**

| Tier | Lives in | Purpose | Eviction |
|---|---|---|---|
| Browser memory | TanStack Query cache | Active-page data | Per-query staleTime/gcTime |
| Service Worker | Workbox cache `parking-results-v1` | Offline parking results | Stale-while-revalidate, 48h max |
| Service Worker | Workbox cache `affiliate-config-v1` | Slot configs | Stale-while-revalidate, ≤15min cycle |
| Service Worker | Workbox cache `static-assets-v1` | App shell, icons | Cache-first, version-keyed |
| Browser localStorage | Supabase auth session | Auth token | Until logout/expiry |
| Browser IndexedDB | Dexie database `hosdb` | HOS entries | Auto-prune entries >30 days old |

**Cache partition rule (NFR-S7):** Workbox cache namespaces and the Dexie `hosdb` database are strictly disjoint. Runtime assertion at SW activate fails install if an unexpected cache namespace appears.

### Authentication & Security

**Two auth domains, one Supabase project.**

**Driver auth (public consumers):**
- Magic-link email + Google OAuth via Supabase auth.
- No password fallback (FR4).
- Session token in `localStorage` (Supabase JS default).
- Magic-link single-use, 15-min expiry (NFR-S3).
- **UTM survival:** landing page persists `?utm_*` to `localStorage` *before* triggering magic-link; reads back at `/auth/callback` and writes to `profiles.cohort_tag`.

**Email transport:** Supabase built-in SMTP at v1 launch volume. Switch to **Resend** when monthly volume exceeds free quota (3-line dashboard change, no code).

**Admin auth (admin consumers):**
- Same magic-link flow, **but** the email must exist in `admin.admin_users`.
- Supabase auth hook calls `claim-admin` Edge Function on sign-in; if email is in `admin_users`, sets custom JWT claim `is_admin: true`.
- Driver-credentialed tokens have **no** `is_admin` claim and **cannot** acquire it through any driver signup flow. Insertion to `admin_users` is service-role-only.
- Admin UI lives at `/admin/*`; route guard checks JWT claim.

**RLS policy patterns:**
- Every `public.*` table has RLS enabled.
- Driver tables: `auth.uid() = user_id`.
- Admin tables: `auth.jwt() ->> 'is_admin' = 'true'`.
- Service-role bypass used only inside Edge Functions; never exposed to client.

**Secrets:**

| Secret | Lives in | Reason |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PLAUSIBLE_DOMAIN` | Netlify env (build-time inlined) | Public; safe in client bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function env | Never in client; never in Netlify |
| `TPC_AFFILIATE_KEY`, future affiliate keys | Supabase Edge Function env | Same |
| `EXPORT_PIPELINE_ENDPOINT` | Supabase Edge Function env | Same |

**TLS:** Supabase + Netlify enforce TLS 1.2+ by default (NFR-S2).

**Account deletion (FR50, NFR-S5):**
- `delete-account` Edge Function deletes `profiles`, `parking_lookups_recent`, then `auth.users` (cascade).
- Email confirmation queued.
- 30-day SLA covers any backups; user-visible deletion is synchronous.

### API & Communication Patterns

**Three surfaces, one transport (HTTPS over Supabase or static-asset):**

**Surface 1 — Supabase auto REST/PostgREST.** All driver CRUD on `profiles`, reads of `affiliate_slots_public`, etc., via `supabase-js`. TanStack Query wraps every call. **No custom REST endpoints for these.**

**Surface 2 — Supabase Edge Functions** (Deno runtime):

| Edge Function | Purpose | Secrets used |
|---|---|---|
| `parking-search` | Proxy TPC + state DOT + OSM, normalize, rank | `TPC_AFFILIATE_KEY`, optional state-DOT keys |
| `osm-refresh` | Weekly cron: refresh OSM Overpass POIs into `osm_truck_stops` | None (public OSM) |
| `delete-account` | CCPA Right-to-Delete | `SUPABASE_SERVICE_ROLE_KEY` |
| `email-export` | Daily cron: export verified-email batch to founder pipeline | `SUPABASE_SERVICE_ROLE_KEY`, `EXPORT_PIPELINE_ENDPOINT` |
| `affiliate-event-beacon` | Anon POST endpoint for impression/click events; aggregates daily | None (rate-limited) |
| `claim-admin` | Auth hook: stamps `is_admin` if email in `admin_users` | None |

**Surface 3 — Direct outbound from client** (no API key needed):
- Stan Store deep-links (plain redirect with UTM)
- YouTube/social links
- *Not* TPC, *not* state DOT — those go through `parking-search`.

**Design pattern:** REST through PostgREST + RPC through Edge Functions. **No GraphQL. No tRPC.** `supabase-js` is the typed client.

**Error contract (uniform across Edge Functions):**

```ts
type EdgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

TanStack Query exposes `error.code` to UI; UI maps to user-facing strings. Network/offline errors detected at Workbox layer; UI shows offline-banner state, never a toast error.

**Rate limiting:**
- TPC is the rate-sensitive surface. `parking-search` consults `rate_limits` table; on threshold, falls back to public sources (NFR-SC3, NFR-I1) with no user-visible failure.
- `affiliate-event-beacon` rate-limited per IP via in-memory counter (1000/min/IP).

**Logging:** Edge Functions log to Supabase logs, aggregate-only (NFR-I6). Client errors → Plausible anon events. **No Sentry-style tools at v1** unless configured to anon-mode.

### Frontend Architecture

**State boundaries:**

| State | Owner | Why |
|---|---|---|
| Server data (Supabase queries, parking results, affiliate config) | TanStack Query | Caching, refetch, stale-while-revalidate |
| Auth session | Supabase JS client + Zustand mirror | Token in localStorage; mirrored for sync access |
| UI state (modals, drawers, current screen) | Zustand | One store per module slice |
| Onboarding answers / prefs pre-sync | Zustand persisted to localStorage | Survives refresh before profile row |
| HOS entries, statuses, daily summaries | Dexie / IndexedDB | Local-only (FR29); via `useHosEntries` hook |
| Form state | Native `<form>` + `useState` | Forms are <5 fields; no form library at v1 |

**Composition contracts (carry into Step 5 as locked patterns):**

```tsx
// src/components/AffiliateCTA.tsx — the ONLY way to render an affiliate CTA
export function AffiliateCTA({ slot, children }: { slot: AffiliateSlot; children: ReactNode }) {
  return (
    <div data-testid="affiliate-cta-block" data-slot-id={slot.id}>
      {children}                  {/* the CTA button itself */}
      <Disclaimer kind="ftc" />   {/* enforced sibling — CI checks this */}
    </div>
  );
}

// src/modules/hos/HosShell.tsx — every HOS screen wraps this
export function HosShell({ children }: { children: ReactNode }) {
  return (
    <div data-hos-screen>
      {children}
      <Disclaimer kind="hosFooter" />
    </div>
  );
}
```

**CI gates leveraging these contracts:**
- **FR35 / FTC:** static AST scan + RTL snapshot test fails build if `<a>`/`<button>` matching affiliate URL patterns renders outside `<AffiliateCTA>`.
- **FR62 / RODS-grid:** snapshot scan against `data-hos-screen` subtrees fails build if any descendant produces a 24-cell horizontal grid.

**Routing strategy:**

```tsx
// src/routes/index.tsx (React Router v7 library mode)
const Parking = lazy(() => import('../modules/parking/ParkingHome'));
const Hos     = lazy(() => import('../modules/hos/HosHome'));
const Admin   = lazy(() => import('../modules/admin/AdminHome'));
// Settings, Auth, Disclaimers eagerly loaded
```

Driver routes: `/`, `/parking`, `/parking/:id`, `/hos`, `/hos/disclaimer`, `/hos/log`, `/settings`, `/settings/privacy`, `/auth/callback`, `/onboarding`.
Admin routes (gated): `/admin`, `/admin/slots`, `/admin/triggers`, `/admin/analytics`.
Static stable URLs (Netlify-served HTML): `/privacy`, `/affiliate-disclosure`.

**Performance / bundle optimization:**
- Initial bundle ≤ 200KB gz (NFR-P6); CI gate.
- Code split: Parking, HOS, Admin lazy. Auth + Shell + Settings eager.
- Images: lazy `loading="lazy"`; banners served from Supabase Storage CDN.
- Fonts: system stack, no web fonts at v1.

**Analytics: Plausible.** Cookieless, ~1KB script, no consent banner, default behavior already aggregate. PostHog is the v1.5+ upgrade if event-funnel needs grow. Custom events: parking lookup, HOS log, affiliate impression, affiliate click — tagged with cohort label, never user-keyed.

### Infrastructure & Deployment

**Hosting map:**

| Surface | Host |
|---|---|
| Static SPA + landing | Netlify (auto-deploy from `main`) |
| Postgres + Auth + Edge Functions + Storage | Supabase (managed) |
| Privacy / affiliate-disclosure pages | Netlify (static HTML in `public/`) |
| Email transport | Supabase SMTP (v1) → Resend when volume warrants |
| Analytics | Plausible (hosted plan) |
| OSM POI data | Cached weekly to Supabase Postgres via `osm-refresh` |

**Environments:**

| Env | URL | Supabase project | Branch |
|---|---|---|---|
| Local | `http://localhost:5173` | `supabase start` (local Docker) | feature branches |
| Preview | `*.netlify.app` | Supabase preview | every PR |
| Production | `app.truckinglifewithshawn.com` | Supabase prod | `main` |

`.env.example` (committed):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PLAUSIBLE_DOMAIN=
```

**CI/CD pipeline (single GitHub Actions workflow, parallel jobs):**

| Job | Purpose | Gate |
|---|---|---|
| `lint` | ESLint + Prettier check | Required |
| `typecheck` | `tsc --noEmit` | Required |
| `unit` | Vitest run | Required |
| `e2e` | Playwright (parking + HOS happy paths + admin gate) | Required on `main` |
| `bundle-size` | `vite build` + size-limit | ≤200KB gz (NFR-P6) |
| `lighthouse` | `vite build` + LHCI | Perf ≥90, A11y ≥95 (FR63, FR64, NFR-A2) |
| `ftc-disclosure` | Custom AST scan | Required (FR35) |
| `rods-grid` | Custom snapshot scan | Required (FR62) |

Netlify configured with required CI checks before deploy.

**Monitoring & observability:**
- Plausible — product metrics.
- Supabase logs — Edge Function errors, slow queries.
- Netlify deploy logs.
- Lighthouse CI trend tracking.
- No third-party APM in v1 unless explicitly anon-mode-configured.

**Scaling strategy:**
- Supabase Free covers v1 launch (<10K MAU); Pro tier ($25/mo) at threshold. DB auto-scales.
- Netlify Free covers v1 traffic.
- Edge Functions auto-scaled by Supabase.
- Plausible scales by event volume billing tier.

### Decision Impact Analysis

**Implementation sequence (story order):**

1. **Sprint 0** — scaffold, Netlify deploy wired, Supabase project provisioned, env vars wired, empty shell with `/auth/callback` route.
2. **Auth** — magic-link + Google + admin claim wiring + `claim-admin` Edge Function.
3. **Disclaimer core** — `disclaimers.ts`, `<Disclaimer>`, `<AffiliateCTA>`, `<HosShell>`, FTC + RODS-grid CI gates wired (red until disclaimers exist).
4. **Parking** — `parking-search` Edge Function + TPC integration + state DOT/OSM normalization + Workbox cache.
5. **HOS** — Dexie schema + plain-English status entry + tap-to-ack with min dwell + clock + summary.
6. **Affiliate engine** — `affiliate_slots` schema + admin UI + `affiliate-config.json` propagation + per-slot impression beacon.
7. **Settings + CCPA flows** — privacy panel, Right-to-Know/Delete, opt-out toggle, public privacy URL.
8. **Cohort tagging at signup** + `email-export` Edge Function (scheduled).
9. **Stan Store cross-promo triggers** (client-side Dexie counters).
10. **Lighthouse / bundle-size / E2E gates green** — release prep.

**Cross-component dependencies:**
- `disclaimers.ts` blocks Parking, HOS, Affiliate Engine.
- `<AffiliateCTA>` blocks Parking (TPC CTA), Affiliate slots, Stan Store cross-promo.
- `parking-search` Edge Function blocks Parking module.
- Auth (incl. admin claim) blocks Admin UI, Settings, Cohort tagging.
- `affiliate_slots` schema blocks Admin UI and any slot-rendering surface.

## Implementation Patterns & Consistency Rules

This section is the source of truth for code conventions across the project. The risk it prevents is solo-dev drift across two machines and CI gate failures from convention slips. Conventions tied to load-bearing architecture (disclaimers, AffiliateCTA, HosShell, RLS, error contract) are mandatory; the rest are firm but flexible.

### Naming Patterns

**Database (Postgres):**
- Tables: `snake_case`, **plural** (`profiles`, `affiliate_slots`, `osm_truck_stops`).
- Columns: `snake_case` (`user_id`, `created_at`, `cohort_tag`).
- Foreign keys: `<referenced_table_singular>_id` (`user_id`, `slot_id`).
- Indexes: `idx_<table>_<columns>` (`idx_affiliate_slots_enabled`).
- RLS policies: `<verb>_<table>_<who>` (`select_profiles_own`, `update_admin_slots_admin`).
- Timestamps: every table has `created_at TIMESTAMPTZ DEFAULT now()`; mutable tables also have `updated_at` maintained by trigger.

**TypeScript:**
- Files: `PascalCase.tsx` for components; `camelCase.ts` for everything else.
- Components: `PascalCase` (`<ParkingResultCard />`).
- Hooks: `use<Thing>` (`useHosEntries`, `useParkingResults`).
- Functions / variables: `camelCase`.
- Types / interfaces: `PascalCase`; never `IPrefixed`.
- Enums: avoid; prefer string-literal unions.
- Constants: `SCREAMING_SNAKE_CASE` at module level; `camelCase` if scoped.
- Edge Function names: `kebab-case` (`parking-search`, `claim-admin`, `affiliate-event-beacon`).

**Supabase auto-API:**
- Endpoints inherit table names: `/profiles`, `/affiliate_slots_public`. No customization.
- TanStack Query keys: array-based (`['parking', 'search', { lat, lng, dir }]`); never plain strings.

**JSON / wire format:**
- All wire JSON is `snake_case` (Postgres → PostgREST default; Edge Functions match).
- Single boundary mapper in `src/core/types/` converts `snake_case` JSON to `camelCase` TS interfaces only for high-traffic types (`ParkingResult`, `AffiliateSlot`); low-traffic types stay `snake_case` at the type level.
- Dates: ISO 8601 strings on the wire; `Date` objects in memory.
- Booleans: `true` / `false`; never `1` / `0`.
- IDs: UUIDv4, server-generated.

### Structure Patterns

**Module organization (hard rule):**

```
src/
  modules/<module>/
    components/        # Module-only components
    hooks/             # Module-only hooks
    api/               # Edge Function callers + Supabase queries
    types.ts           # Module-local types
    index.ts           # PUBLIC SURFACE — only exported symbols cross module boundaries
```

**Cross-module imports:**
- Components / hooks / utilities **must** import from `<module>/index.ts`.
- ESLint `no-restricted-imports` enforces this; CI fails on violation.
- Anything in `src/core/` is global and freely importable.

**Test location:**
- Unit / component tests: co-located with source (`ParkingHome.tsx` next to `ParkingHome.test.tsx`).
- E2E tests: centralized in `tests/e2e/`; spec files map 1:1 to PRD user journeys.
- CI gate scripts: `scripts/ci/`; runnable locally as `npm run check:ftc`, `npm run check:rods`.

**Static assets:**
- Icons + manifest in `public/`.
- TPC banner imagery uploaded by Shawn via admin UI; URL stored in `affiliate_slots.image_url`. Not committed.

**Environment files:**
- `.env.local` (gitignored) for dev.
- `.env.example` (committed) for every env var name.
- `vite.config.ts` rejects on missing required `VITE_*` at build time.

### Format Patterns

**Edge Function response (uniform):**

```ts
// src/core/types/edge.ts
export type EdgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

Status codes: `200` for both `ok: true` and `ok: false` (so client error handling is uniform); `4xx`/`5xx` only for transport-level failures.

**Error codes (lowercase snake_case):**
- `tpc_unavailable`, `rate_limited`, `not_authorized`, `not_found`, `validation_failed`, `internal_error`.
- Live in `src/core/types/errors.ts` as `const ERRORS = { ... } as const`.

**User-facing error rendering:**
- `errorCodeToMessage(code)` in `src/core/errors.ts` is the only place wire codes → display strings.

**Loading / async UX:**
- All async UI shows a placeholder within 100ms.
- Network errors **never** render as a toast in the parking flow (NFR-I1, FR9–FR18); fall through to fallback or cached state with a small banner.

### State Management Patterns

**Five state homes (no exceptions):**

| State | Owner |
|---|---|
| Server data (Supabase queries, parking results, slot configs) | TanStack Query |
| UI ephemeral (modal open/closed, hover, current tab) | React `useState` |
| Cross-component UI state | Zustand store, one slice per module |
| Auth session | Supabase JS client + Zustand mirror |
| HOS persistent data | Dexie / IndexedDB exclusively, via `useHosEntries()` |

**Zustand conventions:**
- One store per module slice; never a mega-store.
- Selectors over destructuring: `const status = useHosStore(s => s.currentStatus)`.
- Persist only what survives reload (`onboardingAnswers`, `darkMode`); never persist server data.

**TanStack Query conventions:**
- Query keys are arrays.
- Default `staleTime`: 5 min; `gcTime`: 1 hour. Override per-query as needed.
- Mutations invalidate by key prefix: `queryClient.invalidateQueries({ queryKey: ['affiliate'] })`.

### Communication Patterns

**Telemetry events** (Plausible custom events; lowercase snake_case, dot-separated namespace):
- `parking.lookup_started`, `parking.lookup_returned`, `parking.lookup_zero_result`
- `parking.tpc_cta_impression`, `parking.tpc_cta_clicked`
- `hos.disclaimer_acknowledged`, `hos.status_logged`, `hos.cross_promo_shown`
- `affiliate.slot_impression`, `affiliate.slot_clicked` (from `affiliate-event-beacon`)
- `auth.signup_started`, `auth.signup_completed` (cohort tag included as event prop, never as user identifier)

**Event payload contract:** `{ event_name, props: { ...non_pii_only } }`. **No** `user_id`, **no** raw email, **no** location coords.

### Process Patterns

**Disclaimer integrity (load-bearing):**
- All disclaimer strings live in `src/core/disclaimers.ts` as `as const` exports.
- Components import the constant; never inline string text matching disclaimer copy.
- Custom ESLint rule errors if a JSX string literal contains `"NOT AN ELD"`, `"FMCSA"`, or `"earns a commission"` outside `src/core/disclaimers.ts`.

**Affiliate CTA composition (load-bearing):**
- Any `<a>` or `<button>` whose `href` / onClick targets a known affiliate URL pattern must be a direct child of `<AffiliateCTA slot={…}>`.
- AST scan in `scripts/ci/check-ftc-disclosure.ts` walks the JSX tree and fails on violation.

**HOS shell composition (load-bearing):**
- Every route under `/hos/*` renders inside `<HosShell>`.
- First-launch `/hos/disclaimer` route blocks all other HOS routes via `useHosDisclaimerAck` hook (reads acknowledgedAt from Dexie).
- 90-day re-ack: same hook expires acknowledgement after 90 days.

**Authentication flow:**
- Magic-link: landing → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <callback_with_utm> } })` → callback reads token + UTM, persists cohort, navigates home.
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <callback_with_utm> } })`.
- All auth UI lives in `src/modules/auth/`; admin auth reuses the UI but checks `is_admin` claim post-callback.

### Enforcement Guidelines

**Hard CI gates (red = no merge):**

| Gate | Source |
|---|---|
| `lint` (ESLint + custom no-inline-disclaimer rule) | This document |
| `typecheck` (`tsc --noEmit`) | TypeScript |
| `unit` (Vitest, includes disclaimer source-of-truth assertion) | This document |
| `e2e` (Playwright happy paths) | PRD journeys 1, 2, 3, 4 |
| `bundle-size` (≤200KB gz initial) | NFR-P6 |
| `lighthouse` (Perf ≥90, A11y ≥95) | FR63, FR64 |
| `ftc-disclosure` (custom AST scan) | FR35, FR61 |
| `rods-grid` (custom snapshot scan) | FR62 |

**Soft conventions (lint warnings, not failures):**
- Prettier formatting drift.
- Unused exports.
- TODO/FIXME without an owner tag.

**Pattern updates:** patterns evolve; updates land in a PR titled `arch: pattern <X>` with rationale.

### Pattern Examples

**Good — affiliate CTA:**

```tsx
// src/modules/parking/components/TpcResultCard.tsx
import { AffiliateCTA } from '@/components/AffiliateCTA';

<AffiliateCTA slot={tpcSlot}>
  <a href={tpcSlot.bookingUrl} className="btn-primary">
    Book with SHAWN20 — $20 off
  </a>
</AffiliateCTA>
```

**Anti-pattern — fails CI:**

```tsx
// Inline disclaimer text — fails the disclaimer-integrity lint rule
<p>Trucking Life with Shawn earns a commission when you book...</p>

// CTA outside AffiliateCTA wrapper — fails the FTC AST scan
<a href="https://truckparkingclub.com/book?...">Book now</a>
```

**Good — HOS screen:**

```tsx
// src/modules/hos/HosLog.tsx
import { HosShell } from './HosShell';

export function HosLog() {
  return (
    <HosShell>
      <StatusEntry />
      <DailySummary />
    </HosShell>
  );
}
```

**Anti-pattern — fails CI:**

```tsx
// Forgot HosShell — no permanent footer rendered (FR21 violation)
export function HosLog() {
  return <><StatusEntry /><DailySummary /></>;
}

// 24-cell horizontal grid — RODS-grid heuristic flags it (FR62)
<div className="grid grid-cols-24">{hours.map(...)}</div>
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
trucking-life-app/
├── README.md                                # 1-page: setup, scripts, deploy URL, links
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json                       # tsc for vite.config.ts
├── vite.config.ts                           # Vite + Tailwind + PWA plugins
├── index.html                               # SPA entry
├── .env.example                             # Committed, names only
├── .env.local                               # Gitignored
├── .gitignore
├── .editorconfig
├── .prettierrc.json
├── .prettierignore
├── eslint.config.js                         # Flat config (ESLint v9)
├── playwright.config.ts
├── vitest.config.ts
├── netlify.toml                             # Build cmd, publish dir, redirects, headers
├── lhci.config.cjs                          # Lighthouse CI thresholds
├── .size-limit.json                         # Bundle-size budget
│
├── .github/
│   └── workflows/
│       └── ci.yml                           # 8 CI jobs (lint, typecheck, unit, e2e,
│                                            # bundle, lighthouse, ftc, rods)
│
├── public/
│   ├── manifest.json                        # PWA manifest (name, icons, theme color)
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable-512.png
│   ├── _redirects                           # Netlify SPA fallback + stable URLs
│   ├── privacy.html                         # Static, lawyer-reviewed (FR53)
│   ├── affiliate-disclosure.html            # Static, lawyer-reviewed (FR54)
│   └── robots.txt
│
├── scripts/
│   └── ci/
│       ├── check-ftc-disclosure.ts          # AST scan (FR35)
│       ├── check-rods-grid.ts               # Snapshot scan (FR62)
│       └── check-disclaimer-source.ts       # Asserts no inline disclaimer strings
│
├── supabase/
│   ├── config.toml                          # Supabase CLI config
│   ├── migrations/
│   │   ├── 0001_init_schemas.sql            # Create `admin`, `analytics_agg` schemas
│   │   ├── 0002_profiles.sql                # `public.profiles` + RLS
│   │   ├── 0003_admin_users.sql             # `admin.admin_users` + claim_admin function
│   │   ├── 0004_affiliate_slots.sql         # Table + view + RLS
│   │   ├── 0005_stan_trigger_config.sql
│   │   ├── 0006_parking_lookups_recent.sql
│   │   ├── 0007_osm_truck_stops.sql
│   │   ├── 0008_email_export_queue.sql
│   │   ├── 0009_affiliate_events_agg.sql
│   │   ├── 0010_rate_limits.sql
│   │   └── 0011_auth_hooks.sql              # Supabase auth hooks
│   ├── seed.sql                             # Local dev seed
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   ├── edgeResult.ts                # `EdgeResult<T>` + helpers
│       │   ├── rateLimit.ts                 # Sliding-window helper
│       │   └── errors.ts                    # Error code constants (mirror of client)
│       ├── parking-search/
│       │   ├── index.ts
│       │   ├── tpc.ts                       # TPC API client
│       │   ├── stateDot.ts                  # State DOT API normalization
│       │   ├── osm.ts                       # OSM Postgres lookup
│       │   ├── normalize.ts                 # Heterogeneous → ParkingResult
│       │   └── rank.ts                      # Direction-aware sort, TPC-priority
│       ├── osm-refresh/
│       │   ├── index.ts                     # Weekly cron entry point
│       │   └── overpass.ts                  # Overpass API client + parser
│       ├── delete-account/
│       │   └── index.ts                     # CCPA Right-to-Delete (FR50)
│       ├── email-export/
│       │   └── index.ts                     # Daily cron, founder pipeline (FR46)
│       ├── affiliate-event-beacon/
│       │   └── index.ts                     # Anon impression/click POST (FR37)
│       └── claim-admin/
│           └── index.ts                     # Auth hook, sets is_admin claim
│
├── src/
│   ├── main.tsx                             # Entry; provider tree mount; SW register
│   ├── App.tsx                              # Shell: <BrowserRouter> + <QueryClientProvider>
│   │                                        #        + <AuthProvider> + <Suspense>
│   ├── vite-env.d.ts
│   │
│   ├── routes/
│   │   ├── index.tsx                        # Route table (lazy + eager)
│   │   ├── DriverRoutes.tsx                 # Driver route subtree
│   │   ├── AdminRoutes.tsx                  # Admin route subtree (gated)
│   │   ├── PublicRoutes.tsx                 # /onboarding, /auth/callback
│   │   └── guards/
│   │       ├── RequireAuth.tsx              # Driver auth gate
│   │       ├── RequireAdmin.tsx             # is_admin JWT claim gate (FR60)
│   │       └── RequireHosAck.tsx            # 90-day re-ack gate (FR22)
│   │
│   ├── core/
│   │   ├── disclaimers.ts                   # SOURCE OF TRUTH (FR61, NFR-C5)
│   │   ├── supabase.ts                      # Client init (anon)
│   │   ├── analytics.ts                     # Plausible wrapper (NFR-S6)
│   │   ├── errors.ts                        # errorCodeToMessage
│   │   ├── env.ts                           # Validates VITE_* presence at boot
│   │   ├── store/
│   │   │   ├── auth.ts                      # Zustand auth slice
│   │   │   ├── ui.ts                        # Cross-cutting UI state
│   │   │   └── prefs.ts                     # Persisted prefs (dark mode, OTR/local)
│   │   ├── types/
│   │   │   ├── supabase.ts                  # Generated by `supabase gen types`
│   │   │   ├── edge.ts                      # EdgeResult<T> + shared edge types
│   │   │   ├── errors.ts                    # ERRORS const + ErrorCode union
│   │   │   ├── parking.ts                   # ParkingResult + AffiliateSlot types
│   │   │   └── hos.ts                       # HOS Dexie-side types
│   │   └── ci-helpers/
│   │       └── markAffiliateUrl.ts          # Helper used by AST scan
│   │
│   ├── components/
│   │   ├── AffiliateCTA.tsx                 # Composition contract (FR15, FR34, FR35)
│   │   ├── Disclaimer.tsx                   # Single render path for all disclaimer kinds
│   │   ├── OfflineBanner.tsx                # navigator.onLine + SW msg
│   │   ├── Footer.tsx                       # Privacy + disclosure + version
│   │   ├── Skeleton.tsx                     # Loading placeholder
│   │   └── Layout.tsx                       # App-wide shell
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── MagicLinkForm.tsx
│   │   │   │   ├── GoogleSignInButton.tsx
│   │   │   │   └── AuthCallback.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useUtmCapture.ts         # Persist UTM pre-magic-link (FR42, NFR-I5)
│   │   │   ├── api/
│   │   │   │   └── authApi.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── onboarding/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   └── TwoQuestionFlow.tsx      # OTR/local + start state (FR5)
│   │   │   └── hooks/
│   │   │       └── useOnboarding.ts
│   │   │
│   │   ├── parking/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── ParkingHome.tsx          # "Find Parking Ahead" (FR9)
│   │   │   │   ├── ParkingResultsList.tsx   # TPC-prioritized list (FR10)
│   │   │   │   ├── TpcResultCard.tsx        # Wraps <AffiliateCTA> (FR13–FR15)
│   │   │   │   ├── PublicSourceCard.tsx     # Visually distinct (FR12)
│   │   │   │   ├── PublicSourceBanner.tsx   # "No TPC ahead — backup plan" (FR12, J2)
│   │   │   │   ├── ParkingDetail.tsx        # Photos, gate hours, lighting (FR13)
│   │   │   │   └── ParkingDisclaimer.tsx    # <Disclaimer kind="parking"> (FR17)
│   │   │   ├── hooks/
│   │   │   │   ├── useParkingResults.ts     # TanStack Query wrapper
│   │   │   │   ├── useDirectionOfTravel.ts  # GeoLocation API + heading
│   │   │   │   └── useOfflineParking.ts     # SW cache fallback (FR16)
│   │   │   ├── api/
│   │   │   │   └── parkingApi.ts            # Calls parking-search Edge Function
│   │   │   └── types.ts
│   │   │
│   │   ├── hos/
│   │   │   ├── index.ts
│   │   │   ├── HosShell.tsx                 # Permanent footer shell (FR21)
│   │   │   ├── components/
│   │   │   │   ├── HosHome.tsx              # Module home; redirect-to-/log if ack'd
│   │   │   │   ├── HosDisclaimer.tsx        # Tap-to-ack with min dwell (FR19, FR20)
│   │   │   │   ├── HosLog.tsx               # Plain-English status entry (FR23, FR24)
│   │   │   │   ├── StatusEntry.tsx          # 4 toggles + optional note
│   │   │   │   ├── DailySummary.tsx         # Tabular text — NO grid (FR26, FR27)
│   │   │   │   ├── HosClock.tsx             # Real-time remaining cycle (FR25)
│   │   │   │   └── WeeklySummaryNudge.tsx   # In-app banner at day 7 (FR30)
│   │   │   ├── hooks/
│   │   │   │   ├── useHosEntries.ts         # Dexie query
│   │   │   │   ├── useHosClock.ts           # date-fns calculations
│   │   │   │   ├── useHosDisclaimerAck.ts   # 90-day re-ack tracker (FR22)
│   │   │   │   ├── useHosViolationWarning.ts# Triggers Save-Your-CDL (FR40)
│   │   │   │   └── useHosCrossPromoTrigger.ts# 10-hour Driver's Mind (FR39)
│   │   │   ├── db/
│   │   │   │   ├── hosdb.ts                 # Dexie schema
│   │   │   │   ├── hosRepository.ts         # CRUD + 30-day prune (FR28)
│   │   │   │   └── hosCalc.ts               # Status math
│   │   │   └── types.ts
│   │   │
│   │   ├── affiliate/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   └── SlotRenderer.tsx         # JSON-config render (FR32, FR33)
│   │   │   ├── hooks/
│   │   │   │   ├── useAffiliateConfig.ts    # SWR fetch of affiliate-config.json (FR36)
│   │   │   │   └── useTrackImpression.ts    # Beacon to affiliate-event-beacon (FR37)
│   │   │   ├── api/
│   │   │   │   └── affiliateApi.ts
│   │   │   └── types.ts                     # AffiliateSlot, Vertical union
│   │   │
│   │   ├── stan-promo/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── CarnivoreTriggerCard.tsx # 5-lookup trigger (FR38)
│   │   │   │   ├── DriversMindTriggerCard.tsx # 10-hour trigger (FR39)
│   │   │   │   ├── SaveYourCdlTriggerCard.tsx# HOS-violation trigger (FR40)
│   │   │   │   └── MoreFromShawnPanel.tsx   # Settings link out (FR41)
│   │   │   └── hooks/
│   │   │       └── useStanTrigger.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── AdminHome.tsx            # Admin landing (FR56)
│   │   │   │   ├── SlotEditor.tsx           # Slot config CRUD (FR57)
│   │   │   │   ├── SlotAnalytics.tsx        # Per-slot impression+CTR (FR58)
│   │   │   │   └── TriggerEditor.tsx        # Stan trigger config (FR59)
│   │   │   ├── hooks/
│   │   │   │   ├── useAdminSlots.ts
│   │   │   │   └── useAdminAnalytics.ts
│   │   │   └── api/
│   │   │       └── adminApi.ts
│   │   │
│   │   └── settings/
│   │       ├── index.ts
│   │       ├── components/
│   │       │   ├── SettingsHome.tsx          # Account + prefs (FR47, FR48)
│   │       │   ├── PrivacyPanel.tsx          # CCPA hub (FR49–FR52)
│   │       │   ├── RightToKnow.tsx           # Data summary (FR49)
│   │       │   ├── RightToDelete.tsx         # Account deletion (FR50, FR51)
│   │       │   ├── AnalyticsOptOut.tsx       # Opt-out toggle (FR52)
│   │       │   └── MoreFromShawn.tsx         # YouTube + Stan catalog (FR41)
│   │       └── hooks/
│   │           └── useDeleteAccount.ts
│   │
│   ├── styles/
│   │   ├── index.css                         # @import "tailwindcss"; + @theme
│   │   └── tokens.css                        # Mossy Oak + #FFEB00 (Sally fills v1.05)
│   │
│   └── pwa/
│       ├── sw.ts                             # Workbox SW (precache + runtime caching)
│       ├── cacheNames.ts                     # Centralized cache namespace constants
│       └── installPrompt.ts                  # iOS A2HS + Android beforeinstallprompt
│
└── tests/
    ├── e2e/
    │   ├── parking-happy-path.spec.ts        # Journey 1
    │   ├── parking-fallback.spec.ts          # Journey 2 (the disaster prevented)
    │   ├── hos-first-launch.spec.ts          # Journey 3 (disclaimer + log)
    │   ├── auth-warm-cohort.spec.ts          # Journey 4 (Stan Store buyer)
    │   ├── admin-slot-edit.spec.ts           # Journey 5 (founder ops)
    │   └── fixtures/
    │       └── tpcMockResponses.ts
    └── helpers/
        ├── renderWithProviders.tsx
        └── mockDexie.ts
```

### Architectural Boundaries

**Module public surface rule:**
- Every `src/modules/<name>/index.ts` exports the module's public API.
- Imports across modules go through `index.ts` only; reaching into `@/modules/parking/components/...` from outside the module fails ESLint `no-restricted-imports`.
- `src/core/*` is global; any module may import freely.
- `src/components/*` is global cross-module presentation; no business logic.

**API boundaries (ownership):**

| Surface | Owner | Access |
|---|---|---|
| Driver REST (PostgREST auto): `profiles`, `affiliate_slots_public` | Supabase | `supabase-js`, RLS-enforced |
| Edge Function REST: `parking-search`, `osm-refresh`, `delete-account`, `email-export`, `affiliate-event-beacon`, `claim-admin` | `supabase/functions/` | `fetch` from client or scheduled cron |
| Admin RPC (Postgres functions in `admin` schema) | Postgres + RLS | Admin-only via `is_admin` JWT claim |
| Static stable URLs: `/privacy`, `/affiliate-disclosure` | Netlify static | Plain HTML, never re-rendered |

**Component boundaries (composition contracts):**
- `<AffiliateCTA>` is the only legal parent of an affiliate URL `<a>`/`<button>`. AST scan enforces (FR35).
- `<HosShell>` is the only legal parent for routes under `/hos/*`. PR review + 90-day-ack guard (FR21, FR22).
- `<Disclaimer kind="...">` is the only path that renders disclaimer copy (FR61).

**Data boundaries:**
- Server-side persistent: only schemas listed in Section 4.1. New tables require a migration + an architecture-doc PR.
- Service Worker cache: namespaces defined in `src/pwa/cacheNames.ts`; runtime assertion at SW activate.
- IndexedDB (`hosdb`): only HOS module touches it; access via `hosRepository.ts` only.
- localStorage: auth session, UTM stash, persisted prefs. Nothing else.

### Requirements to Structure Mapping

**Authentication & Onboarding (FR1–FR8):**
`src/modules/auth/`, `src/modules/onboarding/`, `supabase/functions/claim-admin/`, `src/pwa/installPrompt.ts`.

**Parking Discovery (FR9–FR18):**
`src/modules/parking/`, `supabase/functions/parking-search/`, `src/pwa/sw.ts`.

**HOS Tracker (FR19–FR31):**
`src/modules/hos/` (entirely). FR31 = absent feature, intentionally not present anywhere.

**Affiliate & Monetization Engine (FR32–FR37):**
`src/modules/affiliate/`, `supabase/migrations/0004_affiliate_slots.sql`, `supabase/functions/affiliate-event-beacon/`, `src/components/AffiliateCTA.tsx`, `scripts/ci/check-ftc-disclosure.ts`, Workbox SWR cache for `affiliate-config.json`.

**Stan Store Cross-Promotion (FR38–FR42):**
`src/modules/stan-promo/`, `src/modules/auth/hooks/useUtmCapture.ts`.

**Cohort & Attribution (FR43–FR46):**
`src/modules/auth/components/AuthCallback.tsx`, Plausible event props, `supabase/functions/email-export/`.

**Settings, Privacy & Account (FR47–FR55):**
`src/modules/settings/`, `supabase/functions/delete-account/`, `public/privacy.html`, `public/affiliate-disclosure.html`.

**Founder Admin & Operations (FR56–FR60):**
`src/modules/admin/`, `src/routes/guards/RequireAdmin.tsx`, `supabase/migrations/0003_admin_users.sql` + `0011_auth_hooks.sql`.

**Cross-Cutting & Compliance (FR61–FR66):**
`src/core/disclaimers.ts`, `scripts/ci/check-rods-grid.ts`, `lhci.config.cjs`, absence of `parking_history` table, `src/core/analytics.ts`.

### Integration Points

**Internal communication:**
- UI → server: TanStack Query → `supabase-js` (driver) or `fetch('/functions/v1/<fn>')` (Edge Functions).
- UI → local store: Zustand selectors.
- HOS UI → IndexedDB: `useHosEntries` hook → `hosRepository` → Dexie.
- Service Worker → UI: `postMessage` for cache updates; `navigator.onLine` for offline.

**External integrations:**

| Integration | Direction | Path | Reliability fallback |
|---|---|---|---|
| TPC affiliate API | Outbound | `parking-search` → TPC | Public-source results in same request (NFR-I1) |
| State DOT rest-area APIs (per state) | Outbound | `parking-search` → state DOT | Skip failing state, return rest (NFR-I2) |
| OSM Overpass | Outbound (weekly cron) | `osm-refresh` → Overpass | Last cached extract serves until next refresh (NFR-I3) |
| Stan Store deep-links | Outbound | Client → `stan.store/...?utm=` | None — cosmetic links |
| Founder email-export endpoint | Outbound (daily cron) | `email-export` → endpoint | Retry; queue persists in `email_export_queue` |
| Supabase auth hook (claim-admin) | Inbound from Supabase | Auth → `claim-admin` | Hook failure blocks login; logs alert |

**Data flow (Journey 1, parking lookup):**

1. User taps "Find Parking Ahead" in `<ParkingHome>`.
2. `useParkingResults` issues TanStack Query.
3. `parkingApi.search(params)` POSTs `/functions/v1/parking-search`.
4. Edge Function: rate-limit check → TPC API → state DOT (per relevant state) → `osm_truck_stops` Postgres → `normalize.ts` → `rank.ts`.
5. Returns `EdgeResult<ParkingResult[]>`.
6. Workbox SW intercepts response, writes to `parking-results-v1` cache (FR16).
7. UI renders `<ParkingResultsList>`; TPC-flagged results render via `<TpcResultCard>` → `<AffiliateCTA>` → FTC disclosure rendered as sibling (FR15).
8. Plausible tracks `parking.lookup_returned`.

### File Organization Patterns

**Configuration files:** root only. No nested config directories.

**Source organization:** module-first under `src/modules/`, cross-cutting under `src/core/` and `src/components/`. No `src/services/`, no `src/utils/` (junk-drawer anti-patterns).

**Test organization:** unit tests co-located (`Foo.tsx` ↔ `Foo.test.tsx`); E2E centralized in `tests/e2e/`.

**Asset organization:** public icons in `public/icons/`; affiliate banner images uploaded by Shawn to Supabase Storage, never committed; manifest in `public/manifest.json`.

### Development Workflow Integration

**Dev server:**
- `npm run dev` → Vite at `localhost:5173`
- `supabase start` → local Postgres + Auth + Edge Functions at `localhost:54321`
- Local `.env.local` points `VITE_SUPABASE_URL` at `localhost:54321`.

**Build:**
- `npm run build` → Vite production build → `dist/`.
- Service Worker emitted by `vite-plugin-pwa` into `dist/sw.js`.
- Bundle-size CI gate runs against `dist/assets/index-*.js` gzipped.

**Deploy:**
- Netlify auto-deploy on push to `main`: runs `npm run build`, publishes `dist/`, applies `_redirects`.
- Supabase migrations applied manually via `supabase db push --linked` for production — kept deliberate, not auto-coupled to Netlify deploy.
- Preview deploys: every PR → Netlify preview URL → preview Supabase project (separate env vars).

## Architecture Validation Results

### Coherence Validation ✅

**Decision compatibility:** All technology choices compose cleanly. React 19 + Vite 6 + React Router v7 (library mode) + TanStack Query + Zustand + Workbox + Dexie + Tailwind v4 is a known-good stack with no version conflicts. Supabase JS client, Supabase CLI, and Edge Function runtime (Deno) all support React 19 idioms and the Postgres 15 features used. Netlify's static-site model fits the SPA build without extra adapters.

**Pattern consistency:** Naming conventions align with the stack (snake_case in Postgres, camelCase in TS, kebab-case in Edge Function names). Module-first organization fits React's component model and Vite's tree-shaking. CI gates (FTC AST scan, RODS-grid heuristic, disclaimer-source assertion) all key on patterns codified in the composition contracts (`<AffiliateCTA>`, `<HosShell>`, `<Disclaimer>`, `core/disclaimers.ts`).

**Structure alignment:** The directory tree maps every FR group to a single owner module. No FR has split ownership. Cross-cutting concerns (disclaimers, auth, analytics) live in `src/core/` and are imported, never duplicated. Boundaries are enforceable via ESLint `no-restricted-imports`.

### Requirements Coverage Validation ✅

**Functional Requirements coverage (66 of 66):**

| Group | FRs | Owner location | Status |
|---|---|---|---|
| Auth & Onboarding | FR1–FR8 | `src/modules/auth/`, `src/modules/onboarding/`, `supabase/functions/claim-admin/`, `src/pwa/installPrompt.ts` | ✅ all 8 covered |
| Parking Discovery | FR9–FR18 | `src/modules/parking/`, `supabase/functions/parking-search/`, `src/pwa/sw.ts` | ✅ all 10 covered |
| HOS Tracker | FR19–FR31 | `src/modules/hos/` + `core/disclaimers.ts` | ✅ all 13 covered (FR31 = absent feature, intentional) |
| Affiliate & Monetization | FR32–FR37 | `src/modules/affiliate/`, `src/components/AffiliateCTA.tsx`, `supabase/functions/affiliate-event-beacon/`, `scripts/ci/check-ftc-disclosure.ts` | ✅ all 6 covered |
| Stan Store Cross-Promo | FR38–FR42 | `src/modules/stan-promo/`, `src/modules/auth/hooks/useUtmCapture.ts` | ✅ all 5 covered |
| Cohort & Attribution | FR43–FR46 | `AuthCallback`, `profiles` table, `supabase/functions/email-export/` | ✅ all 4 covered |
| Settings, Privacy & Account | FR47–FR55 | `src/modules/settings/`, `supabase/functions/delete-account/`, `public/privacy.html`, `public/affiliate-disclosure.html` | ✅ all 9 covered |
| Founder Admin | FR56–FR60 | `src/modules/admin/`, `RequireAdmin` guard, admin schema + auth hook | ✅ all 5 covered |
| Cross-Cutting & Compliance | FR61–FR66 | `core/disclaimers.ts`, CI gates, schema design (no `parking_history`), `core/analytics.ts` | ✅ all 6 covered |

**Non-Functional Requirements coverage (40 of 40):**

| Category | NFRs | Coverage |
|---|---|---|
| Performance (P1–P8) | 8 | ✅ Bundle size limit, lazy loading, Workbox SWR cache, Edge Function latency, lhci CI gate. NFR-P4 (≤5 taps / ≤10s for HOS entry) is a UX constraint Sally validates in v1.05; architecture supports it. |
| Security (S1–S8) | 8 | ✅ Server-side-only secrets, TLS defaults, magic-link config, two-domain auth via JWT claim, deletion flow, aggregate analytics, cache partitioning, no-HOS-over-wire. |
| Scalability (SC1–SC5) | 5 | ✅ Supabase Pro tier headroom, autoscale Edge Functions, rate-limit table + fallback, schema supports ≥50 slots, TPC-outage no-service-down via fallback. |
| Accessibility (A1–A8) | 8 | ✅ Lighthouse A11y CI gate covers contrast/focus/labels/alt; tokens validated in v1.05 UX pass; `prefers-reduced-motion` honored in CSS. |
| Integration & Reliability (I1–I6) | 6 | ✅ TPC fallback in same request, state-DOT degrade, OSM weekly cache, offline cached-results UX, UTM survival, aggregate logs. |
| Compliance (C1–C5) | 5 | ✅ FTC sibling CI, HOS footer + lawyer review, RODS-grid CI, CCPA reachable, single-source disclaimers. |

### Implementation Readiness Validation ✅

**Decision completeness:** Every critical decision has a concrete answer (no "TBD"), a named owner location, and a verified-current technology version. Edge Function inventory enumerated, schema enumerated, RLS pattern named, error contract typed.

**Structure completeness:** The full file tree in Project Structure names every file Huffy needs to ship at v1, including CI scripts, SQL migrations, and Edge Function source files. No "etc." placeholders.

**Pattern completeness:** Naming, file structure, error format, state homes, communication patterns, process patterns, enforcement guidelines, and worked examples are all written down.

### Gap Analysis Results

**Critical Gaps (block implementation):** None.

**Important Gaps (resolve before or during Sprint 0):**

1. **TPC affiliate API contract is unknown.** Architecture treats `parking-search/tpc.ts` as an integration point, but the actual TPC affiliate API spec hasn't been documented. Action: obtain TPC affiliate-portal docs (or sample request/response) before story #4 (Parking) starts.
2. **Initial state-DOT API inventory is unspecified.** Architecture supports per-state graceful degradation; Huffy still needs to pick a launch set. Suggested v1: top-10 trucking corridors (TX, CA, OH, GA, IL, IN, PA, NC, FL, TN), refined post-survey.
3. **Admin allowlist bootstrap is a manual step.** First admin (Shawn) must be inserted into `admin.admin_users` before launch. Add a one-time `supabase/migrations/0011a_seed_first_admin.sql` (or runbook entry).
4. **FR40 HOS-violation thresholds need definition.** `useHosViolationWarning` triggers Save-Your-CDL, but "warning" isn't quantified. Reasonable v1 definition: ≤30 min remaining on 11h drive, ≤45 min on 14h on-duty, or ≤2 hours on 70h cycle.

**Nice-to-Have Gaps (v1.05 polish or runbook items):**

5. **Service-worker update strategy.** Workbox default is `skipWaiting: false`; for app-shell updates, prompt user with a "new version available" banner.
6. **OSM Overpass query scope.** `osm-refresh` should query `[amenity=truck_stop OR amenity=parking AND access=hgv]` within US bounding box, with timeout.
7. **Email-transport switchover threshold.** Supabase free SMTP → Resend trigger: free quota exceeded for 2 consecutive months.
8. **iOS PWA IndexedDB 7-day eviction risk.** If device-mix survey shows iOS >40%, revisit before launch — may need to ship export earlier or update HOS disclaimer language.

### Validation Issues Addressed

All gaps documented above. None are critical. Items 1–4 should be tracked as Sprint 0 / pre-implementation tasks. Items 5–8 are runbook/polish.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

All 16 items checked.

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION** — with the four Important Gaps tracked as Sprint 0 tasks (TPC API spec, state-DOT inventory, admin bootstrap, HOS-violation thresholds).

**Confidence Level:** **High.**

**Key strengths:**
- Every FR maps to a single owner module; no split ownership.
- CI gates designed *into* the composition contracts (`<AffiliateCTA>`, `<HosShell>`, `core/disclaimers.ts`), not bolted on. They fail loudly if conventions slip.
- Two-trust-domain auth (driver vs admin via JWT claim) is structural, not feature-flagged — privilege escalation architecturally impossible.
- Cache partitioning enforced at SW activate by runtime assertion, defending NFR-S7/FR62 against future drift.
- Multi-vertical affiliate engine commits to genericity cost upfront (Innovation #1 from PRD), validated by the <3-day second-affiliate-wire thesis post-v1.
- Solo-dev cross-machine constraint respected: single `package.json`, no monorepo orchestrators, vanilla Vite + ESLint + Prettier, GitHub-friendly module boundaries.

**Areas for future enhancement:**
- HOS export pipeline (v1.5+).
- Push notifications (v1.5+, iOS Safari ≥16.4 dependent).
- Multi-driver / team logging (v1.5+).
- Real-time admin → client config push (v1 uses 15-min SW cache cycle).
- Sentry-style APM with anon mode if bug volume warrants past v1.

### Implementation Handoff

**Developer Guidelines:**
- Follow architectural decisions exactly as documented; treat this file as source of truth.
- Use composition contracts (`<AffiliateCTA>`, `<HosShell>`, `<Disclaimer>`) — never bypass them.
- Respect module boundaries (`<module>/index.ts` exports only).
- Reference `core/disclaimers.ts` for any disclaimer copy; never inline.
- Add a new server-side persistent table only with a migration *and* an architecture-doc PR.

**First Implementation Priority — Sprint 0:**

```bash
npm create vite@latest trucking-life-app -- --template react-ts
```

Then:
1. Install locked libraries (Step 3 install commands).
2. Wire Netlify auto-deploy from `main`.
3. Provision Supabase production project + preview project.
4. Configure Netlify env vars; configure Supabase Edge Function env vars.
5. Commit `architecture.md`, `README.md`, `.env.example`, `eslint.config.js`, `vite.config.ts`, `netlify.toml`, `lhci.config.cjs`, `.size-limit.json`.
6. Stub the 8 GitHub Actions CI jobs; `ftc-disclosure` and `rods-grid` start green (no rules to fail yet).
7. Empty shell deployable on `app.truckinglifewithshawn.com` preview URL.
8. **Done = green CI + Netlify preview URL renders an empty page on iOS Safari and Android Chrome.**

Then proceed in PRD-implementation order: Sprint 0 → Auth → Disclaimer Core → Parking → HOS → Affiliate Engine → Settings/CCPA → Cohort + Email Export → Stan Promo Triggers → Release prep.


