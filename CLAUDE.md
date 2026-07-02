# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

GUARD-SHACK is a grab-bag monorepo of small, independent apps built for Shawn Gresham's trucking/side businesses (Rosedale Transport, the "Trucking Life With Shawn" YouTube channel, GoDataQ, a barbershop). Each top-level folder or root HTML file is a standalone app — they share conventions and a Supabase project, but not code. There is no build system, no linter, and no test suite anywhere in the repo.

| App | What it is | Backend |
|---|---|---|
| `dataq/` | **DataQ Tracker** (godatq.netlify.app) — helps drivers dispute DOT violations via FMCSA DataQs; free tool + email gate + $99 paid-filing funnel (Stripe) | localStorage + Supabase lead capture (`dataq_leads`) |
| `shop/` | **Rosedale Shop Scheduler** (`shop.html`) — repair-ticket queue for the truck shop, with mechanic logins, dispatch, calendar, email notifications | Supabase (schema in `shop/*.sql`, edge functions in `shop/functions/`) |
| `textblast/` | **Text Blast** — send one SMS to ~600 people via Twilio | Supabase edge function `send-blast` |
| `barbershop.html` (+ `barbershop-sw.js`, `.webmanifest`) | **Chair Cash** — barbershop manager PWA | localStorage only (`barbershop-auto-reminders-spec.md` is the plan for a future SMS backend) |
| `dashcam/` | **Dashcam Content Machine** — turns photos into AI dashcam-fail clips via xAI Grok | Node/Express server (the only Node project in the repo) |
| `seo/` | YouTube SEO generator (titles/tags/descriptions) for the channel | none — 100% client-side |
| `tracker.html` | Tracker Sweep — GPS-tracker detection helper | none |
| `index.html` (root) | Yard Check — voice-driven trailer inspection. **Caveat:** it references `style.css` and `script.js`, which are not in the repo | none |
| `spreadsheets/` | Not an app — a registry (`registry.json`) of Google Sheets Claude maintains via chat. Read `spreadsheets/README.md` before touching any tracked sheet | Google Sheets via connectors |
| `shop/pm-forms/` | Binary fillable PDFs / XLSX maintenance forms — don't try to edit these as text | — |

Files like `shop (1).html` and `lineup (1).html` are stale duplicate copies; the canonical file is the one without ` (1)`. `*.zip` files are gitignored deploy artifacts.

## Architecture pattern (applies to almost every app)

The house style is the **single self-contained HTML file**: all CSS and JS inline, no framework, no bundler, no npm. State lives in `localStorage` so the app works fully offline with no login. Apps meant for phone install ship a `.webmanifest` and a service worker. Files carry long explanatory comment headers explaining intent, setup steps, and access-model reasoning — keep that style when editing.

When an app needs a backend, it layers **Supabase** on top:

- All apps share one Supabase project: `mmnvcbejjdweetnxncfi.supabase.co`. The URL and **anon key are intentionally embedded in the HTML** (in a `CONFIG` block near the bottom of the file) — they're public by design, and RLS is the security boundary. Do not "fix" this by moving them to env vars.
- **RLS is load-bearing.** E.g. drivers use the shop app as `anon` and can only create tickets and read status — parts/costs are invisible; `dataq_leads` lets anon insert/update but never read, so drivers can't see each other's contact info. Any schema change must preserve these guarantees.
- **SQL files are the migrations.** There is no migration tool: each `shop/*.sql` / `dataq/dataq-leads.sql` file is a standalone, additive, safe-to-re-run script pasted into the Supabase SQL editor. New schema changes should follow that pattern (idempotent, heavily commented header explaining how to run it and why).
- **Edge functions** (Deno, in `*/functions/<name>/index.ts`) are deployed with `--no-verify-jwt` and enforce their own shared-secret check instead. Secrets go in via `supabase secrets set`. Deploy/setup instructions live in each function's header comment and the folder README:
  ```bash
  supabase functions deploy notify-staff --no-verify-jwt   # from shop/
  supabase functions deploy send-blast --no-verify-jwt     # from textblast/
  ```
  DB triggers call the shop functions via `pg_net`; the trigger's secret must match the function's.

## Development commands

There is nothing to build or test. To work on an HTML app, open the file in a browser, or serve the folder when the app uses a service worker / manifest / fetch (service workers don't run from `file://`):

```bash
python3 -m http.server 8000   # from the app's folder
```

The one Node project:

```bash
cd dashcam
npm install
cp .env.example .env   # needs XAI_API_KEY
npm run dev            # node --watch server.js (or `npm start`)
```

## Deployment

Apps deploy to Netlify as separate sites, one folder per site. Netlify behavior is configured per-folder with `_redirects` and `_headers` files — the convention is `Cache-Control: no-store` on the app shell (`/` and `/index.html`) so a deploy is picked up immediately, and redirects that keep old URLs working (see `dataq/_redirects`, `shop/_redirects` for the commented pattern).

Only **dataq has CI**: `.github/workflows/deploy-godatq.yml` deploys `dataq/` to godatq.netlify.app on every push to `main` that touches `dataq/**` (requires the `NETLIFY_AUTH_TOKEN` repo secret; the workflow fails loudly if it's missing rather than silently skipping). Other apps are deployed manually. The trailing `<!-- deploy: ... -->` comment in `dataq/README.md` exists to touch the path and trigger a deploy.

## Conventions to follow

- Match the single-file style: when adding a feature to an app, put it in that app's HTML file, not a new module. Keep everything dependency-free unless the app already loads a library from a CDN (e.g. `supabase-js`).
- Supabase pushes from the browser are **best-effort**: never let a failed sync block the local (localStorage) flow — mark unsynced and retry on next load, as `dataq/index.html` does.
- User-tunable settings (Supabase URL/key, prices, payment links) belong in the clearly-marked `CONFIG` block near the bottom of the HTML file.
- Per-app READMEs (`dataq/`, `textblast/`, `spreadsheets/`) are written for the (non-developer) owner and double as the setup docs — update them when behavior or setup steps change.
