# TLWS Live Radio Lab — environment setup guide

Everything here targets **free tiers only** (spike budget: $0). Until these
steps are done, `/live-radio-lab/` renders its fail-soft "offline" state by
design.

## 1. LiveKit Cloud (free dev tier)

1. Create an account at cloud.livekit.io (free dev tier — do **not** enter
   a paid plan).
2. Create a project (e.g. `tlws-live-radio-dev`).
3. From the project settings copy:
   - the WebSocket URL: `wss://<project>.livekit.cloud`
   - an **API key** and **API secret** (Settings → Keys).
4. These credentials go **only** into the Supabase function environment
   (next step). Never into the repo, Netlify env for the client, or
   `config.js`.

## 2. Supabase Edge Function (existing TLWS Supabase project, or a dev one)

From the repo root, with the Supabase CLI logged in:

```sh
supabase functions deploy live-radio-lab-token --no-verify-jwt

supabase secrets set \
  LIVEKIT_URL=wss://<project>.livekit.cloud \
  LIVEKIT_API_KEY=<api-key> \
  LIVEKIT_API_SECRET=<api-secret> \
  MOD_KEY=<long-random-string> \
  ALLOWED_ORIGIN=https://<your-deploy-preview-or-site-origin>
```

Notes:
- `--no-verify-jwt` because guests have no Supabase auth session; abuse
  control is the function's own rate limit + handle validation.
- `ALLOWED_ORIGIN` locks CORS to the site origin. During two-device
  testing against a Netlify deploy preview, set it to that preview origin.
- `MOD_KEY` enables the kick capability (see moderation below). Keep it
  private; rotate freely.

## 3. Point the frontend at the function

Edit `live-radio-lab/config.js`:

```js
window.TLWS_RADIO_LAB_CONFIG = {
  tokenEndpoint: "https://<project-ref>.functions.supabase.co/live-radio-lab-token"
};
```

The endpoint URL is public by design (it holds no secrets). Commit this to
the spike branch only when ready to test on the deploy preview.

## 4. Test

Open the Netlify **deploy preview** URL (`/live-radio-lab/`) on two phones
on different mobile networks and run `TEST_CHECKLIST.md`.

## 5. Moderator kick (no dashboard in the spike)

```sh
curl -X POST "$TOKEN_ENDPOINT" \
  -H "content-type: application/json" \
  -H "x-mod-key: $MOD_KEY" \
  -d '{"action":"kick","channelId":"nationwide-19","targetIdentity":"<identity>"}'
```

Identities appear in the function logs when tokens are issued.

## 6. Measuring usage / cost (success test 8)

LiveKit Cloud's dashboard shows connection minutes and bandwidth per
project. After the two-device session, record: participant-minutes used,
bandwidth, and the dev-tier limits, into `SPIKE_REPORT.md` §Cost.

## Teardown

Delete the LiveKit dev project and `supabase functions delete
live-radio-lab-token` (or unset its secrets) to return everything to zero.
