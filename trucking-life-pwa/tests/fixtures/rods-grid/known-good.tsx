// tests/fixtures/rods-grid/known-good.tsx
//
// Structural pass fixture for scripts/ci/check-rods-grid.ts.
// <HosShell> renders a plain-English daily summary — no grid layout.
// Scanner should return [].

import { HosShell } from '@/modules/hos';

export function KnownGoodHosScreen() {
  return (
    <HosShell>
      <h2>Today's summary</h2>
      <p>Total drive: 8h 12m</p>
      <p>Total on-duty: 11h 03m</p>
      <p>Remaining cycle: 39h 57m</p>
    </HosShell>
  );
}
