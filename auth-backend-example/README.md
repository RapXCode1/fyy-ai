# Auth Backend Example

This is a minimal example showing how to exchange an OAuth `code` and redirect back to the APK using a custom scheme deep link (e.g. `fyyai://sync?session_token=...`).

NOT production-ready. Replace the pseudo-exchange with real Clerk API calls and secure server logic (validate state, use PKCE, sign tokens, one-time use storage).

Run locally:

```bash
npm install express node-fetch uuid
node index.js
```

Then configure Clerk sign-in redirect to `http://localhost:4000/auth/clerk/callback`.

Flow:
- App opens system browser to Clerk sign-in with `redirect_uri` pointing to this backend.
- Clerk redirects to `/auth/clerk/callback?code=...`.
- Backend exchanges the code, issues a one-time `session_token` and redirects to `fyyai://sync?session_token=...`.
- APK receives deep link and sets the session token into the WebView.

Mobile platform notes:
- Android: ensure the `AndroidManifest.xml` has an intent-filter for the `fyyai` scheme (this repo already includes it). We narrowed it to `fyyai://sync`.
- iOS: register the custom URL scheme `fyyai` in Info.plist under `CFBundleURLTypes`.
