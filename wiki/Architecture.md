# Architecture

## System Overview

agape.sovereign is a full-stack Firebase + Next.js application with a multi-agent backend and local LLM capability.

```
┌─────────────────────────────────────────────────────┐
│                  agape.sovereign                     │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────────────────┐  │
│  │ Firebase Auth│────▶│  Next.js 15 + React 19   │  │
│  │ OAuth/Passkey│     │  TypeScript + TailwindCSS │  │
│  └──────────────┘     └────────────┬─────────────┘  │
│                                    │                 │
│  ┌─────────────────────────────────▼─────────────┐  │
│  │         Firebase Hosting (CDN + HTTPS)         │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────┐   ┌───────────────────────┐  │
│  │ Cloud Firestore  │◀──│  Cloud Functions       │  │
│  │ (NoSQL database) │   │  (Node.js 20 runtime)  │  │
│  └──────────────────┘   └───────────────────────┘  │
│                                                      │
│  ┌──────────────┐   ┌─────────────────────────────┐ │
│  │ Firebase     │   │  Gemini API + Ollama LLM    │ │
│  │ Storage      │   │  (Google Genkit workflows)  │ │
│  └──────────────┘   └─────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
agape-sovereign/
├── src/                     # Main Next.js app source
├── architect-ai/            # DIFF scanning engine
├── architect-mcp-server/    # MCP server for Architect AI
├── local-llm-pwa/           # Offline LLM PWA (Ollama + Genkit)
│   ├── frontend/            #   React + Vite frontend
│   ├── backend/             #   Node.js + Genkit server
│   └── vscode-extension/    #   VS Code integration
├── agents/                  # Multi-agent orchestration
├── mcp_server/              # Core MCP server
├── sovereign/               # Sovereign identity module
├── functions/               # Firebase Cloud Functions
├── lib/                     # Shared libraries (Firebase init)
├── scripts/                 # Utility and setup scripts
├── terraform/               # Infrastructure as code (GCP)
├── docs/                    # Project documentation
├── tests/                   # Test suites
└── .agents/skills/          # AI agent skills (Genkit, Firebase)
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15+ | App Router, SSR/SSG, Firebase Hosting |
| React | 19+ | UI framework |
| TypeScript | 5+ | Type safety |
| TailwindCSS | 3+ | Styling (AEGIS dark/neon theme) |
| WebAuthn API | — | Device-bound passkeys (FIDO2) |

### Backend & Infrastructure
| Technology | Purpose |
|-----------|---------|
| Firebase Authentication | Google OAuth, Apple ID, WebAuthn |
| Cloud Firestore | Primary database (50K reads/day free tier) |
| Firebase Storage | PDF reports, user backups |
| Cloud Functions (Node.js 20) | Scan processing, background jobs |
| Firebase Hosting | CDN, auto-HTTPS global delivery |
| Firebase App Check | Request attestation, abuse prevention |
| Cloud Build | CI/CD pipeline (`cloudbuild.yaml`) |
| Terraform | GCP infrastructure provisioning |

### AI Layer
| Technology | Purpose |
|-----------|---------|
| Gemini API | Conversational AI, privacy guidance (60 RPM free) |
| Google Genkit | AI workflow orchestration (flows, prompts) |
| Ollama | Local LLM runtime for offline mode |
| MCP (Model Context Protocol) | Agent tool interface standard |

### Security
| Feature | Implementation |
|--------|---------------|
| Encryption at rest | AES-256-GCM (Firestore-level) |
| Zero-knowledge arch | User data never exposed to admin |
| Passkeys | WebAuthn device-bound (FIDO2) |
| Audit trail | Immutable Firestore audit log |

---

## Data Flow

```
User Auth (OAuth/Passkey)
        │
        ▼
   DIFF Scan Init
        │
        ▼
Cloud Functions
(16 vector scans)
        │
        ▼
Firestore (encrypted)
        │
        ▼
  Gemini AI Analysis
        │
        ▼
  PDF Report (SHA256)
        │
        ▼
Firebase Storage (2yr)
```

---

## Firebase Collections

| Collection | Description |
|-----------|-------------|
| `/users/{userId}` | User profiles, passkey binding status |
| `/diff_scans/{scanId}` | DIFF scan results, 16-vector details |
| `/diff_reports/{reportId}` | Generated PDF report metadata |
| `/audit_logs/{logId}` | Immutable security event log |

---

## Compliance

- **ECRA 2026** — European Cybersecurity Resilience Act
- **GDPR** — Data minimization, consent, right to deletion
- **CCPA** — California Privacy Rights Act

---

*See [[Architect-AI]] for DIFF scanning details, [[Deployment]] for setup, [[Agent-System]] for multi-agent docs.*
