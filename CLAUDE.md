# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

GUARD-SHACK is a collection of **independent mini-apps** built for a trucking business (the Rosedale shop / "Trucking Life With Shawn"). There is no shared framework, no root build system, no test suite, and no linter. Each app lives in its own folder (or as a single root-level HTML file) and is developed and deployed on its own.

The dominant pattern is the **single-file app**: one self-contained `.html` file with inline CSS and vanilla JS, storing data in `localStorage` (works offline, no login), often installable as a PWA (`.webmanifest` + service worker), with an optional best-effort Supabase sync layered on top.

## The apps

| Path | App | Stack / backend |
|---|---|---|
| `dataq/` | **DataQ Tracker** — helps drivers dispute DOT violations via FMCSA DataQs; free tool with an email gate and a $99 paid-filing upsell | Single-file PWA + Supabase lead capture (`dataq_leads` table) |
| `shop/` | **Rosedale Shop Scheduler** (`shop.html`) and **Daily Line Up dispatch board** (`lineup.html`) — repair tickets, scheduling, PM forms | Single-file PWA + Supabase (tables, triggers, edge functions); `pm-forms/` holds fillable PDFs |
| `textblast/` | **Text Blast** — bulk SMS from a laptop | Single-file app + Supabase edge function wrapping Twilio |
| `dashcam/` | **Dashcam Content Machine** — turns photos into short AI-generated dashcam clips | The only Node app: Express + Grok/xAI APIs |
| `seo/` | **SEO Generator** for the YouTube channel | Pure client-side (`index.html` + `app.js` + `style.css`), no backend |
| `spreadsheets/` | **Spreadsheet Hub** — control panel telling Claude which Google Sheets to track and how to update them | `registry.json` + README (see below) |
| `barbershop.html` (root) | **Chair Cash** — barbershop manager PWA (with `barbershop-sw.js`, `barbershop.webmanifest`); `barbershop-auto-reminders-spec.md` is the spec for a planned auto-reminder upgrade | localStorage only |
| `tracker.html` (root) | **Tracker Sweep** — hidden-tracker detection tool | Single file |
| `index.html` (root) | **Yard Check** — daily trailer inspection. ⚠️ References `style.css`/`script.js` that are not in the repo | Single file (incomplete assets) |

## Commands

There is nothing to build or test for the HTML apps — open the file in a browser (double-click or host it).

**dashcam/** (only npm project):
```bash
cd dashcam
npm install
cp .env.example .env   # set XAI_API_KEY etc.
npm run dev            # node --watch server.js
npm start              # node server.js (port 3000)
```

**Supabase edge functions** (Deno, deployed from the app folder):
```bash
supabase functions deploy notify-staff --no-verify-jwt        # shop/
supabase functions deploy notify-driver-ready --no-verify-jwt # shop/
supabase functions deploy email-form                          # shop/ — verify_jwt stays ON
supabase functions deploy send-blast --no-verify-jwt          # textblast/
```
Secrets are set with `supabase secrets set ...`; each function's required secrets are documented in the comment block at the top of its `index.ts`.

**SQL schema files** (`shop/*.sql`, `dataq/dataq-leads.sql`) are run manually in the Supabase SQL editor. They are written to be additive/idempotent and safe to re-run.

## Deployment

- **`dataq/` auto-deploys** to https://godatq.netlify.app via `.github/workflows/deploy-godatq.yml` on any push to `main` touching `dataq/**` (or manual `workflow_dispatch`). It requires the `NETLIFY_AUTH_TOKEN` repo secret and deliberately **fails loudly** if the secret is missing, so a green run always means a real deploy. This is the only automated deploy in the repo.
- **`shop/` and `dataq/`** are separate Netlify sites; each folder carries its own Netlify `_redirects` and `_headers`. Convention: the app shell (`/` and `/index.html`) is served with `Cache-Control: no-store` so deploys take effect immediately, while the service worker handles the app network-first.
- `shop/_redirects` force-rewrites `/` to `/shop.html` (`200!`); `dataq/_redirects` 301s the old `/dataq.html` path to `/`.

## Key conventions

- **Single-file apps stay single-file.** Configuration lives in a `CONFIG` block near the bottom of the HTML (e.g. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PAID_FILING_URL` in `dataq/index.html`). Blanking the Supabase URL turns syncing off.
- **Supabase sync is best-effort and never blocks the app.** The browser only ever holds the public anon key; RLS restricts anon to insert/update (never read), so users can't see each other's data. Failed pushes are marked unsynced and retried on next load.
- **Edge functions are self-documenting.** Every `functions/*/index.ts` starts with a comment block covering what invokes it (DB trigger via pg_net vs. browser), its deploy command, its secrets, and its auth model (shared-secret header when deployed with `--no-verify-jwt`; the anon-key JWT gateway otherwise). Keep that block accurate when editing.
- **Emails go through Gmail SMTP** (denomailer) using `GMAIL_USER` + `GMAIL_APP_PASSWORD` secrets shared across the shop functions — don't introduce a second email setup.
- `*.zip` files are gitignored deploy artifacts (a couple of pre-existing ones are already committed; don't add more).
- Files like `shop (1).html` / `lineup (1).html` are stale duplicate uploads — `shop.html` and `lineup.html` are the live versions.

## Google Sheets updates (spreadsheets/)

When asked to update a tracked spreadsheet, follow `spreadsheets/README.md`:

1. Read `spreadsheets/registry.json` to resolve the sheet's `id`, `worksheet`, `columns`, `key_column`, and `update_rules`.
2. **Read before write** — look up target rows by `key_column` to confirm the match and avoid duplicates.
3. Use the connected Google Sheets tools (add row / update row).
4. Match the existing column order and value style (e.g. `y` vs `Yes`).
5. Report what changed with the sheet link, and update `registry.json` if a sheet's columns have drifted.

Only native Google Sheets are writable; `.xlsx` uploads must be converted first (File → Save as Google Sheets), then update the registry entry.
