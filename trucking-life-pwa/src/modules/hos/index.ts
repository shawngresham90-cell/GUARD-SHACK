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
