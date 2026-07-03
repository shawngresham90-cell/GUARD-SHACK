---
baseline_commit: 559d9e1e85c7ee18437fc114d7d76b8cef1e53fb
---

# Story 1.9: Build PWA infrastructure (Workbox SW + cache namespaces + manifest + install prompts)

Status: review

**Epic:** 1 (Foundation, Auth & Onboarding)
**Story Key:** `1-9-pwa-infrastructure`
**Story ID:** 1.9
**Generated:** 2026-06-12
**Author of dev-spec:** Claude (Opus 4.8, 1M context) — `/bmad-create-story`

---

## Story

As **Huffy (the developer)**,
I want **the Service Worker registered via Workbox with three named cache namespaces, a committed PWA manifest + icon set, and install prompts working on iOS Safari and Android Chrome**,
so that **the offline-first architecture (NFR-P5, NFR-S7) and the install funnel (FR6, FR7) are in place for the parking and affiliate feature epics to consume.**

This is **pure infrastructure**. It ships the SW skeleton, the cache-namespace contract, the manifest, and the install-prompt primitives — but it does **not** wire any feature data into the caches. Story 2.10 (offline parking) and the affiliate engine (Epic 4) consume what this story builds. Do not implement parking/affiliate caching logic here.

---

## Acceptance Criteria

> Source: [_bmad-output/planning-artifacts/epics.md#Story-1.9]

**AC1 — vite-plugin-pwa configured for a custom Service Worker**
`vite.config.ts` is configured with `vite-plugin-pwa` using the **`injectManifest`** strategy (NOT `generateSW`), pointing at `src/pwa/sw.ts`, with manifest handling and register strategy set. (The current config uses the default generateSW workbox block — this story replaces it. See Dev Notes → "Strategy switch: generateSW → injectManifest".)

**AC2 — Cache namespace contract**
`src/pwa/cacheNames.ts` exports exactly three string constants:
- `PARKING_RESULTS = 'parking-results-v1'`
- `AFFILIATE_CONFIG = 'affiliate-config-v1'`
- `STATIC_ASSETS = 'static-assets-v1'`

**AC3 — SW registers namespaces + runtime partition assertion (NFR-S7)**
`src/pwa/sw.ts` registers the SW using these three namespaces and includes a **runtime assertion at the `activate` event** that enumerates `caches.keys()` and **fails (logs + deletes/aborts) if any cache name appears that is not one of the three known namespaces** (plus Workbox's own precache name). This is the structural enforcement of the SW/HOS partition rule (NFR-S7): the Dexie `hosdb` database and the SW Cache API are strictly disjoint trust domains.

**AC4 — PWA manifest committed**
`public/manifest.json` is committed containing: `name`, `short_name`, `theme_color`, `background_color`, `icons` (192px, 512px, and a maskable 512px), `display: "standalone"`, `start_url`, and `scope`.

**AC5 — Install-prompt primitives**
`src/pwa/installPrompt.ts` exposes:
- `iOSInstallInstructions()` — renders inline Add-to-Home-Screen instructions on iOS Safari **when the app is not yet installed** (FR6).
- `androidInstallPrompt()` — listens for `beforeinstallprompt`, suppresses the default mini-infobar, and surfaces a **non-intrusive banner after the user's second engaged session** (FR7).

**AC6 — SW registered from main.tsx**
The SW is registered from `src/main.tsx` via vite-plugin-pwa's `useRegisterSW` helper (from `virtual:pwa-register/react`).

**AC7 — Lighthouse installable**
Lighthouse PWA audit on the Netlify preview deploy reports the app as **installable** on both iOS Safari 16.4+ and Android Chrome.

---

## Tasks / Subtasks

- [x] **Task 1 — Verify Workbox deps + decide manifest source** (AC: 1, 4)
  - [x] 1.1 Confirm `vite-plugin-pwa@^1.3.0` is installed (it is — Story 1.1). For `injectManifest` custom SWs you import from `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-core`. Verify these resolve (vite-plugin-pwa bundles `workbox-build`, but the runtime `workbox-*` packages must be importable from `src/pwa/sw.ts`). If they do not resolve, `npm install -D workbox-precaching workbox-routing workbox-strategies workbox-core` at versions matching the plugin's bundled Workbox.
  - [x] 1.2 Decide manifest source (see Dev Notes → "Manifest: committed file vs. plugin-generated"). Default decision: **hand-author `public/manifest.json`** and set `manifest: false` in the plugin so it doesn't emit a competing `manifest.webmanifest`; add `<link rel="manifest" href="/manifest.json">` to `index.html`.

- [x] **Task 2 — Author `src/pwa/cacheNames.ts`** (AC: 2, 3)
  - [x] 2.1 Export the three constants with the exact `-v1` literals from AC2.
  - [x] 2.2 Export a `KNOWN_CACHE_NAMES` readonly array/Set composed of the three constants, for reuse by the SW assertion and its unit test. Do not duplicate the literals.

- [x] **Task 3 — Author `src/pwa/sw.ts` (injectManifest custom SW)** (AC: 1, 3)
  - [x] 3.1 `precacheAndRoute(self.__WB_MANIFEST)` for the app shell (this is the `injectManifest` injection point — the build fails if it's missing).
  - [x] 3.2 Register runtime caching routes keyed to the three namespaces using `registerRoute` + the strategies in Dev Notes → "Per-namespace cache strategy table". v1 routes may be minimal placeholders (the feature epics add the real URL matchers) — but the **cacheName** values must be the AC2 constants so the partition is established now.
  - [x] 3.3 Implement the `activate` assertion as a **pure, exported, testable function** `assertCachePartition(cacheKeys: string[]): { ok: boolean; offenders: string[] }` and call it from the `activate` listener. On offenders: `console.error`, delete the offending cache(s), and (dev's choice) report. Allow Workbox's precache name (`workbox-precache-v2-*`) and the three known names.
  - [x] 3.4 `self.skipWaiting()` / `clients.claim()` consistent with `registerType: 'autoUpdate'`.

- [x] **Task 4 — Author `public/manifest.json`** (AC: 4, 7)
  - [x] 4.1 Write `public/manifest.json` using the ready-to-paste block in Dev Notes → "Manifest contents (icons already generated)". Colors are derived from the actual logo background (dark slate `#252831`): `background_color: "#252831"` (matches icon bg → no white install flash), `theme_color: "#FFEB00"` (locked brand yellow). Dev may flip `theme_color` to `#252831` if the v1 shell reads better dark — UX palette finalizes in v1.05.
  - [x] 4.2 ✅ **DONE — icon set already generated** (this story prep). Source logo: `ChatGPT Image Jun 12, 2026, 03_21_20 AM.png` (1254×1254) at repo root. Generated via `sharp` into `public/icons/`:
    - `icon-192.png` (192×192)
    - `icon-512.png` (512×512)
    - `icon-maskable-512.png` (512×512, logo at 80% safe zone on `#252831`)
    - `apple-touch-icon.png` (180×180, flattened — beyond AC4, for iOS home-screen)
    Do NOT regenerate. If the logo changes, re-run the sharp recipe in Dev Notes. Consider moving the source PNG to `src/assets/` or `public/` with a stable name and committing it as the icon source of truth.
  - [x] 4.3 Add `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` and `<meta name="theme-color" content="#FFEB00">` to `index.html` (iOS ignores the manifest for the home-screen icon; it needs the link tag).

- [x] **Task 5 — Author `src/pwa/installPrompt.ts`** (AC: 5)
  - [x] 5.1 `iOSInstallInstructions()`: detect iOS Safari (`/iphone|ipad|ipod/i` on UA + Safari, not Chrome/Firefox) AND not-installed (`!window.navigator.standalone` and not `display-mode: standalone`). Return the inline A2HS instruction content (or null when not applicable). **iOS does NOT fire `beforeinstallprompt`** — manual instructions are the only path.
  - [x] 5.2 `androidInstallPrompt()`: add a `beforeinstallprompt` listener, `e.preventDefault()`, stash the deferred event; expose a `promptInstall()` that calls `deferredPrompt.prompt()`. Gate the banner on an **engaged-session counter** (Dev Notes → "Engaged-session counter"); only surface on count ≥ 2.
  - [x] 5.3 Factor all branching logic into pure functions that take injected `navigator`/`window`/counter values so they are unit-testable in jsdom.

- [x] **Task 6 — Register SW in `main.tsx`** (AC: 6)
  - [x] 6.1 Import `useRegisterSW` from `virtual:pwa-register/react`; call it in a small registration component or hook mounted at the root. Keep `main.tsx` minimal (it currently just mounts `<App/>` in StrictMode — preserve that).
  - [x] 6.2 Add the `virtual:pwa-register/react` type reference (`/// <reference types="vite-plugin-pwa/react" />` or in `vite-env.d.ts`) so TypeScript resolves the virtual module.

- [x] **Task 7 — Tests** (AC: 2, 3, 5)
  - [x] 7.1 Vitest: `cacheNames` exports exactly the three literals; `KNOWN_CACHE_NAMES` has length 3.
  - [x] 7.2 Vitest: `assertCachePartition(['parking-results-v1','affiliate-config-v1','static-assets-v1','workbox-precache-v2-x'])` → ok; with `['hosdb']` or any unknown → `ok:false` and offender listed.
  - [x] 7.3 Vitest: `installPrompt` pure functions — iOS-Safari-not-installed → instructions; Android with count<2 → no banner; count≥2 → banner; standalone display-mode → suppressed.
  - [x] 7.4 Do NOT attempt full SW lifecycle E2E in jsdom (no SW runtime). Installability is verified by Lighthouse in CI (AC7), not Vitest.

- [x] **Task 8 — Verify gates + Lighthouse** (AC: 7)
  - [x] 8.1 Run local gates: `npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build`. All green before pushing.
  - [x] 8.2 Confirm `npm run build` emits the SW (`dist/sw.js`) and the precache manifest is injected (no `self.__WB_MANIFEST` left literal).
  - [ ] 8.3 ⏳ **Deploy-gated (AC7) — pending PR/preview.** Push branch → open PR → confirm Netlify preview deploy → run Lighthouse (the `lighthouse` CI job / `lhci.config.cjs`) and confirm the PWA-installable check passes. Manually spot-check Android Chrome install banner + iOS Safari A2HS instructions on the preview URL. All local installability prerequisites are in place (manifest, registered SW with precache/fetch handler, icons); only the live Lighthouse confirmation remains.

- [x] **Task 9 — Wrap-up**
  - [x] 9.1 Set this story's `Status` to `review` (dev-story hands off to code-review, which flips it to `done`).
  - [x] 9.2 Fill in Dev Agent Record (Completion Notes + File List).
  - [x] 9.3 Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: `1-9-pwa-infrastructure` → `review`.
  - [x] 9.4 Update `NOTES.md` Done / Up Next sections.

---

## Dev Notes

### Strategy switch: generateSW → injectManifest (CRITICAL)
The current `vite.config.ts` (from Story 1.1) uses the **default generateSW** mode:
```ts
VitePWA({ registerType: 'autoUpdate', injectRegister: 'auto',
  workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] } })
```
generateSW **cannot host a custom `activate` assertion** — it produces the SW for you. AC3 requires custom SW code, so switch to `injectManifest`:
```ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src/pwa',
  filename: 'sw.ts',
  registerType: 'autoUpdate',
  injectRegister: false,        // we register manually via useRegisterSW
  manifest: false,              // we hand-author public/manifest.json (Task 1.2)
  injectManifest: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] },
  devOptions: { enabled: true, type: 'module' }, // optional: SW in dev
})
```
In `src/pwa/sw.ts` you then own the SW: `precacheAndRoute(self.__WB_MANIFEST)` + manual `registerRoute(...)` for runtime caches. Type the SW file with `/// <reference lib="webworker" />` and `declare const self: ServiceWorkerGlobalScope`.

### Per-namespace cache strategy table
From [architecture.md#Caching-strategy] — match these when wiring routes (feature epics fill the URL matchers; establish cacheName + strategy now):

| Namespace constant | cacheName | Strategy | Notes |
|---|---|---|---|
| `PARKING_RESULTS` | `parking-results-v1` | StaleWhileRevalidate | 48h max age (Story 2.10 owns the route + expiration plugin) |
| `AFFILIATE_CONFIG` | `affiliate-config-v1` | StaleWhileRevalidate | ≤15-min propagation cycle (Epic 4 owns the route) |
| `STATIC_ASSETS` | `static-assets-v1` | CacheFirst | App shell + icons; version-keyed |

### NFR-S7 partition rule (the reason AC3 exists)
[architecture.md#Cache-partition-rule]: *"Workbox cache namespaces and the Dexie `hosdb` database are strictly disjoint. Runtime assertion at SW activate fails install if an unexpected cache namespace appears."* Two cache partitions = two trust domains: SW Cache API (parking/affiliate, aggressive caching) vs IndexedDB-via-Dexie (`hosdb`, local-only, 30-day prune, never over the wire — NFR-S8/FR29). The `hosdb` Dexie database is built in Story 3.1; it must **never** appear as a Cache API namespace. Your `assertCachePartition` is the structural tripwire that proves this at runtime. Story 2.10 references this assertion as already-present, so keep the exported function stable.

### Manifest: committed file vs. plugin-generated
AC4 says *"`public/manifest.json` is committed."* vite-plugin-pwa can generate `manifest.webmanifest` from its `manifest` option, but that would (a) not be a committed `manifest.json` and (b) compete with a hand-authored one. **Default: hand-author `public/manifest.json`, set `manifest: false`, add `<link rel="manifest" href="/manifest.json">` to `index.html`.** This satisfies the AC literally and keeps one source of truth. (Alternative: use the plugin `manifest` option and treat the generated file as the artifact — only do this if you also update the AC interpretation with Huffy.)

### Manifest contents (icons already generated)
Ready-to-paste `public/manifest.json` — the referenced icon files already exist in `public/icons/`:
```json
{
  "name": "Trucking Life with Shawn",
  "short_name": "Trucking Life",
  "description": "Truck parking ahead + a personal HOS logbook for OTR and local drivers.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#252831",
  "theme_color": "#FFEB00",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
Re-generate icons recipe (only if the logo changes) — `npm install -D sharp` then a node script that: samples the source corner for the maskable bg, `resize(192|512, fit:'contain')` for the standard icons, `resize(180).flatten({background})` for apple-touch, and composites an 80%-scaled logo (410px) centered on a 512 bg canvas for the maskable variant.

### Engaged-session counter (FR7)
FR7: banner *"after their second engaged session."* There is no platform primitive for "engaged session" — define a pragmatic heuristic and document it: increment a `localStorage` key (e.g. `tlws_engaged_sessions`) once per app load that crosses an engagement threshold (e.g. >1 route navigation or >10s active), de-duped per calendar day. Surface the Android banner only when count ≥ 2 AND a `beforeinstallprompt` event was captured. Keep the threshold logic in a pure function for testing.

### iOS vs Android install reality
- **Android Chrome**: fires `beforeinstallprompt`; you must `preventDefault()` to suppress the mini-infobar and call `prompt()` later from a user gesture.
- **iOS Safari (16.4+)**: does **NOT** fire `beforeinstallprompt` and has no programmatic install. The only path is manual A2HS instructions (Share → Add to Home Screen). `iOSInstallInstructions()` must detect installed state via `window.navigator.standalone === true` OR `matchMedia('(display-mode: standalone)').matches` and render nothing when already installed.

### File locations (match architecture source tree)
[architecture.md#Code-Organization]: PWA code lives under `src/pwa/`; `public/manifest.json` + `public/icons/` are committed; SW is registered from `src/main.tsx`. Do not invent new top-level dirs. The repo currently has `public/favicon.svg` + `public/icons.svg` (no PNG icon set yet — Task 4.2 creates it).

### Testing standards
- **Vitest + RTL + jsdom** (config in `vite.config.ts` `test` block; setup `src/test-setup.ts`). `globals: false` → import `describe/it/expect` from `vitest` explicitly (match existing tests, e.g. `src/core/disclaimers.test.ts`).
- Test the **pure functions** (`assertCachePartition`, install heuristics), not the SW lifecycle — jsdom has no SW/Cache runtime. Installability is a Lighthouse/CI concern (AC7), enforced by the existing `lighthouse` CI job + `lhci.config.cjs`.
- Co-locate tests as `*.test.ts(x)` next to source (project convention).

### Project Structure Notes
- New files: `src/pwa/cacheNames.ts`, `src/pwa/sw.ts`, `src/pwa/installPrompt.ts` (+ `*.test.ts`), `public/manifest.json`, `public/icons/icon-{192,512}.png`, `public/icons/icon-maskable-512.png`.
- Modified: `vite.config.ts` (strategy switch), `src/main.tsx` (register SW), `index.html` (manifest link + meta `theme-color`), possibly `src/vite-env.d.ts` (virtual module types).
- **Do not touch** `_bmad/`, `_bmad-output/`, `supabase/`, or existing module code beyond what's listed.
- Existing PWA plumbing from Story 1.1 (vite-plugin-pwa installed, build pipeline) is the foundation — extend it, don't re-scaffold.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.9] — full AC set
- [Source: _bmad-output/planning-artifacts/architecture.md#Caching-strategy] — multi-tier cache table, the three namespaces + strategies
- [Source: _bmad-output/planning-artifacts/architecture.md#Cache-partition-rule] — NFR-S7 disjoint-partition + activate assertion mandate
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization] — source-tree placement (`src/pwa/`, `public/manifest.json`, register from `main.tsx`)
- [Source: _bmad-output/planning-artifacts/architecture.md#Two-cache-partitions-two-trust-domains] — trust-domain rationale
- FR6/FR7 (install funnel), NFR-P5 (offline architecture), NFR-S7/S8 + FR29 (HOS never over wire / partition)

### Cross-story dependencies
- **Depends on:** Story 1.1 (vite-plugin-pwa installed, build/CI live), Story 1.4 (Netlify deploy + preview URLs for Lighthouse).
- **Consumed by:** Story 2.10 (Workbox offline parking — uses `PARKING_RESULTS` + the activate assertion), Epic 4 affiliate engine (uses `AFFILIATE_CONFIG`, ≤15-min stale-while-revalidate), Story 3.1 (Dexie `hosdb` — the partition counterpart the assertion guards against).
- **Independent of:** Story 1.10 (provider tree) — they can land in either order; neither blocks the other.

### Latest-tech notes (installed versions)
- `vite-plugin-pwa@^1.3.0`, `vite@^8.0.10`, `react@^19.2.5`, `react-router@^7.15.0`, `dexie@^4.4.2`. (Architecture text predates these and says "Vite 6" — the repo is on Vite 8; follow the repo, not the doc.)
- vite-plugin-pwa 1.x: `injectManifest` strategy + `virtual:pwa-register/react` `useRegisterSW` are stable. With React 19 + StrictMode, ensure the register hook tolerates double-invoke in dev (it does; registration is idempotent).
- Verify the `workbox-*` runtime package major matches the Workbox version bundled by vite-plugin-pwa 1.3 (mismatched majors break `precacheAndRoute`). If unsure, install the `workbox-*` packages explicitly pinned to that major.

### Previous-story intelligence (Story 1.8)
Story 1.8 (HosShell composition contract + RODS-grid scan) established the pattern this epic favors: **structural/runtime enforcement over convention** — a real AST/CSS scanner gates the RODS-grid rule, and a stub `RequireHosAck` route guard exists at `src/routes/guards/RequireHosAck.tsx`. AC3 here is the same philosophy applied to caches (a runtime assertion, not a comment). Reuse the "extract the rule into a pure, tested function, then call it from the enforcement point" approach. Recent merged stories (1.6 disclaimers, 1.7 AffiliateCTA, 1.8 HosShell) all co-locate tests and export the testable core — match that.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — `claude-opus-4-8[1m]` via `/bmad-dev-story`

### Debug Log References

- `tsc -b` (TS 6.0.3): green — worker project (`tsconfig.worker.json`, `WebWorker` lib) compiles `sw.ts` in isolation from the app's `DOM` lib.
- Full suite: **59 tests / 11 files pass** — 23 new across 3 files (3 cacheNames + 4 partition + 16 installPrompt), no regressions.
- `vite build`: injectManifest mode, `dist/sw.js` emitted, **precache 10 entries (743.74 KiB)**, `0` unreplaced `__WB_MANIFEST` tokens, all three namespaces present in built SW.
- CI gates: `check:ftc`, `check:rods`, `check:disclaimer-source` all OK; `size-limit` 62.57 kB gz / 200 kB.

### Completion Notes List

- **AC1** — `vite.config.ts` switched from default `generateSW` to `strategies: 'injectManifest'` (`srcDir: 'src/pwa'`, `filename: 'sw.ts'`, `injectRegister: false`, `manifest: false`).
- **AC2** — `src/pwa/cacheNames.ts` exports the three exact `-v1` literals + `KNOWN_CACHE_NAMES`.
- **AC3** — `assertCachePartition()` extracted to `src/pwa/partition.ts` (pure, testable; allows the three namespaces + `workbox-precache*`) and invoked from `sw.ts`'s `activate` handler, which deletes offenders and `console.error`s on violation. Kept in a sibling module (not inside `sw.ts`) so it's unit-testable without the SW runtime — signature stable for Story 2.10.
- **AC4** — `public/manifest.json` hand-authored (name, short_name, theme `#FFEB00`, bg `#252831`, 192/512/maskable-512 icons, standalone, start_url/scope `/`); copied to `dist/` on build.
- **AC5** — `src/pwa/installPrompt.ts`: `iOSInstallInstructions()` (iOS-Safari-and-not-installed detection) + `androidInstallPrompt()` controller (captures/`preventDefault`s `beforeinstallprompt`, `shouldShowBanner` gated on a per-day engaged-session counter ≥ 2). All branching in injectable pure functions.
- **AC6** — `<ServiceWorkerManager>` (`useRegisterSW` from `virtual:pwa-register/react`) mounted at the root in `main.tsx`; virtual-module types referenced in `src/vite-env.d.ts`.
- **AC7** — ⏳ deploy-gated. Local installability prerequisites all satisfied; the live Lighthouse-installable confirmation runs on the Netlify preview during PR/code-review (Task 8.3).
- **Decision:** added a dedicated `tsconfig.worker.json` (referenced from `tsconfig.json`; `sw.ts` excluded from `tsconfig.app.json`) to give the SW `WebWorker` globals without polluting the app's `DOM` compilation — avoids DOM/WebWorker duplicate-identifier issues.
- **Dependencies:** pinned `workbox-precaching/routing/strategies/core@^7.4.1` as devDeps (match bundled `workbox-build@7.4.1`); `sharp` devDep was added during story prep for icon generation.

### File List

**New**
- `src/pwa/cacheNames.ts`, `src/pwa/cacheNames.test.ts`
- `src/pwa/partition.ts`, `src/pwa/partition.test.ts`
- `src/pwa/sw.ts`
- `src/pwa/installPrompt.ts`, `src/pwa/installPrompt.test.ts`
- `src/pwa/ServiceWorkerManager.tsx`
- `src/vite-env.d.ts`
- `public/manifest.json`
- `public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon}.png` (generated during prep)
- `tsconfig.worker.json`

**Modified**
- `vite.config.ts` (generateSW → injectManifest)
- `src/main.tsx` (mount `<ServiceWorkerManager>`)
- `index.html` (manifest link, theme-color, apple-touch-icon, apple meta, title)
- `tsconfig.json` (add worker project reference)
- `tsconfig.app.json` (exclude `src/pwa/sw.ts`)
- `package.json` / `package-lock.json` (workbox-* devDeps)

## Change Log

| Date | Change |
|---|---|
| 2026-06-12 | Story 1.9 implemented — PWA infra (injectManifest SW, 3 cache namespaces, NFR-S7 activate assertion, hand-authored manifest, iOS/Android install primitives, SW registration). 23 new unit tests; all gates green. Status → review. AC7 (Lighthouse-installable) pending preview deploy. |
| 2026-06-12 | Code review (3-layer adversarial) — 10 hardening patches applied, 4 findings dismissed as scope/non-defects, 1 deferred to the install-funnel story. Full suite (66 unit + e2e) green. |

## Senior Developer Review (AI)

**Reviewed:** 2026-06-12 · **Reviewer:** Claude (Opus 4.8) via `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
**Outcome:** ✅ Approved with hardening applied. All 7 ACs satisfied (AC7 deploy-gated). No HIGH/MEDIUM left unresolved.

### Review Findings

**Patches applied (10) — all fixed in this branch:**
- [x] [Review][Patch] Broaden Workbox cache allow-prefix `workbox-precache` → `workbox-` so the partition guard never deletes a Workbox-managed runtime cache [src/pwa/partition.ts]
- [x] [Review][Patch] Wrap `activate` handler in try/catch and `.catch()` each `caches.delete`; always `clients.claim()` even if cleanup fails [src/pwa/sw.ts]
- [x] [Review][Patch] Guard `precacheAndRoute(self.__WB_MANIFEST ?? [])` against an un-injected token [src/pwa/sw.ts]
- [x] [Review][Patch] `localStorage` access wrapped (private mode / SecurityError / quota) in `safeGet`/`safeSet`/`resolveStorage` [src/pwa/installPrompt.ts]
- [x] [Review][Patch] Clamp engaged-session counter to a non-negative integer (rejects negative/NaN, floors fractional) [src/pwa/installPrompt.ts]
- [x] [Review][Patch] `isStandalone` optional-chains `.matches` so a stubbed/odd `matchMedia` can't throw [src/pwa/installPrompt.ts]
- [x] [Review][Patch] `isIOSSafari` detects iPadOS Safari (Mac UA + `maxTouchPoints>1`) [src/pwa/installPrompt.ts]
- [x] [Review][Patch] `isIOSSafari` excludes iOS in-app webviews (FB/IG/Line/GSA) that can't A2HS [src/pwa/installPrompt.ts]
- [x] [Review][Patch] `promptInstall` try/catch around `prompt()`/`userChoice`; consume deferred up-front to avoid double-trigger [src/pwa/installPrompt.ts]
- [x] [Review][Patch] Manifest `id`/`lang`/`dir` + `apple-mobile-web-app-title` for stable identity & iOS label [public/manifest.json, index.html]

**Deferred (1) — tracked for the install-funnel story:**
- [x] [Review][Defer] Install primitives (`androidInstallPrompt`, `recordEngagedSession`) are exported/tested but not yet invoked by any caller, and the FR7 "engaged" threshold (route-nav / dwell) is not wired — by design for this infra story; the consuming UI + engagement signal land with the install funnel (Story 1.10+). See `deferred-work.md`.

**Dismissed (4):** `skipWaiting` not in `waitUntil` (conventional); "fails install" vs log+delete (Task 3.3 permits log+delete); `KNOWN_CACHE_NAMES` tuple vs Set (AC2 satisfied); per-calendar-day session de-dup (Dev Notes sanction it).

### Post-review verification
66 unit tests + Playwright e2e smoke pass; typecheck/lint/format/build/check:ftc/check:rods/check:disclaimer-source/size-limit all green. SW build re-verified (0 unreplaced `__WB_MANIFEST`).
