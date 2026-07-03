/**
 * PWA install-prompt primitives (Story 1.9, AC5 — FR6 iOS, FR7 Android).
 *
 * iOS Safari has no programmatic install and never fires `beforeinstallprompt`;
 * the only path is manual Add-to-Home-Screen instructions. Android Chrome fires
 * `beforeinstallprompt`, which we capture and surface as a non-intrusive banner
 * after the user's second engaged session.
 *
 * All branching is factored into pure functions (storage/navigator/window
 * injected) so it is unit-testable in jsdom. See Dev Notes → "Engaged-session
 * counter" and "iOS vs Android install reality".
 */

export const IOS_A2HS_INSTRUCTIONS =
  'To install: tap the Share button, then choose "Add to Home Screen".';

const ENGAGED_SESSIONS_KEY = 'tlws_engaged_sessions';
const ENGAGED_LAST_DAY_KEY = 'tlws_engaged_last_day';
/** FR7: banner only after the second engaged session. */
export const ANDROID_BANNER_MIN_SESSIONS = 2;

/** The Chromium-only event; not present in the standard DOM lib. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ─── Pure detection ──────────────────────────────────────────────────────────

/**
 * True for genuine iOS Safari that can Add-to-Home-Screen.
 * - Excludes Chrome/Firefox/Edge/Opera on iOS (no Share→A2HS path).
 * - Excludes in-app webviews (Facebook/Instagram/etc.) which can't A2HS.
 * - Detects iPadOS 13+ Safari, which reports a desktop Mac UA: disambiguated by
 *   `maxTouchPoints > 1` (pass `navigator.maxTouchPoints`; defaults to 0).
 */
export function isIOSSafari(userAgent: string, maxTouchPoints = 0): boolean {
  if (/crios|fxios|edgios|opios/i.test(userAgent)) return false;
  if (/fban|fbav|fbios|instagram|line\/|gsa\//i.test(userAgent)) return false;
  if (!/safari/i.test(userAgent)) return false;
  const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent);
  const isIPadOSAsMac = /macintosh/i.test(userAgent) && maxTouchPoints > 1;
  return isIOSDevice || isIPadOSAsMac;
}

/** True when already running as an installed/standalone PWA. */
export function isStandalone(win: Window): boolean {
  const nav = win.navigator as Navigator & { standalone?: boolean };
  if (nav?.standalone === true) return true;
  return win.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
}

/** Show the inline iOS A2HS instructions only on iOS Safari and not yet installed. */
export function shouldShowIOSInstructions(userAgent: string, win: Window): boolean {
  const maxTouchPoints = win.navigator?.maxTouchPoints ?? 0;
  return isIOSSafari(userAgent, maxTouchPoints) && !isStandalone(win);
}

/** Show the Android banner only once a prompt is captured AND the session gate is met. */
export function shouldShowAndroidBanner(
  engagedSessions: number,
  hasDeferredPrompt: boolean,
): boolean {
  return hasDeferredPrompt && engagedSessions >= ANDROID_BANNER_MIN_SESSIONS;
}

// ─── Engaged-session counter (storage injected) ──────────────────────────────

/** localStorage access can throw (private mode / disabled / quota); never let it crash. */
function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode / quota exceeded — best-effort, ignore */
  }
}

/** `window.localStorage` access itself can throw a SecurityError; resolve defensively. */
function resolveStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

export function getEngagedSessions(storage: Storage): number {
  const n = Math.floor(Number(safeGet(storage, ENGAGED_SESSIONS_KEY) ?? '0'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Increment the engaged-session counter at most once per calendar day.
 * Returns the resulting count. `today` is an injected day key (e.g. '2026-06-12').
 */
export function recordEngagedSession(storage: Storage, today: string): number {
  const lastDay = safeGet(storage, ENGAGED_LAST_DAY_KEY);
  let count = getEngagedSessions(storage);
  if (lastDay !== today) {
    count += 1;
    safeSet(storage, ENGAGED_SESSIONS_KEY, String(count));
    safeSet(storage, ENGAGED_LAST_DAY_KEY, today);
  }
  return count;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the inline A2HS instruction text on iOS Safari when not installed,
 * else `null`. The caller renders the string (kept out of JSX so this module
 * stays framework-free and unit-testable).
 */
export function iOSInstallInstructions(
  userAgent: string = navigator.userAgent,
  win: Window = window,
): string | null {
  return shouldShowIOSInstructions(userAgent, win) ? IOS_A2HS_INSTRUCTIONS : null;
}

export interface AndroidInstallController {
  /** True once a `beforeinstallprompt` event has been captured (Android Chrome). */
  canPrompt(): boolean;
  /** Whether the non-intrusive install banner should be shown right now. */
  shouldShowBanner(storage?: Storage): boolean;
  /** Trigger the native install prompt — must be called from a user gesture. */
  promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

/**
 * Wire up `beforeinstallprompt` capture and expose a controller for the banner.
 * Suppresses Chrome's default mini-infobar via `preventDefault()`.
 *
 * Call this once, synchronously at app startup — the `beforeinstallprompt` event
 * fires early, so the listener must be attached before it would have fired.
 */
export function androidInstallPrompt(win: Window = window): AndroidInstallController {
  let deferred: BeforeInstallPromptEvent | null = null;

  win.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
  });
  win.addEventListener('appinstalled', () => {
    deferred = null;
  });

  return {
    canPrompt: () => deferred !== null,
    shouldShowBanner: (storage?: Storage) => {
      const s = storage ?? resolveStorage(win);
      if (s === null) return false;
      return shouldShowAndroidBanner(getEngagedSessions(s), deferred !== null);
    },
    promptInstall: async () => {
      if (deferred === null) return 'unavailable';
      const event = deferred;
      deferred = null; // consume up-front to avoid a double-trigger race
      try {
        await event.prompt();
        const choice = await event.userChoice;
        return choice.outcome;
      } catch {
        return 'unavailable';
      }
    },
  };
}
