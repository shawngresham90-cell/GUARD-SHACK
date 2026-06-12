// ============================================================================
// Text Blast — incoming SMS webhook, via Twilio.
//
// Supabase Edge Function. Set as the "A message comes in" webhook (HTTP POST)
// on the Twilio number. When someone replies to the Twilio number, this
// forwards "Reply from +1404...: <their text>" to FORWARD_TO as an SMS.
//
// Twilio posts form-encoded fields (From, To, Body, ...). The URL must carry
// ?token=<INBOUND_TOKEN> so random strangers can't trigger forwards.
//
// Config (private textblast_config table, same as send-blast):
//   INBOUND_TOKEN       — must match the token query param in the webhook URL
//   FORWARD_TO          — your cell, where replies get forwarded
//   TWILIO_ACCOUNT_SID  — from the Twilio console dashboard
//   TWILIO_AUTH_TOKEN   — from the Twilio console dashboard
//   TWILIO_FROM         — the Twilio number doing the forwarding
//
// Deployed with --no-verify-jwt; Twilio can't send a Supabase JWT.
// ============================================================================

// Empty TwiML: acknowledge the message without auto-replying to the sender.
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twiml(): Response {
  return new Response(EMPTY_TWIML, { headers: { "Content-Type": "text/xml" } });
}

async function loadConfig(): Promise<Record<string, string>> {
  const cfg: Record<string, string> = {};
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/textblast_config?select=key,value`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        for (const row of await res.json()) cfg[row.key] = row.value;
      }
    } catch { /* fall through to env-only */ }
  }
  for (const k of ["INBOUND_TOKEN", "FORWARD_TO", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"]) {
    const v = Deno.env.get(k);
    if (v) cfg[k] = v;
  }
  return cfg;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const cfg = await loadConfig();

  const token = new URL(req.url).searchParams.get("token");
  if (!cfg.INBOUND_TOKEN || token !== cfg.INBOUND_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const from = String(form.get("From") ?? "");
  const text = String(form.get("Body") ?? "");
  if (!from) return twiml();

  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: auth, TWILIO_FROM: sender, FORWARD_TO: forwardTo } = cfg;
  if (sid && auth && sender && forwardTo) {
    // SMS bodies cap at 1600 chars on Twilio; leave room for the prefix.
    const body = `Reply from ${from}: ${text}`.slice(0, 1500);
    const params = new URLSearchParams({ To: forwardTo, Body: body });
    params.set(sender.startsWith("MG") ? "MessagingServiceSid" : "From", sender);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${sid}:${auth}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("forward failed:", err.message || res.status);
    }
  } else {
    console.error("forward skipped: Twilio config incomplete");
  }

  // Always 200 back to Twilio so the sender never sees an error.
  return twiml();
});
