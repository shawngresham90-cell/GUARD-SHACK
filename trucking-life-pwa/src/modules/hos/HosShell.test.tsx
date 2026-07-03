// src/modules/hos/HosShell.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HosShell } from './HosShell';
// Index re-export reachability check (AC3):
import { HosShell as HosShellViaIndex } from '@/modules/hos';

describe('<HosShell>', () => {
  it('renders the hosFooter Disclaimer as a sibling of plain-text children', () => {
    render(
      <HosShell>
        <p>Personal duty log entry</p>
      </HosShell>,
    );
    expect(screen.getByText('Personal duty log entry')).toBeInTheDocument();
    expect(document.querySelector('[data-disclaimer="hosFooter"]')).not.toBeNull();
  });

  it('renders the hosFooter even when children is null', () => {
    render(<HosShell>{null}</HosShell>);
    expect(document.querySelector('[data-disclaimer="hosFooter"]')).not.toBeNull();
  });

  it('renders the hosFooter when children is a fragment of multiple elements', () => {
    render(
      <HosShell>
        <h2>Today</h2>
        <p>Drove 8 hours, on-duty 11 hours</p>
      </HosShell>,
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Drove 8 hours, on-duty 11 hours')).toBeInTheDocument();
    expect(document.querySelector('[data-disclaimer="hosFooter"]')).not.toBeNull();
  });

  it('stamps the data-hos-screen attribute onto the wrapper element (scanner anchor)', () => {
    const { container } = render(
      <HosShell>
        <p>x</p>
      </HosShell>,
    );
    expect(container.firstChild).toHaveAttribute('data-hos-screen');
  });

  it('is reachable via the module index re-export', () => {
    // Single assertion to verify AC2: cross-module consumers can import via
    // @/modules/hos rather than the deep path. Same component, same behavior.
    expect(HosShellViaIndex).toBe(HosShell);
  });
});
