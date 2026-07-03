// src/components/AffiliateCTA.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AffiliateCTA } from './AffiliateCTA';
import type { AffiliateSlot } from '@/core/types/affiliate';

const TEST_SLOT: AffiliateSlot = {
  id: 'tpc-test-slot',
  bookingUrl: 'https://truckparkingclub.com/book?code=SHAWN20',
};

describe('<AffiliateCTA>', () => {
  it('renders FTC disclosure as a sibling of simple link children', () => {
    render(
      <AffiliateCTA slot={TEST_SLOT}>
        <a href={TEST_SLOT.bookingUrl}>Book with SHAWN20</a>
      </AffiliateCTA>,
    );
    expect(screen.getByText('Book with SHAWN20')).toBeInTheDocument();
    expect(document.querySelector('[data-disclaimer="ftc"]')).not.toBeNull();
  });

  it('renders FTC disclosure even when children is null', () => {
    render(<AffiliateCTA slot={TEST_SLOT}>{null}</AffiliateCTA>);
    expect(document.querySelector('[data-disclaimer="ftc"]')).not.toBeNull();
  });

  it('renders FTC disclosure when children is a fragment of multiple elements', () => {
    render(
      <AffiliateCTA slot={TEST_SLOT}>
        <a href={TEST_SLOT.bookingUrl}>Book</a>
        <span>Reserved parking ahead</span>
      </AffiliateCTA>,
    );
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.getByText('Reserved parking ahead')).toBeInTheDocument();
    expect(document.querySelector('[data-disclaimer="ftc"]')).not.toBeNull();
  });

  it('stamps slot.id onto data-slot-id for analytics + scanner targeting', () => {
    const { container } = render(
      <AffiliateCTA slot={TEST_SLOT}>
        <a href={TEST_SLOT.bookingUrl}>Book</a>
      </AffiliateCTA>,
    );
    expect(container.firstChild).toHaveAttribute('data-slot-id', 'tpc-test-slot');
  });

  it('marks the wrapper with data-testid for stable test targeting', () => {
    const { container } = render(
      <AffiliateCTA slot={TEST_SLOT}>
        <a href={TEST_SLOT.bookingUrl}>Book</a>
      </AffiliateCTA>,
    );
    expect(container.firstChild).toHaveAttribute('data-testid', 'affiliate-cta-block');
  });
});
