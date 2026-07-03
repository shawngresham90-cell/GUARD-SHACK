# Story 1.7: Build AffiliateCTA composition contract + FTC AST scan

**Status:** done

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-7-affiliate-cta-composition-contract`
**Generated:** 2026-05-17
**Author of dev-spec:** Claude (Opus 4.7, 1M context) — paired-planning with Huffy
**Sequencing note:** Unblocked by Story 1.6 (`<Disclaimer kind="ftc">` ships in commit `be27a85`). Independent of Supabase work. Sequenced ahead of Story 1.8 (HosShell composition contract — same shape, different disclaimer kind) and ahead of Story 4.8 (transition TPC slot from hardcoded to admin-managed), which both require this story's `<AffiliateCTA>` wrapper as a precondition.

---

## Story

As **Huffy (the developer)**,
I want **a single `<AffiliateCTA>` composition contract that renders the FTC disclosure as an enforced sibling of every affiliate CTA in the codebase, plus a real TypeScript-AST CI gate that fails the build on any `<a>` or `<button>` whose `href` matches an affiliate URL pattern outside an `<AffiliateCTA>` ancestor**,
So that **FR15 (FTC disclosure adjacent to every affiliate CTA), FR34 (single-source disclosure component), FR35 (CI-enforced sibling rendering), and NFR-C2 (load-bearing affiliate-CTA composition rule) are structurally guaranteed across all current and future affiliate flows — Story 2.7 (TpcResultCard), Story 4.8 (admin-managed slots), and every Stan-Store / fuel-card / load-board / insurance vertical can compose `<AffiliateCTA>` with confidence that the FTC disclosure is impossible to forget**.

---

## Preconditions

1. ✅ Story 1.1 is `done` — scaffold, Tailwind v4, Vitest + RTL wired, `tsconfig.app.json` with `@/*` path alias to `src/*`.
2. ✅ Story 1.5 is `done` — 8-job CI pipeline live; `ftc-disclosure` job runs `npm run check:ftc` (currently a regex stub at `scripts/ci/check-ftc-disclosure.ts`); `unit` CI job picks up new `*.test.ts(x)` files automatically.
3. ✅ Story 1.6 is `done` — `<Disclaimer kind="ftc">` exists at `src/components/Disclaimer.tsx`; the `FTC` canonical string ships from `src/core/disclaimers.ts`.
4. ✅ Story 1.2 is `done` — migrations applied to TruckLifePWA production (not a dependency for 1.7 functionally, but the shared baseline on `main`).
5. ✅ Working tree clean on `main` (commit `f07452b`); no in-flight branches.
6. ✅ Node 20.x; npm scripts `lint`, `format:check`, `typecheck`, `test`, `build`, `check:ftc`, `check:rods`, `check:disclaimer-source` all green locally.
7. ✅ `typescript` v6.x is already a devDep — its built-in Compiler API is the AST walker for this story (no new dependency).

No external dependency. No Shawn involvement. No lawyer-review gate — the FTC disclosure copy was finalized in Story 1.6 and re-used here by reference. The TPC affiliate URL pattern (`truckparkingclub.com/book`) is already locked in the PRD (line 856–891 area + epic 1.7 AC line 464). Future affiliate hosts (fuel-card, load-board, insurance) are listed in the scanner config but unused at v1 — they ship live in their respective Story 4.x epics.

---

## Acceptance Criteria

The epic's compound AC (epics.md:452–466) decomposes into AC1–AC8.

**AC1 — `AffiliateSlot` type defined at `src/core/types/affiliate.ts` (minimal v1 shape)**

**Given** the project state after Story 1.6
**When** `src/core/types/affiliate.ts` is created
**Then** the file exports an `AffiliateSlot` interface with at minimum `{ id: string; bookingUrl: string }` (camelCase, matching the architecture's `src/core/types/` boundary mapper convention)
**And** the file declares this is the v1 minimal shape — Story 4.1's `affiliate_slots` migrations will refine the type (vertical, image, copy, code, UTM, on/off, version per architecture.md:335). The header comment names that follow-up explicitly.
**And** the file has no runtime exports (types only) and imports nothing from outside `src/core/`

**AC2 — `<AffiliateCTA>` component renders children + `<Disclaimer kind="ftc">` as siblings**

**Given** AC1 is in place and Story 1.6 ships `<Disclaimer kind="ftc">`
**When** `src/components/AffiliateCTA.tsx` is implemented per the architecture contract (architecture.md:463–471)
**Then** the component accepts `{ slot: AffiliateSlot; children: ReactNode }` props
**And** renders a single `<div data-testid="affiliate-cta-block" data-slot-id={slot.id}>{children}<Disclaimer kind="ftc" /></div>`
**And** the FTC disclosure is always rendered, regardless of `children` (including `null`, empty fragments, multi-element children, deeply nested wrappers)
**And** the component takes no other props, has no internal state, and never imports the canonical FTC string directly — it always goes through `<Disclaimer kind="ftc">`

**AC3 — Unit tests cover composition invariants**

**Given** AC2 is in place
**When** `src/components/AffiliateCTA.test.tsx` is created and `npm run test` is run
**Then** RTL tests assert:
- FTC disclosure (via `data-disclaimer="ftc"`) is in the document when `children` is a simple `<a href="...">Book</a>`
- FTC disclosure is in the document when `children` is `null`
- FTC disclosure is in the document when `children` is a fragment of multiple elements
- `data-slot-id` on the wrapper matches `slot.id`
- `data-testid="affiliate-cta-block"` is present on the wrapper
**And** the test file imports `<Disclaimer>` from the same source-of-truth module as `<AffiliateCTA>` (i.e. it doesn't inline "earns a commission" — that would trip the disclaimer-integrity ESLint rule)
**And** all assertions pass; `unit` CI job picks the file up automatically

**AC4 — `scripts/ci/check-ftc-disclosure.ts` rewritten as TypeScript AST walk**

**Given** AC2 is in place and the regex stub at `scripts/ci/check-ftc-disclosure.ts` exists from Story 1.5
**When** the script is rewritten to use the TypeScript Compiler API (`import ts from 'typescript'`)
**Then** the script parses every `.tsx` file under `src/` as a `ts.SourceFile` (script kind `TSX`)
**And** for each `<a>` or `<button>` JSX element (opening or self-closing) whose statically-resolvable `href` attribute matches an affiliate URL pattern (`truckparkingclub.com`, `stan.store/shawn`, plus the future-vertical placeholders documented in the file), the scanner checks whether any ancestor JSX element has the tag name `AffiliateCTA`
**And** elements with no `<AffiliateCTA>` ancestor are reported as violations with file path, line number, column, matched pattern, and a one-line excerpt
**And** the scanner exits 0 with a clear status line when no violations exist; exits non-zero with formatted error output when any violation exists
**And** elements with a dynamic `href` (`href={someUrl}`) are not flagged (cannot statically determine target — out of scope for AST scan; runtime check would belong in `affiliate-event-beacon` if added later)
**And** `npm run check:ftc` runs end-to-end successfully on the Story 1.7 codebase (no affiliate-URL `<a>`s exist in `src/` yet)

**AC5 — Scanner exposes a testable `scanFile(path, source)` function**

**Given** AC4 is in place
**When** the scanner is refactored to export `scanFile(path: string, source: string): Violation[]` (and the `Violation` interface) in addition to the CLI `main()`
**Then** the function performs the same AST walk and returns the violations array without printing or exiting
**And** the CLI `main()` calls `scanFile()` on each walked file and aggregates the results before the print + exit decisions
**And** the function is pure (no filesystem or process side effects beyond reading the passed-in source string)
**And** the npm script `check:ftc` behavior is unchanged (CLI run still produces the same output and exit-code contract)

**AC6 — Known-good and known-bad fixtures under `tests/fixtures/affiliate-cta/`**

**Given** AC2 + AC5 are in place
**When** `tests/fixtures/affiliate-cta/known-good.tsx` and `tests/fixtures/affiliate-cta/known-bad.tsx` are created
**Then** `known-good.tsx` renders an `<a href="https://truckparkingclub.com/book?code=SHAWN20">Book with SHAWN20</a>` wrapped in `<AffiliateCTA slot={...}>` — `scanFile()` on this fixture returns `[]`
**And** `known-bad.tsx` renders the same `<a>` outside any `<AffiliateCTA>` ancestor — `scanFile()` on this fixture returns a non-empty violation array with the affiliate URL pattern matched
**And** both fixtures are minimal, well-formed TSX (import React, export a component) — they parse cleanly and don't trip any lint rule (no inline disclaimer substrings, no unused imports)
**And** the fixtures live under `tests/fixtures/` so they're outside `tsconfig.app.json`'s `include: ["src"]` — neither `tsc -b` (build) nor `vite build` touches them, and the existing default `npm run check:ftc` (scan root = `src/`) does not pick them up

**AC7 — Vitest test asserts scanner behavior against both fixtures**

**Given** AC5 + AC6 are in place
**When** `scripts/ci/check-ftc-disclosure.test.ts` is created and `npm run test` is run
**Then** test 1 reads `tests/fixtures/affiliate-cta/known-good.tsx`, passes its contents to `scanFile()`, and asserts the returned array is empty
**And** test 2 reads `tests/fixtures/affiliate-cta/known-bad.tsx`, passes its contents to `scanFile()`, and asserts the returned array has exactly one violation whose `pattern` matches `truckparkingclub.com`
**And** a third test exercises dynamic-href behavior: a synthetic source string with `<a href={dynamicUrl}>` is asserted to produce zero violations (dynamic-href guard)
**And** all three tests pass; `unit` CI job picks the file up automatically

**AC8 — Verification PR green; merged to main**

**Given** AC1–AC7 are in place
**When** a verification PR is opened on `feat/story-1-7-affiliate-cta`
**Then** all 8 required CI checks report green — `lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`
**And** the `ftc-disclosure` job runs the tightened AST scanner against the Story 1.7 baseline (no affiliate `<a>`s in `src/`) and exits 0
**And** the `unit` job runs `check-ftc-disclosure.test.ts` plus `AffiliateCTA.test.tsx` and reports both green
**And** the PR is mergeable under GitHub branch protection; merge commit lands on `main`; the push-trigger CI run is also green

---

## Tasks / Subtasks

Execute in order. Each task ends with explicit verification.

### Task 1 — Pre-flight verification (AC: preconditions)

- [ ] **1.1** `git status` clean on `main`.
- [ ] **1.2** `git log --oneline -3` shows `f07452b chore(story-1.2): migrations applied to TruckLifePWA production...` at HEAD.
- [ ] **1.3** All 8 npm gates green locally:
  ```bash
  npm run lint && npm run format:check && npm run typecheck && \
    npm run test && npm run build && \
    npm run check:ftc && npm run check:rods && npm run check:disclaimer-source
  ```
- [ ] **1.4** Confirm `typescript` v6.x is in `devDependencies` of `package.json` (no new install needed).
- [ ] **1.5** Branch off main: `git checkout -b feat/story-1-7-affiliate-cta`.

### Task 2 — Create `src/core/types/affiliate.ts` (AC: AC1)

- [ ] **2.1** Create directory: `mkdir -p src/core/types`. (First file under `src/core/types/` — Story 1.2's `src/core/types/supabase.ts` was deferred and is not blocking; both stories writing to `src/core/types/` will not conflict — different filenames.)
- [ ] **2.2** Create `src/core/types/affiliate.ts` with the content from *Dev Notes → `affiliate.ts` contract*.
- [ ] **2.3** Verify `npm run typecheck` exits 0 — the file is types-only with no runtime symbols.
- [ ] **2.4** Verify `npm run format:check` exits 0.

### Task 3 — Create `src/components/AffiliateCTA.tsx` (AC: AC2)

- [ ] **3.1** Create `src/components/AffiliateCTA.tsx` with the content from *Dev Notes → `AffiliateCTA.tsx` contract*.
- [ ] **3.2** Verify `npm run typecheck` exits 0. The `slot` prop is typed via `AffiliateSlot`; consumers passing a malformed object fail at compile time.
- [ ] **3.3** Verify `npm run lint` exits 0 — no inline disclaimer substrings (the FTC string is rendered via `<Disclaimer kind="ftc">`).
- [ ] **3.4** Verify `npm run check:disclaimer-source` exits 0 — the out-of-band scanner agrees no forbidden substrings appear outside the allowlist.

### Task 4 — Create `src/components/AffiliateCTA.test.tsx` (AC: AC3)

- [ ] **4.1** Create `src/components/AffiliateCTA.test.tsx` with the content from *Dev Notes → `AffiliateCTA.test.tsx` contract*.
- [ ] **4.2** Run `npm run test` — the new test file should be picked up; all 5 assertions pass.
- [ ] **4.3** Sanity-check failure mode: temporarily comment out the `<Disclaimer kind="ftc" />` line in `AffiliateCTA.tsx`, re-run `npm run test`, confirm all 3 "FTC always rendered" assertions fail with `Unable to find an element by: [data-disclaimer="ftc"]`. **Then revert.**

### Task 5 — Create `tests/fixtures/affiliate-cta/` fixtures (AC: AC6)

- [ ] **5.1** Create directory: `mkdir -p tests/fixtures/affiliate-cta`.
- [ ] **5.2** Create `tests/fixtures/affiliate-cta/known-good.tsx` with the content from *Dev Notes → `known-good.tsx` contract*.
- [ ] **5.3** Create `tests/fixtures/affiliate-cta/known-bad.tsx` with the content from *Dev Notes → `known-bad.tsx` contract*.
- [ ] **5.4** Verify the fixtures parse: `npx tsc --noEmit --jsx react-jsx --target esnext --moduleResolution bundler --skipLibCheck tests/fixtures/affiliate-cta/known-good.tsx tests/fixtures/affiliate-cta/known-bad.tsx` exits 0. (Standalone parse-only check — these files are not part of the app build, so they won't appear in `npm run typecheck`.)
- [ ] **5.5** Verify `npm run check:ftc` still exits 0 — the existing scan root is `src/`, so the bad fixture is not picked up by the default CLI run.
- [ ] **5.6** Verify `npm run lint` exits 0 — fixtures don't contain disclaimer substrings or unused imports.

### Task 6 — Rewrite `scripts/ci/check-ftc-disclosure.ts` (AC: AC4, AC5)

- [ ] **6.1** Replace the entire contents of `scripts/ci/check-ftc-disclosure.ts` with the content from *Dev Notes → `check-ftc-disclosure.ts` contract*.
- [ ] **6.2** Run `npm run check:ftc` — exits 0 on the Story 1.7 codebase (no affiliate URLs in `src/` yet).
- [ ] **6.3** Sanity-check failure mode: temporarily add an unwrapped affiliate `<a>` to `src/App.tsx` (e.g. `<a href="https://truckparkingclub.com/book">test</a>`), re-run `npm run check:ftc`, confirm the scanner reports the violation with file + line + matched pattern + excerpt and exits non-zero. **Then revert.**
- [ ] **6.4** Verify the same line wrapped in `<AffiliateCTA slot={{ id: 'test', bookingUrl: '...' }}>...</AffiliateCTA>` passes the scanner — needs a minimal smoke-test by hand in App.tsx, then revert.
- [ ] **6.5** Run `npm run typecheck` — the new scanner uses TS Compiler API; type-checks cleanly. Note: `scripts/ci/` is excluded from `tsconfig.app.json`'s `include: ["src"]`, so the script doesn't go through `tsc -b`. It runs via `tsx`, which type-checks on the fly without strict pre-validation. If `npm run typecheck` were to scan it, it would still pass.

### Task 7 — Create `scripts/ci/check-ftc-disclosure.test.ts` (AC: AC7)

- [ ] **7.1** Create `scripts/ci/check-ftc-disclosure.test.ts` with the content from *Dev Notes → `check-ftc-disclosure.test.ts` contract*.
- [ ] **7.2** Run `npm run test` — the new test file is picked up; all 3 assertions pass.
- [ ] **7.3** Verify Vitest's working directory resolution: the test reads fixtures via relative paths from the repo root (`tests/fixtures/affiliate-cta/known-good.tsx`). If Vitest runs from a different cwd, switch to `path.resolve(__dirname, ...)` form — the contract already uses `path.resolve` to be robust.

### Task 8 — Bulletproof sanity check (combined AC4 + AC5 + AC7 verification)

- [ ] **8.1** End-to-end smoke: with everything green, temporarily add `<a href="https://truckparkingclub.com/book">unwrapped</a>` to `src/App.tsx`. Confirm:
  - `npm run check:ftc` exits non-zero with the violation printed
  - `npm run lint` still exits 0 (the disclaimer-integrity rule doesn't fire — no forbidden substrings; the FTC scanner is the only gate that catches unwrapped CTAs)
  - The `ftc-disclosure` CI job would fail on this PR (verified by local script behavior)
- [ ] **8.2** Wrap the `<a>` in `<AffiliateCTA slot={{ id: 'manual-test', bookingUrl: 'https://truckparkingclub.com/book' }}>...</AffiliateCTA>`. Confirm:
  - `npm run check:ftc` exits 0
  - `npm run lint` exits 0
- [ ] **8.3** Revert App.tsx to clean state.
- [ ] **8.4** Re-run all 8 gates one more time to confirm clean baseline. **This is the load-bearing check** — without verifying the structural enforcement fires, the FTC AST scan ships as theater.

### Task 9 — Local sanity gates pass (AC: AC8 prep)

- [ ] **9.1** `npm run lint` → exit 0
- [ ] **9.2** `npm run format:check` → exit 0
- [ ] **9.3** `npm run typecheck` → exit 0
- [ ] **9.4** `npm run test` → exit 0 (expect ~18 total tests: 10 from Story 1.6 + 5 new AffiliateCTA tests + 3 new FTC scanner tests; duration < 5s)
- [ ] **9.5** `npm run check:ftc` → exit 0
- [ ] **9.6** `npm run check:rods` → exit 0 (unchanged by this story)
- [ ] **9.7** `npm run check:disclaimer-source` → exit 0
- [ ] **9.8** `npm run build` → exit 0. Verify bundle size hasn't shifted meaningfully (expect within ±0.5 KB gz of Story 1.6's ~60 KB; AffiliateCTA is ~200 bytes raw).
- [ ] **9.9** `npx size-limit` → still under 200 KB gz.

### Task 10 — Open verification PR (AC: AC8)

- [ ] **10.1** Stage:
  ```bash
  git add src/core/types/affiliate.ts \
          src/components/AffiliateCTA.tsx \
          src/components/AffiliateCTA.test.tsx \
          tests/fixtures/affiliate-cta/known-good.tsx \
          tests/fixtures/affiliate-cta/known-bad.tsx \
          scripts/ci/check-ftc-disclosure.ts \
          scripts/ci/check-ftc-disclosure.test.ts
  ```
- [ ] **10.2** Commit:
  ```
  feat(story-1.7): AffiliateCTA composition contract + FTC AST scan

  - src/components/AffiliateCTA.tsx ships the architecture composition
    contract: every affiliate CTA renders <Disclaimer kind="ftc"> as
    an enforced sibling (FR15, FR34, FR35).
  - src/core/types/affiliate.ts declares the minimal v1 AffiliateSlot
    shape; full schema lands in Story 4.1.
  - scripts/ci/check-ftc-disclosure.ts tightened from regex stub to a
    TypeScript Compiler API AST walk: <a>/<button> with affiliate-URL
    href outside an <AffiliateCTA> ancestor fails the build.
  - tests/fixtures/affiliate-cta/{known-good,known-bad}.tsx provide the
    structural test bench.
  - scripts/ci/check-ftc-disclosure.test.ts asserts the scanner returns
    [] on known-good, one violation on known-bad, and ignores dynamic
    href attributes.
  - AffiliateCTA RTL tests cover FTC-always-rendered invariants across
    null / fragment / nested children.
  ```
- [ ] **10.3** Push: `git push -u origin feat/story-1-7-affiliate-cta`.
- [ ] **10.4** Open PR via GitHub UI targeting `main`. Title: `Story 1.7: AffiliateCTA composition contract + FTC AST scan`.
- [ ] **10.5** Confirm all 8 CI checks report green. Likely flake points to watch:
  - `lighthouse` — same Story 1.5 flake class. AffiliateCTA isn't rendered anywhere yet (no route mounts it), so perf/a11y impact is zero.
  - `e2e` — Story 1.1's smoke spec doesn't render `<AffiliateCTA>`. Stays green.
  - `ftc-disclosure` — this is the job under test. The tightened scanner runs on a codebase with no affiliate `<a>`s in `src/`, so it should exit 0 cleanly.

### Task 11 — Merge + sync + status update

- [ ] **11.1** Merge the PR via GitHub UI (Create a merge commit, per the established convention).
- [ ] **11.2** Locally: `git checkout main && git pull --ff-only origin main`.
- [ ] **11.3** Delete branches: `git branch -d feat/story-1-7-affiliate-cta && git push origin --delete feat/story-1-7-affiliate-cta`.
- [ ] **11.4** Mark this story file's `Status` field to `done`.
- [ ] **11.5** Append a Completion Note to *Dev Agent Record → Completion Notes List* below.
- [ ] **11.6** List every file created/modified in *Dev Agent Record → File List*.
- [ ] **11.7** Update `NOTES.md` "Done" / "Up Next" sections — Story 1.7 in Done; Story 1.8 (HosShell composition contract) in Up Next as it's now the next unblocked composition-contract story.

---

## Dev Notes

### Critical reminders (read before coding)

**Reminder 1 — `<AffiliateCTA>` never inlines the FTC string.** The component delegates to `<Disclaimer kind="ftc">`. If you find yourself writing `"earns a commission"` anywhere in this story's code, stop — the disclaimer-integrity ESLint rule from Story 1.6 will fail the build. The only legal home for that string is `src/core/disclaimers.ts`.

**Reminder 2 — The scanner walks ancestors, not just direct parents.** The epic AC says "outside an `<AffiliateCTA>` parent" (single noun, loose). Architecture.md:721 says "direct child of `<AffiliateCTA>`" (stricter). This spec implements the looser interpretation: any `<AffiliateCTA>` ancestor in the JSX tree satisfies the rule. Rationale: the FR35 contract is "FTC disclosure adjacent to every affiliate CTA" — wrapping at any depth still produces the disclosure as a sibling of the children subtree. The "direct child" guidance is a PR-review convention to keep the wrapper-usage legible; the scanner enforces the structural minimum. If future evidence shows deep nesting causing confusion, tighten the rule then.

**Reminder 3 — Dynamic `href` is not flagged.** `<a href={someUrl}>` can't be statically resolved, so the scanner skips it. This is a known gap — runtime instrumentation in `affiliate-event-beacon` (Story 4.5) is the right place for that check if it ever matters. Most affiliate URLs in v1 are literal strings (TPC's `truckparkingclub.com/book?code=SHAWN20`), so this gap doesn't bite v1 ship.

**Reminder 4 — `AffiliateSlot` is intentionally minimal.** Story 4.1 ships the full `affiliate_slots` schema (vertical, image, copy, code, UTM, on/off, version per architecture.md:335). For Story 1.7, the component only needs `{ id, bookingUrl }` to render the `data-slot-id` attribute and to typecheck consumer call sites. Don't over-engineer the type now — refining it in Story 4.1 will be a backward-compatible widening (adding optional fields).

**Reminder 5 — Fixtures live OUTSIDE `src/`.** `tests/fixtures/affiliate-cta/` is the canonical home (per epic AC: "both committed under `tests/fixtures/`"). This keeps them out of `tsconfig.app.json`'s build set (`include: ["src"]`) and out of `vite build`'s bundling. The default `npm run check:ftc` (scan root = `src/`) also doesn't pick them up — which is the point. The Vitest test in Task 7 explicitly reads them by path.

**Reminder 6 — Scope: no Parking module, no TpcResultCard, no admin slot CRUD.** Story 1.7 ships the *composition contract* and the *enforcement gate*. The first consumers are:
- Story 2.7 (`TpcResultCard` — wraps the TPC booking link in `<AffiliateCTA>`)
- Story 4.8 (transition the TPC slot from hardcoded to admin-managed)
- Stan-Store cross-promo cards (Stories 5.6, 5.7, 5.8 — each renders an affiliate CTA wrapped in `<AffiliateCTA>`)

If you find yourself reaching for `ParkingHome`, `TpcResultCard`, or slot CRUD UI while doing 1.7, stop.

**Reminder 7 — App.tsx stays alone.** Don't render `<AffiliateCTA>` in `App.tsx` "just to see it." The smoke E2E spec from Story 1.1 asserts the brand heading text; adding affiliate UI to App.tsx changes what users see at `/` before any feature ships. AffiliateCTA rendering happens in the route screens where each slot belongs, starting Story 2.7. The Task 8 "wrap and verify" probe is temporary — revert after the manual confirmation.

### `affiliate.ts` contract

`src/core/types/affiliate.ts`. Types-only module; lives under the `src/core/types/` boundary mapper directory per architecture.md:927 (which co-locates `ParkingResult` + `AffiliateSlot` types). This v1 shape is intentionally minimal — Story 4.1 widens it when the full `affiliate_slots` schema lands.

```ts
// src/core/types/affiliate.ts
//
// AffiliateSlot — minimal v1 shape consumed by <AffiliateCTA>.
//
// Story 4.1 ships the full affiliate_slots table schema (architecture.md:335):
//   vertical, image, copy, code, UTM, on/off, version
//
// At v1.7 the only consumers are:
//   - <AffiliateCTA> wrapper (needs `id` for data-slot-id attribute)
//   - manual / fixture call sites (need `bookingUrl` to populate the href)
//
// When Story 4.1 lands, this interface widens with optional fields plus
// a Vertical union. Adding optional fields is backward-compatible; consumers
// that only read `id` and `bookingUrl` keep working unchanged.

export interface AffiliateSlot {
  id: string;
  bookingUrl: string;
}
```

### `AffiliateCTA.tsx` contract

`src/components/AffiliateCTA.tsx`. Matches the architecture's composition contract (architecture.md:463–471) verbatim.

```tsx
// src/components/AffiliateCTA.tsx
//
// Composition contract (FR15, FR34, FR35, NFR-C2 — load-bearing).
//
// The ONLY way to render an affiliate CTA in this codebase. Every <a> or
// <button> whose href points to an affiliate URL pattern (truckparkingclub.com,
// stan.store/shawn, future fuel-card / load-board / insurance hosts) must be
// inside an <AffiliateCTA> subtree. The FTC disclosure is rendered as an
// enforced sibling of children — impossible to forget by construction.
//
// Enforcement: scripts/ci/check-ftc-disclosure.ts (TypeScript Compiler API
// AST walk) fails the `ftc-disclosure` CI job on violation.
//
// Future composition: when Story 4.1 lands the full affiliate_slots schema,
// this component's `slot` prop widens. Adding optional fields is BC.

import type { ReactNode } from 'react';
import type { AffiliateSlot } from '@/core/types/affiliate';
import { Disclaimer } from './Disclaimer';

export function AffiliateCTA({
  slot,
  children,
}: {
  slot: AffiliateSlot;
  children: ReactNode;
}) {
  return (
    <div data-testid="affiliate-cta-block" data-slot-id={slot.id}>
      {children}
      <Disclaimer kind="ftc" />
    </div>
  );
}
```

Notes:
- No `className` prop. If a consumer wants different placement, it wraps `<AffiliateCTA>` in its own layout div. Keeps the contract minimal and the AST scanner easy to reason about.
- The `data-testid="affiliate-cta-block"` and `data-slot-id={slot.id}` attributes are stable test-target hooks. The scanner only checks tag name (`AffiliateCTA`), not attributes — so renaming the testid later is safe; renaming the component is not (would break the scanner — that's a deliberate breakage if it ever happens).
- `Disclaimer` is imported relatively (`./Disclaimer`), matching how Story 1.6 wired the FTC test from disclaimers.ts.

### `AffiliateCTA.test.tsx` contract

`src/components/AffiliateCTA.test.tsx`. Co-located with the source per Story 1.1's testing standard.

```tsx
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
```

### `known-good.tsx` contract

`tests/fixtures/affiliate-cta/known-good.tsx`. Minimal well-formed TSX; imports the real `<AffiliateCTA>` so a future rename of the component breaks the fixture (deliberate — the fixture is a contract test against the public component name). Lives outside `src/`, so it's not bundled or type-checked by the app build.

```tsx
// tests/fixtures/affiliate-cta/known-good.tsx
//
// Structural pass fixture for scripts/ci/check-ftc-disclosure.ts.
// The affiliate <a> is wrapped in <AffiliateCTA> — scanner should return [].

import { AffiliateCTA } from '@/components/AffiliateCTA';

const slot = {
  id: 'tpc-fixture-good',
  bookingUrl: 'https://truckparkingclub.com/book?code=SHAWN20',
};

export function KnownGoodAffiliateCta() {
  return (
    <AffiliateCTA slot={slot}>
      <a href="https://truckparkingclub.com/book?code=SHAWN20">Book with SHAWN20</a>
    </AffiliateCTA>
  );
}
```

### `known-bad.tsx` contract

`tests/fixtures/affiliate-cta/known-bad.tsx`. Same affiliate `<a>` but NOT wrapped — scanner should fire.

```tsx
// tests/fixtures/affiliate-cta/known-bad.tsx
//
// Structural fail fixture for scripts/ci/check-ftc-disclosure.ts.
// The affiliate <a> is NOT wrapped in <AffiliateCTA> — scanner should
// return exactly one violation matching the truckparkingclub.com pattern.

export function KnownBadAffiliateCta() {
  return (
    <div>
      <a href="https://truckparkingclub.com/book?code=SHAWN20">Book with SHAWN20</a>
    </div>
  );
}
```

### `check-ftc-disclosure.ts` contract

`scripts/ci/check-ftc-disclosure.ts`. Full rewrite — replaces the Story 1.5 regex stub.

```ts
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
    console.log('[check:ftc] OK — every affiliate URL <a>/<button> is wrapped in <AffiliateCTA>');
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
```

Notes on the AST traversal:

- `ts.createSourceFile(..., setParentNodes: true, ts.ScriptKind.TSX)` parses TSX with parent pointers wired. We don't strictly need `setParentNodes: true` because we maintain our own ancestor stack, but it's cheap insurance for future scanner extensions.
- The ancestor stack approach is simpler and faster than walking `node.parent` for every `<a>` / `<button>` — the visitor pushes on entering a `JsxElement` and pops on exit.
- `ts.JsxSelfClosingElement` (e.g. `<a href="..." />`) has no children, so it doesn't open a scope on the ancestor stack. Its parent `JsxElement`, if any, is already on the stack.
- The `isCliEntry` guard at the bottom is the canonical ESM pattern for "run main() only when called as a script." Vitest imports the module to call `scanFile()` directly; `main()` must not run during test setup.

### `check-ftc-disclosure.test.ts` contract

`scripts/ci/check-ftc-disclosure.test.ts`. Co-located with the scanner for navigation; Vitest picks it up via its default include glob.

```ts
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
```

### `package.json` — no changes needed

The `check:ftc` npm script from Story 1.5 (`"check:ftc": "tsx scripts/ci/check-ftc-disclosure.ts"`) is unchanged. The `unit` CI job auto-discovers the new `*.test.ts` and `*.test.tsx` files via Vitest's default include glob. No new dependency installs.

### `.github/workflows/ci.yml` — no changes needed

The `ftc-disclosure` job from Story 1.5 already runs `npm run check:ftc`. Tightening the underlying script from regex to AST is invisible to the CI YAML.

### `eslint.config.js` — no changes needed (and don't touch it)

The Story 1.6 disclaimer-integrity rule already enforces "earns a commission" outside the SOT module — `<AffiliateCTA>` uses `<Disclaimer kind="ftc">` rather than inlining the string, so this story adds no new ESLint rules. The existing per-file exemption list (`disclaimers.ts`, `disclaimers.test.ts`, `check-disclaimer-source.ts`) is unchanged. **Resist any urge to add `AffiliateCTA.tsx` to the exemption list** — that would defeat the rule's purpose.

### Architecture compliance notes

- **`<AffiliateCTA>` shape** matches architecture.md:463–471 verbatim — same `data-testid="affiliate-cta-block"`, same `data-slot-id={slot.id}`, same `<Disclaimer kind="ftc" />` placement.
- **Component location** `src/components/AffiliateCTA.tsx` matches architecture.md:933.
- **`AffiliateSlot` type location** is a deliberate v1 reading of architecture.md:927 + :1011: the boundary mapper (`src/core/types/`) hosts the canonical type; the module-internal `src/modules/affiliate/types.ts` will re-export or extend it when Story 4.1 ships. Since 1.7 needs a globally-importable type before the affiliate module exists, `src/core/types/affiliate.ts` is the cleaner home for now.
- **Scanner location** matches architecture.md:853 (`scripts/ci/check-ftc-disclosure.ts`).
- **Enforcement rule** matches architecture.md:720–722 (load-bearing). Spec reminder 2 documents the deliberate "ancestor not direct child" interpretation.
- **CI gate** matches architecture.md:548 (`ftc-disclosure` — required, source FR35).

### Library/framework compliance

- **No new npm dependencies.** TypeScript Compiler API ships with the existing `typescript` v6.x devDep. `tsx` (from Story 1.5) executes the script. `vitest` + `@testing-library/react` (from Story 1.1) cover the unit and scanner tests.
- **No new ESLint plugins.** Disclaimer-integrity rule from Story 1.6 is sufficient — `<AffiliateCTA>` doesn't inline disclaimer text.
- **No CSS-in-JS, no icon library, no new state library.** Consistent with Story 1.1's lock.

### File structure compliance

After Story 1.7 commits, the repo gains:

```
trucking-life-pwa/
├── src/
│   ├── core/
│   │   └── types/                              # NEW directory (first file)
│   │       └── affiliate.ts                    # NEW (AffiliateSlot minimal v1)
│   └── components/
│       ├── AffiliateCTA.tsx                    # NEW (composition contract)
│       └── AffiliateCTA.test.tsx               # NEW (RTL invariant tests)
├── tests/
│   └── fixtures/                               # NEW directory (first content)
│       └── affiliate-cta/
│           ├── known-good.tsx                  # NEW (scanner pass fixture)
│           └── known-bad.tsx                   # NEW (scanner fail fixture)
└── scripts/
    └── ci/
        ├── check-ftc-disclosure.ts             # MODIFIED (full rewrite — regex → AST)
        └── check-ftc-disclosure.test.ts        # NEW (scanner behavior assertions)
```

Note: `src/core/types/` is first populated here. Story 4.1 (Affiliate-related migrations) and a future Story 2.1 (Parking migrations) will add `src/core/types/parking.ts`, `src/core/types/supabase.ts`, etc. Different filenames; no conflict.

### Testing standards

- Component tests for `AffiliateCTA.tsx` co-located with source per Story 1.1.
- Scanner unit tests for `check-ftc-disclosure.ts` co-located with the script under `scripts/ci/`. This is a deliberate small deviation from "tests live next to src" — these are tool-level tests for CI infrastructure, and keeping them next to the script under test is cleaner than mirroring them under `tests/`.
- No e2e changes — the smoke spec at `tests/e2e/smoke.spec.ts` doesn't render `<AffiliateCTA>`. Route-level affiliate e2e tests land with the parking + admin stories.
- No coverage threshold yet at v1.

### Lighthouse + bundle impact

- `<AffiliateCTA>` is ~250 bytes raw + a small `data-*` attribute footprint. Gzipped, negligible.
- `AffiliateSlot` type: zero runtime cost (TypeScript erases types at compile time).
- Scanner rewrite: zero runtime cost — scripts under `scripts/ci/` don't bundle into the app.
- Expected post-Story-1.7 bundle: ~60 KB gz (Story 1.6 baseline 59–60 KB gz, depending on size-limit vs Vite reporter granularity). Within ±0.5 KB of Story 1.6.
- Lighthouse a11y: net-neutral (no UI surface mounted yet). When Story 2.7 mounts `<AffiliateCTA>` in TpcResultCard, it inherits the dim-but-readable Disclaimer styling from Story 1.6 (WCAG AAA contrast).

### Git intelligence (recent commits as context)

```
f07452b chore(story-1.2): migrations applied to TruckLifePWA production
aaf48f6 Merge branch 'main' into story-1.2-supabase-schema-wip
04210ab wip(story-1.2): supabase migrations + config scaffolding
f35b65d docs(story-1.6): mark done + write dev agent record
752c618 Merge pull request #2 from MikeHuffy/feat/story-1-6-disclaimers
be27a85 feat(story-1.6): canonical disclaimer source-of-truth
ae36257 docs(stories): add ready-for-dev spec for 1.6 (disclaimer source-of-truth)
```

Convention: `feat(story-N.N):` for scope-introducing work; `docs(stories):` for spec PRs; `docs(story-N.N):` for status/handoff commits. Story 1.7's spec-commit message:

```
docs(stories): add ready-for-dev spec for 1.7 (AffiliateCTA composition contract)
```

Story 1.7's implementation-commit message:

```
feat(story-1.7): AffiliateCTA composition contract + FTC AST scan
```

(Full commit body per Task 10.2.)

### Latest tech information (verified 2026-05-17)

- **TypeScript Compiler API** — stable; `ts.createSourceFile` + `ts.forEachChild` + `JsxOpeningLikeElement` are all the canonical APIs at TS 6.x. The Compiler API has been remarkably stable across major versions; the patterns used here would work unchanged on TS 4.x and forward to TS 7.x when it ships.
- **`ts.ScriptKind.TSX`** is the correct script kind for `.tsx` files. Omitting it (`createSourceFile` defaults to `Unknown`/inferring) sometimes works but can mis-parse JSX in edge cases. Always set it explicitly.
- **`import.meta.url === \`file://\${process.argv[1]}\`** — the "run main() if invoked as CLI" guard pattern for ESM. Works with `tsx` (which normalizes file:// URLs in argv[1]) and with Node 20+. Avoid the older `require.main === module` form; that's CJS-only.
- **Vitest 4.x** — picks up `*.test.ts` and `*.test.tsx` files under the project root automatically. The default include glob is `**/*.{test,spec}.{ts,tsx,js,jsx}` (excluding `node_modules`, `dist`, etc.). No vitest config tweak needed.

### Project Structure Notes

- **Alignment with architecture:** This story ships step 3 of the architecture's implementation sequence (architecture.md:572 — "Disclaimer core — disclaimers.ts, `<Disclaimer>`, `<AffiliateCTA>`, `<HosShell>`, FTC + RODS-grid CI gates wired"). Story 1.6 shipped `disclaimers.ts` + `<Disclaimer>`; this story ships `<AffiliateCTA>` + FTC CI gate; Story 1.8 will ship `<HosShell>` + RODS-grid CI gate.
- **Variances from architecture:** None expected. The "ancestor not direct child" scanner interpretation (Reminder 2) is a deliberate v1 reading of the architecture's "direct child" guidance — not a deviation, since the FR35 contract (FTC disclosure adjacent to CTA) is satisfied either way.

### Known follow-up (not Story 1.7 scope)

- **Story 1.8 (`<HosShell>`)** — same shape as `<AffiliateCTA>` but renders `<Disclaimer kind="hosFooter">` and tightens the RODS-grid scanner.
- **Story 2.7 (`TpcResultCard`)** — first real consumer of `<AffiliateCTA>` in the codebase. Will render the TPC booking link wrapped in `<AffiliateCTA slot={tpcSlot}>` and trigger the FTC scanner's first non-zero-input run.
- **Story 4.1 (`affiliate_slots` migration)** — ships the full `AffiliateSlot` schema (vertical, image, copy, code, UTM, on/off, version). At that point `src/core/types/affiliate.ts` widens (or `src/modules/affiliate/types.ts` is added per architecture.md:1011 and re-exports). Either path is backward-compatible.
- **Story 4.8 (TPC slot transition)** — moves the TPC slot from hardcoded to admin-managed. The `<AffiliateCTA>` wrapper continues to be the only legal render path — only the `slot` object's source changes.
- **Dynamic-href scanner extension** — out of scope for v1.7. If `href={someUrl}` patterns proliferate and start hiding affiliate links from the scanner, add a follow-up story to scan resolved imports + variable initializers. For now, the convention is: literal `href` string for affiliate CTAs.
- **Stan Store cross-promo cards (Stories 5.6, 5.7, 5.8)** — each renders an affiliate CTA wrapped in `<AffiliateCTA>` (using slot configs keyed by trigger). When those stories land, the `stan.store/shawn` pattern in the scanner starts firing — fixtures and tests will validate the same way they do for TPC.

### References

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
  - FR15 (FTC disclosure adjacent to every affiliate CTA)
  - FR34 (single-source disclosure component)
  - FR35 (CI-enforced sibling rendering)
  - NFR-C2 (load-bearing affiliate-CTA composition rule)
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
  - § *Implementation patterns / Component composition contracts* (lines 463–482 — the `<AffiliateCTA>` + `<HosShell>` contract shapes)
  - § *Process Patterns / Affiliate CTA composition (load-bearing)* (lines 720–722 — the enforcement rule this story implements)
  - § *Pattern Examples / Good — affiliate CTA / Anti-pattern — fails CI* (lines 758–779 — the exact good/bad shapes mirrored by the fixtures)
  - § *Implementation sequence — Disclaimer core* (line 572 — sequencing intent)
  - § *Project Directory Structure* (lines 853, 927, 933, 1011 — file locations)
  - § *CI/CD pipeline → `ftc-disclosure`* (line 548 — gate definition)
- **Epics:** `_bmad-output/planning-artifacts/epics.md`
  - § *Epic 1, Story 1.7* (lines 452–466 — source ACs)
  - § *Story 1.6* (lines 436–450 — upstream: `<Disclaimer kind="ftc">` source)
  - § *Story 1.8* (lines 468–482 — downstream: `<HosShell>` companion contract)
  - § *Story 2.7* (lines 687–704 — first consumer: TpcResultCard)
- **Story 1.6 dev record:** `_bmad-output/implementation-artifacts/1-6-disclaimer-source-of-truth.md`
  - Confirms `<Disclaimer kind="ftc">` is available; confirms disclaimer-integrity ESLint rule fires on inline "earns a commission".
- **Story 1.5 dev record:** `_bmad-output/implementation-artifacts/1-5-stub-ci-jobs.md`
  - Confirms `ftc-disclosure` CI job structure and the regex-stub baseline this story replaces.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — interactive paired-implementation mode with Huffy on Chromebook (Linux/bash). Each task verified before moving to the next.

### Debug Log References

- Pre-flight gates (Task 1.3) — all 8 green; baseline bundle 60.17 KB gz (Vite) / 59.37 KB gz (size-limit); 10 tests across 2 files from Stories 1.5/1.6.
- `npm run typecheck` + `npm run format:check` after Tasks 2 + 3 — both exit 0; Prettier later reflowed the multi-line prop signature in `AffiliateCTA.tsx` to a single line during Task 9 (same harmless behavior observed in Story 1.6's `disclaimers.test.ts` reflow).
- `npm run test` post-Task 4 — **Test Files 3 passed (3), Tests 15 passed (15)** — Story 1.6's 10 tests plus 5 new `<AffiliateCTA>` RTL tests.
- Task 4.3 failure-mode probe — commented out `<Disclaimer kind="ftc" />` in `AffiliateCTA.tsx`; re-ran `npm run test`; **3 of 3 "FTC always rendered" assertions failed** with `expected null not to be null` against `[data-disclaimer="ftc"]`. Reverted; 15/15 green again.
- `npm run check:ftc` after Task 6 rewrite — **scanned 6 .tsx files, OK**. The regex stub had been false-positive on AffiliateCTA.tsx's documentation comment mentioning `truckparkingclub.com`; the AST rewrite only inspects real JSX `href` attributes, naturally eliminating that noise.
- Task 6.3 + Task 8.1 combined probe — injected `<a href="https://truckparkingclub.com/book?code=SHAWN20">probe-unwrapped</a>` into `src/App.tsx`; `npm run check:ftc` exited **1** with `src/App.tsx:9:9  matches truckparkingclub.com` and the excerpt line printed. `npm run lint` still exited 0 (the disclaimer-integrity rule from Story 1.6 doesn't fire — no forbidden substrings).
- Task 6.4 + Task 8.2 combined probe — wrapped the probe `<a>` in `<AffiliateCTA slot={{ id: 'probe', bookingUrl: '...' }}>...</AffiliateCTA>`; `npm run check:ftc` exited **0**; lint still 0. Reverted App.tsx (`git checkout src/App.tsx`); confirmed clean.
- `npm run test` post-Task 7 — initially showed only 3 files / 15 tests (no change). Root cause: `vite.config.ts` had `test.include: ['src/**/*.test.{ts,tsx}']` — restrictive override of Vitest's default include glob. The new `scripts/ci/check-ftc-disclosure.test.ts` was outside that scope. Extended the include to `['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}']`; re-ran — **Test Files 4 passed (4), Tests 18 passed (18)**.
- Final Task 9 gate run — all 8 green: lint, format:check, typecheck, test 18/18, check:ftc (6 .tsx files scanned), check:rods (11 files), check:disclaimer-source (10 files, allowlist of 2), build (60.17 KB gz / 200 KB cap; size-limit 59.37 KB gz).
- GHA verification — PR #3 (`feat/story-1-7-affiliate-cta` → `main`), merged via merge commit `e225bae`. All 8 jobs green on first run including the tightened `ftc-disclosure` job running the new AST scanner against the Story 1.7 baseline.

### Completion Notes List

**All 8 acceptance criteria satisfied.** Story spans Tasks 1–11; implementation shipped via PR #3 (commits `c5c4a99` docs + `68b9bdb` feat, merge `e225bae`).

**Deviations from the original spec:**

1. **`vite.config.ts` test.include extended.** The spec assumed Vitest's default include glob would pick up `scripts/ci/check-ftc-disclosure.test.ts` (Task 7.3 noted "Vitest's working directory resolution" as the only concern). In practice, the project's `vite.config.ts` already overrode the default with `test.include: ['src/**/*.test.{ts,tsx}']` — scoped to `src/**` only, so the new scanner test was silently skipped. Fix: extended the include glob to `['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}']`. One-line config change; documented in the feat commit body. This makes `scripts/**/*.test.{ts,tsx}` the canonical home for tool-level test files going forward — Story 1.8's RODS-grid scanner test can use the same convention without re-touching the config.

2. **Prettier reflowed the `<AffiliateCTA>` prop signature.** First `format:check` run during Task 9 flagged `src/components/AffiliateCTA.tsx`; `npx prettier --write` collapsed `({ slot, children }: { slot: AffiliateSlot; children: ReactNode })` from multi-line to single-line. **No semantics changed** — same shape, same exported function name. Mirror of Story 1.6's same-class deviation (`disclaimers.test.ts` import reflow).

**Bundle size at green:** **59.37 KB gz** (size-limit) / **60.17 KB gz** (Vite reporter) — unchanged from Story 1.6 baseline within the precision floor. `<AffiliateCTA>` is ~250 bytes raw; `AffiliateSlot` type erases at compile time; the scanner rewrite never bundles. Net delta ≈ 0.

**Structural-enforcement sanity probe — the load-bearing check.** Without injecting an actual violation into `src/App.tsx` and confirming the new AST scanner exits 1 with file + line + matched pattern, the FTC AST scan would have shipped as theater. Both probes (unwrapped → fails; wrapped → passes) ran cleanly; revert via `git checkout src/App.tsx` was clean. Identical posture to Story 1.6's `(Not an ELD test)` injection probe.

**Downstream stories now unblocked:**
- **Story 1.8** (`<HosShell>` composition contract + RODS-grid scan tightening) — same shape as 1.7 but renders `<Disclaimer kind="hosFooter">`; can reuse the Task 7-style scanner test pattern with the new include glob in place.
- **Story 2.7** (`TpcResultCard`) — first real consumer of `<AffiliateCTA>` in the codebase; will trigger the FTC scanner's first non-zero-input production run.
- **Story 4.1** (affiliate_slots migrations) — at that point the v1 `AffiliateSlot` shape at `src/core/types/affiliate.ts` widens to include vertical, image, copy, code, UTM, on/off, version. Adding optional fields is backward-compatible; no consumer changes needed unless they opt into the new fields.
- **Stories 5.6 / 5.7 / 5.8** (Stan Store cross-promo cards) — each renders an affiliate CTA wrapped in `<AffiliateCTA>`; the scanner's `stan.store/shawn` pattern starts firing as those stories land.

**Architecture compliance:** `<AffiliateCTA>` shape matches architecture.md:463–471 verbatim. The "ancestor not just direct child" scanner interpretation (Reminder 2) is a deliberate v1 reading — the FR35 contract ("FTC disclosure adjacent to every affiliate CTA") is satisfied at any wrapping depth.

**Commits landed for Story 1.7** (chronological on `origin/main`):
1. `c5c4a99` — docs(stories): add ready-for-dev spec for 1.7 (AffiliateCTA composition contract)
2. `68b9bdb` — feat(story-1.7): AffiliateCTA composition contract + FTC AST scan
3. `e225bae` — Merge pull request #3 from MikeHuffy/feat/story-1-7-affiliate-cta
4. (Task 11 status update — pending commit at time of writing)

### File List

**CREATED:**
- `src/core/types/affiliate.ts` — `AffiliateSlot` interface with minimal v1 shape `{ id: string; bookingUrl: string }`. Header documents the Story 4.1 widening path (vertical, image, copy, code, UTM, on/off, version per architecture.md:335).
- `src/components/AffiliateCTA.tsx` — Composition contract per architecture.md:463–471. Renders `<div data-testid="affiliate-cta-block" data-slot-id={slot.id}>{children}<Disclaimer kind="ftc" /></div>`. Imports `Disclaimer` from `./Disclaimer` (not the canonical FTC string itself). Prop signature reflowed to single line by Prettier; no semantic change.
- `src/components/AffiliateCTA.test.tsx` — 5 RTL tests: FTC always rendered (simple link / null / fragment), `data-slot-id` stamping, `data-testid` stable target.
- `tests/fixtures/affiliate-cta/known-good.tsx` — Affiliate `<a>` wrapped in `<AffiliateCTA>` — scanner returns `[]`.
- `tests/fixtures/affiliate-cta/known-bad.tsx` — Same `<a>` unwrapped — scanner returns 1 violation.
- `scripts/ci/check-ftc-disclosure.test.ts` — 3 Vitest assertions: known-good → `[]`, known-bad → 1 violation matching `truckparkingclub.com`, dynamic `href={...}` → `[]`.

**MODIFIED:**
- `scripts/ci/check-ftc-disclosure.ts` — Full rewrite from regex stub to TypeScript Compiler API AST walk. Parses each `.tsx` under `src/` as `ts.SourceFile` (kind TSX); tracks `JsxElement` ancestor tags; flags `<a>`/`<button>` with statically-resolvable affiliate-URL `href` and no `<AffiliateCTA>` ancestor. Exports `scanFile(path, source): Violation[]` for Vitest; CLI `main()` guarded by `import.meta.url === \`file://\${process.argv[1]}\`` so test imports don't re-execute.
- `vite.config.ts` — Extended `test.include` from `['src/**/*.test.{ts,tsx}']` to `['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}']`. Required because the project's existing glob was scoped to `src/**` only — see Deviation #1.
- `_bmad-output/implementation-artifacts/1-7-affiliate-cta-composition-contract.md` — Status `ready-for-dev` → `done`; Dev Agent Record sections filled in.
- `NOTES.md` — Done / Up Next sections refreshed (Story 1.7 in Done; Story 1.8 promoted to top of Up Next).

**PRESERVED (unchanged):**
- `eslint.config.js` — Story 1.6 disclaimer-integrity rule covers this story's text-content concerns; no rule additions needed because `<AffiliateCTA>` delegates to `<Disclaimer kind="ftc">` rather than inlining the FTC string.
- `.github/workflows/ci.yml` — `ftc-disclosure` job already runs `npm run check:ftc`; tightening the underlying script is invisible to the CI YAML.
- `package.json` — `check:ftc` npm script unchanged; no new dependencies installed (TypeScript Compiler API ships with the existing `typescript` v6.x devDep).
- `src/App.tsx` — Sanity probes added then reverted; final state matches pre-Story-1.7 baseline.
- All Story 1.1 / 1.5 / 1.6 scaffold and disclaimer files.
- `tests/e2e/smoke.spec.ts` — Story 1.1 smoke spec; unaffected by composition-contract work.
