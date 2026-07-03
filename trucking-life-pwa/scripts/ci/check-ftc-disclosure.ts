// scripts/ci/check-ftc-disclosure.ts
//
// FR35 / FR15 / FR34 / NFR-C2 CI gate.
//
// Walks every .tsx file under src/ via the TypeScript Compiler API; reports
// any <a> or <button> whose statically-resolvable href attribute matches an
// affiliate URL pattern AND that has no <AffiliateCTA> ancestor in its JSX
// tree. Such elements violate the load-bearing composition contract that
// guarantees the FTC disclosure is rendered adjacent to every affiliate CTA.
//
// Dynamic-href attributes (href={someExpr}) are skipped — see the Story 1.7
// spec, Reminder 3.
//
// Architecture: architecture.md:463–471 (composition contract), :720–722
// (enforcement rule), :853 (script location).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import ts from 'typescript';

const AFFILIATE_URL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /truckparkingclub\.com/i, label: 'truckparkingclub.com' },
  { pattern: /stan\.store\/shawn/i, label: 'stan.store/shawn' },
  // Future verticals — listed for documentation; uncomment when Stories 4.x land:
  // { pattern: /fuelbook\.com/i, label: 'fuelbook.com (fuel-card vertical)' },
  // { pattern: /loadboard\.example/i, label: 'load-board vertical' },
  // { pattern: /insurance\.example/i, label: 'insurance vertical' },
];

const SCAN_EXTENSIONS = new Set(['.tsx']);
const SCAN_ROOT = 'src';
const AFFILIATE_WRAPPER_TAG = 'AffiliateCTA';

export interface Violation {
  file: string;
  line: number;
  column: number;
  pattern: string;
  excerpt: string;
}

function getJsxTagName(node: ts.JsxOpeningLikeElement): string {
  const name = node.tagName;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isPropertyAccessExpression(name)) return name.name.text;
  return '';
}

function getStaticHrefAttribute(node: ts.JsxOpeningLikeElement): string | undefined {
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr)) continue;
    if (!ts.isIdentifier(attr.name)) continue;
    if (attr.name.text !== 'href') continue;
    const init = attr.initializer;
    if (!init) return undefined;
    if (ts.isStringLiteral(init)) return init.text;
    if (
      ts.isJsxExpression(init) &&
      init.expression &&
      ts.isStringLiteral(init.expression)
    ) {
      return init.expression.text;
    }
    // Dynamic expression — can't statically resolve. Skip.
    return undefined;
  }
  return undefined;
}

function matchAffiliateUrl(url: string): { pattern: RegExp; label: string } | null {
  for (const entry of AFFILIATE_URL_PATTERNS) {
    if (entry.pattern.test(url)) return entry;
  }
  return null;
}

export function scanFile(path: string, source: string): Violation[] {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );
  const violations: Violation[] = [];
  const ancestorTags: string[] = [];

  function visit(node: ts.Node): void {
    // Track JsxElement (paired open/close) ancestors so descendants can look up
    // for <AffiliateCTA>. JsxSelfClosingElement has no children, so it doesn't
    // contribute to the ancestor stack.
    let pushed = false;
    if (ts.isJsxElement(node)) {
      ancestorTags.push(getJsxTagName(node.openingElement));
      pushed = true;
    }

    // Check this opening/self-closing element for an affiliate-URL <a>/<button>.
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = getJsxTagName(node);
      if (tag === 'a' || tag === 'button') {
        const href = getStaticHrefAttribute(node);
        const matched = href ? matchAffiliateUrl(href) : null;
        if (matched) {
          // For an opening element belonging to a JsxElement, the parent
          // JsxElement's tag is already on ancestorTags (pushed when we
          // entered that JsxElement). For a self-closing element, the
          // enclosing JsxElement (if any) is also on the stack.
          const wrapped = ancestorTags.includes(AFFILIATE_WRAPPER_TAG);
          if (!wrapped) {
            const start = node.getStart(sourceFile);
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
            const excerpt = (source.split('\n')[line] ?? '').trim().slice(0, 120);
            violations.push({
              file: path,
              line: line + 1,
              column: character + 1,
              pattern: matched.label,
              excerpt,
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);

    if (pushed) ancestorTags.pop();
  }

  visit(sourceFile);
  return violations;
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

function main(): void {
  const files = walk(SCAN_ROOT);
  const violations: Violation[] = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    violations.push(...scanFile(file, source));
  }

  console.log(
    `[check:ftc] scanned ${files.length} .tsx files for ${AFFILIATE_URL_PATTERNS.length} affiliate URL pattern(s) via TS AST`,
  );

  if (violations.length === 0) {
    console.log(
      '[check:ftc] OK — every affiliate URL <a>/<button> is wrapped in <AffiliateCTA>',
    );
    process.exit(0);
  }

  console.error(
    `[check:ftc] FAIL — ${violations.length} affiliate CTA(s) outside <AffiliateCTA> wrapper:`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.column}  matches ${v.pattern}`);
    console.error(`    > ${v.excerpt}`);
  }
  console.error(
    '[check:ftc] Wrap each affiliate <a>/<button> in <AffiliateCTA slot={...}>. ' +
      'See src/components/AffiliateCTA.tsx and architecture.md § "Affiliate CTA composition (load-bearing)".',
  );
  process.exit(1);
}

// Run main() only when invoked as a CLI (not when imported by Vitest tests).
// import.meta.url comparison is the canonical ESM pattern; process.argv[1]
// is the entrypoint script path. tsx normalizes file:// URLs.
const isCliEntry = import.meta.url === `file://${process.argv[1]}`;
if (isCliEntry) {
  main();
}
