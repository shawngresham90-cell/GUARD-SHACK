// scripts/ci/check-rods-grid.test.ts
//
// Asserts the RODS-grid scanner:
//   - returns [] on known-good fixture (HosShell, no grid)
//   - returns at least one violation on known-bad-grid (HosShell + grid-cols-24)
//   - returns [] on non-hos-grid fixture (negative-scope: grid outside HOS is OK)
//   - flags CSS `grid-template-columns: repeat(24, ...)` regardless of selector
//   - ignores dynamic className expressions inside HOS subtrees

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scanFile } from './check-rods-grid';

function readFixture(relative: string): { path: string; source: string } {
  const path = resolve(process.cwd(), 'tests/fixtures/rods-grid', relative);
  return { path, source: readFileSync(path, 'utf8') };
}

describe('check-rods-grid scanner', () => {
  it('returns no violations for the known-good fixture (HosShell wraps plain text)', () => {
    const { path, source } = readFixture('known-good.tsx');
    expect(scanFile(path, source)).toEqual([]);
  });

  it('returns at least one violation for the known-bad fixture (24-cell grid inside HosShell)', () => {
    const { path, source } = readFixture('known-bad-grid.tsx');
    const violations = scanFile(path, source);
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0]?.pattern).toMatch(/grid-cols-24/);
    expect(violations[0]?.file).toBe(path);
  });

  it('returns no violations for a 24-cell grid OUTSIDE any HOS subtree (negative scope)', () => {
    const { path, source } = readFixture('non-hos-grid.tsx');
    expect(scanFile(path, source)).toEqual([]);
  });

  it('flags CSS grid-template-columns: repeat(24, ...) regardless of selector context', () => {
    const css = `.some-selector { display: grid; grid-template-columns: repeat(24, 1fr); }`;
    const violations = scanFile('synthetic.css', css);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.pattern).toMatch(/repeat\(24/);
  });

  it('does not flag dynamic className expressions inside HOS subtrees', () => {
    const source = `
      import { HosShell } from '@/modules/hos';
      export function Dyn({ cls }: { cls: string }) {
        return (
          <HosShell>
            <div className={cls} />
          </HosShell>
        );
      }
    `;
    expect(scanFile('synthetic.tsx', source)).toEqual([]);
  });
});
