// scripts/ci/check-ftc-disclosure.test.ts
//
// Asserts the FTC AST scanner returns [] on known-good fixtures and a
// non-empty violation list on known-bad fixtures. Also covers the
// dynamic-href guard (no statically-resolvable target → skip).

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scanFile } from './check-ftc-disclosure';

function readFixture(relative: string): { path: string; source: string } {
  const path = resolve(process.cwd(), 'tests/fixtures/affiliate-cta', relative);
  return { path, source: readFileSync(path, 'utf8') };
}

describe('check-ftc-disclosure scanner', () => {
  it('returns no violations for the known-good fixture (affiliate <a> wrapped in <AffiliateCTA>)', () => {
    const { path, source } = readFixture('known-good.tsx');
    expect(scanFile(path, source)).toEqual([]);
  });

  it('returns one violation for the known-bad fixture (affiliate <a> unwrapped)', () => {
    const { path, source } = readFixture('known-bad.tsx');
    const violations = scanFile(path, source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.pattern).toMatch(/truckparkingclub\.com/);
    expect(violations[0]?.file).toBe(path);
  });

  it('does not flag dynamic href attributes (can not statically resolve target)', () => {
    const source = `
      export function Dyn() {
        const url = 'https://truckparkingclub.com/book';
        return <a href={url}>Book</a>;
      }
    `;
    expect(scanFile('synthetic.tsx', source)).toEqual([]);
  });
});
