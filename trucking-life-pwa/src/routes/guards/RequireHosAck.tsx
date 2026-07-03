// src/routes/guards/RequireHosAck.tsx
//
// STUB — full 90-day re-ack logic lands in Story 3.2 (FR22).
//
// At v1.8, this guard exists so that:
//   - Story 1.10 (routes tree) can wire <RequireHosAck> around /hos/* without
//     waiting on Dexie / hos_meta plumbing;
//   - The architecture's named guard file (architecture.md:911) is in place
//     and reachable, with no "TODO add guard" placeholder rotting in the
//     routes tree.
//
// Story 3.2 fleshes this out with `useHosDisclaimerAck` (reads Dexie
// hos_meta.disclaimer_ack_at), comparing now() against the stored ack
// timestamp + 90-day window, and redirecting to /hos/disclaimer on
// stale/missing ack. Until then: pass through.

import type { ReactNode } from 'react';

export function RequireHosAck({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
