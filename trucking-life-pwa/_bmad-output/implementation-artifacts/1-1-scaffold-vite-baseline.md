# Story 1.1: Scaffold Vite + React + TypeScript Baseline

**Status:** done

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-1-scaffold-vite-baseline`
**Generated:** 2026-05-08
**Author of dev-spec:** Claude (via `/bmad-create-story 1.1`)

---

## Story

As **Huffy (the developer)**,
I want **a clean Vite + React + TypeScript foundation scaffolded into the existing `trucking-life-pwa` repo, with the locked library stack installed, ESLint + Prettier + Tailwind v4 + vite-plugin-pwa wired, and the first commit triggering a Netlify preview deploy**,
So that **all subsequent stories build on a reproducible, deployable baseline that is identical across both my Chromebook and Windows machines**.

---

## Preconditions (Huffy completes BEFORE running this story)

The following infrastructure must exist before the dev agent or Huffy starts the scaffold work. Items 1–5 are confirmed; items 6–9 are Huffy's pre-story setup tasks.

1. ✅ Local repository at `/home/mikehuffy767/trucking-life-pwa/` (workspace root).
2. ✅ Git initialized (`.git/` present); on `main` branch; working tree clean.
3. ✅ GitHub remote: `origin → https://github.com/MikeHuffy/trucking-life-pwa.git` (push + fetch).
4. ✅ `_bmad/`, `_bmad-output/`, `docs/`, and `README.md` already committed.
5. ✅ Node 20 LTS installed (verify with `node --version`).
6. ⏳ **Netlify connected to MikeHuffy/trucking-life-pwa** (Huffy completes before running this story).
7. ⏳ **Netlify auto-deploy on push to `main` enabled.**
8. ⏳ **Netlify build command set to `npm run build`; publish directory set to `dist`.**
9. ⏳ **Custom domain `app.truckinglifewithshawn.com` configured in Netlify** (Shawn already owns the domain; DNS pointed at Netlify by Huffy).

If preconditions 6–9 are not in place, **STOP** and complete them before proceeding. The story's success metric ("first commit produces a working Netlify preview URL") depends on Netlify being live.

---

## Acceptance Criteria

**AC1 — Vite scaffold lands in the existing repo without breaking BMAD artifacts**

**Given** the repo at `/home/mikehuffy767/trucking-life-pwa/` containing `_bmad/`, `_bmad-output/`, `docs/`, `README.md`, and `.git/`
**When** `npm create vite@latest . -- --template react-ts` is run from the repo root and the prompt "Current directory is not empty" is answered with **"Ignore files and continue"**
**Then** Vite scaffold files (`package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `eslint.config.js`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/vite-env.d.ts`, `src/assets/react.svg`, `public/vite.svg`) are written to the repo
**And** the existing `README.md` is preserved (Vite's default README is skipped by the "Ignore" option)
**And** `_bmad/`, `_bmad-output/`, `docs/`, and `.git/` are completely untouched
**And** Vite generates a `.gitignore` (no prior `.gitignore` existed; no conflict)

**AC2 — All locked libraries from architecture AR2 are installed**

**Given** AC1 is complete
**When** the install commands listed in *Tasks → Install locked libraries* are run from the repo root
**Then** `package.json` `dependencies` contains: `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `zustand`, `@supabase/supabase-js`, `dexie`, `date-fns`, `zod`
**And** `package.json` `devDependencies` contains: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vite-plugin-pwa`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@playwright/test`, `prettier`, `eslint-config-prettier`, plus the ESLint deps Vite scaffolds by default
**And** every package resolves to a current stable version (May 2026 baseline; see *Dev Notes → Locked library versions*)
**And** `node_modules/` is gitignored (Vite default `.gitignore` covers it)

**AC3 — Tailwind v4 + vite-plugin-pwa configured in `vite.config.ts`**

**Given** AC2 is complete
**When** `vite.config.ts` is rewritten to wire `@tailwindcss/vite` and `vite-plugin-pwa` per *Dev Notes → vite.config.ts contract*
**Then** `vite.config.ts` imports `@vitejs/plugin-react`, `@tailwindcss/vite`, and `VitePWA` from `vite-plugin-pwa`
**And** the `plugins` array contains `react()`, `tailwindcss()`, and `VitePWA({ registerType: 'autoUpdate', injectRegister: 'auto', workbox: { ... } })` with a stub workbox config
**And** `src/index.css` contains exactly `@import "tailwindcss";` at the top, replacing whatever Vite scaffolded
**And** running `npm run dev` starts the dev server at `http://localhost:5173` with HMR working

**AC4 — TypeScript strict mode is enabled**

**Given** AC1 is complete
**When** `tsconfig.json` and `tsconfig.app.json` are reviewed and adjusted as needed
**Then** `tsconfig.app.json` contains `"strict": true` (Vite default for `react-ts` template)
**And** the path alias `@/* → src/*` is configured in BOTH `tsconfig.app.json` (for editors and `tsc`) AND `vite.config.ts` `resolve.alias` (for runtime + Vitest)
**And** `npm run typecheck` (script added in AC8) passes with zero errors

**AC5 — ESLint flat config + Prettier integration**

**Given** AC2 is complete (`prettier` and `eslint-config-prettier` installed)
**When** the Vite-scaffolded `eslint.config.js` is extended to include `eslint-config-prettier` as the LAST item in the config array (so Prettier disables ESLint's stylistic rules)
**Then** `npm run lint` runs ESLint over `src/**/*.{ts,tsx}` and exits zero on the scaffolded code
**And** `.prettierrc.json` is committed at the repo root with: `{ "semi": true, "singleQuote": true, "trailingComma": "all", "printWidth": 100, "tabWidth": 2 }`
**And** `.prettierignore` is committed listing `dist`, `node_modules`, `_bmad`, `_bmad-output`, `*.md` (BMAD docs are not Prettier-managed)
**And** `npm run format:check` runs Prettier in check mode over `src/**/*.{ts,tsx,css}` and exits zero

**AC6 — Vitest configured to share Vite's transformer**

**Given** AC2 is complete (Vitest + RTL + jsdom installed)
**When** Vitest is configured (either in `vite.config.ts` via the `test` field or in a separate `vitest.config.ts` that extends the Vite config)
**Then** `npm run test` runs `vitest run` and exits zero with the message "No test files found, exiting with code 0" (or runs a single placeholder smoke test if one is committed)
**And** `npm run test:watch` runs `vitest` in watch mode and starts the watcher
**And** the test environment is `jsdom`
**And** `@testing-library/jest-dom` matchers are auto-imported via a `tests/setup.ts` (or `src/test-setup.ts`) referenced from the Vitest config

**AC7 — Playwright configured for E2E with a smoke test**

**Given** AC2 is complete (`@playwright/test` installed)
**When** `npx playwright install chromium` is run and `playwright.config.ts` is committed at the repo root
**Then** `playwright.config.ts` defines a single `webServer` block running `npm run dev` on port `5173`, with a `tests/e2e` test directory and `chromium` as the only project for v1
**And** a single placeholder spec file `tests/e2e/smoke.spec.ts` exists, asserting `await page.goto('/'); await expect(page.getByText('Trucking Life with Shawn')).toBeVisible();`
**And** `npm run test:e2e` runs `playwright test` and the smoke test passes locally

**AC8 — `package.json` scripts are normalized**

**Given** AC1–AC7 are complete
**When** `package.json` `scripts` is updated
**Then** the following scripts exist with these exact names:
  - `dev` → `vite`
  - `build` → `tsc -b && vite build`
  - `preview` → `vite preview`
  - `typecheck` → `tsc --noEmit -p tsconfig.app.json`
  - `lint` → `eslint .`
  - `format` → `prettier --write 'src/**/*.{ts,tsx,css}'`
  - `format:check` → `prettier --check 'src/**/*.{ts,tsx,css}'`
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `test:e2e` → `playwright test`
**And** `package.json` `name` is set to `trucking-life-pwa`
**And** `package.json` `private` is `true` (Vite default — keep)

**AC9 — `.env.example` and `.editorconfig` committed**

**Given** the repo has no env-var documentation yet
**When** `.env.example` is created at the repo root
**Then** `.env.example` contains exactly (no values, just keys):
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  VITE_PLAUSIBLE_DOMAIN=
  ```
**And** `.env.local` is added to `.gitignore` (extend Vite's default if not already covered)
**And** `.editorconfig` is committed at the repo root with `indent_size = 2`, `end_of_line = lf`, `charset = utf-8`, `trim_trailing_whitespace = true`, `insert_final_newline = true`

**AC10 — Minimal `App.tsx` renders a recognizable shell**

**Given** AC1–AC9 are complete
**When** `src/App.tsx` is replaced with a minimal Tailwind-styled placeholder
**Then** the rendered page at `/` displays the text "Trucking Life with Shawn" in a heading and a subtitle "Foundation deployed — feature work begins next sprint"
**And** the page uses Tailwind utility classes (verifying Tailwind v4 is wired)
**And** `src/App.css` is deleted (Tailwind replaces it; one fewer file to maintain)
**And** the smoke E2E test in AC7 passes against the running dev server

**AC11 — First Vite-tree commit triggers a Netlify preview deploy**

**Given** Preconditions 6–9 are complete (Netlify wired)
**When** all changes from AC1–AC10 are committed in a single commit message `chore: scaffold vite + react + typescript baseline (story 1.1)` and pushed to `main`
**Then** Netlify receives the webhook and produces a successful production build of `dist/`
**And** `https://app.truckinglifewithshawn.com/` (or the Netlify-assigned subdomain if custom domain DNS is still propagating) renders the App.tsx placeholder
**And** the page loads on iOS Safari 16.4+ AND Android Chrome (latest 2 majors)
**And** the Netlify deploy log shows zero build warnings related to missing dependencies, version conflicts, or TypeScript errors

**AC12 — Cross-machine reproducibility verified**

**Given** the commit from AC11 is on `origin/main`
**When** Huffy clones the repo on his second machine via `git clone https://github.com/MikeHuffy/trucking-life-pwa.git` and runs `npm install && npm run dev`
**Then** the dev server starts at `localhost:5173` on the second machine
**And** the same App.tsx placeholder renders identically
**And** `package-lock.json` is committed (so `npm ci` would also reproduce the install on a CI runner)

---

## Tasks / Subtasks

The dev agent should execute tasks in order. Each task has explicit verification.

### Task 1 — Pre-flight verification (AC: preconditions)

- [ ] **1.1** Verify Node version: `node --version` returns `v20.x.x` (LTS).
- [ ] **1.2** Verify Git state: `git status` returns clean working tree on `main`.
- [ ] **1.3** Verify GitHub remote: `git remote -v` returns `https://github.com/MikeHuffy/trucking-life-pwa.git` for fetch and push.
- [ ] **1.4** Confirm with Huffy that Netlify Preconditions 6–9 are complete (auto-deploy on push to main; build/publish set; custom domain configured). Halt if not.

### Task 2 — Run Vite scaffold (AC: AC1)

- [ ] **2.1** From `/home/mikehuffy767/trucking-life-pwa/`, run `npm create vite@latest . -- --template react-ts`.
- [ ] **2.2** When prompted "Current directory is not empty. Please choose how to proceed:", select **"Ignore files and continue"** (preserves `README.md`, `_bmad/`, `_bmad-output/`, `docs/`, `.git/`).
- [ ] **2.3** Verify scaffold output: confirm `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `eslint.config.js`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/vite-env.d.ts`, `src/assets/react.svg`, `public/vite.svg` are present.
- [ ] **2.4** Verify `_bmad/`, `_bmad-output/`, `docs/`, and the original `README.md` are unchanged: `git status` should show only ADDED files (no DELETED, no MODIFIED in those paths).

### Task 3 — Install locked libraries (AC: AC2)

Run these commands sequentially. Do not combine into a single command — npm resolves cleaner one-at-a-time when adding to a fresh `package.json`.

- [ ] **3.1 Runtime libraries:**
  ```bash
  npm install react-router @tanstack/react-query zustand @supabase/supabase-js dexie date-fns zod
  ```
- [ ] **3.2 Dev libraries — PWA + Tailwind:**
  ```bash
  npm install -D vite-plugin-pwa tailwindcss @tailwindcss/vite
  ```
- [ ] **3.3 Dev libraries — testing:**
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  npm install -D @playwright/test
  ```
- [ ] **3.4 Dev libraries — formatting:**
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- [ ] **3.5** Verify `package.json` reflects all packages from AC2. No `peerDependencies` warnings on a fresh install (a few warnings about `eslint` peer deps are acceptable as long as builds pass).
- [ ] **3.6** Run `npx playwright install chromium` to install the headless browser binary (required for AC7).

### Task 4 — Configure `vite.config.ts` (AC: AC3, AC4)

- [ ] **4.1** Replace the Vite-scaffolded `vite.config.ts` with the contract in *Dev Notes → vite.config.ts contract* below.
- [ ] **4.2** Verify the file imports `react()` from `@vitejs/plugin-react`, `tailwindcss()` from `@tailwindcss/vite`, and `VitePWA` from `vite-plugin-pwa`.
- [ ] **4.3** Add `resolve.alias` for `@` → `path.resolve(__dirname, 'src')`.
- [ ] **4.4** Confirm `npm run dev` starts on port 5173 and serves `localhost:5173`.

### Task 5 — Configure Tailwind v4 (AC: AC3)

- [ ] **5.1** Replace `src/index.css` contents with exactly:
  ```css
  @import "tailwindcss";
  ```
- [ ] **5.2** Delete `src/App.css` (Tailwind utilities replace it; one fewer file to maintain — see AC10).
- [ ] **5.3** No `tailwind.config.js` is needed for v4 (the `@tailwindcss/vite` plugin reads tokens from the CSS `@theme` directive when needed; v1 keeps defaults).

### Task 6 — Wire ESLint + Prettier (AC: AC5)

- [ ] **6.1** Open Vite's scaffolded `eslint.config.js`. Append `eslintConfigPrettier` as the LAST item in the exported config array. Import it via `import eslintConfigPrettier from 'eslint-config-prettier';`.
- [ ] **6.2** Create `.prettierrc.json` at repo root with `{"semi": true, "singleQuote": true, "trailingComma": "all", "printWidth": 100, "tabWidth": 2}`.
- [ ] **6.3** Create `.prettierignore` at repo root with the lines `dist`, `node_modules`, `_bmad`, `_bmad-output`, `*.md`.
- [ ] **6.4** Run `npm run lint` (after Task 8 adds the script) and confirm zero errors.
- [ ] **6.5** Run `npm run format:check` and confirm zero errors.

### Task 7 — Configure Vitest + Playwright (AC: AC6, AC7)

- [ ] **7.1** Add `test` config to `vite.config.ts` per the *vite.config.ts contract*. Use `environment: 'jsdom'` and `setupFiles: ['./src/test-setup.ts']`.
- [ ] **7.2** Create `src/test-setup.ts` with `import '@testing-library/jest-dom/vitest';`.
- [ ] **7.3** Create `playwright.config.ts` at repo root using the contract in *Dev Notes → playwright.config.ts contract*.
- [ ] **7.4** Create `tests/e2e/smoke.spec.ts` with the smoke test from AC7.
- [ ] **7.5** Run `npm run test` and confirm exit code 0.
- [ ] **7.6** Run `npm run test:e2e` (after Task 8 + Task 9) and confirm the smoke test passes.

### Task 8 — Normalize `package.json` scripts (AC: AC8)

- [ ] **8.1** Replace the `scripts` field with the exact list from AC8.
- [ ] **8.2** Set `package.json` `name` to `trucking-life-pwa`.
- [ ] **8.3** Verify `private: true` is preserved.

### Task 9 — Replace `App.tsx` with minimal shell (AC: AC10)

- [ ] **9.1** Replace `src/App.tsx` with the contract in *Dev Notes → App.tsx contract*.
- [ ] **9.2** Replace `src/main.tsx` with the contract in *Dev Notes → main.tsx contract* (drops the StrictMode wrapper for now? — keep StrictMode; remove the App.css import).
- [ ] **9.3** Visit `localhost:5173` and confirm the heading "Trucking Life with Shawn" renders with Tailwind styling.
- [ ] **9.4** Run `npm run test:e2e` and confirm the smoke spec passes.

### Task 10 — Commit `.env.example` + `.editorconfig` (AC: AC9)

- [ ] **10.1** Create `.env.example` at repo root with the three `VITE_*` variable names from AC9 (no values).
- [ ] **10.2** Create `.editorconfig` at repo root per AC9.
- [ ] **10.3** Verify `.env.local` is in `.gitignore` (Vite's default already covers `.env*.local` — do not duplicate; just confirm).

### Task 11 — Sanity gates pass locally (AC: AC2–AC10)

Run all four gates from a clean state to confirm. Stop and fix on any failure:

- [ ] **11.1** `npm run typecheck` → exit 0
- [ ] **11.2** `npm run lint` → exit 0
- [ ] **11.3** `npm run format:check` → exit 0
- [ ] **11.4** `npm run test` → exit 0
- [ ] **11.5** `npm run test:e2e` → exit 0 (smoke spec passes)
- [ ] **11.6** `npm run build` → exit 0; `dist/` produced; bundle size logged. (No specific size constraint in this story; bundle-size CI gate ships in Story 1.5.)

### Task 12 — Single commit + push to `main` (AC: AC11)

- [ ] **12.1** Stage all new and modified files: `git add -A`.
- [ ] **12.2** Verify `git status` does not include `node_modules/`, `dist/`, or `.env.local`.
- [ ] **12.3** Verify `git status` includes `package-lock.json` (so cross-machine `npm ci` can reproduce).
- [ ] **12.4** Commit:
  ```
  git commit -m "chore: scaffold vite + react + typescript baseline (story 1.1)"
  ```
- [ ] **12.5** Push: `git push origin main`.
- [ ] **12.6** Open the Netlify dashboard and watch the deploy. Confirm:
  - Build succeeds
  - Deploy is live at the production URL (`app.truckinglifewithshawn.com` if DNS has propagated; otherwise the assigned `*.netlify.app` URL)
  - Deploy log shows zero build warnings related to missing deps or TS errors

### Task 13 — Cross-machine reproducibility check (AC: AC12)

- [ ] **13.1** On the second machine (Chromebook ↔ Windows — whichever wasn't used for the scaffold), run:
  ```bash
  git clone https://github.com/MikeHuffy/trucking-life-pwa.git
  cd trucking-life-pwa
  npm install
  npm run dev
  ```
- [ ] **13.2** Confirm `localhost:5173` renders the same App.tsx placeholder as the first machine.
- [ ] **13.3** Run `npm run typecheck && npm run lint && npm run test` on the second machine; all should exit 0.

### Task 14 — Status update + handoff

- [ ] **14.1** Mark this story file's `Status` field at the top to `done`.
- [ ] **14.2** Append a brief Completion Note to *Dev Agent Record → Completion Notes List* below.
- [ ] **14.3** List every file created or modified in *Dev Agent Record → File List*.
- [ ] **14.4** If `_bmad-output/implementation-artifacts/sprint-status.yaml` exists, update `1-1-scaffold-vite-baseline` from `ready-for-dev` to `done`. (If the file doesn't exist yet, this is a no-op — sprint-status.yaml ships when `/bmad-sprint-planning` is run.)
- [ ] **14.5** Trigger the next story: open `_bmad-output/planning-artifacts/epics.md`, find Story 1.2 ("Provision Supabase + driver-facing schema migrations"), and prepare to run `/bmad-create-story 1.2`.

---

## Dev Notes

### Critical reminders (read before coding)

**Reminder 1 — Use `.` not `trucking-life-app`.** The original Story 1.1 in `epics.md` says `npm create vite@latest trucking-life-app -- --template react-ts`. That's WRONG for Huffy's setup. The repo is already created, named `trucking-life-pwa`, and Git/GitHub are wired. Scaffold INTO the current directory with `npm create vite@latest . -- --template react-ts`. **Do not create a `trucking-life-app/` subfolder.**

**Reminder 2 — "Ignore files and continue" preserves Huffy's work.** When `create-vite` detects the non-empty repo (`README.md`, `_bmad/`, `_bmad-output/`, `docs/`), it offers three options. Select **"Ignore files and continue"** — this writes only files that don't already exist. Do NOT select "Remove existing files and continue" — that would delete `README.md`, `_bmad/`, and `_bmad-output/`.

**Reminder 3 — No `tailwind.config.js` for Tailwind v4.** Tailwind v4's `@tailwindcss/vite` plugin reads tokens directly from CSS via `@theme`. Skip the v3-era `tailwind.config.js` step — it's no longer needed.

**Reminder 4 — Story 1.1 scope is foundation only.** Do NOT create:
- `src/core/disclaimers.ts` (Story 1.6)
- `src/components/AffiliateCTA.tsx` (Story 1.7)
- `src/modules/hos/HosShell.tsx` (Story 1.8)
- `src/pwa/sw.ts` (Story 1.9)
- Supabase migrations (Story 1.2 / 1.3)
- Any auth code (Stories 1.11 / 1.12)
- Any module folders under `src/modules/` (each module epic creates its own)

The `src/` tree at the end of Story 1.1 should be **only**:
```
src/
├── App.tsx           # Minimal placeholder shell
├── main.tsx          # Vite entry
├── index.css         # @import "tailwindcss";
├── test-setup.ts     # Vitest setup (loads jest-dom matchers)
├── vite-env.d.ts     # Vite scaffold default
└── assets/
    └── react.svg     # Vite scaffold default (ok to keep or delete)
```

### Locked library versions (verified May 2026)

These are the latest stable versions as of the spec date. The dev agent should let `npm install` resolve `^X.Y.Z` ranges; do not pin exact versions in `package.json`.

| Package | Latest stable | Notes |
|---|---|---|
| `react`, `react-dom` | `^19.x` | Comes with Vite `react-ts` template |
| `react-router` | `^7.x` | Single-package import; no `react-router-dom` needed in v7 |
| `@tanstack/react-query` | `^5.100.x` | v5 requires React 18+; we have 19 |
| `zustand` | `^5.0.x` | Latest stable |
| `@supabase/supabase-js` | `^2.x` | Latest stable |
| `dexie` | `^4.4.x` | Latest stable; v4 requires no migration from v3 for new projects |
| `date-fns` | `^3.x` or `^4.x` | Latest stable |
| `zod` | `^3.x` | Latest stable |
| `vite` | `^6.x` | Comes with `npm create vite@latest` |
| `@vitejs/plugin-react` | latest matching Vite 6 | Comes with template |
| `vite-plugin-pwa` | `^1.3.x` | Requires Vite 5+; ships Workbox 7.4.x |
| `tailwindcss` | `^4.x` | v4 |
| `@tailwindcss/vite` | `^4.x` | First-party Vite plugin for Tailwind v4 |
| `vitest` | latest | Reuses Vite's transformer |
| `@testing-library/react`, `*/jest-dom`, `*/user-event` | latest | RTL stack |
| `jsdom` | latest | Test environment |
| `@playwright/test` | latest | E2E |
| `prettier`, `eslint-config-prettier` | latest | |
| `typescript` | `^5.x` | Comes with template |

If `npm install` warns about peer deps for ESLint plugins, those warnings are acceptable as long as `npm run build` and `npm run lint` still pass.

### `vite.config.ts` contract

Replace the Vite-scaffolded `vite.config.ts` with this exact structure (the dev agent should verify imports compile and adjust if a library API has changed slightly between the spec date and execution):

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Story 1.9 fills in workbox runtimeCaching, manifest, and cache namespaces.
      // For Story 1.1 we register the SW with a no-op stub so the build pipeline is wired.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      // manifest fields ship in Story 1.9 — leave undefined for now
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

The `test` field is read by Vitest. Do not split into a separate `vitest.config.ts` for v1 — single config is simpler and Vite/Vitest share it cleanly.

### `playwright.config.ts` contract

Create `playwright.config.ts` at repo root:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile profiles (iOS Safari emulation, Android Chrome) are added in Story 1.5
    // when the e2e CI job ships. v1.1 only tests Chromium for the smoke check.
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

### `App.tsx` contract

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-3xl font-bold tracking-tight">Trucking Life with Shawn</h1>
        <p className="mt-3 text-neutral-400">
          Foundation deployed — feature work begins next sprint.
        </p>
      </div>
    </main>
  );
}
```

This is the minimal shell that:
- Verifies Tailwind v4 is wired (utility classes render).
- Verifies React 19 + Vite render path.
- Provides the text the smoke E2E test asserts on.
- Defaults to dark mode visually (per FR48 — though dark-mode toggle ships in Story 1.14).

### `main.tsx` contract

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Note: do NOT import `./App.css` — it is deleted in Task 5.2.

### `tests/e2e/smoke.spec.ts` contract

Create `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home page renders the brand heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Trucking Life with Shawn')).toBeVisible();
});
```

### `src/test-setup.ts` contract

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

That single line auto-extends Vitest's `expect` with jest-dom matchers (`toBeInTheDocument()`, `toHaveTextContent()`, etc.) for all Story 1.x and feature-epic component tests.

### Architecture compliance notes

- **Module organization (AR29 / AR30):** Story 1.1 creates NO `src/modules/` subdirectories. Each feature module is created when its first story lands (e.g., `src/modules/auth/` ships in Story 1.11). Do NOT pre-create empty module folders.
- **No `src/services/` or `src/utils/` directories** (junk-drawer anti-pattern, AR30). If the dev agent encounters Vite scaffold suggesting these, do not create them.
- **Path alias `@/*` → `src/*`** (architecture convention for clean imports). Configured in BOTH `tsconfig.app.json` AND `vite.config.ts` `resolve.alias`. Without the Vite alias, runtime imports break; without the tsconfig alias, the editor can't resolve.
- **Single `package.json`** (AR2 — no monorepo tooling). Do not create workspaces, sub-packages, or Lerna/Nx/Turbo configuration.

### Library/framework compliance

- **No additional state libraries.** Zustand + TanStack Query + native `useState` cover all five state homes (architecture § 4.4). Do not install Redux, Recoil, Jotai, MobX, or Context-as-state-management libraries.
- **No additional form libraries.** Forms are <5 fields at v1; native `<form>` + `useState` is the rule. Do not install React Hook Form, Formik, or Final Form.
- **No CSS-in-JS.** Tailwind v4 only. Do not install Emotion, styled-components, vanilla-extract, or PostCSS plugins beyond what `@tailwindcss/vite` brings.
- **No icon library yet.** Story 1.1 ships no icons. If `App.tsx` needs decoration, use Tailwind utility classes (color, spacing) — no icons. Icon library decision is deferred to whichever feature story first needs them.

### File structure compliance

After Story 1.1 commits, the repo MUST look like this (everything not listed should NOT exist):

```
trucking-life-pwa/
├── _bmad/                          # PRESERVED (BMAD installation)
├── _bmad-output/                   # PRESERVED (planning artifacts + this story file)
├── docs/                           # PRESERVED (empty for now)
├── public/
│   └── vite.svg                    # Vite default (ok to keep; replaced in Story 1.9 with manifest icons)
├── src/
│   ├── App.tsx                     # Minimal shell (AC10)
│   ├── main.tsx                    # Entry (drops App.css import)
│   ├── index.css                   # @import "tailwindcss";
│   ├── test-setup.ts               # Vitest setup
│   ├── vite-env.d.ts               # Vite default
│   └── assets/
│       └── react.svg               # Vite default (ok to keep or delete)
├── tests/
│   └── e2e/
│       └── smoke.spec.ts           # Playwright smoke test
├── .editorconfig
├── .env.example                    # Committed; values empty
├── .gitignore                      # Vite default + .env.local + node_modules + dist
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js                # Vite default + eslint-config-prettier last
├── index.html                      # Vite default
├── package.json
├── package-lock.json               # Committed for cross-machine reproducibility
├── playwright.config.ts
├── README.md                       # PRESERVED (Huffy's existing one)
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

NO subdirectories under `src/modules/`. NO `netlify.toml` (Netlify is configured via the Netlify dashboard for now; `netlify.toml` ships in Story 1.4 when redirects are needed). NO `src/components/`, `src/core/`, or `src/routes/` directories yet — they're created when their first stories land.

### Testing standards

- **Unit tests:** Vitest + RTL. Co-located with components (`Foo.tsx` ↔ `Foo.test.tsx`). Story 1.1 ships zero unit tests; Vitest just needs to *run cleanly* with no test files (exit 0).
- **E2E tests:** Playwright. Centralized in `tests/e2e/`. Story 1.1 ships exactly one smoke spec.
- **No coverage thresholds** at v1.1. Coverage gates are not in scope; story-by-story tests grow the suite organically.
- **Browser matrix for E2E in Story 1.1:** Chromium only. iOS Safari emulation and Android Chrome profiles ship in Story 1.5 (CI scaffold story).

### Git intelligence (recent commits as context)

The repo currently has 4 commits on `main`:

```
089a04c Test cache works
a693658 Test credential chache
36fe7d9 Add README
a66e0f1 Initial BMAD planning artifacts: brief, PRD, architecture, epics, readiness
```

Observations relevant to Story 1.1:
- The two "test cache" commits are auth-credential setup, not project content — safe to ignore.
- The first non-trivial commit is the BMAD artifacts dump, which means the project state at HEAD is "planning complete, scaffolding starts now."
- Working tree is clean. Story 1.1 is the first feature-tree commit.
- Commit message convention emerging: lowercase `chore:` prefix for non-feature commits. Continue this convention for the Story 1.1 commit.

### Latest tech information (verified 2026-05-08)

- **`vite-plugin-pwa@1.3.0`** released 2026-05-05. Compatible with Vite 5+ and React 19. Provides `virtual:pwa-register/react` virtual module — useful for Story 1.9 but not invoked in Story 1.1.
- **Tailwind v4 + `@tailwindcss/vite`**: First-party plugin; eliminates the `tailwind.config.js` requirement. Tokens go in CSS via `@theme` directive when needed (v1.05 polish).
- **React Router v7 library mode**: Single-package import `import { BrowserRouter, Routes, Route } from 'react-router'` — no `react-router-dom`. Story 1.1 does NOT wire React Router (deferred to Story 1.10).
- **TanStack Query v5.100.x**: Story 1.1 does NOT wire QueryClientProvider (deferred to Story 1.10).
- **Workbox 7.4.x** ships inside vite-plugin-pwa 1.3.0; no separate install needed.

### Project Structure Notes

- **Alignment with the architecture doc:** This story implements the *Sprint 0* baseline that the architecture's "Project Structure" section anticipates. The full module tree (auth, parking, hos, affiliate, admin, settings, stan-promo, plus core/components) is created incrementally by feature stories — NOT by Story 1.1.
- **Detected variances from architecture:**
  - The architecture's project tree shows `netlify.toml` at the repo root. Story 1.1 does NOT create it; it ships in Story 1.4 alongside the redirect rules. **Rationale:** Netlify is configured via the dashboard for v1; `netlify.toml` is only needed once redirects are required (privacy.html, affiliate-disclosure.html paths).
  - The architecture lists `lhci.config.cjs`, `.size-limit.json`, and `.github/workflows/ci.yml`. These ship in Story 1.5 when the CI gates land. **Rationale:** Story 1.1 is the foundation; CI infra is a discrete story.
  - The architecture lists `supabase/` directory with migrations and Edge Functions. These ship in Stories 1.2/1.3. **Rationale:** Story 1.1 deliberately doesn't touch Supabase to keep the scaffold scope tight.

### References

All technical guidance in this story is sourced from:

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
  - § *Functional Requirements* FR1–FR8 (auth/onboarding context — the foundation must support these)
  - § *Non-Functional Requirements* NFR-P1, NFR-P6 (perf budgets — informs build config)
  - § *PWA / Web App Specific Requirements* (browser matrix, install prompts)
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
  - § *Locked Inputs* (deployment, library stack, repo constraints)
  - § *Starter Template Evaluation* (Vite `react-ts` + install commands)
  - § *Core Architectural Decisions* (state homes, routing strategy, error contract)
  - § *Implementation Patterns & Consistency Rules* (naming, module structure, format patterns)
  - § *Project Structure & Boundaries* (full file tree — Story 1.1 ships the foundation subset)
- **Epics:** `_bmad-output/planning-artifacts/epics.md`
  - § *Epic 1, Story 1.1* (original ACs — this dev-spec amends per Sprint 0 sequencing memory)
  - § *Additional Requirements* AR1–AR2, AR21–AR28 (locked stack + CI gates referenced by future stories)
- **Readiness Report:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-08.md`
  - § *Sprint 0 prerequisites* (the four open AR33–AR36 items, none of which apply to Story 1.1 directly)
- **Memory:** `~/.claude/projects/.../memory/feedback_sprint0_sequencing.md`
  - The Git → GitHub → Netlify → clone → scaffold ordering captured 2026-05-08.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — interactive paired-implementation mode with Huffy. Each task verified before moving to the next.

### Debug Log References

- Vite dev-server smoke test (Tailwind compiled output verified Tailwind v4.3.0 generates utilities from JSX): manual probe `curl http://localhost:5173/src/index.css`
- Playwright smoke test artifacts: `playwright-report/`, `test-results/` (both now gitignored)
- Bundle-size confirmation in `npm run build` log: `dist/assets/index-BqUxJNJc.js   190.82 kB │ gzip: 60.17 kB`

### Completion Notes List

**All 12 acceptance criteria satisfied.** Story spans Tasks 1–14; deploy verified live on `trucking-life-pwa.netlify.app` rendering the dark "Trucking Life with Shawn / Foundation deployed — feature work begins next sprint." shell on iOS Safari and Android Chrome (Huffy browser-smoke-tested 2026-05-10).

**Deviations from the original Story 1.1 spec** (all resolved during execution; worth folding into a follow-up scaffold-story spec for future PWAs):

1. **`create-vite`'s "Ignore files and continue" overwrote `README.md`** instead of preserving it (current `create-vite` behavior differs from what the spec described). Recovered via `git checkout README.md`. The spec's preservation guarantee should be amended to "expect README.md collision; restore from HEAD after scaffold".

2. **TypeScript 6 deprecated `baseUrl`** with error `TS5101`. Removed from `tsconfig.app.json`. `paths` resolves relative to the tsconfig file's directory natively in TS 6 + `moduleResolution: bundler`. Future scaffold specs should omit `baseUrl` entirely.

3. **Vitest 4 exits non-zero on "no test files found"** by default — stricter than older Vitest. Added `--passWithNoTests` flag to the `test` script. Defensive; once Story 1.6 (disclaimer source-of-truth assertion) ships, real tests exist.

4. **`vite.config.ts` `test` field is rejected by Vite's `defineConfig` types** — must import `defineConfig` from `vitest/config` instead. Initially used a `/// <reference types="vitest/config" />` triple-slash directive plus the import, but `@typescript-eslint/triple-slash-reference` flagged the directive as a style violation. Final form is just `import { defineConfig } from 'vitest/config'` (the import alone pulls in the types).

5. **Playwright on Linux needs `npx playwright install-deps chromium`** for `libnspr4.so` and related system libraries (not bundled with the browser binary). One-time apt install. May also be needed on Huffy's Chromebook + Windows-WSL setups if the e2e suite runs there.

6. **Netlify's default publish directory was the repo root, not `dist/`** — initial deploy served the source `index.html` (with `/src/main.tsx` reference) instead of the production bundle. Added `netlify.toml` (committed in `1c2c50f`) with `publish = "dist"`, `command = "npm run build"`, `NODE_VERSION = "20"`, and an SPA-fallback `/*` → `/index.html` redirect. The architecture had deferred `netlify.toml` to Story 1.4 — pulled forward into Story 1.1 because the deploy was broken without it. Story 1.4 will extend with stable-URL redirects (`/privacy`, `/affiliate-disclosure`) and security headers.

7. **GitHub App connection between Netlify and the repo had to be reconnected** mid-story (Shawn handled). Until reconnection, pushes weren't triggering rebuilds. Once Shawn reconnected (and pushed three empty "Trigger Netlify rebuild" commits to nudge), the next push (`be6e775`) deployed immediately. The original story spec assumed Netlify was wired pre-Task 1 — in practice the wiring was iffy and required mid-story intervention.

**Bundle size at green:** **190.82 KB raw / 60.17 KB gzipped.** 30% of the NFR-P6 200KB gz budget. Plenty of headroom for the feature epics.

**Tailwind v4 picked up class names from BMAD markdown docs** in dev (~1KB extra utilities generated). Production builds tree-shake aggressively — verified 60 KB gz includes only the App.tsx classes plus standard `@layer base` resets. Not a problem at Story 1.1 scope; if the bundle-size gate (Story 1.5) ever blocks on this, add `@source not "_bmad/**"; @source not "_bmad-output/**";` to `src/index.css`.

**Sprint-status.yaml update (Task 14.4):** No-op. The file doesn't exist yet (`/bmad-sprint-planning` hasn't been run). When sprint-status.yaml is created later, its `1-1-scaffold-vite-baseline` entry should be initialized as `done`.

**Commits landed for Story 1.1** (in chronological order on `origin/main`):
1. `3a0cccd` — chore: scaffold vite + react + typescript baseline (story 1.1)
2. `1c2c50f` — fix(netlify): set publish=dist + Node 20 + SPA fallback redirect
3. (Shawn's three `Trigger Netlify rebuild with build settings` empty-commits, between #2 and the GitHub-App reconnection)
4. `be6e775` — chore(vite): drop redundant vitest/config triple-slash directive
5. (this Task 14 update — pending commit at time of writing)

### File List

**CREATED (Vite scaffold + locked stack + configs):**
- `.editorconfig` — root config, indent 2, LF, UTF-8, trim trailing whitespace
- `.env.example` — three `VITE_*` keys (SUPABASE_URL, SUPABASE_ANON_KEY, PLAUSIBLE_DOMAIN), no values
- `.gitignore` — Vite default + Playwright (`/playwright-report/`, `/test-results/`) + Vite PWA (`/dev-dist/`) additions
- `.prettierignore` — skips `dist`, `node_modules`, `_bmad`, `_bmad-output`, `*.md`
- `.prettierrc.json` — `semi: true`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`, `tabWidth: 2`
- `eslint.config.js` — modern flat config from Vite scaffold, extended with `eslintConfigPrettier` as the last entry
- `index.html` — Vite scaffold default
- `netlify.toml` — `[build]` command + publish=dist, `NODE_VERSION=20`, SPA fallback redirect (pulled forward from Story 1.4)
- `package.json` — Vite scaffold + locked deps + 10 normalized scripts (`dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`)
- `package-lock.json` — committed for cross-machine reproducibility
- `playwright.config.ts` — Chromium-only project, dev-server webServer, baseURL `http://localhost:5173`
- `public/favicon.svg`, `public/icons.svg` — Vite scaffold defaults
- `src/App.tsx` — minimal Tailwind shell rendering "Trucking Life with Shawn / Foundation deployed — feature work begins next sprint." (replaces Vite demo)
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` — Vite scaffold remnants (orphaned after App.tsx replaced; tree-shaken from production bundle)
- `src/index.css` — exactly `@import 'tailwindcss';` (replaces Vite's CSS-variable demo)
- `src/main.tsx` — Vite scaffold default (StrictMode + createRoot, imports `./index.css` and `./App`)
- `src/test-setup.ts` — `import '@testing-library/jest-dom/vitest';` (auto-extends Vitest expect with jest-dom matchers)
- `src/vite-env.d.ts` — Vite scaffold default
- `tests/e2e/smoke.spec.ts` — single Playwright spec asserting `Trucking Life with Shawn` text is visible at `/`
- `tsconfig.app.json` — Vite scaffold + added `"strict": true` + `"paths": { "@/*": ["./src/*"] }` (no `baseUrl` per TS 6)
- `tsconfig.json` — Vite scaffold default (project references)
- `tsconfig.node.json` — Vite scaffold default (for `vite.config.ts`)
- `vite.config.ts` — fully rewritten: `defineConfig` from `vitest/config`, plugins (`react`, `tailwindcss`, `VitePWA` with stub Workbox), `resolve.alias` `@` → `src/`, `server.port` 5173, Vitest `test` block (`jsdom`, `setupFiles: ['./src/test-setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`)

**DELETED:**
- `src/App.css` — Tailwind utilities replace it; one fewer file to maintain

**PRESERVED (existed before Story 1.1, untouched):**
- `README.md` — preserved via `git checkout` after `create-vite` overwrote (deviation #1 above)
- `_bmad/`, `_bmad-output/`, `docs/`, `.git/`

**File ownership note:** Files created/edited via the assistant's tool calls in this session ran as root in the sandbox shell, so they're owned by `root` on disk. After Huffy clones to his other machine via git, ownership will be his (git tracks content, not permissions) — no manual `chown` needed.


