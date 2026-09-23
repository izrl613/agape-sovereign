# Agape Sovereign AI

> **Digital Identity Federated Footprint (DIFF) Intelligence Platform** — Scan, analyze, and reclaim control over your digital identity across 16 attack vectors with zero-knowledge encryption and AI-powered sovereignty.

**Live:** [sovereign.nyc](https://sovereign.nyc) | **Status:** Production | **Firebase Project:** `agape-sovereign`

---

## What is Agape Sovereign AI?

Agape Sovereign AI is a privacy-first platform for **Digital Identity Federated Footprint (DIFF)** intelligence. It empowers users to scan, analyze, and reclaim control over their digital identity across 16 identity vectors — from email breaches to biometric exposure — using AI analysis and compliance-grade encrypted reporting.

Built entirely on **Firebase free-tier infrastructure** + **Google AI services** (Gemini API), with no paid cloud dependencies.

---

## Core Features

| Feature | Description |
|---------|-------------|
| **DIFF Scanner** | 16-vector digital identity analysis (email, social, device, financial, dark web, biometric, IoT, cloud, etc.) |
| **Sovereign Score** | Lighthouse-style 0–100 privacy health metric (KNOXED / NUKED classification) |
| **Architect AI** | Conversational AI privacy assistant powered by Gemini |
| **Passkey Auth** | FIDO2 WebAuthn device-bound authentication (no passwords) |
| **Google OAuth 2.0** | Primary authentication with Apple ID federation |
| **Zero-Knowledge Encryption** | AES-256-GCM client-side encryption — your data never leaves your device unencrypted |
| **Compliance Reports** | SHA256-signed PDF reports with 2-year retention (ECRA 2026, GDPR, CCPA) |
| **Admin Portal** | Infrastructure monitoring, audit trail querying, WebAuthn logs |

---

## 16 Identity Vectors

| # | Vector | ID | Description |
|---|--------|----|-------------|
| 1 | Email Breach Scanner | V-01 | Breach detection, metadata exposure |
| 2 | Social Media Footprint | V-02 | Username reuse, profile scraping |
| 3 | Device File Scan | V-03 | Local & cloud file analysis |
| 4 | Mobile Security Layer | V-04 | Passkey enforcement, 2FA status |
| 5 | Deep Web Exposure | V-05 | Pattern-based lookup monitoring |
| 6 | Data Broker Removal | V-06 | Automated removal template generation |
| 7 | Password Vault Analysis | V-07 | Weak credential detection |
| 8 | Location Data Footprint | V-08 | GPS history & metadata exposure |
| 9 | Browser & Cookie Tracker | V-09 | Third-party tracking detection |
| 10 | Financial Identity Exposure | V-10 | Banking/payment data leaks |
| 11 | Medical Data Footprint | V-11 | Health record exposure |
| 12 | Voice & Biometric Data | V-12 | Biometric sample detection |
| 13 | IoT & Smart Device Scan | V-13 | Connected device security audit |
| 14 | Cloud Storage Exposure | V-14 | Google Drive, OneDrive, iCloud analysis |
| 15 | Dark Web Monitoring | V-15 | Dark web credential indexing |
| 16 | Behavioral Profile Analysis | V-16 | Inferred demographic mapping |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19+ | UI framework |
| Vite | 6+ | Build tool, HMR |
| TypeScript | 5+ | Type safety |
| TailwindCSS | 4+ | AEGIS dark/neon theme |
| Framer Motion | 12+ | Animations |
| React Router | 7+ | SPA routing |
| Lucide React | 0.475+ | Icons |

### Backend & Infrastructure
| Technology | Purpose |
|-----------|---------|
| Firebase Authentication | Google OAuth, Apple ID, WebAuthn passkeys |
| Cloud Firestore | Primary database (50K reads/day free tier) |
| Firebase Storage | PDF reports, user backups |
| Cloud Functions (Node.js 22) | Scan processing, background jobs, WebAuthn |
| Firebase Hosting | CDN, auto-HTTPS global delivery |
| Firebase App Check | Request attestation, abuse prevention |
| Firebase Remote Config | Feature flags, dynamic configuration |

### AI Layer
| Technology | Purpose |
|-----------|---------|
| Gemini API | Conversational AI, privacy guidance (60 RPM free) |
| Google Genkit | AI workflow orchestration (flows, prompts) |
| @google/genai | Server-side Gemini integration |

### Security
| Feature | Implementation |
|--------|---------------|
| Encryption at rest | AES-256-GCM (Firestore-level) |
| Zero-knowledge arch | User data never exposed to admin |
| Passkeys | WebAuthn device-bound (FIDO2) |
| Audit trail | Immutable Firestore audit log |
| Session management | SHA-256 sovereign hash (Gatekeeper) |

---

## Project Structure

```
agape-sovereign/
├── src/                          # Main Vite + React app
│   ├── components/               # UI components (Login, Dashboard, Landing, etc.)
│   ├── components/auth/          # Passkey components (SetupPrompt, LockOverlay, SetupFlow)
│   ├── context/                  # React contexts (Auth, Scan, Theme, UI Design)
│   ├── services/                 # Business logic (audit, remoteConfig, poaOrchestrator, sovereignHash)
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utilities (crypto, incognitoDetector, firestoreErrorHandler)
│   ├── types/                    # TypeScript types
│   ├── lib/                      # Shared libraries (ArchitectMCPClient)
│   ├── App.tsx                   # Root app component
│   ├── main.tsx                  # Entry point
│   ├── firebase.ts               # Firebase client initialization
│   ├── AuthContext.tsx           # Authentication state management
│   └── ScanContext.tsx           # DIFF scan state management
├── functions/                    # Firebase Cloud Functions (Node.js 22)
│   └── src/
│       ├── auth.ts               # WebAuthn endpoints (register-options, verify-registration, login-options, verify-login)
│       ├── index.ts              # Function exports
│       ├── architect-ai.ts       # DIFF scan processing
│       ├── policyGenerator.ts    # Policy generation
│       └── bigquery.ts           # BigQuery integration
├── architect-ai/                 # DIFF scanning engine core logic
├── architect-mcp-server/         # MCP server for Architect AI
├── local-llm-pwa/                # Offline LLM PWA (Ollama + Genkit) — separate project
├── agents/                       # Multi-agent orchestration
├── mcp_server/                   # Core MCP server
├── sovereign/                    # Sovereign identity module
├── terraform/                    # Infrastructure as code (GCP)
├── scripts/                      # Utility and setup scripts
├── docs/                         # Project documentation
├── wiki/                         # GitHub Wiki source (Home, Architecture, Architect-AI, etc.)
├── public/                       # Static assets
├── dist/                         # Production build output
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore indexes
├── storage.rules                 # Firebase Storage rules
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Root dependencies and scripts
```

---

## Quick Start

### Prerequisites

1. **Node.js 20+** — [Download](https://nodejs.org/)
2. **Firebase CLI** — `npm install -g firebase-tools`
3. **Google Cloud Project** with Firebase enabled
4. **Google OAuth credentials** configured in Firebase Console

### Installation

```bash
# Clone the repository
git clone https://github.com/izrl613/agape-sovereign.git
cd agape-sovereign

# Install root dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..

# Copy environment configuration
cp .env.example .env
# Edit .env with your Firebase config
```

### Firebase Configuration

Create `.env` with your Firebase project config:

```env
# Firebase Config (from Firebase Console > Project Settings > General > Your apps)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=sovereign.nyc
VITE_FIREBASE_PROJECT_ID=agape-sovereign
VITE_FIREBASE_STORAGE_BUCKET=agape-sovereign.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Functions secrets (set via Firebase CLI)
# firebase functions:secrets:set PASSKEY_COOKIE_SECRET
```

### Development

```bash
# Start Vite dev server (frontend)
npm run dev

# In another terminal: start Firebase emulators
firebase emulators:start

# Or start only functions emulator
firebase emulators:start --only functions,firestore,auth
```

**Frontend:** `http://localhost:5173`  
**Functions Emulator:** `http://localhost:5001`  
**Firestore Emulator:** `http://localhost:8080`  
**Auth Emulator:** `http://localhost:9099`

### Production Build & Deploy

```bash
# Build frontend
npm run build

# Build functions
npm run build:functions

# Deploy to Firebase
firebase deploy

# Deploy only specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## Available Scripts

```bash
# Root level
npm run dev              # Start Vite dev server
npm run build            # Build frontend for production
npm run build:all        # Build frontend + functions
npm run build:frontend   # Build frontend only
npm run build:functions  # Build Cloud Functions
npm run deploy           # Full Firebase deploy
npm run lint             # Lint functions
npm run typecheck        # TypeScript check (root + functions)
npm run logs             # View Cloud Functions logs
```

---

## Authentication Flow

### Google OAuth 2.0 (Primary)
1. User clicks "Sign in with Google"
2. Firebase Auth handles OAuth flow via `sovereign.nyc/__/auth/handler`
3. On success, user document created/updated in Firestore
4. **Gatekeeper** computes SHA-256 sovereign hash (session identifier)
5. User redirected to Dashboard

### Universal Passkey (WebAuthn/FIDO2)
1. After Google sign-in, `PasskeySetupPrompt` offers passkey binding
2. User registers device-bound passkey via WebAuthn
3. Credential stored in Firestore (`/users/{uid}/passkeyCredentials`)
4. Subsequent logins use passkey (no password, no Google prompt)

**Passkey Endpoints (Cloud Functions):**
- `POST /api/auth/register-options` — Get registration challenge
- `POST /api/auth/verify-registration` — Verify & store credential, return custom token
- `POST /api/auth/login-options` — Get authentication challenge
- `POST /api/auth/verify-login` — Verify assertion, return custom token

---

## Firestore Collections

| Collection | Description |
|-----------|-------------|
| `/users/{userId}` | User profiles, passkey binding status, sovereign score |
| `/diff_scans/{scanId}` | DIFF scan results, 16-vector details |
| `/diff_reports/{reportId}` | Generated PDF report metadata |
| `/audit_logs/{logId}` | Immutable security event log |

---

## Security Model

- **Zero-Knowledge Architecture**: User data encrypted client-side (AES-256-GCM) before upload
- **Admin-Blind**: Even project admins cannot decrypt user data
- **Passkey-First**: FIDO2 WebAuthn device-bound credentials (phishing-resistant)
- **Sovereign Hash**: SHA-256 identity hash computed per session (Gatekeeper) — raw UID/email never stored beyond scope
- **Immutable Audit Trail**: All security events logged to `/audit_logs`
- **Firebase App Check**: Request attestation prevents abuse

---

## Compliance

- **ECRA 2026** — European Cybersecurity Resilience Act
- **GDPR** — Data minimization, consent, right to deletion
- **CCPA** — California Privacy Rights Act

PDF reports include SHA256 fingerprint, Cloud Audit ID, and 2-year retention in Firebase Storage.

---

## Firebase Quotas (Free Tier)

| Service | Daily Limit | Estimated Capacity |
|---------|------------|-------------------|
| Firestore Reads | 50,000 | ~1,000 DIFF scans |
| Firestore Writes | 20,000 | 16 vectors × 20 scans |
| Firebase Storage | 5 GB total | ~2,500 PDF reports/month |
| Cloud Functions | 2M invocations/month | ~66K scans/month |
| Gemini API | 60 RPM, 1M TPM | ~4,000 chat sessions/day |

---

## Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `authApi` | HTTP (Hosting rewrite `/api/auth/**`) | WebAuthn registration & authentication |
| `initiateDIFFScan` | HTTP call | Start a new 16-vector scan |
| `generateDIFFReport` | Firestore write | Generate PDF after scan completion |
| `cleanupOldReports` | Scheduled (daily) | Delete reports older than 2 years |
| `healthCheck` | HTTP call | Infrastructure monitoring endpoint |

---

## Wiki Documentation

The `/wiki` directory contains comprehensive documentation:

| Page | Description |
|------|-------------|
| [Home](wiki/Home.md) | Project overview, mission, navigation |
| [Architecture](wiki/Architecture.md) | System architecture, tech stack, data flow |
| [Architect-AI](wiki/Architect-AI.md) | DIFF platform: 16 vectors, scoring, PDF reports |
| [Quick-Start](wiki/Quick-Start.md) | Get up and running in 5 minutes |
| [Deployment](wiki/Deployment.md) | Complete deployment and configuration guide |
| [Integration-Guide](wiki/Integration-Guide.md) | Developer technical reference |
| [Security](wiki/Security.md) | Zero-knowledge security model and policies |
| [Local-LLM-PWA](wiki/Local-LLM-PWA.md) | Offline AI chat component (Ollama + Genkit) |
| [Agent-System](wiki/Agent-System.md) | Multi-agent system, MCP server, orchestration |
| [Changelog](wiki/Changelog.md) | Version history and release notes |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and typecheck: `npm run lint && npm run typecheck`
5. Submit a pull request

---

## License

MIT License — Free for personal and commercial use.

---

## Acknowledgments

- **Firebase** — Backend platform (Auth, Firestore, Functions, Hosting, Storage)
- **Google Gemini API** — Conversational AI & privacy guidance
- **Google Genkit** — AI workflow orchestration
- **WebAuthn / FIDO2** — Passwordless, phishing-resistant authentication
- **Vite** — Next-generation frontend tooling
- **React** — UI framework
- **TailwindCSS** — Utility-first styling
- **Framer Motion** — Production-ready animations
- **Lucide** — Beautiful, consistent icons

---

## Mission

> **Reclaim Your Digital Sovereignty.**

Agape Sovereign AI gives individuals full visibility and control over their digital identity footprint — shifting power from data brokers and surveillance systems back to the individual through AI-assisted analysis, encrypted reporting, and actionable privacy guidance.

---

**Built with ❤️ for privacy-conscious individuals worldwide**

*Last updated: 2026-08-06 | Branch: main | Firebase Project: agape-sovereign*