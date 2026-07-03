// scripts/ci/check-rods-grid.ts
//
// FR27 / FR62 / NFR-C3 CI gate.
//
// Two passes:
//
// 1. JSX AST pass over src/**/*.tsx via the TypeScript Compiler API.
//    Tracks ancestors whose tag name is `HosShell` or whose opening
//    element carries a `data-hos-screen` attribute. Within such HOS
//    subtrees, flags any JSX element whose statically-resolvable
//    `className` contains a 24-col grid pattern (grid-cols-24,
//    arbitrary grid-cols-[24...], or style={{ gridTemplateColumns:
//    'repeat(24, ...)' }}). Also flags `data-hos-grid` JSX attributes
//    anywhere (explicit RODS-grid signal — no ancestry requirement).
//
// 2. CSS regex pass over src/**/*.css. Flags any
//    `grid-template-columns: repeat(24, ...)` rule. CSS has no JSX
//    context, so the rule is project-wide as defense-in-depth.
//
// Dynamic className attributes (className={someVar}) are skipped — see
// the Story 1.8 spec, Reminder 3.
//
// Architecture: architecture.md:473-481 (HosShell contract),
// :486 (RODS-grid CI gate), :715-727 (HOS shell composition rule).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import ts from 'typescript';

const SCAN_EXTENSIONS = new Set(['.tsx', '.css']);
const SCAN_ROOT = 'src';
const HOS_SHELL_TAG = 'HosShell';
const HOS_SCREEN_ATTR = 'data-hos-screen';
const HOS_GRID_ATTR = 'data-hos-grid';

// JSX className substring patterns. All matched as literal substrings of
// the resolved className string; order matters for the reported label.
const JSX_CLASS_PATTERNS: Array<{ test: (cls: string) => boolean; label: string }> = [
  { test: (cls) => /\bgrid-cols-24\b/.test(cls), label: 'grid-cols-24' },
  {
    test: (cls) => /\bgrid-cols-\[24(\b|[\]fr,])/.test(cls),
    label: 'grid-cols-[24...] (Tailwind arbitrary)',
  },
];

// CSS regex pass. Case-insensitive; whitespace-tolerant inside `repeat(...)`.
const CSS_PATTERN = /grid-template-columns:\s*repeat\(\s*24\s*,/i;
const CSS_PATTERN_LABEL = 'grid-template-columns: repeat(24, ...)';

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

function hasDataAttribute(node: ts.JsxOpeningLikeElement, attrName: string): boolean {
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr)) continue;
    if (!ts.isIdentifier(attr.name)) continue;
    if (attr.name.text === attrName) return true;
  }
  return false;
}

function getStaticStringAttribute(
  node: ts.JsxOpeningLikeElement,
  attrName: string,
): string | undefined {
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr)) continue;
    if (!ts.isIdentifier(attr.name)) continue;
    if (attr.name.text !== attrName) continue;
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
    return undefined;
  }
  return undefined;
}

function getStaticInlineGridTemplate(node: ts.JsxOpeningLikeElement): string | undefined {
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr)) continue;
    if (!ts.isIdentifier(attr.name)) continue;
    if (attr.name.text !== 'style') continue;
    const init = attr.initializer;
    if (!init || !ts.isJsxExpression(init) || !init.expression) return undefined;
    if (!ts.isObjectLiteralExpression(init.expression)) return undefined;
    for (const prop of init.expression.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const propName = prop.name;
      let key: string | undefined;
      if (ts.isIdentifier(propName)) key = propName.text;
      else if (ts.isStringLiteral(propName)) key = propName.text;
      if (key !== 'gridTemplateColumns') continue;
      if (ts.isStringLiteral(prop.initializer)) return prop.initializer.text;
      return undefined;
    }
  }
  return undefined;
}

function scanTsx(path: string, source: string): Violation[] {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );
  const violations: Violation[] = [];
  const inHosSubtreeStack: boolean[] = [];

  function pushViolation(node: ts.Node, pattern: string): void {
    const start = node.getStart(sourceFile);
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
    const excerpt = (source.split('\n')[line] ?? '').trim().slice(0, 120);
    violations.push({
      file: path,
      line: line + 1,
      column: character + 1,
      pattern,
      excerpt,
    });
  }

  function isHosShellLike(node: ts.JsxOpeningLikeElement): boolean {
    if (getJsxTagName(node) === HOS_SHELL_TAG) return true;
    if (hasDataAttribute(node, HOS_SCREEN_ATTR)) return true;
    return false;
  }

  function visit(node: ts.Node): void {
    let pushed = false;
    if (ts.isJsxElement(node)) {
      const entered = isHosShellLike(node.openingElement);
      const inHos = entered || inHosSubtreeStack.at(-1) === true;
      inHosSubtreeStack.push(inHos);
      pushed = true;
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      // data-hos-grid is an explicit RODS-grid signal — flag regardless of
      // ancestry. Anyone writing this attribute is announcing intent.
      if (hasDataAttribute(node, HOS_GRID_ATTR)) {
        pushViolation(node, `${HOS_GRID_ATTR} attribute`);
      }

      const inHos = inHosSubtreeStack.at(-1) === true;
      if (inHos) {
        const className = getStaticStringAttribute(node, 'className');
        if (className) {
          for (const p of JSX_CLASS_PATTERNS) {
            if (p.test(className)) {
              pushViolation(node, p.label);
              break;
            }
          }
        }
        const gridTemplate = getStaticInlineGridTemplate(node);
        if (gridTemplate && /^\s*repeat\(\s*24\s*,/i.test(gridTemplate)) {
          pushViolation(node, 'style.gridTemplateColumns repeat(24, ...)');
        }
      }
    }

    ts.forEachChild(node, visit);

    if (pushed) inHosSubtreeStack.pop();
  }

  visit(sourceFile);
  return violations;
}

function scanCss(path: string, source: string): Violation[] {
  const lines = source.split('\n');
  const out: Violation[] = [];
  lines.forEach((line, i) => {
    if (CSS_PATTERN.test(line)) {
      out.push({
        file: path,
        line: i + 1,
        column: line.search(CSS_PATTERN) + 1,
        pattern: CSS_PATTERN_LABEL,
        excerpt: line.trim().slice(0, 120),
      });
    }
  });
  return out;
}

export function scanFile(path: string, source: string): Violation[] {
  const ext = extname(path);
  if (ext === '.tsx') return scanTsx(path, source);
  if (ext === '.css') return scanCss(path, source);
  return [];
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

  const tsxCount = files.filter((f) => extname(f) === '.tsx').length;
  const cssCount = files.filter((f) => extname(f) === '.css').length;
  console.log(
    `[check:rods] scanned ${tsxCount} .tsx (HOS-subtree-scoped) + ${cssCount} .css (project-wide) for 24-cell grid patterns`,
  );

  if (violations.length === 0) {
    console.log(
      '[check:rods] OK — no 24-cell horizontal grid patterns in HOS subtrees or CSS',
    );
    process.exit(0);
  }

  console.error(`[check:rods] FAIL — ${violations.length} RODS-grid violation(s):`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.column}  matches ${v.pattern}`);
    console.error(`    > ${v.excerpt}`);
  }
  console.error(
    '[check:rods] HOS UI must NOT produce 24-cell horizontal grids (FR27, FR62, NFR-C3). ' +
      'Use plain-English tabular text instead. See src/modules/hos/HosShell.tsx and ' +
      'architecture.md § "HOS shell composition (load-bearing)".',
  );
  process.exit(1);
}

const isCliEntry = import.meta.url === `file://${process.argv[1]}`;
if (isCliEntry) {
  main();
}
