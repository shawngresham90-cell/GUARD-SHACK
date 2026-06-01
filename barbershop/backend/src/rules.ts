// rules.ts — pure reminder decision logic (Stories 3.2, 3.3, 3.4).
// No I/O here: inputs -> decisions. This is what the unit tests exercise and
// what the scheduler calls. Keeping it pure is the project's core testing rule
// (see ../../bmad/architecture.md → Coding Standards & Testing).

export type ReminderType = "day_before" | "late";

export interface Settings {
  timezone: string; // IANA, e.g. "America/New_York"
  quiet_start: string; // "HH:MM"
  quiet_end: string; // "HH:MM"
  day_before_hour: number; // 0-23
  late_threshold_min: number; // minutes past start_at
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  ok_to_text: boolean;
  opted_out: boolean;
}

export interface Appointment {
  id: string;
  customer_id: string | null;
  start_at: string; // ISO timestamp
  service: string | null;
  status: string; // 'booked' | 'done' | 'cancelled'
  day_before_sent_at: string | null;
  late_sent_at: string | null;
}

export interface Decision {
  appointment: Appointment;
  customer: Customer;
  type: ReminderType;
}

/** "HH:MM" -> minutes since midnight. */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** Wall-clock parts of `date` in a given IANA timezone. */
export function zonedParts(date: Date, timeZone: string): {
  year: number; month: number; day: number; hour: number; minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") p[part.type] = part.value;
  }
  // "24" can appear for midnight in some environments; normalize to 0.
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour, minute: Number(p.minute),
  };
}

/** Local minutes-since-midnight for `date` in the shop timezone. */
export function minutesOfDay(date: Date, timeZone: string): number {
  const { hour, minute } = zonedParts(date, timeZone);
  return hour * 60 + minute;
}

/** YYYY-MM-DD of `date` in the shop timezone. */
export function localDateStr(date: Date, timeZone: string): string {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** True if `now` is within [quiet_end, quiet_start) — i.e. sending is allowed. */
export function withinQuietHours(now: Date, s: Settings): boolean {
  const cur = minutesOfDay(now, s.timezone);
  const start = hmToMinutes(s.quiet_start); // allowed window opens
  const end = hmToMinutes(s.quiet_end); // allowed window closes
  // Allowed window is [quiet_start, quiet_end). Outside it = quiet (no send).
  return cur >= start && cur < end;
}

function sendable(c: Customer | undefined): c is Customer {
  return !!c && c.ok_to_text && !c.opted_out && !!c.phone;
}

/**
 * Decide which reminders to send right now. Pure: given the current time,
 * settings, and the candidate appointments/customers, returns the list of
 * sends. Quiet hours and consent/opt-out are enforced here.
 */
export function decideReminders(
  now: Date,
  settings: Settings,
  appts: Appointment[],
  customersById: Map<string, Customer>,
): Decision[] {
  const out: Decision[] = [];
  // Quiet hours gate (Story 3.4): outside the allowed window, send nothing.
  if (!withinQuietHours(now, settings)) return out;

  const today = localDateStr(now, settings.timezone);
  const nowMin = minutesOfDay(now, settings.timezone);

  for (const a of appts) {
    if (a.status !== "booked") continue;
    const c = a.customer_id ? customersById.get(a.customer_id) : undefined;
    if (!sendable(c)) continue;

    const start = new Date(a.start_at);
    const apptDay = localDateStr(start, settings.timezone);

    // Day-before (Story 3.2): appt is tomorrow, it's at/after day_before_hour,
    // and we haven't sent the day-before reminder yet.
    if (!a.day_before_sent_at) {
      const tomorrow = localDateStr(new Date(now.getTime() + 86400000), settings.timezone);
      if (apptDay === tomorrow && nowMin >= settings.day_before_hour * 60) {
        out.push({ appointment: a, customer: c, type: "day_before" });
        continue; // one reminder per appointment per run
      }
    }

    // Running-late (Story 3.3): appt is today, its start passed by more than
    // the threshold, and we haven't sent the late reminder yet.
    if (!a.late_sent_at && apptDay === today) {
      const lateBy = (now.getTime() - start.getTime()) / 60000;
      if (lateBy > settings.late_threshold_min) {
        out.push({ appointment: a, customer: c, type: "late" });
      }
    }
  }
  return out;
}
