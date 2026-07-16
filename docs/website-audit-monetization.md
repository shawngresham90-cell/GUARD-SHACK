# GUARD-SHACK — Website Audit & Monetization Report

_Repository: `shawngresham90-cell/GUARD-SHACK` ("WORK FLOW") · Branch: `claude/website-audit-monetization-406uje` · Audit: read-only, no site code changed_

This is a portfolio-wide audit of every web property in this monorepo, focused on
**where money is already being made, where it is built but switched off, and where the
best new revenue is.** Every claim below is grounded in the actual files and cites
`file:line` where it matters. No prices, tags, keys, or IDs were invented — anything
absent is called out as absent.

---

## 0. Executive summary — the five things that matter

1. **Affiliate revenue is wired up but earning $0.** The Truck Parking Club "Reserve a
   spot" CTA appears on ~90+ directory pages, but the partner ID that attributes the
   commission is blank: `truckstops/index.html:184` and `truckinlife/directory/index.html:180`
   both read `var TPC_PARTNER_ID = '';`. The customer-facing discount code `SHAWN20` is
   live, so drivers get the discount and Shawn gets no credit. **This is the single
   highest-ROI fix in the whole repo — one value, already-built plumbing, existing traffic.**
2. **The sponsor system is fully built and completely empty.** `truckstops/sponsors.json`
   is `{"sponsors": []}`. The render/targeting/admin tooling all exists; zero sponsors are
   sold. The `rosedale-vendors` sheet (`spreadsheets/registry.json`) shows sponsor outreach
   is actively being tracked — the pipeline just hasn't closed anyone yet.
3. **There is no analytics on any property.** No GA4, no Meta/TikTok pixel, no Plausible —
   nowhere in `truckstops/`, `landing/`, `dataq/`, `seo/`, `truckinlife/`, or the root.
   Every funnel is flying blind, which also blocks selling sponsors (no traffic numbers to
   quote) and optimizing the $99 and Stan funnels.
4. **A large amount of monetization work is stuck in unmerged draft PRs** — Reg Deck Pro
   ($9.99/mo freemium DOT tool, PR #43), Truck Parking Club affiliate sync (PR #48), an AI
   marketing team (PR #60), and the Shop roadside-breakdown system (PR #34). Revenue that's
   already been engineered is sitting un-shipped. See §5.
5. **Duplication is diluting SEO and doubling maintenance.** `truckinlife/data.js` is
   byte-identical to `truckstops/data.js` (same MD5, 549,838 bytes), `truckinlife/` even
   loads `/truckstops/enhance.js` at runtime, and the two directories share one Supabase
   backend. There are also two identical stray `shop/… (1).html` files and **three
   competing CLAUDE.md drafts** (PRs #32/#45/#46). See §4.

**If you do nothing else:** fill in `TPC_PARTNER_ID`, add one analytics snippet across the
sites, and sell the first sponsor slot. Those three turn existing traffic into revenue with
almost no engineering.

---

## 1. Scope & method

Audited every top-level property on the `main`-tracking branch, read-only, via four parallel
grounded passes plus direct verification of the highest-stakes claims. Cross-checked against
the repo's open pull requests, since a lot of the monetization story lives in un-merged
branches. No site code was modified; the only file added is this report.

**Note on context:** this branch already has **open draft PR #59** ("M25 — Traffic &
Monetization"), so this document lands on that existing PR rather than opening a new one.

---

## 2. Portfolio map

| Property | What it is | Stack / backend | Deploy target | Monetization today | State |
|---|---|---|---|---|---|
| `truckstops/` | Interstate Truck Stop Directory (2,608 listings, 51 states, 282 interstate segments) | Static SPA + per-state JSON → `data.js`; Supabase (`mmnvcbejjdweetnxncfi`) for submissions/reviews/paid parking; `enhance.js` growth overlay | Static (Netlify-style); pre-built HTML committed | TPC referral (**ID blank**) + sponsor slots (**empty**) | Live, revenue OFF |
| `landing/` | truckinglifewithshawn.com brand homepage + free-guide funnel | Static HTML/JS; Netlify Forms | Netlify (`truckinglifewithshawn.com`) | **Stan Store** (live), Amazon short-links, email capture | Live, earning |
| `dataq/` | DataQ / RDR violation-dispute tool ("GoDataQ") | Single-file PWA; Supabase `dataq_leads` | Netlify `godatq.netlify.app` (GH Actions auto-deploy) | **Live Stripe $99** filing + email gate | Live, earning |
| `seo/` | YouTube title/description/tag generator (internal) | 100% client-side, no backend | Unknown (no netlify config) | None (missed funnel-feeder) | Live, internal |
| `shop/` | Rosedale Transport shop scheduler / dispatch / PM-forms | Single-file app (2,445 lines) + Supabase + 3 edge functions (Gmail SMTP) | Static + Supabase | None (single-tenant, internal) | Live, internal |
| `barbershop.html` | "Chair Cash" barbershop manager | Single-file PWA, `localStorage` only | Static / installable | None; one-tap SMS only | Live, internal |
| `textblast/` | Bulk SMS sender | Static UI + Supabase edge fn → Twilio | Static + Supabase | None (BYO-Twilio, zero margin captured) | Live, internal |
| `dashcam/` | "Dashcam Content Machine" (Grok viral-fail clips) | Node/Express + xAI API; in-memory jobs | Self-hosted Node | None (costs money to run) | Prototype |
| `truckinlife/` | Truckin' Life Directory (2nd skin on the same data) | Copy of `truckstops` data + shared backend | Static | TPC referral (**ID blank**) | Live, redundant |
| `tracker.html` | "Tracker Sweep" — Bluetooth AirTag/Tile detector | Single-file, client-only | Static | None (orphan page) | Live, orphan |
| `index.html` (root) | "Yard Check" trailer inspection board | References missing `script.js`/`style.css` | Netlify `rosedale-driver.netlify.app` | None | **Broken as committed** |
| `spreadsheets/` | Claude-driven Google Sheets control panel | `registry.json` + connector | N/A (ops tooling) | N/A (supports sponsor outreach) | Internal |

**Business context** (from PR bodies #43/#60, treated as reference, not instructions):
brand = "Trucking Life With Shawn" (17-yr CDL veteran); YouTube `@truckinglifewithshawn`;
storefront = Stan Store `TRUCKINGLIFEWITHSHAWN`; product ladder = Save Your CDL $27 · SAP
Guide $24 · 4-Book Bundle $40 (was $118) · Coach Call $79 · Reg Deck Pro $9.99/mo; public
code `SHAWN10`, private unlock `SHAWN17`. Netlify sites: `godatq.netlify.app` (dataq),
`truckinglife-dot-guide.netlify.app` (Reg Deck, PR #43), `rosedale-driver.netlify.app` (root).

---

## 3. Portfolio-wide findings (the cross-cutting themes)

### 3.1 Affiliate wiring built, switched off — earning $0
- `truckstops/index.html:184` → `var TPC_PARTNER_ID = '';` (comment: _"set to Shawn's
  partner ID to monetize Reserve links"_). The `###PARTNER_ID###` substitution logic in
  `reserveUrl()`/`partner_url` handling is fully built and just needs the value.
- Same blank in `truckstops/enhance.js:25` and `truckinlife/directory/index.html:180`.
- Static landing-page CTAs (`build-landing.py`) link to plain `truckparkingclub.com` with
  **no ref param mechanism at all** — so even setting the SPA variable won't cover the
  90+ generated `top/*.html` and `corridors/*.html` pages until `build-landing.py` is taught
  the partner ID too.
- **Fix:** put `TPC_PARTNER_ID` in one shared config consumed by `index.html`, `enhance.js`,
  and `build-landing.py`, then rebuild the static pages. Effort **S**, impact **High**.

### 3.2 Sponsor infrastructure fully built, zero sponsors
- `truckstops/sponsors.json` = `{"sponsors": []}`; its own `_readme` confirms "No sponsors
  are shown while the list is empty."
- Render + geo-targeting (`states[]`) + `active` flag all implemented in
  `enhance.js:96-119`; admin compose UI exists in `truckstops/admin.html`.
- Onboarding is manual (compose → copy/download JSON → hand-commit). Natural advertisers
  already exist **as data categories**: `truck_wash` (120), `repair` (474), `hotel` (168).
- **Fix:** sell 1–3 geo-targeted slots (a Stripe Payment Link + the existing admin flow is
  enough to start); later add a self-serve intake. Effort **M**, impact **Med-High**.

### 3.3 No analytics anywhere
- Zero GA4 / GTM / Meta Pixel / TikTok Pixel / Plausible across `truckstops/`, `landing/`,
  `dataq/`, `seo/`, `truckinlife/`, root. The only "analytics" is a device-local
  `ts_views_v1` localStorage counter (never aggregated server-side).
- This blocks everything else: can't quote traffic to sponsors, can't measure the $99 or
  Stan funnels, can't tell whether `tracker.html` gets any visits.
- **Fix:** one privacy-friendly snippet (GA4 or Plausible) on all hosted properties + custom
  events on the money actions (TPC click, gate submit, Stripe click, Stan click). Effort
  **S**, impact **High (as an enabler)**.

### 3.4 No attribution on outbound money links
- `landing/` sends traffic to Stan and Amazon with **no UTM parameters**, and several
  "Shop" CTAs point at the generic `stan.store/TRUCKINGLIFEWITHSHAWN` root instead of the
  specific product, so Stan's own analytics can't tell which CTA converted.
- `dataq/`'s Stripe Payment Link is static — no `client_reference_id`/metadata, and there's
  no success webhook, so a completed $99 payment can't be auto-matched to its `dataq_leads`
  row.
- **Fix:** UTM-tag outbound links; deep-link Stan CTAs; pass `client_reference_id` into
  Stripe + a webhook (or Zapier) back to Supabase. Effort **S–M**, impact **High**.

### 3.5 Duplication & hygiene (see §4).

---

## 4. Duplication, redundancy & hygiene

- **`truckinlife/` is a second skin of `truckstops/`, not a separate product.**
  `truckinlife/data.js` ≡ `truckstops/data.js` (MD5 `257011492732c15c08c0d72b5e07fada`,
  549,838 bytes each); `truckinlife/directory/index.html:502` loads
  `/truckstops/enhance.js`; both admin panels hit the same Supabase project + `ts-admin`
  function. `truckinlife/` lacks the newer growth surface (sponsors, `corridors/`, `top/`,
  sitemap/robots) and its own landing page even links out to the `truckstops/` versions.
  Two URLs serving the "same" directory = **duplicate-content SEO dilution** for both.
  **Decision needed:** make one canonical and 301-redirect (or `rel=canonical`) the other.
- **Stray duplicate files:** `shop/shop (1).html` ≡ `shop/shop.html` and
  `shop/lineup (1).html` ≡ `shop/lineup.html` (byte-identical). Dead weight — delete.
- **Three competing CLAUDE.md drafts** open at once: PR #32, #45, #46 (plus #48 bundles a
  fourth). Pick one, merge it, close the rest — future sessions need exactly one repo guide.
- **Root page is broken as committed:** `index.html` references `style.css` and `script.js`
  that exist in **no commit** — the Yard Check page ships unstyled and inert. PR #31 rebuilds
  it self-contained; that's the fix, currently unmerged.

---

## 5. The un-shipped monetization backlog (open draft PRs)

A striking amount of revenue work is already engineered and just needs review + merge +
one-time setup. Triage:

| PR | What it adds | Revenue relevance | Recommendation |
|---|---|---|---|
| **#43** | Reg Deck 2.0 — freemium DOT compliance tool, **$9.99/mo** Stan gate, email capture, deploys to `truckinglife-dot-guide.netlify.app` | **New recurring revenue line** | Highest-value merge candidate; review the free/paid gate + Stan URL wiring, then ship |
| **#48** | Truck Parking Club partner API sync (populates `tpc_locations`, carries `partner_id` on stored URLs) + a CLAUDE.md | Directly powers §3.1 affiliate revenue | Merge alongside setting `TPC_PARTNER_ID`; supersedes #45/#46/#32 for the CLAUDE.md |
| **#60** | AI marketing team (6 subagents + brand brief) | Force-multiplier for content → funnel | Merge (docs-only, no code risk) |
| **#34** | Shop roadside-breakdown system (GPS, photos, auto-emails) | Enables Shop-as-SaaS pitch | Merge after shop multi-tenant decision |
| **#53** | SEO generator → bakes truckinglifewithshawn.com into descriptions | Funnel-feeder (§ seo) | Low-risk merge |
| **#31** | Fix broken root Yard Check page | Unblocks that property | Merge to un-break the page |
| **#33** | Rescue Vault PWA (non-draft) | New standalone app | Product decision |
| **#27** | Text Blast config-in-table | Ops hardening | Merge when Twilio live |
| #32 / #45 / #46 | Competing CLAUDE.md docs | Repo hygiene | Keep one, close two |

_None of these should be merged blind — each needs the one-time setup in its PR body (Netlify
tokens, Supabase secrets, Stan product URLs). This report only recommends the sequence._

---

## 6. Per-property audit (condensed)

### `truckstops/` — Interstate Truck Stop Directory *(the flagship)*
- **Scale:** 2,608 listings (truck_stop 987, rest_area 503, repair 474, weigh_station 250,
  hotel 168, truck_wash 120, service_plaza 106); 51 `top/*.html`, 36 `corridors/*.html`.
- **Monetization present:** TPC referral (ID blank, §3.1); sponsor slots (empty, §3.2);
  CTAs correctly marked `rel="sponsored noopener"`.
- **Not present (despite assumptions):** no Amazon affiliate, no ad units, no analytics.
- **Opportunities:** (1) fill `TPC_PARTNER_ID` **[S/High]**; (2) sell sponsor slots
  **[M/High]**; (3) add analytics **[S/enabler]**; (4) Amazon "recommended gear" block
  reusing the `.enh-sponsor` pattern across 2,608 pages **[S-M/Med]**; (5) self-serve sponsor
  UI **[L/Med]**; (6) paid featured listings for stop operators **[M/speculative]**. Display
  ads = **low fit** (erodes the driver-trust the site depends on).

### `landing/` — truckinglifewithshawn.com
- **Monetization present:** Stan Store (deep links: `17-years-zero-violations` $27,
  `carnivore-in-the-truck` $39, `$49` bundle tripwire on `thanks.html`), Amazon short-links
  (`amzn.to/3RwrTTO`, `a.co/d/0gy4UFoh` — tags opaque, verify they're tagged), Netlify Forms
  + Stan email capture, post-signup `thanks.html` upsell.
- **Gaps:** no analytics/pixel, no UTMs, generic-root Stan CTAs, affiliate recruitment is a
  manual `mailto:`.
- **Opportunities:** UTM + pixel **[S/High]**; deep-link every Shop CTA **[S/Med]**; real
  affiliate/referral mechanism **[M/Med]**; verify Amazon tags **[S/Med margin recovery]**.

### `dataq/` — GoDataQ ($99 filing)
- **Monetization present:** live Stripe Payment Link `PAID_FILING_URL`
  (`index.html:372`), email gate → Supabase `dataq_leads`, full dispute detail synced as
  leads.
- **Gaps:** no analytics; no Stripe `client_reference_id`/metadata or success webhook (can't
  match payments to leads); RLS explicitly MVP-grade (`dataq-leads.sql` hardening note); no
  post-purchase page.
- **Opportunities:** Stripe metadata + reconciliation webhook **[S-M/High]**; funnel
  analytics **[S/High]**; post-payment thank-you/upsell **[S/Med]**; tiered/rush pricing
  **[M/Med]**; RLS→RPC hardening **[M/risk]**.

### `seo/` — YouTube generator (internal)
- **Monetization:** none, and correctly so for an ops tool — but it's a **missed
  funnel-feeder**: generated descriptions/pinned comments (`app.js:147-197`) promote only
  YouTube, never the free DOT guide or Stan Store.
- **Opportunities:** auto-insert the free-guide/Stan link (UTM-tagged) into generated output
  **[S/Med-High]**. (PR #53 already does part of this.)

### `shop/` — Rosedale Shop Scheduler (internal, single-tenant)
- **Monetization:** none; production single-tenant app (real Supabase creds hardcoded).
- **This is the strongest net-new SaaS candidate.** Opportunities: (1) vertical SaaS for
  independent truck-repair shops / small fleets — strip Rosedale-specific config into a
  signup flow (multi-tenant schema or per-shop project) **[S-M/High]**; (2) seat-based Stripe
  subscription mapping to the existing admin/mechanic/dispatch roles **[S once multi-tenant/High]**;
  (3) license the PM-forms module standalone **[M/Med]**; (4) SMS-reminders add-on reusing
  `textblast`'s Twilio pattern **[S/Med]**; (5) white-label reseller **[L/High long-term]**.
- **Before selling:** fix weak default admin creds, tighten the anon `tickets` SELECT RLS
  (hardening fix already in-file but unapplied), delete the `(1)` dup files, move off Gmail
  SMTP.

### `barbershop.html` — Chair Cash (internal)
- **Monetization:** none; `localStorage`-only, one-tap `sms:` links (`:495`), no backend.
  `barbershop-auto-reminders-spec.md` is a **plan, not a build**.
- **Opportunities:** implement the already-designed auto-reminder backend as a paid tier
  (reuse `textblast/functions/send-blast`) **[M/High]**; "Chair Cash Pro" cloud-sync +
  multi-chair + reminders behind Stripe **[M-L/High]**; bundle with `textblast` (shared
  Twilio + A2P 10DLC) **[S-M/High]**. One-time Gumroad sale = **[S/Low]** (easy to clone).

### `textblast/` — Bulk SMS (internal)
- **Monetization:** none captured — deliberate BYO-Twilio ("shop owner should own the
  account"), 1:1 relay, no markup, no metering, no send log (README: ~$5–7/blast to Twilio).
- **Opportunities:** convert to a managed, marked-up messaging platform (vendor-owned Twilio,
  handle A2P 10DLC for them) **[M/High]**; compliance/opt-out dashboard as a paid tier
  **[M/Med-High]**; become the shared SMS engine behind Chair Cash + Shop **[S-M/High]**.

### `dashcam/` — Dashcam Content Machine (prototype)
- **Monetization:** none; it *costs* money to run (xAI API, no cost recovery, no auth/rate
  limit, in-memory jobs lost on restart).
- **Honest assessment:** weakest candidate. Different buyer (content creators, not
  shops/barbers) and a real **reputational/legal risk** — it fabricates crash scenarios from
  real uploaded truck photos. **Recommend deprioritizing** in favor of shop/barbershop/textblast.

### `truckinlife/` — redundant directory skin *(see §4)*
- Same data, same backend, `TPC_PARTNER_ID` also blank (`directory/index.html:180`), no
  analytics, no sitemap/robots → duplicate-content risk. **Consolidate or canonicalize.**

### `tracker.html` — Tracker Sweep (orphan)
- Personal-safety Bluetooth detector; no monetization, not linked from anywhere.
- **Opportunity:** Amazon Associates links to anti-tracker gear (AirTag, detector fobs,
  Faraday bags) in the "How it works" block — high-intent audience **[S/Med]**; add analytics
  + a discovery link from the other properties **[S/Med]**.

### `index.html` (root, Yard Check) — broken *(see §4, PR #31)*
- Fix the missing assets first (PR #31). Then, if it works, it's a small B2B fleet-ops tool
  more than an ad surface.

### `spreadsheets/` — ops tooling (not a revenue surface)
- Supports monetization indirectly (`rosedale-vendors` tracks "School Sponsor Angle").
  One actionable item: convert `Rosedale_Weekly_Briefing` from `.xlsx` to a native Google
  Sheet so Claude can auto-update it **[S/indirect]**.

---

## 7. Prioritized roadmap

### Phase 1 — Turn on revenue that's already built (days, mostly config)
1. **Set `TPC_PARTNER_ID`** in a shared config for `index.html` + `enhance.js` +
   `build-landing.py`; rebuild static pages. _[S / High]_
2. **Add analytics** (GA4 or Plausible) + money-action events to all hosted properties.
   _[S / High-enabler]_
3. **UTM-tag + deep-link** the Stan/Amazon CTAs on `landing/`; verify Amazon tags. _[S / High]_
4. **Sell the first 1–3 sponsor slots** (Stripe Payment Link + existing admin JSON flow).
   _[M / High]_
5. **Merge PR #48** (TPC sync) so `tpc_locations` is populated with partner-tracked URLs.

### Phase 2 — Ship the engineered backlog (review + merge + setup)
6. **Merge & launch Reg Deck Pro (PR #43)** — new $9.99/mo recurring line. _[M / High]_
7. **Stripe reconciliation on `dataq/`** — `client_reference_id` + webhook → `dataq_leads`;
   add post-purchase upsell page. _[S-M / High]_
8. **Merge PR #60** (marketing team) and **PR #53** (SEO funnel link); wire the free-guide
   link into `seo/` output.
9. **Fix the root page (PR #31)** and **de-duplicate**: canonicalize `truckinlife/` →
   `truckstops/`, delete the `(1)` files, settle on one CLAUDE.md (merge #48's or one of
   #32/#45/#46, close the rest).

### Phase 3 — Build the new SaaS lines (weeks)
10. **Shop-as-SaaS** — multi-tenant `shop/`, seat-based Stripe subscription, security
    hardening; merge the breakdown system (PR #34) as a headline feature. _[S-M then scale / High]_
11. **SMS platform** — turn `textblast/` into a managed, marked-up engine and make it the
    shared backend for **Chair Cash auto-reminders** (implement `barbershop-auto-reminders-spec.md`).
    _[M / High]_
12. **Long tail** — Amazon gear block across the directory; `tracker.html` affiliate links;
    self-serve sponsor UI; paid featured listings. Deprioritize `dashcam/`.

### Sequencing rationale
Phase 1 is pure upside on **existing** traffic with near-zero engineering — do it first.
Phase 2 ships revenue that's **already coded** (just un-merged), so it's high-value/low-build.
Phase 3 is genuine product development against clear buyers (repair shops, barbershops), worth
doing only after the cheap wins are banked and analytics can prove where the traffic is.

---

## 8. Appendix — verified evidence

| Claim | Evidence |
|---|---|
| Affiliate ID blank | `truckstops/index.html:184` & `truckinlife/directory/index.html:180`: `var TPC_PARTNER_ID = '';` |
| Discount code live | `…:185` / `…:181`: `var TPC_PROMO_CODE = 'SHAWN20';` |
| Sponsors empty | `truckstops/sponsors.json`: `"sponsors": []` |
| `truckinlife` ≡ `truckstops` data | `md5sum` both `data.js` = `257011492732c15c08c0d72b5e07fada` (549,838 bytes) |
| truckinlife borrows sibling | `truckinlife/directory/index.html:502` loads `/truckstops/enhance.js` |
| Stray dups identical | `diff` of `shop/shop.html` vs `shop/shop (1).html` and `lineup` pair = identical |
| Root page broken | `index.html:7,57` reference `style.css`/`script.js`; neither exists in any commit |
| Live Stripe | `dataq/index.html:372`: `PAID_FILING_URL: "https://buy.stripe.com/7sY5kDgBl3G8ftH67dfUQ01"` |
| Stan storefront | `landing/index.html:50`: `https://stan.store/TRUCKINGLIFEWITHSHAWN` |
| No analytics | No `gtag`/`GA_MEASUREMENT_ID`/pixel found across audited HTML/JS |
| Backend shared | Supabase `mmnvcbejjdweetnxncfi` referenced by `truckstops/`, `truckinlife/`, `dataq/`, `shop/` |

_Audit performed read-only. The only change in this branch is the addition of this file._
