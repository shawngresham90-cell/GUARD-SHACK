# Two-device test checklist (spike success tests)

Preconditions: SETUP.md completed; Netlify deploy preview open on
**Phone A (carrier 1)** and **Phone B (carrier 2 or different network)**.
Use `…/live-radio-lab/` on the preview URL (HTTPS — required for mic).

| # | Test | Steps | Pass criteria | Result |
|---|------|-------|---------------|--------|
| 1 | Cross-network join | Both phones: acknowledge safety gate → handle → **Talk + listen** → join Channel 19 | Both show **Connected**, count = "2 on channel", both appear in the member list | ☐ |
| 2 | Audio clarity | A holds PTT, speaks 10s; then B | Other phone hears clearly; speaking dot pulses next to the talker | ☐ |
| 3 | **Mic hard-off on release** | A releases PTT mid-sentence; B keeps listening 5s | Audio stops immediately (≤ a syllable); "ON AIR" clears; no residual audio | ☐ |
| 4 | Reconnect | A: airplane mode 5s → off | A shows **Reconnecting…** then **Connected/Reconnected**; B's roster recovers; A can PTT again | ☐ |
| 5 | Fail-soft | Temporarily set `config.js` tokenEndpoint to null (or unset function secrets) and reload | Calm "Live Radio is offline" card + retry; no crash, no console spew | ☐ |
| 6 | No secrets in client | View-source / DevTools on the preview: search for the LiveKit API key & secret | Zero hits; only the public token endpoint URL is visible | ☐ |
| 7 | Mobile + accessibility | One-thumb use; keyboard-only run-through on desktop (Tab/Space); screen reader spot-check | PTT reachable one-handed; Space keys/unkeys; status changes announced; focus visible everywhere | ☐ |
| 8 | Usage & cost | After tests, read LiveKit dashboard usage | Participant-minutes + bandwidth recorded in SPIKE_REPORT §Cost; still $0 | ☐ |
| 9 | Architecture headroom | Review: same stack does larger rooms + server moderation? | RemoveParticipant kick works via curl (SETUP §5); room caps/grants documented; no rewrite implied | ☐ |

## Additional behaviors worth checking (not gating)

- Channel switch (I-40 ↔ Ch 19): old room left, new roster appears, PTT still works.
- **Listen-only mode:** join listen-only → PTT shows "LISTEN ONLY", hearing works.
- **Mic permission denied:** deny the prompt → clear message + automatic listen-only fallback.
- **Channel busy:** while A talks, B's PTT shows "CHANNEL BUSY" and is disabled.
- **Local mute:** B mutes A → A's audio silent on B only; unmute restores.
- **Report:** report a user → "Reported" confirmation; entry appears in function logs.
- Backgrounding the tab or switching apps mid-PTT releases the key (never stuck on air).
- Reserved handles (`911`, `admin`, `dispatch`…) rejected at join and by the function.

## Kill-criteria watch items (from the approval)

Note anything observed on: unreliable mobile audio, background-audio
problems (iOS Safari especially), unacceptable permission friction,
moderation gaps, safety impracticality, or TLWS destabilization risk.
These feed the final go / revise / kill recommendation.
