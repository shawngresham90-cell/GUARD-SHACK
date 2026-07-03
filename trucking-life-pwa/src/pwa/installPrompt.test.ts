import { beforeEach, describe, expect, it } from 'vitest';
import {
  ANDROID_BANNER_MIN_SESSIONS,
  IOS_A2HS_INSTRUCTIONS,
  getEngagedSessions,
  iOSInstallInstructions,
  isIOSSafari,
  isStandalone,
  recordEngagedSession,
  shouldShowAndroidBanner,
  shouldShowIOSInstructions,
} from './installPrompt';

const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1';
const IOS_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
// iPadOS 13+ Safari masquerades as desktop Mac (no ipad token).
const IPADOS_SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15';
// iOS in-app webview (Facebook) — looks Safari-ish but cannot Add-to-Home-Screen.
const IOS_FB_WEBVIEW_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]';

/** Minimal Window stub for detection functions. */
function fakeWin(opts: {
  standalone?: boolean;
  displayModeStandalone?: boolean;
  maxTouchPoints?: number;
}): Window {
  return {
    navigator: {
      standalone: opts.standalone,
      maxTouchPoints: opts.maxTouchPoints ?? 0,
    } as unknown as Navigator,
    matchMedia: (query: string) =>
      ({ matches: query.includes('standalone') && !!opts.displayModeStandalone }) as MediaQueryList,
  } as unknown as Window;
}

describe('isIOSSafari', () => {
  it('is true for iOS Safari', () => {
    expect(isIOSSafari(IOS_SAFARI_UA)).toBe(true);
  });
  it('is false for Chrome on iOS (CriOS)', () => {
    expect(isIOSSafari(IOS_CHROME_UA)).toBe(false);
  });
  it('is false for Android Chrome', () => {
    expect(isIOSSafari(ANDROID_CHROME_UA)).toBe(false);
  });
  it('detects iPadOS Safari (Mac UA) only when touch points indicate a tablet', () => {
    expect(isIOSSafari(IPADOS_SAFARI_UA, 5)).toBe(true);
    expect(isIOSSafari(IPADOS_SAFARI_UA, 0)).toBe(false); // genuine desktop Mac
  });
  it('is false for an iOS in-app webview (Facebook)', () => {
    expect(isIOSSafari(IOS_FB_WEBVIEW_UA)).toBe(false);
  });
});

describe('isStandalone', () => {
  it('detects navigator.standalone (iOS)', () => {
    expect(isStandalone(fakeWin({ standalone: true }))).toBe(true);
  });
  it('detects display-mode: standalone', () => {
    expect(isStandalone(fakeWin({ displayModeStandalone: true }))).toBe(true);
  });
  it('is false in a normal browser tab', () => {
    expect(isStandalone(fakeWin({}))).toBe(false);
  });
});

describe('shouldShowIOSInstructions (FR6)', () => {
  it('shows on iOS Safari when not installed', () => {
    expect(shouldShowIOSInstructions(IOS_SAFARI_UA, fakeWin({}))).toBe(true);
  });
  it('hides when already installed (standalone)', () => {
    expect(shouldShowIOSInstructions(IOS_SAFARI_UA, fakeWin({ standalone: true }))).toBe(false);
  });
  it('hides on Android', () => {
    expect(shouldShowIOSInstructions(ANDROID_CHROME_UA, fakeWin({}))).toBe(false);
  });
  it('shows on iPadOS Safari (Mac UA + touch points) when not installed', () => {
    expect(shouldShowIOSInstructions(IPADOS_SAFARI_UA, fakeWin({ maxTouchPoints: 5 }))).toBe(true);
  });
});

describe('iOSInstallInstructions', () => {
  it('returns the instruction text on iOS Safari, null otherwise', () => {
    expect(iOSInstallInstructions(IOS_SAFARI_UA, fakeWin({}))).toBe(IOS_A2HS_INSTRUCTIONS);
    expect(iOSInstallInstructions(ANDROID_CHROME_UA, fakeWin({}))).toBeNull();
  });
});

describe('shouldShowAndroidBanner (FR7 — second engaged session)', () => {
  it('hidden below the session threshold', () => {
    expect(shouldShowAndroidBanner(ANDROID_BANNER_MIN_SESSIONS - 1, true)).toBe(false);
  });
  it('shown at/above the threshold when a prompt was captured', () => {
    expect(shouldShowAndroidBanner(ANDROID_BANNER_MIN_SESSIONS, true)).toBe(true);
  });
  it('hidden without a captured prompt even past the threshold', () => {
    expect(shouldShowAndroidBanner(ANDROID_BANNER_MIN_SESSIONS + 5, false)).toBe(false);
  });
});

describe('engaged-session counter', () => {
  let store: Record<string, string>;
  let storage: Storage;
  beforeEach(() => {
    store = {};
    storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    } as unknown as Storage;
  });

  it('increments once per new day', () => {
    expect(recordEngagedSession(storage, '2026-06-12')).toBe(1);
    expect(recordEngagedSession(storage, '2026-06-13')).toBe(2);
    expect(getEngagedSessions(storage)).toBe(2);
  });

  it('does not double-count within the same day', () => {
    expect(recordEngagedSession(storage, '2026-06-12')).toBe(1);
    expect(recordEngagedSession(storage, '2026-06-12')).toBe(1);
    expect(getEngagedSessions(storage)).toBe(1);
  });

  it('reaches the banner threshold after two distinct days', () => {
    recordEngagedSession(storage, '2026-06-12');
    recordEngagedSession(storage, '2026-06-13');
    expect(shouldShowAndroidBanner(getEngagedSessions(storage), true)).toBe(true);
  });

  it('coerces corrupt or negative counter values to 0', () => {
    for (const bad of ['NaN', 'abc', '-5', '']) {
      const local = {
        getItem: () => bad,
        setItem: () => {},
      } as unknown as Storage;
      expect(getEngagedSessions(local)).toBe(0);
    }
  });

  it('floors a fractional stored value to a whole count', () => {
    const local = {
      getItem: () => '2.9',
      setItem: () => {},
    } as unknown as Storage;
    expect(getEngagedSessions(local)).toBe(2);
  });

  it('never throws when storage access throws (private mode / quota)', () => {
    const throwingStorage = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    } as unknown as Storage;
    expect(() => getEngagedSessions(throwingStorage)).not.toThrow();
    expect(getEngagedSessions(throwingStorage)).toBe(0);
    expect(() => recordEngagedSession(throwingStorage, '2026-06-12')).not.toThrow();
  });
});
