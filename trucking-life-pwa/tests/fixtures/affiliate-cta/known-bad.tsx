// tests/fixtures/affiliate-cta/known-bad.tsx
//
// Structural fail fixture for scripts/ci/check-ftc-disclosure.ts.
// The affiliate <a> is NOT wrapped in <AffiliateCTA> — scanner should
// return exactly one violation matching the truckparkingclub.com pattern.

export function KnownBadAffiliateCta() {
  return (
    <div>
      <a href="https://truckparkingclub.com/book?code=SHAWN20">Book with SHAWN20</a>
    </div>
  );
}
