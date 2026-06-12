// ============================================================================
// Text Blast — bulk SMS sender, via Twilio.
//
// Supabase Edge Function. Invoked by textblast.html (the laptop page):
//   POST { to: ["+1555...", ...], body: "message" }  → sends one SMS per number
//
// The page sends numbers in batches of 50 per request so each call stays
// fast; Twilio queues the actual carrier delivery on its side.
//
// Deploy:  supabase functions deploy send-blast --no-verify-jwt
// Config (each key read from env secrets first, then the private
// `textblast_config` table — rows there can be edited in the Table Editor):
//   TWILIO_ACCOUNT_SID  — from the Twilio console dashboard
//   TWILIO_AUTH_TOKEN   — from the Twilio console dashboard
//   TWILIO_FROM         — your Twilio number (+15551234567) OR a Messaging
//                         Service SID (starts with "MG") for A2P 10DLC sends
//   BLAST_SECRET        — shared secret; must match the one typed into the page
//
// Deployed with --no-verify-jwt; it checks the shared secret itself.
// ============================================================================

const MAX_BATCH = 50;        // numbers per request
const CONCURRENCY = 10;      // simultaneous Twilio API calls

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-blast-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Env secrets win; the textblast_config table is the fallback so config can
// be managed from the dashboard's Table Editor without redeploying.
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
  for (const k of ["BLAST_SECRET", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"]) {
    const v = Deno.env.get(k);
    if (v) cfg[k] = v;
  }
  return cfg;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const cfg = await loadConfig();

  const secret = cfg.BLAST_SECRET;
  if (!secret || req.headers.get("x-blast-secret") !== secret) {
    return json(401, { error: "Unauthorized — wrong or missing secret" });
  }

  const sid = cfg.TWILIO_ACCOUNT_SID;
  const token = cfg.TWILIO_AUTH_TOKEN;
  const from = cfg.TWILIO_FROM;
  if (!sid || !token || !from) {
    return json(500, { error: "Twilio secrets not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM)" });
  }

  let body: { to?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Bad JSON" });
  }

  const message = typeof body.body === "string" ? body.body.trim() : "";
  const to = Array.isArray(body.to) ? body.to.filter((n): n is string => typeof n === "string") : [];
  if (!message) return json(400, { error: "Empty message" });
  if (to.length === 0) return json(400, { error: "No numbers" });
  if (to.length > MAX_BATCH) return json(400, { error: `Max ${MAX_BATCH} numbers per request` });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = "Basic " + btoa(`${sid}:${token}`);
  // A Messaging Service SID routes through the registered A2P campaign;
  // a plain number sends directly from that number.
  const fromParam = from.startsWith("MG")
    ? ["MessagingServiceSid", from] as const
    : ["From", from] as const;

  async function sendOne(number: string): Promise<{ to: string; ok: boolean; error?: string }> {
    const form = new URLSearchParams({ To: number, Body: message, [fromParam[0]]: fromParam[1] });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      if (res.ok) return { to: number, ok: true };
      const err = await res.json().catch(() => ({}));
      return { to: number, ok: false, error: err.message || `Twilio HTTP ${res.status}` };
    } catch (e) {
      return { to: number, ok: false, error: e instanceof Error ? e.message : "network error" };
    }
  }

  // Simple worker pool so we never hold more than CONCURRENCY Twilio calls open.
  const results: { to: string; ok: boolean; error?: string }[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, to.length) }, async () => {
      while (next < to.length) {
        const i = next++;
        results[i] = await sendOne(to[i]);
      }
    }),
  );

  const sent = results.filter((r) => r.ok).length;
  return json(200, { sent, failed: results.length - sent, results });
});
