# Deferred Work

## Deferred from: code review of story-1.9 (2026-06-12)

- **Wire the install primitives + FR7 engagement signal.** `src/pwa/installPrompt.ts` exports and tests `androidInstallPrompt()`, `recordEngagedSession()`, `iOSInstallInstructions()`, but nothing invokes them yet, and the FR7 "engaged session" threshold (e.g. >1 route navigation or >10s active) is not implemented — `recordEngagedSession` currently increments once per calendar-day open. This is intentional for the 1.9 infrastructure story; the consuming UI (install banner / inline iOS instructions) and the real engagement trigger should be wired when the app shell + routing exist. Owner: install-funnel work (Story 1.10+). Capture `androidInstallPrompt()` synchronously at app startup so `beforeinstallprompt` isn't missed.

## Deferred from: code review of story-1.10 (2026-06-16)

- **Error Boundary around the lazy route tree.** `<Suspense fallback={null}>` in `src/App.tsx` shows a blank screen during lazy-chunk load, and a chunk-load failure (slow/offline network or a stale hashed chunk after deploy) currently white-screens the whole app — there is no Error Boundary anywhere in `src/`. Especially relevant for an offline-capable trucker PWA. `fallback={null}` itself is spec-sanctioned; the deferred work is an error boundary (and optionally a visible loading indicator) wrapping the lazy tree.
- **`/affiliate-disclosure` static-URL collision.** The route is implemented as an in-app React route, but architecture.md:505 designates `/affiliate-disclosure` (and `/privacy`) as Netlify-served static HTML. When static stable URLs land, reconcile so the SPA route does not shadow/collide with the static file at the same path.
- **`/hos/*` subtree.** Only `/hos` is registered; `/hos/disclaimer` and `/hos/log` (architecture + Task 4 text) are not. Lands with Epic 3 HOS screens.
- **Redirect authenticated users away from auth pages.** `/auth/login` and `/onboarding` have no "already-signed-in → /" redirect. Lands with Story 1.11 (magic-link auth).
