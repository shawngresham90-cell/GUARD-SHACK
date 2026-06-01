// scheduler — Supabase Edge Function (cron, ~every 15 min). Stories 3.1–3.4.
//
// Pulls booked appointments + their customers + settings, asks the pure rule
// engine what to send, then either logs a dry-run row (dry_run = true) or sends
// via Twilio. Sends are idempotent: the matching *_sent_at is set together with
// the message_log row, so a re-run never double-texts (NFR2 / FR5).
//
// Deploy: supabase functions deploy scheduler
// Schedule (SQL): select cron.schedule('chaircash-15m','*/15 * * * *',
//   $$ select net.http_post(url:='<func-url>', headers:='{"Authorization":"Bearer <anon>"}'::jsonb) $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decideReminders, type Appointment, type Customer, type Settings } from "../../src/rules.ts";
import { renderTemplate } from "../../src/templates.ts";
import { sendSms } from "../_shared/twilio.ts";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const summary = { considered: 0, sent: 0, dry_run: 0, failed: 0, skipped: 0 };

  // Process each owner independently (multi-tenant safe).
  const { data: settingsRows, error: sErr } = await supabase.from("settings").select("*");
  if (sErr) return json({ error: sErr.message }, 500);

  for (const s of settingsRows ?? []) {
    const settings: Settings = {
      timezone: s.timezone,
      quiet_start: typeof s.quiet_start === "string" ? s.quiet_start.slice(0, 5) : "08:00",
      quiet_end: typeof s.quiet_end === "string" ? s.quiet_end.slice(0, 5) : "21:00",
      day_before_hour: s.day_before_hour,
      late_threshold_min: s.late_threshold_min,
    };

    const { data: appts } = await supabase
      .from("appointment").select("*").eq("owner_id", s.owner_id).eq("status", "booked");
    const { data: custs } = await supabase
      .from("customer").select("*").eq("owner_id", s.owner_id);

    const byId = new Map<string, Customer>((custs ?? []).map((c: Customer) => [c.id, c]));
    const decisions = decideReminders(now, settings, (appts ?? []) as Appointment[], byId);
    summary.considered += decisions.length;

    for (const d of decisions) {
      const tpl = d.type === "day_before" ? s.day_before_template : s.late_template;
      const body = renderTemplate(tpl, {
        name: d.customer.name, startAt: d.appointment.start_at,
        service: d.appointment.service, shop: s.shop_name, timezone: settings.timezone,
      });
      const guardCol = d.type === "day_before" ? "day_before_sent_at" : "late_sent_at";

      if (s.dry_run) {
        // Preview only (Story 3.4): record what WOULD send; no Twilio call,
        // and DO NOT set the guard, so it appears each run until you go live.
        await supabase.from("message_log").insert({
          owner_id: s.owner_id, appointment_id: d.appointment.id,
          type: d.type, status: "dry_run", body,
        });
        summary.dry_run++;
        continue;
      }

      try {
        const sid = await sendSms(d.customer.phone!, body);
        // Set guard + log together so a crash can't double-send (idempotency).
        await supabase.from("appointment").update({ [guardCol]: now.toISOString() })
          .eq("id", d.appointment.id);
        await supabase.from("message_log").insert({
          owner_id: s.owner_id, appointment_id: d.appointment.id,
          type: d.type, status: "sent", provider_sid: sid, body,
        });
        summary.sent++;
      } catch (e) {
        // Leave guard null so the next run retries (architecture.md error handling).
        await supabase.from("message_log").insert({
          owner_id: s.owner_id, appointment_id: d.appointment.id,
          type: d.type, status: "failed", body,
        });
        summary.failed++;
        console.error("send failed", d.appointment.id, (e as Error).message);
      }
    }
  }

  return json({ ran_at: now.toISOString(), ...summary });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "content-type": "application/json" },
  });
}
