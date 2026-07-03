// src/modules/hos/HosShell.tsx
//
// Composition contract (FR21, AR19 — load-bearing).
//
// The ONLY legal parent for routes under /hos/* (per architecture.md:725,
// :1090). Every HOS screen wraps in <HosShell> so that the canonical HOS
// footer disclaimer (see HOS_FOOTER in src/core/disclaimers.ts) is rendered
// as a permanent sibling of children — impossible to forget by construction.
//
// Enforcement: scripts/ci/check-rods-grid.ts uses the `data-hos-screen`
// attribute (rendered below) and the static tag name `HosShell` to scope
// the RODS-grid heuristic (FR62) to HOS subtrees only.

import type { ReactNode } from 'react';
import { Disclaimer } from '@/components/Disclaimer';

export function HosShell({ children }: { children: ReactNode }) {
  return (
    <div data-hos-screen>
      {children}
      <Disclaimer kind="hosFooter" />
    </div>
  );
}
