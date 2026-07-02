# Reg Deck — DOT Compliance Tool

Live at **https://truckinglife-dot-guide.netlify.app** (Netlify site `truckinglife-dot-guide`,
site id `18218033-8a23-4cf7-9eec-b379e1f3c926`).

Started as a free FMCSR regulation lookup. Now a **freemium DOT compliance tool** with a
funnel on top: free tools hook drivers → email capture feeds the list → Pro membership +
Stan products make the money.

## Pages

| Page | What it is | Tier |
|---|---|---|
| `index.html` | Reg search (49 CFR 350–399 live from eCFR + Canada SOR/2005-313) + tools hub + email capture + product CTAs | Free |
| `move.html` | **Before You Move — Is This Legal?** HOS "Can I Drive?" wizard + PC / yard-move analyzer | 3 free checks/day |
| `violation.html` | Violation Checker + CSA Points Estimator (severity × time weight, OOS bump, fix/docs/say) | 3 free checks/day |
| `pretrip.html` | Pre-Trip Failure Check (ABS light, tire, air leak, brakes… → safe to move? OOS risk?) | Free |
| `roadside.html` | Roadside Mode — pulled-over survival guide | Free |
| `letters.html` | Fix-It Letter Generator (driver statement, shop request, company memo, DataQ draft, preventive plan) | 3 free/day |
| `vault.html` | Document Vault (CDL, med card, inspections — on-device IndexedDB, nothing uploads) | **Pro only** |
| `cheatsheet.html` | DOT Inspection Cheat Sheet — the email-capture deliverable, print-ready | Free after signup |

The three-per-day meter is shared across the gated tools (`rd_meter` in localStorage).

## Monetization — Stan Store (chosen setup)

Everything sells through **stan.store/TRUCKINGLIFEWITHSHAWN**. Config lives at the top of
[`rd.js`](rd.js):

- `PRO_URL` — where "GO PRO — $9.99/mo" sends people. **TODO:** create a Stan membership
  product called *Reg Deck Pro* at $9.99/mo and paste its URL here (currently the store root).
- `UNLOCK_CODE` — default `SHAWN17`. Put this code in the Stan product's **delivery message /
  welcome email** ("Your unlock code is SHAWN17 — enter it on any tool page"). Buyers type it
  once and every tool unlocks on that device. Change the code here any time you want to
  rotate it.
- `CDL_URL` / `COACH_URL` / `STORE` — existing products (Save Your CDL $27, Coach Call $79,
  bundle). Swap when the dedicated bundle URL exists.

> The gate is client-side (honor system) — right for v1: zero backend, zero friction.
> If it ever needs real enforcement, that's a Supabase-auth upgrade later.

## Email capture

The yellow cheat-sheet box on `index.html` posts to **Netlify Forms**
(form name `dot-cheat-sheet`) and then lands the driver on `/cheatsheet.html` so delivery is
instant. Emails collect under **Netlify → the site → Forms** — set a notification email there,
and import them into Stan/your email tool whenever.

Per the funnel spec you can later point the form at a Stan free lead-magnet product instead —
but Stan pages don't accept external form POSTs, so the working pattern is: Netlify captures
the email, the success page (and the welcome email you send) links the Stan store.

## Deploys

`.github/workflows/deploy-regdeck.yml` publishes `regdeck/` to production on every push to
`main` touching this folder (same `NETLIFY_AUTH_TOKEN` secret as the godatq deploy). Manual
runs via the Actions tab work too. `_headers` keeps HTML no-cache so deploys show instantly.

## Ground rules (from the funnel spec)

- **Never break or gate the reg search** — it's the reason the page gets shared and ranked.
- No popups blocking the search. No forced redirects. Loads fast.
- Trust first, sales second: tools give real answers *then* offer the upsell.
- Reference aid, not legal advice — every page carries the disclaimer.
