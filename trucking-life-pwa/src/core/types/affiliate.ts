// src/core/types/affiliate.ts
//
// AffiliateSlot — minimal v1 shape consumed by <AffiliateCTA>.
//
// Story 4.1 ships the full affiliate_slots table schema (architecture.md:335):
//   vertical, image, copy, code, UTM, on/off, version
//
// At v1.7 the only consumers are:
//   - <AffiliateCTA> wrapper (needs `id` for data-slot-id attribute)
//   - manual / fixture call sites (need `bookingUrl` to populate the href)
//
// When Story 4.1 lands, this interface widens with optional fields plus
// a Vertical union. Adding optional fields is backward-compatible; consumers
// that only read `id` and `bookingUrl` keep working unchanged.

export interface AffiliateSlot {
  id: string;
  bookingUrl: string;
}
