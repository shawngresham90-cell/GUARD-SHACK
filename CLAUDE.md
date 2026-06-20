# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

**Owner:** Shawn Gresham — Trucking Life / Rosedale Transport.
**What this repo is:** a collection of small, self-contained operational web
apps for a trucking yard, shop, and a few side projects. Most apps are a single
hand-written HTML file (HTML + CSS + vanilla JS, no build step) backed — where
they need a backend — by Supabase (Postgres + Edge Functions) and Twilio/Gmail
for messaging.

There is **no framework, no bundler, no `npm install` at the repo root, and no
build step** for the web apps. Edit the HTML/CSS/JS directly. The one exception
is `dashcam/`, a small Node/Express server.

---

## Projects

| Project | Path | What it does | Backend |
|---|---|---|---|
| **Rosedale Shop Scheduler** | `shop/` | Drivers report truck problems; the shop works a live realtime repair queue. Roles: admin, dispatch, per-mechanic logins. PM forms (PDF), photos, ETA emails, on-call tap-to-call. The flagship app. | Supabase (DB + Edge Functions), Gmail SMTP |
| **Rosedale Daily Line Up** | `shop/lineup.html` | Dispatch board / daily driver line-up. | Supabase |
| **Yard Check** | `index.html` (root), `style.css`, `script.js` | Voice-driven daily trailer inspection — speak trailer status (loaded/empty/docked/redline), emails a report. | None (browser-only) |
| **Chair Cash** | `barbershop.html`, `barbershop.webmanifest`, `barbershop-sw.js` | Barbershop manager: appointments, clients, cash flow, one-tap SMS reminders. Spec for fully-automatic reminders in `barbershop-auto-reminders-spec.md`. | Currently browser-only; planned Supabase + Twilio |
| **Text Blast** | `textblast/` | Send one SMS to ~600 opted-in people from a laptop, in batches. | Supabase Edge Function + Twilio |
| **Tracker Sweep** | `tracker.html` | Detect hidden Bluetooth/GPS trackers. | None (browser-only) |
| **Dashcam Content Machine** | `dashcam/` | Node/Express server that turns real photos into short semi-truck dashcam clips via Grok (xAI). | Node + xAI API |

`*.zip` files are deploy/export artifacts, not source — they are gitignored.

---

## Tech stack & conventions

- **Front end:** single-file vanilla apps. CSS lives in a `<style>` block; JS in
  a `<script>` block at the bottom of the same file. No React, no Tailwind, no
  TypeScript on the front end.
- **Backend:** Supabase. One shared project (`ShopScheduler`, ref
  `mmnvcbejjdweetnxncfi`). The browser uses the **anon public key only**;
  everything sensitive is enforced by **Row-Level Security (RLS)** in Postgres.
  Never put a service-role key or any Twilio/Gmail secret in front-end code.
- **Edge Functions:** Deno/TypeScript in `*/functions/<name>/index.ts`. Each is
  deployed `--no-verify-jwt` and authenticates itself with a **shared secret**
  passed in a header (`x-shop-secret`, `x-blast-secret`). Keep that pattern.
- **Messaging:** Twilio for SMS, Gmail SMTP (via `denomailer`) for email. All
  shop email reuses the *same* Gmail sender/secrets — don't introduce a second
  email setup.
- **PWAs:** the shop and Chair Cash are installable. Each has a `.webmanifest`
  and a service worker (`*-sw.js`).
- **SQL:** every schema change is a `.sql` file in `shop/`, kept in version
  control even after it's applied live. The header comment says whether to run
  it in the Supabase SQL editor and in what order. Files are written to be
  **safe to re-run** (`if not exists` / `create or replace`).

---

## Brand rules

These are the de-facto conventions across the apps — match them when adding or
editing anything user-facing.

**Naming**
- Customer-facing app names are friendly and capitalized: *Rosedale Shop
  Scheduler*, *Rosedale Daily Line Up*, *Chair Cash*, *Yard Check*, *Text Blast*,
  *Tracker Sweep*. Use the exact existing name; don't rename apps casually.
- Internal Rosedale apps are prefixed "Rosedale".

**Visual design (shared system)**
- **Dark theme only.** Each app has its own background gradient and accent, set
  via CSS custom properties in `:root`. Reuse the existing tokens; don't
  hard-code new colors.
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  sans-serif`. No web-font downloads.
- Mobile-first, single-column, `max-width` centered, sticky blurred header with
  a gradient-text title. Respect iOS safe areas (`env(safe-area-inset-*)`) and
  `user-scalable=no`.
- Per-app palette (background / accent — keep these consistent):
  - Shop Scheduler: bg `#0e1419`, accent orange `#f5872b`
  - Chair Cash: bg `#14100a`, accent gold `#d9a441`
  - Tracker Sweep: bg `#0b1220`, accent blue
  - Status colors are shared: green `#46c06a`/`#3aa76d`, red `#e5484d`/`#c0392b`,
    amber `#ffd166`.
- Each PWA icon is an inline SVG emoji on the app's background color (🔧 shop,
  💈 Chair Cash). Keep that lightweight approach.

**Messaging / compliance copy (non-negotiable)**
- Only text people who **gave their number expecting texts.** No cold/bought
  lists (TCPA + carrier blocking).
- **Identify the sender** in every SMS (e.g. "Rosedale Shop: …").
- No sends before ~8 AM or after ~9 PM local time.
- Honor `STOP`/opt-out (Twilio Messaging Service does this automatically) — never
  re-add someone who opted out.
- Business SMS requires **A2P 10DLC registration** before bulk sending.

---

## Deploy process

### Static web apps (shop, lineup, Yard Check, Chair Cash, Tracker, Text Blast page)
- Hosted as static files. `shop/` uses host config files: `_headers` (the root
  `/` and `/index.html` are `Cache-Control: no-store` so visitors never get
  pinned to a stale redirect page) and `_redirects` (`/  /shop.html  200!`
  serves the app at the site root). These are Netlify/Cloudflare-Pages style —
  a Netlify MCP integration is configured for this account.
- **Deploy = push the files to the host.** There is no build command.
- **When you change an app's HTML/JS/CSS, bump the service worker cache name** so
  clients pick up the new version. Shop SW is at `shop/shop-sw.js`
  (`const CACHE = 'rosedale-shop-v13'` → bump to `v14`, etc.); Chair Cash SW is
  `barbershop-sw.js` (`chaircash-v1`). The shop SW serves the app shell
  network-first and never caches Supabase / supabase-js CDN calls.

### Supabase Edge Functions
From the function's own folder (the deploy command is in each file's header
comment):
```bash
supabase functions deploy <name> --no-verify-jwt
```
Functions in this repo: `shop/functions/notify-staff`,
`shop/functions/notify-driver-ready`, `shop/functions/email-form`,
`textblast/functions/send-blast`.

Set secrets once per project (never commit them):
```bash
supabase secrets set GMAIL_USER=... GMAIL_APP_PASSWORD=... SHOP_NOTIFY_SECRET=... \
  SHOP_STAFF_EMAILS=... SHOP_FROM_NAME="Rosedale Shop"
# Text Blast:
supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=MG... \
  BLAST_SECRET=...
```
The shared secret set here **must match** the value used by the caller (the SQL
trigger for shop notifications, or the value typed into the Text Blast page).

### Database / SQL migrations
- Schema lives in `shop/*.sql`. Apply by pasting into the **Supabase SQL editor**
  (Dashboard → SQL → New query). Respect the run order noted in each file's
  header (base `shop-scheduler-schema.sql` first, then the add-ons).
- After applying a change live, **keep the `.sql` file in the repo** so the
  repo stays in sync with the live project.

### Dashcam server
```bash
cd dashcam
npm install
npm start        # or: npm run dev  (node --watch)
```
Requires `XAI_API_KEY` (and optional `VIDEO_API_KEY`) in `dashcam/.env`.

---

## Working agreements for the assistant

- **Don't add a build system, framework, or dependencies** to the single-file
  apps. Keep them editable-in-place.
- **Secrets stay server-side.** Front-end code only ever holds the Supabase URL +
  anon key. Enforce access with RLS, not by hiding things in JS.
- After editing an app's assets, **remember to bump its service-worker cache
  name** or users will be served stale files.
- Keep applied SQL files in the repo and write migrations to be safe to re-run.
- Match the existing visual + naming conventions above rather than introducing a
  new style.
- This repo has no automated test suite; verify changes by opening the affected
  HTML file in a browser.
