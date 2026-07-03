// FR61 / NFR-C5 CI gate (out-of-band scan).
//
// Walks src/ for the three forbidden substrings ("not an ELD" case-insensitive,
// "FMCSA" exact, "earns a commission" exact). Anything outside the allowlist
// is a violation.
//
// This duplicates the ESLint rule's intent at the file-content level (no AST
// parsing) so the gate still fires if ESLint is misconfigured, disabled, or
// bypassed. Designed to be cheap (a few hundred lines of regex matching) and
// honest (real scan, not a stub).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /not an ELD/i, label: '"not an ELD"' },
  { pattern: /FMCSA/, label: '"FMCSA"' },
  { pattern: /earns a commission/, label: '"earns a commission"' },
];

const ALLOWLIST = new Set(['src/core/disclaimers.ts', 'src/core/disclaimers.test.ts']);

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SCAN_ROOT = 'src';

interface Violation {
  file: string;
  line: number;
  label: string;
  excerpt: string;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, acc);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      acc.push(full);
    }
  }
  return acc;
}

function scanFile(path: string): Violation[] {
  if (ALLOWLIST.has(path)) return [];
  const lines = readFileSync(path, 'utf8').split('\n');
  const out: Violation[] = [];
  lines.forEach((line, i) => {
    for (const { pattern, label } of FORBIDDEN) {
      if (pattern.test(line)) {
        out.push({
          file: path,
          line: i + 1,
          label,
          excerpt: line.trim().slice(0, 120),
        });
      }
    }
  });
  return out;
}

function main(): void {
  const files = walk(SCAN_ROOT);
  const violations = files.flatMap(scanFile);

  console.log(
    `[check:disclaimer-source] scanned ${files.length} files for ${FORBIDDEN.length} forbidden substrings`,
  );
  console.log(`[check:disclaimer-source] allowlist: ${[...ALLOWLIST].join(', ')}`);

  if (violations.length === 0) {
    console.log(
      '[check:disclaimer-source] OK — no inline disclaimer text found outside source-of-truth',
    );
    process.exit(0);
  }

  console.error(
    `[check:disclaimer-source] FAIL — ${violations.length} disclaimer-integrity violation(s):`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  contains ${v.label}`);
    console.error(`    > ${v.excerpt}`);
  }
  console.error(
    '[check:disclaimer-source] Import canonical disclaimer constants from src/core/disclaimers.ts ' +
      'and render via <Disclaimer kind="..."> (or its <AffiliateCTA> / <HosShell> wrapper).',
  );
  process.exit(1);
}

main();
