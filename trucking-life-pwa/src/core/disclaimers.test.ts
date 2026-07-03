import { describe, expect, it } from 'vitest';
import { HOS_FULL, HOS_FOOTER, PARKING, FTC, HOS_EXPORT_WATERMARK } from './disclaimers';

describe('disclaimers (canonical PRD copy — byte-for-byte)', () => {
  it('HOS_FULL matches the PRD-locked text', () => {
    expect(HOS_FULL).toBe(
      'Personal record only. Not an ELD. Not FMCSA-compliant. Not legal proof of duty status. ' +
        'You are required by 49 CFR Part 395 to use a registered ELD or approved paper log if ' +
        'applicable. This app does not satisfy that requirement. Showing this app to a DOT ' +
        "officer will not stop a violation. Always cross-reference your fleet's ELD as the " +
        'official record.',
    );
  });

  it('HOS_FOOTER matches the PRD-locked text', () => {
    expect(HOS_FOOTER).toBe('Personal record only. Not an ELD. Not FMCSA-compliant.');
  });

  it('PARKING matches the PRD-locked text', () => {
    expect(PARKING).toBe(
      'Parking availability shown is provided by third parties and is not guaranteed. Always ' +
        'have a backup plan. We are not responsible for parking conditions, security, or the ' +
        'accuracy of third-party listings.',
    );
  });

  it('FTC matches the PRD-locked text', () => {
    expect(FTC).toBe(
      'Trucking Life with Shawn earns a commission when you book through this link. ' +
        'Your discount is not affected.',
    );
  });

  it('HOS_EXPORT_WATERMARK matches the PRD-locked text (deferred to v1.5+)', () => {
    expect(HOS_EXPORT_WATERMARK).toBe('NOT AN ELD — NOT FMCSA COMPLIANT');
  });
});
