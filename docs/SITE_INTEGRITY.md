# Site & codebase integrity — 2026-10-27

Review of `agape-sovereign` (project **agape-sovereign**, site **sovereign.nyc**, owner **idin@agape.nyc**) after the `5e4c2bd` revert.

## What was broken

| Sector | Finding | Fix |
|---|---|---|
| CI / Hosting | No root `package.json` or lockfile. `npm ci && npm run build` on merge/PR/deploy/AppFlow died immediately (`Dependencies lock file is not found`). Live Hosting did not update. | Root proxy `package.json` + `frontend/package-lock.json`. Hosting and deploy workflows build **frontend/** on Node 22. |
| Functions runtime | `functions.engines.node` was **24**. Cloud Functions deploy rejects unsupported runtimes. | Runtime **22** (supported Gen-2). |
| `authApi` deploy | Pinned `firebase-adminsdk-fbsvc@…` service account requires `iam.serviceAccounts.actAs` the CI SA often lacks. Secret-Manager bindings already removed. | Default compute SA. Cookie key stays a plain param + legacy env fallback. |
| Passkey register | `/register-options` required a Bearer token. Login “Create a Passkey” never sent one → 401 mapped to “backend down”. | First-class register: create/reuse Auth user when no passkey exists; 409 if one does. |
| ANON bypass | Only `signInAnonymously`. If Anonymous provider is off, guest login failed. | Fallback `POST /api/auth/anon-session` + `signInWithCustomToken`. |
| CSRF | Router applied `doubleCsrfProtection` **and** the app layer, so Hosting POSTs were validated twice. | CSRF once at the app layer; router mounted at `/` and `/api/auth`. |
| CORS / previews | Production CORS allowed only four origins. PR preview `*.web.app` was blocked. | Shared `originAllowed()` for CORS + Origin guard (Hosting, firebaseapp, e2b). |
| Site branding | `frontend/index.html` title was **DAVIDIAN CORTEX**. Duplicate Vite module script (double mount). | Title **Agape Sovereign AI**. One module entry. Quality gate fails on the old title. |
| OAuth scope | `drive.file` was requested at Google login. Privacy policy says export-only. | Login is `openid`/`email`/`profile`. Drive scope is incremental at PDF save. |
| Dev proxy | Vite proxied `/api/auth` to the emulator **without** the `authApi` function id. | Rewrite to `/agape-sovereign/us-central1/authApi/api/auth…`. |

## Auth surface (all three methods hit Firebase Auth)

1. **Passkey / WebAuthn** — `/api/auth/*` (HIBP-free, any authenticator). Register from `/login` without a prior session. Custom token signed into Firebase Auth.
2. **Google** — popup, authorized domain `sovereign.nyc`.
3. **ANON** — Anonymous provider, or `authApi` custom token.

## Deploy path

- Push to `main` → **Deploy to Firebase Hosting on merge** (frontend live + `functions:authApi`) and **Deploy to Firebase** (hosting + functions).
- Firestore/Storage rules still `continue-on-error` until the CI SA has `roles/firebaserules.admin` (see `OWNER_SETUP_ZERO_COST.md`).

## Production identity

- Firebase project: `agape-sovereign`
- Hosting site: `agape-sovereign` / https://sovereign.nyc
- Auth domain: `sovereign.nyc`
- Functions region: `us-central1` (`authApi`, `architectApi`)
