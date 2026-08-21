# Changelog

All notable changes to Agape Sovereign are documented here.

---

## v2.1.0 — 2026-07-12

### Added
- **PWA Web App Manifest** (`public/manifest.json`) — installable as a native app on desktop and mobile
- **GitHub Wiki** (`docs/wiki/`) — comprehensive documentation for architecture, identity vectors, Shield platform, auth, deployment, and changelog
- **README overhaul** — replaced generic scaffold README with project-specific documentation
- **CHANGELOG** — this file; version history from v1.0.0 forward

### Changed
- Wiki docs linked from repo root (`docs/wiki/Home.md`)
- Manifest references AEGIS branding (name, icons, theme color `#0D0D0D`, background `#0D0D0D`)

---

## v2.0.0 — 2026-07-12

### Added
- **16 Identity Vector modules** (V-01 through V-16) — each with dedicated route, scan engine, and Firestore collection
- **Shield Platform (V-17)** — unified 5-pillar command center at `/dashboard/shield`
- **DLP Shield** — Polymer-inspired adaptive data loss prevention (8 rules, REDACT/BLOCK/ALERT/REPLACE)
- **Identity Guard** — Unosecur-inspired human/non-human identity discovery with one-tap remediation
- **PII Anonymizer** — Nymiz-inspired AI-driven PII detection with 4 anonymization modes
- **Privacy Monitor** — PrivacyProctor-inspired real-time alert feed across APP/WEB/API surfaces
- **AI Armor** — Prisma AIRS-inspired AI security event log (INJECTION/EXFIL/MISUSE/BLOCK)
- **Services**: `dlpService.ts`, `piiService.ts`, `identityRiskService.ts`
- **Google Sign-In** button on landing page (OAuth branding compliant)
- **Passkey login** (WebAuthn Level 2) via `@simplewebauthn`
- Routes for V-08 through V-16 (`/location`, `/browser`, `/medical`, `/biometric`, `/iot`, `/darkweb`, `/behavioral`)
- Comprehensive `DiffModules.tsx` factory with uniform module API

### Changed
- Dashboard grid updated to 17 modules (V-01 to V-16 + Shield V-17)
- LandingPage now public (satisfies Google OAuth homepage branding requirement)
- App name aligned to `Agape Sovereign AI` across OAuth consent screen and homepage

### Fixed
- Route conflict at `/dashboard/ai` (was shared by BiometricModule and AI route)
- DiffModule numbering drift between Dashboard MODULE_CONFIG and exports
- TypeScript ModuleProps interface extended with optional `pillar` and `techniques` fields

---

## v1.0.0 — 2026-04-20

### Added
- Initial PWA scaffolding (React 19, Vite, Firebase)
- Basic dashboard with email/social/device modules
- Google OAuth authentication
- AEGIS dark theme (Obsidian/Magenta/Blue/Orange)
- Architect AI integration
- Firebase Hosting deployment at sovereign.nyc
