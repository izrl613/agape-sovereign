# Architecture

← [Home](Home.md)

## Overview

Agape Sovereign AI is a **Progressive Web App (PWA)** built on a serverless, event-driven architecture. All compute runs on Google Cloud Platform with Firebase as the primary managed service layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                        sovereign.nyc                            │
│                    (Firebase Hosting CDN)                       │
├─────────────────────────────────────────────────────────────────┤
│                   React 18 SPA / PWA                            │
│          TypeScript · Vite · Service Worker                     │
├───────────────────┬─────────────────────────────────────────────┤
│  Firebase Auth    │  Firestore (NoSQL)  │  Cloud Functions       │
│  Google Sign-In   │  Identity Vectors   │  Passkey / FIDO2       │
│  WebAuthn Passkey │  Shield Events      │  AI Analysis Jobs      │
├───────────────────┴─────────────────────────────────────────────┤
│                  Google Cloud Platform (GCP)                    │
│          Cloud Run · Secret Manager · Cloud Logging             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend

### Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 with Concurrent Features |
| Language | TypeScript (strict mode) |
| Build tool | Vite + `vite-plugin-pwa` |
| State | React Context + custom hooks |
| Routing | React Router v6 |
| Styling | CSS Modules / Tailwind |
| Service Worker | Workbox (precache + runtime caching) |

### PWA Capabilities

- Installable on iOS, Android, and desktop via Web App Manifest
- Offline-capable identity dashboard with cached Firestore reads
- Push notifications for high-severity identity alerts
- Background sync for Shield remediation queues

---

## Backend — Firebase

### Firebase Auth

Handles all authentication. Two primary providers:
1. **Google Sign-In** (OAuth 2.0 / OIDC) — primary social sign-in
2. **WebAuthn Passkeys** — phishing-resistant FIDO2 credentials via Cloud Functions

See [Authentication](Authentication.md) for detailed flows.

### Firestore

```
/users/{uid}/
  profile          — display name, email, avatar, created_at
  identity_vectors — aggregated scores per module (see Identity Modules)
  shield_events    — remediation history
  passkeys         — stored credential IDs (no private key material)

/system/
  config           — feature flags, Shield pillar toggles
```

Security Rules enforce that `uid` in the path must match `request.auth.uid`.

### Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|----------|
| `registerPasskey` | HTTPS | FIDO2 registration ceremony |
| `authenticatePasskey` | HTTPS | FIDO2 authentication ceremony |
| `analyzeIdentityVector` | Firestore write | AI scoring for a given vector |
| `runShieldRemediation` | Pub/Sub | Trigger Shield pillar actions |
| `exportUserData` | HTTPS | GDPR data export |
| `deleteUserData` | HTTPS | GDPR / CCPA erasure |

---

## CI/CD Pipeline

All changes go through GitHub Actions before reaching `main`.

```yaml
# .github/workflows/ci.yml (abbreviated)
jobs:
  sast:         # Semgrep / CodeQL static analysis
  secret-scan:  # TruffleHog / Gitleaks
  compliance:   # Custom compliance gate (docs/compliance/)
  build-test:   # npm ci && npm test && npm run build
  deploy:       # firebase deploy --only hosting (on main only)
```

- **Dependabot** keeps npm and GitHub Actions dependencies updated weekly
- **Branch protection** requires all checks to pass before merge
- **SAST** blocks merges on high/critical findings

---

## Zero Trust Architecture

The platform follows a Zero Trust model documented in [`docs/zero-trust.md`](../zero-trust.md):

- Every API call carries a Firebase ID token (JWT), verified server-side
- Cloud Functions validate token claims on every invocation — no session cookies
- Firestore Security Rules are the last line of defense; Cloud Functions are not trusted proxies
- Secrets (API keys, service account keys) live in GCP Secret Manager, not in code or environment variables committed to git

---

## Related Pages

- [Authentication](Authentication.md)
- [Identity Modules](Identity-Modules.md)
- [Shield Platform](Shield-Platform.md)
- [Deployment](Deployment.md)
