// tests/fixtures/affiliate-cta/known-good.tsx
//
// Structural pass fixture for scripts/ci/check-ftc-disclosure.ts.
// The affiliate <a> is wrapped in <AffiliateCTA> — scanner should return [].

import { AffiliateCTA } from '@/components/AffiliateCTA';

const slot = {
  id: 'tpc-fixture-good',
  bookingUrl: 'https://truckparkingclub.com/book?code=SHAWN20',
};

export function KnownGoodAffiliateCta() {
  return (
    <AffiliateCTA slot={slot}>
      <a href="https://truckparkingclub.com/book?code=SHAWN20">Book with SHAWN20</a>
    </AffiliateCTA>
  );
}
