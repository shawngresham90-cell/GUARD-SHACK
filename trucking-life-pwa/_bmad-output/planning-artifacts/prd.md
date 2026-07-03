---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
completedAt: '2026-05-07'
releaseMode: phased
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-trucking.md
  - _bmad-output/planning-artifacts/product-brief-trucking-distillate.md
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 0
  projectContext: 0
classification:
  projectType: web_app
  projectSubtype: pwa
  domain: general
  domainAdjacencies:
    - fmcsa-non-claim (49 CFR Part 395)
    - ftc-endorser-disclosure (16 CFR Part 255)
    - ccpa-cpra
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
project_name: 'trucking'
user_name: 'huffy'
---

# Product Requirements Document - Trucking Life with Shawn

**Author:** Shawn Gresham (founder)
**Developer:** Huffy (full-time)
**Date:** 2026-05-07
**Status:** v1 PRD draft, awaiting Shawn's review and downstream UX (Sally) / architecture (Winston) handoff

### How to read this document

This PRD is dual-audience: humans (Shawn, Sally, Winston, the pre-launch attorney) and LLMs
(downstream BMAD skills that consume it). Sections are ordered by the planning workflow
that produced them; readers can jump in via the table below.

| If you are… | Start here |
|---|---|
| The founder reviewing scope | *Executive Summary* → *Product Scope* → *Project Scoping & Phased Development* |
| The UX designer (Sally) | *User Journeys* → *PWA / Web App Specific Requirements* → *Functional Requirements* |
| The architect (Winston) | *Functional Requirements* → *Non-Functional Requirements* → *PWA / Web App Specific Requirements* → *Domain-Specific Requirements* |
| The pre-launch attorney | *Domain-Specific Requirements / Compliance & Regulatory* → *Pre-Launch Gates* → *Disclaimer Copy* |
| The dev (Huffy) breaking down stories | *Functional Requirements* → *Non-Functional Requirements* → *Project Scoping / Must-Have Analysis* |

The flywheel sentence in *What Makes This Special* is the one-line thesis the rest of the
document keeps cycling back to. Every downstream decision — story prioritization, screen
real estate, push strategy, affiliate placement — should trace to it.

## Executive Summary

**Trucking Life with Shawn** is a Progressive Web App for over-the-road truck drivers, distributed
through a content brand that already owns their attention — Shawn Gresham's 84,000-subscriber
YouTube channel, plus TikTok, Facebook, and an existing Stan Store buyer email list. It solves
two recurring driver pains and refuses to be everything else.

**The headline frame is money lost, not parking shortage.** ATA and OOIDA put the cost of the
parking search at ~56 minutes per day and **~$5,500 per year in foregone earnings — about a 12%
pay cut every driver feels every shift.** Trucker Path talks parking. We talk paychecks. Every
section of this PRD — copy, screen real estate, push strategy, affiliate placement — reinforces
that frame.

**The product is two modules with two jobs that ship together at v1.** Parking is the
**acquisition wedge** — high-frequency, high-pain, the reason a driver installs. HOS is the
**retention engine** — every-shift habit, the reason the app stays open after the install.
They are not co-equal in attention or screen real estate, but they ship together because
shipping parking-only first would create a multi-week retention dead zone where users
install, find a spot, and forget us. Pulling HOS forward into v1 means every install is a
daily-use install from launch day forward.

- **Parking Lookup** ships at v1 soft launch (**4–6 weeks of Huffy's full-time work**).
  Monetizes day one through the active TruckParkingClub affiliate (code `SHAWN20`); TPC is
  doubling inventory in 2026 (4,000 → 10,000 properties), so commission ceiling grows directly
  into the launch window. Public-source fallback (state DOT rest-area APIs + OpenStreetMap
  truck-stop POIs) and offline service-worker cache guarantee the lookup always returns an
  answer — no thin-corridor bounce-back to Trucker Path. Ever.

- **HOS Tracker** ships in the same v1 release as an **explicit non-ELD personal-record
  manual logbook**: *"Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof
  of duty status."* Tightly scoped: four duty-status toggles (Driving / On-Duty Not Driving /
  Sleeper / Off-Duty), real-time clock, end-of-shift summary, full disclaimer scaffolding.
  Aimed at OTR drivers cross-checking fleet ELDs and owner-operators who want a clean digital
  copy of their own hours. Drivers Daily Log — the legacy paper-replacement app — has been
  abandoned by its developer. The lane is open and we're filling it.

The sequencing of *attention*, not *release*, is load-bearing for every downstream decision:
story prioritization, home-screen layout, affiliate slot density, push notification cadence,
paid-tier roadmap. Parking earns the install. HOS earns the daily open. Both ship together so
that earning the daily open starts on day one.

**Why now.** The FMCSA federal truck-parking study closed public comment on **2026-05-06**,
putting the parking crisis in the discourse the same week we draft this PRD. The launch video
*("The feds just spent a year studying the truck parking crisis. Here's what they missed —
and the app I'm building because of it.")* rides that moment.

### What Makes This Special

A flywheel competitors can copy at any single node, but none can replicate as a loop:

> **Authentic trucker voice → owned content distribution → engaged install base →
> affiliate density → ability to stay focused → reinforces voice.**

Five concrete differentiators feed that loop:

1. **Built by a trucker, for truckers.** Shawn has driven OTR for 17 years with zero
   violations. The voice, priorities, and design choices come from someone who's lost the
   parking lottery at 9pm in Ohio. Trucker Path was built by tech, not trucking.

2. **Distribution moat that competitors can't buy.** 84K YouTube subscribers, plus TikTok
   and Facebook, replace the $50/install acquisition spend a VC-backed competitor would need.
   The launch video alone reaches more drivers in a week than most trucking startups acquire
   in their first year.

3. **A *paying* audience, not just a free one.** Four existing Stan Store products (Save Your
   CDL, 17 Years Zero Violations, Carnivore in the Truck, Driver's Mind) prove willingness-to-pay
   that pure-content competitors can't claim. These buyers are the warm-launch cohort and are
   tracked separately from cold YouTube traffic from day one.

4. **Speed and focus over feature parity.** We will not match Trucker Path's data network of
   ~8,000 locations. We win on speed, trucker voice, and the TruckParkingClub reservation
   funnel they don't have. Bloat is their attack surface, not ours.

5. **A dead competitor in the HOS lane.** Drivers Daily Log's abandonment leaves a real gap
   for a personal-record logbook. We're not fighting Motive or HOS247 — they sell certified
   ELDs to fleets. We're filling the space they refuse to occupy: the driver's own pocket.

**Core insight that ties it together.** The retention engine is not the acquisition wedge.
Parking pulls drivers in because it hurts loudly, episodically, and expensively. HOS holds
them daily because it's the one tap drivers already make at end of every shift. Conflating
the two — treating them as co-equal modules to balance equally — is the mistake we will not
make.

**The user moment we optimize for.** Tuesday 6:42pm. Driver 90 miles ahead with the HOS clock
at 1h45m. Opens Trucking Life with Shawn. One tap. Reservable TPC spot at exit 142. Books with
SHAWN20 → $20 off. **No ad. No upsell in the parking flow itself.** That's the aha — and
it's the floor, not the ceiling, of what every screen owes the driver.

## Project Classification

| Field | Value |
|---|---|
| **Project Type** | Web App — Progressive Web App (PWA) |
| **Domain** | General (with explicit FMCSA-non-claim, FTC §255 endorser-disclosure, and CCPA/CPRA surfaces) |
| **Complexity** | Medium |
| **Project Context** | Greenfield |

The "general" domain tag reflects that no certification surface (FedRAMP, PCI, HIPAA,
DO-178C) gates this product. The medium complexity reflects three live regulatory surfaces
that shape the build: **(1)** explicit non-ELD posture under 49 CFR Part 395 with mandatory
disclaimer scaffolding and UI guardrails (no RODS-grid graph, watermarked exports,
tap-to-acknowledge, 90-day re-acknowledge); **(2)** FTC affiliate disclosure under 16 CFR
Part 255 — endorser-personal liability attaches to Shawn regardless of LLC, so disclosure
ships in-app on every TPC CTA, in YouTube descriptions, in pinned comments, and verbally in
the launch video; **(3)** CCPA/CPRA consumer-rights flow (Right-to-Know, Right-to-Delete)
live at first install, not deferred. These surfaces are addressed in the dedicated
*Compliance & Regulatory Posture* section later in this PRD, gated by the *Pre-Launch
Gates* checklist.

## Success Criteria

All targets below are **aspirational baselines**. The first 30 days post-launch establish the
actual cohort-specific baselines, against which 6-month commitments are re-anchored. Leading
indicators (marked 🔍) are tracked from day one even where targets are deliberately TBD.

### User Success

The product is succeeding for users when three named moments happen reliably:

- **Aha moment (acquisition).** Driver opens the app while on the road, taps once, and sees a
  reservable parking spot ahead with the SHAWN20 discount applied — within **3 seconds of app
  open** on a typical 4G connection, **<1 second on cached/offline lookup**. Measured as: time
  from cold app-open to first parking result rendered.
  - **Target:** ≥80% of parking lookups return a result in <3s; ≥95% of cached-corridor lookups
    return offline.

- **Retention moment (daily habit).** Driver opens the app at end of every shift to log HOS
  status in plain English. Measured as: % of installed users who log at least one HOS entry on
  ≥4 days in a 7-day window.
  - **Target:** ≥35% of installs hit the 4-of-7 threshold by week 4 post-launch (HOS ships
    at v1, so this metric is live from day one — not gated on a later HOS release).

- **Trust moment (disclaimer).** First-launch HOS disclaimer is read and tap-to-acknowledged.
  Measured as: median time on disclaimer screen ≥4 seconds (proxy for "actually read"), and
  ≥98% completion of acknowledge tap on first HOS module open.
  - **Target:** ≥98% disclaimer acknowledgment, median dwell ≥4s.

The disaster scenario the product is designed to prevent is also a tracked failure mode:
**driver hits a thin TPC corridor, sees no result, bounces to Trucker Path.** Measured as:
% of parking lookups where neither TPC nor public-source fallback returned a result — target
**<2%** by month 3.

### Business Success

| Metric | 90-day target | 6-month target |
|---|---|---|
| Installs (from YouTube/social) | 5,000 | 15,000 |
| Weekly Active Users (WAU) | 30% | 35% |
| D7 retention | 40% | 45% |
| D30 retention | 25% | 30% |
| YouTube view → install conversion | 3% in first 30 days | sustained 2%+ |
| Verified email captures (owned channel) | 4,000+ | 12,000+ |
| Stan Store CTR per WAU/month | 🔍 tracking | 8%+ |
| TruckParkingClub MRR | 🔍 tracking | $2,000+ |
| Stan Store attributable MRR | 🔍 tracking | $1,500+ |

**Leading indicators tracked from day 1 (no targets — establishing baselines):**

- 🔍 **TPC click-to-reservation conversion rate** — what % of drivers who tap a TPC CTA
  complete a booking. Concentration risk on the v1 monetization pillar; if this is low, the
  affiliate revenue thesis breaks before the absolute MRR target does.
- 🔍 **Stan Store deep-link UTM attribution** — per-trigger conversion (Carnivore at 5 lookups,
  Driver's Mind at 10 hours logged, Save Your CDL on HOS warning). Validates trigger-based
  vs banner-spam thesis.
- 🔍 **Day-1 cohort (Stan Store buyers) vs cold-YouTube cohort** — install rate, D7, D30,
  Stan Store re-purchase. Pre-paying audience expected to convert materially higher;
  tracked separately so cold-traffic numbers aren't inflated by warm cohort.

### Technical Success

These are non-negotiable. They are the technical floor a v1 soft launch must clear, not
nice-to-haves:

- **PWA install path works on iOS Safari and Android Chrome** at the device-mix the audience
  survey returns. Add-to-home-screen flow tested on both; iOS-PWA known limitations and
  Android battery-optimization service-worker risk both validated *before* Huffy starts.
- **Offline parking lookup returns last-known cached results** when the device is offline or
  on degraded connectivity. Service worker cache hit rate target: ≥90% for repeat-corridor
  lookups within a 48-hour window.
- **Magic-link auth + Google Sign-In** complete in ≤30 seconds median. No password fallback.
  No Apple Sign-In v1.
- **FTC affiliate disclosure renders on 100% of screens with an affiliate CTA** — verified by
  automated render check in CI before every release.
- **HOS UI guardrails verified in build (v1.1)**: zero RODS-grid graph elements present in
  the bundle (49 CFR 395.32 visual mimicry); every export/screenshot watermarked
  *"NOT AN ELD — NOT FMCSA COMPLIANT"*; first-launch tap-to-acknowledge present; permanent
  footer disclaimer on every HOS screen; 90-day re-acknowledgment prompt scheduled.
- **CCPA/CPRA consumer-rights flow** (Right-to-Know, Right-to-Delete) live at first install,
  not deferred. Public privacy policy at a stable URL before launch.
- **Affiliate slot engine is multi-vertical from v1** — schema accepts parking / fuel /
  load-board / insurance configs. Only TPC wired in v1, but the schema must not require a
  refactor to add a second vertical.
- **No server-side persistent log of user-keyed parking-lookup location history.** HOS
  entries retained 30 days client-side, exportable on demand.

### Measurable Outcomes

| Outcome class | Outcome | First measurement |
|---|---|---|
| Acquisition | YouTube view → install conv ≥3% (first 30d) | Day 30 |
| Acquisition | 5,000 installs by day 90 | Day 90 |
| Engagement | WAU 30% by day 90 | Day 30 + ongoing |
| Engagement | HOS 4-of-7 logging ≥35% by week 4 | Week 4 post-launch |
| Retention | D7 ≥40%, D30 ≥25% by day 90 | Day 30 + ongoing |
| Monetization | TPC click-to-reservation rate baseline | Day 30 |
| Monetization | TPC MRR ≥$2K, Stan Store MRR ≥$1.5K by month 6 | Month 6 |
| Owned channel | 4,000+ verified emails by day 90 | Day 90 |
| Compliance | 100% affiliate-CTA screens render FTC disclosure (CI gate) | Every release |
| Compliance | HOS launch gates fully closed before v1 ships | Pre-v1 release |
| Reliability | Parking lookup p95 time-to-result <3s online, <1s cached | Day 30 |
| Reliability | <2% lookups returning zero results (TPC + fallback) | Month 3 |

## Product Scope

### MVP — Minimum Viable Product

The MVP ships in **two sequenced waves**, gated by checklist completion (see *Pre-Launch
Gates*). Huffy is full-time on the project. v1 soft launch budget: **4–6 weeks of full-time
work**, calibrated to ship parking and HOS together rather than parking-only first.

**v1 Soft Launch (4–6 weeks of full-time work):**

*Parking Lookup (acquisition wedge):*
- Parking Lookup with TPC integration + SHAWN20 affiliate code
- Public-source parking fallback (state DOT rest-area APIs + OSM truck-stop POIs) with a
  normalization layer over the heterogeneous sources
- Offline parking lookup (PWA service worker + cached last-known results)

*HOS Tracker (retention engine — pulled forward from v1.1 to ship at launch):*
- Manual personal logbook with **four duty-status toggles**: Driving / On-Duty Not Driving /
  Sleeper / Off-Duty
- **Real-time clock** showing remaining cycle and shift hours, derived from manually-entered
  status (explicitly framed as "your math, not the ELD's")
- **End-of-shift summary** — daily totals (drive hours, on-duty hours, remaining clock)
  rendered as plain-English text, never as a RODS-grid graph or any visual mimic of
  49 CFR 395.32
- Full disclaimer scaffolding: first-launch tap-to-acknowledge with minimum dwell, permanent
  footer on every HOS screen, 90-day re-acknowledgment prompt
- 30-day client-side retention only — HOS data never leaves the device, no server-side store

*Cross-cutting infrastructure:*
- Generic JSON-driven affiliate slot engine — multi-vertical schema (parking/fuel/load-board/
  insurance) wired from v1, even though only TPC is configured
- Founder-operable admin UI for affiliate slot config (image, CTA copy, code, UTM, on/off
  per slot)
- Magic-link email + Google Sign-In (no passwords, no Apple Sign-In)
- FTC affiliate disclosure components (in-app render on every affiliate-CTA screen + copy
  templates for YouTube/Stan Store) with CI gate verifying render
- Two-question onboarding (OTR/local + start state)
- **Settings/Profile screen**: account email, OTR/local toggle, default start state, privacy
  panel (CCPA/CPRA Right-to-Know, Right-to-Delete, analytics opt-out), "More from Shawn"
  panel linking YouTube and Stan Store catalog, app version + build number, logout
- Public privacy policy at stable URL + CCPA/CPRA consumer-rights flow live at launch
- Stan Store deep-link UTM tracking + verified-email export pipeline (cheap to build now,
  expensive to retrofit)
- Day-1 cohort vs cold-YouTube cohort tagging at signup

**v1.05 — Week after soft launch (1 week of full-time work):**
- Stan Store cross-promo trigger system: Carnivore after 5 successful parking lookups;
  Driver's Mind at 10 logged HOS hours; Save Your CDL on HOS violation warnings;
  "More from Shawn" panel deep-link integrations. (HOS-dependent triggers can fire from v1.05
  forward because HOS ships at v1.)
- Sally's full UX design pass: Mossy Oak accent + #FFEB00 yellow CTAs, dark mode default,
  masculine/blue-collar tone, finalized hex tokens

The earlier plan included a separate **v1.1 HOS Tracker** release, gated on insurance and
LLC formalities. That release is dissolved — its scope ships at v1, and its gates apply to
v1 (see *Pre-Launch Gates*).

### Growth Features (Post-MVP — v1.5+)

These are **deliberately deferred**, not forgotten. Each one has a reason it isn't in MVP:

- **HOS export / PDF generation.** Driver-initiated PDF or CSV of their own HOS records.
  Deferred to v1.5+ to keep the v1 HOS module tightly scoped and to avoid the export-format
  surface area before the lawyer has reviewed the shipped UX in production. When this ships,
  every export must carry the *NOT AN ELD — NOT FMCSA COMPLIANT* watermark.
- **HOS weekly / IFTA-style summaries.** v1 ships daily end-of-shift summaries only.
  Multi-day rollups, weekly/quarterly views, and IFTA-style mileage summaries are an
  owner-operator paid-tier candidate.
- **Fuel discount routing & fuel card affiliate.** Second affiliate vertical lit up via the
  v1 slot engine. Validates the multi-vertical schema thesis.
- **Load board affiliate.** Third vertical, owner-operator-leaning.
- **Weight ticket archiving.** OCR + cloud archive — owner-operator paid-tier candidate.
- **Maintenance log.** Service-record tracking — owner-operator paid-tier candidate.
- **Route planning / trip planner.** Adjacent to parking; expands time-in-app.
- **Paid HOS tier for owner-operators.** Advanced features (multi-truck, advanced summaries).
  Validate willingness-to-pay via interviews or landing-page pricing test before architecting
  paid features.
- **Insurance affiliate.** Fourth vertical. Highest CPM, highest scrutiny — last to ship.

### Vision (2–3 years)

The default app every Trucking Life with Shawn viewer downloads. The digital arm of the
brand. Full multi-vertical affiliate engine generating recurring revenue independent of
YouTube algorithm risk. The end state isn't "an app" — it's the tools the audience already
trusts Shawn for, ported into the cab.

The moat at end-state is the same moat at v1: **the flywheel**. Owned distribution + paying
audience + trucker voice + ruthless focus. Anyone can build a parking app. Nobody else can
build *this* parking app and have 84K drivers install it in week one.

### Explicitly Out of Scope (do not re-propose)

| Out of Scope | Why |
|---|---|
| ELD certification or any FMCSA compliance claim | Different product, different liability, no budget |
| Native iOS/Android apps in v1 | App store gates, 30% take, review delays, instant-update loss |
| Apple Sign-In v1 | PWA exempt; revisit if/when native iOS ships |
| Password authentication | Security overhead, support burden |
| Custom affiliate ad creative | Generic banner system only — keeps Huffy unblocked |
| Stan Store banner-spam every screen | Trigger-based only — founder constraint *"annoying = uninstall"* |
| Hardcoded TPC integration with later refactor | Costs Huffy 2–3 weeks; build generic from v1 |
| RODS-grid HOS graph or anything visually mimicking 49 CFR 395.32 | Recreates the regulatory exposure disclaimers were meant to remove |
| Lawyer review deferred to 1K users | Replaced by pre-launch consult ($1–3K) |
| HOS exports / PDF generation in v1 | Tightly scoped HOS at v1; export format surface deferred to v1.5+ |
| HOS weekly / IFTA-style summaries in v1 | v1 ships daily end-of-shift summaries only; rollups are paid-tier candidates |
| HOS automated driving detection / motion-based status transitions | Recreates ELD territory; v1 is manual-entry only |
| Multi-driver HOS / team logging | Deferred to v1.5+; v1 is single-driver |
| Fleet ELD integration / sync | Permanently out — different product, different liability |

## User Journeys

Each journey below is anchored to a real persona, walks through a story arc, and concludes
with the concrete capabilities the journey demands of the product. If a journey ends without
a corresponding capability, it isn't a built feature — it's a wish.

### Journey 1 — Marcus, Company OTR Driver (Primary User · Success Path)

**Persona.** Marcus, 41. Company driver out of Knoxville running the I-75/I-40 corridor for
a regional carrier. Has watched Shawn's channel for two years, screenshots tips, hasn't
bought a Stan Store product yet but engages with the comments. Drives an iPhone-locked truck;
phone runs Android. Has burned 45 minutes circling exits at 9pm before. Once parked illegally
on a ramp, didn't sleep right, swore he'd never do it again. Has done it twice since.

**Opening scene.** Tuesday, 5:51pm. Marcus is 90 miles out from his expected stop, HOS clock
shows 1h45m. He's driving past Dayton, Ohio — a corridor he's lost the parking lottery on
twice this year. He remembers Shawn's pinned launch video from last week and pulls up the
app, which he installed off Shawn's video the same night.

**Rising action.** App cold-opens in 1.2 seconds. Home screen is one big "Find Parking
Ahead" tile. He taps it. The app uses his last known direction-of-travel and surfaces a list
of options ahead — exit 142, 71 miles out, **TPC reservable, 4 spots open, $20 off with
SHAWN20.** Below it, two more options: a pilot 14 miles past, full; a state rest area at
mile 158, free, no reservation. The TPC card is on top because reservable beats hopeful.

**Climax.** Marcus taps the TPC card. The detail view shows photos, lighting, gate hours,
and a clear FTC disclosure under the booking button: *"Trucking Life with Shawn earns a
commission when you book through this link. Your discount is not affected."* He books with
SHAWN20, $20 off applied, confirmation screen with directions. Total taps from app open to
booked: **three.** No ad. No upsell. No "premium for more results."

**Resolution.** 7:38pm, Marcus pulls into exit 142, gate code from the booking confirmation,
truck parked, cab dark by 7:55. Sleep before HOS clock zeros. Next morning he leaves a
five-star review on YouTube under the launch video: *"Worked first try. Saved me an hour
and twenty bucks."*

**Capabilities this journey demands:**
- Cold-open to result render in <3 seconds (perceived as "instant")
- Direction-of-travel-aware parking results (default sort = ahead, not nearest)
- TPC reservable spots prioritized over public listings in the result list
- One-tap deep link from result card to TPC booking flow with SHAWN20 pre-applied
- FTC disclosure rendered adjacent to every TPC CTA — not just at app boundary
- Result detail with photos, gate hours, and lighting info from TPC payload
- No ad slots, no upsell modals, no premium-tier gates in the parking flow itself

### Journey 2 — Marcus Again (Primary User · Edge Case · The Disaster We Prevent)

**Same persona, different week.** Thursday, 8:17pm. Marcus is on a less-traveled corridor in
rural West Virginia — narrow shoulders, sparse exits, the kind of stretch where the original
disaster scenario lives. HOS clock at 1h22m. He opens the app expecting another exit-142
moment.

**Rising action.** TPC has zero properties in the next 80 miles of his direction. In the old
world this is the moment Marcus would close the app and bounce to Trucker Path. The app does
not let that happen.

**Climax.** Instead of an empty state, the app shows a clearly labeled **"Public-source
results — not reservable, not guaranteed"** section. State DOT rest areas at miles 87, 142,
and 168 (live capacity unknown — flagged), plus three OSM-listed truck stops with phone
numbers and last-known operating hours. A small banner reads: *"No TPC reservable spots
ahead. Always have a backup plan."* No flailing, no error toast, no "try again later."

**Resolution.** Marcus calls the truck stop at mile 142, confirms space, drives on. Doesn't
bounce to a competitor. Doesn't even *think* about a competitor. The app has a different
job in this corridor than in Ohio — it's the safety net, not the reservation funnel — and
it does that job too.

**Capabilities this journey demands:**
- Public-source fallback layer (state DOT rest-area APIs + OSM truck-stop POIs)
- Normalization layer over heterogeneous third-party data (different sources speak different
  schemas)
- Visually distinct treatment of fallback results — never indistinguishable from TPC
- Disclaimer: *"Parking availability shown is provided by third parties and is not
  guaranteed. Always have a backup plan."*
- Empty-state UX that never reads as failure
- Telemetry on zero-result lookups (the <2% disaster-rate metric)

### Journey 3 — Linda, Owner-Operator (HOS Retention · Daily Habit)

**Persona.** Linda, 53. Owner-operator out of Springfield, MO. One truck, 11 years on her own
authority, 18 in the seat total. Cross-checks her fleet ELD entries because she's been burned
by a glitchy auto-status before — a $1,200 violation she had to fight off because the ELD
auto-flipped her to drive-line during a yard move. She wants her own clean record. She
googled "logbook app not eld" two months ago, found Drivers Daily Log was abandoned, and
emailed Shawn (an active Stan Store buyer of *17 Years Zero Violations*) asking what he
recommends.

**Opening scene.** Saturday, 7:14pm. Truck parked at home. Linda opens the app on launch
day. She got the email blast from Shawn announcing the app. First-launch HOS module — she
taps through.

**Rising action.** Tap-to-acknowledge disclaimer:

> **Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof of duty status.**
> You are required by 49 CFR Part 395 to use a registered ELD or approved paper log if
> applicable. This app does not satisfy that requirement. Showing this app to a DOT officer
> will not stop a violation. Always cross-reference your fleet's ELD as the official record.

She reads it. Median dwell ≥4 seconds — she actually reads it because Shawn is the kind of
guy who'd put it there. She taps acknowledge. Her trust in the rest of the app goes *up*,
not down.

**Climax.** Logging her shift: plain-English statuses (Driving / On-Duty Not Driving /
Sleeper / Off-Duty), each with optional notes. No grid, no graph that looks like the RODS
form she sees on her real ELD. She enters today's hours from memory in 90 seconds. Daily
summary at the bottom: total drive, total on-duty, remaining 70-hour clock — hand-calculated
estimate, plain-English, with a footnote that this is *her* math, not the ELD's. Permanent
footer disclaimer on every screen.

**Resolution.** Sunday morning she does the same thing. Day 7, the app pings her phone:
*"You've logged 5 days this week. Want to see your weekly summary?"* She does. By day 14
it's a habit. At 10 logged hours she sees, once, *"More from Shawn: Driver's Mind — mental
wellness for drivers."* She doesn't buy that one (already owns it from Stan Store) but
mentally notes the trigger placement felt earned, not pushy. By month two she's the kind of
user that pays for the eventual paid HOS tier.

**Capabilities this journey demands:**
- First-launch tap-to-acknowledge disclaimer with median dwell ≥4 seconds (proxy: minimum
  hold time before acknowledge tap is enabled)
- Permanent footer disclaimer on every HOS screen
- Plain-English status entry (Driving / On-Duty Not Driving / Sleeper / Off-Duty) — never
  any RODS-grid graph or visual mimic of 49 CFR 395.32
- Daily and weekly summaries with explicit "your math, not the ELD's" framing
- 90-day re-acknowledge prompt (see Compliance section)
- Stan Store trigger at 10 hours logged (Driver's Mind only, once)
- Watermark on every export and screenshot: *"NOT AN ELD — NOT FMCSA COMPLIANT"*
- Local-only HOS retention (30 days client-side, exportable on demand)

### Journey 4 — Wes, Day-1 Cohort (Stan Store Buyer · Warm Launch)

**Persona.** Wes, 38. Company driver, owns *Save Your CDL* and *Carnivore in the Truck*
from Stan Store. Already on Shawn's email list. Already opens every Shawn email. He's the
warm cohort — the disproportionately important sliver of the early base.

**Opening scene.** Sunday morning. The Stan Store email blast hits: *"The app is live. SHAWN20
inside. iOS and Android both."* Wes is on his couch, hasn't started the week yet.

**Rising action.** He clicks the link. Lands on `app.truckinglifewithshawn.com`. The page
detects iOS, shows the add-to-home-screen instructions inline (not buried in a popup).
Magic-link auth — he enters his email (the same one he uses for Stan Store). Email arrives
in 8 seconds. He taps the link, lands back in the app, signed in. Total time from email
click to logged-in app: under 2 minutes.

**Climax.** Onboarding asks two questions: *"Are you OTR or local?"* and *"What state do
you usually start the week in?"* That's it — no 20-screen onboarding, no "tell us about
yourself." He taps "Find parking" once just to see it work. It works.

**Resolution.** Two weeks in, Wes has booked through TPC three times, opened the app daily,
and clicked the *"More from Shawn"* panel in settings out of curiosity. He's flagged in
analytics as a Day-1 cohort user via the Stan Store deep-link UTM. His retention numbers are
materially higher than the cold-YouTube cohort. The cohort delta validates the warm-launch
thesis.

**Capabilities this journey demands:**
- Stan Store deep-link with UTM tracking that survives the magic-link auth handoff
- Verified-email export pipeline (every Stan Store buyer who installs becomes a verified
  email subscriber attributable to source)
- Cohort-tagging (Day-1 vs cold-YouTube) at signup, persistent in analytics
- Inline iOS PWA add-to-home instructions on the landing page (not a popup)
- Magic-link auth path completable in <2 minutes end-to-end
- Onboarding capped at 2 questions

### Journey 5 — Shawn, Owner/Operator of the Affiliate Slot System (Ops Journey)

**Persona.** Shawn himself. Lives in the cab Mondays through Fridays. Operates the business
in evenings and weekends. Not a developer. Huffy is full-time on the project, but Shawn is
the one signing affiliate deals on the road and wants the agency to flip switches without
routing every config change through someone else. Founder autonomy, not developer
substitution.

**Opening scene.** Three months post-launch. Shawn signs a fuel-card affiliate deal at
MidAmerica Trucking Show. He's standing in the parking lot, deal still warm. He wants the
banner live in the app before he gets back to the truck — without pulling Huffy off whatever
Huffy is shipping that afternoon.

**Rising action.** He logs into a simple admin page from his phone. The page lists every
affiliate slot in the app: *Parking results — sponsored row*, *Settings — fuel card*,
*HOS summary — fuel card*. Each slot has a JSON config: which vertical, which banner image,
which CTA copy, which discount code, which UTM, on/off toggle. He flips on the fuel-card
slot, pastes the new code, uploads the banner, hits save. The change goes live in the next
service-worker cache cycle (≤15 minutes).

**Climax.** He pulls up the admin analytics page. Per-slot impressions and click-throughs.
He can see the Carnivore trigger at 5 lookups versus the Driver's Mind trigger at 10 hours
side-by-side. He spots that one trigger underperforms, tweaks the placement copy, watches
the next 48 hours move.

**Resolution.** The product is operable by the founder *and* the developer, not gated through
the developer for cosmetic changes. Huffy stays focused on hard problems (HOS guardrails,
fallback normalization, performance) instead of context-switching for banner swaps. Shawn
keeps the affiliate engine in his own hands — the point of the brand was always that he
runs it himself.

**Capabilities this journey demands:**
- Founder-operable admin UI (separate from Huffy's deploy pipeline)
- JSON-driven affiliate slot configs — vertical, image, CTA copy, discount code, UTM, toggle
- Per-slot impression and click-through analytics
- Stan Store trigger configuration (which trigger fires, after what threshold, how often)
- Edit propagation through service-worker cache within ≤15 minutes
- Auth gate on the admin UI (founder + future ops only)

### Journeys NOT Mapped (Intentional Out-of-Scope for v1)

- **API consumer journey.** No public API in v1. We're an app, not a platform. Internal
  consumers of TPC, state DOT, and OSM are integrations, not API users.
- **Customer support agent journey.** No support team in v1; Shawn answers comments and
  emails himself. A formal support tooling journey is deferred until install volume justifies
  it (likely past 15K WAU). Until then, support requests route through the existing email
  list.
- **Developer/contributor journey.** Single developer (Huffy). No external contributor flow
  in v1.

### Journey Requirements Summary

The five mapped journeys converge on the following capability set. Each row maps to one or
more journeys to demonstrate that no requirement below is hypothetical — every one is
backed by a named user moment.

| Capability | Driven by Journey(s) |
|---|---|
| Direction-aware parking lookup with TPC-reservable prioritization | 1 |
| Public-source fallback (state DOT + OSM) with normalization | 2 |
| Visually distinct fallback treatment + "always have a backup plan" copy | 2 |
| Service-worker offline cache for last-known parking results | 1, 2 |
| Cold-open performance budget (<3s online, <1s cached) | 1 |
| FTC affiliate disclosure rendered adjacent to every affiliate CTA | 1 |
| TPC deep-link with SHAWN20 pre-applied | 1 |
| HOS plain-English logging (no RODS grid) | 3 |
| HOS first-launch tap-to-acknowledge with minimum dwell | 3 |
| Permanent HOS footer disclaimer + 90-day re-acknowledge | 3 |
| Watermarked HOS exports/screenshots | 3 |
| 30-day client-side HOS retention with on-demand export | 3 |
| Stan Store trigger system (5-lookup, 10-hour, HOS-violation, settings panel) | 3, 5 |
| Stan Store deep-link UTM that survives magic-link auth | 4, 5 |
| Magic-link email + Google Sign-In, no passwords | 4 |
| Inline iOS PWA add-to-home instructions on landing page | 4 |
| Two-question onboarding (OTR/local + start state) | 4 |
| Day-1 cohort vs cold-YouTube cohort tagging | 4, 5 |
| Founder-operable admin UI for affiliate slot configs | 5 |
| Per-slot impression + click-through analytics | 5 |
| Edit propagation within ≤15 minutes via service-worker cache cycle | 5 |
| <2% zero-result lookup telemetry | 2 |
| CCPA/CPRA Right-to-Know / Right-to-Delete flow | (not journey-driven; cross-cutting) |

The CCPA/CPRA row is the one capability that doesn't appear in a user-visible happy-path
journey. It's a cross-cutting compliance requirement that will be addressed in the
*Compliance & Regulatory Posture* section, not because no one uses it, but because the
people who do use it (regulators, the rare user who exercises their rights) aren't a
narrative-journey persona.

## Domain-Specific Requirements

The "general" domain tag does not mean "no regulatory exposure." Three regulatory surfaces
shape what ships and how:

1. **FMCSA non-compliance posture** — HOS Tracker explicitly is not an ELD under 49 CFR
   Part 395. Disclaimers and UI guardrails exist to keep it that way.
2. **FTC endorser disclosure** — under 16 CFR Part 255, Shawn's personal endorser liability
   attaches regardless of LLC status. Disclosure happens in-app, on YouTube, on Stan Store,
   and in pinned comments.
3. **California consumer privacy (CCPA/CPRA)** — Right-to-Know and Right-to-Delete flows
   live at first install, not deferred.

Each surface becomes a concrete requirement set below, plus a hard-gate checklist that
governs when v1 is allowed to ship. Note that with HOS pulled forward into v1, the gate
structure consolidates: there is no longer a separate v1.1 release with its own gates —
all HOS-related gates apply to v1.

### Compliance & Regulatory

#### FMCSA / HOS Tracker (49 CFR Part 395)

The HOS module is a **personal record**, not an Electronic Logging Device. Every design
decision for HOS is downstream of that posture.

**Hard guardrails (enforced in build, verified in CI):**

- **No RODS-grid graph.** Nothing visually mimics the duty-status grid of 49 CFR 395.32.
  End-of-shift summaries are tabular text, not graphical timelines.
- **First-launch tap-to-acknowledge** the canonical disclaimer (see *Disclaimer Copy* below)
  before any HOS feature is reachable. Acknowledge button is gated by a minimum dwell time
  (≥3 seconds on screen before the tap registers) so users have time to read.
- **Permanent footer disclaimer** on every HOS screen, every state, every modal:
  *"Personal record only. Not an ELD. Not FMCSA-compliant."* This permanent footer also
  serves as the natural watermark on any user-taken screenshot — no separate watermarking
  pipeline is required at v1 because no export feature ships at v1 (see *Out of Scope*).
- **90-day re-acknowledge** prompt: every 90 days of active HOS use, and on any version bump
  whose changelog touches HOS, the disclaimer re-appears for a fresh tap-to-acknowledge.
- **No export feature in v1.** When export ships in v1.5+, every export must carry the
  *NOT AN ELD — NOT FMCSA COMPLIANT* watermark; until then there is no surface to
  watermark.
- **Plain-English status only.** Statuses are: Driving / On-Duty Not Driving / Sleeper /
  Off-Duty. No "duty status code" abbreviations. No automatic state transitions based on
  motion or ignition (that's ELD territory).
- **Real-time clock framing.** The remaining-cycle / remaining-shift display is derived from
  the user's manually-entered statuses and is labeled as the user's own estimate, never as
  "official" or "compliant" time. Copy: *"Your math, based on what you've logged."*

**Out of scope, permanently:** ELD certification, FMCSA registration, telematics integration,
hardware tethering, automated motion-based status transitions, RODS-grid UI, fleet ELD
sync, multi-driver/team logging, official-record framing. We do not tell anyone, anywhere,
that this app helps a driver comply with 49 CFR Part 395.

#### FTC Endorser Disclosure (16 CFR Part 255)

Shawn is the endorser. Personal liability attaches regardless of the LLC. The product treats
disclosure as a cross-cutting requirement, not a marketing footnote.

**In-app requirements:**

- Disclosure text rendered **adjacent to every affiliate CTA** (TPC parking buttons, future
  fuel-card and load-board CTAs, Stan Store cross-promo cards). Not behind an "i" icon.
  Not in the footer. Adjacent.
- Canonical text:
  *"Trucking Life with Shawn earns a commission when you book through this link.
  Your discount is not affected."*
- **Render verification** in CI: an automated check on every release that scans the rendered
  affiliate-CTA components and fails the build if any CTA is shipped without the
  disclosure component as a sibling. Treated like a test — it's not a "review item."

**Off-app requirements (out of Huffy's build scope, but the founder gates depend on them):**

- YouTube launch video: disclosure in description, verbal callout in the video, pinned
  comment with the same text.
- Recurring CTA videos: same three placements.
- Stan Store cross-promo emails referencing app installs: disclosure in the email body.
- A **written affiliate disclosure policy** lives at a stable URL and is linked from the
  app footer.

#### CCPA / CPRA Consumer Rights

California consumer-rights flow ships with v1, not as a v1.05 polish item.

**Required at v1 launch:**

- **Right to Know.** A user-accessible page in the app (Settings → Privacy → My Data) lists
  all data the app stores about them, with categories: account email, OAuth identity,
  HOS entries (last 30 days), saved parking searches, app usage analytics.
- **Right to Delete.** A single-click "Delete my account and data" option in the same panel.
  Deletion is irreversible and stated explicitly. Server-side deletion completes within 30
  days; user receives email confirmation.
- **Right to Opt Out** of the (limited) analytics tracking. Default is on; opt-out is one
  toggle in the same panel.
- **Public privacy policy** at a stable URL (`app.truckinglifewithshawn.com/privacy`),
  linked from app footer and onboarding, **before first install**.

**Data minimization principles:**

- **No server-side persistent log of user-keyed parking-lookup location history.** Lookups
  hit TPC and fallback sources via the user's device; the server does not retain a per-user
  trail of "Marcus searched for parking near Dayton at 5:51pm."
- **HOS entries retained 30 days client-side.** Older entries are deleted from local storage
  automatically. The server never holds HOS payloads. There is no v1 export feature, so
  there is no export surface to govern (deferred to v1.5+).
- **Email is the only persistent server-side identifier** the product needs. Everything else
  is ephemeral or client-side.

### Technical Constraints

The compliance surfaces above translate into specific technical constraints Huffy must
honor:

- **CI gate: FTC disclosure render check.** Build fails if any affiliate CTA component is
  rendered in a parent that doesn't include the disclosure component as a sibling. Static
  analysis acceptable; visual snapshot test acceptable.
- **CI gate: HOS UI guardrail check.** Build fails if the HOS bundle contains any component
  whose rendered output produces a 24-cell horizontal grid (a heuristic for RODS-grid
  visual mimicry — false positives are reviewed manually).
- **No third-party analytics that key on user identifiers.** Aggregate-only analytics
  (Plausible, self-hosted PostHog with anonymous mode) are acceptable. Google Analytics
  with default user-keyed tracking is not.
- **Service-worker cache for parking results MUST NOT cache HOS data.** Different cache
  partitions, different retention rules.
- **HOS data is local-only.** No HOS payload ever crosses the wire to Supabase or any other
  server. Statuses, summaries, and the real-time clock all compute client-side from
  IndexedDB or equivalent.
- **Secrets handling.** SHAWN20 is a discount code, not a secret. TPC affiliate API keys,
  Supabase service role keys, and any future affiliate API keys must live in Supabase Edge
  Function environment, not in client bundles. Standard practice; called out because
  affiliate partner expansion in v1.5+ will multiply this surface.

### Integration Requirements

Three external systems integrate at v1, with one normalization layer over the heterogeneous
sources:

- **TruckParkingClub API** (primary parking source). Affiliate-tracked deep links use the
  SHAWN20 code on the URL. We do not proxy the booking flow — users complete reservation
  on TPC's surface so PCI scope stays out of our product.
- **State DOT rest-area APIs** (fallback layer). Per-state availability and quality varies
  significantly. Integration is per-state, normalized to a common schema. Plan for
  graceful degradation when a state API is down or returns nothing.
- **OpenStreetMap truck-stop POIs** (fallback layer). Static data via Overpass API or
  prebuilt extract. Cached aggressively; refreshed weekly.
- **Stan Store deep-link UTM** (cross-promo). Outbound links to Stan Store products carry
  UTM parameters that survive the magic-link auth handoff (cookied or URL-state preserved
  across the auth roundtrip). Attribution feeds analytics, not product surfaces.
- **No integration with fleet ELD systems, telematics providers, or DOT data feeds.**
  Architecting against those integrations would re-create the regulatory exposure that
  disclaimers are meant to remove.

### Risk Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Driver mistakes HOS Tracker for an ELD; uses it during a DOT inspection; gets a violation; sues | Low | High | Tap-to-acknowledge, footer disclaimer (natural watermark on screenshots), 90-day re-acknowledge, lawyer-reviewed copy gating v1 launch. **Insurance bound before v1 launches** (pulled forward from v1.1). |
| FTC investigation for inadequate endorser disclosure | Low | High | In-app disclosure adjacent to every CTA, CI-gated. YouTube + Stan Store disclosures verified before launch. Pre-launch attorney consult covers disclosure language across surfaces. |
| TPC partnership ends, sole monetization pillar collapses | Medium | High | Multi-vertical affiliate schema in v1 means a fuel-card or load-board partner can be wired without code changes. Concentration risk is mitigated by the schema, not by paper. Track TPC-partnership-longevity as an open question; pursue written commitment beyond the affiliate portal. |
| Regulator (FMCSA, FTC, state AG) issues subpoena or letter | Low | High | Written incident-response playbook with attorney-on-retainer hand-off. Continuous accelerator triggers immediate lawyer review. |
| Trucker Path ships "reservable spots" feature, erodes funnel differentiator | Medium | Medium | Brand-voice trust + creator-distribution moat are the moat, not the feature. We do not commit to a feature-parity arms race. Watch competitive feature shipping; do not panic-respond. |
| iOS PWA platform changes break service-worker offline cache | Medium | Medium | Audience device-mix survey identifies iOS share before Huffy starts. If iOS share is high, build with awareness of iOS PWA limitations (storage caps, service-worker eviction) and prioritize Android offline behavior. |
| Android battery optimization kills service-worker on older devices | Medium | Medium | Survey identifies Android device-age. Document known-device-class limitations in onboarding ("If parking is slow offline, your phone may be putting the app to sleep — here's how to allow background activity"). |
| User reports a bad TPC listing, expects refund, contacts Shawn directly | High | Low | Parking module disclaimer present at every TPC CTA. Support links route to TPC's CS, not Shawn's email. |
| Pulling HOS into v1 increases liability surface before insurance is in place | Low | High | Insurance binding pulled forward from v1.1 to v1 (gated). v1 cannot launch until tech E&O + product liability + cyber insurance is bound. |

### Pre-Launch Gates

These are hard gates. The build can be feature-complete and *still not ship* if any gate
is open.

**Important shift from earlier planning:** the original brief proposed a parking-only soft
launch that could run uninsured, with insurance binding gating only a later v1.1 HOS
release. With HOS pulled forward into v1, **all v1.1 HOS gates apply to v1**. There is no
parking-only-uninsured launch window. The full liability stance is established before the
first install.

**Before v1 soft launch — founder/business hygiene:**

- ☐ **Audience device-mix survey** posted to YouTube/TikTok/Facebook ("What phone do you
  use in the truck — iPhone or Android?"). Validates PWA viability and surfaces iOS-PWA /
  Android battery-optimization risk before Huffy starts work. Cost: 5 minutes.
- ☐ **Pre-launch transportation/tech-attorney consult** ($1–3K) reviewing: HOS disclaimer
  copy, parking module disclaimer, FTC affiliate disclosure language (in-app + YouTube +
  Stan Store), privacy policy, CCPA/CPRA flow.
- ☐ **LLC affiliate-revenue routing confirmed.** SHAWN20 commissions paid to LLC bank
  account, not personal. Veil-piercing hygiene.
- ☐ **YouTube launch-video FTC disclosure locked** in description, verbal callout in the
  video, pinned comment.
- ☐ **In-app FTC disclosure** rendered on every screen with an affiliate link (CI-gated).

**Before v1 soft launch — full liability stance (pulled forward from v1.1 because HOS ships
at v1):**

- ☐ **Tech E&O + product liability + cyber insurance bound** for the LLC. Disclaimers don't
  pay defense costs; insurance does. Pulled forward from v1.1 — non-negotiable now that HOS
  is in v1 scope.
- ☐ **LLC formalities verified.** Capitalization, bank separation, no commingling, observed
  governance.
- ☐ **Lawyer-reviewed final HOS disclaimer copy** — sign-off pass on shipped UX, not just
  draft language. The pre-launch attorney consult covers draft review; this is the
  additional sign-off pass on the actual built UX before launch.
- ☐ **HOS UI guardrails verified in build.** No RODS-grid graph (49 CFR 395.32 visual
  mimicry); first-launch tap-to-acknowledge live with minimum dwell; permanent footer
  disclaimer on every HOS screen; 90-day re-acknowledgment scheduled. (Watermarked exports
  are not in scope until v1.5+ when HOS export ships.)

**Continuous accelerator events** — any of these triggers immediate lawyer review regardless
of user count:

- Any subpoena or legal letter
- Any paid feature shipping
- Any media coverage outside Shawn's owned channels
- Any partnership beyond TPC affiliate
- Any HOS-related support ticket suggesting user reliance ("I showed your app to a DOT
  officer and he…")
- Crossing 500 active HOS users

### Disclaimer Copy (canonical — ship verbatim)

These strings ship in the product as-is. Translation, paraphrase, or "tightening" is
forbidden without lawyer sign-off. Variable interpolation is forbidden. They live in a
single source-of-truth module (`disclaimers.ts` or equivalent) and are imported, not
duplicated.

**HOS Tracker (full disclaimer, first-launch tap-to-acknowledge):**

> Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof of duty status.
>
> You are required by 49 CFR Part 395 to use a registered ELD or approved paper log if
> applicable. This app does not satisfy that requirement. Showing this app to a DOT officer
> will not stop a violation. Always cross-reference your fleet's ELD as the official record.

**HOS Tracker (footer, every screen):**

> Personal record only. Not an ELD. Not FMCSA-compliant.

**Parking module (rendered with every search result set):**

> Parking availability shown is provided by third parties and is not guaranteed. Always
> have a backup plan. We are not responsible for parking conditions, security, or the
> accuracy of third-party listings.

**FTC affiliate (adjacent to every affiliate CTA, in-app):**

> Trucking Life with Shawn earns a commission when you book through this link. Your
> discount is not affected.

**HOS export watermark (deferred — v1.5+):**

When HOS export ships in v1.5+, every exported PDF/CSV must carry, in bottom-right or
header location, opaque and non-removable:

> NOT AN ELD — NOT FMCSA COMPLIANT

## Innovation & Novel Patterns

This product is mostly an execution play — speed, focus, trucker voice. Two things are
structurally novel enough to call out, not as breakthroughs but as **deliberate architectural
commitments most teams in this category wouldn't make at v1**.

### Detected Innovation Areas

**1. Multi-vertical affiliate engine built generic in v1 with only one affiliate wired.**
The standard pattern for a single-affiliate launch is to hardcode the integration and
refactor when a second partner appears. We rejected that path explicitly: ~2–3 weeks of
refactor debt vs. a JSON-driven slot schema accepting parking, fuel-card, load-board, and
insurance configs from day one. The schema is a v1 commitment; only TPC is configured. The
unusual choice is paying the genericity cost before the second affiliate exists.

**2. Creator-distribution as a first-class product architecture, not a marketing dashboard.**
Day-1-cohort tagging at signup (Stan Store buyer vs. cold YouTube), Stan Store deep-link
UTM that survives the magic-link auth roundtrip, and a verified-email export pipeline are
all product surfaces in v1. Most creator-distributed apps treat "where did this user come
from" as analytics-dashboard work bolted on later. We're treating it as install-flow
plumbing because the warm-cohort thesis is the business thesis, not a curiosity metric.

### Market Context & Competitive Landscape

- **Trucker Path** monetizes through ads and one fuel-card affiliate. No multi-vertical
  schema; no creator distribution; no cohort tagging beyond standard analytics.
- **TruckSmarter** is fuel-led and single-affiliate by design.
- **Park My Truck** has no monetization model and no distribution architecture.
- No competitor in the trucking app space treats creator distribution as architectural,
  because no competitor has a creator distributing their app. The novelty is contingent on
  the team, not on the technology — but it makes the architecture itself a moat that a
  VC-funded copycat would need a creator partner to replicate.

### Validation Approach

- **Multi-vertical engine.** The thesis is validated when a second affiliate (fuel-card or
  load-board, v1.5+) is wired without a refactor. If wiring the second affiliate takes
  more than ~3 days of Huffy's time, the genericity claim was wrong.
- **Creator-distribution architecture.** The thesis is validated by the **Day-1 cohort vs.
  cold-YouTube cohort** retention delta. If Stan Store buyers retain meaningfully better
  than cold YouTube installs at D7/D30, the cohort tagging earned its build cost. If the
  delta is negligible, the warm-cohort thesis is wrong and the architecture is overbuilt.
- Both validations are tracked from day one as leading indicators (see *Success Criteria*).

### Risk Mitigation

- **If the multi-vertical schema turns out wrong** (e.g., fuel-card affiliates require
  fundamentally different data shape), the cost is one refactor at v1.5+ — the same cost
  we'd have paid by hardcoding. We are not worse off than the rejected alternative.
- **If the warm-cohort thesis fails** (Day-1 cohort doesn't retain better than cold), the
  cohort-tagging infrastructure still produces correct attribution — it's not load-bearing
  for any user-facing feature. We learn the thesis is wrong cheaply and reallocate marketing
  effort accordingly.

The honest framing: neither commitment is a bet that *can't* be unwound. Both are bets that
are *cheaper to make now than later*. That's the innovation — disciplined upfront optionality,
not breakthrough invention.

## PWA / Web App Specific Requirements

### Project-Type Overview

This is a **Progressive Web App, single-page React architecture, mobile-first, with desktop
as a secondary surface for the founder admin UI only.** No native iOS/Android, no app
stores, no Apple Sign-In v1. The PWA install path is the install funnel — Add-to-Home-Screen
on iOS Safari, full PWA install on Android Chrome.

### Browser & PWA Compatibility Matrix

**Target support (v1):**

| Surface | Version | Status |
|---|---|---|
| iOS Safari | 16.4+ | Primary target — PWA install + service worker fully supported |
| iOS Safari | 14.0–16.3 | Secondary — install works, service worker behavior degraded |
| Android Chrome | latest 2 major versions | Primary target — full PWA |
| Android Chrome | older / Samsung Internet | Secondary — install works; battery-optimization may evict service worker |
| Desktop Chrome / Safari / Firefox / Edge | latest 2 major | Functional support; admin UI optimized for desktop Chrome |
| Any browser without service worker support | n/a | Graceful degradation: parking lookup works online-only, HOS module shows a not-supported banner, install prompt is hidden |

The audience device-mix survey (pre-launch gate) drives the priority within this matrix.
If iOS share is >40%, iOS Safari 16.4+ becomes the must-pass target and older iOS gets
explicit known-limitations documentation in onboarding. If Android share dominates and
device-age skews older, battery-optimization mitigation (an explicit settings prompt
guiding users to allow background activity) ships in v1.

### Responsive Design

**Mobile-first, single column, large touch targets.** Drivers use this app one-handed in a
moving cab, in low light, in gloves, on a bouncing truck. The design constraints are the
*usability* constraints, not aesthetic preferences:

- **Touch target minimum: 48dp** (Material) or 44pt (Apple HIG) — whichever is larger applies
  per platform. No exceptions for "secondary" buttons.
- **Single-column layout** at viewport widths ≤640px. No multi-column dashboards on phones.
- **Dark mode default**, light mode available — driven by in-cab use case where bright
  screens at night ruin night vision and burn battery.
- **Desktop layout (≥1024px)** is admin-UI-optimized only. The driver-facing flows are
  responsive but not redesigned for desktop — a driver on desktop still sees a phone-shaped
  flow, which is fine.

### Performance Targets

Already enumerated in *Technical Success* but consolidated here for the developer-facing
spec:

| Metric | Target | Notes |
|---|---|---|
| Cold-open to first interactive paint | <2s on 4G | Baseline truck-corridor connectivity |
| Cold-open to first parking result rendered | <3s online, <1s cached | Service-worker hits the cache before network |
| Magic-link auth complete (email click → signed in) | <30s median | Including email-delivery time (we control the rest) |
| Service-worker cache hit rate | ≥90% for repeat-corridor lookups (48h) | Validates offline thesis |
| HOS status entry (open module → entry saved) | <5 taps, <10s total | The "every shift" habit must be friction-light |
| Lighthouse Performance score | ≥90 (mobile, simulated 4G) | CI-gated |
| Lighthouse Accessibility score | ≥95 | CI-gated |
| JavaScript bundle size (initial load) | ≤200KB gzipped | Trucking corridors include slow-data zones |

### SEO & Marketing Surface Strategy

**SEO is not a v1 priority.** Acquisition is creator-distribution (YouTube, TikTok, Facebook,
Stan Store, email list). The app itself is logged-in and not a search target. Three minimal
SEO surfaces ship with v1:

- **Landing page** at `app.truckinglifewithshawn.com` — meta title, description, Open Graph
  card (so Stan Store / YouTube share previews look right). Single page, no full SEO tree.
- **Privacy policy** at `app.truckinglifewithshawn.com/privacy` — indexable, lawyer-reviewed,
  CCPA/CPRA-compliant.
- **Affiliate disclosure policy** at a stable URL — indexable.

No sitemap, no robots.txt customization beyond defaults, no schema.org markup, no
Search Console setup until install-funnel data tells us search-acquired users matter (they
won't, in v1).

### Real-Time & Notifications

**No real-time features in v1.** Supabase realtime is unused at v1; the data flows are all
request/response or local. Three deliberate "no" decisions:

- **No live TPC inventory updates** — TPC API call on user-initiated lookup is fresh enough.
- **No live affiliate slot config push** — service-worker cache cycle (≤15 min) is the
  propagation window; "instant" is not a requirement.
- **No multi-device HOS sync** — HOS is local-only by privacy posture, not just by feature
  scope.

**Notifications strategy at v1: in-app only.** Native Web Push notifications are deferred
to v1.5+ for two reasons: iOS Safari requires 16.4+ (and the device-mix survey hasn't
returned), and notification permission requests in v1 are friction we can avoid.

The retention-loop "ping" referenced in Journey 3 (Linda's day-7 weekly summary nudge)
ships at v1 as an **in-app banner shown on next app open**, not a push notification. The
text content is the same; the delivery mechanism is "user opens app" instead of "OS shows
notification while app is closed." This is honest about PWA notification reality and
avoids permission-prompt friction at install.

### Accessibility (WCAG 2.1 AA target)

Accessibility is **usability-load-bearing**, not a checklist. The cab-context constraints
push accessibility past "AA compliance" into actual driver-comfort territory:

**Required at v1:**

- **WCAG 2.1 AA** color contrast ratios (4.5:1 for body text, 3:1 for large text and UI
  components). The Mossy Oak palette + #FFEB00 CTA combination gets contrast-tested by Sally
  during UX phase; failing tokens are escalated, not shipped.
- **Touch targets ≥48dp/44pt** (already covered above).
- **Semantic HTML** for all interactive components (button, a, form, label) so screen readers
  on iOS/Android function natively.
- **Visible focus indicators** on all keyboard-focusable elements (rare PWA need, but cheap
  to ship).
- **prefers-reduced-motion respected** — no parallax, no carousel auto-advance, no large
  animated transitions for users with motion sensitivity.
- **Alt text on every meaningful image** (TPC location photos, banner images in affiliate
  slots, Stan Store product cards).

**Out of scope for v1:**

- Full WCAG 2.2 AAA compliance.
- Multilingual support — English only at v1; Spanish is a Growth-feature candidate (sizable
  Spanish-speaking driver base in the U.S.).
- Voice interaction beyond OS-native screen-reader.

### Storage Architecture

| Data | Storage | Retention | Why |
|---|---|---|---|
| HOS entries (statuses, summaries) | IndexedDB on device | 30 days, auto-pruned | Privacy posture: HOS never crosses the wire |
| Parking lookup results (cache) | Service worker Cache API | Last-known per corridor, 48h | Offline thesis |
| User auth token (magic-link session) | localStorage | Session lifetime | Standard Supabase auth |
| User prefs (OTR/local, start state, dark mode) | localStorage | Until logout/uninstall | Lightweight |
| Account email + OAuth identity | Supabase auth.users | Until user-initiated delete | The only persistent server-side user data |
| Cohort tag (Day-1 vs cold-YouTube) | Supabase user metadata | Permanent (until delete) | Attribution thesis validation |
| Aggregate analytics | Plausible / anonymous PostHog | Per-tool retention | No user-keyed tracking |

### Implementation Considerations

- **PWA manifest** at `/manifest.json` with: name, short name, theme color (#FFEB00 or
  Sally's locked accent), background color, icons (multiple sizes including maskable),
  display: standalone, start URL, scope.
- **Service worker** scope is the entire app; cache strategies are per-route (Network First
  for parking lookups with cache fallback, Cache First for static assets, Network Only for
  auth and admin UI calls).
- **Offline detection**: `navigator.onLine` plus the service-worker fallback path. Offline
  state shown explicitly in parking lookup ("Showing cached results from [time]").
- **Install prompts**: on iOS, render inline add-to-home instructions on the landing page
  and on first parking lookup if not installed; on Android, listen for `beforeinstallprompt`
  and show a non-intrusive install banner after the second app open.
- **CI gates** (already specified in *Domain Requirements*) cover FTC disclosure render and
  HOS RODS-grid heuristic. Add Lighthouse Performance + Accessibility thresholds to the same
  CI run.
- **Bundle splitting**: Parking module and HOS module load from the home shell on first use,
  not eagerly. Affiliate slot configs are a small JSON payload fetched at app boot and
  cached.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP approach: hybrid problem-solving + revenue MVP.** This product does not need to
choose between "validate the problem" and "validate revenue" — the brief locks both in
v1:

- **Problem validation** runs through Parking Lookup. Driver opens app, finds spot, the
  pain is solved or it isn't. Measured through D7/D30 retention and the <2% zero-result
  lookup rate.
- **Revenue validation** runs through TPC click-to-reservation conversion via SHAWN20.
  Affiliate revenue starts day one — there is no "build for a year, monetize later" phase.
  Measured through MRR plus the leading-indicator click-to-reservation rate.

Combined with HOS Tracker shipping at v1 for retention validation, the v1 release tests
**three independent theses simultaneously** (acquisition pain, monetization conversion,
retention habit) without splitting the dev budget across three releases.

**Resource requirements:**

- **Huffy** — full-time, the only developer. v1 budget = 4–6 weeks. v1.05 polish = 1 week.
- **Shawn** — founder, part-time on the project (full-time as a driver and content creator).
  Owns: brand voice, content distribution, affiliate deals, admin UI operation, launch video.
- **Sally** — UX designer, contracted for v1.05 UX pass (Mossy Oak palette + #FFEB00 token
  finalization, dark mode polish).
- **Pre-launch attorney** — $1–3K consult, transportation/tech specialty. Gate-blocking.
- **Insurance carrier** — tech E&O + product liability + cyber policies bound before v1
  ships. Gate-blocking; cost TBD pending Shawn-sourced quote.

### Must-Have Analysis (v1)

Each capability below is anchored to one or more journeys from the *User Journeys* section.
Anything that doesn't map to a journey is excluded.

**Parking (Journey 1, 2):**
- TPC API integration with SHAWN20 deep-link (Journey 1)
- Public-source fallback (state DOT + OSM) with normalization (Journey 2)
- Service-worker offline cache (Journey 1, 2)
- Direction-of-travel-aware result sort (Journey 1)
- Visually-distinct fallback treatment (Journey 2)
- Performance budget: <3s online, <1s cached (Journey 1)

**HOS (Journey 3 — pulled forward to v1):**
- Four duty-status toggles, plain-English (Journey 3)
- Real-time clock derived from manually-entered statuses (Journey 3)
- End-of-shift summary, tabular text only — no RODS-grid (Journey 3, Domain)
- First-launch tap-to-acknowledge with minimum dwell (Journey 3, Domain)
- Permanent footer disclaimer + 90-day re-acknowledge (Journey 3, Domain)
- 30-day client-side retention only (Journey 3, Domain)

**Cross-cutting (Journey 4, 5):**
- Magic-link email + Google Sign-In (Journey 4)
- Two-question onboarding (Journey 4)
- Stan Store deep-link UTM through magic-link auth (Journey 4)
- Day-1 vs cold-YouTube cohort tagging (Journey 4)
- Multi-vertical JSON affiliate slot engine (Journey 5, Innovation)
- Founder-operable admin UI for slot configs (Journey 5)
- FTC disclosure components, CI-gated (Journey 1, Domain)
- CCPA/CPRA Right-to-Know / Right-to-Delete flow (Domain)
- Settings/Profile screen (cross-cutting)
- Public privacy policy + affiliate disclosure policy at stable URLs (Domain)

### Nice-to-Have / Deferred

Already enumerated in *Product Scope → Growth Features (v1.5+)* and *Explicitly Out of
Scope*. The deferral reasons are recorded there. No new deferrals introduced at this step.

### Risk Mitigation Strategy

| Risk class | Top risk | Mitigation |
|---|---|---|
| Technical | Public-source fallback normalization is harder than expected (per-state DOT API quality varies wildly) | Allocate buffer in v1 budget; if normalization eats >5 days, reduce initial state coverage to top-10 trucking corridors and expand post-launch. Documented per-state limitations in onboarding so users have honest expectations. |
| Technical | iOS PWA service-worker eviction or Android battery-optimization breaks offline parking lookup | Audience device-mix survey (pre-launch gate) drives target prioritization. Known-limitations doc in onboarding. Network-first cache strategy degrades gracefully. |
| Technical | Lighthouse Performance ≥90 / Accessibility ≥95 CI gates fail late in v1 build | Build with budgets from day one (bundle-size limits, performance budgets in CI). Don't backload optimization. |
| Market | TPC partnership ends or restructures; sole monetization pillar collapses | Multi-vertical affiliate schema (Innovation thesis #1) means second affiliate wires in <3 days. Track TPC longevity as open question; pursue written commitment. |
| Market | Trucker Path ships reservable-spots feature, erodes funnel differentiator | No panic-respond. Brand-voice and creator-distribution are the moats, not the feature. Watch competitive shipping; do not enter a feature-parity arms race. |
| Market | Day-1 cohort (Stan Store buyers) doesn't retain better than cold YouTube — warm-cohort thesis fails | Cohort tagging produces correct attribution either way. Reallocate marketing effort. Cohort architecture is not user-feature load-bearing. |
| Resource | Huffy hits unexpected blocker (illness, urgent freelance work) | v1 calendar has 1–2 weeks of buffer between 4-week and 6-week ends. v1.05 can slide if v1 slides. v1.5+ has no fixed date. |
| Resource | Pre-launch attorney consult delayed | All gate items (insurance, LLC formalities, lawyer sign-off) are blocking. Build can be feature-complete and not ship. Shawn sources the attorney early — pre-launch gate. |
| Resource | Insurance binding takes longer than expected or cost exceeds budget | Cost is a Shawn-blocking item. If quotes are out of range, the launch slips, not the disclaimers. |
| Compliance | FMCSA / FTC / state AG inquiry pre-launch | Continuous accelerator triggers immediate lawyer review. All four pre-launch surfaces (HOS disclaimer, parking disclaimer, FTC, privacy) are reviewed before first install. |
| Compliance | HOS-related support ticket suggesting user reliance on the app for compliance | Continuous accelerator trigger. Disclaimer copy is canonical and verbatim. Support routing is documented. |

## Functional Requirements

This is the **capability contract** for v1. Anything not listed here will not exist in v1
unless added explicitly. Each FR is a testable capability stated implementation-agnostically.
UX (Sally) designs interactions for these; the architect (Winston) supports them; the dev
(Huffy) implements them; the story breakdown traces back to them.

Actors:
- **Driver** — any signed-in end user (covers OTR, owner-operator, and Stan Store cohorts)
- **Visitor** — unauthenticated user on the landing page or invited via deep link
- **Founder** — Shawn (and any future authorized operator) using the admin UI
- **System** — automated platform behavior

### Authentication & Onboarding

- **FR1:** Visitor can sign up using a magic-link sent to their email.
- **FR2:** Visitor can sign up using Google Sign-In.
- **FR3:** Driver can sign in to an existing account using either magic-link email or Google
  Sign-In, on any supported device.
- **FR4:** System rejects password-based authentication; no password field is offered or
  accepted anywhere in the app.
- **FR5:** Driver completes onboarding by answering at most two questions: trip type
  (OTR or local) and default starting state.
- **FR6:** Visitor on iOS Safari sees inline Add-to-Home-Screen instructions on the landing
  page when the app is not yet installed.
- **FR7:** Visitor on Android Chrome receives a non-intrusive PWA install prompt after their
  second engaged session.
- **FR8:** Driver lands on the parking home tile by default after completing onboarding.

### Parking Discovery

- **FR9:** Driver can request parking results ahead of their current direction of travel
  with a single tap from the home screen.
- **FR10:** System returns reservable TruckParkingClub spots prioritized over public-source
  results in any combined result list.
- **FR11:** System falls back to public-source results (state DOT rest areas + OpenStreetMap
  truck-stop POIs) when no reservable TPC inventory exists in the requested corridor.
- **FR12:** System visually distinguishes public-source results from reservable TPC results;
  public-source results carry a "not reservable, not guaranteed" label.
- **FR13:** Driver can view a parking detail view containing photos (when available),
  gate hours, lighting information, and any other TPC-supplied attributes.
- **FR14:** Driver can tap-through to complete a TPC reservation in a single click; the
  SHAWN20 affiliate code is pre-applied to the booking.
- **FR15:** System renders an FTC affiliate disclosure adjacent to every TPC reservation
  CTA in the parking flow.
- **FR16:** System returns last-known cached parking results when the device is offline or
  on degraded connectivity, and labels the result set with the cache timestamp.
- **FR17:** Driver can see a parking module disclaimer on every search-result set:
  "Parking availability shown is provided by third parties and is not guaranteed. Always
  have a backup plan. We are not responsible for parking conditions, security, or the
  accuracy of third-party listings."
- **FR18:** System telemeters the rate of zero-result lookups (no TPC and no fallback) for
  monitoring the disaster-scenario metric.

### HOS Tracker (Personal Logbook, Non-ELD)

- **FR19:** Driver, on first launch of the HOS module, must read and tap-to-acknowledge the
  full canonical HOS disclaimer before any HOS feature becomes reachable.
- **FR20:** System enforces a minimum dwell time on the first-launch disclaimer screen
  before the acknowledgment tap is enabled.
- **FR21:** Driver sees a permanent footer disclaimer on every HOS screen: "Personal record
  only. Not an ELD. Not FMCSA-compliant."
- **FR22:** Driver is re-prompted to acknowledge the HOS disclaimer every 90 days of active
  HOS use, and on any version bump whose changelog touches HOS.
- **FR23:** Driver can record a duty status from a fixed set of four options: Driving,
  On-Duty Not Driving, Sleeper, Off-Duty.
- **FR24:** Driver can attach an optional plain-text note to any duty-status entry.
- **FR25:** Driver can view a real-time clock showing remaining cycle hours and remaining
  shift hours, derived from manually-entered statuses and labeled as user-derived estimates.
- **FR26:** Driver can view an end-of-shift daily summary showing total drive hours, total
  on-duty hours, and remaining cycle clock as plain-English tabular text.
- **FR27:** System never renders any 24-cell horizontal grid or any visual element that
  mimics the duty-status grid of 49 CFR 395.32.
- **FR28:** System retains the driver's HOS entries on-device only for 30 days, then
  auto-prunes older entries.
- **FR29:** System never transmits HOS payloads to any server.
- **FR30:** System surfaces an in-app banner on next app open at the day-7 retention
  milestone inviting the driver to view their weekly summary.
- **FR31:** System ships no HOS export, PDF, or CSV feature in v1.

### Affiliate & Monetization Engine

- **FR32:** System loads affiliate slot configurations from a multi-vertical schema
  supporting at minimum the verticals: parking, fuel-card, load-board, insurance.
- **FR33:** System supports multiple affiliate slots concurrently across the app,
  configured independently.
- **FR34:** System renders an FTC affiliate disclosure adjacent to every affiliate CTA
  rendered anywhere in the app.
- **FR35:** System fails the build (CI gate) if any affiliate CTA component is rendered
  without the disclosure component as a sibling.
- **FR36:** System propagates affiliate-config changes to live clients within 15 minutes of
  an admin save.
- **FR37:** System tracks per-slot impression and click-through events for every affiliate
  slot.

### Stan Store Cross-Promotion

- **FR38:** System surfaces a Stan Store cross-promotion ("Carnivore in the Truck") to a
  driver after their fifth successful parking lookup, exactly once.
- **FR39:** System surfaces a Stan Store cross-promotion ("Driver's Mind") to a driver
  after they have logged ten cumulative HOS hours, exactly once.
- **FR40:** System surfaces a Stan Store cross-promotion ("Save Your CDL") when an HOS
  violation warning is triggered by the user's manually-entered statuses.
- **FR41:** Driver can access a "More from Shawn" panel from settings linking the YouTube
  channel and the full Stan Store catalog.
- **FR42:** System tags every Stan Store outbound link with UTM parameters that survive
  the magic-link auth roundtrip.

### Cohort & Attribution Tracking

- **FR43:** System tags every newly-signed-up driver with their acquisition cohort
  (Day-1 Stan-Store-buyer cohort vs. cold-YouTube cohort) at signup time.
- **FR44:** System persists each driver's cohort tag for the lifetime of the account.
- **FR45:** System exposes cohort data to analytics so retention and monetization metrics
  can be reported by cohort.
- **FR46:** System produces a verified-email export of installed users for the founder's
  owned-channel pipeline.

### Settings, Privacy & Account

- **FR47:** Driver can view their account email, OTR/local toggle, default starting state,
  and dark/light mode preference in a Settings screen.
- **FR48:** Driver can change their dark/light mode preference at any time; dark mode is
  the default at install.
- **FR49:** Driver can view a "Right to Know" data summary listing every category of data
  the app stores about them (account email, OAuth identity, HOS entries, saved parking
  searches, app usage analytics).
- **FR50:** Driver can initiate a "Right to Delete" account deletion that removes all
  server-side data within 30 days; deletion is irreversible and explicitly stated.
- **FR51:** Driver receives an email confirmation when their account deletion completes.
- **FR52:** Driver can opt out of analytics tracking from the Settings screen at any time.
- **FR53:** Visitor and driver can access the public privacy policy at a stable URL linked
  from the app footer.
- **FR54:** Visitor and driver can access the affiliate disclosure policy at a stable URL
  linked from the app footer.
- **FR55:** Driver can sign out from the Settings screen.

### Founder Admin & Operations

- **FR56:** Founder can sign in to a separate admin surface authenticated by founder-level
  credentials.
- **FR57:** Founder can view, enable, disable, and edit any affiliate slot configuration
  (vertical, banner image, CTA copy, discount code, UTM parameters) without a code change
  or developer involvement.
- **FR58:** Founder can view per-slot impression and click-through analytics over a
  selectable time window.
- **FR59:** Founder can configure each Stan Store cross-promotion trigger (which trigger
  fires, threshold, frequency).
- **FR60:** System restricts admin surface access to authenticated founder-level accounts;
  no driver-level account can access admin features.

### Cross-Cutting & Compliance

- **FR61:** System loads all canonical disclaimer strings (HOS, parking, FTC, future export
  watermark) from a single source-of-truth module; no string is duplicated or interpolated.
- **FR62:** System fails the build (CI gate) if the HOS bundle contains any component
  whose rendered output produces a 24-cell horizontal grid (RODS-grid heuristic).
- **FR63:** System fails the build (CI gate) if the Lighthouse Performance score falls
  below 90 on mobile simulated 4G.
- **FR64:** System fails the build (CI gate) if the Lighthouse Accessibility score falls
  below 95.
- **FR65:** System never persists user-keyed parking-lookup location history server-side.
- **FR66:** System uses only aggregate, non-user-keyed analytics; no third-party analytics
  with user-identifier-keyed default behavior is permitted.

## Non-Functional Requirements

NFRs specify quality attributes — *how well* the system performs the capabilities listed
above. Only categories that materially apply to this product are included. Internationalization
(English-only v1), enterprise-scale availability, and B2B integration NFRs are intentionally
omitted.

### Performance

- **NFR-P1:** Cold-open to first interactive paint completes in <2 seconds at the 75th
  percentile on simulated 4G connectivity.
- **NFR-P2:** Cold-open to first parking result rendered completes in <3 seconds online and
  <1 second from cached results, at the 80th percentile.
- **NFR-P3:** Magic-link authentication completes (from email click to signed-in app) in
  ≤30 seconds at the median, including email-delivery latency.
- **NFR-P4:** HOS status entry (open module → entry saved) completes in ≤5 user taps and
  ≤10 seconds total at the median.
- **NFR-P5:** Service worker cache hit rate is ≥90% for repeat-corridor parking lookups
  within a 48-hour window.
- **NFR-P6:** Initial JavaScript bundle size is ≤200KB gzipped; parking and HOS modules are
  lazy-loaded on first use.
- **NFR-P7:** Affiliate-config edits propagate to live clients within 15 minutes of the
  founder's save action at the 95th percentile.
- **NFR-P8:** Lighthouse Performance score is ≥90 on mobile simulated 4G; build fails below
  this threshold.

### Security

- **NFR-S1:** All API keys, OAuth secrets, and Supabase service-role credentials are stored
  in server-side environment configuration only and are never present in client bundles.
- **NFR-S2:** All client-server communication is encrypted in transit using TLS 1.2 or
  greater.
- **NFR-S3:** Magic-link tokens expire within 15 minutes of issuance and are single-use.
- **NFR-S4:** Founder admin authentication is strictly distinct from driver authentication;
  driver-level credentials cannot access admin surfaces under any circumstance.
- **NFR-S5:** Account deletion completes server-side within 30 days of user request and
  removes all account-associated data except records required by law to retain.
- **NFR-S6:** No third-party analytics or telemetry tool is loaded with user-identifier-keyed
  default tracking; only aggregate, anonymous tools (e.g., Plausible, anonymous PostHog
  mode) are permitted.
- **NFR-S7:** PWA service-worker cache for parking results does not share scope with HOS
  data; cache partitions are strictly enforced.
- **NFR-S8:** No HOS payload is ever transmitted to any server; HOS data is local-only.

### Scalability & Capacity

The 6-month aspirational target is 15,000 installs with ~5,250 WAU (35%). Capacity targets
below are sized for that ceiling with 3–5x headroom; this is a creator-distributed PWA, not
enterprise SaaS, and over-provisioning past this is not a v1 concern.

- **NFR-SC1:** System sustains ≥75,000 unique signed-in sessions per month without degraded
  response times (3x the 6-month aspirational ceiling).
- **NFR-SC2:** System sustains ≥30 parking lookups per second sustained, with 5x burst
  capacity, without degradation past NFR-P2 thresholds.
- **NFR-SC3:** TPC API rate-limit handling: when approaching the affiliate-portal rate
  limit, fallback to public-source results without user-visible failure.
- **NFR-SC4:** Affiliate-slot config storage handles ≥50 concurrent slots across all
  verticals without operational impact.
- **NFR-SC5:** When TPC is unavailable, the system continues to serve public-source results
  with no user-visible "service down" state.

### Accessibility

- **NFR-A1:** System meets WCAG 2.1 Level AA contrast ratios across all driver-facing
  surfaces (4.5:1 body text, 3:1 large text and UI components).
- **NFR-A2:** Lighthouse Accessibility score is ≥95; build fails below this threshold.
- **NFR-A3:** Every interactive control has a touch target of ≥48dp (Material) or ≥44pt
  (Apple HIG), whichever is larger on the platform.
- **NFR-A4:** All interactive elements are keyboard-focusable with visible focus indicators.
- **NFR-A5:** All meaningful images carry alt text appropriate to their content and context.
- **NFR-A6:** System respects `prefers-reduced-motion` user preference and disables
  non-essential animations when set.
- **NFR-A7:** All form fields have associated labels accessible to screen readers.
- **NFR-A8:** Mossy Oak palette and #FFEB00 CTA tokens are validated against WCAG 2.1 AA
  contrast requirements during the v1.05 UX pass; failing tokens are escalated, not shipped.

### Integration & Reliability

- **NFR-I1:** When TPC API is unavailable or rate-limited, system falls back to public-source
  results within the same parking lookup; the user does not see a failed-lookup state.
- **NFR-I2:** When a state DOT rest-area API is unavailable, system degrades gracefully to
  the remaining available sources for that lookup; the user is not shown an error toast.
- **NFR-I3:** OpenStreetMap truck-stop POI data is refreshed on a recurring schedule (at
  least weekly) and cached for resilience to upstream outages.
- **NFR-I4:** When the device is fully offline, system serves last-known cached parking
  results with the cache timestamp clearly displayed; the lookup does not block on network.
- **NFR-I5:** Stan Store deep-link UTM parameters survive the magic-link authentication
  roundtrip; attribution is not lost between landing-page click and signed-in state.
- **NFR-I6:** External integration failures are logged in aggregate (no user-keyed payloads)
  for monitoring without exposing PII.

### Compliance & Privacy (consolidated)

Detailed regulatory requirements live in the *Domain-Specific Requirements / Compliance &
Regulatory* section. The NFR-grade attestations:

- **NFR-C1:** Every screen rendering an affiliate CTA also renders the canonical FTC
  disclosure adjacent to the CTA; verified by CI on every release.
- **NFR-C2:** Every HOS screen displays the permanent footer disclaimer; verified at
  runtime and reviewed during the lawyer sign-off pass.
- **NFR-C3:** No HOS UI element produces a 24-cell horizontal grid (RODS-grid heuristic);
  verified by CI on every release.
- **NFR-C4:** CCPA/CPRA Right-to-Know and Right-to-Delete flows are reachable from the
  Settings screen at all times.
- **NFR-C5:** All canonical disclaimer strings (HOS full, HOS footer, parking, FTC) live in
  a single source-of-truth module and are imported by reference; no string is duplicated or
  interpolated.
