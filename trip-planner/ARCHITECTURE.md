# GPS Trip Planner — Technical Architecture & Build Plan (Phase 1)

**Status:** PLANNING ONLY — no production code in this document or this phase.
**Product:** Truck-specific GPS trip planner for Trucking Life with Shawn.
**Audience:** CDL drivers (company + owner-operator), dispatchers.

This plan is grounded in an audit of the assets that already exist across the
Trucking Life properties (verified 2026-07-17):

| Existing asset | Where | State (audited) |
|---|---|---|
| Interstate Truck Stop Directory (static) | `truckstops/` in this repo | ~2,608 locations organized by state → interstate → mile marker. **No lat/lng coordinates.** Types: truck_stop, rest_area, service_plaza, weigh_station, wash, hotel, repair |
| Truckin' Life Directory site | `truckinlife/` in this repo | Branded shell over the same data |
| Platform directory (DB) | `tlws-platform` Supabase `locations` table | 1,252 active rows (378 truck stops, 257 repair, 167 parking, 59 scales, 27 CDL schools, 364 other). **Only 45 rows geocoded** (lat/lng). Has PostGIS, `tpc_url` + `affiliate_code` fields, sponsors tables |
| Knowledge Center | `tlws-platform` (live) | 42 published articles incl. a complete Hours-of-Service cluster (11-hr, 14-hr, 30-min break, split sleeper, personal conveyance, yard move — real slugs listed in §6) |
| Practice tests | `tlws-platform` (live) | 6 published CDL tests incl. Air Brakes, Combination, Doubles & Triples |
| Truck Parking Club affiliate | `locations.tpc_url`, SHAWN20 promo | Live monetization channel |

Two findings from that audit shape everything below:

1. **The #1 data-readiness gap is geocoding.** Neither directory source has
   usable coordinates at scale (0% of the static set, ~3.6% of the DB set).
   Corridor matching ("show truck stops along my route") is impossible until
   this is fixed, so a geocoding backfill is a hard prerequisite (Phase 2a).
2. **The mile-marker organization is an asset, not a liability.** Because the
   static directory is keyed by interstate + mile marker, once each interstate
   has a geometry reference, every stop can be *interpolated* onto it — far
   cheaper than geocoding 2,608 street addresses one by one.

---

## 1. Product scope

### 1.1 Trip inputs
- Pickup location (address, city/state, or saved location)
- Delivery location
- Unlimited intermediate stops (multi-stop routing with optional stop reorder)
- Truck profile: length, height, width, gross weight, axle count, trailer type
- Hazmat class (activates hazmat-legal routing + tunnel restrictions)
- Departure time (drives HOS simulation + weather forecast windows)
- Driver clock state at departure: hours already used on the 11/14/70, time
  since last 30-min break, sleeper-berth pairing state

### 1.2 Planner outputs
- Truck-safe route (respects height/weight/hazmat restrictions) with polyline map
- Estimated drive time and total trip time (drive + mandated rest + planned stops)
- Day-by-day itinerary segmented by HOS: where the driver runs out of clock,
  where to take the 30-minute break, overnight parking targets
- Fuel plan: recommended fuel stops from the directory based on tank range
- Along-route POIs from the directory: truck stops, parking, rest areas,
  scales, repair, hotels, CDL schools, restaurants/services
- Weather bands and active NWS alerts along the corridor, time-aligned to when
  the driver passes through
- Trip cost estimate: fuel, tolls (provider-dependent), parking, per-diem
- Mileage total, per-leg and per-state (per-state = IFTA groundwork, Phase 4)

### 1.3 Explicit non-goals (this product, all phases)
- Not an ELD and not a RODS record. The planner **simulates** HOS for planning;
  it never claims to be the legal log. Every HOS screen carries a disclaimer
  and a link to the relevant Knowledge Center article (§6).
- No turn-by-turn navigation in Phases 1–3 (voice nav is a Phase 5 hook, §7.4).
- No invented data: fuel prices come from a live source or are user-entered;
  no hardcoded price tables.

---

## 2. System architecture

### 2.1 Shape: hexagonal core + adapters

All domain logic lives in a **pure, dependency-free engine** (no DOM, no
fetch, no framework imports). Everything external — routing provider, weather,
fuel prices, the two directory sources, storage — sits behind an adapter
interface. This single decision buys every architecture requirement at once:

- **Modular:** each engine module is independently testable and replaceable.
- **API-ready:** the same engine runs server-side (Supabase Edge Function /
  any Node runtime) exposing REST endpoints, because it has zero browser deps.
- **Mobile-ready:** the web client is a PWA (repo convention); the engine can
  later be wrapped by Capacitor or React Native without a rewrite.
- **Voice-nav / membership / social / marketplace ready:** all are additional
  adapters or consumers of the same engine + API surface (§7).

```
┌─────────────────────────────────────────────────────────────┐
│                       UI SHELL (PWA)                        │
│   TripForm · MapView · ItineraryTimeline · HosRibbon        │
│   StopCards · CostPanel · WeatherStrip · KcLinkChips        │
└──────────────────────────┬──────────────────────────────────┘
                           │ engine API (plain TS calls now,
                           │ HTTP later — same contracts)
┌──────────────────────────┴──────────────────────────────────┐
│                     CORE ENGINE (pure TS)                   │
│  TripPlanner (orchestrator)                                 │
│   ├─ RouteEngine        route legs, ETAs, per-state miles   │
│   ├─ HosEngine          49 CFR 395 clock simulation (§5)    │
│   ├─ StopPlanner        fuel/rest/park insertion (§4.3)     │
│   ├─ CostEngine         fuel, tolls, parking, per-diem      │
│   └─ CorridorMatcher    POI ↔ route-buffer matching         │
└──────┬─────────┬─────────┬──────────┬──────────┬────────────┘
       │         │         │          │          │  (adapter ports)
  RoutingPort WeatherPort FuelPricePort DirectoryPort StoragePort
       │         │         │          │          │
   HERE v8    NWS api.   EIA weekly  A) static  localStorage
   (primary)  weather.gov diesel API    truckstops/ (logged-out)
   ORS/HGV    (free,US)  (free,      B) tlws       Supabase
   (fallback)            regional)      locations   (logged-in)
```

### 2.2 Where it lives (DECISION REQUIRED at approval)

Two viable homes; the plan works for either, but the recommendation is A:

- **Option A (recommended): new `trip-planner/` app in this repo (GUARD-SHACK)**
  following the repo's established pattern (self-contained static app per
  folder, PWA, localStorage-first, own Netlify deploy). Integrates with the
  platform DB read-only via the Supabase anon key + RLS (the same pattern
  `truckstops/` already uses for TPC paid-parking rows). Zero risk to the
  production platform; fastest to MVP; matches every other app here.
- **Option B: module inside `tlws-platform`** (React/Vite). Native access to
  `locations`, auth, membership, and the Knowledge Center. Rejected for MVP
  because that repo is deliberately out of this session's scope and carries
  production CI/review overhead; revisit at Phase 4 (membership integration)
  — the hexagonal engine ports over unchanged.

### 2.3 Client storage & sync
- Logged-out (MVP): trips persist in localStorage (repo convention).
- Logged-in (Phase 4): trips sync to the platform DB (§8 schema) keyed to the
  platform's existing auth; localStorage becomes the offline cache.

---

## 3. External providers (evaluated, none integrated yet)

| Concern | Primary | Why | Fallback / notes |
|---|---|---|---|
| Truck routing | **HERE Routing API v8, `transportMode=truck`** | True commercial-vehicle profile: height/weight/length/axle params, hazmat (`shippedHazardousGoods`), tunnel categories, avoidances; toll data on the same call; generous free tier | OpenRouteService HGV profile (free/self-hostable, weaker restriction data) — keep RoutingPort provider-agnostic so PC*MILER (industry standard, $$$) can slot in later for enterprise users |
| Geocoding | HERE Geocoding (same account) | One vendor, one key, one bill for MVP | US Census Geocoder (free, batch, US-only) for the directory backfill; Nominatim under its usage policy for dev |
| Weather | **NWS `api.weather.gov`** | Free, no key, US-only (fine — routes are US), gridpoint forecasts + active alerts by point | OpenWeather if Canada/Mexico lanes ever matter |
| Fuel prices | **EIA open-data API** (weekly regional diesel averages, free, official) | Honest cost estimates without inventing numbers; label as "regional average" | Station-level pricing (OPIS/GasBuddy) is commercial — Phase 4+ decision, or user-entered price override (always available) |
| Tolls | HERE toll data on the routing response | No second vendor | TollGuru if per-axle precision proves insufficient |

**Cost picture (verify current published pricing before Phase 2 kickoff; do
not treat as quotes):** HERE's free tier has historically covered ~250k
transactions/month — far beyond MVP traffic; NWS and EIA are free federal
APIs; Census geocoder is free. Expected out-of-pocket for MVP API usage: **$0
until traffic scales**, then HERE pay-as-you-go. The real Phase 2 costs are
build effort and the geocoding backfill run.

---

## 4. Directory integration

### 4.1 One port, two sources
`DirectoryPort.findAlongRoute(polyline, bufferMiles, types[])` and
`.findNear(lat, lng, radius, types[])`, backed by:

- **Adapter A — static directory** (`truckstops/data.js`, ~2,608 locations):
  richest coverage of truck stops / rest areas / scales / washes / hotels /
  repair, organized by interstate + mile marker.
- **Adapter B — platform DB** (`locations` via anon-key REST, RLS-guarded):
  parking (incl. TPC paid spots with affiliate URLs), repair, CDL schools,
  restaurants/services (`other`), sponsor flags, verified/featured metadata.

Results are merged and deduped (same type within ~0.5 mi and fuzzy
name-match ⇒ one card, DB row wins because it carries monetization fields).

### 4.2 The geocoding backfill (Phase 2a — prerequisite)
1. Build `interstate-geometry.json`: polyline + milepost calibration per
   interstate per state (source: public route shapefiles; one-time build
   script extending `truckstops/build-data.py`).
2. Interpolate every static-directory stop onto its interstate at its mile
   marker ⇒ lat/lng for ~all 2,608 rows at near-zero cost, accuracy ±1–2 mi
   (sufficient for corridor matching; flagged `approx: true`).
3. Batch-geocode the 1,207 ungeocoded DB rows (street addresses exist) via
   the Census batch geocoder; write back `lat`/`lng`. **Additive update only;
   no schema change; run with owner approval.**
4. `CorridorMatcher` then works uniformly: decode route polyline → build
   buffer (default 3 mi, user-adjustable) → spatial match → order POIs by
   route-distance from origin.

### 4.3 StopPlanner (how POIs become a plan)
Walk the route timeline; at each *need event*, query the directory:
- **Fuel need** at `tank_range × safety_factor` (default 0.75) → nearest
  truck stops ahead, preferring user's fuel brands (`fuel_brands` field).
- **30-min break need** at 8h cumulative driving (§5) → any POI ahead with
  parking within the window.
- **End-of-clock need** (11 or 14 exhausted) → overnight parking: truck stops
  with `parking_spaces`, `overnight_parking` rows, rest areas; TPC paid spots
  surfaced with reserve links when free options are thin.
- **User-declared needs**: scales before a known chicken coop, repair, hotel
  nights, CDL-school visit, food preferences.

---

## 5. HOS engine (49 CFR Part 395 — property-carrying rules)

Deterministic simulation over a list of duty-status events. Pure functions:
`simulate(clockState, plannedLegs) → {timeline, violations[], needEvents[]}`.

Rules implemented (citations are the engine's test-case sources):

| Rule | Spec | Engine behavior |
|---|---|---|
| 11-hour driving | §395.3(a)(3)(i) | Max 11h driving since coming on duty after ≥10h consecutive off |
| 14-hour window | §395.3(a)(2) | Driving prohibited beyond the 14th consecutive hour after coming on duty; breaks do **not** pause it (except qualifying sleeper periods below) |
| 10-hour reset | §395.3(a)(1) | ≥10 consecutive hours off duty / sleeper resets 11 & 14 |
| 30-minute break | §395.3(a)(3)(ii) | Required after 8 **cumulative** driving hours without ≥30 min interruption; satisfied by any ≥30 min non-driving status (on-duty, off, sleeper) per the 2020 final rule |
| 60/70-hour | §395.3(b) | Rolling 7/8-day on-duty cap; carrier setting chooses 60/7 or 70/8 |
| 34-hour restart | §395.3(c) | ≥34 consecutive hours off resets the 60/70 |
| **Split sleeper** | §395.1(g)(1) | Qualifying pair: one period ≥7h sleeper + one ≥2h off/sleeper, totaling ≥10h. Neither qualifying period counts against the 14-h window; clocks recalculate from the end of the *first* qualifying period. Engine evaluates both 7/3 and 8/2 splits and proposes the one that yields the earliest legal arrival |
| Personal conveyance | §395.8 status + FMCSA guidance | Off-duty movement; excluded from driving clocks. Planner marks candidate PC moves (e.g., short reposition to safe parking after shutdown) as *advisory only* with prominent guidance link — never auto-asserted as legal |
| Yard move | ELD special category | On-duty-not-driving movement; counts against 14/70, not 11. Modeled at user-marked yard stops |

**Split-sleeper planning is the differentiator.** Given legs + departure
clock state, the engine compares: straight 10-hour breaks vs. 8/2 vs. 7/3
placements, and surfaces the plan that arrives earliest *and* the plan with
the most schedule slack — with the math shown, and each shown rule linking to
its Knowledge Center article (§6).

**Liability guardrails:** every HOS output is labeled "planning estimate — not
a record of duty status"; simulation assumes the driver's inputs are accurate;
the platform's existing RODS/disclaimer CI conventions apply when this code
ever moves into `tlws-platform`.

---

## 6. Knowledge Center integration

Planner UI events deep-link to the **already-published** HOS cluster
(verified live 2026-07-17):

| Planner moment | Linked article slug |
|---|---|
| 11-h limit hit in timeline | `11-hour-driving-limit` |
| 14-h window shown/exhausted | `14-hour-driving-window` |
| 30-min break inserted | `30-minute-break-rule` |
| Split proposed | `split-sleeper-berth-rules` |
| PC advisory shown | `personal-conveyance` |
| Yard-move stop marked | `yard-move` |
| HOS summary panel | `hours-of-service-basics`, `cdl-hours-of-service-rules` |
| Scale-house POI card | `what-is-a-dot-inspection`, `dot-inspection-levels-compared`, `cvsa-out-of-service-criteria` |
| Weigh-station DataQ note | `dataqs-disputes` |

Link format: plain `https://truckinglifewithshawn.com/knowledge/<category>/<slug>`
URLs (no platform code dependency). A small `kc-links.json` map ships with the
app so slugs are maintained in one file.

CTAs (repo-standard placements, one per surface): Academy, CDL Pre-School,
Practice Tests hub (e.g., a scale-house card cross-sells the Air Brakes /
Combination tests), Newsletter signup on the itinerary share/print view.

---

## 7. Future-proofing hooks (explicitly designed, not built)

1. **API productization:** engine deploys behind REST endpoints (§9) — the
   same contracts the UI uses. A future public/partner API is a keys+quotas
   layer on top, not a rewrite.
2. **Membership:** `trips` schema carries nullable `user_id` from day one;
   premium gates (saved trips > N, split-optimizer, per-state mileage export)
   are feature flags in one config.
3. **Social:** `trips.share_token` + read-only itinerary view enables "share
   my trip plan" links; future co-driver/convoy features build on the same
   share model.
4. **Voice navigation:** RouteEngine keeps full maneuver lists from the
   routing provider (unused by MVP UI); a future nav shell consumes stored
   maneuvers + TTS. No engine change required.
5. **Marketplace:** every POI card already carries `source`, `sponsor`, and
   affiliate fields — paid placement, reservations (TPC today, others later),
   and repair-booking referrals slot into existing card slots.

---

## 8. Database schema (PLANNING SKETCH — not a migration; nothing applied)

Additive, all-new tables; zero changes to existing tables. Applied only in
Phase 4 (sync/membership); MVP runs entirely on localStorage with the same
shapes.

```sql
-- trips: one saved plan
trips (
  id uuid pk, user_id uuid null,          -- null = anonymous/local-only
  title text, origin jsonb, destination jsonb,
  truck_profile jsonb,                     -- dims, weight, axles, hazmat class
  clock_state jsonb,                       -- HOS state at departure
  depart_at timestamptz, settings jsonb,   -- buffer miles, fuel prefs, etc.
  share_token text unique null,
  created_at, updated_at
)
trip_stops (
  id uuid pk, trip_id fk, seq int,
  kind text,          -- pickup|delivery|fuel|break|rest|park|scale|custom
  location jsonb,     -- lat/lng + label
  directory_ref jsonb null,   -- {source:'static'|'db', id}, keeps POI linkage
  planned_arrive timestamptz, planned_depart timestamptz, notes text
)
trip_legs (
  id uuid pk, trip_id fk, seq int,
  from_stop fk, to_stop fk,
  distance_m int, drive_secs int, polyline text,
  per_state_miles jsonb,      -- IFTA groundwork
  toll_cost_cents int null, weather_summary jsonb null
)
trip_hos_events (
  id uuid pk, trip_id fk, seq int,
  status text,        -- driving|on_duty|off_duty|sleeper|pc|yard
  starts_at, ends_at, rule_notes jsonb   -- which clocks moved, links shown
)
route_cache (
  key text pk,        -- hash(origin,dest,waypoints,truck_profile,provider)
  response jsonb, provider text, fetched_at, expires_at
)
```

RLS plan: owner-only read/write on `trips*` by `user_id`; `share_token` grants
public read of a redacted view; `route_cache` service-role only.

---

## 9. API surface (contracts the engine exposes; MVP calls them in-process)

```
POST /api/plan            {origin, destination, waypoints[], truckProfile,
                           clockState, departAt, settings}
                        → {tripId, legs[], stops[], hosTimeline[], costs,
                           weather[], warnings[], kcLinks[]}
POST /api/hos/simulate    {clockState, legs[]} → {timeline, violations, needs}
GET  /api/corridor-pois   ?polyline&buffer&types → ordered POI list (merged)
GET  /api/weather         ?polyline&departAt → time-aligned bands + alerts
GET  /api/trips/:id | share/:token           (Phase 4, auth/RLS)
```

Errors are structured (`{code, message, providerDetail?}`); provider outages
degrade gracefully (route without weather; POIs without fuel prices; etc.).

---

## 10. UI wireframe plan (mobile-first PWA)

**Screen 1 — Plan a Trip:** stacked form (pickup → stops (+ add) → delivery),
truck-profile accordion (persisted per user), hazmat toggle, departure
date/time, "my clocks right now" mini-form with sensible defaults (fresh
10-hr reset). Primary CTA: *Plan my trip*.

**Screen 2 — Trip Overview:**
```
┌────────────────────────────────────┐
│ MAP (route + POI pins, weather ▲)  │
├────────────────────────────────────┤
│ 1,124 mi · 2 days · est $612       │
│ HOS RIBBON ▓▓▓▓▓░░ 11h ▓▓▓▓▓▓░ 14h │
├────────────────────────────────────┤
│ Day 1  ▸ drive 6h → ☕ 30-min break │
│        ▸ drive 4.5h → 🅿 overnight  │
│          Love's #291, 82 spots  [KC]│
│ Day 2  ▸ ...                        │
├────────────────────────────────────┤
│ [Stops] [Fuel] [Weather] [Costs]   │  ← tab strip
└────────────────────────────────────┘
```
Timeline rows expand into POI cards (call, site, reserve-parking affiliate
link, "why here" HOS note + KC chip). Toggling a split-sleeper proposal
re-renders the ribbon and itinerary live.

**Screen 3 — Stop picker:** map/list of directory options near a need-event,
filter chips by type/brand/amenity; swap into plan.

**Screen 4 — Cost panel:** fuel (gal × regional EIA price, price overridable),
tolls (if provider returns), parking, per-diem; per-state mileage table.

**Screen 5 — Share/print itinerary:** clean one-column day-by-day sheet,
newsletter CTA, share link (Phase 4 token).

Accessibility: all POI/HOS color coding paired with icons + text; ribbon
readable at 320 px; every interactive card keyboard-reachable.

---

## 11. Component map

```
trip-planner/
  index.html            app shell (PWA, repo conventions)
  engine/               PURE — no DOM/fetch
    tripPlanner.ts      orchestrator
    routeEngine.ts      legs/ETA/per-state miles
    hosEngine.ts        §5 rules + split optimizer
    stopPlanner.ts      need-events → POI selection
    costEngine.ts       fuel/tolls/parking/per-diem
    corridorMatcher.ts  polyline buffer + ordering
    types.ts            all contracts (§9 shapes)
  adapters/
    routing/here.ts     RoutingPort impl (+ ors.ts fallback)
    weather/nws.ts
    fuel/eia.ts
    directory/static.ts directory/platformDb.ts  merge.ts
    storage/local.ts    (Phase 4: storage/supabase.ts)
  ui/
    TripForm, MapView, HosRibbon, ItineraryTimeline,
    StopCard, StopPicker, CostPanel, WeatherStrip,
    KcLinkChip, CtaBlock, ShareSheet
  data/
    kc-links.json       slug map (§6)
    interstate-geometry.json   (built in Phase 2a)
  tests/
    hosEngine.spec.ts   every §5 rule + FMCSA example scenarios
    stopPlanner.spec.ts corridorMatcher.spec.ts costEngine.spec.ts
```

---

## 12. Build phases

| Phase | Contents | Exit criteria |
|---|---|---|
| **1 (this)** | Architecture, schema, wireframes, provider selection, cost model | Owner approval of this document |
| **2a** | Data readiness: interstate geometry build, mile-marker interpolation, Census batch geocode of DB rows (additive writes, owner-approved) | ≥95% of directory rows have coordinates; spot-check sample verified |
| **2b (MVP)** | Engine core + HERE adapter: single+multi-stop truck route, ETA, corridor POIs, basic HOS (11/14/30/10-reset), fuel plan, cost panel, localStorage persistence, PWA shell | Real lane demos (e.g. ATL→Chicago w/ 2 stops) hand-checked; HOS unit suite green; mobile walkthrough |
| **3** | Split-sleeper optimizer, 60/70 + restart, PC/yard advisories, NWS weather bands + alerts, per-state mileage, share/print view, KC links + CTAs, SEO pages (§14) | Split scenarios validated against FMCSA guidance examples; Lighthouse mobile ≥90 |
| **4** | Platform sync: schema (§8) as a reviewed migration in the platform repo, auth, saved trips, membership gates, TPC reserve flow in cards | Green CI in platform repo; RLS review; draft PR + approval (platform-repo scope decision revisited here) |
| **5** | Hooks activation as separate scoped milestones: voice nav shell, social share+, marketplace placements | Each scoped separately |

Effort scale (order-of-magnitude, for planning): 2a is a few focused days
(scripts + verification); 2b is the largest chunk (engine + UI); 3 ≈ 60% of
2b; 4 depends on platform-repo review standards.

---

## 13. Monetization opportunities (all additive, none block MVP)

1. **TPC paid parking (live today):** overnight-parking cards deep-link
   `tpc_url` + `affiliate_code`/SHAWN20 — the planner *creates* the exact
   moment of parking intent. Highest-leverage, zero new partnerships.
2. **Sponsored POI placement:** `directory_sponsors` infrastructure already
   exists; "Featured" slot in stop-picker results, clearly labeled.
3. **Fuel-card referrals:** fuel-plan panel is the natural surface.
4. **Membership premium (Phase 4):** saved trips, split optimizer, per-state
   mileage/IFTA export, price alerts.
5. **Repair/hotel referrals:** need-event cards for breakdowns and hotel
   nights; CDL-school leads for the Pre-School funnel.
6. **Store cross-sell:** trip-planning digital products (`store/` already
   sells a trip-planning pack) and gear at contextual moments.

## 14. SEO opportunities

- **Tool pages (linkable assets):** `/trip-planner/` itself, plus standalone
  calculators that reuse engine modules: HOS clock calculator, split-sleeper
  calculator, truck mileage/cost calculator — each a KC-linked landing page.
- **Programmatic corridor pages (Phase 3):** "Truck stops on I-75 in
  Georgia"-style pages already implied by the directory's structure; planner
  adds "plan this corridor" CTAs. Canonicalize against the existing directory
  pages to avoid cannibalization.
- **Lane pages:** top freight lanes ("Atlanta to Chicago truck route: tolls,
  parking, HOS plan") generated from real planner output, hand-curated first.
- All pages: unique metadata, Breadcrumb + FAQ schema (matching KC standards),
  internal links into the HOS cluster and Practice Tests.

## 15. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Geocoding accuracy (interpolated ±1–2 mi) | Flag `approx`; buffer default 3 mi; DB rows (street-geocoded) win on merge |
| HOS correctness/liability | Pure engine + exhaustive unit tests sourced from FMCSA examples; "not a RODS" labeling everywhere; PC always advisory |
| Provider pricing drift | RoutingPort abstraction; route_cache; re-verify pricing at each phase gate |
| Truck-restriction data gaps (any provider) | Surface provider attribution + "verify posted restrictions" note; user-reported corrections loop via existing directory submission flow |
| Scope creep into platform repo | Phase 4 gate explicitly re-opens that decision; Phases 2–3 touch only this repo |

---

## 16. Decisions requested at approval

1. **Home repo:** Option A (`trip-planner/` here) — recommended — or Option B
   (platform repo, revisit scope rules). §2.2
2. **Routing provider:** HERE v8 primary (recommended) vs. ORS-first (free but
   weaker restrictions). §3
3. **Geocoding backfill approval:** additive `lat`/`lng` writes to the 1,207
   ungeocoded platform `locations` rows in Phase 2a. §4.2
4. **MVP HOS scope:** confirm 11/14/30/10-reset in MVP with splits in Phase 3
   (recommended), or pull splits into MVP.

**STOP:** Per milestone instructions, no production code follows until this
architecture is approved.
