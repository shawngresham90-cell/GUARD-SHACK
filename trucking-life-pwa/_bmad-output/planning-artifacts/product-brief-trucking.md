---
title: "Product Brief: Trucking Life with Shawn"
status: "complete"
created: "2026-05-07"
updated: "2026-05-07"
inputs:
  - "Founder discovery session 2026-05-07 (Shawn Gresham, BMAD user_name: huffy)"
  - "Web research subagent — TruckParkingClub, FMCSA 2026 parking study, ATA driver shortage data, Trucker Path competitive read, Drivers Daily Log abandonment, ATRI Critical Issues 2023–2025"
  - "Review panel — skeptic, opportunity, regulatory & liability lenses (3 subagents 2026-05-07)"
next:
  - "bmad-create-prd (PM phase) — consume this brief and the distillate to draft the PRD"
---

# Product Brief: Trucking Life with Shawn

## Executive Summary

**Trucking Life with Shawn** is a Progressive Web App built for over-the-road truck drivers, distributed through a content brand that already owns their attention — Shawn Gresham's 84,000-subscriber YouTube channel and adjacent TikTok/Facebook audiences. Drivers lose roughly **$5,500 per year** and **56 minutes per day** chasing safe parking; the existing market leader (Trucker Path, 600K+ users) is widely criticized as bloated and ad-heavy, and the legacy paper-replacement logbook app (Drivers Daily Log) has been abandoned by its developer. There is a clear opening for a fast, trucker-voice app that solves these two specific pains without trying to be everything.

The MVP launches in two waves. **Parking Lookup** ships at soft launch (6–8 weeks) and monetizes immediately through the active TruckParkingClub affiliate partnership (code `SHAWN20`) — TPC is doubling its inventory in 2026 (4,000 → 10,000 properties), so commission ceiling grows directly into the launch window. **HOS Tracker** ships in v1.1 as a *personal-record manual logbook helper* — explicitly not an ELD, positioned as "your personal copy of your hours, in your pocket, in plain English" — for OTR drivers cross-checking fleet ELDs and owner-operators wanting clean digital records.

Why now: the FMCSA's federal truck-parking study just closed public comment on May 6, 2026, putting the parking crisis squarely in driver and industry discourse. Shawn's launch video — *"The feds just spent a year studying the truck parking crisis. Here's what they missed — and the app I'm building because of it."* — rides that moment.

## The Problem

Truck drivers solve two recurring problems badly, every day:

1. **Finding safe, legal parking before HOS runs out.** 98% of drivers report the search costs them time and money — ATA and OOIDA put it at ~56 minutes/day and ~$5,500/year in lost earnings (about a 12% pay cut). Existing tools are either bloated (Trucker Path), dated (Park My Truck), or fuel-led with parking as an afterthought (TruckSmarter).

2. **Keeping a personal record of duty status they actually trust.** Fleet ELDs are designed to please dispatchers and DOT, not drivers. Owner-operators and OTR drivers cross-checking their fleet's logs have no clean, modern, non-compliance tool — Drivers Daily Log, the legacy paper-replacement app, is effectively abandoned.

The status quo costs drivers money, time, and peace of mind. None of it is being solved by a builder who actually drives.

## The Solution

A driver-first PWA with two focused modules. **Acquisition** runs through Parking Lookup (the high-frequency, high-pain wedge that pulls drivers into the app); **retention** runs through HOS Tracker (the every-shift habit that brings them back daily). Two co-equal monetization pillars sit on top.

- **Parking Lookup** — fast search, satellite/list toggle that doesn't break flow, surfaces TruckParkingClub reservable spots with the SHAWN20 discount baked in. **Public-source fallback layer** (state DOT rest-area APIs + OSM truck-stop POIs) ensures the app always returns an answer when TPC inventory is thin in a corridor — no thin-corridor bounce-back to Trucker Path. **Offline-capable**: PWA service worker caches last-known results so the lookup works in rural connectivity gaps. No ads, no upsells in the parking flow itself.
- **HOS Tracker (v1.1)** — manual personal logbook with plain-English status entries, daily/weekly summaries, and aggressive disclaimers (see *Compliance & Regulatory Posture*). The retention engine: parking is episodic, HOS is daily.
- **Monetization Pillar 1 — Affiliate Engine.** Built generic from v1: a JSON-driven slot system where codes, banners, and CTAs swap without code changes. TPC is the first deal; fuel card and load board affiliates are pre-architected for v1.2.
- **Monetization Pillar 2 — Stan Store attach.** Existing paid info products (Save Your CDL, 17 Years Zero Violations, Carnivore in the Truck, Driver's Mind) — these already convert; the app is a new distribution channel for products with proven willingness-to-pay. Trigger-based placement, not screen-spam: Carnivore after 5 parking lookups; Driver's Mind at 10 logged hours; Save Your CDL on HOS violation warnings; "More from Shawn" panel in settings.
- **Owned-channel asset.** Magic-link email auth means every install is a verified email subscriber — an audience reachable independent of YouTube/TikTok/Meta algorithms. This is the long-term moat the Vision section depends on.

PWA-only — no app store, no 30% take, no review delays, instant updates. Magic-link email + Google Sign-In, no passwords.

## What Makes This Different

The differentiators compound into a flywheel: **authentic trucker voice → owned content distribution → engaged install base → affiliate density → ability to stay focused → reinforces voice**. Competitors can copy any one node. None can replicate the loop.

1. **Built by a trucker, for truckers.** Shawn has driven for 17 years with zero violations. The voice, priorities, and design choices come from someone who has lost the parking lottery at 9pm in Ohio. Trucker Path was built by tech, not trucking.
2. **Distribution moat that competitors can't buy.** 84K YouTube subscribers, plus TikTok and Facebook, give a cold-start solution most apps spend $50/install acquiring. The launch video alone reaches more drivers than most VC-backed trucking startups acquire in their first year.
3. **A *paying* audience, not just a free one.** Existing Stan Store buyers across four products (Save Your CDL, 17 Years Zero Violations, Carnivore in the Truck, Driver's Mind) prove willingness-to-pay that pure-content competitors can't claim. These buyers are the warm-launch cohort.
4. **Speed and focus over feature parity.** We will not match Trucker Path's data network. We will be faster, cleaner, single-purpose, and louder about the TruckParkingClub reservation funnel they don't have.
5. **A dead competitor in the HOS lane.** Drivers Daily Log's abandonment leaves a real gap for a personal-record logbook. We're not fighting Motive — we're filling space they refuse to occupy.

## Who This Serves

**Primary user — OTR truck drivers (Shawn's audience).** Mostly company drivers running long-haul, ages 28–55, predominantly male, blue-collar, high trust in peer-creators, low trust in enterprise vendors. Their day is shaped by parking decisions and HOS clocks. Aha moment: finding a reservable TPC spot 90 miles ahead at 6:42pm with one tap.

**Secondary user — owner-operators.** A smaller but more engaged segment that wants a clean digital personal logbook in addition to whatever ELD their truck has. Higher willingness to pay for a future paid tier; HOS Tracker advanced features (export, multi-truck, IFTA-style summaries) are the natural paid tier.

**Day-1 cohort — existing Stan Store buyers.** A pre-qualified, pre-trusting, pre-paying subset of the audience reachable directly via the Stan Store email list. Expected to convert at materially higher rates than cold YouTube traffic and to drive the bulk of soft-launch installs. Tracked as a separate cohort.

## Success Criteria

Targets are **aspirational** — the first 30 days post-launch establish the actual cohort baselines, against which 6-month commitments will be re-anchored.

| Metric | 90-day target | 6-month target |
|---|---|---|
| Installs (from YouTube/social) | 5,000 | 15,000 |
| Weekly Active Users (WAU) | 30% | 35% |
| D7 retention | 40% | 45% |
| D30 retention | 25% | 30% |
| YouTube view → install conversion | 3% in first 30 days | sustained 2%+ |
| Verified email captures (owned channel) | 4,000+ | 12,000+ |
| Stan Store click-through rate (per WAU/mo) | tracking | 8%+ |
| TruckParkingClub MRR | tracking | $2,000+ |
| Stan Store attributable MRR | tracking | $1,500+ |

**Leading indicators** (track from day one even where targets are TBD): TPC click-to-reservation conversion rate, Stan Store deep-link UTM attribution, and Day-1-cohort (Stan Store buyers) install/retention vs cold-YouTube cohort.

## Scope

**In — v1 Soft Launch (6–8 weeks):**
- Parking Lookup with TPC integration + SHAWN20 affiliate
- Public-source parking fallback (state DOT rest-area APIs + OSM truck-stop POIs)
- Offline parking lookup (PWA service worker + cached last-known results)
- Generic JSON-driven affiliate slot engine (TPC wired; multi-vertical schema ready for fuel/load-board/insurance)
- Magic-link email + Google Sign-In
- FTC affiliate disclosure components (in-app and copy)
- HOS-disclaimer scaffolding shipped (used by v1.1)
- Privacy policy + CCPA/CPRA consumer-rights flow at a stable URL

**In — v1.05 (Monday after soft launch):**
- Stan Store cross-promo trigger system (Carnivore / Driver's Mind / Save Your CDL / "More from Shawn")
- Brand polish + Sally's full UX design pass (Mossy Oak accent + #FFEB00 yellow CTAs, dark mode, masculine/blue-collar)

**In — v1.1:**
- HOS Tracker manual logbook helper (gated on Pre-Launch Gates being met — see below)

**Out — explicitly:**
- ELD certification or any FMCSA compliance claim
- Native iOS/Android apps
- Apple Sign-In (PWA exempt; revisit if/when native iOS ships)
- Password authentication
- Fuel discounts, route optimization, weight tickets, maintenance log (v1.2+)
- Custom affiliate ad creative — generic banner system only
- ELD-grade RODS UI, hardware tethering, telematics integration

## Pre-Launch Gates

These are hard gates, not nice-to-haves. Soft launch (Parking) and HOS v1.1 launch each have their own gate set.

**Before v1 soft launch (Parking-only) — Founder/business hygiene:**
- ☐ **Audience device-mix survey** posted to YouTube/TikTok/Facebook ("What phone do you use in the truck — iPhone or Android?"). Cost: 5 min. Validates PWA viability and surfaces iOS-PWA / Android battery-optimization risk before Betty starts work.
- ☐ **Pre-launch transportation/tech-attorney consult** ($1–3K) reviewing: HOS disclaimer copy, parking module disclaimer, FTC affiliate disclosure language (in-app + YouTube + Stan Store), privacy policy.
- ☐ **LLC affiliate-revenue routing confirmed**: SHAWN20 commissions paid to LLC bank account, not personal. Veil-piercing hygiene.
- ☐ **YouTube launch-video FTC disclosure locked**: written into description AND verbal callout in the video itself, plus pinned comment.
- ☐ **In-app FTC disclosure rendered on every screen with an affiliate link** ("Trucking Life with Shawn earns a commission when you book through this link. Your discount is not affected.").

**Before v1.1 HOS Tracker launch — full liability stance:**
- ☐ **Tech E&O + product liability + cyber insurance bound** for the LLC.
- ☐ **LLC formalities verified**: capitalization, bank separation, no commingling, observed governance.
- ☐ **Lawyer-reviewed final HOS disclaimer copy** (the pre-launch consult covered draft language; v1.1 needs a sign-off pass on shipped UX).
- ☐ **HOS UI guardrails verified in build**: no RODS-grid graph (49 CFR 395.32), every export/screenshot watermarked "NOT AN ELD — NOT FMCSA COMPLIANT", first-launch tap-to-acknowledge, permanent footer disclaimer, 90-day re-acknowledgment prompt.

**Continuous accelerator events** (any of these triggers immediate lawyer review regardless of user count):
any subpoena or legal letter, any paid feature shipping, any media coverage outside Shawn's owned channels, any partnership beyond TPC affiliate, any HOS-related support ticket suggesting user reliance, crossing 500 active HOS users.

## Compliance & Regulatory Posture

Four regulatory surfaces matter: **HOS positioning**, **affiliate disclosure**, **data privacy**, and **founder/LLC hygiene**. All four are scope items with hard gates (see *Pre-Launch Gates*).

**HOS Tracker (v1.1) — not an ELD, designed not to be mistaken for one:**
- First-launch mandatory tap-to-acknowledge disclaimer
- Permanent footer disclaimer on every HOS screen
- EULA and marketing copy use the exact phrase "Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof of duty status."
- UI guardrails to prevent ELD-confusion: no RODS-grid graph that mirrors 49 CFR 395.32; every export/screenshot watermarked "NOT AN ELD — NOT FMCSA COMPLIANT"
- Re-acknowledge prompt every 90 days of active HOS use and on any version bump touching HOS
- HOS launch is **gated on insurance binding (tech E&O + product liability + cyber), LLC formalities verification, and lawyer-reviewed final disclaimer copy**.

**Parking module disclaimer:** "Parking availability shown is provided by third parties and is not guaranteed. Always have a backup plan. We are not responsible for parking conditions, security, or the accuracy of third-party listings."

**FTC affiliate disclosure (16 CFR Part 255):** clear-and-conspicuous disclosure adjacent to every TPC CTA in-app ("Trucking Life with Shawn earns a commission when you book through this link. Your discount is not affected."), verbal + on-screen + pinned-comment disclosure on YouTube launch and recurring videos, parallel disclosure on Stan Store cross-promo. A written affiliate-disclosure policy ships with v1.

**Data privacy posture:** parking lookups handled with no server-side persistent log of user-keyed location history; HOS entries retained 30 days client-side, exportable on demand. Public privacy policy at a stable URL before first install. CCPA/CPRA-compliant consumer-rights flow (Right-to-Know, Right-to-Delete) live at launch — not deferred.

**Pre-launch legal consult is a hard gate** ($1–3K with a transportation/tech attorney) covering: HOS disclaimer copy, parking module disclaimer, FTC disclosure language across in-app + YouTube + Stan Store surfaces, and privacy policy. Founder accepts residual legal risk for v1 *after* this consult — disclaimers alone don't bind insurance, but they buy a defensible posture for the parking-only soft launch.

## Vision

If this works, it becomes the default app every Trucking Life with Shawn viewer downloads — a creator-owned trucker platform that expands well past parking and HOS. The 2–3 year picture: fuel discount routing, weight ticket archiving, maintenance log, route planning, and a multi-affiliate revenue engine generating recurring income that's independent of YouTube algorithm risk. The end state isn't "an app." It's the digital arm of Trucking Life with Shawn — the same trust that built 84K subs, ported into the tools drivers use every shift.
