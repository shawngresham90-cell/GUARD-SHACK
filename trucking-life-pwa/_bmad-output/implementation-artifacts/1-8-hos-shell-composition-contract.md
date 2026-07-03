# Story 1.8: Build HosShell composition contract + RODS-grid scan

**Status:** ready-for-dev

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-8-hos-shell-composition-contract`
**Generated:** 2026-05-17
**Author of dev-spec:** Claude (Opus 4.7, 1M context) — paired-planning with Huffy
**Sequencing note:** Direct successor to Story 1.7 — same composition-contract shape, different disclaimer kind, different CI gate. Unblocked by Story 1.6 (`<Disclaimer kind="hosFooter">` exists) and Story 1.7 (`scripts/**/*.test.{ts,tsx}` Vitest include glob is in place; FTC scanner's AST/`scanFile()` pattern is the proven template for this story's RODS-grid scanner). Ships the `<HosShell>` shell + stubbed `RequireHosAck` guard so Stories 1.10 (routes), 3.2 (full RequireHosAck logic), 3.3 (HOS disclaimer screen), 3.4 (status entry), 3.5 (HOS clock), 3.6 (daily summary) all plug into a stable HOS surface.

---

## Story

As **Huffy (the developer)**,
I want **a single `<HosShell>` composition contract that renders `<Disclaimer kind="hosFooter">` as a permanent footer of every HOS screen, a stubbed `RequireHosAck` route guard ready for Story 3.2 to flesh out, and a real TypeScript-AST CI gate that fails the build on any 24-cell horizontal grid pattern under a `<HosShell>` / `[data-hos-screen]` subtree**,
So that **FR21 (permanent HOS footer disclaimer), FR27 (no 24-cell horizontal grid), FR62 (CI gate fails build on RODS-grid), NFR-C3 (RODS-grid heuristic enforcement), and AR19 (`<HosShell>` only legal parent for `/hos/*` routes) are structurally guaranteed before Epic 3 begins — Stories 3.3 (HosDisclaimer), 3.4 (StatusEntry), 3.5 (HosClock), 3.6 (DailySummary) can all wrap in `<HosShell>` with confidence that the footer is impossible to forget and the RODS-grid prohibition is impossible to violate without CI catching it**.

---

## Preconditions

1. ✅ Story 1.1 is `done` — scaffold, Tailwind v4, Vitest + RTL wired, `@/*` path alias to `src/*`.
2. ✅ Story 1.5 is `done` — 8-job CI pipeline live; `rods-grid` job runs `npm run check:rods` (currently a regex stub at `scripts/ci/check-rods-grid.ts`); `unit` CI job picks up `scripts/**/*.test.{ts,tsx}` (since Story 1.7).
3. ✅ Story 1.6 is `done` — `<Disclaimer kind="hosFooter">` exists at `src/components/Disclaimer.tsx`; the `HOS_FOOTER` canonical string ships from `src/core/disclaimers.ts`.
4. ✅ Story 1.7 is `done` — proven template for AST scanner + `scanFile()` export + fixture-driven Vitest tests; `vite.config.ts` test.include extended to `scripts/**`; `typescript` v6.x Compiler API is the AST walker; PR/branch/commit conventions established.
5. ✅ Working tree clean on `main` (commit `f309b88`); no in-flight branches.
6. ✅ Node 20.x; all 8 npm gates green locally (lint, format:check, typecheck, test 18/18, check:ftc, check:rods, check:disclaimer-source, build at 60 KB gz).

No external dependency. No Shawn involvement. No lawyer-review gate — the HOS footer copy was finalized in Story 1.6 and reused here by reference. The FR27/FR62 RODS-grid prohibition is locked in the PRD (FR27 line 1261, FR62 line 1345, NFR-C3 line 1455).

---

## Acceptance Criteria

The epic's compound AC (epics.md:474–482) decomposes into AC1–AC9.

**AC1 — `src/modules/hos/HosShell.tsx` ships per the architecture contract**

**Given** the project state after Story 1.7
**When** `src/modules/hos/HosShell.tsx` is implemented per architecture.md:473–481 / epics.md:477 verbatim
**Then** the component accepts `{ children: ReactNode }` props
**And** renders a single `<div data-hos-screen>{children}<Disclaimer kind="hosFooter" /></div>`
**And** the `<Disclaimer kind="hosFooter">` is always rendered, regardless of `children` (including `null`, fragments, deeply nested wrappers)
**And** the component takes no other props, has no internal state, and never imports the canonical HOS_FOOTER string directly — it always goes through `<Disclaimer kind="hosFooter">`

**AC2 — `src/modules/hos/index.ts` public-surface re-export**

**Given** AC1 is in place
**When** `src/modules/hos/index.ts` is created
**Then** the file re-exports `HosShell` as the sole named export
**And** the file declares this is the v1.8 module public surface; future stories (3.1+) widen it (`hosRepository`, hooks, additional components per architecture.md:979–1001)
**And** consumers outside `src/modules/hos/` import via `@/modules/hos` (the index), never via deep paths like `@/modules/hos/HosShell` — matches architecture.md:625–640 module-organization rule

**AC3 — Unit tests cover composition invariants (HOS footer always rendered)**

**Given** AC1 is in place
**When** `src/modules/hos/HosShell.test.tsx` is created and `npm run test` is run
**Then** RTL tests assert:
- `<Disclaimer>` with `data-disclaimer="hosFooter"` is in the document when `children` is plain text
- Footer is in the document when `children` is `null`
- Footer is in the document when `children` is a fragment of multiple elements
- `data-hos-screen` attribute is present on the wrapper element
**And** the test file imports `<HosShell>` from `'./HosShell'` (relative) AND verifies it's also reachable via `@/modules/hos` (index re-export) in at least one assertion to confirm AC2
**And** the test file does NOT inline the HOS_FOOTER string anywhere — would trip the Story 1.6 disclaimer-integrity ESLint rule ("not an ELD" / "FMCSA" substrings)
**And** all assertions pass; `unit` CI job picks the file up automatically

**AC4 — `RequireHosAck` route guard stubbed at `src/routes/guards/RequireHosAck.tsx`**

**Given** AC1 is in place
**When** `src/routes/guards/RequireHosAck.tsx` is created (first content under `src/routes/`)
**Then** the file exports `RequireHosAck({ children }: { children: ReactNode })` — passes children through unchanged
**And** the file's header comment explicitly names this as a STUB; full 90-day re-ack logic per FR22 lands in Story 3.2 (which reads `hos_meta.disclaimer_ack_at` from Dexie via `useHosDisclaimerAck` and redirects to `/hos/disclaimer` on stale/missing ack)
**And** a minimal Vitest test at `src/routes/guards/RequireHosAck.test.tsx` asserts the stub passes children through

**AC5 — `scripts/ci/check-rods-grid.ts` rewritten as TypeScript AST walk + CSS regex pass**

**Given** AC1 is in place and the regex stub at `scripts/ci/check-rods-grid.ts` exists from Story 1.5
**When** the script is rewritten to use the TypeScript Compiler API (`import ts from 'typescript'`) for JSX and a focused regex pass for CSS
**Then** the JSX pass parses every `.tsx` file under `src/` as a `ts.SourceFile` (script kind `TSX`) and tracks `JsxElement` ancestors whose tag name is `HosShell` OR whose opening element carries a `data-hos-screen` JSX attribute
**And** within such HOS subtrees, the scanner flags any JSX element whose statically-resolvable `className` contains `grid-cols-24` (exact Tailwind), or `grid-cols-[24]` / `grid-cols-[24fr` / `grid-cols-[repeat(24` (Tailwind arbitrary forms)
**And** the scanner flags any JSX element with an explicit `data-hos-grid` JSX attribute (regardless of HOS-ancestry — explicit RODS-grid signal)
**And** the scanner flags any JSX element with `style={{ gridTemplateColumns: 'repeat(24, ...)' }}` (statically-resolvable string literal initializer only)
**And** the CSS pass scans every `.css` file under `src/` for `grid-template-columns:\s*repeat\(\s*24\s*,` (case-insensitive) and flags matches regardless of selector context — CSS isn't JSX-scoped, so the rule fires project-wide as defense-in-depth
**And** elements with dynamic `className={someVar}` are not flagged (cannot statically resolve — out of scope, mirrors the FTC scanner's dynamic-href guard)
**And** the scanner exits 0 with a clear status line when no violations exist; exits non-zero with formatted error output when any violation exists
**And** `npm run check:rods` runs end-to-end successfully on the Story 1.8 codebase (no HOS UI exists beyond the empty shell)

**AC6 — Scanner exposes a testable `scanFile(path, source)` function**

**Given** AC5 is in place
**When** the scanner is refactored to export `scanFile(path: string, source: string): Violation[]` (and the `Violation` interface) in addition to the CLI `main()`
**Then** the function performs the same AST + CSS-regex walk and returns the violations array without printing or exiting
**And** the function dispatches by file extension: `.tsx` → AST pass; `.css` → regex pass; other → empty
**And** the CLI `main()` calls `scanFile()` per walked file and aggregates results before the print + exit decisions
**And** the function is pure (no filesystem or process side effects beyond reading the passed-in source string)
**And** the npm script `check:rods` behavior is unchanged (CLI run still produces the same output and exit-code contract)
**And** the CLI guard `import.meta.url === \`file://\${process.argv[1]}\`` prevents `main()` from re-executing when Vitest imports the module — same pattern as Story 1.7's FTC scanner

**AC7 — Three fixtures under `tests/fixtures/rods-grid/`**

**Given** AC1 + AC6 are in place
**When** `tests/fixtures/rods-grid/known-good.tsx`, `tests/fixtures/rods-grid/known-bad-grid.tsx`, and `tests/fixtures/rods-grid/non-hos-grid.tsx` are created
**Then** `known-good.tsx` renders a `<HosShell>` wrapping plain-English daily-summary text (no grid layout) — `scanFile()` returns `[]`
**And** `known-bad-grid.tsx` renders a `<HosShell>` containing `<div className="grid grid-cols-24">{Array.from({ length: 24 }).map((_, i) => <span key={i} />)}</div>` — `scanFile()` returns a non-empty violation array citing the 24-cell grid pattern
**And** `non-hos-grid.tsx` renders the same `<div className="grid grid-cols-24">` BUT outside any `<HosShell>` / `[data-hos-screen]` ancestor — `scanFile()` returns `[]` (negative-scope assertion: the rule is HOS-subtree-scoped, not project-wide for JSX)
**And** all three fixtures are minimal well-formed TSX (import React, export a component) and live under `tests/fixtures/rods-grid/` — outside `src/`, so neither `tsc -b` (build) nor `vite build` touches them; the default `npm run check:rods` (scan root = `src/`) does not pick them up

**AC8 — Vitest test asserts scanner behavior against the three fixtures**

**Given** AC6 + AC7 are in place
**When** `scripts/ci/check-rods-grid.test.ts` is created and `npm run test` is run
**Then** test 1 reads `known-good.tsx`, passes its contents to `scanFile()`, asserts the returned array is empty
**And** test 2 reads `known-bad-grid.tsx`, asserts the returned array has at least one violation whose `pattern` matches `grid-cols-24`
**And** test 3 reads `non-hos-grid.tsx`, asserts the returned array is empty (negative-scope: 24-cell grid outside HOS subtree is not a violation)
**And** test 4 exercises the CSS regex pass: synthetic CSS source string containing `.foo { grid-template-columns: repeat(24, 1fr); }` produces one violation
**And** test 5 exercises the dynamic-className guard: synthetic TSX with `<div className={someVar}>` inside `<HosShell>` produces zero violations
**And** all five tests pass; `unit` CI job picks the file up automatically via the Story 1.7 include-glob extension

**AC9 — Verification PR green; merged to main**

**Given** AC1–AC8 are in place
**When** a verification PR is opened on `feat/story-1-8-hos-shell`
**Then** all 8 required CI checks report green
**And** the `rods-grid` job runs the tightened scanner against the Story 1.8 baseline (HOS shell exists but no HOS UI yet; non-HOS code has zero 24-col patterns) and exits 0
**And** the `unit` job runs `HosShell.test.tsx` + `RequireHosAck.test.tsx` + `check-rods-grid.test.ts` and reports all green
**And** the PR is mergeable under GitHub branch protection; merge commit lands on `main`; the push-trigger CI run is also green

---

## Tasks / Subtasks

Execute in order. Each task ends with explicit verification.

### Task 1 — Pre-flight verification (AC: preconditions)

- [ ] **1.1** `git status` clean on `main`.
- [ ] **1.2** `git log --oneline -3` shows `f309b88 docs(story-1.7): mark done...` at HEAD.
- [ ] **1.3** All 8 npm gates green locally:
  ```bash
  npm run lint && npm run format:check && npm run typecheck && \
    npm run test && npm run build && \
    npm run check:ftc && npm run check:rods && npm run check:disclaimer-source
  ```
- [ ] **1.4** Branch off main: `git checkout -b feat/story-1-8-hos-shell`.

### Task 2 — Create `src/modules/hos/HosShell.tsx` + `index.ts` (AC: AC1, AC2)

- [ ] **2.1** Create directory: `mkdir -p src/modules/hos`. (First content under `src/modules/` — Stories 3.x, 4.x, 5.x will populate sibling modules per architecture.md:940–1031.)
- [ ] **2.2** Create `src/modules/hos/HosShell.tsx` with the content from *Dev Notes → `HosShell.tsx` contract*.
- [ ] **2.3** Create `src/modules/hos/index.ts` with the content from *Dev Notes → `hos/index.ts` contract*.
- [ ] **2.4** Verify `npm run typecheck` exits 0.
- [ ] **2.5** Verify `npm run lint` exits 0 — no inline disclaimer substrings (HOS_FOOTER renders via `<Disclaimer kind="hosFooter">`).
- [ ] **2.6** Verify `npm run check:disclaimer-source` exits 0.

### Task 3 — Create `src/modules/hos/HosShell.test.tsx` (AC: AC3)

- [ ] **3.1** Create `src/modules/hos/HosShell.test.tsx` with the content from *Dev Notes → `HosShell.test.tsx` contract*.
- [ ] **3.2** Run `npm run test` — 4 new tests pass; total Test Files climbs by 1 (HosShell co-located test), tests climb by 4.
- [ ] **3.3** Sanity-check failure mode: temporarily comment out the `<Disclaimer kind="hosFooter" />` line in `HosShell.tsx`, re-run `npm run test`, confirm the 3 "footer always rendered" assertions fail. **Then revert.**

### Task 4 — Create `src/routes/guards/RequireHosAck.tsx` stub + test (AC: AC4)

- [ ] **4.1** Create directory: `mkdir -p src/routes/guards`. (First content under `src/routes/` — Story 1.10 populates the full routes tree per architecture.md:903–911.)
- [ ] **4.2** Create `src/routes/guards/RequireHosAck.tsx` with the content from *Dev Notes → `RequireHosAck.tsx` contract*.
- [ ] **4.3** Create `src/routes/guards/RequireHosAck.test.tsx` with the content from *Dev Notes → `RequireHosAck.test.tsx` contract*.
- [ ] **4.4** Run `npm run test` — 1 new test passes; total tests climb by 1.
- [ ] **4.5** Verify `npm run typecheck` + `npm run lint` exit 0.

### Task 5 — Create `tests/fixtures/rods-grid/` fixtures (AC: AC7)

- [ ] **5.1** Create directory: `mkdir -p tests/fixtures/rods-grid`.
- [ ] **5.2** Create `tests/fixtures/rods-grid/known-good.tsx` with the content from *Dev Notes → `known-good.tsx` contract*.
- [ ] **5.3** Create `tests/fixtures/rods-grid/known-bad-grid.tsx` with the content from *Dev Notes → `known-bad-grid.tsx` contract*.
- [ ] **5.4** Create `tests/fixtures/rods-grid/non-hos-grid.tsx` with the content from *Dev Notes → `non-hos-grid.tsx` contract*.
- [ ] **5.5** Verify fixtures parse: `npx tsc --noEmit --jsx react-jsx --target esnext --moduleResolution bundler --skipLibCheck tests/fixtures/rods-grid/*.tsx` exits 0.
- [ ] **5.6** Verify `npm run check:rods` still exits 0 — fixtures are outside `src/`; the current regex stub doesn't see them. (The fact that `known-bad-grid.tsx` contains `grid-cols-24` is exactly what the Task 8 Vitest will exercise.)
- [ ] **5.7** Verify `npm run lint` exits 0 — fixtures have no unused imports and no disclaimer substrings.

### Task 6 — Rewrite `scripts/ci/check-rods-grid.ts` (AC: AC5, AC6)

- [ ] **6.1** Replace the entire contents of `scripts/ci/check-rods-grid.ts` with the content from *Dev Notes → `check-rods-grid.ts` contract*.
- [ ] **6.2** Run `npm run check:rods` — exits 0 on the Story 1.8 baseline (HosShell exists but contains no grid; no other HOS UI exists yet).
- [ ] **6.3** Sanity-check JSX failure mode: temporarily inject `<HosShell><div className="grid grid-cols-24" /></HosShell>` into `src/App.tsx`, re-run `npm run check:rods`, confirm the scanner reports the violation with file + line + matched pattern + excerpt and exits non-zero. **Then revert.** (Full bulletproof probe lands in Task 8.)
- [ ] **6.4** Verify the typecheck still passes — scripts under `scripts/ci/` aren't in `tsconfig.app.json`'s `include: ["src"]`, but the imports + AST types must be valid TypeScript regardless.

### Task 7 — Create `scripts/ci/check-rods-grid.test.ts` (AC: AC8)

- [ ] **7.1** Create `scripts/ci/check-rods-grid.test.ts` with the content from *Dev Notes → `check-rods-grid.test.ts` contract*.
- [ ] **7.2** Run `npm run test` — 5 new tests pass; total Test Files climbs to 6 (was 4 after Story 1.7: disclaimers + Disclaimer + AffiliateCTA + FTC scanner; adds HosShell + RODS scanner; the RequireHosAck test from Task 4 is the 7th).
- [ ] **7.3** Verify Vitest's fixture-path resolution: tests use `path.resolve(process.cwd(), 'tests/fixtures/rods-grid', ...)` — same pattern as Story 1.7's FTC scanner test.

### Task 8 — Bulletproof sanity probe (combined AC5 + AC6 + AC8 verification)

- [ ] **8.1** End-to-end JSX smoke: with everything green, temporarily add to `src/App.tsx`:
  ```tsx
  import { HosShell } from './modules/hos';
  // ... inside the JSX:
  <HosShell>
    <div className="grid grid-cols-24" data-probe="rods-injection">
      {Array.from({ length: 24 }).map((_, i) => <span key={i} />)}
    </div>
  </HosShell>
  ```
  Confirm:
  - `npm run check:rods` exits non-zero with the violation printed (file + line + `grid-cols-24`)
  - `npm run lint` still exits 0 (the disclaimer-integrity rule doesn't fire — no forbidden substrings; the RODS-grid scanner is the only gate that catches the violation)
  - The `rods-grid` CI job would fail on this PR (verified by local script behavior)
- [ ] **8.2** Negative-scope smoke: remove the `<HosShell>` wrapper, leaving just `<div className="grid grid-cols-24" data-probe="rods-injection">...</div>` in App.tsx. Confirm `npm run check:rods` exits 0 — the 24-cell grid outside any HOS subtree is allowed by design (FR62 is HOS-specific; this is the negative-scope behavior asserted by `non-hos-grid.tsx`).
- [ ] **8.3** CSS smoke: temporarily add `.probe-rods { grid-template-columns: repeat(24, 1fr); }` to `src/index.css`. Confirm `npm run check:rods` exits non-zero with the CSS file flagged. **Then revert.**
- [ ] **8.4** Revert App.tsx + index.css to clean state via `git checkout src/App.tsx src/index.css`.
- [ ] **8.5** Re-run all 8 gates one more time to confirm clean baseline. **This is the load-bearing check** — without verifying the structural enforcement fires for both JSX (HOS-scoped) and CSS (project-wide) cases, the RODS-grid scan ships as theater.

### Task 9 — Local sanity gates pass (AC: AC9 prep)

- [ ] **9.1** `npm run lint` → exit 0
- [ ] **9.2** `npm run format:check` → exit 0 (apply `npx prettier --write` to any file Prettier complains about; the AffiliateCTA pattern from Story 1.7 may repeat for the HosShell prop signature)
- [ ] **9.3** `npm run typecheck` → exit 0
- [ ] **9.4** `npm run test` → exit 0 (expect ~28 total tests: 18 from Story 1.7 + 4 HosShell + 1 RequireHosAck + 5 RODS scanner)
- [ ] **9.5** `npm run check:ftc` → exit 0 (unchanged by this story)
- [ ] **9.6** `npm run check:rods` → exit 0
- [ ] **9.7** `npm run check:disclaimer-source` → exit 0
- [ ] **9.8** `npm run build` → exit 0. Bundle should remain ~60 KB gz (HosShell adds <300 bytes raw; RequireHosAck stub <100 bytes; both pass-through; types erase).
- [ ] **9.9** `npx size-limit` → still under 200 KB gz.

### Task 10 — Open verification PR (AC: AC9)

- [ ] **10.1** Stage:
  ```bash
  git add src/modules/hos/HosShell.tsx \
          src/modules/hos/HosShell.test.tsx \
          src/modules/hos/index.ts \
          src/routes/guards/RequireHosAck.tsx \
          src/routes/guards/RequireHosAck.test.tsx \
          tests/fixtures/rods-grid/known-good.tsx \
          tests/fixtures/rods-grid/known-bad-grid.tsx \
          tests/fixtures/rods-grid/non-hos-grid.tsx \
          scripts/ci/check-rods-grid.ts \
          scripts/ci/check-rods-grid.test.ts
  ```
- [ ] **10.2** Commit:
  ```
  feat(story-1.8): HosShell composition contract + RODS-grid AST scan

  - src/modules/hos/HosShell.tsx ships the architecture composition
    contract: every HOS screen renders <Disclaimer kind="hosFooter">
    as a permanent footer (FR21, AR19).
  - src/modules/hos/index.ts is the v1.8 module public surface.
  - src/routes/guards/RequireHosAck.tsx stubbed (passes children
    through); full 90-day re-ack lands in Story 3.2 (FR22).
  - scripts/ci/check-rods-grid.ts tightened from regex stub to a
    TypeScript Compiler API AST walk for JSX (HOS-subtree-scoped via
    HosShell / data-hos-screen ancestor tracking) plus a focused CSS
    regex pass (project-wide, defense-in-depth). 24-cell horizontal
    grids in HOS subtrees and 24-col CSS rules anywhere fail the
    build (FR27, FR62, NFR-C3).
  - scripts/ci/check-rods-grid.test.ts asserts known-good/known-bad/
    non-hos-grid fixtures, CSS regex pass, dynamic-className guard.
  - HosShell RTL tests cover hosFooter-always-rendered invariants
    across null / fragment / nested children plus data-hos-screen.
  ```
- [ ] **10.3** Push: `git push -u origin feat/story-1-8-hos-shell`.
- [ ] **10.4** Open PR via GitHub UI targeting `main`. Title: `Story 1.8: HosShell composition contract + RODS-grid AST scan`. Body mirrors Story 1.7's PR body structure.
- [ ] **10.5** Confirm all 8 CI checks report green. Likely flake points:
  - `lighthouse` — same Story 1.5 flake class. HosShell isn't rendered anywhere yet (no route mounts it), so perf/a11y impact is zero.
  - `e2e` — Story 1.1's smoke spec doesn't render `<HosShell>`. Stays green.
  - `rods-grid` — this is the job under test. The tightened scanner runs on a codebase with no HOS UI in `src/`, so it exits 0 cleanly.

### Task 11 — Merge + sync + status update

- [ ] **11.1** Merge the PR via GitHub UI (Create a merge commit).
- [ ] **11.2** Locally: `git checkout main && git pull --ff-only origin main`.
- [ ] **11.3** Delete branches: `git branch -d feat/story-1-8-hos-shell && git push origin --delete feat/story-1-8-hos-shell`.
- [ ] **11.4** Mark this story file's `Status` field to `done`.
- [ ] **11.5** Append a Completion Note to *Dev Agent Record → Completion Notes List* below.
- [ ] **11.6** List every file created/modified in *Dev Agent Record → File List*.
- [ ] **11.7** Update `NOTES.md` "Done" / "Up Next" sections — Story 1.8 in Done; Stories 1.3 + 1.4 next (now both unblocked: 1.2 ships prod Supabase; 1.8 wraps up the composition-contract trio; 1.3 admin auth + 1.4 Netlify env are independent of each other and can be done in either order).

---

## Dev Notes

### Critical reminders (read before coding)

**Reminder 1 — `<HosShell>` never inlines the HOS footer string.** The component delegates to `<Disclaimer kind="hosFooter">`. If you find yourself writing `"Not an ELD"` or `"FMCSA"` anywhere in this story's code, stop — the disclaimer-integrity ESLint rule from Story 1.6 will fail the build. The only legal home for those substrings is `src/core/disclaimers.ts`.

**Reminder 2 — Scanner scope is HOS subtree (JSX) + project-wide (CSS).** Two different scopes by necessity:
- JSX: a 24-cell grid in `src/modules/parking/` is fine; the same grid inside `<HosShell>` is a violation. Why: FR62 is specifically about HOS rendering mimicking the FMCSA RODS grid; other UIs can use whatever grids they want.
- CSS: a `grid-template-columns: repeat(24, ...)` in any `.css` file is flagged because CSS has no JSX context. A CSS class can be applied to HOS elements at runtime, so the rule fires defense-in-depth.

**Reminder 3 — Static `className` only.** The scanner can resolve `className="grid grid-cols-24"` and `className={"grid grid-cols-24"}` (string-literal JSX expression). It cannot resolve `className={someVariable}` or `className={clsx('grid', ...)}` — dynamic forms are out of scope, same as Story 1.7's dynamic-href guard. The convention is: literal `className` strings for HOS layout. If runtime composition becomes necessary in Epic 3, a follow-up story can add string-builder-tracing.

**Reminder 4 — Cross-file ancestor tracking is NOT supported.** If `HosLog.tsx` renders `<HosShell><DailySummary /></HosShell>` and `DailySummary.tsx` (a different file) contains `<div className="grid grid-cols-24">`, the AST scanner won't see `HosShell` as `DailySummary`'s ancestor — they're parsed separately. Mitigation: components inside `src/modules/hos/` are HOS-module content by convention (architecture.md:625–640 module-organization rule). The scanner's project-wide CSS pass + the convention that HOS module components shouldn't use 24-col grids in the first place + Epic 3 PR review together cover this gap. A future v2 scanner could resolve imports + walk the call graph; that's deliberately out of v1 scope.

**Reminder 5 — `RequireHosAck` is a STUB.** Returns children unchanged. The header comment must name this fact loudly. Full implementation (reading `hos_meta.disclaimer_ack_at` from Dexie via `useHosDisclaimerAck`, redirecting to `/hos/disclaimer` on stale/missing ack per FR22) lands in Story 3.2. If you find yourself reaching for Dexie or `useHosDisclaimerAck` while doing 1.8, stop.

**Reminder 6 — Scope: no HOS routes, no HOS UI, no Dexie.** Story 1.8 ships the *shell* and the *enforcement gate*. The first real consumers are:
- Story 1.10 (wires `<RequireHosAck>` into `/hos/*` routes)
- Story 3.3 (`HosDisclaimer` — wraps in `<HosShell>`, renders `<Disclaimer kind="hosFull">` with min dwell)
- Story 3.4 (`StatusEntry` — wraps in `<HosShell>`, renders 4-toggle UI)
- Story 3.5 (`HosClock` — wraps in `<HosShell>`, renders remaining-time text)
- Story 3.6 (`DailySummary` — wraps in `<HosShell>`, renders tabular plain-English summary; explicitly NOT a 24-cell grid per FR27)

If you find yourself reaching for Dexie, route wiring, or any HOS feature UI while doing 1.8, stop.

**Reminder 7 — App.tsx stays alone.** Don't render `<HosShell>` in `App.tsx` "just to see it." The smoke E2E spec from Story 1.1 asserts the brand heading text; adding HOS UI to App.tsx changes what users see at `/` before any feature ships. The Task 8 probes are temporary — revert after the manual confirmations.

### `HosShell.tsx` contract

`src/modules/hos/HosShell.tsx`. Matches architecture.md:473–481 / epics.md:477 verbatim.

```tsx
// src/modules/hos/HosShell.tsx
//
// Composition contract (FR21, AR19 — load-bearing).
//
// The ONLY legal parent for routes under /hos/* (per architecture.md:725,
// :1090). Every HOS screen wraps in <HosShell> so that the canonical
// "Personal record only. Not an ELD. Not FMCSA-compliant." footer is
// rendered as a permanent sibling of children — impossible to forget by
// construction.
//
// Enforcement: scripts/ci/check-rods-grid.ts uses the `data-hos-screen`
// attribute (rendered below) and the static tag name `HosShell` to scope
// the RODS-grid heuristic (FR62) to HOS subtrees only.

import type { ReactNode } from 'react';
import { Disclaimer } from '@/components/Disclaimer';

export function HosShell({ children }: { children: ReactNode }) {
  return (
    <div data-hos-screen>
      {children}
      <Disclaimer kind="hosFooter" />
    </div>
  );
}
```

Notes:
- No `className` prop. If a consumer wants different placement, it wraps `<HosShell>` in its own layout div.
- The `data-hos-screen` attribute is the stable test-target + AST-scanner anchor. Renaming the attribute later breaks the scanner — that's a deliberate breakage if it ever happens.
- `Disclaimer` is imported via the path alias (`@/components/Disclaimer`); module-internal sibling files use relative imports per architecture convention.

### `hos/index.ts` contract

`src/modules/hos/index.ts`. Public surface re-export.

```ts
// src/modules/hos/index.ts
//
// PUBLIC SURFACE of the HOS module (architecture.md:625-640 module rule).
// Cross-module imports must come through this file; deep imports of
// HosShell.tsx from outside src/modules/hos/ are a convention violation
// (a future Story 1.10 ESLint no-restricted-imports rule will enforce
// this once the routes tree exists and there's something to enforce against).
//
// Story 1.8 surface: just <HosShell>. Stories 3.x widen this with
// hosRepository, hooks, and additional shell-aware components per
// architecture.md:979-1001.

export { HosShell } from './HosShell';
```

### `HosShell.test.tsx` contract

`src/modules/hos/HosShell.test.tsx`. Co-located with source per Story 1.1 testing standard.

```tsx
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
```

Notes:
- The `data-disclaimer="hosFooter"` selector is the same stable test target Story 1.6 wired into `<Disclaimer>`.
- The fifth test imports `HosShell` twice (deep + via index) and asserts strict equality — confirms the index re-export is the same module export. A typo like `export { HosShell as HosShellX } from './HosShell'` would fail this assertion.

### `RequireHosAck.tsx` contract

`src/routes/guards/RequireHosAck.tsx`. STUB only.

```tsx
// src/routes/guards/RequireHosAck.tsx
//
// STUB — full 90-day re-ack logic lands in Story 3.2 (FR22).
//
// At v1.8, this guard exists so that:
//   - Story 1.10 (routes tree) can wire <RequireHosAck> around /hos/* without
//     waiting on Dexie / hos_meta plumbing;
//   - The architecture's named guard file (architecture.md:911) is in place
//     and reachable, with no "TODO add guard" placeholder rotting in the
//     routes tree.
//
// Story 3.2 fleshes this out with `useHosDisclaimerAck` (reads Dexie
// hos_meta.disclaimer_ack_at), comparing now() against the stored ack
// timestamp + 90-day window, and redirecting to /hos/disclaimer on
// stale/missing ack. Until then: pass through.

import type { ReactNode } from 'react';

export function RequireHosAck({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

### `RequireHosAck.test.tsx` contract

`src/routes/guards/RequireHosAck.test.tsx`. Minimal stub-behavior assertion.

```tsx
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
```

### `known-good.tsx` contract

`tests/fixtures/rods-grid/known-good.tsx`. `<HosShell>` wrapping plain-English text — scanner returns `[]`.

```tsx
// tests/fixtures/rods-grid/known-good.tsx
//
// Structural pass fixture for scripts/ci/check-rods-grid.ts.
// <HosShell> renders a plain-English daily summary — no grid layout.
// Scanner should return [].

import { HosShell } from '@/modules/hos';

export function KnownGoodHosScreen() {
  return (
    <HosShell>
      <h2>Today's summary</h2>
      <p>Total drive: 8h 12m</p>
      <p>Total on-duty: 11h 03m</p>
      <p>Remaining cycle: 39h 57m</p>
    </HosShell>
  );
}
```

### `known-bad-grid.tsx` contract

`tests/fixtures/rods-grid/known-bad-grid.tsx`. `<HosShell>` containing a 24-cell horizontal grid — scanner flags it.

```tsx
// tests/fixtures/rods-grid/known-bad-grid.tsx
//
// Structural fail fixture for scripts/ci/check-rods-grid.ts.
// <HosShell> contains a 24-cell horizontal grid — the exact RODS-grid
// pattern FR27/FR62 forbid. Scanner should return at least one violation
// citing grid-cols-24.

import { HosShell } from '@/modules/hos';

export function KnownBadHosGrid() {
  return (
    <HosShell>
      <div className="grid grid-cols-24">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
    </HosShell>
  );
}
```

### `non-hos-grid.tsx` contract

`tests/fixtures/rods-grid/non-hos-grid.tsx`. 24-cell grid OUTSIDE any HOS subtree — scanner does NOT flag it (negative-scope).

```tsx
// tests/fixtures/rods-grid/non-hos-grid.tsx
//
// Negative-scope fixture for scripts/ci/check-rods-grid.ts.
// A 24-cell grid OUTSIDE any <HosShell> / [data-hos-screen] ancestor is
// fine — FR62 is HOS-specific. Scanner should return [].
//
// This fixture asserts the scanner's HOS-subtree-scoped behavior for JSX.
// (CSS is scoped project-wide; that's tested separately via the synthetic
// CSS source in scripts/ci/check-rods-grid.test.ts.)

export function NonHosGrid() {
  return (
    <div className="grid grid-cols-24">
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
```

### `check-rods-grid.ts` contract

`scripts/ci/check-rods-grid.ts`. Full rewrite — replaces the Story 1.5 regex stub. Mirrors Story 1.7's FTC scanner shape (ancestor-tracking AST walk, `scanFile()` export, CLI guard).

```ts
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

  console.error(
    `[check:rods] FAIL — ${violations.length} RODS-grid violation(s):`,
  );
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
```

Notes on the design:
- The `inHosSubtreeStack` mirrors Story 1.7's `ancestorTags`-stack pattern but stores a boolean (in-HOS-subtree-or-not) so the inner-element check is O(1) (`stack.at(-1)`). Nested `<HosShell>` inside `<HosShell>` (silly but legal) stays correctly in-scope on the way out.
- `data-hos-grid` is treated as a smoke signal regardless of ancestry — if someone deliberately tags an element with that attribute, they're announcing intent and the scanner should fire even outside HOS subtrees (catches "I'll just remove the HosShell wrapper to silence the scanner" — that still won't silence this).
- `style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}` is checked via object-literal property walk. Dynamic forms (`style={someStyleObj}`) are out of scope, same as className.
- CSS pass is intentionally simple: line-by-line regex match. Selector context (which class the rule applies to) is ignored — CSS rules can be applied to HOS elements at runtime, so any `repeat(24, ...)` in any `.css` file is a violation.
- Tailwind's `grid-cols-24` is NOT in Tailwind v4's default scale (which stops at `grid-cols-12`). So `grid-cols-24` only exists if a project explicitly extends the theme — already a "you had to try" signal. Arbitrary `grid-cols-[24...]` is the more likely accidental form; the regex `grid-cols-\[24(\b|[\]fr,])` catches the common shapes (`grid-cols-[24]`, `grid-cols-[24fr]`, `grid-cols-[24px]`, `grid-cols-[repeat(24,...)]` — actually `grid-cols-[repeat(24` would need a different regex; see follow-up note).

### `check-rods-grid.test.ts` contract

`scripts/ci/check-rods-grid.test.ts`. Mirrors Story 1.7's FTC scanner test shape.

```ts
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
```

### Architecture compliance notes

- **`<HosShell>` shape** matches architecture.md:473–481 verbatim (same `data-hos-screen` attribute, same `<Disclaimer kind="hosFooter">` placement).
- **Module location** `src/modules/hos/HosShell.tsx` matches architecture.md:981.
- **Module public-surface convention** (architecture.md:625–640) followed via `src/modules/hos/index.ts`.
- **`RequireHosAck` location** `src/routes/guards/RequireHosAck.tsx` matches architecture.md:911. Stub-only is documented; full impl is Story 3.2 per epics.md:791–807.
- **Scanner location** `scripts/ci/check-rods-grid.ts` matches architecture.md:854.
- **Enforcement rule** matches architecture.md:486 + :724–727 (load-bearing HOS shell composition).
- **CI gate** matches architecture.md:549 (`rods-grid` — required, source FR62).

### Library/framework compliance

- **No new npm dependencies.** TypeScript Compiler API ships with the existing `typescript` v6.x devDep. `tsx` (from Story 1.5) executes the script. `vitest` + `@testing-library/react` (from Story 1.1) cover the unit and scanner tests.
- **No new ESLint plugins.** Disclaimer-integrity rule from Story 1.6 is sufficient — `<HosShell>` doesn't inline disclaimer text.
- **No CSS-in-JS, no icon library, no new state library.** Consistent with Story 1.1's lock.

### File structure compliance

After Story 1.8 commits, the repo gains:

```
trucking-life-pwa/
├── src/
│   ├── modules/                                # NEW directory (first content)
│   │   └── hos/
│   │       ├── HosShell.tsx                    # NEW (composition contract)
│   │       ├── HosShell.test.tsx               # NEW (RTL invariant tests)
│   │       └── index.ts                        # NEW (module public surface)
│   └── routes/                                 # NEW directory (first content)
│       └── guards/
│           ├── RequireHosAck.tsx               # NEW (STUB; full impl Story 3.2)
│           └── RequireHosAck.test.tsx          # NEW (stub passthrough test)
├── tests/
│   └── fixtures/
│       └── rods-grid/                          # NEW directory
│           ├── known-good.tsx                  # NEW (scanner pass fixture)
│           ├── known-bad-grid.tsx              # NEW (scanner fail fixture)
│           └── non-hos-grid.tsx                # NEW (negative-scope fixture)
└── scripts/
    └── ci/
        ├── check-rods-grid.ts                  # MODIFIED (regex stub → AST + CSS)
        └── check-rods-grid.test.ts             # NEW (scanner behavior assertions)
```

Note: `src/modules/` and `src/routes/` are first populated here. Stories 3.x will widen `src/modules/hos/` (db/, hooks/, components/); Stories 1.10 + 2.x + 4.x will widen `src/routes/` and add sibling modules under `src/modules/`. The current placements are forward-compatible with architecture.md:903–1031.

### Testing standards

- Component tests for `HosShell.tsx` and `RequireHosAck.tsx` co-located with source per Story 1.1.
- Scanner unit tests for `check-rods-grid.ts` co-located with the script under `scripts/ci/`. Same convention as Story 1.7's FTC scanner test.
- No e2e changes — the smoke spec at `tests/e2e/smoke.spec.ts` doesn't render `<HosShell>` or HOS routes.
- No coverage threshold yet at v1.

### Lighthouse + bundle impact

- `<HosShell>` is ~250 bytes raw + small `data-*` attribute footprint. Gzipped, negligible.
- `RequireHosAck` stub: ~100 bytes raw. Tree-shake safe.
- Module `index.ts` re-export: zero net cost (tree-shake collapses it).
- Scanner rewrite: zero runtime cost — scripts under `scripts/ci/` don't bundle into the app.
- Expected post-Story-1.8 bundle: ~60 KB gz (Story 1.7 baseline 59.37 KB gz size-limit / 60.17 KB gz Vite reporter). Within ±0.5 KB.
- Lighthouse a11y: net-neutral (no UI surface mounted yet). When Story 3.3+ mount `<HosShell>`, the canonical footer copy inherits Story 1.6's `text-sm leading-relaxed text-neutral-400` styling — WCAG AAA contrast on the dark background.

### Git intelligence (recent commits as context)

```
f309b88 docs(story-1.7): mark done + write dev agent record
e225bae Merge pull request #3 from MikeHuffy/feat/story-1-7-affiliate-cta
68b9bdb feat(story-1.7): AffiliateCTA composition contract + FTC AST scan
c5c4a99 docs(stories): add ready-for-dev spec for 1.7 (AffiliateCTA composition contract)
f07452b chore(story-1.2): migrations applied to TruckLifePWA production
```

Convention: `feat(story-N.N):` for scope-introducing work; `docs(stories):` for spec PRs (commit body lists what the spec decomposes); `docs(story-N.N):` for status/handoff commits. Story 1.8's spec commit:

```
docs(stories): add ready-for-dev spec for 1.8 (HosShell composition contract + RODS-grid AST scan)
```

Story 1.8's implementation commit per Task 10.2:

```
feat(story-1.8): HosShell composition contract + RODS-grid AST scan
```

### Latest tech information (verified 2026-05-17)

- **TypeScript Compiler API** — same patterns as Story 1.7. `ts.createSourceFile`, `ts.ScriptKind.TSX`, `JsxOpeningLikeElement`, `forEachChild` are all stable across TS 4.x → 7.x.
- **Tailwind v4** — default grid scale stops at `grid-cols-12`. `grid-cols-24` requires explicit theme extension; arbitrary `grid-cols-[N]` works out-of-the-box. The scanner targets both.
- **Vitest 4.x** — picks up `scripts/**/*.test.{ts,tsx}` per the `vite.config.ts` include glob extended in Story 1.7. No further config needed.

### Project Structure Notes

- **Alignment with architecture:** Completes step 3 of the architecture's implementation sequence (architecture.md:572 — "Disclaimer core: `disclaimers.ts`, `<Disclaimer>`, `<AffiliateCTA>`, `<HosShell>`, FTC + RODS-grid CI gates wired"). Story 1.6 shipped `disclaimers.ts` + `<Disclaimer>`; Story 1.7 shipped `<AffiliateCTA>` + FTC AST gate; this story ships `<HosShell>` + RODS-grid AST/CSS gate. The Disclaimer core trio is complete after 1.8.
- **Variances from architecture:** Cross-file ancestor tracking is deliberately out of scope (Reminder 4). The architecture mentions "snapshot scan" in passing (architecture.md:486) but doesn't require it; the AST-based approach is simpler, faster, and structurally sufficient when combined with the CSS pass + module-organization conventions.

### Known follow-up (not Story 1.8 scope)

- **Story 1.10 (provider tree + routing skeleton + auth/admin guards)** — wires `<RequireHosAck>` into `/hos/*` routes; consumes the stub from this story.
- **Story 3.2 (HOS routing + RequireHosAck guard)** — replaces this story's stub with the real 90-day re-ack logic per FR22.
- **Stories 3.3–3.7** — each renders a HOS screen wrapped in `<HosShell>`; the RODS-grid scanner starts firing meaningfully against real HOS content.
- **Cross-file ancestor tracking** — out of scope for v1.8 (Reminder 4). If a follow-up story needs strict cross-file detection, options are: (a) require all HOS components to live under `src/modules/hos/` and scan that path unconditionally (current convention), (b) extend the scanner to resolve imports + walk the call graph, (c) shift to a snapshot scan (jsdom-rendered DOM walk per epic AC hint). All three are deferred.
- **Dynamic className tracing** — out of scope (Reminder 3). If runtime `className` composition becomes common in HOS UI, add a follow-up story to trace `clsx`/`twMerge` calls or to require literal `className` for any element under `[data-hos-screen]`.

### References

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
  - FR21 (permanent HOS footer disclaimer — line 1250)
  - FR22 (90-day re-ack — line 1252; full impl Story 3.2)
  - FR27 (no 24-cell horizontal grid — line 1261)
  - FR62 (CI gate fails build on RODS-grid — line 1345)
  - NFR-C3 (RODS-grid heuristic enforcement — line 1455)
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
  - § *Implementation patterns / Component composition contracts* (lines 473–482 — the `<HosShell>` contract shape)
  - § *Process Patterns / HOS shell composition (load-bearing)* (lines 724–727 — the rule this story implements)
  - § *Pattern Examples / Good — HOS screen / Anti-pattern — fails CI* (lines 782–807 — the exact good/bad shapes mirrored by the fixtures)
  - § *Implementation sequence — Disclaimer core* (line 572 — sequencing intent)
  - § *Project Directory Structure* (lines 854, 911, 981, 1090 — file locations)
  - § *CI/CD pipeline → `rods-grid`* (line 549 — gate definition)
- **Epics:** `_bmad-output/planning-artifacts/epics.md`
  - § *Epic 1, Story 1.8* (lines 468–482 — source ACs)
  - § *Story 1.6* (lines 436–450 — upstream: `<Disclaimer kind="hosFooter">` source)
  - § *Story 1.7* (lines 452–466 — sibling composition contract, scanner template)
  - § *Story 1.10* (lines 501–516 — downstream: wires `<RequireHosAck>` into routes)
  - § *Story 3.2* (lines 791–807 — downstream: full `RequireHosAck` implementation)
- **Story 1.7 dev record:** `_bmad-output/implementation-artifacts/1-7-affiliate-cta-composition-contract.md`
  - Confirms `scripts/**/*.test.{ts,tsx}` Vitest include glob is in place; AST scanner + `scanFile()` export pattern is proven; PR/branch/commit conventions established.
- **Story 1.6 dev record:** `_bmad-output/implementation-artifacts/1-6-disclaimer-source-of-truth.md`
  - Confirms `<Disclaimer kind="hosFooter">` is available; confirms disclaimer-integrity ESLint rule fires on inline "not an ELD" / "FMCSA".

---

## Dev Agent Record

### Agent Model Used

_(Filled in by dev agent during execution.)_

### Debug Log References

_(Filled in by dev agent during execution. Expected gates to capture: pre-flight 8 gates green; `npm run check:rods` exit code on Story 1.8 baseline; sanity-check injection results from Task 6.3 and Task 8.1/8.2/8.3; PR-run CI matrix.)_

### Completion Notes List

_(Filled in by dev agent after merge. Expected to include: AC1–AC9 status; any deviations from the spec; bundle size delta; the structural-enforcement sanity probe results across JSX-in-HOS / JSX-outside-HOS / CSS cases; downstream-unblocked story list — Stories 1.3, 1.4, 1.10, 3.2.)_

### File List

_(Filled in by dev agent after merge. Expected entries:_

_**CREATED:**_
- _`src/modules/hos/HosShell.tsx`_
- _`src/modules/hos/HosShell.test.tsx`_
- _`src/modules/hos/index.ts`_
- _`src/routes/guards/RequireHosAck.tsx`_
- _`src/routes/guards/RequireHosAck.test.tsx`_
- _`tests/fixtures/rods-grid/known-good.tsx`_
- _`tests/fixtures/rods-grid/known-bad-grid.tsx`_
- _`tests/fixtures/rods-grid/non-hos-grid.tsx`_
- _`scripts/ci/check-rods-grid.test.ts`_

_**MODIFIED:**_
- _`scripts/ci/check-rods-grid.ts` — full rewrite, regex stub → TS Compiler API AST walk (JSX HOS-subtree-scoped) + CSS regex pass (project-wide)_
- _`_bmad-output/implementation-artifacts/1-8-hos-shell-composition-contract.md` — Status `ready-for-dev` → `done`, Dev Agent Record filled_
- _`NOTES.md` — Done/Up Next refreshed_

_**PRESERVED (unchanged):**_
- _`eslint.config.js` — Story 1.6 disclaimer-integrity rule covers this story's text-content concerns_
- _`.github/workflows/ci.yml` — `rods-grid` job already runs `npm run check:rods`_
- _`package.json` — `check:rods` npm script unchanged_
- _`vite.config.ts` — Story 1.7's `scripts/**/*.test.{ts,tsx}` include extension is sufficient_
- _All Story 1.1 / 1.5 / 1.6 / 1.7 scaffold files_
- _`tests/e2e/smoke.spec.ts` — Story 1.1 smoke spec; unaffected_
)_
