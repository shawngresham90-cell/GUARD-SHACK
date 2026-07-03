// src/components/Placeholder.tsx
//
// Minimal stand-in screen for routes whose real implementation lands in a later
// story/epic. Story 1.10 builds the *navigable, guarded shell*; each feature
// screen referenced by the route tree must exist so imports resolve and the
// build type-checks. Replace these as the feature epics deliver real screens.

import type { ReactNode } from 'react';

export function Placeholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 p-6 text-center text-neutral-50">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-400">Placeholder screen — implemented in a later story.</p>
      {children}
    </main>
  );
}
