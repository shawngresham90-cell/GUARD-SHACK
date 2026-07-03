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
