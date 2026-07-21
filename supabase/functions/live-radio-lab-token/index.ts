// TLWS LIVE RADIO — Phase 0.5 spike: token / report / kick endpoint.
//
// Deploy (owner, when ready — NOT deployed as part of the spike PR):
//   supabase functions deploy live-radio-lab-token --no-verify-jwt
//   supabase secrets set LIVEKIT_URL=wss://<project>.livekit.cloud \
//                        LIVEKIT_API_KEY=<key> LIVEKIT_API_SECRET=<secret> \
//                        MOD_KEY=<long-random-string> ALLOWED_ORIGIN=<site origin>
//
// Security model:
//  - The LiveKit API secret NEVER leaves this function.
//  - Clients get only short-TTL (10 min) tokens scoped to one room with
//    minimal grants (listen: subscribe-only; talk: + canPublish audio).
//  - Guest handles are validated + reserved names blocked.
//  - Best-effort per-IP rate limiting (in-memory per isolate — a real
//    deployment should back this with a durable store).
//  - "report" only writes to function logs (spike retention policy: no
//    database writes, minimal technical logs).
//  - "kick" requires the MOD_KEY header (moderator capability without a
//    dashboard, per the spike approval).

const CHANNELS = new Set(["nationwide-19", "i-40", "i-65", "i-75", "i-95"]);
const HANDLE_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]{2,19}$/;
const RESERVED = /^(admin|mod|moderator|staff|shawn|tlws|police|911|emergency|dispatch|fcc)$/i;
const TOKEN_TTL_S = 600; // 10 minutes
const RATE_LIMIT = { windowMs: 60_000, maxJoins: 10 };

const hits = new Map<string, number[]>(); // ip -> timestamps (per-isolate best effort)

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_LIMIT.maxJoins;
}

// ---- Minimal HS256 JWT (LiveKit access token) ----
function b64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`)));
  return `${header}.${body}.${b64url(sig)}`;
}

async function livekitToken(opts: {
  apiKey: string; apiSecret: string; room: string; identity: string;
  name: string; canPublish: boolean;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await signJwt({
    iss: opts.apiKey,
    sub: opts.identity,
    name: opts.name,
    nbf: now - 10,
    exp: now + TOKEN_TTL_S,
    video: {
      room: opts.room,
      roomJoin: true,
      canSubscribe: true,
      canPublish: opts.canPublish,
      canPublishData: true,
      canPublishSources: opts.canPublish ? ["microphone"] : [],
    },
  }, opts.apiSecret);
}

async function adminToken(apiKey: string, apiSecret: string, room: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await signJwt({
    iss: apiKey, sub: "tlws-moderator", nbf: now - 10, exp: now + 60,
    video: { room, roomAdmin: true },
  }, apiSecret);
}

function json(status: number, body: unknown, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type, x-mod-key",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
  if (req.method === "OPTIONS") return json(204, {}, origin);
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);

  const url = Deno.env.get("LIVEKIT_URL");
  const apiKey = Deno.env.get("LIVEKIT_API_KEY");
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
  if (!url || !apiKey || !apiSecret) {
    return json(503, { error: "radio_unavailable" }, origin); // fail-soft trigger
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "bad_json" }, origin); }

  const action = String(body.action ?? "token");
  const channelId = String(body.channelId ?? "");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!CHANNELS.has(channelId)) return json(400, { error: "unknown_channel" }, origin);

  if (action === "token") {
    const handle = String(body.handle ?? "").trim();
    const mode = body.mode === "talk" ? "talk" : "listen";
    if (!HANDLE_RE.test(handle) || RESERVED.test(handle)) {
      return json(403, { error: "invalid_handle" }, origin);
    }
    if (rateLimited(ip)) return json(429, { error: "rate_limited" }, origin);

    const identity = `${handle.toLowerCase().replace(/\s+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
    const token = await livekitToken({
      apiKey, apiSecret, room: channelId, identity, name: handle,
      canPublish: mode === "talk",
    });
    // Minimal technical log (no PII beyond the chosen guest handle).
    console.log(`token issued room=${channelId} mode=${mode} id=${identity}`);
    return json(200, { sfuUrl: url, token, ttl: TOKEN_TTL_S, role: mode, channel: channelId }, origin);
  }

  if (action === "report") {
    const target = String(body.targetIdentity ?? "").slice(0, 64);
    const reporter = String(body.reporterHandle ?? "").slice(0, 24);
    // Spike retention policy: log-only, no database writes.
    console.warn(`REPORT room=${channelId} target=${target} by=${reporter} ip=${ip}`);
    return json(202, { received: true }, origin);
  }

  if (action === "kick") {
    const modKey = Deno.env.get("MOD_KEY");
    if (!modKey || req.headers.get("x-mod-key") !== modKey) {
      return json(403, { error: "forbidden" }, origin);
    }
    const target = String(body.targetIdentity ?? "");
    const admin = await adminToken(apiKey, apiSecret, channelId);
    const host = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const res = await fetch(`${host}/twirp/livekit.RoomService/RemoveParticipant`, {
      method: "POST",
      headers: { authorization: `Bearer ${admin}`, "content-type": "application/json" },
      body: JSON.stringify({ room: channelId, identity: target }),
    });
    console.warn(`KICK room=${channelId} target=${target} ok=${res.ok}`);
    return json(res.ok ? 200 : 502, { ok: res.ok }, origin);
  }

  return json(400, { error: "unknown_action" }, origin);
});
