# TLWS Live Radio Lab — Spike report

Phase 0.5 deliverable. Sections marked **[owner test pending]** need the
two-device session (requires the owner-provisioned LiveKit dev project —
see SETUP.md); everything else is complete.

## 1. Security review

**Verified in this spike:**
- **No secrets in the client.** The repo and client bundle contain no
  LiveKit key/secret (grep-verified; `config.js` holds only a public
  endpoint URL, currently `null`). Secrets exist solely as Supabase
  function env vars, which are never committed.
- **Short-TTL scoped tokens.** 10-minute HS256 JWTs, scoped to one room;
  listen mode gets subscribe-only grants; talk mode adds `canPublish`
  restricted to `microphone`. No admin grants ever reach a client.
- **Kick path privilege-gated.** `action:"kick"` requires the `MOD_KEY`
  header; the room-admin token it uses is minted server-side with a 60s
  TTL and never returned to any client.
- **Handle hygiene.** Format-validated (3–20 chars) and reserved-name
  blocked (`admin`, `911`, `dispatch`, `police`, …) on both client and
  server — the server is authoritative.
- **Rate limiting.** Per-IP join throttle (10/min) in the function.
  *Known limitation:* in-memory per isolate — best-effort only. A durable
  store (Supabase table / KV) is a Phase 1 item.
- **CORS** locked to `ALLOWED_ORIGIN` (env), defaulting open only when
  unset — set it for any real test.
- **Transport:** WebRTC media is DTLS-SRTP encrypted; signaling and token
  fetch are TLS. The page refuses to present as usable in a non-secure
  context.
- **Privacy/retention:** no recording, no transcripts, no text chat, no
  DB writes; guest handle lives in `sessionStorage`; reports and token
  issuance are function-log-only (minimal technical logs, per approval).

**Residual risks (accepted for spike, revisit in Phase 1):** durable rate
limiting; abuse of the report action (log-flood) — mitigated by size caps;
no CAPTCHA/turnstile on token minting; single-speaker rule is courtesy
(client-side) not enforced server-side.

## 2. Accessibility review

- **Keyboard:** full flow works keyboard-only (verified via automated
  browser test): Tab reaches the safety gate button first; Space is
  hold-to-talk with `keydown/keyup` (repeat-guarded); focus rings are
  high-contrast amber and never suppressed.
- **Screen reader:** `role="dialog"` safety gate; `role="status"` +
  polite `aria-live` regions announce connect/reconnect/on-air tersely
  (kept minimal so announcements don't fight live audio); PTT has an
  explicit `aria-label` and `aria-pressed`; mute/report buttons carry
  per-user labels.
- **Not color-alone:** speaking state adds "— talking" text to the dot;
  connection state is always words, not just the status dot.
- **Reduced motion:** the speaking-dot pulse is disabled under
  `prefers-reduced-motion`.
- **Mobile/one-handed:** single column, ≥44px targets, PTT is a
  60vw-capped thumb target in the lower half; viewport-fit for notches.
- **[owner test pending]** VoiceOver/TalkBack pass on real devices.

## 3. Bundle impact

Additive only — nothing else on the TLWS site loads any of this.

| File | Raw | Gzip |
|------|-----|------|
| `vendor/livekit-client-2.20.2.umd.js` | 546 KB | **135 KB** |
| `app.js` | 16.8 KB | 5.5 KB |
| `index.html` | 10.6 KB | 3.6 KB |
| `config.js` | 0.8 KB | 0.5 KB |
| **Route total** | ~574 KB | **~145 KB** |

Comparable to a mid-size image; loaded only on `/live-radio-lab/`. If
Phase 1 wants it smaller, a bundler + tree-shaken ESM import of
`livekit-client` can cut this meaningfully.

## 4. Usage & projected cost

- **Spike spend: $0.** Nothing provisioned by this PR; LiveKit dev tier
  and Supabase Edge Functions free tier are sufficient for all success
  tests.
- **[owner test pending]** Actual participant-minutes/bandwidth from the
  LiveKit dashboard after the two-device session (record here).
- **Projection model (verify against current LiveKit pricing before any
  paid decision):** CB usage is broadcast-shaped — 1 publisher + N
  subscribers of one Opus audio stream (~24–32 kbps). Cost scales with
  **listener-minutes**. Order-of-magnitude: 50 concurrent listeners for
  1 hour/day ≈ 90k participant-minutes/month — within or near entry
  paid tiers; audio-only keeps bandwidth ~1/50th of video workloads.
  A hard monthly budget cap + room participant caps should be set before
  any public exposure (owner decision, already flagged in Phase 0).

## 5. Reused from PR #63 (concepts, re-implemented)

- Channel taxonomy (nationwide + interstate) and CB framing/copy tone.
- PTT interaction pattern (hold via pointer/touch/Space; transmit visual).
- Connection-status + roster + speaking-dot UX.
- Dark amber/red visual language (rebuilt mobile-first).
- The safety-first stance, now hardened into a blocking safety gate.

## 6. Discarded from PR #63

- Full-mesh WebRTC and manual SDP/ICE plumbing → LiveKit SFU.
- C/libwebsockets signaling server (+ nginx/systemd/Docker deploy stack)
  → managed SFU + one Edge Function.
- Pipe-delimited WS protocol → SFU presence/events + tiny JSON data msgs.
- Always-on text chat → removed entirely (safety + approval).
- `ws://host:7681` hardcoding → env-configured HTTPS/WSS endpoints.
- STUN-only ICE → provider-managed STUN/TURN.

## 7. Success-test status

| # | Test | Status |
|---|------|--------|
| 1 | Two phones, separate networks, one channel | **[owner test pending]** (needs LiveKit dev project) |
| 2 | Clear audio both ways | **[owner test pending]** |
| 3 | Mic hard-off on PTT release | Implemented (synchronous track disable) — device-verify pending |
| 4 | Reconnect after network loss | Implemented (SDK auto-reconnect + UI states + capped retries) — device-verify pending |
| 5 | Fail-soft when LiveKit unavailable | **PASS** (automated browser test: null-config and error paths render the offline card) |
| 6 | No secrets in client bundles | **PASS** (grep of repo + served bundle; secrets are env-only by design) |
| 7 | Simple, accessible mobile interaction | **PASS (automated + review)**; real-device SR pass pending |
| 8 | Usage measured, cost documented | Model documented; dashboard numbers **[owner test pending]** |
| 9 | Larger rooms + moderation without rewrite | **PASS (by design)**: rooms/grants/kick are server-side; scaling knobs are config, not architecture |

## 8. Recommendation

**Provisional GO — pending device tests.** Everything buildable without
credentials is built and verified; the architecture met every structural
requirement (fail-soft, no-secrets, moderation path, scalability headroom)
with $0 spent. The remaining risk is empirical mobile behavior (tests 1–4,
7, 8), which requires the owner's LiveKit dev project and two phones.
If those pass without hitting the kill criteria (especially iOS background
audio and permission friction), proceed to Phase 1 planning. If mobile
audio or permission friction fails, revise (evaluate an alternative
managed provider) before any further build.
