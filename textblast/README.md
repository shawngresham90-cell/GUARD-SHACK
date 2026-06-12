# Text Blast — send one text to 600 people from your laptop

Two pieces:

| File | What it is |
|---|---|
| `textblast.html` | The app. Open it in any browser on the laptop (double-click it, or host it). |
| `functions/send-blast/index.ts` | The server side. Lives on Supabase, holds your Twilio login, does the actual sending. |

The page never sees your Twilio password — it only talks to the function,
and the function checks a shared secret before sending anything.

## One-time setup (about 20 minutes of clicking + a registration wait)

### 1. Twilio account
1. Sign up at https://www.twilio.com (the shop owner should own the account so billing is theirs).
2. Buy a local phone number (~$1.15/month).
3. **Register for A2P 10DLC** (Console → Messaging → Regulatory Compliance).
   This is legally required for business texting in the US. Approval usually
   takes a few days — until it's approved, carriers will filter/block bulk sends.
   For 600 texts at a time you want this done properly.
4. Optional but recommended for volume: create a **Messaging Service**
   (Console → Messaging → Services), attach your number to it, and use its
   SID (starts with `MG`) as `TWILIO_FROM` below. It spreads sends correctly
   and handles STOP/opt-out automatically.

Cost per blast: 600 texts × ~$0.0079 + carrier fees ≈ **$5–7 per blast**.

### 2. Deploy the function (from this folder)
```bash
supabase functions deploy send-blast --no-verify-jwt
supabase secrets set \
  TWILIO_ACCOUNT_SID=ACxxxxxxxx \
  TWILIO_AUTH_TOKEN=xxxxxxxx \
  TWILIO_FROM=MGxxxxxxxx \
  BLAST_SECRET=pick-a-long-random-password
```
`TWILIO_FROM` can be either the Messaging Service SID (`MG…`, preferred)
or the raw phone number (`+15551234567`).

### 3. Set up the page
1. Open `textblast.html` in a browser.
2. Expand **Setup**, paste:
   - Function URL: `https://YOUR-PROJECT.supabase.co/functions/v1/send-blast`
   - Blast secret: the same `BLAST_SECRET` you set above
3. Save. (Stored in that browser only.)

## Sending a blast
1. Paste numbers (any format — it cleans them up) or upload a CSV.
2. Type the message. The counter shows how many SMS segments you're paying
   for per person (keep it under 160 characters to pay for 1).
3. **Send a test to your own phone first.**
4. Hit **Send to everyone**. It sends in batches of 50 with a progress bar;
   any failures are listed at the end so you can retry just those.

## Rules that keep your number alive
- Only text people who **gave you their number** expecting texts. Blasting
  bought/cold lists gets the number blocked by carriers and can bring TCPA fines.
- Identify yourself in the message ("Rosedale Shop: …").
- Don't send before ~8 AM or after ~9 PM local time.
- Twilio honors STOP replies automatically (with a Messaging Service) — never
  re-add someone who opted out.
