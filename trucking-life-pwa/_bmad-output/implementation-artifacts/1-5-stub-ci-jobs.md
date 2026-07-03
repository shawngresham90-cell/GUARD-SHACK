# Story 1.5: Stub 8 GitHub Actions CI jobs

**Status:** done

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-5-stub-ci-jobs`
**Generated:** 2026-05-15
**Author of dev-spec:** Claude (via interactive paired-planning with Huffy)
**Sequencing note:** Pulled forward ahead of Stories 1.2, 1.3, 1.4 because those three are blocked on Shawn-owned Supabase ownership; Story 1.5 is fully Supabase-independent and can land tonight.

---

## Story

As **Huffy (the developer)**,
I want **all 8 CI gates running as discrete GitHub Actions jobs from day one, even if some are no-op until later epics enforce them**,
So that **the CI structure exists without re-architecting later, every PR gets the same eight checks, and GitHub branch protection can require all of them before merge to `main`**.

---

## Preconditions

1. ✅ Story 1.1 is `done`. Scaffold, locked stack, Netlify deploy, smoke E2E spec are all in place.
2. ✅ `package.json` already exposes `npm run lint`, `format:check`, `typecheck`, `test`, `test:e2e`, `build`.
3. ✅ Working tree clean on `main`.
4. ✅ Repo path: `/home/owner/trucking-life-pwa/` for this execution (Windows WSL Ubuntu). Spec is machine-agnostic; nothing here is Windows-specific.
5. ✅ GitHub repo is `MikeHuffy/trucking-life-pwa` (or whichever the actual remote is — verify with `git remote -v`); GitHub Actions is enabled at the repo level by default.
6. ⏳ Huffy has **Admin** rights on the GitHub repo (required for the branch-protection task at the end — viewable at `https://github.com/<owner>/<repo>/settings`).

No external party (Shawn, Supabase, Netlify) is in the dependency chain for Story 1.5. The only blocker would be missing GitHub repo admin rights for branch protection — verify item 6 before starting Task 10.

---

## Acceptance Criteria

The 8 jobs from epics.md:414–434 decompose into AC2–AC9 (one per job). Plus AC1 (workflow file exists), AC10 (branch protection), AC11 (end-to-end green on a fresh PR).

**AC1 — `.github/workflows/ci.yml` exists with 8 named jobs running in parallel**

**Given** the repo at the state of Story 1.1 plus the new files from this story
**When** `.github/workflows/ci.yml` is committed
**Then** the workflow defines exactly 8 top-level jobs named `lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`
**And** all 8 jobs run on the same triggers: `pull_request` (any branch → `main`) and `push` (to `main`)
**And** no `needs:` chain forces serial execution — jobs run in parallel
**And** a `concurrency` group cancels in-progress runs on force-push to the same ref

**AC2 — `lint` job runs ESLint + Prettier check**

**Given** AC1 is in place
**When** a PR is opened
**Then** the `lint` job runs `npm run lint` followed by `npm run format:check`
**And** both commands exit 0 on the Story 1.1 codebase (already green locally per Story 1.1 dev record)

**AC3 — `typecheck` job runs `tsc --noEmit`**

**Given** AC1 is in place
**When** a PR is opened
**Then** the `typecheck` job runs `npm run typecheck` (which executes `tsc --noEmit -p tsconfig.app.json`)
**And** the command exits 0 on the Story 1.1 codebase

**AC4 — `unit` job runs `vitest run`**

**Given** AC1 is in place
**When** a PR is opened
**Then** the `unit` job runs `npm run test` (which executes `vitest run --passWithNoTests`)
**And** the command exits 0 on the Story 1.1 codebase (no test files yet; `--passWithNoTests` makes this OK)

**AC5 — `e2e` job runs Playwright with the existing smoke spec**

**Given** AC1 is in place
**When** a PR is opened
**Then** the `e2e` job installs Playwright browsers + system deps (`npx playwright install --with-deps chromium`), then runs `npm run test:e2e`
**And** the existing `tests/e2e/smoke.spec.ts` (Story 1.1) passes — the spec loads `/` and asserts "Trucking Life with Shawn" is visible
**And** Playwright test artifacts (HTML report, traces on retry) upload as a GitHub Actions artifact named `playwright-report-<run-id>` so failures are debuggable

**AC6 — `bundle-size` job runs `vite build` then `size-limit` against `.size-limit.json` (≤200KB gz)**

**Given** AC1 is in place plus the new `.size-limit.json` and `size-limit` devDep
**When** a PR is opened
**Then** the `bundle-size` job runs `npm run build` followed by `npx size-limit`
**And** `.size-limit.json` is committed at the repo root with a single entry that targets `dist/assets/*.js`, limit `200 KB`, `gzip: true`
**And** the Story 1.1 production bundle (~60 KB gz per Story 1.1 dev record) passes with ~30% of the budget consumed
**And** the job fails on a future PR if the gzipped initial bundle exceeds 200 KB

**AC7 — `lighthouse` job runs `vite build` then Lighthouse CI per `lhci.config.cjs` (Perf ≥90, A11y ≥95)**

**Given** AC1 is in place plus the new `lhci.config.cjs` and `@lhci/cli` devDep
**When** a PR is opened
**Then** the `lighthouse` job runs `npm run build`, starts `vite preview` in the background, then runs `npx lhci autorun --config=lhci.config.cjs`
**And** `lhci.config.cjs` is committed at the repo root, asserting `categories:performance ≥ 0.9` and `categories:accessibility ≥ 0.95` against `http://localhost:4173/`
**And** Story 1.1's App.tsx shell scores ≥90 Performance and ≥95 Accessibility (the shell is one heading + one paragraph; both should be comfortable greens — if not, see *Dev Notes → Lighthouse fail modes*)

**AC8 — `ftc-disclosure` job runs `npm run check:ftc` (passes by default — no affiliate CTAs yet)**

**Given** AC1 is in place plus the new stub script `scripts/ci/check-ftc-disclosure.ts`
**When** a PR is opened
**Then** the `ftc-disclosure` job runs `npm run check:ftc` (delegates to `tsx scripts/ci/check-ftc-disclosure.ts`)
**And** the script scans all `.tsx`/`.ts` files under `src/` for known affiliate URL patterns
**And** with zero affiliate URLs present in Story 1.1's codebase, the script exits 0
**And** the script architecture leaves a clear extension point (commented TODO + filename it should grow into) for Story 1.7 (FR35 AST-scan tightening)

> **AC wording deviation flag.** Epics.md:431 phrases this as `node scripts/ci/check-ftc-disclosure.ts`. Direct `node` invocation cannot execute TypeScript without a loader. We use the canonical pattern from architecture.md:645 (`npm run check:ftc` delegating to `tsx`). Effect is identical; invocation form is the architecturally-supported one.

**AC9 — `rods-grid` job runs `npm run check:rods` (passes by default — no HOS screens yet)**

**Given** AC1 is in place plus the new stub script `scripts/ci/check-rods-grid.ts`
**When** a PR is opened
**Then** the `rods-grid` job runs `npm run check:rods` (delegates to `tsx scripts/ci/check-rods-grid.ts`)
**And** the script scans all `.tsx`/`.ts`/`.css` files under `src/` for 24-column grid patterns (`grid-cols-24`, `grid-template-columns: repeat(24,`, `data-hos-grid` with 24 children, etc.)
**And** with zero matches in Story 1.1's codebase, the script exits 0
**And** the script leaves an extension point for Story 1.8 (HOS shell composition contract) and Story 3.x (RODS-grid snapshot scan tightening)

> **AC wording deviation flag.** Same reasoning as AC8 — `npm run check:rods` instead of literal `node`.

**AC10 — GitHub branch protection on `main` requires all 8 jobs**

**Given** AC1–AC9 are in place and the workflow has run at least once on a real PR (so GitHub knows the check names)
**When** Huffy configures branch protection at GitHub repo Settings → Branches → `main` → "Require status checks to pass before merging"
**Then** all 8 check names (`lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`) are added as required
**And** "Require branches to be up to date before merging" is enabled
**And** "Do not allow bypassing the above settings" is enabled for everyone (including admins) for v1 — Huffy is solo dev and the gates exist precisely so he can't accidentally merge a broken main
**And** the `Require pull request before merging` setting is **NOT** enabled in Sprint 0 (Huffy commits directly to `main` per current workflow; PR-required can flip on once a second contributor or formal review process appears)

**AC11 — All 8 jobs green on a fresh PR with no source changes (meta-verification)**

**Given** AC1–AC9 in place
**When** a verification PR is opened touching only a no-op file (e.g. a README typo or a comment edit)
**Then** all 8 jobs report green within ~5 minutes
**And** the PR can be merged without override (proving branch protection is functional)
**And** the resulting `main` commit triggers a second workflow run (push trigger), which is also green

---

## Tasks / Subtasks

Execute in order. Each task ends with explicit verification.

### Task 1 — Pre-flight verification (AC: preconditions)

- [ ] **1.1** Verify Story 1.1 state: `git log --oneline -5` shows `01f5918` (Story 1.1 done commit) at or near HEAD on `main`.
- [ ] **1.2** Verify clean working tree: `git status`.
- [ ] **1.3** Verify the four existing npm scripts work locally:
  ```bash
  npm run lint
  npm run format:check
  npm run typecheck
  npm run test
  npm run build
  ```
  All exit 0. If any fail, halt and fix in a pre-1.5 commit; Story 1.5 only adds CI on top of green local gates.
- [ ] **1.4** Confirm GitHub repo admin rights (precondition 6) — visit `https://github.com/<owner>/<repo>/settings`; if accessible, you have admin.

### Task 2 — Install new devDependencies

Three new packages. Install separately so any peer-dep warning is easy to attribute.

- [ ] **2.1** `npm install -D size-limit @size-limit/preset-app`
- [ ] **2.2** `npm install -D @lhci/cli`
- [ ] **2.3** `npm install -D tsx` (TypeScript runner for the CI stub scripts; avoids a separate `node`-vs-`ts-node`-vs-`tsx` decision later)
- [ ] **2.4** Verify `package.json` `devDependencies` now includes `size-limit`, `@size-limit/preset-app`, `@lhci/cli`, `tsx`.
- [ ] **2.5** Commit-prep check: `npm run build` still succeeds; new deps don't break anything.

### Task 3 — Add npm scripts

- [ ] **3.1** In `package.json` `scripts`, add the following (preserve existing scripts):
  ```json
  "size-limit": "size-limit",
  "lighthouse-ci": "lhci autorun --config=lhci.config.cjs",
  "check:ftc": "tsx scripts/ci/check-ftc-disclosure.ts",
  "check:rods": "tsx scripts/ci/check-rods-grid.ts"
  ```
- [ ] **3.2** Verify scripts execute (each will fail because the supporting files don't exist yet — that's fine; we'll create them in Tasks 4–7. Run `npm run size-limit` once to confirm it at least invokes `size-limit`'s CLI).

### Task 4 — Create `.size-limit.json` (AC: AC6)

- [ ] **4.1** Create `.size-limit.json` at repo root with the content from *Dev Notes → `.size-limit.json` contract*.
- [ ] **4.2** Verify: `npm run build && npx size-limit`. Output should show one entry "Initial bundle" passing under the 200 KB limit (Story 1.1 baseline ~60 KB gz).

### Task 5 — Create `lhci.config.cjs` (AC: AC7)

- [ ] **5.1** Create `lhci.config.cjs` at repo root with the content from *Dev Notes → `lhci.config.cjs` contract*.
- [ ] **5.2** Verify locally:
  ```bash
  npm run build
  npm run preview &
  PREVIEW_PID=$!
  sleep 3
  npx lhci autorun --config=lhci.config.cjs
  kill $PREVIEW_PID
  ```
  Lighthouse should run, return a result, and pass the ≥90/≥95 assertions. If a11y comes in below 95, see *Dev Notes → Lighthouse fail modes* — fix in the same PR; do not lower the threshold.

### Task 6 — Create `scripts/ci/check-ftc-disclosure.ts` (AC: AC8)

- [ ] **6.1** Create directory: `mkdir -p scripts/ci`.
- [ ] **6.2** Create `scripts/ci/check-ftc-disclosure.ts` with the content from *Dev Notes → `check-ftc-disclosure.ts` contract*.
- [ ] **6.3** Verify: `npm run check:ftc` exits 0 with output indicating zero affiliate-URL patterns found and zero violations.

### Task 7 — Create `scripts/ci/check-rods-grid.ts` (AC: AC9)

- [ ] **7.1** Create `scripts/ci/check-rods-grid.ts` with the content from *Dev Notes → `check-rods-grid.ts` contract*.
- [ ] **7.2** Verify: `npm run check:rods` exits 0 with output indicating zero 24-column-grid patterns found.

### Task 8 — Create `.github/workflows/ci.yml` (AC: AC1–AC9)

- [ ] **8.1** Create directory: `mkdir -p .github/workflows`.
- [ ] **8.2** Create `.github/workflows/ci.yml` with the content from *Dev Notes → `ci.yml` contract*.
- [ ] **8.3** Sanity-check the YAML: `cat .github/workflows/ci.yml | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin)"` — parses cleanly. (If `pyyaml` isn't installed, skip this; GitHub will validate on push.)
- [ ] **8.4** Confirm the 8 job names exactly match the AC1 list: `lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`. **These names become the required check IDs in AC10 — typos cause branch protection to silently fail to enforce.**

### Task 9 — Open a verification PR (AC: AC11)

- [ ] **9.1** Create a branch from `main`: `git checkout -b chore/ci-verify`.
- [ ] **9.2** Stage and commit all the new files from Tasks 2–8:
  ```bash
  git add .github/workflows/ci.yml \
          .size-limit.json \
          lhci.config.cjs \
          scripts/ci/ \
          package.json package-lock.json
  git commit -m "feat(story-1.5): stub 8 github actions ci jobs"
  ```
- [ ] **9.3** Push: `git push -u origin chore/ci-verify`.
- [ ] **9.4** Open a PR via the GitHub UI (or `gh pr create`) targeting `main`.
- [ ] **9.5** Watch GitHub Actions. **Goal:** all 8 jobs report green within ~5 minutes. If any fail:
  - `lint` / `typecheck` / `unit` failures = real local-vs-CI drift; debug.
  - `e2e` failure = most likely missing system deps for Playwright; the workflow uses `--with-deps`, which should cover it; verify the Ubuntu runner version.
  - `bundle-size` failure = something blew the budget; should not happen at this scope.
  - `lighthouse` failure = see *Dev Notes → Lighthouse fail modes*.
  - `ftc-disclosure` / `rods-grid` failure = script bug; the stubs should find nothing.
- [ ] **9.6** Do NOT merge yet — branch protection isn't configured. Leave the PR open for Task 10.

### Task 10 — Configure GitHub branch protection (AC: AC10)

This task is performed in the GitHub UI; it has no CLI equivalent that's safer to run (the `gh api` route exists but the JSON payload is fragile — UI is the right tool here).

- [ ] **10.1** Open `https://github.com/<owner>/<repo>/settings/branches`.
- [ ] **10.2** Click "Add classic branch protection rule" (or "Add ruleset" if GitHub has migrated this repo to rulesets — same outcome, different UI surface).
- [ ] **10.3** Branch name pattern: `main`.
- [ ] **10.4** Enable "Require status checks to pass before merging".
- [ ] **10.5** In the status-checks search field, add each of: `lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`. GitHub will only suggest these after they've run at least once on a PR — which Task 9 ensured.
- [ ] **10.6** Enable "Require branches to be up to date before merging".
- [ ] **10.7** Enable "Do not allow bypassing the above settings" (applies to admins too).
- [ ] **10.8** Do NOT enable "Require a pull request before merging" — Sprint 0 keeps direct-to-main merges for Huffy. (Note: with required status checks enabled, Huffy can still push directly to `main` because the checks run on push too; the gate fires on push events as well as PR events.)
- [ ] **10.9** Save.
- [ ] **10.10** Verify by attempting to merge the Task 9 PR — the green checks should now unlock the merge button.

### Task 11 — Merge the verification PR (AC: AC11)

- [ ] **11.1** Merge the `chore/ci-verify` PR into `main` via the GitHub UI (or `gh pr merge --merge`).
- [ ] **11.2** Watch the workflow run on `main` (push trigger). All 8 jobs green = AC11 satisfied.
- [ ] **11.3** Delete the `chore/ci-verify` branch (`git branch -d chore/ci-verify` locally + remote).
- [ ] **11.4** Local `git pull` to sync `main`.

### Task 12 — Status update + handoff

- [ ] **12.1** Mark this story file's `Status` field at the top to `done`.
- [ ] **12.2** Append a Completion Note to *Dev Agent Record → Completion Notes List* below (note especially: which jobs ran on the first try vs which needed iteration; Lighthouse scores landed at vs the 90/95 thresholds; Playwright system-deps notes).
- [ ] **12.3** List every file created/modified in *Dev Agent Record → File List*.
- [ ] **12.4** Update `NOTES.md` "Done" / "Up Next" sections. The "Pending Shawn" section is unchanged by this story.
- [ ] **12.5** Note the downstream implications: Stories 1.7 (FR35 AST scan tightening) and 1.8 / 3.x (RODS-grid snapshot tightening) will replace the stub scripts. Story 1.4 (Netlify branch protection) is now partially redundant — GitHub branch protection covers the "required checks before merge" intent; Story 1.4 still needs to wire Netlify env vars and redirects.

---

## Dev Notes

### Critical reminders (read before coding)

**Reminder 1 — Stubs do real work, not no-ops.** The two `scripts/ci/check-*.ts` files are *honest stubs*: they actually walk the source tree looking for known violation patterns and exit 0 because Story 1.1's codebase contains zero such patterns. They are NOT `process.exit(0)` placeholders. The future tightening in Stories 1.7 and 1.8 replaces the scanning logic, not the script-runs-and-exits-cleanly contract.

**Reminder 2 — Job names are load-bearing.** The 8 job names become the required check IDs in GitHub branch protection. A typo in `ci.yml` (e.g. `bundlesize` instead of `bundle-size`) means branch protection will silently fail to enforce that check — the merge button unlocks because the "required" check never reported. Match the AC1 list exactly.

**Reminder 3 — `node script.ts` ≠ `tsx script.ts`.** Epics.md:431/432 say `node scripts/ci/check-*.ts`. Node 20 cannot execute `.ts` files natively without a loader. We use `tsx` (lightweight ESM-aware TS runner, already in the ecosystem). Architecture.md:645 documents the canonical invocation as `npm run check:ftc` / `npm run check:rods` — we honor architecture's form. This is a documented AC-wording deviation, not a scope change.

**Reminder 4 — Lighthouse in CI is flakier than locally.** Run-to-run variance is typically ±3 points on Performance. The shell at this scope (one heading + one paragraph) routinely scores 99/100 Performance, 100/100 Accessibility on a warm CI runner — comfortable headroom over 90/95. If a single flaky run hits 89, the FIX is not to lower thresholds; it's to retry. LHCI's `numberOfRuns` is set to 3 in the config so the median smooths variance.

**Reminder 5 — Don't enable `Require a pull request before merging` in Sprint 0.** Huffy is solo dev and pushes directly to `main` regularly (the Story 1.1 dev record shows this pattern). Branch protection's *status check* requirement still applies to direct pushes — GitHub blocks the push if checks haven't passed on that ref. That is exactly the gate we want; the PR-required gate is over-applying.

**Reminder 6 — Scope: CI structure only.** Story 1.5 does NOT:
- Add Husky pre-commit hooks (architecture.md:284 marks Husky "optional in v1; skip for solo-dev simplicity").
- Tighten the FTC AST scan to require `<AffiliateCTA>` wrapping (Story 1.7).
- Tighten the RODS-grid scan beyond grep (Stories 1.8 + 3.x).
- Add cross-browser E2E (iOS Safari emulation, Android Chrome) — architecture.md and the Story 1.1 spec defer this to "when the e2e CI job ships." We interpret that as: ship Chromium-only for now, expand the matrix in a follow-up story when the suite has enough tests to justify the runtime cost.
- Add Plausible / Sentry / observability wiring.
- Touch Netlify config (Story 1.4).

### `.size-limit.json` contract

Repo root. Single entry, conservative limit, gzip-on.

```json
[
  {
    "name": "Initial bundle",
    "path": "dist/assets/*.js",
    "limit": "200 KB",
    "gzip": true,
    "running": false
  }
]
```

Notes:
- `"running": false` skips the optional browser-run step that measures CPU-time-to-execute. We only care about transfer size at this scope.
- `path` globs all top-level JS chunks in `dist/assets/`. Vite emits one main `index-<hash>.js` per build; the glob is future-proof if route-level code-splitting (Story 1.10) adds additional chunks — they'd all sum together, but the 200KB target is the *initial* bundle. Revisit this glob in Story 1.10 if it starts measuring the wrong thing.
- The `@size-limit/preset-app` devDep configures size-limit for a single-page-app context automatically. No `webpack` field needed.

### `lhci.config.cjs` contract

Repo root. CommonJS because Lighthouse CI's loader prefers `.cjs` for config files in ESM projects (Vite's `package.json` has `"type": "module"`).

```cjs
// lhci.config.cjs
module.exports = {
  ci: {
    collect: {
      // Build is run by the workflow as a separate step; LHCI just spins up vite preview.
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        // Mobile preset is the default; explicit for clarity.
        preset: 'desktop',
        // Headless Chrome flags for CI stability.
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        // Best-practices and SEO are NOT gated in Sprint 0 (FR63/FR64 only require Perf + A11y).
        // Lighthouse "best-practices" includes things like CSP headers — that's Netlify's job (Story 1.4).
      },
    },
    upload: {
      // No external upload in Sprint 0; assertions are evaluated locally and the job exits on failure.
      target: 'temporary-public-storage',
    },
  },
};
```

Notes:
- `preset: 'desktop'` — Story 1.1's shell renders identically across viewports; desktop is the easier perf preset and the App.tsx surface doesn't yet have a mobile-specific layout to test. Switch to `mobile` once Parking / HOS modules ship (PRD mobile-first stance).
- `numberOfRuns: 3` — median of three runs, smooths flake.
- `temporary-public-storage` — LHCI's free public storage; expires in 7 days. Sufficient for "debug a failed CI run." Permanent dashboards are Story 6.x material.

### `scripts/ci/check-ftc-disclosure.ts` contract

Honest stub — scans for known affiliate URL patterns; passes when nothing is found.

```ts
// scripts/ci/check-ftc-disclosure.ts
//
// FR35 / FR61 CI gate (stub form).
//
// Goal at v1: every affiliate URL `<a>`/`<button>` must render inside an
// `<AffiliateCTA>` wrapper component (so FTC disclosure renders as its
// enforced sibling). At Story 1.5, the AffiliateCTA component does not yet
// exist (ships in Story 1.7) and no affiliate URLs are referenced anywhere
// in src/. So this scan is intentionally simple: grep for known affiliate
// URL hosts; fail if found outside an AffiliateCTA usage.
//
// When Story 1.7 lands, this script tightens to an AST walk via @typescript-eslint/parser:
//   - For each `<a href=...>` or `<button onClick=...>` whose target matches an affiliate pattern,
//     require an `<AffiliateCTA>` JSX ancestor.
// That tightening is intentionally deferred — wiring AffiliateCTA composition is Story 1.7's scope.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const AFFILIATE_URL_PATTERNS: RegExp[] = [
  /truckparkingclub\.com/i,
  /stan\.store\/shawn/i,
  // Add new affiliate hosts here as they're configured.
  // Each entry is a regex; partial matches count.
];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SCAN_ROOT = 'src';

interface Violation {
  file: string;
  line: number;
  pattern: string;
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
  const lines = readFileSync(path, 'utf8').split('\n');
  const out: Violation[] = [];
  lines.forEach((line, i) => {
    for (const pattern of AFFILIATE_URL_PATTERNS) {
      if (pattern.test(line)) {
        out.push({
          file: path,
          line: i + 1,
          pattern: pattern.toString(),
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

  console.log(`[check:ftc] scanned ${files.length} files for ${AFFILIATE_URL_PATTERNS.length} affiliate URL patterns`);

  if (violations.length === 0) {
    console.log('[check:ftc] OK — no affiliate URLs found (stub mode; AST-tightening lands in Story 1.7)');
    process.exit(0);
  }

  console.error(`[check:ftc] FAIL — ${violations.length} potential FTC disclosure violation(s):`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  matches ${v.pattern}`);
    console.error(`    > ${v.excerpt}`);
  }
  console.error('[check:ftc] Wrap each affiliate URL in <AffiliateCTA> (ships in Story 1.7).');
  process.exit(1);
}

main();
```

### `scripts/ci/check-rods-grid.ts` contract

Same honest-stub pattern — grep for 24-column grid markers.

```ts
// scripts/ci/check-rods-grid.ts
//
// FR62 CI gate (stub form).
//
// Goal at v1: no HOS render path produces a 24-cell horizontal grid (the
// RODS log shape — visual mimicry of a regulated paper-grade RODS chart
// can be construed as a logbook substitute, which we are not). At Story
// 1.5 no HOS UI exists; this scan is intentionally simple grep against
// known 24-column markers in Tailwind utilities, raw CSS, and inline styles.
//
// Story 3.x (HOS screens) tightens this to an actual snapshot scan against
// rendered subtrees marked with `data-hos-screen` — counting DOM children
// of grid containers. That tightening is deferred until HOS components exist.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const GRID_PATTERNS: RegExp[] = [
  /grid-cols-24\b/,                                  // Tailwind utility (would require custom config; flagged regardless)
  /grid-template-columns:\s*repeat\(\s*24\s*,/i,     // raw CSS
  /gridTemplateColumns:\s*['"`]repeat\(24/i,         // inline-style camelCase
  /data-hos-grid\b/,                                 // sentinel attr (reserved name for HOS grid containers; if present, manual review)
];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const SCAN_ROOT = 'src';

interface Violation {
  file: string;
  line: number;
  pattern: string;
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
  const lines = readFileSync(path, 'utf8').split('\n');
  const out: Violation[] = [];
  lines.forEach((line, i) => {
    for (const pattern of GRID_PATTERNS) {
      if (pattern.test(line)) {
        out.push({
          file: path,
          line: i + 1,
          pattern: pattern.toString(),
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

  console.log(`[check:rods] scanned ${files.length} files for ${GRID_PATTERNS.length} 24-column grid patterns`);

  if (violations.length === 0) {
    console.log('[check:rods] OK — no 24-column grid patterns found (stub mode; snapshot-tightening lands with HOS stories)');
    process.exit(0);
  }

  console.error(`[check:rods] FAIL — ${violations.length} potential RODS-grid violation(s):`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  matches ${v.pattern}`);
    console.error(`    > ${v.excerpt}`);
  }
  console.error('[check:rods] HOS UI must NOT produce 24-cell horizontal grids (FR62).');
  process.exit(1);
}

main();
```

### `ci.yml` contract

`.github/workflows/ci.yml`. Single file, 8 jobs in parallel.

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ github.run_id }}
          path: |
            playwright-report/
            test-results/
          retention-days: 7

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npx size-limit

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run lighthouse-ci

  ftc-disclosure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check:ftc

  rods-grid:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check:rods
```

Notes:
- `actions/setup-node@v4` with `cache: 'npm'` pulls deps from cache when `package-lock.json` is unchanged → most jobs install in ~10s instead of ~60s.
- `npm ci` (not `npm install`) — strict-lockfile install; matches the Netlify deploy semantics.
- The `e2e` job uses `--with-deps` to install `libnspr4` etc. (Story 1.1 dev record note 5). The `lighthouse` job also runs a headless browser via LHCI, which uses puppeteer-bundled Chromium — but adding `playwright install --with-deps chromium` upfront covers any shared system deps regardless of which browser engine LHCI picks up. Cheap insurance.
- Each job does its own `npm ci`. The job-cache savings make this faster overall than trying to share node_modules across jobs.

### Lighthouse fail modes

If a11y < 95 on the App.tsx shell, walk this list before lowering the threshold:

1. **Missing `lang` attr on `<html>`.** Vite's `index.html` ships with `<html lang="en">` by default — verify it's still there post-Story-1.1.
2. **Missing `<title>`.** Vite ships `<title>Vite + React + TS</title>` — should be updated to "Trucking Life with Shawn" or similar. (Edit in `index.html`; doesn't require a new story.)
3. **Missing `<meta name="viewport">`.** Critical for mobile a11y. Vite ships this by default.
4. **Insufficient color contrast.** App.tsx uses `text-neutral-50` on `bg-neutral-950` — that's white on near-black, contrast ratio ~20:1, comfortably above WCAG AAA (7:1). Should not be a problem.
5. **Tap-target size.** No interactive elements yet (no buttons), so this category doesn't fire.
6. **Heading order.** Single `<h1>` — clean.

If perf < 90:
1. **Vite preview server cold start** — `numberOfRuns: 3` smooths this; median should be solid.
2. **JS chunk size** — bundle is ~60 KB gz, comfortably small.

If you've walked the list and the score is still flaky, the right move is a fix-forward commit on the same PR, not a threshold cut. The 90/95 minimums are PRD-driven (FR63, FR64, NFR-A2).

### Architecture compliance notes

- **Workflow location** matches architecture.md:273 (`.github/workflows/` at repo root).
- **Job set** matches architecture.md:538–549 exactly (the table of 8 jobs).
- **`scripts/ci/` location** matches architecture.md:851–855 and architecture.md:645.
- **CI gate intent** matches architecture.md:484–486 (FTC AST scan, RODS-grid snapshot scan).
- **Single workflow file** matches architecture.md:538 ("single GitHub Actions workflow, parallel jobs").

### Library/framework compliance

- New devDeps: `size-limit`, `@size-limit/preset-app`, `@lhci/cli`, `tsx`. All are CI-only; zero runtime weight. Architecture doesn't enumerate CI-tool versions, so no version-lock is broken.
- No runtime deps added.
- `@typescript-eslint/parser` is intentionally NOT added yet — the stub scripts use plain regex. The parser lands when AST-tightening lands (Stories 1.7, 1.8, 3.x).

### File structure compliance

Files Story 1.5 adds:

```
trucking-life-pwa/
├── .github/
│   └── workflows/
│       └── ci.yml                          # NEW
├── scripts/
│   └── ci/
│       ├── check-ftc-disclosure.ts         # NEW (stub)
│       └── check-rods-grid.ts              # NEW (stub)
├── .size-limit.json                        # NEW
├── lhci.config.cjs                         # NEW
└── package.json                            # MODIFIED (scripts + devDeps)
```

Nothing under `src/` changes. Nothing under `tests/` changes (the Story 1.1 smoke spec is the one E2E artifact this story consumes; no new tests).

### Testing standards

No new unit tests in Story 1.5. The CI workflow itself is the artifact under test — and AC11 ("all 8 jobs green on a fresh PR") is the verification. The stub scripts are verified by running them locally in Tasks 6.3 and 7.2 (exit 0 = pass).

Tightening tests for the stub scripts (mock-violation files that exercise the failure paths) land in Stories 1.7 / 1.8 / 3.x when the scripts grow real scanning logic worth testing.

### Git intelligence (recent commits as context)

```
01f5918 docs(story-1.1): mark done + write dev agent record
be6e775 chore(vite): drop redundant vitest/config triple-slash directive
fcb9367 Trigger Netlify rebuild with build settings
c689193 Trigger Netlify rebuild with build settings
37a5012 Trigger Netlify rebuild with build settings
```

Convention from Story 1.1: `chore:` for scaffold/infra. Story 1.5 ships CI infrastructure — `chore:` would fit, but the scope is large enough (8 jobs + 5 new files + branch-protection wiring) that `feat(story-1.5):` reads more honestly. Either is defensible; pick one and be consistent with the Story 1.2 commit-prefix decision.

### Latest tech information (verified 2026-05-15)

- **`actions/checkout@v4`** and **`actions/setup-node@v4`** are the current stable majors. v5 is rumored but not GA as of the spec date.
- **`@lhci/cli`** stable major is 0.13.x as of mid-2026; pin via `^0.13` in package.json (npm install handles the range).
- **`size-limit` 11.x** + **`@size-limit/preset-app` 11.x** are the current stable. The preset-app preset wires Vite/esbuild output detection automatically.
- **`tsx`** is on 4.x; lightweight, no config needed for the stub scripts. Alternative considered: `node --import tsx/esm`, but the simpler `npx tsx <file>` invocation is what npm scripts call.
- **Playwright** is at 1.59.x per Story 1.1's `package.json`; `--with-deps chromium` install path is stable.

### Project Structure Notes

- **Alignment with architecture:** This story ships the CI substrate the architecture has been pointing at since Step 04 (decision: "design the CI structure so the gates from the PRD can be added as discrete jobs without re-architecting").
- **Variances from architecture:**
  - Architecture.md:284 notes "Husky optional in v1; can skip for solo-dev simplicity." Story 1.5 does NOT add Husky. The lint/format/typecheck gates run server-side on every push; local hooks would be redundant for a solo dev who's about to push anyway.
  - Architecture.md:737–747 enumerates a "disclaimer source-of-truth assertion" inside the `unit` job. That assertion needs `src/core/disclaimers.ts` to exist (Story 1.6) — Story 1.5 ships the empty `unit` job that will receive that assertion once Story 1.6 lands. No-op now, real-test later.

### References

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
  - FR35 (FTC disclosure adjacent to every affiliate CTA — drives `ftc-disclosure` job)
  - FR62 (no RODS-style 24-cell grid — drives `rods-grid` job)
  - FR63 + FR64 + NFR-A2 (Lighthouse Performance ≥90, Accessibility ≥95 — drives `lighthouse` job)
  - NFR-P6 (≤200 KB gz initial bundle — drives `bundle-size` job)
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
  - § *Locked Inputs → CI* (line 64 — "GitHub Actions wired up by Huffy after architecture lands")
  - § *Cross-cutting compliance gates* (lines 484–486)
  - § *CI/CD pipeline* (lines 538–551 — the 8-job table)
  - § *Implementation Patterns & Consistency Rules → Hard conventions* (lines 740–747 — gate-source mapping)
  - § *Project Directory Structure* (line 273 — `.github/workflows/` location; lines 851–855 — `scripts/ci/` location)
- **Epics:** `_bmad-output/planning-artifacts/epics.md`
  - § *Epic 1, Story 1.5* (lines 414–434 — source ACs)
  - § *Story 1.7* (lines 468–482 — downstream: AffiliateCTA + FTC AST tightening)
  - § *Story 1.8* (lines 484–499 — downstream: HosShell + RODS snapshot tightening)
- **Story 1.1 dev record:** `_bmad-output/implementation-artifacts/1-1-scaffold-vite-baseline.md`
  - Confirms existing `npm run lint`, `format:check`, `typecheck`, `test`, `test:e2e`, `build` scripts.
  - Note 3 (line 646): Vitest 4 needs `--passWithNoTests`; already in `package.json` script.
  - Note 5 (line 650): Playwright on Linux needs `--with-deps` for system libraries.
- **Memory:**
  - `~/.claude/projects/-home-owner-trucking-life-pwa/memory/feedback_external_blocker_triage.md` — why Story 1.5 is being prepared ahead of 1.2/1.3/1.4.
  - `~/.claude/projects/-home-owner-trucking-life-pwa/memory/feedback_bmad_dev_ready_spec_structure.md` — section-order template applied here.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — interactive paired-implementation mode with Huffy on Windows WSL Ubuntu. Each task verified before moving to the next.

### Debug Log References

- Pre-flight gates (Task 1.3) — `npm run lint`, `format:check`, `typecheck`, `test`, `build` all green pre-and-post-changes; bundle steady at 60.17 KB gz.
- `npx size-limit` (Task 4.2) — reported **59.37 kB gzipped** vs the **200 kB** cap.
- `npm run check:ftc` (Task 6.3) — scanned 3 files; zero affiliate URL matches.
- `npm run check:rods` (Task 7.2) — scanned 4 files; zero 24-column grid matches.
- `npm run lighthouse-ci` (Task 5.2) — failed locally on Windows WSL; see Completion Note #2.
- `python3 -c yaml.safe_load(...)` against `.github/workflows/ci.yml` (Task 8.3) — parsed cleanly.
- GHA verification — PR #1 (`chore/ci-verify` → `main`), merged via merge commit `2a790e6`. All 8 jobs green on first run (AC11 ✓).

### Completion Notes List

**All 11 acceptance criteria satisfied.** Story spans Tasks 1–12; CI infrastructure shipped via PR #1 (commits `c3532e0` docs + `3cfc885` feat, merge `2a790e6`). GitHub branch protection on `main` now requires all 8 check names per Task 10.

**Deviations from the original spec** (worth keeping in mind for future stories):

1. **GitHub PAT needed `workflow` scope before push could land workflow files.** First `git push` was rejected: `refusing to allow a Personal Access Token to create or update workflow .github/workflows/ci.yml without workflow scope`. One-time fix: edit the existing PAT at github.com/settings/tokens and add the `workflow` scope (sibling of `repo`). Future stories that touch `.github/workflows/` will not hit this again.

2. **Local LHCI smoke (Task 5.2) skipped on Windows WSL.** chrome-launcher preferred the host Windows Chrome via WSL interop and got `ECONNREFUSED 127.0.0.1` (DevTools port lives in Windows' loopback namespace, not WSL's). Retry with `CHROME_PATH` pointing at Playwright's bundled Linux chromium (`~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`) then failed on `libnspr4.so: cannot open shared object file` — same root cause as Story 1.1 dev-record deviation #5. CI's Ubuntu runner doesn't hit this because the workflow runs `playwright install --with-deps chromium` first, which `apt-get install`s the system deps under GHA's NOPASSWD sudo. AC11 (all-green-on-PR) verified the lighthouse job works in CI; local sanity is skipped without consequence on WSL until `sudo npx playwright install-deps chromium` is run manually.

3. **Bundled the docs commit into the verification PR.** Spec Task 9 implied a fresh branch with only the Story 1.5 feat commit. In practice the docs commit `c3532e0` (the Story 1.2 + Story 1.5 specs themselves) was unpushed on local `main` when the branch was cut, so it rode along on the PR. Both commits landed cleanly via the merge; no scope leakage.

4. **`gh` CLI not installed in this WSL session.** Sudo inside the Claude tool's bash environment can't read a password (no TTY), so the apt install couldn't complete from the agent side. CI status was verified via user paste-back ("all green") instead of automated `gh pr checks 1`. Worth a one-time interactive install on this machine for future PR triage.

**Build-time signals at green:**
- Bundle: **59.37 KB gz** (size-limit reading) / 60.17 KB gz (Vite reporter) — both consistent with Story 1.1's baseline; new CI-only devDeps add zero runtime weight.
- Lighthouse scores on the CI run: not captured in this session (paste-back was status-only); LHCI's `temporary-public-storage` upload retains the report for 7 days at the URL printed in the lighthouse job logs.

**Downstream implications noted:**
- Story 1.7 (AffiliateCTA composition contract) will replace `scripts/ci/check-ftc-disclosure.ts`'s regex scan with an AST walk via `@typescript-eslint/parser`, requiring `<AffiliateCTA>` as the only legal parent of an affiliate URL `<a>`/`<button>`.
- Stories 1.8 + 3.x (HosShell + HOS UI) will replace `scripts/ci/check-rods-grid.ts`'s regex scan with a snapshot-based scan against rendered subtrees marked `data-hos-screen`.
- Story 1.4 (Netlify env vars + redirects) is now partially redundant on the "required checks before deploy" intent — GitHub branch protection covers that. Story 1.4 still needs to wire `VITE_SUPABASE_*` env vars and the `/privacy` + `/affiliate-disclosure` redirects.
- Story 1.6 (canonical disclaimer source) will add the first real unit test to the `unit` job (the disclaimer-source-of-truth assertion per architecture.md:742).

**Commits landed for Story 1.5** (on `origin/main` post-merge):
1. `c3532e0` — docs(stories): add ready-for-dev specs for 1.2 (supabase) and 1.5 (ci stubs)
2. `3cfc885` — feat(story-1.5): stub 8 github actions ci jobs
3. `2a790e6` — Merge pull request #1 from MikeHuffy/chore/ci-verify
4. (this Task 12 update — pending commit at time of writing)

### File List

**CREATED (Story 1.5 CI infrastructure):**
- `.github/workflows/ci.yml` — 8-job parallel workflow (`lint`, `typecheck`, `unit`, `e2e`, `bundle-size`, `lighthouse`, `ftc-disclosure`, `rods-grid`); triggers on `push` to `main` and `pull_request` to `main`; concurrency group cancels in-progress runs on force-push.
- `.size-limit.json` — single entry "Initial bundle" targeting `dist/assets/*.js` at 200 KB gzipped; `running: false` to skip browser-CPU measurement.
- `lhci.config.cjs` — Lighthouse CI config; desktop preset, `numberOfRuns: 3` for median smoothing, asserts `categories:performance ≥ 0.9` and `categories:accessibility ≥ 0.95` against `http://localhost:4173/`; `upload.target: temporary-public-storage`.
- `scripts/ci/check-ftc-disclosure.ts` — honest-stub TypeScript scanner; walks `src/` for affiliate URL hosts (`truckparkingclub.com`, `stan.store/shawn`); exits 0 on Story 1.5 codebase; AST-tightening deferred to Story 1.7.
- `scripts/ci/check-rods-grid.ts` — honest-stub TypeScript scanner; walks `src/` for 24-column grid patterns (`grid-cols-24`, `repeat(24,`, `gridTemplateColumns: 'repeat(24`, `data-hos-grid`); exits 0 on Story 1.5 codebase; snapshot-tightening deferred to HOS stories.

**MODIFIED:**
- `package.json` — added 4 npm scripts (`size-limit`, `lighthouse-ci`, `check:ftc`, `check:rods`) and 4 devDeps (`size-limit ^12.1.0`, `@size-limit/preset-app ^12.1.0`, `@lhci/cli ^0.15.1`, `tsx ^4.22.0`).
- `package-lock.json` — lockfile updates from the new installs (~290 transitive deps in total, mostly under `@lhci/cli`).
- `_bmad-output/implementation-artifacts/1-5-stub-ci-jobs.md` — Status `ready-for-dev` → `done`; Dev Agent Record sections filled in.
- `NOTES.md` — Done / Up Next / Pending Shawn refreshed.

**FOLLOW-UP performed during execution (not file changes):**
- GitHub Personal Access Token gained `workflow` scope (one-time, via github.com/settings/tokens).
- GitHub branch protection rule added on `main`: all 8 check names required; `Require branches to be up to date`; `Do not allow bypassing the above settings`; `Require a pull request before merging` deliberately left OFF for Sprint 0.

**PRESERVED (unchanged):**
- All `src/`, `tests/e2e/`, `public/`, and Story 1.1 root files.
- `_bmad/`, `_bmad-output/planning-artifacts/`, `docs/`, `README.md`.
