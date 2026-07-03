---
title: "Product Brief Distillate: Trucking Life with Shawn"
type: llm-distillate
source: "product-brief-trucking.md"
created: "2026-05-07"
purpose: "Token-efficient context for downstream PRD creation (bmad-create-prd) and beyond"
---

# Distillate — Trucking Life with Shawn

Dense overflow context not in the executive brief. Read alongside `product-brief-trucking.md`.

## Founder & Brand

- Founder: **Shawn Gresham** (BMAD `user_name: huffy`). Active OTR driver, 17 years, zero violations. Endorser of the app on his own channels — personal-FTC liability under §255 attaches regardless of LLC.
- Brand voice rules: **trucker dialect, authority-forward, faith-rooted, blue-collar direct**. Reject corporate-soft, SaaS-pastel, cute illustrations, generic lifestyle stock photos.
- Channels: 84K YouTube `@TruckingLifeWithShawn`, plus TikTok and Facebook. Existing Stan Store with paid info products and email list — these are the warmest distribution surfaces, not YouTube cold traffic.

## Stan Store Catalog (existing paid products to cross-promote)

| Product | Topic | In-app trigger placement (v1.05) |
|---|---|---|
| Save Your CDL | CDL protection guide | On HOS violation warning |
| 17 Years Zero Violations | Driving methodology / record | Settings panel |
| Carnivore in the Truck | OTR nutrition | After 5 successful parking lookups |
| Driver's Mind | Mental wellness for drivers | After 10 hours logged in HOS |

Plus a **"More from Shawn"** panel in settings linking the YouTube channel and full product list. Trigger-based only — explicit founder constraint: *"annoying = uninstall."*

## Locked Technical Decisions

- **Frontend:** React + Vite + Tailwind. PWA only. No native iOS/Android in v1.
- **Backend:** Supabase (auth, DB, storage, realtime).
- **Hosting:** Netlify at `app.truckinglifewithshawn.com`.
- **Auth:** Magic-link email + Google Sign-In. **No passwords** (rejected: security headache + support burden). **No Apple Sign-In** v1 (PWA exempt; reserved for native iOS if/when shipped).
- **Affiliate engine:** JSON-driven slot system, multi-vertical schema (parking/fuel/load-board/insurance) from v1 even though only TPC is wired. Hardcoding TPC and refactoring later was estimated at 2–3 weeks of Betty's time — rejected.
- **Privacy/data:** parking lookups have no server-side user-keyed location history; HOS entries retained 30 days client-side; export-on-demand.
- **PWA service-worker offline cache** for last-known parking results.

## Team & Cadence

- **Single developer: Betty.** Works **Mondays only**. v1 soft launch budget = 6–8 Mondays of work.
- BMAD v6.6.0 fresh install configured 2026-05-08.
- Output dirs: `_bmad-output/planning-artifacts/`, `_bmad-output/implementation-artifacts/`.

## Acquisition Thesis

- **Distribution stack:** pinned link in every YouTube video description + dedicated launch video *("I built an app for truckers — here's why")* + recurring CTAs in 2–3 videos/month + Stan Store banner + email list blast.
- **Launch video hook (locked):** *"The feds just spent a year studying the truck parking crisis. Here's what they missed — and the app I'm building because of it."* Rides FMCSA truck-parking study comment-close (2026-05-06).
- **Target conversion:** 3% of video views → install in first 30 days; sustained 2%+ thereafter.
- **Day-1 cohort:** existing Stan Store buyers via email list — pre-qualified, pre-trusting, pre-paying. Tracked separately from cold YouTube cohort. Expected to drive disproportionate share of soft-launch installs.

## Brand Visual Direction (Sally to finalize in UX phase)

- **Accent palette:** Mossy Oak camo greens/browns. Accent only, not full coverage.
- **CTA color:** `#FFEB00` (matches YouTube thumbnail brand).
- **Modes:** dark + light. Dark probably default given in-truck use.
- **Tone:** masculine, blue-collar — explicit founder direction.
- **Hex codes not yet locked.** Sally proposes during `bmad-create-ux-design`.

## Rejected Ideas (do not re-propose)

| Idea | Why rejected |
|---|---|
| ELD certification / FMCSA hardware tethering | Different product, different liability, no budget — explicit P2 scope guard |
| Native iOS/Android apps (v1) | App store gates, 30% take, review delays, instant-update loss |
| Password auth | Security overhead, support burden |
| Apple Sign-In v1 | Not required for PWA |
| Hardcoded TPC, refactor to generic later | Costs Betty 2–3 weeks; build generic from v1 |
| Stan Store banner-spam every screen | Founder explicit: causes uninstalls |
| Cute / playful / SaaS-pastel UI | Voice mismatch — masculine/blue-collar required |
| Lifestyle stock photos | Inauthentic to driver reality |
| Lawyer review deferred to 1K users | Replaced with pre-launch consult after review-panel pushback |
| Custom affiliate ad creative | Generic banner system only — keeps Betty unblocked |
| Fuel/route/weight-ticket/maintenance modules in v1 | v1.2+ |

## Competitive Intelligence (preserve for PRD)

- **Trucker Path** — 600K+ users, parking availability data at ~8,000 locations. Criticisms: bloated, ad-heavy, friction (e.g., can't zoom/satellite without exiting list). They are the giant; we win on **speed + trucker-voice trust + TPC reservation funnel**, not data parity.
- **TruckSmarter** — fuel-led, parking secondary, no creator/community moat.
- **Park My Truck** — free 250-mi-radius parking finder backed by industry coalition. Dated UX, no booking, no monetization for drivers.
- **TruckParkingClub (our affiliate partner)** — marketplace model. ~4,000 properties / 66,000 reservable spaces across 49 states (Feb 2026); target 10,000 properties by EOY 2026 (added 1,000 in last 3 months). SHAWN20 affiliate code active: $20 off users, commission to Shawn. Trustpilot positive — reliable spots, former-driver CS.
- **Motive (KeepTruckin) / HOS247** — FMCSA-certified ELDs, enterprise/fleet. Different lane; not a competitor.
- **Drivers Daily Log** — *abandoned*. Developer domain dead, can't buy logbook pages. The clear opening for HOS Tracker (v1.1).

## Market Data Worth Citing

- **ATA driver shortage:** ~82K in 2026, projected 160K+ by 2031. ~3.5M OTR driver TAM with churn.
- **Parking pain stats:** 98% of drivers report problems (ATA + OOIDA). 56 min/day lost. $5,500/yr foregone pay (~12% pay cut). **Use the $5,500 number as the headline marketing stat — not "shortage."**
- **ATRI Critical Issues:** parking #2 in 2023–2024, #4 in 2025. Slightly cooling vs insurance/pay/economy. Reinforces why messaging anchors to *money lost*, not abstract shortage.
- **FMCSA truck-parking study:** public comment closed 2026-05-06. Federal attention is current — content moment for launch.
- **Creator economy:** ~$253B globally in 2025, ~23% YoY growth, 60%+ of creator earnings projected from direct-to-audience monetization. Tailwind for creator-distributed apps.
- **TruckersReport forum sentiment:** active demand for paper-logbook-replacement apps that aren't ELDs. Confirms HOS-Tracker (non-ELD) wedge.

## Success Metrics — Detailed

- 90-day: 5,000 installs, 30% WAU, 40% D7, 25% D30, 3% YouTube view→install conv, 4,000+ verified emails captured.
- 6-month: 15,000 installs, 35% WAU, 45% D7, 30% D30, sustained 2%+ YouTube conv, 12,000+ emails, $2,000+ TPC MRR, $1,500+ Stan Store attributable MRR, 8%+ Stan Store CTR per WAU/mo.
- **Targets are aspirational** — actual cohort baselines set in first 30 days post-launch.
- **Leading indicators (track day 1):** TPC click-to-reservation conversion rate; Stan Store deep-link UTM attribution; Day-1-cohort (Stan Store buyers) install + retention vs cold-YouTube cohort.

## Pre-Launch Gate Checklist

**Before v1 soft launch:**
- ☐ Audience device-mix survey on YouTube/TikTok/Facebook (iPhone vs Android — Shawn posting this week)
- ☐ Pre-launch attorney consult ($1–3K): HOS disclaimer, parking disclaimer, FTC disclosure language, privacy policy
- ☐ LLC affiliate-revenue routing confirmed (SHAWN20 → LLC bank, not personal)
- ☐ YouTube launch video FTC disclosure: description + verbal + pinned comment
- ☐ In-app FTC disclosure rendered on every affiliate-CTA screen

**Before v1.1 HOS launch:**
- ☐ Tech E&O + product liability + cyber insurance bound for the LLC
- ☐ LLC formalities verified (capitalization, bank separation, no commingling, governance)
- ☐ Lawyer-reviewed final HOS disclaimer copy (sign-off pass on shipped UX)
- ☐ HOS UI guardrails verified: no RODS grid, watermarked exports, tap-to-acknowledge, footer disclaimer, 90-day re-acknowledgment

**Continuous accelerators (any triggers immediate lawyer review):** subpoena/legal letter, paid feature shipping, media outside owned channels, partnership beyond TPC, HOS support ticket suggesting reliance, crossing 500 active HOS users.

## Disclaimer Copy (canonical, ship verbatim)

- **HOS Tracker:** *"Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof of duty status."* (Append on attorney advice: *"You are required by 49 CFR Part 395 to use a registered ELD or approved paper log if applicable. This app does not satisfy that requirement. Showing this app to a DOT officer will not stop a violation. Always cross-reference your fleet's ELD as the official record."*)
- **Parking module:** *"Parking availability shown is provided by third parties and is not guaranteed. Always have a backup plan. We are not responsible for parking conditions, security, or the accuracy of third-party listings."*
- **FTC affiliate (every CTA):** *"Trucking Life with Shawn earns a commission when you book through this link. Your discount is not affected."*

## Open Questions to Validate

- **Audience composition** — % of 84K subs who are actively driving OTR (vs aspirants, retirees, hobbyists). Validate via survey + email-list segmentation.
- **Device-mix** — iPhone vs Android distribution and Android device-age (battery-optimization kills PWA service workers on older Androids). Survey running this week.
- **TPC partnership longevity** — written commitment vs affiliate-portal-only relationship. Concentration risk for v1 monetization.
- **Owner-operator willingness-to-pay** for paid HOS tier — validate via interviews or landing-page pricing test before architecting paid features.
- **Trucker Path competitive response** — they could ship "reservable spots" in a sprint and erode the funnel differentiator. No mitigation plan yet beyond brand-voice trust.
- **Bloat-vs-focused churn driver** — is "Trucker Path is bloated" the dominant complaint or a vocal minority? Validate via subreddit / Driver forum sentiment analysis.
- **Brand hex codes** — Mossy Oak palette specific values, full token system. Sally during UX phase.
- **Attorney sourcing** — transportation/tech lawyer for pre-launch consult (Shawn to find).
- **Insurance carrier** — tech E&O + product liability + cyber quote (Shawn to source before HOS v1.1).

## Architecture Hints for PRD/Architect

- Affiliate slot schema must accept multi-vertical configs (parking/fuel/load-board/insurance) on day one. Schema decision, not feature addition.
- Public-source parking fallback: state DOT rest-area APIs (per-state, varies in availability and quality) + OpenStreetMap truck-stop POIs. Plan a normalization layer over heterogeneous sources.
- Stan Store deep-link UTM tracking + verified email export pipeline are *cheap to build now, expensive to retrofit* — include in v1 even though Stan Store trigger UX ships in v1.05.
- HOS UI explicitly **must not** include a RODS-grid graph (49 CFR 395.32) — anything that looks like an ELD recreates the regulatory exposure disclaimers were meant to remove.

## User Scenarios (richer than brief)

- **Aha moment:** Tuesday 6:42pm, driver 90 mi from current location with HOS clock at 1h45m. Opens Trucking Life with Shawn, taps once, sees a TPC reservable spot at exit 142, books with SHAWN20 → $20 off. No ad, no upsell in the flow.
- **Retention moment:** End-of-shift HOS entry — driver opens app every shift to log status in plain English. After 10 hours logged → Driver's Mind upsell appears once. Daily habit established.
- **Trust moment:** First-launch HOS disclaimer — tap-to-acknowledge that this is NOT an ELD. Plain, repeated language reinforces the founder's "trucker honesty" voice. Drivers read it and trust the rest of the app more, not less.
- **Disaster scenario the brief is built to avoid:** Driver pulls into a rural corridor, opens app, no TPC inventory. Public-source fallback shows nearest 3 rest areas + truck stops. Driver doesn't bounce to Trucker Path. Ever.

## Strategic Decisions Made During Brief Discovery (rationale preserved)

1. **Pre-launch attorney consult ($1–3K)** chosen over deferred-to-1K-users review — review panel flagged disclaimer copy and FTC affiliate language as highest-leverage pre-launch.
2. **Insurance binding before HOS v1.1**, not at paid tier — disclaimers don't pay defense costs, insurance does. Parking-only soft launch can run uninsured.
3. **Audience device-mix survey** runs this week, before Betty starts — costs 5 minutes, removes a Betty-day risk if iOS/Android distribution surfaces a PWA-incompatibility problem.
4. **Public-source parking fallback** in v1 (1–2 days of Betty's work) — kills the thin-corridor bounce-back risk; cheap insurance against the "we don't match Trucker Path's data network" concession.
5. **JSON affiliate engine stays in v1** (Stan Store triggers + brand polish move to v1.05) — keeps the 2–3 weeks of rework debt off the table while still letting Betty ship soft launch on time.
6. **Offline parking lookup** in v1 — service worker + cached last-known results. Table stakes for trucking; rural connectivity hits week-one users.
7. **LLC + personal-FTC hygiene** acknowledged as pre-launch checklist (out of Betty's scope but in the brief): SHAWN20 → LLC bank, not personal; YouTube launch video has FTC disclosure locked; in-app endorser disclosure rendered on every affiliate screen.
