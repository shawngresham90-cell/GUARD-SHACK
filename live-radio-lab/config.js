/*
 * TLWS Live Radio Lab — environment configuration.
 *
 * tokenEndpoint: URL of the deployed Supabase Edge Function that mints
 * short-lived, room-scoped LiveKit tokens (see supabase/functions/
 * live-radio-lab-token/). The LiveKit server URL is returned BY that
 * endpoint, so this is the only value the client needs.
 *
 * null (the default) = radio intentionally offline -> the page renders
 * its fail-soft state. No secrets belong in this file, ever: the token
 * endpoint URL is public by design; the LiveKit API secret lives only
 * in the Edge Function's server-side environment.
 *
 * In CI/Netlify this file can be overwritten at deploy time from an
 * environment variable; for the spike it is edited by hand.
 */
window.TLWS_RADIO_LAB_CONFIG = {
  // Phase 0.5 spike: owner-provisioned dev environment (isolated Supabase
  // project + LiveKit free dev tier). Public URL — holds no secrets.
  tokenEndpoint: "https://sjjtivasehvqszjoueme.supabase.co/functions/v1/smooth-task"
};
