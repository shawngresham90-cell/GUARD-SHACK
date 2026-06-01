// twilio.ts — shared Twilio send helper (Story 2.3).
// Uses the REST API directly (no SDK) so it runs on Deno/Edge with no deps.
// Credentials come from secrets, never from git.

const SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const FROM = Deno.env.get("TWILIO_FROM_NUMBER") ?? "";

/** Send one SMS; returns the Twilio message SID. Throws on failure. */
export async function sendSms(to: string, body: string): Promise<string> {
  if (!SID || !TOKEN || !FROM) {
    throw new Error("Twilio not configured (set TWILIO_* secrets)");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
  const form = new URLSearchParams({ To: to, From: FROM, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${SID}:${TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${data.message ?? "send failed"}`);
  return data.sid as string;
}

/** Classify an inbound SMS body for opt-out handling (Story 2.3). */
export function classifyKeyword(body: string): "stop" | "start" | null {
  const t = body.trim().toUpperCase();
  if (["STOP", "STOPALL", "STOP ALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(t)) return "stop";
  if (["START", "YES", "UNSTOP"].includes(t)) return "start";
  return null;
}
