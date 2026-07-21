# ADR-001: TLWS Live Radio Lab — Phase 0.5 spike architecture

**Status:** Accepted for spike only (owner-approved Phase 0.5). Not a Phase 1 commitment.
**Date:** 2026-07-21

## Context

TLWS Live Radio must become a native feature of the Trucking Life With Shawn
platform. The prior standalone prototype (PR #63, `corridor-radio/`) used a
bespoke C/libwebsockets signaling server and full-mesh WebRTC — an
architecture that cannot scale, cannot be centrally moderated, and cannot be
hosted on Netlify. The owner approved a $0, LiveKit-Cloud-dev-tier spike to
validate the target architecture before any Phase 1 build.

## Decision

1. **Media plane: LiveKit (SFU).** Each channel is a LiveKit room. The
   client uses the official `livekit-client` SDK (vendored UMD v2.20.2 —
   no build step exists in this repo, so no npm pipeline is introduced).
   No full-mesh transport anywhere.
2. **Control plane: one Supabase Edge Function**
   (`supabase/functions/live-radio-lab-token/`) with three actions:
   `token` (mint short-TTL room-scoped join token), `report` (log-only),
   `kick` (moderator capability, guarded by `MOD_KEY`). All LiveKit
   secrets live only in the function's environment.
3. **Frontend: isolated static route `/live-radio-lab/`** in the existing
   Netlify site. `noindex, nofollow`; linked from nowhere; additive files
   only. Configuration is a single value (`tokenEndpoint`) in
   `config.js`; `null` renders the fail-soft state, so the route is inert
   until the owner configures a dev environment.
4. **PTT model:** join with mic muted; hold-to-talk enables the track;
   release **synchronously disables the raw `MediaStreamTrack`** before the
   async SDK mute, so no audio can leak after release.
5. **Single-speaker courtesy lockout:** client-side only for the spike
   (PTT disabled while another active speaker is detected). Server-side
   enforcement is a Phase 1 item.
6. **Privacy defaults:** no recording, no transcripts, no text chat, guest
   handles in `sessionStorage` only, log-only reports, 10-minute tokens.

## Alternatives considered

- **Reuse PR #63's mesh for the spike** — rejected: it validates the wrong
  architecture and cannot be replaced cleanly (moderation/telemetry would
  be rebuilt from scratch).
- **mediasoup/Janus self-hosted** — rejected for spike: requires
  provisioning servers (violates $0 constraint) and heavy ops.
- **CDN `<script>` for livekit-client** — rejected: vendoring pins the
  version, keeps the site self-contained, and avoids a third-party CDN
  dependency at runtime.
- **Deploying the Edge Function now** — deliberately **not done**: the
  spike guardrails forbid production changes; the function ships as source
  + setup guide for the owner to deploy into a dev project.

## Consequences

- The page is fully fail-soft until an owner-provisioned LiveKit dev
  project + deployed Edge Function exist; success tests 1–4, 7–8 require
  that setup (see `TEST_CHECKLIST.md`).
- The vendored SDK adds ~135 KB gzipped to *this route only* (nothing else
  on the site loads it).
- The same architecture scales to Phase 1 (larger rooms, server-side
  moderation, more channels) without a rewrite — only the lab route's
  hardening and productization change.
