# DataQ Tracker

A one-file app that helps a carrier or driver **challenge DOT violations** through the
FMCSA [DataQs](https://dataqs.fmcsa.dot.gov/) system. When a roadside inspection
violation or crash is wrong, it still hits your CSA safety score, your insurance, and
your reputation until it's corrected. This app keeps every disputable event in one
place, helps you decide *why* it's wrong, and writes the **Request for Data Review
(RDR)** narrative you paste into the federal portal.

| File | What it is |
|---|---|
| `index.html` | The whole app. Open it in any browser (double-click, or host it). |
| `dataq.webmanifest` | Lets you "Add to Home Screen" so it opens like a native app. |
| `dataq-leads.sql` | Supabase schema for the lead-capture table (`dataq_leads`). |

## What it does

- **Dashboard** — open disputes, how many are submitted, how many you've won, and the
  severity points at stake on records still in play.
- **Log a dispute** — inspection/report #, date, state, driver, tractor/trailer, the
  cited violation code, severity weight, and a description.
- **Why it's wrong** — pick from the common, legitimate DataQ grounds (wrong driver,
  wrong carrier, citation dismissed, corrected on the spot, data-entry error,
  non-preventable crash, duplicate, etc.).
- **Build RDR** — turns your entry into a clean, factual Request for Data Review you can
  copy straight into the DataQs "reason for request" box. Edit it first if you like.
- **Track status** — Draft → Submitted → Under review → Approved / Partial / Denied,
  with notes and follow-up reminders per dispute.
- **Backup** — export everything to a JSON file.

## Lead capture (Supabase)

The driver's working copy still lives in the browser's `localStorage` and works fully
offline — nothing about that changed. On top of that, **every saved dispute also pushes a
row to a Supabase table (`dataq_leads`)** so GoDataQ captures the driver as a lead: their
contact info, the violation, the grounds, the generated RDR, and whether they tapped the
paid-filing button.

- A small **"Your contact info"** block (name, email, phone, DOT/MC #) is captured on each
  dispute and remembered as a profile so it prefills next time.
- The push is best-effort: if the device is offline or Supabase is unreachable, the dispute
  is marked "not synced" and retried automatically on the next load — the app never blocks.
- The browser uses the public **anon** key. By RLS, anon can only **insert/update** leads,
  never **read** them — so one driver can't see another's contact info. Only GoDataQ (via the
  Supabase dashboard or service-role key) reads the leads.

**Setup:** run `dataq-leads.sql` once in the Supabase SQL editor (it's additive and safe to
re-run). The app's `CONFIG` block at the bottom of `index.html` already points at the project;
swap `SUPABASE_URL` / `SUPABASE_ANON_KEY` there to use a different project, or blank the URL to
turn syncing off.

## The funnel: free tool → email gate → $99 filing

The tool is **free to everyone** — that's the hook. The business model sits on top:

1. **Email gate on the RDR.** Building the dispute is free with no login, but the first time
   a driver taps **Build RDR** (the actual letter — the thing they came for), a one-time
   unlock asks for their email (name + phone optional). Valid email → unlocked forever on
   that device, and a contact-only lead is pushed to `dataq_leads` immediately (source
   `dataq_app_gate`) — so you get the email even if they never save a dispute. If they
   already typed an email in the dispute form, the gate never appears.
2. **$99 done-for-you filing** everywhere intent is highest:
   - the ROI banner on the home screen ("One bad violation can cost thousands a year"),
   - a button inside each dispute,
   - and a button right under the finished RDR — the moment they realize filing is work.
   Tapping any of them marks `wants_paid_filing = true` on the lead, then opens your
   payment/booking link or shows a "we'll reach out" confirmation.

Configure in the `CONFIG` block: `PAID_FILING_PRICE` (default `"$99"`) and
`PAID_FILING_URL` — set it to a **Stripe Payment Link**, Calendly, or `mailto:` link. With
no URL set, the lead is still captured and the confirmation is shown.

## How it works

The driver's own copy lives in the browser's `localStorage` — no login needed, works fully
offline. Use the **Backup** button before clearing browser data or switching phones. Lead
capture and the paid upsell are layered on top via Supabase (see above).

## Filing the actual dispute

This app *prepares* the request; the FMCSA portal is where you *file* it. Register a free
account at <https://dataqs.fmcsa.dot.gov/>, start a Request for Data Review for the
inspection, paste in the narrative this app built, and attach your evidence (repair
invoices, dismissed citations, dash-cam clips, BOLs, photos) as PDFs. File promptly —
inspection data posts to your record within days.

> Not legal advice. You're responsible for the accuracy of anything you submit to FMCSA.
