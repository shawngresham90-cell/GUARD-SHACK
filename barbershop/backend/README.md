# Chair Cash — Backend

Backend for fully-automatic SMS reminders. See the plan in
[`../bmad/`](../bmad/) (PRD, architecture, and per-story breakdown).

## Progress
| Story | What | State |
| --- | --- | --- |
| 1.1 | Supabase schema + migrations | ✅ code |
| 1.2 | App → cloud sync | ✅ code |
| 1.3 | Offline reconcile + sync status | ✅ code |
| 2.3 | Twilio send + STOP/START webhook | ✅ code |
| 3.1–3.4 | Scheduler, rules, quiet hours, dry-run | ✅ code (15/15 unit tests) |
| 4.1 | In-app send-status chips | ✅ code |
| 2.1 / 2.2 | Twilio account + A2P 10DLC registration | ⬜ **your action** |

"✅ code" = written + tested in this repo. Live SMS/DB needs your accounts.

## Layout
```
backend/
  src/
    rules.ts            # pure decision logic (quiet hours / day-before / late)
    rules.test.ts       # unit tests
    templates.ts        # {name}{time}{service}{shop} rendering
    templates.test.ts
  supabase/
    migrations/
      0001_init.sql        # tables, indexes, RLS
      0002_seed_settings.sql
    functions/
      scheduler/        # cron worker: decide + send or dry-run
      sms-webhook/      # Twilio inbound STOP/START (signature-validated)
      _shared/twilio.ts # REST send helper + keyword classifier
  .env.example          # secret NAMES only
```

## Setup A — Database (Story 1.1 / 1.2)
1. Create a free project at https://supabase.com
2. Install the CLI: `npm i -g supabase` (or `npx supabase`)
3. From this folder:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies migrations/0001 + 0002
   ```
4. Confirm the four tables exist in the Supabase dashboard.
5. In Chair Cash → Settings → Cloud sync, paste your **Project URL** + **anon
   key** (Project Settings → API). Adding a client should appear in `customer`.

## Setup B — Sending (Stories 2.x / 3.x)
1. Run the unit tests (needs Deno): `deno test src/`
2. Set secrets:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=...
   supabase secrets set WEBHOOK_PUBLIC_URL=<your sms-webhook function URL>
   ```
3. Deploy functions:
   ```bash
   supabase functions deploy scheduler
   supabase functions deploy sms-webhook --no-verify-jwt
   ```
4. Schedule the worker (SQL editor):
   ```sql
   select cron.schedule('chaircash-15m','*/15 * * * *',
     $$ select net.http_post(
          url:='<scheduler function URL>',
          headers:='{"Authorization":"Bearer <anon key>"}'::jsonb) $$);
   ```
5. Set your Twilio number's Messaging webhook to the `sms-webhook` URL.

No secrets are committed. `dry_run` defaults to **true** in `settings`, so the
pipeline only *logs* what it would send until you flip it:
```sql
update settings set dry_run = false;   -- only after A2P approval + a clean dry run
```

## Don't go live until
- A2P 10DLC campaign is **approved** (Story 2.2; ~10–15 days), and
- you've watched the `dry_run` rows in `message_log` for a few days.
