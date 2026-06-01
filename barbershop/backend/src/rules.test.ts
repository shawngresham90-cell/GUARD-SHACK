// rules.test.ts — unit tests for the pure rule engine (Deno test).
// Run: deno test backend/src/
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  decideReminders,
  withinQuietHours,
  type Appointment,
  type Customer,
  type Settings,
} from "./rules.ts";

const TZ = "America/New_York";
const settings: Settings = {
  timezone: TZ,
  quiet_start: "08:00",
  quiet_end: "21:00",
  day_before_hour: 18,
  late_threshold_min: 10,
};

const okCustomer: Customer = {
  id: "c1", name: "Sam", phone: "+15551230000", ok_to_text: true, opted_out: false,
};

function custMap(...cs: Customer[]) {
  return new Map(cs.map((c) => [c.id, c]));
}

function appt(over: Partial<Appointment>): Appointment {
  return {
    id: "a1", customer_id: "c1", start_at: "2026-06-02T14:00:00Z",
    service: "Cut", status: "booked",
    day_before_sent_at: null, late_sent_at: null, ...over,
  };
}

// --- quiet hours -----------------------------------------------------------
Deno.test("quiet hours: blocked at 22:00 local, allowed at 08:30 local", () => {
  // 22:00 EDT = 02:00Z next day
  assertEquals(withinQuietHours(new Date("2026-06-02T02:00:00Z"), settings), false);
  // 08:30 EDT = 12:30Z
  assertEquals(withinQuietHours(new Date("2026-06-02T12:30:00Z"), settings), true);
});

// --- day-before ------------------------------------------------------------
Deno.test("day-before: not before 18:00, fires at/after 18:00 local", () => {
  const a = appt({ start_at: "2026-06-03T15:00:00Z" }); // appt is "tomorrow"
  // now = 2026-06-02 17:00 EDT (21:00Z) -> before 18:00, no send
  let d = decideReminders(new Date("2026-06-02T21:00:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 0);
  // now = 2026-06-02 18:30 EDT (22:30Z) -> send one day_before
  d = decideReminders(new Date("2026-06-02T22:30:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 1);
  assertEquals(d[0].type, "day_before");
});

Deno.test("day-before: idempotent — not resent once day_before_sent_at set", () => {
  const a = appt({ start_at: "2026-06-03T15:00:00Z", day_before_sent_at: "2026-06-02T22:30:00Z" });
  const d = decideReminders(new Date("2026-06-02T22:45:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 0);
});

// --- running late ----------------------------------------------------------
Deno.test("late: 9 min late -> no send, 11 min late -> send", () => {
  const start = "2026-06-02T15:00:00Z"; // 11:00 EDT today
  const a = appt({ start_at: start });
  // 9 min after
  let d = decideReminders(new Date("2026-06-02T15:09:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 0);
  // 11 min after
  d = decideReminders(new Date("2026-06-02T15:11:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 1);
  assertEquals(d[0].type, "late");
});

Deno.test("late: idempotent once late_sent_at set", () => {
  const a = appt({ start_at: "2026-06-02T15:00:00Z", late_sent_at: "2026-06-02T15:11:00Z" });
  const d = decideReminders(new Date("2026-06-02T15:30:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 0);
});

// --- consent / opt-out -----------------------------------------------------
Deno.test("opted-out and non-consenting customers are skipped", () => {
  const a = appt({ start_at: "2026-06-02T15:00:00Z" });
  const optedOut: Customer = { ...okCustomer, opted_out: true };
  const noConsent: Customer = { ...okCustomer, ok_to_text: false };
  assertEquals(
    decideReminders(new Date("2026-06-02T15:30:00Z"), settings, [a], custMap(optedOut)).length, 0);
  assertEquals(
    decideReminders(new Date("2026-06-02T15:30:00Z"), settings, [a], custMap(noConsent)).length, 0);
});

// --- quiet hours suppresses an otherwise-due reminder ----------------------
Deno.test("quiet hours suppress a due late reminder; guard stays clear for retry", () => {
  const a = appt({ start_at: "2026-06-02T01:00:00Z" }); // 21:00 EDT prev day
  // now = 2026-06-02 02:00Z = 22:00 EDT -> quiet, no send
  const d = decideReminders(new Date("2026-06-02T02:00:00Z"), settings, [a], custMap(okCustomer));
  assertEquals(d.length, 0);
  // late_sent_at remains null (we never set it here), so a later run can send.
  assertEquals(a.late_sent_at, null);
});
