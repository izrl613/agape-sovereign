# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, TypeScript, Vite |
| Styling | TailwindCSS v4, Framer Motion |
| Backend | Express 5.2, Node 20, ESM |
| Database | Firebase Firestore (client + admin SDK) |
| Auth | Firebase Auth, Google OAuth 2.0, WebAuthn / Passkey |
| AI | Google GenAI (Gemini), BigQuery ML |
| PDF Export | jsPDF + jsPDF AutoTable |
| Hosting | Firebase Hosting (sovereign.nyc) |

## Project Layout

```
agape-sovereign/
├── src/
│   ├── components/          # All UI components
│   │   ├── App.tsx          # Root router with all 30+ routes
│   │   ├── Dashboard.tsx    # 17-module grid with neon cards
│   │   ├── DiffModules.tsx  # Factory exporting all 16 vector modules
│   │   ├── ShieldModule.tsx # 5-pillar unified Shield dashboard
│   │   ├── LandingPage.tsx  # Public homepage (OAuth branding-compliant)
│   │   ├── Login.tsx        # Google OAuth + Passkey login
│   │   └── auth/            # Auth context, PasskeySetupPrompt
│   ├── services/
│   │   ├── dlpService.ts    # Polymer-inspired DLP engine
│   │   ├── piiService.ts    # Nymiz-inspired PII anonymizer
│   │   ├── identityRiskService.ts  # Unosecur-inspired identity risk
│   │   ├── scanService.ts   # Orchestrates cross-module scans
│   │   ├── localAIService.ts # Local Gemini AI processing
│   │   └── pdfService.ts    # PDF report generation
│   └── ...
├── server.ts                # Express 5 API server
├── package.json
└── vite.config.ts
```

## Data Flow

```
User → LandingPage → Login (OAuth/Passkey)
  → Dashboard (17 module grid)
  → Module Route (e.g. /dashboard/email)
    → DiffModule component
    → scanService → Firebase Firestore
    → pdfService (export report)
  → ShieldModule (V-17 unified 5-pillar view)
```

## Route Map

| Path | Component | Vector |
|---|---|---|
| `/` | LandingPage | Public |
| `/login` | Login | Public |
| `/dashboard` | Dashboard | Hub |
| `/dashboard/email` | EmailModule | V-01 |
| `/dashboard/social` | SocialModule | V-02 |
| `/dashboard/device` | DeviceModule | V-03 |
| `/dashboard/system` | SystemModule | V-04 |
| `/dashboard/deepweb` | DeepWebModule | V-05 |
| `/dashboard/databroker` | DataBrokerModule | V-06 |
| `/dashboard/password` | PasswordModule | V-07 |
| `/dashboard/location` | LocationModule | V-08 |
| `/dashboard/browser` | BrowserTrackerModule | V-09 |
| `/dashboard/medical` | MedicalModule | V-10 |
| `/dashboard/biometric` | BiometricModule | V-11 |
| `/dashboard/iot` | IoTModule | V-12 |
| `/dashboard/cloud` | CloudModule | V-13 |
| `/dashboard/darkweb` | DarkWebModule | V-14 |
| `/dashboard/behavioral` | BehavioralModule | V-15 |
| `/dashboard/erasure` | ErasureModule | V-16 |
| `/dashboard/shield` | ShieldModule | V-17 |
| `/dashboard/architect` | ArchitectAI | AI |
| `/dashboard/settings` | UserProfileSettings | — |
| `/dashboard/admin` | AdminPortal | Admin |
