// SOURCE OF TRUTH for canonical disclaimer copy (FR61, NFR-C5).
//
// These strings ship in the product as-is. Translation, paraphrase, or
// "tightening" is forbidden without lawyer sign-off. Variable interpolation
// is forbidden. Importers reference these constants by name; never inline
// the text elsewhere.
//
// Source: _bmad-output/planning-artifacts/prd.md § "Disclaimer Copy
// (canonical — ship verbatim)" (lines 856-891).
//
// The custom ESLint rule in eslint.config.js plus
// scripts/ci/check-disclaimer-source.ts together enforce that the
// forbidden substrings ("NOT AN ELD", "FMCSA", "earns a commission") do
// not appear in any file other than this one and its test file.

export const HOS_FULL =
  'Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof of duty status. ' +
  'You are required by 49 CFR Part 395 to use a registered ELD or approved paper log if ' +
  'applicable. This app does not satisfy that requirement. Showing this app to a DOT ' +
  "officer will not stop a violation. Always cross-reference your fleet's ELD as the " +
  'official record.';

export const HOS_FOOTER = 'Personal record only. Not an ELD. Not FMCSA-compliant.';

export const PARKING =
  'Parking availability shown is provided by third parties and is not guaranteed. Always ' +
  'have a backup plan. We are not responsible for parking conditions, security, or the ' +
  'accuracy of third-party listings.';

export const FTC =
  'Trucking Life with Shawn earns a commission when you book through this link. ' +
  'Your discount is not affected.';

// Deferred to v1.5+ when HOS export ships (PRD § "Out of Scope" + line 886-891).
// Defined here so the source-of-truth set is complete, but no UI surface
// renders it at v1.
export const HOS_EXPORT_WATERMARK = 'NOT AN ELD — NOT FMCSA COMPLIANT';
