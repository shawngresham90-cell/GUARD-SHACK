# Rosedale Shop Scheduler — Setup

A single-file PWA (`shop.html`) backed by Supabase. Drivers report shop tickets
**and** roadside breakdowns with no login; staff log in to work the live queue,
manage breakdowns with outside vendors, and see parts/cost. Everything syncs
live across phones, the shop iPad, and mechanic tablets.

---

## 1. Create the Supabase project & run the SQL (in order)

In the Supabase dashboard → **SQL Editor**, run these three files in order:

1. `shop-scheduler-schema.sql` — tickets, parts, mechanics, time logs, RLS, realtime
2. `shop-mechanic-logins.sql` — per-mechanic logins + admin/mechanic RLS helpers
3. `shop-breakdowns-schema.sql` — breakdowns, private staff data, photos bucket, RLS, realtime

> Order matters: file 3 reuses `is_shop_admin()` and `set_updated_at()` defined in 1–2.

## 2. Connect the app

In `shop.html`, edit the **CONFIG** block near the bottom:

```js
const SUPABASE_URL = "https://YOURPROJECT.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGci...";   // Project Settings → API → anon public key
```

The app shows a "Setup needed" banner until these are filled in.

## 3. Create the logins (Authentication → Users → Add user)

| Username box | Email to create        | Person   | Role  |
|--------------|------------------------|----------|-------|
| `shop`       | `shop@rosedale.local`  | Shawn    | Owner |
| `cab`        | `cab@rosedale.local`   | Chris    | Admin |
| `baf`        | `baf@rosedale.local`   | Bridgett | Admin |

Set the MVP passwords. **These are weak — change them before this faces the
internet.** Passwords are hashed by Supabase Auth (we never store plaintext).

**Per-mechanic logins (optional):** create the mechanic's user here (any email),
then in the app → Mechanics tab enter that same email on their row. They'll get a
locked-down view: only their assigned tickets, no parts/cost.

## 4. Photos (already created by the SQL)

`shop-breakdowns-schema.sql` creates a **private** `breakdown-photos` bucket and
policies: drivers (anon) can upload, only staff can read (via signed URLs). No
manual step needed.

## 5. Automatic breakdown emails (Edge Function + Resend)

Biggest win — the breakdown team is emailed the instant a driver submits.

1. Get a [Resend](https://resend.com) API key and verify a sender domain/address.
2. Deploy the function:
   ```bash
   supabase functions deploy breakdown-notify
   ```
   (source: `edge-functions/breakdown-notify/index.ts`)
3. Set its secrets (Dashboard → Edge Functions → breakdown-notify → Secrets, or
   `supabase secrets set KEY=value`):
   ```
   RESEND_API_KEY        re_xxx
   FROM_EMAIL            breakdowns@yourdomain.com
   BREAKDOWN_TEAM_EMAIL  team@...
   SHOP_EMAIL            shop@...
   DRIVER_MANAGER_EMAIL  manager@...
   WEBHOOK_SECRET        <any long random string>
   ```
4. Create the trigger: Dashboard → **Database → Webhooks → Create**:
   - Table `breakdowns`, event **INSERT**
   - Type **Supabase Edge Function → breakdown-notify**
   - Add HTTP header `x-webhook-secret` = the same `WEBHOOK_SECRET`

Until `RESEND_API_KEY` is set the function safely no-ops, so the app works
end-to-end before email is wired. Priority "Unsafe Location" reports get an
URGENT subject. (Driver SMS via Twilio is deferred — there's a clear spot for it
in the function.)

## 6. Deploy the app (Netlify)

Point a Netlify site at this repo with **Publish directory = `shop`**, no build
command. `index.html` redirects to `shop.html`, so the app loads at the site root.

---

## Who sees what (enforced by the database, not just the UI)

| Data | Driver (anon) | Mechanic login | Admin login |
|------|---------------|----------------|-------------|
| File a ticket / breakdown | ✅ | — | ✅ |
| Own status (ticket + breakdown) | ✅ | — | ✅ |
| Full queue / all breakdowns | ❌ | own assigned tickets only | ✅ |
| Parts & cost estimates | ❌ | ❌ | ✅ |
| Breakdown **estimated cost / approvals / chargeback / warranty** | ❌ | ❌ | ✅ |
| Breakdown photos | upload only | ❌ | ✅ (signed URLs) |
| Vendor name / contact / ETA | ✅ (their own) | — | ✅ |

Sensitive breakdown data lives in a separate `breakdown_private` table that anon
has **no** policy on, so drivers can't read it even via the API.

## Deferred (noted in code for later)
- Driver SMS confirmations (Twilio)
- Scheduled weekly report email (pg_cron) — the report is on-demand in-app for now
- GPS → street address reverse-geocoding (we store coords + a maps link)
- Cost-per-mile (needs an odometer/mileage field)
