// sms-webhook — Supabase Edge Function. Twilio inbound handler (Story 2.3).
//
// Honors STOP/START: flips customer.opted_out so the scheduler never selects
// them again. Validates Twilio's X-Twilio-Signature so randoms can't spoof
// opt-in/opt-out for someone else.
//
// Deploy: supabase functions deploy sms-webhook --no-verify-jwt
// Set this function's URL as the Messaging webhook on your Twilio number.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyKeyword } from "../_shared/twilio.ts";

const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

// Twilio request validation: HMAC-SHA1 over (url + sorted POST params),
// base64, compared to X-Twilio-Signature.
async function validTwilioSignature(url: string, params: URLSearchParams, signature: string): Promise<boolean> {
  if (!AUTH_TOKEN || !signature) return false;
  const sorted = [...params.keys()].sort();
  let data = url;
  for (const k of sorted) data += k + (params.get(k) ?? "");
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(AUTH_TOKEN),
    { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const signature = req.headers.get("X-Twilio-Signature") ?? "";
  // Twilio signs the exact public URL it was configured with.
  const url = Deno.env.get("WEBHOOK_PUBLIC_URL") ?? req.url;

  if (!(await validTwilioSignature(url, params, signature))) {
    return new Response("Invalid signature", { status: 403 });
  }

  const from = params.get("From") ?? "";
  const body = params.get("Body") ?? "";
  const kind = classifyKeyword(body);

  if (kind && from) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supabase.from("customer")
      .update({ opted_out: kind === "stop" })
      .eq("phone", from);
  }

  // Empty TwiML: acknowledge without sending an auto-reply (Twilio sends its
  // own carrier-mandated STOP/START confirmation).
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "content-type": "text/xml" },
  });
});
