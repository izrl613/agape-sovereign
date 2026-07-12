# Agape Sovereign AI — Wiki Home

Welcome to the **Agape Sovereign AI** documentation hub. This wiki covers architecture, authentication, identity modules, the Shield Platform, deployment, and OAuth verification for the PWA hosted at [sovereign.nyc](https://sovereign.nyc).

## Quick Navigation

| Page | Description |
|------|-------------|
| [Architecture](Architecture.md) | Full system architecture — React, Firebase, GCP |
| [Authentication](Authentication.md) | Google Sign-In + WebAuthn Passkey flows |
| [Identity Modules](Identity-Modules.md) | 16+ identity vector modules |
| [Shield Platform](Shield-Platform.md) | 5-pillar privacy & security stack |
| [Deployment](Deployment.md) | Firebase Hosting / GCP deployment guide |
| [OAuth Verification](OAuth-Verification.md) | Google OAuth consent screen verification status |

---

## About the App

**Agape Sovereign AI** is a privacy-first Progressive Web App (PWA) that gives individuals complete sovereignty over their digital identity. It aggregates identity signals across 16+ vectors, applies AI-powered analysis, and provides actionable remediation through the Shield Platform.

### Core Principles

- **Zero Trust** — no implicit trust for any user, device, or network ([zero-trust docs](../zero-trust.md))
- **Privacy by Design** — data minimization, anonymization, and user-controlled erasure
- **Sovereign Identity** — users own and control all identity data
- **Compliance-First** — GDPR, CCPA, SOC 2 aligned ([compliance docs](../compliance/))

### Live URLs

| Environment | URL |
|-------------|-----|
| Production | https://sovereign.nyc |
| Firebase default | https://agape-sovereign.web.app |
| Privacy Policy | https://sovereign.nyc/privacy |
| Terms of Service | https://sovereign.nyc/terms |

---

## Technology Stack

```
Frontend  : React 18 + TypeScript + Vite (PWA)
Backend   : Firebase (Auth, Firestore, Functions, Hosting)
Cloud     : Google Cloud Platform (GCP)
CI/CD     : GitHub Actions (SAST, secret scan, compliance gate, Dependabot)
Auth      : Firebase Auth (Google Sign-In) + WebAuthn Passkeys
```

---

## Related Docs

- [`docs/stage-1A1.md`](../stage-1A1.md) — Passkey setup architecture (Stage 1A-1)
- [`docs/zero-trust.md`](../zero-trust.md) — Zero Trust architecture
- [`docs/compliance/`](../compliance/) — Compliance documentation
