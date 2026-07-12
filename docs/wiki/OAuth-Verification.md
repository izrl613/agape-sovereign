# Google OAuth Platform Verification — Agape Sovereign AI

## Current Verification Status

| Check | Status | Detail |
|-------|--------|--------|
| Homepage public (no login gate) | ✅ Pass | `/` renders `LandingPage.tsx` — no auth redirect |
| App name matches homepage | ✅ Pass | "Agape Sovereign AI" in nav, hero, and `<title>` |
| Homepage explains app purpose | ✅ Pass | `<meta name="description">` + JSON-LD `WebApplication` schema + hero text |
| Privacy Policy URL | ✅ Live | `https://sovereign.nyc/privacy` — returns 200, raw HTML, no Cloudflare JS challenge |
| Terms of Service URL | ✅ Live | `https://sovereign.nyc/terms` — returns 200, raw HTML |
| App logo | ✅ Uploaded | `https://agape-sovereign.web.app/agape-logo-oauth.png` (512×512) |
| Authorized domains | ✅ Set | `sovereign.nyc`, `agape.nyc` |
| Developer contact | ✅ Set | `idin@agape.nyc` |

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
- **Build:** `vite build` via Node v26 (nvm). Requires `PATH="/Users/.../.nvm/versions/node/v26.5.0/bin:$PATH"` prefix to avoid rolldown native binding issue on macOS.
- **Deploy command:** `npx firebase deploy --only hosting`

## Next Step
Go to [Auth → Overview](https://console.cloud.google.com/auth/overview?project=agape-sovereign) → **Publish App** → **Submit for verification** (if sensitive scopes are added) or just Publish (for openid/email/profile only).
