// Single render path for canonical disclaimer copy.
// Imports from src/core/disclaimers.ts; never inlines text.
//
// Composition rules (enforced by future-story CI gates):
//   - <AffiliateCTA> renders <Disclaimer kind="ftc"> as enforced sibling (Story 1.7, FR35)
//   - <HosShell>     renders <Disclaimer kind="hosFooter"> as permanent footer (Story 1.8, FR21)
//   - Parking results render <Disclaimer kind="parking"> with every result set (Story 2.11, FR17)
//   - First-launch HOS screen renders <Disclaimer kind="hosFull"> with min dwell (Story 3.3, FR19/FR20)

import { HOS_FULL, HOS_FOOTER, PARKING, FTC } from '@/core/disclaimers';

export type DisclaimerKind = 'hosFull' | 'hosFooter' | 'parking' | 'ftc';

const COPY: Record<DisclaimerKind, string> = {
  hosFull: HOS_FULL,
  hosFooter: HOS_FOOTER,
  parking: PARKING,
  ftc: FTC,
};

export function Disclaimer({ kind }: { kind: DisclaimerKind }) {
  return (
    <div data-disclaimer={kind} className="text-sm leading-relaxed text-neutral-400">
      {COPY[kind]}
    </div>
  );
}
