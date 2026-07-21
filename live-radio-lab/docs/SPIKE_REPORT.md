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

## 7. Success-test status — actual two-device results

Tested on two phones on separate networks against the live dev
environment (LiveKit Cloud free tier + deployed Edge Function).

| # | Test | Result | Evidence |
|---|------|--------|----------|
| — | End-to-end stack (token → LiveKit connect) | **PASS** | Doctor page check 6: real `Room.connect` succeeded (joined + left) |
| 1 | Both devices join same channel | **PASS (with caveat)** | Both reached Connected — but only after **several connection attempts**; auto-retry recovered it each time |
| 2 | Listen-only mode | **PASS** | Rejoined listen-only; heard audio; button read "LISTEN ONLY" |
| 3 | PTT audio both directions | **FAIL — one-way** | A→B audio clear ✅; **B→A not heard** ❌ |
| 4 | Mic disables immediately on release | **PASS** | A released mid-sentence → audio stopped immediately |
| 5 | One-active-speaker lockout | **FAIL / inconclusive** | "CHANNEL BUSY" did not show. Likely a downstream symptom of #3 (the indicator fires on the other party's inbound audio, which failed B→A) rather than an independent defect |
| 6 | Reconnection after network loss | **Not tested** | (airplane-mode test not run this session) |
| 7 | Local mute | **Not tested** | — |
| 8 | Report action | **Not tested** | — |
| 9 | Offline / fail-soft | **PASS** | Verified repeatedly during activation — offline card + retry shown on every misconfiguration, no crashes |
| 10 | No secrets in client bundle | **PASS** | Doctor + repo scan; only the public token-endpoint + public `sfuUrl` are ever exposed |
| 11 | Mobile + keyboard accessibility | **PASS (automated + review)** | Real-device screen-reader pass still pending |
| 12 | Usage measured / cost | **$0 confirmed**; dashboard minutes **pending** | Free tier only; owner to record participant-minutes from LiveKit dashboard |

### Observed issues (spike's primary findings)

1. **One-way audio (B→A silent) — highest-priority open issue.** With an
   SFU, this means B's mic track did not publish to the server, or A did
   not subscribe to B. Leading hypotheses (Phase 1 to isolate):
   mobile/iOS Safari getUserMedia re-enable after the join-time
   enable→mute dance not republishing; a mic-permission state difference
   on device B; or a media path needing TURN (LiveKit provides it —
   verify it engaged). This is a **known, fixable class of WebRTC/mobile
   problem**, not an architectural limitation of the SFU approach.
2. **Flaky first-connect.** Join succeeded only after several attempts
   (auto-retry masked it). Needs root-causing (token TTL/clock skew,
   cold function, or SDK connect options) and a first-connect reliability
   target before public exposure.
3. **Single-speaker lockout unverified** (blocked by #3 above); re-test
   once two-way audio works.

### Operational findings from activation (worth keeping)

- **Supabase "Verify JWT" reverts to ON on every dashboard re-deploy** —
  silently breaks the endpoint (401 before our code runs). Must be
  re-disabled after each deploy, or the function deployed via CLI where
  the flag is set once. Phase 1: deploy via CI, not the dashboard editor.
- A **204 preflight response must have a null body** — the original code
  threw on this and failed CORS; fixed in this branch.
- Config values are **typo-prone** (`.cloude` vs `.cloud`; `https` vs
  `wss`; key/secret swap). The added `doctor.html` caught each precisely
  and is worth keeping as an ops tool.

## 8. Recommendation — **REVISE**

**REVISE (not GO, not KILL).**

**Why not KILL:** the target architecture is *validated*. The full chain —
scoped token minting, LiveKit SFU connect, room join, fail-soft,
no-secrets, server-side moderation path, scalability headroom — works,
at **$0**, and one-way audio + instant mic-off + listen-only all
functioned. Nothing proved the approach unworkable.

**Why not GO:** two real defects block a clean pass — **one-way B→A
audio** and **unreliable first-connect** — and the checklist is
incomplete (reconnect, local mute, report untested; screen-reader and
cost-dashboard readings pending). Shipping toward Phase 1 on a
one-way-audio result would be premature.

**Recommended next actions (still $0, still spike-scoped, owner approval
required before any of it):**
1. Root-cause the one-way audio: add publish/subscribe state logging,
   confirm device B actually publishes a track (check B's own name shows
   a speaking dot locally when keyed), and confirm TURN relay engages on
   restrictive mobile networks.
2. Fix the mobile PTT publish path (most likely an iOS getUserMedia /
   track-republish issue) and re-test two-way audio.
3. Root-cause first-connect flakiness; set a reliability target.
4. Complete the untested checklist rows (reconnect, mute, report,
   screen-reader, dashboard cost) and re-run the full two-device pass.
5. Only after a clean re-test: move to Phase 1 planning.

If a focused revision does **not** achieve reliable two-way mobile audio,
*then* escalate to evaluating an alternative managed provider (Daily,
Agora, Twilio) before any further build — but that decision is not
warranted yet on this evidence.

**Guardrails unchanged:** no merge, no public launch, no paid plan, no
production DB writes, no Phase 1 build — this remains a draft PR pending
your decision.
