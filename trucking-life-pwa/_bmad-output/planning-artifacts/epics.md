---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: 'complete'
completedAt: '2026-05-08'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
project_name: 'Trucking Life with Shawn'
user_name: 'huffy'
date: '2026-05-08'
---

# Trucking Life with Shawn — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **Trucking Life with Shawn**, decomposing requirements from the PRD and architectural decisions into implementable stories sized for solo developer Huffy across a 4–6 week v1 build (plus 1 week v1.05 polish).

UX Design Specification does not exist at v1 planning; Sally's UX pass is scheduled for v1.05 (Mossy Oak palette + `#FFEB00` token finalization, dark mode polish). UX-driven stories appear in the v1.05 epic.

## Requirements Inventory

### Functional Requirements

**Authentication & Onboarding**
- **FR1:** Visitor can sign up using a magic-link sent to their email.
- **FR2:** Visitor can sign up using Google Sign-In.
- **FR3:** Driver can sign in to an existing account using either magic-link email or Google Sign-In, on any supported device.
- **FR4:** System rejects password-based authentication; no password field is offered or accepted anywhere in the app.
- **FR5:** Driver completes onboarding by answering at most two questions: trip type (OTR or local) and default starting state.
- **FR6:** Visitor on iOS Safari sees inline Add-to-Home-Screen instructions on the landing page when the app is not yet installed.
- **FR7:** Visitor on Android Chrome receives a non-intrusive PWA install prompt after their second engaged session.
- **FR8:** Driver lands on the parking home tile by default after completing onboarding.

**Parking Discovery**
- **FR9:** Driver can request parking results ahead of their current direction of travel with a single tap from the home screen.
- **FR10:** System returns reservable TruckParkingClub spots prioritized over public-source results in any combined result list.
- **FR11:** System falls back to public-source results (state DOT rest areas + OSM truck-stop POIs) when no reservable TPC inventory exists in the requested corridor.
- **FR12:** System visually distinguishes public-source results from reservable TPC results; public-source results carry a "not reservable, not guaranteed" label.
- **FR13:** Driver can view a parking detail view containing photos (when available), gate hours, lighting information, and any other TPC-supplied attributes.
- **FR14:** Driver can tap-through to complete a TPC reservation in a single click; the SHAWN20 affiliate code is pre-applied to the booking.
- **FR15:** System renders an FTC affiliate disclosure adjacent to every TPC reservation CTA in the parking flow.
- **FR16:** System returns last-known cached parking results when the device is offline or on degraded connectivity, and labels the result set with the cache timestamp.
- **FR17:** Driver can see a parking module disclaimer on every search-result set.
- **FR18:** System telemeters the rate of zero-result lookups (no TPC and no fallback) for monitoring the disaster-scenario metric.

**HOS Tracker (Personal Logbook, Non-ELD)**
- **FR19:** Driver, on first launch of the HOS module, must read and tap-to-acknowledge the full canonical HOS disclaimer before any HOS feature becomes reachable.
- **FR20:** System enforces a minimum dwell time on the first-launch disclaimer screen before the acknowledgment tap is enabled.
- **FR21:** Driver sees a permanent footer disclaimer on every HOS screen.
- **FR22:** Driver is re-prompted to acknowledge the HOS disclaimer every 90 days of active HOS use, and on any version bump whose changelog touches HOS.
- **FR23:** Driver can record a duty status from a fixed set of four options: Driving, On-Duty Not Driving, Sleeper, Off-Duty.
- **FR24:** Driver can attach an optional plain-text note to any duty-status entry.
- **FR25:** Driver can view a real-time clock showing remaining cycle hours and remaining shift hours, derived from manually-entered statuses and labeled as user-derived estimates.
- **FR26:** Driver can view an end-of-shift daily summary showing total drive hours, total on-duty hours, and remaining cycle clock as plain-English tabular text.
- **FR27:** System never renders any 24-cell horizontal grid or any visual element that mimics the duty-status grid of 49 CFR 395.32.
- **FR28:** System retains the driver's HOS entries on-device only for 30 days, then auto-prunes older entries.
- **FR29:** System never transmits HOS payloads to any server.
- **FR30:** System surfaces an in-app banner on next app open at the day-7 retention milestone inviting the driver to view their weekly summary.
- **FR31:** System ships no HOS export, PDF, or CSV feature in v1. (Absent feature; verified by absence.)

**Affiliate & Monetization Engine**
- **FR32:** System loads affiliate slot configurations from a multi-vertical schema supporting at minimum the verticals: parking, fuel-card, load-board, insurance.
- **FR33:** System supports multiple affiliate slots concurrently across the app, configured independently.
- **FR34:** System renders an FTC affiliate disclosure adjacent to every affiliate CTA rendered anywhere in the app.
- **FR35:** System fails the build (CI gate) if any affiliate CTA component is rendered without the disclosure component as a sibling.
- **FR36:** System propagates affiliate-config changes to live clients within 15 minutes of an admin save.
- **FR37:** System tracks per-slot impression and click-through events for every affiliate slot.

**Stan Store Cross-Promotion**
- **FR38:** System surfaces a Stan Store cross-promotion ("Carnivore in the Truck") to a driver after their fifth successful parking lookup, exactly once.
- **FR39:** System surfaces a Stan Store cross-promotion ("Driver's Mind") to a driver after they have logged ten cumulative HOS hours, exactly once.
- **FR40:** System surfaces a Stan Store cross-promotion ("Save Your CDL") when an HOS violation warning is triggered by the user's manually-entered statuses.
- **FR41:** Driver can access a "More from Shawn" panel from settings linking the YouTube channel and the full Stan Store catalog.
- **FR42:** System tags every Stan Store outbound link with UTM parameters that survive the magic-link auth roundtrip.

**Cohort & Attribution Tracking**
- **FR43:** System tags every newly-signed-up driver with their acquisition cohort (Day-1 Stan-Store-buyer cohort vs. cold-YouTube cohort) at signup time.
- **FR44:** System persists each driver's cohort tag for the lifetime of the account.
- **FR45:** System exposes cohort data to analytics so retention and monetization metrics can be reported by cohort.
- **FR46:** System produces a verified-email export of installed users for the founder's owned-channel pipeline.

**Settings, Privacy & Account**
- **FR47:** Driver can view their account email, OTR/local toggle, default starting state, and dark/light mode preference in a Settings screen.
- **FR48:** Driver can change their dark/light mode preference at any time; dark mode is the default at install.
- **FR49:** Driver can view a "Right to Know" data summary listing every category of data the app stores about them (account email, OAuth identity, HOS entries, saved parking searches, app usage analytics).
- **FR50:** Driver can initiate a "Right to Delete" account deletion that removes all server-side data within 30 days; deletion is irreversible and explicitly stated.
- **FR51:** Driver receives an email confirmation when their account deletion completes.
- **FR52:** Driver can opt out of analytics tracking from the Settings screen at any time.
- **FR53:** Visitor and driver can access the public privacy policy at a stable URL linked from the app footer.
- **FR54:** Visitor and driver can access the affiliate disclosure policy at a stable URL linked from the app footer.
- **FR55:** Driver can sign out from the Settings screen.

**Founder Admin & Operations**
- **FR56:** Founder can sign in to a separate admin surface authenticated by founder-level credentials.
- **FR57:** Founder can view, enable, disable, and edit any affiliate slot configuration (vertical, banner image, CTA copy, discount code, UTM parameters) without a code change or developer involvement.
- **FR58:** Founder can view per-slot impression and click-through analytics over a selectable time window.
- **FR59:** Founder can configure each Stan Store cross-promotion trigger (which trigger fires, threshold, frequency).
- **FR60:** System restricts admin surface access to authenticated founder-level accounts; no driver-level account can access admin features.

**Cross-Cutting & Compliance**
- **FR61:** System loads all canonical disclaimer strings (HOS, parking, FTC, future export watermark) from a single source-of-truth module; no string is duplicated or interpolated.
- **FR62:** System fails the build (CI gate) if the HOS bundle contains any component whose rendered output produces a 24-cell horizontal grid (RODS-grid heuristic).
- **FR63:** System fails the build (CI gate) if the Lighthouse Performance score falls below 90 on mobile simulated 4G.
- **FR64:** System fails the build (CI gate) if the Lighthouse Accessibility score falls below 95.
- **FR65:** System never persists user-keyed parking-lookup location history server-side.
- **FR66:** System uses only aggregate, non-user-keyed analytics; no third-party analytics with user-identifier-keyed default behavior is permitted.

### NonFunctional Requirements

**Performance**
- **NFR-P1:** Cold-open to first interactive paint completes in <2 seconds at the 75th percentile on simulated 4G connectivity.
- **NFR-P2:** Cold-open to first parking result rendered completes in <3 seconds online and <1 second from cached results, at the 80th percentile.
- **NFR-P3:** Magic-link authentication completes (from email click to signed-in app) in ≤30 seconds at the median, including email-delivery latency.
- **NFR-P4:** HOS status entry (open module → entry saved) completes in ≤5 user taps and ≤10 seconds total at the median.
- **NFR-P5:** Service worker cache hit rate is ≥90% for repeat-corridor parking lookups within a 48-hour window.
- **NFR-P6:** Initial JavaScript bundle size is ≤200KB gzipped; parking and HOS modules are lazy-loaded on first use.
- **NFR-P7:** Affiliate-config edits propagate to live clients within 15 minutes of the founder's save action at the 95th percentile.
- **NFR-P8:** Lighthouse Performance score is ≥90 on mobile simulated 4G; build fails below this threshold.

**Security**
- **NFR-S1:** All API keys, OAuth secrets, and Supabase service-role credentials are stored in server-side environment configuration only and are never present in client bundles.
- **NFR-S2:** All client-server communication is encrypted in transit using TLS 1.2 or greater.
- **NFR-S3:** Magic-link tokens expire within 15 minutes of issuance and are single-use.
- **NFR-S4:** Founder admin authentication is strictly distinct from driver authentication; driver-level credentials cannot access admin surfaces under any circumstance.
- **NFR-S5:** Account deletion completes server-side within 30 days of user request and removes all account-associated data except records required by law to retain.
- **NFR-S6:** No third-party analytics or telemetry tool is loaded with user-identifier-keyed default tracking; only aggregate, anonymous tools (e.g., Plausible, anonymous PostHog mode) are permitted.
- **NFR-S7:** PWA service-worker cache for parking results does not share scope with HOS data; cache partitions are strictly enforced.
- **NFR-S8:** No HOS payload is ever transmitted to any server; HOS data is local-only.

**Scalability & Capacity**
- **NFR-SC1:** System sustains ≥75,000 unique signed-in sessions per month without degraded response times (3x the 6-month aspirational ceiling).
- **NFR-SC2:** System sustains ≥30 parking lookups per second sustained, with 5x burst capacity, without degradation past NFR-P2 thresholds.
- **NFR-SC3:** TPC API rate-limit handling: when approaching the affiliate-portal rate limit, fallback to public-source results without user-visible failure.
- **NFR-SC4:** Affiliate-slot config storage handles ≥50 concurrent slots across all verticals without operational impact.
- **NFR-SC5:** When TPC is unavailable, the system continues to serve public-source results with no user-visible "service down" state.

**Accessibility**
- **NFR-A1:** System meets WCAG 2.1 Level AA contrast ratios across all driver-facing surfaces (4.5:1 body text, 3:1 large text and UI components).
- **NFR-A2:** Lighthouse Accessibility score is ≥95; build fails below this threshold.
- **NFR-A3:** Every interactive control has a touch target of ≥48dp (Material) or ≥44pt (Apple HIG), whichever is larger on the platform.
- **NFR-A4:** All interactive elements are keyboard-focusable with visible focus indicators.
- **NFR-A5:** All meaningful images carry alt text appropriate to their content and context.
- **NFR-A6:** System respects `prefers-reduced-motion` user preference and disables non-essential animations when set.
- **NFR-A7:** All form fields have associated labels accessible to screen readers.
- **NFR-A8:** Mossy Oak palette and #FFEB00 CTA tokens are validated against WCAG 2.1 AA contrast requirements during the v1.05 UX pass; failing tokens are escalated, not shipped.

**Integration & Reliability**
- **NFR-I1:** When TPC API is unavailable or rate-limited, system falls back to public-source results within the same parking lookup; the user does not see a failed-lookup state.
- **NFR-I2:** When a state DOT rest-area API is unavailable, system degrades gracefully to the remaining available sources for that lookup; the user is not shown an error toast.
- **NFR-I3:** OpenStreetMap truck-stop POI data is refreshed on a recurring schedule (at least weekly) and cached for resilience to upstream outages.
- **NFR-I4:** When the device is fully offline, system serves last-known cached parking results with the cache timestamp clearly displayed; the lookup does not block on network.
- **NFR-I5:** Stan Store deep-link UTM parameters survive the magic-link authentication roundtrip; attribution is not lost between landing-page click and signed-in state.
- **NFR-I6:** External integration failures are logged in aggregate (no user-keyed payloads) for monitoring without exposing PII.

**Compliance & Privacy**
- **NFR-C1:** Every screen rendering an affiliate CTA also renders the canonical FTC disclosure adjacent to the CTA; verified by CI on every release.
- **NFR-C2:** Every HOS screen displays the permanent footer disclaimer; verified at runtime and reviewed during the lawyer sign-off pass.
- **NFR-C3:** No HOS UI element produces a 24-cell horizontal grid (RODS-grid heuristic); verified by CI on every release.
- **NFR-C4:** CCPA/CPRA Right-to-Know and Right-to-Delete flows are reachable from the Settings screen at all times.
- **NFR-C5:** All canonical disclaimer strings (HOS full, HOS footer, parking, FTC) live in a single source-of-truth module and are imported by reference; no string is duplicated or interpolated.

### Additional Requirements

Architecture-derived implementation requirements that shape epic and story creation.

**Starter & scaffolding**
- **AR1:** Project initialized via `npm create vite@latest trucking-life-app -- --template react-ts`. Node 20 LTS for Netlify build parity.
- **AR2:** Locked library stack: React 19 + Vite 6 + Tailwind v4 + React Router v7 (library mode) + TanStack Query + Zustand + Supabase JS + Workbox via vite-plugin-pwa + Dexie + date-fns + Vitest + React Testing Library + Playwright + Zod + ESLint + Prettier. No monorepo tooling.

**Deployment & infrastructure**
- **AR3:** Netlify auto-deploy from GitHub `main` branch; preview deploys on every PR.
- **AR4:** Custom domain `app.truckinglifewithshawn.com`.
- **AR5:** Supabase managed Postgres 15 + Auth + Edge Functions + Storage; production project + preview project.
- **AR6:** Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PLAUSIBLE_DOMAIN` in Netlify env (build-time inlined). `SUPABASE_SERVICE_ROLE_KEY`, `TPC_AFFILIATE_KEY`, `TPC_AFFILIATE_API_URL`, `EXPORT_PIPELINE_ENDPOINT` in Supabase Edge Function env only. `.env.example` committed; `.env.local` gitignored.

**Database schema**
- **AR7:** Three Postgres schemas: `public` (driver-facing, RLS-protected), `admin` (founder admin tables and RPC functions), `analytics_agg` (aggregate, non-user-keyed metrics).
- **AR8:** v1 tables: `auth.users`, `public.profiles`, `public.parking_lookups_recent`, `public.osm_truck_stops`, `admin.affiliate_slots`, `public.affiliate_slots_public` (view), `analytics_agg.affiliate_events_agg`, `admin.stan_trigger_config`, `admin.email_export_queue`, `admin.admin_users`, `admin.rate_limits`. **No** `parking_history` table; **no** `hos_entries` table (HOS is local-only).
- **AR9:** Migrations versioned and committed under `supabase/migrations/`; linear, no branching. Generated types committed at `src/core/types/supabase.ts`.

**Edge Functions**
- **AR10:** Six Edge Functions: `parking-search`, `osm-refresh` (weekly cron), `delete-account`, `email-export` (daily cron), `affiliate-event-beacon`, `claim-admin` (auth hook).
- **AR11:** Uniform Edge Function response contract: `{ ok: true, data: T } | { ok: false, error: { code: string, message: string } }`. HTTP 200 for both `ok: true` and `ok: false`; 4xx/5xx for transport-level failures only.

**Authentication & authorization**
- **AR12:** Two strictly distinct auth domains: driver auth (magic-link or Google, no passwords) and founder admin auth (same auth flow, but `is_admin` JWT claim set only if email exists in `admin.admin_users`). Driver-credentialed tokens cannot acquire `is_admin`.
- **AR13:** Row-Level Security enabled on all `public.*` tables; admin-schema RPCs gated by `auth.jwt() ->> 'is_admin' = 'true'`.
- **AR14:** UTM parameters preserved across magic-link auth roundtrip via `localStorage` capture pre-magic-link + cookie fallback.

**Caching & local storage**
- **AR15:** Three Workbox cache namespaces: `parking-results-v1` (stale-while-revalidate, 48h max), `affiliate-config-v1` (stale-while-revalidate, ≤15min cycle), `static-assets-v1` (cache-first, version-keyed). Defined centrally in `src/pwa/cacheNames.ts`. Runtime assertion at SW activate fails install on unexpected namespace.
- **AR16:** Dexie database `hosdb` is the only IndexedDB store; only the HOS module imports it (via `hosRepository`). HOS retention auto-pruned at 30 days.

**State management**
- **AR17:** Five state homes (no exceptions): TanStack Query (server data), `useState` (UI ephemeral), Zustand (cross-component UI, one slice per module), Supabase JS + Zustand mirror (auth session), Dexie (HOS persistent). Form state via native `<form>` + `useState` (no form library v1).

**Composition contracts (load-bearing)**
- **AR18:** `<AffiliateCTA slot={…}>` is the only legal parent of an affiliate URL `<a>`/`<button>`. Enforced by AST scan in `scripts/ci/check-ftc-disclosure.ts`.
- **AR19:** `<HosShell>` is the only legal parent for routes under `/hos/*`. Enforced by PR review + 90-day-ack guard.
- **AR20:** `<Disclaimer kind="…">` is the only path that renders disclaimer copy. ESLint rule prevents inline strings matching disclaimer copy outside `src/core/disclaimers.ts`.

**CI gates (must be green to merge to `main`)**
- **AR21:** `lint` (ESLint + custom no-inline-disclaimer rule).
- **AR22:** `typecheck` (`tsc --noEmit`).
- **AR23:** `unit` (Vitest, including disclaimer-source-of-truth assertion).
- **AR24:** `e2e` (Playwright happy paths for journeys 1, 2, 3, 4, 5).
- **AR25:** `bundle-size` (initial bundle ≤200KB gz via size-limit).
- **AR26:** `lighthouse` (Performance ≥90, Accessibility ≥95 via Lighthouse CI).
- **AR27:** `ftc-disclosure` (custom AST scan).
- **AR28:** `rods-grid` (custom snapshot scan against `data-hos-screen` subtrees).

**Module organization**
- **AR29:** Cross-module imports go through `src/modules/<name>/index.ts` only; ESLint `no-restricted-imports` enforces the boundary.
- **AR30:** No `src/services/` or `src/utils/` directories (junk-drawer anti-patterns); cross-cutting concerns live in `src/core/` or `src/components/`.

**Static URLs (Netlify-served HTML, not SPA-rendered)**
- **AR31:** `/privacy` served from `public/privacy.html`.
- **AR32:** `/affiliate-disclosure` served from `public/affiliate-disclosure.html`.

**Sprint 0 prerequisites (Important Gaps from architecture validation)**
- **AR33:** TPC affiliate API contract obtained (sample request/response or partner docs) before Parking epic begins.
- **AR34:** Initial state-DOT API set selected for v1 launch (suggested top-10 trucking corridors: TX, CA, OH, GA, IL, IN, PA, NC, FL, TN).
- **AR35:** Admin allowlist seeded with founder email (Shawn) via one-time migration (`0011a_seed_first_admin.sql`) or runbook.
- **AR36:** HOS-violation warning thresholds defined (suggested: ≤30 min remaining on 11h drive, ≤45 min on 14h on-duty, or ≤2h on 70h cycle).

**External integrations**
- **AR37:** TruckParkingClub affiliate API (primary parking source); SHAWN20 affiliate code embedded in deep-link.
- **AR38:** State DOT rest-area APIs (per-state, normalized).
- **AR39:** OpenStreetMap Overpass API (refreshed weekly into `osm_truck_stops` Postgres table).
- **AR40:** Stan Store deep-link UTM tracking.
- **AR41:** Plausible analytics (cookieless, aggregate-only).
- **AR42:** Email transport: Supabase built-in SMTP at v1; switch to Resend when free quota exceeded.

### UX Design Requirements

UX Design Specification has not been authored at v1 planning. Sally's UX pass is scheduled as a v1.05 epic and covers:

- Mossy Oak palette + `#FFEB00` CTA token finalization
- Dark mode polish (default at install)
- Masculine/blue-collar tone validation across all surfaces
- WCAG 2.1 AA contrast verification per token (NFR-A8)

Specific UX-DR items will be expanded into stories during v1.05 sprint planning, after Sally produces the spec. v1 ships with a functional design that meets accessibility CI gates (Lighthouse A11y ≥95) but is intentionally pre-polish.

### FR Coverage Map

| FR | Epic | Notes |
|---|---|---|
| FR1, FR2, FR3, FR4 | Epic 1 | Magic-link + Google + no passwords |
| FR5, FR8 | Epic 1 | Onboarding (2-question + post-onboarding land) |
| FR6, FR7 | Epic 1 | iOS A2HS + Android beforeinstallprompt |
| FR9, FR10, FR11, FR12 | Epic 2 | Parking discovery + fallback |
| FR13, FR14, FR15 | Epic 2 | Detail view + SHAWN20 + FTC adjacent |
| FR16, FR17, FR18 | Epic 2 | Offline cache + module disclaimer + zero-result telemetry |
| FR19, FR20, FR21, FR22 | Epic 3 | Disclaimer scaffolding + dwell + footer + 90-day re-ack |
| FR23, FR24, FR25, FR26 | Epic 3 | Status entry + clock + summary |
| FR27 | Epic 3 | RODS-grid prohibition (verified by CI gate from Epic 1) |
| FR28, FR29, FR30, FR31 | Epic 3 | 30-day prune + local-only + day-7 nudge + no-export |
| FR32, FR33, FR34, FR35, FR36, FR37 | Epic 4 | Affiliate engine + propagation + per-slot analytics |
| FR38, FR39, FR40 | Epic 5 | Three Stan triggers (lookup, hours, HOS warning) |
| FR41 | Epic 5 | More-from-Shawn panel |
| FR42 | Epic 1 | UTM survives auth (mechanism is foundational) |
| FR43, FR44, FR45, FR46 | Epic 5 | Cohort tag + persistence + analytics + email export |
| FR47, FR48, FR55 | Epic 1 | Settings shell (email view, dark mode default, sign out) |
| FR49, FR50, FR51, FR52 | Epic 6 | CCPA Right-to-Know, Right-to-Delete, opt-out |
| FR53, FR54 | Epic 6 | Public privacy + affiliate-disclosure URLs |
| FR56, FR57, FR58, FR59, FR60 | Epic 4 | Founder admin sign-in + slot CRUD + analytics + trigger config + restriction |
| FR61, FR62 | Epic 1 (wired) / Epic 6 (enforced) | Disclaimer source-of-truth + RODS-grid CI |
| FR63, FR64 | Epic 1 (wired) / Epic 6 (enforced) | Lighthouse Perf + A11y CI |
| FR65, FR66 | Epic 1 (architectural) / Epic 6 (verified) | No server-side parking history; aggregate-only analytics |

All 66 FRs mapped. No orphans.

## Epic List

### Epic 1: Foundation, Auth & Onboarding

A driver can install the PWA on iOS Safari or Android Chrome, sign in via magic-link or Google, complete two-question onboarding, see their account email, toggle dark mode, and sign out. Two-trust-domain auth structurally in place. All 8 CI gates wired. Composition contracts (`<AffiliateCTA>`, `<HosShell>`, `<Disclaimer>`) and `core/disclaimers.ts` shipped.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR42, FR47, FR48, FR55
**ARs covered:** AR1–AR3 (scaffold + deploy), AR4 (custom domain), AR5 (Supabase project), AR6 (env), AR7 (schemas), AR9 (migration tooling), AR11 (error contract), AR12–AR14 (auth + UTM), AR15–AR17 (state homes + caching foundations), AR18–AR20 (composition contracts), AR21–AR28 (8 CI gates wired), AR29–AR30 (module org), AR33 + AR35 (Sprint 0 prereqs)

### Epic 2: Parking Discovery

A driver opens the app while on the road, taps once, sees reservable TPC parking ahead with SHAWN20 pre-applied, and books in three taps. When TPC has nothing, public-source fallback (state DOT + OSM) returns results visually distinct from reservable spots, with the "always have a backup plan" disclaimer. When the device is offline, last-known cached results render with a timestamp. Zero-result lookups telemeter for the <2% disaster-rate metric.

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18
**ARs touched:** AR10 (`parking-search` + `osm-refresh` Edge Functions), AR15 (`parking-results-v1` Workbox cache), AR34 (state-DOT API set selected), AR37–AR39 (TPC + state DOT + OSM integrations), AR41 (Plausible parking events)

### Epic 3: HOS Tracker

An owner-operator opens the HOS module for the first time, reads the canonical disclaimer with minimum dwell, taps acknowledge, then logs duty status from four plain-English options with optional notes. Real-time clock shows remaining cycle/shift hours derived from manually-entered statuses. End-of-shift daily summary renders as plain-English tabular text — never a 24-cell grid. Entries auto-prune at 30 days; nothing crosses the wire. Day-7 nudge banner prompts weekly review. 90-day re-acknowledgment fires when due.

**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31
**ARs touched:** AR16 (Dexie hosdb), AR19 (`<HosShell>` consumed from Epic 1), AR28 (RODS-grid CI gate enforces in this epic), AR36 (HOS-violation thresholds defined)

### Epic 4: Founder Admin & Affiliate Engine

Shawn signs in to a strictly-distinct admin surface, edits affiliate slot configs (vertical, banner image, CTA copy, code, UTM, on/off) without a code change, watches per-slot impression and click-through analytics, and tweaks Stan trigger thresholds. Slot config changes propagate to live clients within 15 minutes via Workbox stale-while-revalidate. The TPC slot in the parking flow transitions from hardcoded to admin-managed.

**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR37, FR56, FR57, FR58, FR59, FR60
**ARs touched:** AR8 (`affiliate_slots`, `affiliate_events_agg`, `stan_trigger_config` tables), AR10 (`affiliate-event-beacon` + `claim-admin` Edge Functions), AR13 (admin RLS), AR15 (`affiliate-config-v1` Workbox cache, ≤15-min cycle), AR18 (`<AffiliateCTA>` consumed from Epic 1), AR27 (FTC CI gate enforces in this epic)

### Epic 5: Cohort Attribution & Cross-Promo

Stan Store buyers and cold-YouTube installs are tagged at signup; cohort persists for the lifetime of the account; analytics reports retention and monetization by cohort. Verified-email export pipeline ships installed users to Shawn's owned-channel pipeline daily. Stan Store cross-promos fire by trigger (Carnivore at 5 lookups, Driver's Mind at 10 hours, Save Your CDL on HOS warning) — never as banner spam. "More from Shawn" panel links YouTube and the Stan Store catalog.

**FRs covered:** FR38, FR39, FR40, FR41, FR43, FR44, FR45, FR46
**ARs touched:** AR8 (`email_export_queue` table), AR10 (`email-export` daily-cron Edge Function), AR40 (Stan Store deep-link UTM), AR41 (Plausible cohort props)

### Epic 6: Privacy, Compliance Hardening & v1 Launch

CCPA/CPRA Right-to-Know, Right-to-Delete, and analytics opt-out flows reachable from Settings at all times. Account deletion completes server-side and emails confirmation. Public privacy and affiliate-disclosure URLs live, lawyer-reviewed, and indexable. Every CI gate enforcing — FTC AST scan, RODS-grid heuristic, Lighthouse Perf ≥90, A11y ≥95, bundle ≤200KB gz, all green. Pre-launch attorney sign-off on shipped UX. Insurance bound. v1 ready to ship.

**FRs covered:** FR49, FR50, FR51, FR52, FR53, FR54, FR61, FR62, FR63, FR64, FR65, FR66
**ARs touched:** AR10 (`delete-account` Edge Function), AR21–AR28 (all 8 CI gates enforcing), AR31–AR32 (static stable URLs), AR42 (email transport ready)
**Pre-launch business gates** (non-code stories): pre-launch attorney consult, lawyer-reviewed final HOS disclaimer copy on shipped UX, Tech E&O + product liability + cyber insurance bound, LLC affiliate-revenue routing confirmed, YouTube launch-video FTC disclosure locked.

### Epic 7: v1.05 UX Polish (Sally) — Post-Launch

Sally's UX pass lands the Mossy Oak palette, `#FFEB00` CTA token finalization, dark mode polish, masculine/blue-collar tone validation, and WCAG AA contrast verification per token. Stories TBD pending Sally's UX spec; this epic is a placeholder so the v1.05 sprint plan slots in cleanly.

**FRs covered:** none new (FR48 dark mode reaffirmed; NFR-A8 contrast verification fulfilled)
**Note:** Stories created during a separate planning pass when Sally's UX design document exists.

### Sequencing

```
Epic 1 (Foundation) ──┬── Epic 2 (Parking) ───────┐
                      ├── Epic 3 (HOS) ───────────┤
                      └── Epic 4 (Admin) ─────────┼── Epic 6 (Launch)
                                                  │
                                Epic 5 (Cohort) ──┘
                                (depends on 2 + 3)
```

Epic 4 enriches Epic 2 (TPC slot transitions hardcoded → admin-managed) but Epic 2 is shippable on its own. Epic 5's triggers depend on Epic 2's lookup counter (Carnivore) and Epic 3's hours counter (Driver's Mind, Save Your CDL). Epic 7 is post-launch and gated on Sally's UX spec.

## Epic 1: Foundation, Auth & Onboarding

A driver can install the PWA on iOS Safari or Android Chrome, sign in via magic-link or Google, complete two-question onboarding, see their account email, toggle dark mode, and sign out. Two-trust-domain auth structurally in place. All 8 CI gates wired. Composition contracts (`<AffiliateCTA>`, `<HosShell>`, `<Disclaimer>`) and `core/disclaimers.ts` shipped.

### Story 1.1: Scaffold Vite + React + TypeScript baseline

As Huffy (the developer),
I want a clean Vite + React + TypeScript project with the locked library stack and minimal build tooling,
So that all subsequent stories build on a known, reproducible foundation.

**Acceptance Criteria:**

**Given** an empty directory and Node 20 LTS installed
**When** `npm create vite@latest trucking-life-app -- --template react-ts` is run and locked libraries are installed (per AR2)
**Then** `package.json` contains React 19, Vite 6, React Router v7, TanStack Query, Zustand, Supabase JS, Dexie, date-fns, Workbox via vite-plugin-pwa, Tailwind v4 via `@tailwindcss/vite`, Vitest + RTL, Playwright, Zod, ESLint flat config, Prettier
**And** `npm run dev` starts the Vite dev server at `localhost:5173`
**And** `npm run build` produces a working `dist/` output
**And** `npm run lint` and `npm run format:check` pass with no errors
**And** `tsconfig.json` strict mode is enabled
**And** `.editorconfig`, `.prettierrc.json`, `.gitignore`, `.env.example` are committed (with `.env.local` gitignored)

### Story 1.2: Provision Supabase + driver-facing schema migrations

As Huffy,
I want Supabase production and preview projects with the driver-facing schema in place,
So that auth and profiles can be implemented in the next stories.

**Acceptance Criteria:**

**Given** the Supabase CLI is installed and `supabase init` has been run in the repo
**When** migrations `0001_init_schemas.sql` (creates `admin` and `analytics_agg` schemas) and `0002_profiles.sql` are written and applied
**Then** `public.profiles` exists with columns `(user_id uuid PK FK auth.users, cohort_tag text, otr_or_local text, default_state text, dark_mode boolean DEFAULT true, analytics_opt_out boolean DEFAULT false, created_at, updated_at)` and an `updated_at` trigger
**And** RLS is enabled on `public.profiles`
**And** policy `select_profiles_own` (`auth.uid() = user_id`) and `update_profiles_own` (`auth.uid() = user_id`) exist
**And** `supabase gen types typescript --linked > src/core/types/supabase.ts` produces a valid type file that's committed
**And** a Supabase preview project exists, distinct from production, with the same migrations applied

### Story 1.3: Wire admin auth domain (admin_users + claim-admin Edge Function)

As Huffy,
I want admin authentication structurally separate from driver authentication via a JWT `is_admin` claim,
So that founder admin endpoints are unreachable from driver-credentialed tokens (NFR-S4 / FR60).

**Acceptance Criteria:**

**Given** the admin schema exists from Story 1.2
**When** migrations `0003_admin_users.sql` and `0011_auth_hooks.sql` are written and applied
**Then** `admin.admin_users` exists with columns `(email text PK, granted_at timestamptz, granted_by text)` with RLS allowing service-role only
**And** the `claim-admin` Edge Function is deployed to Supabase Functions and is registered as the auth hook in the Supabase dashboard
**And** when an authenticated user's email is in `admin.admin_users`, the `is_admin` claim is set to `'true'` in their JWT
**And** when not in the table, the `is_admin` claim is absent
**And** `0011a_seed_first_admin.sql` (or runbook entry) adds `shawngresham90@gmail.com` to `admin.admin_users` for the production environment
**And** an integration test verifies a driver-credentialed JWT does NOT carry the `is_admin` claim

### Story 1.4: Wire Netlify auto-deploy + custom domain + preview deploys

As Huffy,
I want every push to `main` to deploy to `app.truckinglifewithshawn.com` and every PR to deploy to a preview URL,
So that I have continuous deployment and per-PR QA from day one.

**Acceptance Criteria:**

**Given** the GitHub repository exists and Netlify access is configured
**When** Netlify is connected to the GitHub repo with build command `npm run build` and publish directory `dist/`
**Then** `netlify.toml` is committed with build settings, redirects (SPA fallback to `index.html`, plus `/privacy` → `/privacy.html` and `/affiliate-disclosure` → `/affiliate-disclosure.html`), and security headers
**And** the custom domain `app.truckinglifewithshawn.com` resolves to the production deploy with valid TLS
**And** every PR creates a `*.netlify.app` preview URL automatically
**And** Netlify environment variables are configured per environment (production: prod Supabase URLs; deploy-previews: preview Supabase URLs)
**And** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_PLAUSIBLE_DOMAIN` are present in Netlify env; `SUPABASE_SERVICE_ROLE_KEY` is NOT in Netlify env

### Story 1.5: Stub 8 GitHub Actions CI jobs

As Huffy,
I want all 8 CI gates running as discrete GitHub Actions jobs from day one, even if some are no-op until later epics enforce them,
So that the CI structure exists without re-architecting and Netlify can require checks before merge.

**Acceptance Criteria:**

**Given** an empty repo with the scaffold from Story 1.1
**When** `.github/workflows/ci.yml` is committed
**Then** 8 parallel jobs exist: `lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`
**And** `lint` runs ESLint + Prettier check
**And** `typecheck` runs `tsc --noEmit`
**And** `unit` runs `vitest run`
**And** `e2e` runs `playwright test` (with at least one smoke test that loads `/`)
**And** `bundle-size` runs `vite build` then `size-limit` against `.size-limit.json` (initial threshold ≤200KB gz)
**And** `lighthouse` runs `vite build` then Lighthouse CI per `lhci.config.cjs` (Performance ≥90, Accessibility ≥95)
**And** `ftc-disclosure` runs `node scripts/ci/check-ftc-disclosure.ts` (passes by default — no affiliate CTAs yet)
**And** `rods-grid` runs `node scripts/ci/check-rods-grid.ts` (passes by default — no HOS screens yet)
**And** all jobs are required for merge to `main` per Netlify branch protection
**And** all 8 jobs are green on a fresh PR with no source changes

### Story 1.6: Build canonical disclaimer source-of-truth

As Huffy,
I want all canonical disclaimer copy in a single TypeScript module imported by reference,
So that no disclaimer string is ever inlined or paraphrased anywhere in the codebase (FR61, NFR-C5).

**Acceptance Criteria:**

**Given** the project scaffold from Story 1.1
**When** `src/core/disclaimers.ts` is created with `as const` exports for: `HOS_FULL`, `HOS_FOOTER`, `PARKING`, `FTC`, `HOS_EXPORT_WATERMARK` (deferred — defined but unused at v1)
**Then** the file contains the verbatim PRD-locked copy for each disclaimer (no paraphrasing, no interpolation)
**And** a Vitest test asserts each constant matches the byte-for-byte PRD strings (snapshot or string-equality test)
**And** a custom ESLint rule fails on any JSX string literal containing `"NOT AN ELD"`, `"FMCSA"`, or `"earns a commission"` outside `src/core/disclaimers.ts`
**And** `scripts/ci/check-disclaimer-source.ts` (called from the `lint` CI job) runs the ESLint rule and exits non-zero on violation
**And** the `<Disclaimer kind="hosFull" | "hosFooter" | "parking" | "ftc">` React component is implemented in `src/components/Disclaimer.tsx` with unit tests for each kind

### Story 1.7: Build AffiliateCTA composition contract + FTC AST scan

As Huffy,
I want every affiliate CTA in the codebase to render the FTC disclosure as a sibling, enforced by static AST scan,
So that FR15, FR34, and FR35 are structurally guaranteed across all current and future affiliate flows.

**Acceptance Criteria:**

**Given** Story 1.6 is complete and `<Disclaimer kind="ftc">` exists
**When** `src/components/AffiliateCTA.tsx` is implemented as `({ slot, children }) => <div data-testid="affiliate-cta-block" data-slot-id={slot.id}>{children}<Disclaimer kind="ftc" /></div>`
**Then** the component renders children plus the FTC disclosure as siblings
**And** unit test asserts the FTC disclosure is always rendered, regardless of children
**And** `scripts/ci/check-ftc-disclosure.ts` is implemented to walk all `*.tsx` files via TypeScript AST and report any `<a>` or `<button>` whose `href` or `onClick` matches the affiliate URL pattern (`truckparkingclub.com/book`, future fuel-card / load-board / insurance hosts) outside an `<AffiliateCTA>` parent
**And** the `ftc-disclosure` CI job exits non-zero on violation
**And** the scan passes on a known-good fixture and fails on a known-bad fixture (both committed under `tests/fixtures/`)

### Story 1.8: Build HosShell composition contract + RODS-grid scan

As Huffy,
I want every HOS screen wrapped in a shell component that renders the permanent footer disclaimer, with a CI gate that fails on any 24-cell horizontal grid in HOS subtrees,
So that FR21 and FR62 are structurally enforced even before HOS feature work begins (Epic 3).

**Acceptance Criteria:**

**Given** Story 1.6 is complete and `<Disclaimer kind="hosFooter">` exists
**When** `src/modules/hos/HosShell.tsx` is implemented as `({ children }) => <div data-hos-screen>{children}<Disclaimer kind="hosFooter" /></div>`
**Then** unit test asserts the permanent footer is rendered for every children variant
**And** `scripts/ci/check-rods-grid.ts` is implemented to scan all rendered output of components matching `[data-hos-screen]` for elements with `display: grid` (or Tailwind `grid` + `grid-cols-24`/equivalent) producing 24 cells in a horizontal pattern
**And** the `rods-grid` CI job exits non-zero on violation
**And** the scan passes on a known-good fixture and fails on a known-bad fixture (24-cell grid component)
**And** `RequireHosAck` route guard is stubbed (returns children for now; full implementation in Story 3.2)

### Story 1.9: Build PWA infrastructure (Workbox SW + cache namespaces + manifest + install prompts)

As Huffy,
I want the Service Worker registered with Workbox, three cache namespaces configured, and PWA install prompts working on iOS and Android,
So that the offline architecture (NFR-P5, NFR-S7) and install funnel (FR6, FR7) are in place for feature epics to consume.

**Acceptance Criteria:**

**Given** Story 1.1 (with vite-plugin-pwa installed) and Story 1.4 (Netlify deploy)
**When** `vite.config.ts` is configured with `vite-plugin-pwa` (Workbox runtimeCaching, manifest fields, register strategy)
**Then** `src/pwa/cacheNames.ts` exports `PARKING_RESULTS = 'parking-results-v1'`, `AFFILIATE_CONFIG = 'affiliate-config-v1'`, `STATIC_ASSETS = 'static-assets-v1'`
**And** `src/pwa/sw.ts` registers SW with these namespaces and includes a runtime assertion at activate that fails if any unexpected cache namespace appears (NFR-S7)
**And** `public/manifest.json` is committed with name, short_name, theme_color, background_color, icons (192px, 512px, maskable-512px), display: standalone, start_url, scope
**And** `src/pwa/installPrompt.ts` exposes `iOSInstallInstructions()` (renders inline A2HS instructions on iOS Safari when not yet installed) and `androidInstallPrompt()` (listens for `beforeinstallprompt` and shows non-intrusive banner after second engaged session)
**And** the SW is registered from `src/main.tsx` via `vite-plugin-pwa`'s `useRegisterSW` helper
**And** Lighthouse PWA audit on the Netlify preview deploy reports the app as installable on both iOS Safari 16.4+ and Android Chrome

### Story 1.10: Build provider tree + routing skeleton + auth/admin guards

As Huffy,
I want `App.tsx` mounting the provider stack, `react-router` routes lazy-loaded for feature modules, and route guards enforcing driver vs. admin auth domains,
So that all subsequent feature epics plug into a stable shell.

**Acceptance Criteria:**

**Given** Story 1.1 (libraries installed)
**When** `src/main.tsx` mounts `<App />` and `App.tsx` is implemented
**Then** the provider tree contains `<QueryClientProvider>` (TanStack Query), `<BrowserRouter>` (react-router v7 library mode), `<AuthProvider>` (Zustand-mirrored Supabase session), and `<Suspense>` for lazy routes
**And** `src/routes/index.tsx` defines the route tree with lazy imports for Parking, HOS, Admin (eagerly loads Auth, Settings, Onboarding, callback, and Disclaimer routes)
**And** `src/routes/guards/RequireAuth.tsx` redirects unauthenticated users to `/auth/login`
**And** `src/routes/guards/RequireAdmin.tsx` checks `auth.jwt() ->> 'is_admin' = 'true'` and redirects non-admins to `/`
**And** Vitest tests cover both guards' happy-path and redirect behavior
**And** unauthenticated visit to `/admin` redirects to `/auth/login`; authenticated-but-non-admin visit to `/admin` redirects to `/`

### Story 1.11: Magic-link auth + UTM survival across roundtrip

As a visitor,
I want to sign up or sign in with my email via a magic-link, with my UTM parameters preserved across the auth roundtrip,
So that my acquisition source (cohort) is correctly attributed (FR1, FR3, FR4, FR42, NFR-I5).

**Acceptance Criteria:**

**Given** Story 1.10 (provider tree) and Story 1.2 (profiles table)
**When** the visitor opens `/auth/login?utm_source=stan_store&utm_campaign=carnivore` and submits their email via `<MagicLinkForm>`
**Then** `useUtmCapture` writes the UTM object to `localStorage` under key `pending_utm` BEFORE calling `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <callback_url_with_utm> } })`
**And** the magic-link email is delivered (Supabase SMTP at v1)
**And** clicking the email link navigates to `/auth/callback`
**And** `<AuthCallback>` reads `pending_utm` from localStorage, derives the cohort tag (`day1_stan` if `utm_source=stan_store`, else `cold_youtube` if any other or absent), upserts `public.profiles` with the cohort_tag, then clears `pending_utm`
**And** the user is navigated to `/onboarding` if `profiles.otr_or_local` is null, else `/` (the parking home)
**And** no password input field exists anywhere in the auth flow (FR4)
**And** Playwright E2E test covers the UTM-preservation happy path

### Story 1.12: Google sign-in flow

As a visitor,
I want to sign up or sign in via Google,
So that I can install the app without checking email (FR2, FR3).

**Acceptance Criteria:**

**Given** Story 1.11 (magic-link callback exists)
**When** the visitor taps `<GoogleSignInButton>` on `/auth/login`
**Then** the same `useUtmCapture` writes UTM to localStorage before calling `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <callback_url_with_utm> } })`
**And** the OAuth roundtrip returns to `/auth/callback` and follows the same cohort tagging + onboarding routing as Story 1.11
**And** the Supabase project's Google OAuth provider is configured with the production OAuth client ID
**And** Playwright E2E test covers the Google sign-in happy path (mocked OAuth provider)

### Story 1.13: Two-question onboarding flow

As a newly signed-in driver,
I want to answer at most two questions (OTR or local? default starting state?),
So that the app understands my context without 20 screens of onboarding (FR5, FR8).

**Acceptance Criteria:**

**Given** Story 1.11 or 1.12 (signed-in user with no `otr_or_local` set)
**When** the user lands on `/onboarding`
**Then** `<TwoQuestionFlow>` renders exactly two screens: question 1 (OTR / local toggle), question 2 (default starting state — US state dropdown)
**And** answers are persisted to `public.profiles` via `useOnboarding`
**And** on completion, the user is navigated to `/` (the parking home tile per FR8)
**And** if the user already has `otr_or_local` set, `/onboarding` redirects to `/`
**And** Playwright E2E test covers the two-question completion path

### Story 1.14: Settings shell — account view + dark mode + sign out

As a signed-in driver,
I want a Settings screen showing my account email, an OTR/local toggle, my default state, a dark/light mode switch, and a sign-out button,
So that I have basic account self-service from day one (FR47, FR48, FR55).

**Acceptance Criteria:**

**Given** Stories 1.10–1.13 are complete
**When** the driver navigates to `/settings`
**Then** `<SettingsHome>` displays: account email (from Supabase auth user), OTR/local toggle (read/write `profiles.otr_or_local`), default state dropdown (read/write `profiles.default_state`), dark/light mode toggle (read/write `profiles.dark_mode` and Zustand `prefs` store; default is dark per FR48), and a Sign Out button
**And** the Sign Out button calls `supabase.auth.signOut()` then navigates to `/auth/login`
**And** the dark/light mode toggle takes effect immediately via Tailwind dark mode class on `<html>`
**And** placeholder slots exist for "Privacy" (linked to `/settings/privacy`, route stubbed for Epic 6) and "More from Shawn" (linked to `/settings/more`, route stubbed for Epic 5)
**And** unit tests cover the email render, mode toggle behavior, and sign-out invocation
**And** Lighthouse Accessibility ≥95 passes on this page

## Epic 2: Parking Discovery

A driver opens the app while on the road, taps once, sees reservable TPC parking ahead with SHAWN20 pre-applied, and books in three taps. When TPC has nothing, public-source fallback (state DOT + OSM) returns results visually distinct from reservable spots, with the "always have a backup plan" disclaimer. When the device is offline, last-known cached results render with a timestamp. Zero-result lookups telemeter for the <2% disaster-rate metric.

### Story 2.1: Parking-related migrations (lookups recent + OSM stops + rate limits)

As Huffy,
I want the Postgres tables that the parking flow reads from and writes to,
So that subsequent Edge Function and UI stories have schema in place.

**Acceptance Criteria:**

**Given** Epic 1 migrations are applied
**When** migrations `0006_parking_lookups_recent.sql`, `0007_osm_truck_stops.sql`, `0010_rate_limits.sql` are written and applied
**Then** `public.parking_lookups_recent` exists with columns `(device_hash text, corridor_key text, last_lookup_at timestamptz, PRIMARY KEY (device_hash, corridor_key))` with RLS policy allowing access only by matching device hash, and a 24h auto-prune job (Postgres scheduled function) that deletes rows older than 24h
**And** the table contains NO `user_id` column and NO field that ties a lookup to an authenticated user (FR65)
**And** `public.osm_truck_stops` exists with columns `(osm_id text PK, lat numeric, lng numeric, name text, amenity text, last_refreshed_at timestamptz, raw_tags jsonb)` with anon-read RLS
**And** `admin.rate_limits` exists with columns `(bucket text, window_start timestamptz, count integer, PRIMARY KEY (bucket, window_start))` with service-role only access
**And** `supabase gen types` is re-run and `src/core/types/supabase.ts` reflects the new tables

### Story 2.2: parking-search Edge Function — TPC integration

As a driver,
I want a single endpoint that proxies my parking lookup to the TruckParkingClub API and returns reservable spots ahead of my direction of travel,
So that no TPC affiliate key is ever exposed to the client (NFR-S1, FR9, FR10).

**Acceptance Criteria:**

**Given** AR33 (TPC API contract obtained) and the TPC affiliate key in Supabase Edge Function env
**When** `supabase/functions/parking-search/index.ts` is implemented along with `tpc.ts` (TPC API client)
**Then** the function accepts POST with body `{ lat: number, lng: number, heading: number, miles: number }`
**And** it calls TPC's affiliate API with the SHAWN20 affiliate code embedded in the request
**And** it returns `EdgeResult<ParkingResult[]>` with TPC results normalized to `ParkingResult` (id, source: 'tpc', lat, lng, name, reservable: true, photos, gateHours, lighting, bookingUrl, distanceAhead)
**And** rate-limit check against `admin.rate_limits` (bucket = 'tpc'); on threshold, function falls through to fallback rather than returning rate_limited error to user (NFR-SC3)
**And** Vitest test covers TPC happy path with mocked TPC response
**And** Vitest test covers TPC rate-limit fallthrough (returns empty TPC array, doesn't throw)

### Story 2.3: parking-search Edge Function — state DOT integration

As a driver,
I want public-source rest-area results from state DOT APIs when I'm on a corridor,
So that I have a backup option even when no TPC inventory exists (FR11).

**Acceptance Criteria:**

**Given** Story 2.2 is complete and AR34 (state-DOT API set) is locked at 10 states (TX, CA, OH, GA, IL, IN, PA, NC, FL, TN)
**When** `supabase/functions/parking-search/stateDot.ts` is implemented with one normalizer function per state in the v1 set
**Then** the function determines which state(s) the lat/lng/heading falls into and queries those states' DOT APIs in parallel (with per-state timeout)
**And** failed states are silently dropped, NOT shown as user-visible errors (NFR-I2)
**And** results are normalized to `ParkingResult` with `source: 'state_dot'`, `reservable: false`, and a `state` field
**And** Vitest tests cover normalization for at least 3 of the 10 states using fixture responses
**And** integration test covers the "all states fail" case returning an empty state-DOT array, not throwing

### Story 2.4: parking-search Edge Function — OSM lookup + ranking

As a driver,
I want OSM truck-stop POIs returned alongside TPC and state DOT results, with the combined list ranked by direction-aware priority,
So that I always see the best option first regardless of source mix (FR10, FR11, FR12).

**Acceptance Criteria:**

**Given** Stories 2.2 and 2.3 are complete and `public.osm_truck_stops` has at least seed data
**When** `supabase/functions/parking-search/osm.ts` and `rank.ts` and `normalize.ts` are implemented
**Then** OSM POIs within the requested corridor (lat/lng/heading/miles) are fetched from Postgres and normalized to `ParkingResult` with `source: 'osm'`, `reservable: false`
**And** `rank.ts` returns a single sorted array: TPC reservable spots first (FR10), then state-DOT and OSM mixed by distance-ahead (closest-ahead first)
**And** the function returns `EdgeResult<ParkingResult[]>`
**And** zero-result case (no TPC + no state DOT + no OSM) emits a Plausible event `parking.lookup_zero_result` (FR18)
**And** integration test covers TPC-priority sort, fallback-only sort, and zero-result telemetry

### Story 2.5: osm-refresh weekly cron Edge Function

As Huffy,
I want OSM truck-stop POIs refreshed weekly via Overpass API into `osm_truck_stops`,
So that fallback lookups have current data without per-request Overpass hits (NFR-I3).

**Acceptance Criteria:**

**Given** Story 2.1 (`osm_truck_stops` table exists)
**When** `supabase/functions/osm-refresh/index.ts` and `overpass.ts` are deployed and a Supabase scheduled trigger is configured for weekly execution (Sunday 3am ET)
**Then** the function queries the OSM Overpass API for `[amenity=truck_stop OR (amenity=parking AND access=hgv)]` within US bounding box, with a request timeout
**And** it upserts results into `public.osm_truck_stops` keyed on `osm_id`, setting `last_refreshed_at = now()`
**And** rows whose `last_refreshed_at` is older than 30 days are pruned (cleanup of POIs that disappeared from OSM)
**And** the function logs aggregate-only summary (count fetched, count upserted, count pruned) — no per-row PII
**And** integration test covers a small fixture Overpass response and verifies the upsert + prune behavior
**And** when Overpass is unavailable, the function exits cleanly and the existing data continues to serve (NFR-I3)

### Story 2.6: ParkingHome screen with single-tap "Find Parking Ahead"

As a driver,
I want a one-tap "Find Parking Ahead" button on the home screen,
So that I can find parking with the minimum possible friction at 6:42pm with HOS clock running (FR9, NFR-P2).

**Acceptance Criteria:**

**Given** Epic 1 routing skeleton and Story 2.4 (parking-search Edge Function) are complete
**When** the driver navigates to `/` (parking home) and taps the "Find Parking Ahead" tile
**Then** `useDirectionOfTravel` reads `navigator.geolocation.getCurrentPosition()` and derives heading (or last-known cached heading if geolocation is denied/unavailable)
**And** `useParkingResults` invokes TanStack Query against `parkingApi.search({ lat, lng, heading, miles: 80 })`
**And** results render in `<ParkingResultsList>` within 3 seconds at p80 on simulated 4G (NFR-P2)
**And** if cached results exist for this corridor (Workbox cache hit), they render within 1 second at p80
**And** Plausible events `parking.lookup_started` (on tap) and `parking.lookup_returned` (on response) fire
**And** Playwright E2E test covers Journey 1 happy path (one-tap → result list)

### Story 2.7: TpcResultCard with AffiliateCTA + SHAWN20 deep-link

As a driver,
I want each TPC reservable result to show as a card with photos and a one-tap "Book with SHAWN20" CTA, with FTC disclosure adjacent,
So that I can book in one tap and the affiliate disclosure is structurally guaranteed (FR13, FR14, FR15).

**Acceptance Criteria:**

**Given** Story 2.6 is complete and `<AffiliateCTA>` from Story 1.7 is available
**When** a `ParkingResult` with `source: 'tpc'` is rendered in `<TpcResultCard>`
**Then** the card displays the location name, distance ahead, photos (lazy-loaded `loading="lazy"`), gate hours, and lighting info
**And** the booking button is wrapped in `<AffiliateCTA slot={tpcSlot}>` so the FTC disclosure renders as a sibling
**And** the booking link's `href` is the TPC `bookingUrl` from the API response with the SHAWN20 affiliate code pre-applied
**And** clicking the link emits Plausible event `parking.tpc_cta_clicked` and opens the TPC booking flow in a new tab
**And** the impression event `parking.tpc_cta_impression` fires once per slot per page render via `useTrackImpression`
**And** the FTC AST scan CI gate (Story 1.7) passes against this component
**And** unit test asserts the FTC disclosure is rendered as a sibling for any `slot` prop

### Story 2.8: PublicSourceCard + PublicSourceBanner — visually distinct fallback

As a driver,
I want public-source results (state DOT + OSM) visually distinguished from reservable TPC results, with a "no TPC ahead — always have a backup plan" banner when no TPC inventory exists,
So that I never confuse a non-reservable hopeful spot with a reservable one (FR12, Journey 2).

**Acceptance Criteria:**

**Given** Story 2.6 is complete
**When** `<ParkingResultsList>` renders a mixed result list
**Then** TPC results render as `<TpcResultCard>` with primary visual treatment (yellow `#FFEB00` CTA, badge "RESERVABLE")
**And** public-source results render as `<PublicSourceCard>` with secondary visual treatment (different background, badge "NOT RESERVABLE")
**And** when the result list contains no TPC results but does contain public-source results, `<PublicSourceBanner>` renders at the top with copy "No TPC reservable spots ahead. Always have a backup plan." (with the canonical parking disclaimer adjacent)
**And** state-DOT cards include a "live capacity unknown" sub-label
**And** OSM cards include the phone number (when present) and last-known operating hours
**And** unit tests cover all three render variants

### Story 2.9: ParkingDetail view

As a driver,
I want a detail view for any result showing photos, gate hours, lighting, and any other available metadata,
So that I can pick the right stop before booking (FR13).

**Acceptance Criteria:**

**Given** Stories 2.7 and 2.8 are complete
**When** the driver taps a result card and navigates to `/parking/:id`
**Then** `<ParkingDetail>` renders the full result payload (photos full-size, gate hours formatted, lighting info, address, phone number when present)
**And** for TPC results, the booking CTA from Story 2.7 is reused at the bottom of the detail view (still wrapped in `<AffiliateCTA>`)
**And** for public-source results, a "Call to confirm" link (when phone present) and the parking disclaimer render
**And** images use `loading="lazy"` and have alt text (NFR-A5)
**And** the detail view is accessible via deep link (`/parking/<id>`); refresh re-fetches the result via TanStack Query
**And** unit + E2E tests cover both TPC and public-source detail views

### Story 2.10: Workbox cache strategy + offline parking lookup

As a driver,
I want last-known cached parking results when my device is offline, with the cache timestamp clearly displayed,
So that the app still helps me on a thin corridor (FR16, NFR-I4, Journey 1, Journey 2).

**Acceptance Criteria:**

**Given** Story 1.9 (Workbox SW + cache namespaces) and Story 2.6 are complete
**When** the SW is configured with stale-while-revalidate strategy on the `parking-search` Edge Function URL, writing to `parking-results-v1` cache (max 48h, namespace from `cacheNames.ts`)
**Then** repeat-corridor lookups hit cache within 1 second at p80 (NFR-P2 cached path; NFR-P5 hit rate ≥90% on 48h corridor repeats)
**And** when `navigator.onLine === false`, `useOfflineParking` reads directly from cache and renders results
**And** `<OfflineBanner>` displays at the top of `<ParkingResultsList>` with the cache timestamp ("Showing cached results from <time>")
**And** the cache is partitioned strictly from any HOS data (NFR-S7); SW activate runtime assertion (Story 1.9) verifies this
**And** Playwright E2E test covers offline-mode rendering (browser context offline) showing cached results with timestamp banner

### Story 2.11: Parking module disclaimer + zero-result telemetry

As a driver,
I want the canonical parking disclaimer rendered at the top of every search-result set, and the system to telemeter zero-result lookups,
So that I'm never misled and the founder can monitor the disaster-scenario metric (FR17, FR18).

**Acceptance Criteria:**

**Given** Stories 2.6–2.10 are complete and `<Disclaimer kind="parking">` exists from Story 1.6
**When** `<ParkingResultsList>` renders any result set (TPC, public-source, or empty)
**Then** `<Disclaimer kind="parking">` renders at the top of the list with the canonical PRD copy
**And** when a lookup returns zero TPC AND zero public-source results, Plausible event `parking.lookup_zero_result` fires with corridor key as a non-PII prop (FR18)
**And** the empty-state UI renders calmly — no error toast, no flailing — with copy "No parking sources have data for this stretch right now. Try again in a few miles."
**And** the empty-state telemetry rate is observable in Plausible's dashboard for the <2% target metric

## Epic 3: HOS Tracker

An owner-operator opens the HOS module for the first time, reads the canonical disclaimer with minimum dwell, taps acknowledge, then logs duty status from four plain-English options with optional notes. Real-time clock shows remaining cycle/shift hours derived from manually-entered statuses. End-of-shift daily summary renders as plain-English tabular text — never a 24-cell grid. Entries auto-prune at 30 days; nothing crosses the wire. Day-7 nudge banner prompts weekly review. 90-day re-acknowledgment fires when due.

### Story 3.1: Dexie hosdb schema + hosRepository (CRUD + 30-day prune)

As Huffy,
I want a Dexie database with HOS entry, metadata, and counter tables, accessed only via `hosRepository`, with automatic 30-day pruning,
So that FR28, FR29, and the local-only privacy posture are structurally enforced (no other module can write to IndexedDB).

**Acceptance Criteria:**

**Given** Epic 1 is complete (Dexie installed)
**When** `src/modules/hos/db/hosdb.ts` defines a Dexie database `hosdb` with object stores `hos_entries` (id, status, startedAt, endedAt, note, createdAt) and `hos_meta` (key, value) and `hos_counters` (key, count)
**Then** `src/modules/hos/db/hosRepository.ts` exposes the only access surface: `addEntry`, `listEntries`, `getMeta`, `setMeta`, `incrementCounter`, `getCounter`, `pruneEntriesOlderThan(days)`
**And** `pruneEntriesOlderThan(30)` is invoked at app boot and on every entry write
**And** Vitest tests (with mocked Dexie / fake-indexeddb) cover CRUD and prune behavior
**And** ESLint `no-restricted-imports` rule prevents imports of `dexie` outside `src/modules/hos/db/`
**And** runtime assertion in `useHosEntries` confirms no `hosdb` write occurs through any other code path
**And** under no code path does any HOS payload reach a `fetch()`/`supabase.*` call (verified by grep + integration test)

### Story 3.2: HOS routing + RequireHosAck guard

As a driver opening the HOS module for the first time,
I want to land on the disclaimer screen and be unable to reach any HOS feature until I acknowledge,
So that FR19 is structurally enforced.

**Acceptance Criteria:**

**Given** Epic 1's stubbed `RequireHosAck` exists and Story 3.1 is complete
**When** the driver navigates to `/hos` or any sub-route under `/hos/*`
**Then** `RequireHosAck` reads `hos_meta.disclaimer_ack_at` from Dexie via `useHosDisclaimerAck`
**And** if the value is null OR older than 90 days, the guard redirects to `/hos/disclaimer` (FR22 90-day re-ack)
**And** if valid, the guard renders the requested HOS sub-route
**And** the `/hos/disclaimer` route itself is never gated by `RequireHosAck` (would be a redirect loop)
**And** all HOS routes wrap in `<HosShell>` (Story 1.8)
**And** unit tests cover all three guard outcomes (no-ack, expired-ack, valid-ack)

### Story 3.3: HosDisclaimer screen with min-dwell tap-to-acknowledge

As a first-time HOS user,
I want to read the full canonical disclaimer with a minimum dwell time before the acknowledge button enables,
So that I have time to actually read it (FR19, FR20).

**Acceptance Criteria:**

**Given** Story 3.2 is complete
**When** the driver lands on `/hos/disclaimer`
**Then** `<HosDisclaimer>` renders the canonical full disclaimer copy via `<Disclaimer kind="hosFull">` from `core/disclaimers.ts`
**And** the "I understand" acknowledge button is disabled for the first 4 seconds (minimum dwell per PRD success metric ≥4s median)
**And** after 4 seconds, the button enables and a subtle visual cue (e.g., button color change) signals readiness
**And** on tap, `hosRepository.setMeta('disclaimer_ack_at', new Date().toISOString())` is called and the user navigates to `/hos`
**And** Plausible event `hos.disclaimer_acknowledged` fires (with anonymized timing prop, no user key)
**And** Playwright E2E test covers the 4s-dwell + tap + redirect flow
**And** subsequent visits within 90 days do not re-prompt (verified by guard from Story 3.2)

### Story 3.4: StatusEntry — four-toggle plain-English status entry

As a driver,
I want to record my duty status from four plain-English options with an optional note,
So that I can keep my own record without ELD-style abbreviations (FR23, FR24, NFR-P4).

**Acceptance Criteria:**

**Given** Story 3.2 (HOS routes) and Story 3.1 (hosRepository) are complete
**When** the driver navigates to `/hos/log` (or `/hos`) and taps a status toggle
**Then** four toggles are rendered: "Driving", "On-Duty Not Driving", "Sleeper", "Off-Duty" (no abbreviations, no codes)
**And** tapping a status opens an entry form with a `startedAt` (defaulted to now, editable) and an optional plain-text note
**And** save invokes `hosRepository.addEntry({ status, startedAt, endedAt: null, note })` and closes the form
**And** the previous active entry's `endedAt` is set to the new entry's `startedAt` (sequential statuses)
**And** entry-save flow completes in ≤5 taps and ≤10s total at the median (NFR-P4) — verified by Playwright timing test
**And** Plausible event `hos.status_logged` fires with anonymized status type as prop
**And** unit tests cover the sequential-endedAt logic and the optional-note path

### Story 3.5: HosClock — real-time remaining cycle + shift display

As a driver,
I want a real-time clock showing my remaining 11-hour drive, 14-hour on-duty, and 70-hour cycle, computed from my manually-entered statuses, labeled as user-derived,
So that I can see where I stand at a glance — explicitly framed as "your math, not the ELD's" (FR25).

**Acceptance Criteria:**

**Given** Story 3.4 is complete (entries can be logged)
**When** the driver views `/hos` (HosHome)
**Then** `<HosClock>` reads entries via `useHosEntries` and computes (using `date-fns`):
  - Remaining 11-hour drive (sum of Driving status entries in current shift)
  - Remaining 14-hour on-duty (sum of Driving + OnDutyNotDriving in current shift)
  - Remaining 70-hour cycle (sum across last 8 days)
**And** the display refreshes every minute via `setInterval`
**And** all three numbers are labeled "Your math, based on what you've logged" — never "official" or "compliant"
**And** `useHosViolationWarning` exposes a derived flag when any clock approaches the AR36 thresholds (≤30 min on 11h, ≤45 min on 14h, ≤2h on 70h) — consumed by Epic 5 Story 5.8
**And** unit tests cover the three calculations against fixture entry sequences

### Story 3.6: DailySummary — plain-English tabular daily summary

As a driver,
I want an end-of-shift summary showing my drive hours, on-duty hours, and remaining cycle as plain-English text in a table — never a 24-cell grid,
So that I have a clean record I can read at a glance and FR27 is structurally enforced (FR26, FR27, FR62).

**Acceptance Criteria:**

**Given** Story 3.5 is complete
**When** the driver views `/hos/log` (DailySummary section at bottom)
**Then** `<DailySummary>` renders a `<table>` with rows: "Total drive hours today", "Total on-duty hours today", "Remaining 70-hour cycle clock"
**And** values are computed from the same entries via `hosCalc.ts`
**And** the rendered output uses HTML `<table>`/`<tr>`/`<td>` — NOT CSS grid, NOT a 24-column horizontal layout
**And** the `rods-grid` CI gate (Story 1.8) passes against this component on a snapshot test
**And** the summary footer reiterates "Your math, not the ELD's"
**And** unit tests verify (a) the calc against a fixture, (b) absence of any 24-column grid in the rendered output

### Story 3.7: WeeklySummaryNudge — day-7 in-app banner

As a driver who has logged at least 5 days,
I want an in-app banner on next app open at the day-7 retention milestone inviting me to view my weekly summary,
So that I form a daily habit (FR30; Journey 3).

**Acceptance Criteria:**

**Given** Story 3.4 is complete and entries exist across multiple days
**When** the driver opens the app and 7 days have elapsed since the first HOS entry, with at least 5 days of activity
**Then** `<WeeklySummaryNudge>` renders as a non-blocking banner on the HOS home with copy "You've logged 5 days this week. Want to see your weekly summary?"
**And** the banner has a dismiss button; once dismissed, it does not re-render until a new 7-day window passes
**And** the banner state is tracked in `hos_meta.last_nudge_dismissed_at`
**And** the nudge is in-app only — NOT a Web Push notification (push deferred to v1.5+; PRD)
**And** unit tests cover the trigger condition and dismiss-persistence behavior

### Story 3.8: Verify FR29 (no HOS over wire) and FR31 (no export) by absence

As Huffy,
I want a CI assertion that confirms no HOS payload ever reaches a network call and no export feature exists in the bundle,
So that FR29 and FR31 are continuously verified (not just at v1 launch).

**Acceptance Criteria:**

**Given** Stories 3.1–3.7 are complete
**When** the unit test suite runs
**Then** a test asserts that `grep -r "hos_entries\|hosdb\|HosEntry"` finds no matches in any file under `supabase/functions/` (HOS data does not appear server-side)
**And** a test asserts that `grep -r "exportHos\|hosExport\|downloadHos"` finds no matches anywhere in `src/` (no export feature in v1)
**And** a runtime test wraps `fetch` and `supabase.*` to detect any HOS payload shape in outbound network calls; the test exercises every HOS surface and asserts zero HOS-shaped payloads transit the wrapper
**And** these assertions run in the `unit` CI job and fail the build on regression

## Epic 4: Founder Admin & Affiliate Engine

Shawn signs in to a strictly-distinct admin surface, edits affiliate slot configs (vertical, banner image, CTA copy, code, UTM, on/off) without a code change, watches per-slot impression and click-through analytics, and tweaks Stan trigger thresholds. Slot config changes propagate to live clients within 15 minutes via Workbox stale-while-revalidate. The TPC slot in the parking flow transitions from hardcoded to admin-managed.

### Story 4.1: Affiliate-related migrations (slots + view + events_agg + trigger config)

As Huffy,
I want the Postgres tables that the founder admin reads from and writes to,
So that subsequent admin UI and beacon stories have schema in place.

**Acceptance Criteria:**

**Given** Epic 1 (admin schema) is complete
**When** migrations `0004_affiliate_slots.sql`, `0005_stan_trigger_config.sql`, `0009_affiliate_events_agg.sql` are written and applied
**Then** `admin.affiliate_slots` exists with columns `(id uuid PK, vertical text CHECK (vertical IN ('parking','fuel_card','load_board','insurance')), image_url text, cta_copy text, code text, utm jsonb, enabled boolean DEFAULT true, version integer DEFAULT 1, created_at, updated_at)` with admin-write RLS
**And** `public.affiliate_slots_public` is a view projecting `enabled = true` rows excluding admin metadata; anon-read allowed
**And** `admin.stan_trigger_config` exists with columns `(id uuid PK, trigger_kind text CHECK (trigger_kind IN ('carnivore_5_lookups','drivers_mind_10h','save_your_cdl_warn')), threshold integer, frequency text, enabled boolean, updated_at)` with admin-write RLS
**And** `analytics_agg.affiliate_events_agg` exists with columns `(slot_id uuid, day date, impressions integer, clicks integer, PRIMARY KEY (slot_id, day))` with admin-read + service-role-write RLS
**And** `supabase gen types` is re-run; types committed

### Story 4.2: AdminHome + RequireAdmin guard

As Shawn (founder),
I want to navigate to `/admin` and reach an admin landing page only when my JWT carries `is_admin: true`,
So that drivers cannot access admin features (FR56, FR60, NFR-S4).

**Acceptance Criteria:**

**Given** Epic 1 (claim-admin Edge Function + RequireAdmin guard) is complete
**When** Shawn navigates to `/admin` while signed in as an admin email
**Then** `<RequireAdmin>` permits access and `<AdminHome>` renders with navigation to Slots, Triggers, Analytics
**And** when a non-admin driver (no `is_admin` claim) navigates to `/admin`, they are redirected to `/`
**And** when an unauthenticated visitor navigates to `/admin`, they are redirected to `/auth/login`
**And** Playwright E2E test covers all three flows (admin allowed, driver redirected, anon redirected)
**And** the AdminHome surfaces the admin's email and a sign-out button

### Story 4.3: SlotEditor — slot config CRUD

As Shawn,
I want to view, create, edit, enable, and disable affiliate slot configurations from the admin UI without involving a developer,
So that I can wire a fuel-card affiliate from a parking-lot deal in real time (FR57, Journey 5).

**Acceptance Criteria:**

**Given** Story 4.1 (`affiliate_slots` table) and Story 4.2 (admin UI) are complete
**When** Shawn navigates to `/admin/slots`
**Then** `<SlotEditor>` lists every row in `admin.affiliate_slots` with columns: vertical, name (derived from cta_copy), enabled toggle, last updated
**And** a "New slot" button opens a form with fields: vertical (dropdown: parking/fuel_card/load_board/insurance), banner image upload (writes to Supabase Storage; URL persisted to `image_url`), CTA copy (text), discount code (text), UTM (key-value editor → jsonb), enabled (toggle)
**And** save persists via Supabase `from('affiliate_slots').upsert(...)` (admin RLS-gated) and bumps the slot's `version` field
**And** edit and delete-disable behave equivalently
**And** the editor refuses save if banner image upload fails
**And** Vitest + Playwright tests cover create, edit, disable, and admin-RLS rejection of an unauthorized JWT

### Story 4.4: TriggerEditor — Stan cross-promo trigger config

As Shawn,
I want to view and edit Stan Store cross-promo trigger thresholds (5-lookup, 10-hour, HOS-warning) from the admin UI,
So that I can tune trigger behavior without involving a developer (FR59).

**Acceptance Criteria:**

**Given** Story 4.1 (`stan_trigger_config` table) is complete
**When** Shawn navigates to `/admin/triggers`
**Then** `<TriggerEditor>` lists three rows (one per trigger kind) with editable threshold and enabled toggle
**And** save persists via Supabase upsert (admin RLS-gated)
**And** the trigger config is exposed to clients via the same `affiliate-config.json` propagation cycle (Story 4.7)
**And** Vitest tests cover edit + RLS rejection

### Story 4.5: affiliate-event-beacon Edge Function

As the system,
I want a lightweight POST endpoint that accepts impression and click events for affiliate slots, aggregates them daily into `affiliate_events_agg`, and is rate-limited per IP,
So that FR37 is fulfilled without per-user-keyed analytics (NFR-S6).

**Acceptance Criteria:**

**Given** Story 4.1 (`affiliate_events_agg` table) is complete
**When** `supabase/functions/affiliate-event-beacon/index.ts` is deployed
**Then** the function accepts POST with body `{ slot_id: uuid, kind: 'impression' | 'click' }` (no user_id, no IP, no email — verified by JSON schema validation)
**And** the function increments the matching row in `analytics_agg.affiliate_events_agg` for `(slot_id, current_date)` using service-role
**And** in-memory rate limit: 1000 requests / minute / IP (drops above threshold, returns 200 OK with `{ ok: true }` to avoid client retry storms)
**And** the function logs aggregate counts only (no per-IP, no per-user logs) per NFR-I6
**And** Vitest tests cover happy path, rate-limit drop, and JSON schema rejection of disallowed fields

### Story 4.6: SlotAnalytics — per-slot impression + CTR view

As Shawn,
I want to view per-slot impression and click-through analytics over a selectable time window from the admin UI,
So that I can see which trigger underperforms and tweak placement copy (FR58, Journey 5).

**Acceptance Criteria:**

**Given** Stories 4.1, 4.5 are complete and at least one slot has events recorded
**When** Shawn navigates to `/admin/analytics`
**Then** `<SlotAnalytics>` displays a row per slot with: slot name, impressions, clicks, CTR (clicks/impressions), over a selectable window (last 7d / 30d / 90d default 7d)
**And** data is queried from `analytics_agg.affiliate_events_agg` joined to `admin.affiliate_slots` (admin-RLS-gated)
**And** the view never queries any user-keyed table (NFR-S6 compliance verified)
**And** when a slot has zero impressions in the window, it renders with a "—" placeholder
**And** Vitest tests cover the rollup query and the empty-state render

### Story 4.7: SlotRenderer + useAffiliateConfig — ≤15-min propagation

As a driver in the field,
I want any affiliate slot config change Shawn makes to reach my client within 15 minutes,
So that founder ops are timely without requiring a code deploy (FR36, NFR-P7, Journey 5).

**Acceptance Criteria:**

**Given** Story 4.3 is complete (admin can save slot configs)
**When** `src/modules/affiliate/hooks/useAffiliateConfig.ts` and `<SlotRenderer slot={…}>` are implemented
**Then** the client fetches `affiliate_slots_public` via TanStack Query at app boot and caches via Workbox `affiliate-config-v1` cache (stale-while-revalidate, max age 15 minutes)
**And** when an admin saves a slot config, the slot's `version` bumps; clients reconcile within ≤15 minutes at p95 (NFR-P7)
**And** `<SlotRenderer slot={…}>` renders the slot using `<AffiliateCTA>` for FTC compliance (FR34) — verified by FTC AST scan CI gate (Story 1.7)
**And** impression beacon (Story 4.5) fires once per slot render via `useTrackImpression`
**And** integration test simulates an admin save and verifies a fresh client receives the new config within 15 minutes
**And** when offline, the client serves the last-cached config (no service-down state)

### Story 4.8: Transition TPC slot from hardcoded to admin-managed

As Shawn,
I want the TPC parking slot (the v1 launch slot) to be configured through the admin UI like every other slot,
So that the multi-vertical schema is validated end-to-end with the v1 launch affiliate (PRD Innovation #1).

**Acceptance Criteria:**

**Given** Stories 4.1–4.7 are complete and Epic 2 originally rendered TPC with a hardcoded slot config
**When** the TPC slot is seeded into `admin.affiliate_slots` (vertical='parking', cta_copy="Book with SHAWN20", code='SHAWN20', utm matching launch UTM, enabled=true)
**Then** `<TpcResultCard>` (Story 2.7) is refactored to source its slot config from `useAffiliateConfig` keyed on a stable slot identifier (e.g., the only `vertical='parking', enabled=true` row)
**And** removing the seeded TPC row in admin causes TPC cards to disappear from the parking flow within 15 minutes
**And** the TPC cards still pass the FTC AST scan and behave identically (booking link, photos, etc.) to the hardcoded version from Epic 2
**And** an integration test asserts the admin-driven TPC slot renders correctly after a hard refresh

## Epic 5: Cohort Attribution & Cross-Promo

Stan Store buyers and cold-YouTube installs are tagged at signup; cohort persists for the lifetime of the account; analytics reports retention and monetization by cohort. Verified-email export pipeline ships installed users to Shawn's owned-channel pipeline daily. Stan Store cross-promos fire by trigger (Carnivore at 5 lookups, Driver's Mind at 10 hours, Save Your CDL on HOS warning) — never as banner spam. "More from Shawn" panel links YouTube and the Stan Store catalog.

### Story 5.1: email_export_queue migration

As Huffy,
I want a queue table for the verified-email export pipeline,
So that the daily-cron Edge Function can stage rows and retry failed deliveries.

**Acceptance Criteria:**

**Given** Epic 1 (admin schema) is complete
**When** migration `0008_email_export_queue.sql` is applied
**Then** `admin.email_export_queue` exists with columns `(id uuid PK, email text, cohort_tag text, queued_at timestamptz, exported_at timestamptz, attempts integer DEFAULT 0, last_error text)` with admin-only RLS
**And** an index on `(exported_at IS NULL, queued_at)` exists for efficient queue scans
**And** `supabase gen types` is re-run; types committed

### Story 5.2: email-export Edge Function (daily cron)

As Shawn,
I want a daily batch export of newly verified email addresses to my owned-channel pipeline,
So that every Stan Store buyer who installs the app is funneled into my email list (FR46).

**Acceptance Criteria:**

**Given** Story 5.1 is complete and `EXPORT_PIPELINE_ENDPOINT` is configured in Supabase Edge Function env
**When** `supabase/functions/email-export/index.ts` is deployed and a Supabase scheduled trigger is configured for daily 4am ET
**Then** on each run, the function selects rows from `admin.email_export_queue` where `exported_at IS NULL` (batch up to 1000)
**And** it POSTs each batch to `EXPORT_PIPELINE_ENDPOINT` with the `(email, cohort_tag)` payload (no other PII)
**And** on success, marks rows with `exported_at = now()`
**And** on failure, increments `attempts` and writes `last_error`; rows with `attempts >= 5` are dead-lettered (logged but not retried)
**And** the function writes aggregate-only logs (count exported, count failed) — no per-email logging (NFR-I6)
**And** newly-completed signups are added to the queue via a Postgres trigger on `auth.users` insert (or an `on_signup` Supabase auth hook)
**And** Vitest integration test covers happy path, retry path, and dead-letter path

### Story 5.3: Cohort persistence + Plausible analytics props verification

As Huffy,
I want end-to-end verification that cohort tags written at signup (Epic 1 Story 1.11) persist for the account lifetime and reach Plausible event props,
So that cohort-segmented metrics are queryable from day one (FR43, FR44, FR45).

**Acceptance Criteria:**

**Given** Epic 1 Stories 1.11/1.12 are complete (cohort tagged at signup)
**When** `src/core/analytics.ts` `track(eventName, props)` wrapper is enriched with cohort tag from `useAuthStore`
**Then** every Plausible event includes a `cohort` prop (`day1_stan` or `cold_youtube`) when the user is signed in
**And** the cohort prop is NEVER user-keyed (no email, no UUID — only the cohort label string)
**And** in Plausible, retention and monetization metrics can be filtered by `cohort=day1_stan` vs `cohort=cold_youtube`
**And** an integration test signs up two users (one with `?utm_source=stan_store`, one without), exercises the same flow, and asserts both cohort tags appear in distinct Plausible events
**And** the Settings → Privacy → Right-to-Know (Epic 6) lists `cohort_tag` as a stored data category

### Story 5.4: Stan Store outbound link UTM tagging

As Huffy,
I want every outbound link from the app to a Stan Store product tagged with UTM parameters,
So that Stan Store can attribute purchases back to the trigger or panel that sent the click (FR42 outbound side).

**Acceptance Criteria:**

**Given** Epic 1 (UTM-survival mechanism) is complete
**When** `src/core/stanLinks.ts` exports `stanLink(productSlug, utmCampaign, utmContent)` returning a URL like `https://stan.store/<slug>?utm_source=trucking_life_app&utm_medium=in_app&utm_campaign=<utmCampaign>&utm_content=<utmContent>`
**Then** every Stan Store outbound link in the codebase routes through this helper (verified by ESLint rule + grep CI check)
**And** the helper opens links in a new tab via `target="_blank"` with `rel="noopener noreferrer"`
**And** unit test covers the URL construction for each product (Carnivore, Driver's Mind, Save Your CDL, 17 Years Zero Violations)

### Story 5.5: useStanTrigger hook + parking-lookup counter

As a driver,
I want my parking-lookup count tracked locally in Dexie and exposed to the Stan trigger system,
So that Carnivore cross-promo fires at exactly 5 lookups (FR38).

**Acceptance Criteria:**

**Given** Story 3.1 (`hos_counters` table in Dexie) is complete and Story 4.7 (admin-managed trigger config) provides thresholds
**When** `src/modules/stan-promo/hooks/useStanTrigger.ts` is implemented along with a parking-lookup counter increment in `useParkingResults`
**Then** every successful parking lookup invokes `hosRepository.incrementCounter('parking_lookups')` via the parking module hook (the counter lives in Dexie, accessed via `hosRepository` which is the only Dexie surface)
**And** `useStanTrigger('carnivore')` reads the counter and returns true when count === threshold (5 by default, configurable via admin) AND the user has not yet seen the Carnivore promo (tracked in `hos_counters.carnivore_shown`)
**And** when the trigger fires, the `carnivore_shown` counter is set to 1 to ensure exactly-once
**And** unit tests cover threshold met, already-shown, and disabled-via-admin paths
**And** the Plausible event `hos.cross_promo_shown` (named for cross-cutting consistency, even for parking trigger) fires with `{ product: 'carnivore', trigger: 'parking_5_lookups' }` props

### Story 5.6: CarnivoreTriggerCard

As a driver who has done 5 successful parking lookups,
I want to see a single Stan Store cross-promo card for "Carnivore in the Truck",
So that the cross-promo feels earned, not screen-spam (FR38).

**Acceptance Criteria:**

**Given** Story 5.5 is complete
**When** `useStanTrigger('carnivore')` returns true on `<ParkingHome>` mount
**Then** `<CarnivoreTriggerCard>` renders below the parking results as a non-blocking card with the Carnivore product tile, "Made by Shawn for the cab" copy, and a CTA linking to the Carnivore product via `stanLink('carnivore', 'cross_promo', 'parking_5_lookups')`
**And** the card is wrapped in `<AffiliateCTA>` (Stan Store affiliate disclosure applies — verified by FTC scan)
**And** dismissing the card persists `carnivore_dismissed_at` in `hos_meta`; subsequent lookups do NOT re-render the card
**And** Plausible events `cross_promo.carnivore_impression` and `cross_promo.carnivore_clicked` fire on render and click
**And** Playwright E2E test covers the 5-lookup → first-render → dismiss flow

### Story 5.7: DriversMindTriggerCard

As a driver who has logged 10 cumulative HOS hours,
I want to see a single cross-promo card for "Driver's Mind",
So that the trigger feels mental-wellness-relevant after meaningful logging (FR39).

**Acceptance Criteria:**

**Given** Story 3.5 (HOS clock totals) is complete
**When** `useHosCrossPromoTrigger` reads cumulative on-duty hours from Dexie and returns true when total ≥ 10 AND `drivers_mind_shown` is unset
**Then** `<DriversMindTriggerCard>` renders on `/hos` (HosHome) the next time the driver opens it
**And** the card uses `stanLink('drivers_mind', 'cross_promo', 'hos_10h')`, wrapped in `<AffiliateCTA>`
**And** exactly-once: once shown, the trigger never fires again (tracked via `hos_meta.drivers_mind_shown_at`)
**And** Playwright E2E covers logging 10 hours → next-open render → click

### Story 5.8: SaveYourCdlTriggerCard — HOS-violation trigger

As a driver approaching an HOS limit,
I want to see a "Save Your CDL" cross-promo when my clock approaches a violation threshold,
So that the trigger is contextually earned (FR40, AR36).

**Acceptance Criteria:**

**Given** Story 3.5 (HosClock + useHosViolationWarning) is complete and AR36 thresholds are locked
**When** `useHosViolationWarning` returns true (clock within ≤30 min on 11h drive, ≤45 min on 14h on-duty, OR ≤2h on 70h cycle) AND the user has not seen the card in the past 30 days
**Then** `<SaveYourCdlTriggerCard>` renders as an in-app banner (non-blocking) on the HOS surface with copy referencing the specific clock approaching (e.g., "30 minutes from your 11-hour drive limit")
**And** the card uses `stanLink('save_your_cdl', 'cross_promo', 'hos_warning_<reason>')`, wrapped in `<AffiliateCTA>`
**And** rate-limited to once per 30 days regardless of how many warnings fire (per "annoying = uninstall" constraint)
**And** Plausible events fire on impression and click
**And** Vitest tests cover all three threshold scenarios + the rate-limit behavior

### Story 5.9: MoreFromShawnPanel — settings link out

As a driver who wants more of Shawn's content,
I want a "More from Shawn" panel from Settings linking the YouTube channel and the full Stan Store catalog,
So that I can self-discover content/products without trigger-based prompting (FR41).

**Acceptance Criteria:**

**Given** Story 1.14 (Settings shell) is complete
**When** the driver navigates to `/settings/more`
**Then** `<MoreFromShawnPanel>` renders as a list with: "Watch on YouTube" (link to channel), and one row per Stan Store product (Save Your CDL, 17 Years Zero Violations, Carnivore in the Truck, Driver's Mind), each via `stanLink(slug, 'more_from_shawn', 'settings_panel')`
**And** the panel is wrapped in `<AffiliateCTA>` per product row (FTC compliance)
**And** the YouTube link opens in a new tab with `noopener noreferrer`
**And** Plausible events `more_from_shawn.youtube_clicked`, `more_from_shawn.<slug>_clicked` fire on click
**And** unit tests cover render and click behaviors

## Epic 6: Privacy, Compliance Hardening & v1 Launch

CCPA/CPRA Right-to-Know, Right-to-Delete, and analytics opt-out flows reachable from Settings at all times. Account deletion completes server-side and emails confirmation. Public privacy and affiliate-disclosure URLs live, lawyer-reviewed, and indexable. Every CI gate enforcing — FTC AST scan, RODS-grid heuristic, Lighthouse Perf ≥90, A11y ≥95, bundle ≤200KB gz, all green. Pre-launch attorney sign-off on shipped UX. Insurance bound. v1 ready to ship.

### Story 6.1: PrivacyPanel + RightToKnow data summary

As a driver,
I want a panel listing every category of data the app stores about me,
So that my CCPA/CPRA Right-to-Know is fulfilled (FR49, NFR-C4).

**Acceptance Criteria:**

**Given** Epic 1 (Settings shell) is complete
**When** the driver navigates to `/settings/privacy`
**Then** `<PrivacyPanel>` renders four entry points: "What we know about you", "Delete my account", "Opt out of analytics", "Privacy policy" (links to `/privacy`)
**And** "What we know about you" navigates to `<RightToKnow>` which lists, by category, the data the app stores: Account email, OAuth identity (provider name only), HOS entries (count + retention period), Recent parking searches (count, no locations), Cohort tag, App usage analytics (aggregate-only)
**And** the page indicates which categories are server-side vs. on-device-only
**And** the page reaches the live values (counts) from Supabase + Dexie via TanStack Query and `useHosEntries`
**And** Lighthouse Accessibility ≥95 passes
**And** unit + Playwright tests cover the data summary render

### Story 6.2: RightToDelete + delete-account Edge Function

As a driver,
I want a single-click "Delete my account and data" option that completes server-side within 30 days,
So that my CCPA/CPRA Right-to-Delete is fulfilled (FR50, FR51, NFR-S5).

**Acceptance Criteria:**

**Given** Story 6.1 is complete
**When** the driver navigates to `/settings/privacy/delete` and confirms deletion (with a typed-confirmation field requiring "DELETE" to enable the button)
**Then** the client calls `supabase/functions/delete-account/index.ts` (deployed)
**And** the Edge Function (using SUPABASE_SERVICE_ROLE_KEY) deletes rows from `public.profiles`, `public.parking_lookups_recent` (matching this user's device hashes), `admin.email_export_queue` (matching email), then `auth.users` (cascade)
**And** an email confirmation is queued to the user's email (via Supabase auth or a dedicated transactional email)
**And** the user is signed out and shown a "Your account has been deleted" confirmation screen
**And** local state is cleared (Dexie hosdb dropped, localStorage cleared, Workbox caches cleared)
**And** the deletion is irreversible per the displayed copy (no undo)
**And** Vitest integration test covers the full deletion path against test data
**And** Playwright E2E covers the typed-confirmation gate and the post-delete flow

### Story 6.3: AnalyticsOptOut toggle

As a driver,
I want to opt out of all analytics tracking from the Settings → Privacy panel,
So that my CCPA/CPRA Right to Opt-Out is fulfilled (FR52).

**Acceptance Criteria:**

**Given** Story 6.1 is complete
**When** the driver toggles "Opt out of analytics" in `<AnalyticsOptOut>`
**Then** `profiles.analytics_opt_out` is updated to `true` and persisted to Zustand `prefs` store
**And** `src/core/analytics.ts` `track()` is a no-op when `analytics_opt_out === true` (verified by unit test)
**And** the toggle state is preserved across sessions
**And** Plausible's tracking script is not loaded at all when the user is opted out (verified by network panel inspection in Playwright)
**And** unit + Playwright tests cover the opt-out behavior

### Story 6.4: Static stable URLs (privacy + affiliate-disclosure)

As a visitor or driver,
I want public URLs for the privacy policy and affiliate disclosure that are stable and indexable,
So that they are reachable from the app footer, YouTube descriptions, and email transports without any auth gate (FR53, FR54).

**Acceptance Criteria:**

**Given** Epic 1 (Netlify deploy + `_redirects`) is complete
**When** lawyer-reviewed `public/privacy.html` and `public/affiliate-disclosure.html` are committed
**Then** both files are valid stand-alone HTML pages (no SPA bundle dependency, render with JS disabled)
**And** Netlify `_redirects` routes `/privacy` to `/privacy.html` and `/affiliate-disclosure` to `/affiliate-disclosure.html`
**And** both URLs return 200 OK with `text/html` and are indexable (no `noindex` meta)
**And** the app footer links to both URLs from every page (driver and admin)
**And** Lighthouse Accessibility ≥95 passes on both pages
**And** Playwright E2E test covers footer link click → static page render

### Story 6.5: Verify all 8 CI gates enforce on bad PRs

As Huffy,
I want explicit verification that all 8 CI gates fail the build on intentionally-bad inputs,
So that the gates are real protections, not green-by-accident (FR35, FR62, FR63, FR64, NFR-P6, NFR-A2).

**Acceptance Criteria:**

**Given** Stories 1.5, 1.6, 1.7, 1.8 are complete and all of Epics 2–5 are implemented
**When** intentionally-bad fixture branches are pushed:
  - A branch that adds an `<a href="https://truckparkingclub.com/book?...">` outside `<AffiliateCTA>` → `ftc-disclosure` job FAILS
  - A branch that adds `<div className="grid grid-cols-24">` inside a `<HosShell>` route → `rods-grid` job FAILS
  - A branch that adds an unused 250KB import to `App.tsx` → `bundle-size` job FAILS
  - A branch that removes alt text from a meaningful image → `lighthouse` job FAILS (A11y < 95)
  - A branch with a TS error → `typecheck` job FAILS
  - A branch with an inline disclaimer string in JSX → `lint` job FAILS (custom rule)
**Then** each PR gets a red CI check and is blocked from merging to `main` per Netlify branch protection
**And** reverting the bad change makes all 8 jobs green
**And** these intentionally-bad fixture branches are documented in `tests/fixtures/ci-gate-fixtures.md` as the canonical "this is why we have CI gates" reference
**And** Plausible logs no false-positive build-fail events

### Story 6.6: Pre-launch business gate checklist

As Shawn (founder),
I want a single-page pre-launch checklist verifying all non-code gates from the PRD are closed,
So that v1 cannot ship until insurance, lawyer review, LLC routing, and YouTube disclosure are confirmed (PRD Pre-Launch Gates).

**Acceptance Criteria:**

**Given** all code epics (1–5) are complete and Stories 6.1–6.5 are merged
**When** `_bmad-output/planning-artifacts/launch-checklist.md` is created and reviewed
**Then** the checklist has the following items, each with an explicit owner (Shawn, Huffy, or attorney) and a tick-box:
  - [ ] Pre-launch transportation/tech-attorney consult complete; HOS disclaimer copy, parking module disclaimer, FTC affiliate disclosure language, privacy policy, CCPA/CPRA flow reviewed
  - [ ] Tech E&O + product liability + cyber insurance bound for the LLC
  - [ ] LLC formalities verified (capitalization, bank separation, observed governance)
  - [ ] Lawyer-reviewed final HOS disclaimer copy on shipped UX (sign-off pass on built UX, not draft)
  - [ ] HOS UI guardrails verified in build (no RODS-grid, tap-to-acknowledge live, footer disclaimer, 90-day re-ack scheduled)
  - [ ] LLC affiliate-revenue routing confirmed (SHAWN20 commissions to LLC bank)
  - [ ] YouTube launch-video FTC disclosure locked (description, verbal callout, pinned comment)
  - [ ] In-app FTC disclosure verified rendering on every affiliate-CTA screen (CI gate green)
  - [ ] Audience device-mix survey results reviewed; iOS share <40% OR mitigation plan documented (PRD)
  - [ ] Continuous accelerator triggers documented (subpoena, paid feature, media coverage, partnership beyond TPC, HOS-related support ticket suggesting reliance, 500 active HOS users)
**And** all items are checked before pushing the v1 launch tag to GitHub
**And** Shawn signs off on the checklist in the GitHub PR description that bumps the version to `1.0.0`

## Epic 7: v1.05 UX Polish (Sally) — Post-Launch

Sally's UX pass lands the Mossy Oak palette, `#FFEB00` CTA token finalization, dark mode polish, masculine/blue-collar tone validation, and WCAG AA contrast verification per token. Stories created during a separate planning pass when Sally's UX design document exists.

### Story 7.1: Sally UX spec authored — placeholder (precondition for further v1.05 stories)

As Sally (UX designer),
I want the v1.05 UX specification authored covering Mossy Oak palette, CTA tokens, dark mode polish, tone validation, and per-token contrast verification,
So that v1.05 implementation stories can be planned and sized.

**Acceptance Criteria:**

**Given** v1 is launched and the founder-approved Mossy Oak / `#FFEB00` direction is locked
**When** Sally authors `_bmad-output/planning-artifacts/ux-design.md` covering: full token set (color, spacing, typography), per-token WCAG 2.1 AA contrast verification (NFR-A8), dark/light mode pairings, Mossy Oak accent treatment guidance, tone callouts per surface (parking, HOS, settings, admin), and any reusable component proposals
**Then** the v1.05 epic is re-planned via a separate `bmad-create-epics-and-stories` pass with the UX spec as input
**And** stories are created and sized to the 1-week v1.05 budget (per PRD)
**And** any failing-contrast tokens are escalated, not shipped (NFR-A8)
**And** `_bmad-output/planning-artifacts/epics.md` is updated with the expanded Epic 7 story list


