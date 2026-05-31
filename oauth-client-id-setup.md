# OAuth Client ID Setup Guide

How to take a third‑party service (Chaterimo is used as the worked example) and
connect it to Google using a **Google OAuth 2.0 Client ID**. The same steps work
for any app in this repo that needs "Sign in with Google" or access to a Google
API (Gmail, Calendar, etc.).

> **Never commit secrets.** The Client ID is public-ish, but the **Client
> Secret** must stay out of git. Store it in an environment variable or a
> secrets manager, not in any file you push.

---

## 1. What you're creating

| Term | What it is | Safe to share? |
| --- | --- | --- |
| **Client ID** | Public identifier for your app, e.g. `1234-abc.apps.googleusercontent.com` | Yes (it appears in browser requests) |
| **Client Secret** | Password proving the request comes from your backend | **No — keep secret** |
| **Redirect URI** | The URL Google sends the user back to after login | Yes |
| **Scopes** | The permissions you ask for (email, profile, gmail.send, …) | Yes |

---

## 2. Create the Client ID in Google Cloud

1. Go to <https://console.cloud.google.com/> and create (or pick) a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** (unless you have a Google Workspace org).
   - Fill app name, support email, and developer email.
   - Add the scopes you need (start with `openid`, `email`, `profile`).
   - Add yourself as a **Test user** while the app is unverified.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - **Application type:**
     - *Web application* — for a server/backend or a hosted page.
     - *Desktop / TV & limited input* — for non-browser flows.
   - **Authorized JavaScript origins:** the origin your page is served from,
     e.g. `https://yourname.github.io` (no path, no trailing slash).
   - **Authorized redirect URIs:** where Google returns the user, e.g.
     `https://yourname.github.io/oauth-callback` or `http://localhost:5173/callback`
     for local dev.
4. Click **Create** and copy the **Client ID** (and the **Client Secret** if a
   Web application).

---

## 3. Map a service (e.g. Chaterimo) onto it

A service integration usually asks you for **one of two things**:

### Case A — the service wants *your* OAuth Client ID
Paste the **Client ID** (and **Client Secret**, if requested) from step 2 into
the service's integration settings. Then add the **redirect URI the service
gives you** back into Google Cloud → Credentials → your client → *Authorized
redirect URIs*. The redirect URI on both sides must match **exactly**.

For Chaterimo specifically, the integration screen typically asks for:
- **OAuth Client ID** → paste the value from step 2.
- **OAuth Client Secret** → paste from step 2 (store it server-side only).
- **Redirect / Callback URL** → copy what Chaterimo shows you and add it to the
  Authorized redirect URIs list in Google Cloud.

### Case B — the service already has its own Google app
Then you don't create a Client ID at all; you just click "Connect Google" inside
the service and approve the scopes. Use this guide only when the service asks you
to *bring your own* credentials (Case A).

---

## 4. Using the Client ID in a static page (no backend)

For the simple browser apps in this repo, the easiest path is **Google Identity
Services** (sign-in / ID token only — no client secret needed):

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>

<div id="g_id_onload"
     data-client_id="YOUR_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleCredential"></div>
<div class="g_id_signin" data-type="standard"></div>

<script>
  function handleCredential(response) {
    // response.credential is a JWT ID token. Verify it server-side before trust.
    console.log("Got ID token:", response.credential);
  }
</script>
```

This gives you the signed-in user's identity. It does **not** grant API access
(Gmail, Calendar). For those you need the token/code flow and a backend that
holds the Client Secret.

---

## 5. Config template (do not put real secrets here)

Keep real values in environment variables. Example `.env` (git-ignored):

```bash
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=keep-this-out-of-git
GOOGLE_OAUTH_REDIRECT_URI=https://yourname.github.io/oauth-callback
```

Add `.env` to `.gitignore` so it's never committed.

---

## 6. Common errors

| Error | Fix |
| --- | --- |
| `redirect_uri_mismatch` | The redirect URI in the request isn't in the Authorized list, or differs by scheme/slash. Make them identical. |
| `Access blocked: app not verified` | Add your account as a **Test user**, or submit the app for verification. |
| `invalid_client` | Wrong Client ID/Secret, or you used a Desktop client's secret in a Web flow. |
| `origin_mismatch` | Add your exact page origin to **Authorized JavaScript origins**. |
| Works locally, fails in prod | You only registered `localhost`. Add the production origin + redirect URI too. |

---

## 7. Checklist

- [ ] Project + OAuth consent screen configured
- [ ] Client ID created with correct application type
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added (match the service exactly)
- [ ] Client ID pasted into the service (e.g. Chaterimo)
- [ ] Client Secret stored in env/secrets manager, **not** in git
- [ ] Sign-in tested end to end
