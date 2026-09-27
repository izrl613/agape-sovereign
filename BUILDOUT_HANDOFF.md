# Agape Sovereign AI — Auth & PWA Buildout Handoff

## Completed in this sandbox

- Firebase Hosting now serves the Vite production bundle from `dist/`.
- Added Hosting routing for `/api/auth/**` to the `authApi` Cloud Function, region `us-central1`.
- Exported `authApi` from `functions/src/index.ts` so Firebase can deploy the HTTP handler.
- Bound WebAuthn credential reads/writes to the configured Firestore database `agape-sovereign`.
- Removed the fake Anonymous Auth fallback from passkey sign-in. If a challenge or WebAuthn verification fails, sign-in now fails closed with an error.
- Passkey sign-in asks for the account email so the server can return that account's allowed credentials. It does not treat an arbitrary browser passkey prompt as a valid login.
- Passkey registration uses required user verification and discoverable credentials; the setup prompt is click-to-start to satisfy browser user-gesture requirements.
- Google sign-in remains Firebase Auth OAuth with passkey enrollment offered after sign-in.
- Demo findings appear only in development builds, not production.
- Bumped the service-worker cache version and removed a missing offline asset from precache.
- **2026-09-27 runtime fix:** Added the missing `useScan` import in `src/ArchitectUI.tsx`.
- **2026-09-27 route/cache fix:** Public `/` now renders the Agape landing page; `/login` is the unified sign-in; `/architect` explicitly opens ArchitectUI behind auth. Architect is no longer a saved-default root app. Removed stale service-worker auto-registration so legacy cached JS cannot mask releases.

## Verification run

- `npm run build:frontend` — passed.
- `npm run typecheck` — passed.
- `npm run build --prefix functions` — passed.
- `npm run test --prefix functions` — 11 tests passed.
- `git diff --check` — passed.
- Vite reports a large JavaScript chunk (>500 kB); production code-splitting remains follow-up work.

## Before production deploy

1. Confirm the Firebase project currently has Hosting attached to the intended site/custom domain and confirm `sovereign.nyc` is serving this repository's app.
2. Confirm `authApi` deploys successfully with its `PASSKEY_COOKIE_SECRET`/`COOKIE_SECRET` secrets available, its service account can access Firestore database `agape-sovereign`, and the configured database ID/location exists.
3. In Firebase Authentication, verify Google is enabled and `sovereign.nyc` is an authorized domain. Confirm the Google OAuth consent screen is approved as needed.
4. Test on the actual production origin: register passkey after Google sign-in, sign out, sign in with email + passkey, wrong email, cancelled biometric prompt, and an unsupported browser. Do not claim deployed/working until the real ceremony succeeds.
5. Confirm the PWA service worker is only caching static assets and app shell, not auth/API responses or sensitive identity findings.
6. Resolve documented disagreement about report storage and retention (local 26 months vs. Firebase two years) before publishing privacy/retention promises or enabling Drive scopes.
7. Do not deploy until Firebase App Check placeholder config, Firestore/Storage rules, quotas/budget guards, and provider settings have been independently checked.

## Scope note

This is an auth/deployment-wiring foundation, not a complete 16-vector scanning implementation. Never present seeded findings or simulated module data as a real user assessment. Do not promise that SHA-256 is encryption or that a SHA-256 value anonymizes personal data.
