# Google OAuth Platform Verification — Agape Sovereign AI

## Current Verification Status

| Check | Status | Detail |
|---|---|---|
| Homepage public (no login gate) | ✅ Pass | `/` renders `LandingPage.tsx` — no auth redirect |
| App name matches homepage | ✅ Pass | "Agape Sovereign AI" in nav, hero, and `<title>` |
| Homepage explains app purpose | ✅ Pass | `<meta name="description">` + JSON-LD `WebApplication` schema + hero text |
| Privacy Policy URL | ✅ Live | `https://sovereign.nyc/privacy` — returns 200 |
| Terms of Service URL | ✅ Live | `https://sovereign.nyc/terms` — returns 200 |
| Contact URL | ✅ Live | `https://sovereign.nyc/contact` — links in nav & footer |
| DPO/Support emails | ✅ Present | `dpo@agape.nyc`, `security@sovereign.nyc`, `legal@agape.nyc` in footer |
| App logo | ✅ Uploaded | `https://agape-sovereign.web.app/agape-logo-oauth.png` (512×512) |
| Authorized domains | ✅ Set | `sovereign.nyc`, `agape.nyc`, `agape-sovereign.web.app` |
| Developer contact | ✅ Set | `idin@agape.nyc` |
| OAuth scopes | ✅ Non-sensitive | `openid`, `email`, `profile` only → no security assessment required |

## Authentication Flow

```
[LandingPage] ── Google Sign-In ──> [Firebase OAuth Redirect]
                                         |
                                    [getRedirectResult]
                                         |
                                    [onAuthStateChanged]
                                         |
                                    [Create/Update Firestore user doc]
                                         |
                                    [setupComplete?]
                                      /         \
                                    NO           YES
                                      |             |
                              [SplashEntry]    [/dashboard]
                              (17-step DIFF    (Identity Command
                               onboarding)       Center)
                                      |
                              [Save encrypted data]
                              [Mark setupComplete = true]
                                      |
                                [/dashboard]
```

## Passkey / WebAuthn Flow

```
[/login] ── Email + Passkey ──> [Cloud Function: /api/auth/login-options]
                                         |
                              [WebAuthn assertion via browser]
                                         |
                              [Cloud Function: /api/auth/verify-login]
                                         |
                              [signInWithCustomToken(auth, token)]
                                         |
                              [onAuthStateChanged ──> /dashboard]
```

## Prior Rejection Flags (All Resolved)

### 1. "Homepage is behind a login page"
**Fix:** Routing restructured so `/` is always public `LandingPage.tsx`. All protected routes live under `/dashboard/*` via `ProtectedRoute`.

### 2. "Homepage does not explain the purpose of your app"
**Fix:** Added to `index.html` (served at `/`):
- `<meta name="description">` — full app description readable without JS
- Open Graph `og:title` and `og:description`
- JSON-LD `WebApplication` structured data

### 3. "App name does not match homepage"
**Fix:** `<title>Agape Sovereign AI — Digital Identity Protection Platform</title>` and nav/hero text both show "Agape Sovereign AI" — matches OAuth consent screen app name exactly.

## Automated OAuth Compliance Checking

The `validate-repo-health.mjs` script now includes a 9-point OAuth compliance check:
- Privacy Policy link in nav
- Terms of Service link in nav
- Privacy Policy link in footer
- Terms of Service link in footer
- Contact link in nav
- Contact link in footer (bottom bar)
- DPO/security/legal support emails
- JSON-LD structured data in `index.html`
- Static pre-render Privacy/Terms links in `index.html`

The weekly `compliance-agent.yml` workflow runs these checks and auto-creates GitHub Issues on failure.

## GCP Project
- **Project ID:** `agape-sovereign`
- **OAuth Consent Screen:** [Auth → Branding](https://console.cloud.google.com/auth/branding?project=agape-sovereign)
- **Firebase Config:** `src/firebase.ts`
- **Auth Domains:** `sovereign.nyc`, `agape-sovereign.web.app`

## Scopes in Use
Only non-sensitive scopes are used:
- `openid`
- `email`
- `profile`

→ No third-party security assessment required. Standard verification pathway.

## Deployment
- **Hosting:** Firebase Hosting → `sovereign.nyc` (custom domain via Cloudflare)
- **Functions:** `authApi` deployed via `firebase deploy --only functions` — provides `/api/auth/*` WebAuthn endpoints
- **Build:** `vite build` via Node v20+

## Next Step
Go to [Auth → Overview](https://console.cloud.google.com/auth/overview?project=agape-sovereign) → **Publish App** → **Submit for verification** (if sensitive scopes are added) or just Publish (for openid/email/profile only).
