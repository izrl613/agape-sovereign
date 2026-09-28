# Agape Sovereign PWA

A privacy-first, self-sovereign identity platform with dual authentication (Passkey WebAuthn + Google Sign-in).

## Architecture Overview

- **Dual Authentication Layer**: Passkey WebAuthn + Google OAuth
- **16 Identity Vector Modules (IVM)** with gate agents
- **Offline LLM Integration**: Gemma 4:12B for local inference
- **Encrypted Data Storage**: SHA256ID encryption with 26-month retention
- **KNOX/NUKE Export Options**: PDF or Google Account sync

## Tech Stack

- **Frontend**: React, TypeScript, WebAuthn API
- **Backend**: Node.js/Express or Next.js API routes
- **Authentication**: WebAuthn (FIDO2) + Google OAuth
- **Database**: Firebase Firestore / GCP Cloud SQL
- **LLM**: Gemma 4:12B (local via Ollama)
- **Hosting**: sovereign.nyc / Firebase / GCP App Hosting

## Project Structure

```
agape-sovereign/
├── client/          # React frontend
├── server/          # API backend
├── docs/            # Documentation
├── scripts/         # Utility scripts
└── firebase/        # Firebase configuration
```

## Getting Started

1. Clone and install dependencies
2. Configure Firebase credentials
3. Set up Google OAuth credentials
4. Initialize WebAuthn providers
5. Run development server

See `docs/` for detailed setup guides.
