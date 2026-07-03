import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Registers the Workbox Service Worker (Story 1.9, AC6). `registerType:
 * 'autoUpdate'` means new SWs take over without a user prompt, so this renders
 * nothing — it exists only to invoke the registration hook at the app root.
 */
export function ServiceWorkerManager(): null {
  useRegisterSW({ immediate: true });
  return null;
}
