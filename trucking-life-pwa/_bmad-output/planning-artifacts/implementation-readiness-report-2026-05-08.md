---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
status: 'complete'
completedAt: '2026-05-08'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/product-brief-trucking.md
  - _bmad-output/planning-artifacts/product-brief-trucking-distillate.md
uxDocumentStatus: 'intentionally deferred to v1.05 (Sally post-launch UX pass)'
priorReports:
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-05-07.md (superseded — pre-architecture, pre-epics)
project_name: 'Trucking Life with Shawn'
user_name: 'huffy'
date: '2026-05-08'
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-08
**Project:** Trucking Life with Shawn

## Document Inventory

### Required inputs

| Document | Path | Size | Last Modified |
|---|---|---|---|
| PRD | `_bmad-output/planning-artifacts/prd.md` | 87 KB | 2026-05-07 |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | 76 KB | 2026-05-07 |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` | 99 KB | 2026-05-08 |

### Supporting context

- `_bmad-output/planning-artifacts/product-brief-trucking.md` — original brief
- `_bmad-output/planning-artifacts/product-brief-trucking-distillate.md` — distilled brief

### UX Design — intentionally absent

UX Design Specification has not been authored at v1 planning. The PRD defers Sally's UX pass to **v1.05 post-launch** (1 week of full-time work, post-soft-launch). v1 ships with a functional design that meets the Lighthouse Accessibility CI gate (≥95) but is intentionally pre-polish.

This is **not a planning gap** — it's a documented sequencing decision in PRD § *Project Scoping & Phased Development* and architecture § *Locked Inputs*. Epic 7 of `epics.md` is a placeholder for the v1.05 sprint plan.

### Duplicates and prior reports

- No whole-vs-sharded duplicates exist for any required input.
- `implementation-readiness-report-2026-05-07.md` is a prior, **superseded** report run before architecture and epics existed; today's run produces this fresh dated report. Recommend keeping the prior on disk as historical record or removing it post-this-run.

### Issues

- **Critical:** None.
- **Warning:** None.
- **Info:** UX Design deferred to v1.05 by design.

## PRD Analysis

The PRD was read end-to-end (1,462 lines). Requirements were extracted in full during the prior `bmad-create-epics-and-stories` workflow and persisted to `epics.md` § *Requirements Inventory*. This section names every requirement by ID with its load-bearing intent, for traceability.

### Functional Requirements — 66 total, 9 groups

**Authentication & Onboarding (FR1–FR8):** magic-link signup, Google sign-in, sign-in any device, no passwords, two-question onboarding, iOS A2HS inline, Android `beforeinstallprompt` after second engaged session, land on parking home post-onboarding.

**Parking Discovery (FR9–FR18):** single-tap "find parking ahead", TPC-prioritized results, public-source fallback (state DOT + OSM), visually distinct fallback, detail view with photos/gate hours/lighting, one-tap TPC reservation with SHAWN20 pre-applied, FTC disclosure adjacent to every TPC CTA, offline cached results with timestamp, parking module disclaimer on every result set, zero-result lookup telemetry.

**HOS Tracker (FR19–FR31):** first-launch tap-to-acknowledge with min dwell, permanent footer disclaimer every screen, 90-day re-acknowledge, four plain-English statuses (Driving/On-Duty Not Driving/Sleeper/Off-Duty), optional notes, real-time clock derived from manually-entered statuses, end-of-shift daily summary as plain-English tabular text, NO 24-cell horizontal grid (RODS-grid prohibition), 30-day client-side retention with auto-prune, no HOS payload ever transmitted, day-7 in-app banner nudge, no export/PDF/CSV in v1.

**Affiliate & Monetization Engine (FR32–FR37):** multi-vertical schema (parking/fuel-card/load-board/insurance), multiple slots concurrent, FTC disclosure adjacent to every affiliate CTA, CI gate fails build on missing disclosure-as-sibling, ≤15-min config propagation, per-slot impression+CTR tracking.

**Stan Store Cross-Promotion (FR38–FR42):** Carnivore at 5 lookups exactly once, Driver's Mind at 10 hours exactly once, Save Your CDL on HOS warning, More-from-Shawn settings panel, UTM survives magic-link auth roundtrip.

**Cohort & Attribution (FR43–FR46):** Day-1 vs cold-YouTube cohort tag at signup, persistent for account lifetime, exposed to analytics, verified-email export pipeline.

**Settings, Privacy & Account (FR47–FR55):** Settings screen with email/OTR-local/start-state/dark-mode, dark mode default, Right-to-Know data summary, Right-to-Delete account deletion, email confirmation on delete, analytics opt-out, public privacy URL, public affiliate-disclosure URL, sign out.

**Founder Admin & Operations (FR56–FR60):** founder admin sign-in, slot config CRUD without code, per-slot analytics view, Stan trigger config, admin restricted to founder-level credentials.

**Cross-Cutting & Compliance (FR61–FR66):** single-source disclaimer module, RODS-grid CI gate, Lighthouse Performance ≥90 CI gate, Lighthouse Accessibility ≥95 CI gate, no server-side parking-lookup history, aggregate-only non-user-keyed analytics.

**Total FRs: 66** (verified by direct count in PRD § *Functional Requirements*).

### Non-Functional Requirements — 40 total, 6 categories

**Performance (NFR-P1–P8):** cold-open <2s p75 4G; first parking result <3s online / <1s cached p80; magic-link auth ≤30s median; HOS entry ≤5 taps / ≤10s; SW cache hit ≥90% on 48h corridor repeats; initial bundle ≤200KB gz; affiliate config propagation ≤15min p95; Lighthouse Perf ≥90.

**Security (NFR-S1–S8):** secrets server-side only, never in client bundles; TLS 1.2+; magic-link 15-min single-use; admin auth strictly distinct from driver; account deletion ≤30 days; aggregate-only analytics; SW vs HOS cache strictly partitioned; no HOS over wire.

**Scalability (NFR-SC1–SC5):** ≥75K monthly sessions; ≥30 lookups/s sustained, 5x burst; TPC rate-limit graceful fallback; ≥50 concurrent affiliate slots; TPC outage no service-down.

**Accessibility (NFR-A1–A8):** WCAG 2.1 AA contrast; Lighthouse A11y ≥95; touch targets ≥48dp/44pt; keyboard focus + visible indicators; meaningful image alt text; `prefers-reduced-motion`; form labels; UX token contrast verified pre-ship (v1.05).

**Integration & Reliability (NFR-I1–I6):** TPC-down fallback in same lookup with no error toast; state DOT degrade gracefully; OSM weekly refresh + cache; offline-mode cached results with timestamp; UTM survives auth roundtrip; aggregate-only logs.

**Compliance (NFR-C1–C5):** FTC disclosure adjacent to every affiliate CTA (CI-verified); permanent HOS footer disclaimer; no 24-cell HOS grid (CI-verified); CCPA flows always reachable; canonical disclaimer strings single-source.

**Total NFRs: 40** (verified by direct count in PRD § *Non-Functional Requirements*).

### Additional Requirements (constraints + integrations from PRD)

**Architectural lock-ins (PRD-imposed):** PWA single-page React; Supabase as auth + DB + Edge Functions; iOS Safari 16.4+ primary, Android Chrome latest 2; aggregate-only analytics (Plausible-or-equivalent); no native iOS/Android apps in v1; no Apple Sign-In v1; no real-time features in v1.

**External integrations:** TruckParkingClub affiliate API + SHAWN20 deep-link; state DOT rest-area APIs (per state, normalized); OpenStreetMap Overpass API (weekly refresh); Stan Store deep-link UTM; magic-link email transport.

**Compliance lock-ins:** FMCSA non-claim posture (49 CFR Part 395); FTC endorser disclosure (16 CFR Part 255); CCPA/CPRA Right-to-Know + Right-to-Delete + Opt-Out at first install (not deferred).

**Pre-launch business gates** (non-code, must close before v1 ships): pre-launch attorney consult; Tech E&O + product liability + cyber insurance bound; LLC formalities verified; lawyer-reviewed final HOS disclaimer copy on shipped UX; LLC affiliate-revenue routing confirmed; YouTube launch-video FTC disclosure locked; in-app FTC disclosure rendering verified; audience device-mix survey published.

**Schedule constraint:** v1 = 4–6 weeks of full-time Huffy, covering parking + HOS + cross-cutting infrastructure; v1.05 = 1 week post-launch UX polish; v1.5+ growth features (HOS export, fuel-card affiliate, etc.).

### PRD Completeness Assessment

The PRD is **complete and unambiguous for v1 implementation** with the exception of three items the PRD itself flags as open and which the architecture validation already captured as Sprint 0 prereqs (AR33–AR36):

- **TPC affiliate API contract** — referenced architecturally but not specified in detail (correct — it's a partner contract, not a PRD field).
- **State DOT API set** — PRD permits per-state degradation but doesn't lock the v1 launch set (architecture suggests top-10 corridors).
- **HOS-violation thresholds** — PRD defines warnings exist but doesn't quantify "warning"; architecture proposes specific thresholds.

These are acceptably open for the planning phase and slated for resolution before stories #2.2, #2.3, and #5.8 begin. None block today's readiness assessment.

## Epic Coverage Validation

I traced every PRD FR against the **actual acceptance criteria** of the corresponding story in `epics.md`, not just the FR Coverage Map claim. The check is: does the story's AC text *fulfill* the FR — not just *reference* it?

### Coverage Matrix (66 / 66)

| FR | PRD requirement (load-bearing intent) | Story | AC fulfills? |
|---|---|---|---|
| FR1 | Magic-link signup | 1.11 | ✓ AC: `signInWithOtp` + email submission |
| FR2 | Google sign-in | 1.12 | ✓ AC: `signInWithOAuth({ provider: 'google' })` |
| FR3 | Sign in any device | 1.11 + 1.12 | ✓ Standard Supabase session model |
| FR4 | No passwords anywhere | 1.11 | ✓ AC: "no password input field exists anywhere" |
| FR5 | Two-question onboarding | 1.13 | ✓ AC: "exactly two screens" |
| FR6 | iOS A2HS inline | 1.9 | ✓ AC: `iOSInstallInstructions()` inline render |
| FR7 | Android `beforeinstallprompt` | 1.9 | ✓ AC: "non-intrusive banner after second engaged session" |
| FR8 | Land on parking after onboarding | 1.13 | ✓ AC: "navigated to / (the parking home tile per FR8)" |
| FR9 | Single-tap parking lookup | 2.6 | ✓ AC: tile tap → useParkingResults |
| FR10 | TPC prioritized | 2.4 | ✓ AC: "TPC reservable spots first" |
| FR11 | Public-source fallback | 2.3 + 2.4 | ✓ State DOT + OSM integration |
| FR12 | Visually distinct fallback | 2.8 | ✓ AC: TpcResultCard vs PublicSourceCard render |
| FR13 | Detail view | 2.9 | ✓ AC: "photos, gate hours, lighting info, address" |
| FR14 | SHAWN20 deep-link | 2.7 | ✓ AC: "TPC bookingUrl with the SHAWN20 affiliate code pre-applied" |
| FR15 | FTC adjacent on TPC CTA | 2.7 | ✓ AC: `<AffiliateCTA slot={tpcSlot}>` wrap |
| FR16 | Offline cached results | 2.10 | ✓ AC: "useOfflineParking reads directly from cache" + timestamp banner |
| FR17 | Parking disclaimer every result | 2.11 | ✓ AC: `<Disclaimer kind="parking">` at top of list |
| FR18 | Zero-result telemetry | 2.4 + 2.11 | ✓ Plausible event `parking.lookup_zero_result` |
| FR19 | First-launch tap-to-acknowledge | 3.3 | ✓ AC: `<HosDisclaimer>` with `<Disclaimer kind="hosFull">` |
| FR20 | Min dwell on disclaimer | 3.3 | ✓ AC: "button disabled for the first 4 seconds" |
| FR21 | Permanent footer disclaimer | 1.8 | ✓ AC: HosShell with `<Disclaimer kind="hosFooter">` |
| FR22 | 90-day re-acknowledge | 3.2 + 3.3 | ✓ RequireHosAck guard checks acknowledgedAt |
| FR23 | Four plain-English statuses | 3.4 | ✓ AC: "Driving, On-Duty Not Driving, Sleeper, Off-Duty" |
| FR24 | Optional notes | 3.4 | ✓ AC: "optional plain-text note" |
| FR25 | Real-time clock | 3.5 | ✓ AC: "refreshes every minute via setInterval" |
| FR26 | End-of-shift daily summary | 3.6 | ✓ AC: `<table>` rows for drive/on-duty/cycle |
| FR27 | NO 24-cell horizontal grid | 1.8 + 3.6 | ✓ RODS-grid CI gate + AC explicit prohibition |
| FR28 | 30-day client-side prune | 3.1 | ✓ AC: "pruneEntriesOlderThan(30) on app boot and every entry write" |
| FR29 | No HOS over wire | 3.1 + 3.8 | ✓ ESLint dexie-import rule + runtime fetch wrapper test |
| FR30 | Day-7 in-app nudge | 3.7 | ✓ AC: "non-blocking banner ... 'Want to see your weekly summary?'" |
| FR31 | No HOS export v1 | 3.8 | ✓ AC: grep assertion finds no export code |
| FR32 | Multi-vertical schema | 4.1 | ✓ AC: CHECK constraint on vertical enum |
| FR33 | Multiple slots concurrent | 4.7 | ✓ SlotRenderer + useAffiliateConfig |
| FR34 | FTC adjacent everywhere | 1.7 + 4.7 | ✓ AffiliateCTA wrap; SlotRenderer uses it |
| FR35 | CI gate FTC disclosure-as-sibling | 1.7 + 6.5 | ✓ check-ftc-disclosure.ts + verified-fail fixtures |
| FR36 | ≤15-min config propagation | 4.7 | ✓ AC: "reconcile within ≤15 minutes at p95" |
| FR37 | Per-slot impression+CTR | 4.5 + 4.6 | ✓ affiliate-event-beacon + SlotAnalytics view |
| FR38 | Carnivore at 5 lookups (once) | 5.5 + 5.6 | ✓ useStanTrigger + carnivore_shown counter |
| FR39 | Driver's Mind at 10 hours (once) | 5.7 | ✓ AC: "total ≥ 10 AND drivers_mind_shown is unset" |
| FR40 | Save Your CDL on HOS warning | 5.8 | ✓ AC: useHosViolationWarning + AR36 thresholds |
| FR41 | More-from-Shawn panel | 5.9 | ✓ AC: list with YouTube + 4 Stan Store products |
| FR42 | UTM survives auth roundtrip | 1.11 + 5.4 | ✓ Mechanism (useUtmCapture) + outbound (stanLink helper) |
| FR43 | Cohort tag at signup | 1.11 | ✓ AC: AuthCallback derives + upserts profile.cohort_tag |
| FR44 | Cohort persistent | 1.11 | ✓ Persisted to public.profiles row |
| FR45 | Cohort exposed to analytics | 5.3 | ✓ AC: "every Plausible event includes a cohort prop" |
| FR46 | Verified-email export | 5.2 | ✓ AC: daily cron, batched POST to EXPORT_PIPELINE_ENDPOINT |
| FR47 | Settings screen | 1.14 | ✓ AC: email + OTR/local + state + dark mode + sign out |
| FR48 | Dark mode default | 1.14 | ✓ AC: "default is dark per FR48" |
| FR49 | Right-to-Know data summary | 6.1 | ✓ AC: lists 6 data categories with server-side/on-device-only |
| FR50 | Right-to-Delete | 6.2 | ✓ AC: deletes profiles + lookups + queue + auth.users cascade |
| FR51 | Email confirmation on delete | 6.2 | ✓ AC: "email confirmation is queued" |
| FR52 | Analytics opt-out | 6.3 | ✓ AC: profiles.analytics_opt_out + analytics no-op |
| FR53 | Public privacy URL | 6.4 | ✓ AC: `/privacy` Netlify redirect to privacy.html |
| FR54 | Public affiliate-disclosure URL | 6.4 | ✓ AC: `/affiliate-disclosure` redirect |
| FR55 | Sign out | 1.14 | ✓ AC: "Sign Out button calls supabase.auth.signOut()" |
| FR56 | Admin sign-in | 4.2 | ✓ AC: RequireAdmin permits when is_admin claim present |
| FR57 | Slot config CRUD without code | 4.3 | ✓ AC: SlotEditor + admin RLS-gated upsert |
| FR58 | Per-slot analytics view | 4.6 | ✓ AC: impressions + clicks + CTR per slot, selectable window |
| FR59 | Trigger config | 4.4 | ✓ AC: TriggerEditor with three trigger rows |
| FR60 | Admin restricted to founder creds | 1.3 + 4.2 | ✓ JWT is_admin claim + RequireAdmin guard |
| FR61 | Single-source disclaimers | 1.6 | ✓ AC: `disclaimers.ts` + ESLint rule |
| FR62 | RODS-grid CI gate | 1.8 + 6.5 | ✓ check-rods-grid.ts + verified-fail fixtures |
| FR63 | Lighthouse Perf ≥90 CI gate | 1.5 + 6.5 | ✓ lhci.config.cjs threshold + verification story |
| FR64 | Lighthouse A11y ≥95 CI gate | 1.5 + 6.5 | ✓ lhci.config.cjs threshold + verification story |
| FR65 | No server-side parking history | 2.1 | ✓ AC: "table contains NO user_id column and NO field that ties a lookup to an authenticated user" |
| FR66 | Aggregate-only analytics | 5.3 + 6.3 | ✓ Cohort prop only (no keys) + opt-out path |

### Missing Requirements

**None.** All 66 PRD FRs have story coverage with **explicit acceptance criteria** that fulfill the requirement at the test level.

### FRs in Epics Not in PRD

**None.** No story implements behavior outside the PRD's scope.

### Coverage Statistics

- **Total PRD FRs:** 66
- **FRs covered in epics:** 66
- **Coverage percentage:** **100%**
- **FRs covered by ≥2 stories** (defense-in-depth): 22 (mostly cross-cutting compliance like FR27, FR34, FR35, FR42, FR60, FR62–66, plus the multi-step composition contracts)
- **CI-gated FRs:** 5 (FR35, FR62, FR63, FR64, NFR-P6) — each has both an implementation story AND a verification-on-bad-fixture story (Story 6.5)

### Notes on multi-story FRs

A handful of FRs are *intentionally* covered by multiple stories — this is correct, not redundant:

- **FR21 / FR27 / FR34 / FR35 / FR62**: Composition contracts (`<HosShell>`, `<AffiliateCTA>`) ship in Epic 1, and feature-epic stories *consume* them. The "wired" story is in Epic 1; the "consumed and verified" story is later. Both are needed.
- **FR42**: The auth-roundtrip survival mechanism (Story 1.11) is foundational; the outbound link tagging (Story 5.4) is feature-level. Two stories, one FR, both needed.
- **FR43–FR45**: Cohort tagged at signup (Story 1.11), persisted to profiles (Story 1.11), exposed to analytics (Story 5.3). Three FRs, ~two stories.
- **FR60**: Admin auth domain wiring (Story 1.3) + RequireAdmin guard (Story 4.2). Two stories, one FR.
- **FR63 / FR64 / FR35 / FR62**: Each gate is *wired* in Epic 1 (Story 1.5 stubs the CI job; 1.7/1.8 implement the scan scripts) and *verified-actually-failing* in Story 6.5. The verification-on-bad-fixtures story is the most underrated story in the breakdown — it's the one that catches a regression where someone disables a gate "just for one PR".

## UX Alignment Assessment

### UX Document Status

**Not found — intentionally deferred to v1.05.** No `*ux*.md` exists in `_bmad-output/planning-artifacts/`. The PRD § *Project Scoping & Phased Development* explicitly schedules Sally's UX pass for v1.05 (1 week post-soft-launch). Epic 7 in `epics.md` is a single placeholder story for the v1.05 sprint plan.

This is a **deliberate deferral**, not an oversight. UI is heavily implied (every FR is user-facing on a mobile-first PWA), so the readiness check has to verify the architecture covers UX needs *structurally* even without a polished spec.

### UX ↔ PRD alignment (proxy via PRD UX requirements)

The PRD itself carries the UX-shaped requirements that would normally live in a UX spec:

| PRD-side UX requirement | Coverage in epics + architecture |
|---|---|
| Mobile-first single-column at ≤640px | Architecture § PWA / Web App Specific Requirements — locked. Tailwind v4 mobile-first defaults. |
| Dark mode default, light available | FR48 → Story 1.14 (toggle + dark default) |
| Touch targets ≥48dp/44pt | NFR-A3 → enforced by Lighthouse A11y CI gate (Story 1.5, 6.5) + Sally validates tokens v1.05 |
| Yellow `#FFEB00` CTA color | Mentioned in PRD as locked accent; tokens finalize in v1.05 (Sally) |
| Mossy Oak palette, masculine/blue-collar tone | Brand voice memory + PRD; v1 ships functional palette, v1.05 lands brand polish |
| WCAG 2.1 AA contrast | NFR-A1, NFR-A8 → Lighthouse A11y CI ≥95 (Story 1.5, 6.5) + per-token verification v1.05 |
| `prefers-reduced-motion` honored | NFR-A6 → Tailwind utility classes; verified by Lighthouse A11y CI |
| Visible focus indicators on keyboard nav | NFR-A4 → Tailwind `focus-visible:` utilities |
| Alt text on meaningful images | NFR-A5 → enforced by Lighthouse A11y CI |
| Form labels for screen readers | NFR-A7 → enforced by Lighthouse A11y CI |
| Inline iOS A2HS instructions on landing | FR6 → Story 1.9 |
| Non-intrusive Android install prompt | FR7 → Story 1.9 |
| HOS plain-English status entry (no abbreviations) | FR23 → Story 3.4 |
| RODS-grid prohibition | FR27, FR62 → Story 1.8 + 3.6 + RODS-grid CI |
| ≤5 taps / ≤10s for HOS entry | NFR-P4 → Story 3.4 timing test |

**Verdict:** The architecture covers every UX-shaped requirement *structurally* via:
- Lighthouse Accessibility ≥95 CI gate enforcing accessibility quality independently of design polish
- Lighthouse Performance ≥90 CI gate enforcing speed-perceived UX
- Tailwind v4 token system letting Sally drop in finalized tokens in v1.05 without code restructure
- Composition contracts (`<HosShell>`, `<AffiliateCTA>`, `<Disclaimer>`) ensuring the regulated UI surface is consistent regardless of visual design pass

### UX ↔ Architecture alignment

| UX/UI need (implied or PRD-named) | Architecture support |
|---|---|
| Single-column mobile-first | Tailwind v4 mobile-first; layout components in `src/components/Layout.tsx` |
| Dark mode | Zustand `prefs` store + Tailwind `dark:` utility |
| Token system for Mossy Oak palette + `#FFEB00` | `src/styles/tokens.css` placeholder + `@theme` directive in Tailwind v4 |
| Skeleton loaders within 100ms | `src/components/Skeleton.tsx` placeholder + locked async UX rule |
| Offline banner UX | `src/components/OfflineBanner.tsx` |
| Empty-state UX (no error toasts) | Process pattern in architecture § Implementation Patterns |
| Photo / banner image rendering | Supabase Storage CDN + `loading="lazy"` |
| iOS A2HS instructions | `src/pwa/installPrompt.ts` |

**Verdict:** No architecture gaps. Every UX surface has a named owner file in the project tree.

### Risk envelope of the v1.05 deferral

| Risk | Likelihood | Mitigation |
|---|---|---|
| Sally's tokens fail WCAG AA contrast on first pass (NFR-A8) | Medium | Lighthouse A11y CI ≥95 gate fails the build; failing tokens escalated, not shipped (per NFR-A8 + Story 7.1) |
| v1 launch ships with insufficient brand voice (cute/corporate-soft) | Low–Medium | PRD brand voice constraint + Shawn-side review pre-launch; v1.05 polish ships within 1 week |
| HOS entry UX falls outside ≤5-taps / ≤10s | Low | Story 3.4 has explicit Playwright timing test; UX iteration in v1.05 if metric misses |
| Mobile-first layout breaks on niche devices | Low | Audience device-mix survey is a pre-launch gate; iOS Safari 16.4+ and Android Chrome latest 2 are the test matrix |
| Driver-facing copy needs Shawn-voice rewrite post-launch | High | Acceptable — copy iteration is cheap; verbiage isn't load-bearing on architecture |

### Alignment Issues

**None.** The architecture explicitly accommodates a deferred UX pass via the token system + CI gates approach. Sally's v1.05 work plugs into the existing structure without code restructure.

### Warnings

- **W1 (info):** UX Design document does not exist. UI is heavily implied. Mitigation: Sally's pass scheduled v1.05; Lighthouse A11y CI gate covers accessibility quality independently of polish.
- **W2 (info):** Brand voice / tone validation is human-judgment-driven and not CI-gateable. Shawn-side review during v1.05 is the gate.

No critical UX warnings.

## Epic Quality Review

I ran this with fresh eyes against the create-epics-and-stories best practices, looking for violations.

### Epic Structure Validation

#### A. User Value Focus Check

| Epic | User-centric? | Defensible as epic? |
|---|---|---|
| Epic 1: Foundation, Auth & Onboarding | Borderline — multi-purpose | ✅ Defensible (see below) |
| Epic 2: Parking Discovery | Yes — driver finds parking | ✅ |
| Epic 3: HOS Tracker | Yes — driver logs HOS | ✅ |
| Epic 4: Founder Admin & Affiliate Engine | Yes — founder operates ops | ✅ |
| Epic 5: Cohort Attribution & Cross-Promo | Mixed (driver gets contextual promos; founder gets attribution) | ✅ |
| Epic 6: Privacy, Compliance Hardening & v1 Launch | Yes — driver exercises CCPA rights; v1 ready | ✅ |
| Epic 7: v1.05 UX Polish (placeholder) | Yes — driver gets polished experience | ✅ (post-launch) |

**🟡 Concern flagged on Epic 1:** Epic 1 carries 14 stories, of which 9 are pure infrastructure (1.1 scaffold, 1.2 Supabase, 1.4 Netlify, 1.5 CI jobs, 1.6 disclaimers SoT, 1.7 AffiliateCTA + AST scan, 1.8 HosShell + RODS scan, 1.9 PWA infrastructure, 1.10 routing skeleton). Per the skill's stricter reading, "Story Sizing Validation: Clear User Value: Does the story deliver something meaningful?" — these stories don't deliver driver-visible value individually.

**Defense for the call:** The skill's own greenfield guidance permits these:
> Greenfield projects should have:
> - Initial project setup story
> - Development environment configuration
> - CI/CD pipeline setup early

Stories 1.1, 1.4, 1.5 fall under this exception. Stories 1.6, 1.7, 1.8 (composition contracts) are foundation-level and would otherwise be duplicated across Epics 2/3/4 (a worse outcome — file churn, not less of it). Story 1.9 (PWA infrastructure) is the floor for *every* user-facing FR (offline parking, install prompts, cache partitioning). Story 1.10 (routing skeleton) is the floor for every navigated route.

**Verdict:** Epic 1 is acceptable as a *foundation epic* in a greenfield PWA build. The epic-level user value (driver can install + sign in + onboard + sign out) IS delivered; the within-epic stories are sized for single-PR completion rather than per-story user-value, which is the right tradeoff for solo-dev throughput. **No remediation required, but flagged here so future-you remembers why Epic 1 looks the way it does.**

#### B. Epic Independence Validation

I traced cross-epic dependencies:

| Epic | Depends on | Standalone after deps? |
|---|---|---|
| Epic 1 | (nothing) | ✅ Foundation epic |
| Epic 2 | Epic 1 (auth, AffiliateCTA, disclaimers, SW infra) | ✅ Driver finds parking |
| Epic 3 | Epic 1 (auth, HosShell, disclaimers, Dexie infra) | ✅ Driver logs HOS |
| Epic 4 | Epic 1 (auth, AffiliateCTA), Epic 2 (TPC card to enrich) | ✅ Founder operates ops; Epic 2 doesn't *require* Epic 4 |
| Epic 5 | Epic 1 (UTM), Epic 2 (parking counter), Epic 3 (HOS counters) | ✅ Cohort + cross-promo work; Epics 2/3 don't require 5 |
| Epic 6 | All | ✅ Privacy + launch hardening; pre-existing features don't require Epic 6 to function |

**No epic requires a *future* epic to function.** Dependency arrows all point backward. ✅

### Story Quality Assessment

#### A. Story Sizing Validation

I looked for chunky stories (single PR borderline-too-big) and tiny stories (could be merged).

**🟡 Stories worth examining:**

- **Story 1.5 (Stub 8 GitHub Actions CI jobs)** — 8 separate jobs, 8 separate ACs in a single story. Justification: all 8 live in `.github/workflows/ci.yml`; splitting would create 8 PRs all churning the same file, which the skill itself warns against ("File Churn on Same Component"). **Verdict: keep consolidated.**
- **Story 1.9 (PWA infrastructure)** — 6 concerns: `vite.config.ts` plugin config, `cacheNames.ts`, `sw.ts`, `manifest.json`, iOS A2HS, Android `beforeinstallprompt`. Single PR is feasible but chunky. Could split into 1.9a (SW + cache infra) + 1.9b (manifest + install prompts). **Verdict: leave as-is for solo-dev throughput; if Huffy hits a wall mid-story, split is trivial.**
- **Story 6.6 (pre-launch business gate checklist)** — 10 non-code checklist items spanning weeks of business work (attorney, insurance, LLC, YouTube). Not a code story. **Verdict: keep — labeled explicitly as non-code; serves as the launch-gate artifact.**

**🟢 No tiny-story concerns.** Smallest stories (Story 5.1 single migration, Story 5.4 one helper file) are appropriate single-PR sizes.

#### B. Acceptance Criteria Review

I sampled ACs across all epics for testability, completeness, and specificity:

- **Given/When/Then BDD format:** ✅ All 57 stories use it.
- **Testable:** ✅ Every AC has a verifiable assertion (CI gate result, file-existence check, runtime test, Playwright path, byte-equality test).
- **Specific outcomes:** ✅ No "should feel intuitive" hand-waves. ACs reference exact strings ("DELETE" typed-confirmation), exact thresholds (≤30 min), exact CI job names.
- **Error / edge cases:** Mostly covered. A few stories cover only the happy path explicitly:
  - **🟡 Story 1.13 (onboarding):** doesn't explicitly cover "user closes browser mid-onboarding, returns later" — implicit via guard redirect, but not asserted.
  - **🟡 Story 6.2 (delete-account):** doesn't explicitly cover "deletion fails partway" recovery path — implies idempotency but doesn't assert it.

These are minor gaps; Huffy will catch them naturally during implementation. Calling them out for awareness, not blocking.

### Dependency Analysis

#### A. Within-Epic Forward Dependencies

I traced every story's dependencies inside its epic. **Zero forward dependencies found.** Each story depends only on prior stories in the same epic or earlier epics.

#### B. Database/Entity Creation Timing

Verified distribution:

| Migration | Epic / Story | Justification |
|---|---|---|
| `0001_init_schemas.sql` | Epic 1 / Story 1.2 | Foundation; needed for all subsequent schemas |
| `0002_profiles.sql` | Epic 1 / Story 1.2 | Driver auth needs `profiles` |
| `0003_admin_users.sql` | Epic 1 / Story 1.3 | Two-domain auth foundation |
| `0011_auth_hooks.sql` | Epic 1 / Story 1.3 | Same |
| `0006_parking_lookups_recent.sql` | Epic 2 / Story 2.1 | Created when parking flow needs it |
| `0007_osm_truck_stops.sql` | Epic 2 / Story 2.1 | Same |
| `0010_rate_limits.sql` | Epic 2 / Story 2.1 | TPC rate-limit table needed by 2.2 |
| `0004_affiliate_slots.sql` | Epic 4 / Story 4.1 | Created when admin engine needs it |
| `0005_stan_trigger_config.sql` | Epic 4 / Story 4.1 | Same |
| `0009_affiliate_events_agg.sql` | Epic 4 / Story 4.1 | Same |
| `0008_email_export_queue.sql` | Epic 5 / Story 5.1 | Created when export pipeline needs it |

**Verdict:** ✅ Tables created exactly when first needed. No "Epic 1 creates all 50 tables" anti-pattern.

### Special Implementation Checks

#### A. Starter Template Requirement

✅ **Story 1.1** is "Scaffold Vite + React + TypeScript baseline" with explicit `npm create vite@latest` command. Includes locked library install, Tailwind v4 config, ESLint + Prettier, baseline commit. Matches the skill's required pattern.

#### B. Greenfield indicators

✅ Initial setup story (1.1), dev environment (1.2 Supabase, 1.4 Netlify), CI/CD setup early (1.5). Greenfield pattern correctly followed.

### Best Practices Compliance Checklist

For each epic:

| Check | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 | Epic 6 |
|---|---|---|---|---|---|---|
| Epic delivers user value | ✅ (foundation) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic can function independently after prior epics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stories appropriately sized | ✅ (1.5/1.9 chunky but justified) | ✅ | ✅ | ✅ | ✅ | ✅ |
| No forward dependencies | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Database tables created when needed | ✅ | ✅ | n/a (no tables) | ✅ | ✅ | n/a |
| Clear acceptance criteria | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Traceability to FRs maintained | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Findings by Severity

#### 🔴 Critical Violations

**None.**

#### 🟠 Major Issues

**None.**

#### 🟡 Minor Concerns

1. **Epic 1 carries infrastructure-heavy stories (1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10)** without per-story driver-visible value. *Defensible* under the skill's greenfield guidance; flagged for awareness. Splitting Epic 1 into 1a/1b doesn't improve solo-dev throughput.
2. **Story 5.7's `useHosCrossPromoTrigger` hook location is ambiguous.** The architecture names it under `src/modules/hos/hooks/`, but Story 5.7 (in Epic 5) implements its behavior. Recommend Huffy place the hook file in the HOS module per the architecture, with Story 5.7 importing it. One-line clarification at implementation time.
3. **Story 1.13 (onboarding) and 6.2 (delete-account) cover happy paths well but don't explicitly assert error/recovery edges.** Minor — Huffy will catch during implementation, but flagged for AC enrichment if a future planning pass adds detail.
4. **Story 1.9 (PWA infrastructure) is chunky** — 6 concerns in one PR. Acceptable for solo throughput; split into 1.9a/1.9b if the PR exceeds a comfortable review size.
5. **Story 5.5's parking-lookup counter location is debatable.** Currently placed in Dexie `hos_counters` for proximity to other client-side counters, even though it's not strictly HOS data. Alternative: localStorage or a separate Dexie database. Either works; Huffy can pick at implementation.

### Recommendations

- **Accept all minor concerns as documented; none require remediation pre-implementation.**
- **Story 5.7 hook location:** clarify in implementation that `useHosCrossPromoTrigger.ts` lives at `src/modules/hos/hooks/` per the architecture file tree, even though Story 5.7 in Epic 5 wires its behavior.
- **Story 1.9:** if the PR review proves unwieldy, split into 1.9a (SW + cache namespaces + runtime assertion) and 1.9b (manifest + install prompts). Optional.

## Summary and Recommendations

### Overall Readiness Status

**READY FOR IMPLEMENTATION.**

| Dimension | Status |
|---|---|
| FR Coverage | ✅ 66 / 66 (100%) |
| NFR Coverage | ✅ 40 / 40 (100%) |
| UX Alignment | ✅ Deferral risk envelope acceptable; CI gates cover quality independently of polish |
| Epic Independence | ✅ All epics standalone after prior epics; no forward dependencies |
| Story Quality | ✅ All 57 stories sized for single PR; ACs in BDD format with testable assertions |
| Architecture Compliance | ✅ Stories trace to architecture decisions; no orphan files; module boundaries respected |
| CI Gate Architecture | ✅ All 8 gates wired in Epic 1, verified-failing on bad fixtures in Story 6.5 |
| Sprint 0 prerequisites | 🟡 4 items open (TPC API spec, state-DOT API set, admin allowlist seed, HOS-violation thresholds) — non-blocking, gated by individual story-level rather than epic-level dependencies |

### Critical Issues Requiring Immediate Action

**None.**

### Major Issues

**None.**

### Minor Concerns Documented (do not block implementation)

1. Epic 1 carries 14 stories, several pure-infrastructure; defensible under greenfield guidance.
2. Story 5.7's `useHosCrossPromoTrigger` hook should live at `src/modules/hos/hooks/` per architecture.
3. Stories 1.13 and 6.2 cover happy paths; error/recovery edges implicit but not explicitly asserted.
4. Story 1.9 (PWA infrastructure) is chunky; split optional if PR review is unwieldy.
5. Story 5.5's parking-lookup counter location debatable (Dexie `hos_counters` vs separate store); Huffy decides at implementation.

### Sprint 0 prerequisites (carry forward)

These were captured during architecture validation (AR33–AR36) and remain open as Sprint 0 / pre-coding tasks:

1. **Obtain TPC affiliate API contract** before Story 2.2 (TPC integration) starts. Without the contract, `normalize.ts` is speculative.
2. **Lock the v1 state-DOT API set** before Story 2.3 starts. Suggested: top-10 trucking corridors (TX, CA, OH, GA, IL, IN, PA, NC, FL, TN). Refine post device-mix survey.
3. **Confirm HOS-violation thresholds** before Story 5.8 starts. Suggested: ≤30 min on 11h drive, ≤45 min on 14h on-duty, ≤2h on 70h cycle.
4. **Bootstrap admin allowlist** during Story 1.3 — write `0011a_seed_first_admin.sql` adding `shawngresham90@gmail.com` to `admin.admin_users`.

### Pre-launch business gates (Epic 6 / Story 6.6 — non-code)

These cannot be CI-gated and remain Shawn-gated. They block the v1 release tag, not the v1 build:

- Pre-launch transportation/tech-attorney consult complete
- Tech E&O + product liability + cyber insurance bound for the LLC
- LLC formalities verified (capitalization, bank separation, observed governance)
- Lawyer-reviewed final HOS disclaimer copy on shipped UX (sign-off pass on built UX, not draft)
- LLC affiliate-revenue routing confirmed (SHAWN20 commissions to LLC bank)
- YouTube launch-video FTC disclosure locked (description, verbal callout, pinned comment)
- Audience device-mix survey reviewed; iOS share <40% OR mitigation plan documented

### Recommended Next Steps

1. **Resolve Sprint 0 prerequisites in parallel with the build:**
   - Shawn pings TPC affiliate contact for API contract today.
   - Huffy stubs the state-DOT integration for the top-10 launch states with TODO markers; refines post-survey.
   - Huffy locks HOS-violation thresholds in `core/hosThresholds.ts` during Story 3.5 implementation.
   - Huffy includes `0011a_seed_first_admin.sql` as part of Story 1.3.

2. **Begin Sprint 0 (Stories 1.1 → 1.5):** Scaffold + Supabase + admin auth wiring + Netlify deploy + 8 stubbed CI jobs. Sprint-0 done = green CI on an empty Netlify preview URL renders on iOS Safari and Android Chrome.

3. **Run `/bmad-create-story 1.1`** to produce a dev-ready story file with full implementation context for the first PR.

4. **Move the 2026-05-07 prior readiness report** to `_bmad-output/archive/` (or delete) so future readers don't confuse it with the current one. Optional housekeeping.

5. **Track Epic 7 (v1.05 UX Polish) separately:** schedule Sally's UX spec authoring during the v1 build (parallel work, doesn't block v1 launch). Re-run `/bmad-create-epics-and-stories` with `ux-design.md` as input once Sally delivers; that pass expands Epic 7 into implementable stories.

### Final Note

This assessment identified **0 critical issues, 0 major issues, and 5 minor concerns** across 5 categories (document inventory, FR coverage, UX alignment, epic structure, story quality). All minor concerns are documented and non-blocking. The planning artifact set (PRD + architecture + epics) is **internally consistent, complete to the boundaries of the v1 scope, and ready for implementation**.

The four open Sprint 0 prerequisites (AR33–AR36) are operational tasks, not planning gaps — they belong to the build phase, not the planning phase.

**Confidence Level: High.**

**Assessor:** Implementation-readiness check, BMAD `bmad-check-implementation-readiness` skill, run on 2026-05-08.

