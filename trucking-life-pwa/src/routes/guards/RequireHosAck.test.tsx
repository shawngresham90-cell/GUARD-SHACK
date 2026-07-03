// src/routes/guards/RequireHosAck.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequireHosAck } from './RequireHosAck';

describe('<RequireHosAck> (Story 1.8 stub)', () => {
  it('passes children through unchanged — full 90-day re-ack lands in Story 3.2 (FR22)', () => {
    render(<RequireHosAck>protected HOS content</RequireHosAck>);
    expect(screen.getByText('protected HOS content')).toBeInTheDocument();
  });
});
