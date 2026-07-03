// tests/fixtures/rods-grid/known-bad-grid.tsx
//
// Structural fail fixture for scripts/ci/check-rods-grid.ts.
// <HosShell> contains a 24-cell horizontal grid — the exact RODS-grid
// pattern FR27/FR62 forbid. Scanner should return at least one violation
// citing grid-cols-24.

import { HosShell } from '@/modules/hos';

export function KnownBadHosGrid() {
  return (
    <HosShell>
      <div className="grid grid-cols-24">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
    </HosShell>
  );
}
