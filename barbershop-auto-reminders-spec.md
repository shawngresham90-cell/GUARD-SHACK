# Chair Cash — Fully Automatic Text Reminders (Spec)

This is the plan for upgrading Chair Cash so reminder texts go out **on their
own** — even when her phone is locked and the app is closed. Today the app
sends *one-tap* reminders (she taps, her Messages app opens pre-filled). True
hands-off sending needs a small always-on service plus an SMS provider. This
document spells out exactly what that takes, what it costs, and the decisions
she needs to make before we build it.

---

## 1. Why a backend is needed

The current app is a single HTML file that runs in her browser and stores data
on her phone. A web page can't:

- run on a schedule when it's closed, and
- send SMS to arbitrary phone numbers.

So "automatic" requires two new pieces that the app doesn't have:

1. **A server that wakes up on a timer** (e.g. every 15 min) and decides who
   to text.
2. **An SMS provider** (Twilio or similar) that actually delivers the message
   from a real phone number.

---

## 2. Architecture (proposed)

```
┌─────────────────┐      sync appts/customers      ┌──────────────────────┐
│  Chair Cash app │ ─────────────────────────────► │  Cloud database       │
│  (her phone)    │ ◄───────────────────────────── │  (Supabase/Firebase)  │
└─────────────────┘      reminder send-log         └──────────┬───────────┘
                                                               │ reads "who's due"
                                                    ┌──────────▼───────────┐
                                                    │  Scheduler / worker   │
                                                    │  (cron every 15 min)  │
                                                    └──────────┬───────────┘
                                                               │ send SMS
                                                    ┌──────────▼───────────┐
                                                    │  Twilio (A2P 10DLC)   │
                                                    └──────────┬───────────┘
                                                               │ text + opt-out
                                                    ┌──────────▼───────────┐
                                                    │  Customer's phone     │
                                                    └──────────────────────┘
```

**Components to build/host:**

| Piece | Recommended | Job |
|-------|-------------|-----|
| Cloud database | Supabase (free tier) | Holds customers + appointments so the server can see them. The app syncs to it. |
| Scheduler/worker | Supabase Edge Function on a cron, or a tiny Cloudflare Worker | Every 15 min: find appointments due tomorrow + clients running late, send their reminder, mark it sent so it never double-texts. |
| SMS provider | Twilio | Owns the sending phone number, delivers texts, handles `STOP`/opt-out. |
| Inbound handling | Twilio webhook → worker | Logs replies and honors `STOP`/`START` so we never text someone who opted out. |

This keeps the existing app mostly as-is — we add a "sync to cloud" layer and
the offline single-file mode keeps working as a fallback.

---

## 3. Reminder rules (carried over from the current app)

- **Day-before:** for each appointment booked for *tomorrow*, send once in the
  early evening (e.g. 6 PM her local time).
- **Running late:** if an appointment is still `booked` and its time passed by
  more than X minutes (default 10), send a "still coming?" text once.
- Each appointment is texted **at most once per reminder type** — the server
  records `dayBeforeSentAt` / `lateSentAt` so a restart can't re-spam anyone.
- Templates reuse the existing `{name} {time} {service} {shop}` tokens she can
  already edit in Settings.

---

## 4. Costs (US, as of 2026)

Business texting in the US now legally requires **A2P 10DLC registration** —
this isn't optional and applies even to a one-person shop sending from an app.

| Item | Typical cost |
|------|--------------|
| Brand registration (sole proprietor) | ~$4 one-time |
| Campaign registration | ~$15–17 one-time |
| Campaign monthly fee | ~$1.50–$10 / month |
| Twilio phone number | ~$1.15 / month |
| Per-text Twilio fee | ~$0.0079 / SMS |
| Carrier surcharge per text | ~$0.003–0.005 / SMS |

**Realistic monthly bill for a single chair** (say ~200 reminders/month):
roughly **$5–$15/month**, plus the one-time ~$20 registration. Hosting
(Supabase free tier, Cloudflare Worker free tier) is **$0** at this volume.

> Heads-up on timing: the **campaign approval currently takes ~10–15 days**, so
> there's a setup wait before the first automatic text can go out.

---

## 5. Compliance (must-haves, not optional)

- **A2P 10DLC registration** before sending (see above).
- **Opt-out:** every message must honor `STOP`; first message should make the
  sender identity clear. Twilio handles `STOP`/`START` automatically once
  configured — we just must not bypass it.
- **Consent:** she should only text customers who gave a number expecting
  reminders. We'll add a small "OK to text" checkbox on the customer record so
  it's explicit.
- **Quiet hours:** no texts before ~8 AM / after ~9 PM local.

---

## 6. What I need from her to build it

1. **Phone/region** — confirm US (rules differ by country).
2. **A Twilio account** (she owns it, so the number + billing are hers) — I can
   walk her through signup, or set it up and hand over the login.
3. **Business info for A2P registration** — legal name, address, EIN *or* SSN
   for sole-proprietor registration.
4. **Budget OK** — confirm the ~$5–15/mo + ~$20 setup is acceptable.
5. **Which reminders to automate** — day-before only, late only, or both.

---

## 7. Suggested build order

1. **Phase 1 — Cloud sync.** Add Supabase, sync customers/appointments, keep
   offline mode as fallback. (No texting yet; low risk.)
2. **Phase 2 — Twilio + registration.** Set up the account, register the brand
   and campaign, wire the send + opt-out webhook.
3. **Phase 3 — Scheduler.** Cron worker that applies the rules in §3, with a
   "dry run / preview" mode she can watch for a few days before it goes live.
4. **Phase 4 — Dashboard.** Show sent/failed/opted-out per appointment inside
   the app so she can see what went out.

---

## 8. Lower-cost / no-backend alternatives (if she'd rather not)

- **Keep one-tap** (today's feature) — free, she taps to send.
- **Native scheduler apps** — some phones/Shortcuts can schedule a recurring
  reminder *to herself* to do the texting; still manual send but nags her.
- **Calendar invites** instead of texts — if clients use calendars, an
  emailed invite with an alert is free and needs no SMS registration.

---

### Sources
- [Twilio — A2P 10DLC pricing and fees](https://help.twilio.com/articles/1260803965530-What-pricing-and-fees-are-associated-with-the-A2P-10DLC-service-)
- [A2P 10DLC in 2026: What It Costs, Who Needs It](https://tuco.ai/a2p-10dlc)
- [Twilio — A2P 10DLC registration quickstart](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/quickstart)
