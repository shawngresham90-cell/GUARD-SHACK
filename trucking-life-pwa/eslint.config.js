import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

// FR61 / NFR-C5 — forbidden substrings outside the canonical source-of-truth.
// Both Literal (string and template-literal segments) and JSXText (text between
// JSX tags) are scanned. Case-insensitive on "not an ELD" because the PRD uses
// both the all-caps watermark form and the sentence-case conversational form.
const DISCLAIMER_INTEGRITY_RULES = {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'Literal[value=/not an ELD/i]',
      message:
        'Canonical HOS disclaimer text is forbidden outside src/core/disclaimers.ts. ' +
        'Import HOS_FULL / HOS_FOOTER and render via <Disclaimer kind="hosFull|hosFooter">.',
    },
    {
      selector: 'Literal[value=/FMCSA/]',
      message:
        'Canonical disclaimer keyword "FMCSA" is forbidden outside src/core/disclaimers.ts. ' +
        'Reference disclaimer constants by name and render via <Disclaimer>.',
    },
    {
      selector: 'Literal[value=/earns a commission/]',
      message:
        'Canonical FTC disclosure text is forbidden outside src/core/disclaimers.ts. ' +
        'Import FTC and render via <Disclaimer kind="ftc"> (or its <AffiliateCTA> wrapper).',
    },
    {
      selector: 'JSXText[value=/not an ELD/i]',
      message:
        'Canonical HOS disclaimer text is forbidden in JSX text outside src/core/disclaimers.ts.',
    },
    {
      selector: 'JSXText[value=/FMCSA/]',
      message:
        'Canonical disclaimer keyword "FMCSA" is forbidden in JSX text outside src/core/disclaimers.ts.',
    },
    {
      selector: 'JSXText[value=/earns a commission/]',
      message:
        'Canonical FTC disclosure text is forbidden in JSX text outside src/core/disclaimers.ts.',
    },
  ],
};

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '_bmad', '_bmad-output']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: DISCLAIMER_INTEGRITY_RULES,
  },
  // Files that legally contain the forbidden substrings:
  //   - src/core/disclaimers.ts          — SOURCE OF TRUTH
  //   - src/core/disclaimers.test.ts     — byte-equality assertions
  //   - scripts/ci/check-disclaimer-source.ts — out-of-band scanner whose
  //     rule labels self-reference the substrings to identify violations
  {
    files: [
      'src/core/disclaimers.ts',
      'src/core/disclaimers.test.ts',
      'scripts/ci/check-disclaimer-source.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  eslintConfigPrettier,
]);
