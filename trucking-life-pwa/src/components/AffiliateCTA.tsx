// src/components/AffiliateCTA.tsx
//
// Composition contract (FR15, FR34, FR35, NFR-C2 — load-bearing).
//
// The ONLY way to render an affiliate CTA in this codebase. Every <a> or
// <button> whose href points to an affiliate URL pattern (truckparkingclub.com,
// stan.store/shawn, future fuel-card / load-board / insurance hosts) must be
// inside an <AffiliateCTA> subtree. The FTC disclosure is rendered as an
// enforced sibling of children — impossible to forget by construction.
//
// Enforcement: scripts/ci/check-ftc-disclosure.ts (TypeScript Compiler API
// AST walk) fails the `ftc-disclosure` CI job on violation.
//
// Future composition: when Story 4.1 lands the full affiliate_slots schema,
// this component's `slot` prop widens. Adding optional fields is BC.

import type { ReactNode } from 'react';
import type { AffiliateSlot } from '@/core/types/affiliate';
import { Disclaimer } from './Disclaimer';

export function AffiliateCTA({ slot, children }: { slot: AffiliateSlot; children: ReactNode }) {
  return (
    <div data-testid="affiliate-cta-block" data-slot-id={slot.id}>
      {children}
      <Disclaimer kind="ftc" />
    </div>
  );
}
