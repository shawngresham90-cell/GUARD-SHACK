import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Disclaimer } from './Disclaimer';
import { HOS_FULL, HOS_FOOTER, PARKING, FTC } from '@/core/disclaimers';

describe('<Disclaimer>', () => {
  it('renders HOS_FULL when kind="hosFull"', () => {
    render(<Disclaimer kind="hosFull" />);
    expect(screen.getByText(HOS_FULL)).toBeInTheDocument();
  });

  it('renders HOS_FOOTER when kind="hosFooter"', () => {
    render(<Disclaimer kind="hosFooter" />);
    expect(screen.getByText(HOS_FOOTER)).toBeInTheDocument();
  });

  it('renders PARKING when kind="parking"', () => {
    render(<Disclaimer kind="parking" />);
    expect(screen.getByText(PARKING)).toBeInTheDocument();
  });

  it('renders FTC when kind="ftc"', () => {
    render(<Disclaimer kind="ftc" />);
    expect(screen.getByText(FTC)).toBeInTheDocument();
  });

  it('stamps the kind onto data-disclaimer for stable test/scan targeting', () => {
    const { container } = render(<Disclaimer kind="ftc" />);
    expect(container.firstChild).toHaveAttribute('data-disclaimer', 'ftc');
  });
});
