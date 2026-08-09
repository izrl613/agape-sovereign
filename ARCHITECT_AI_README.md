# Architect AI — Agape Sovereign Enclave 2026

## Digital Identity Federated Footprint (DIFF) Intelligence Platform

A **zero-knowledge, security-first web application** for real-time digital identity analysis and privacy control. Built on 100% **Firebase free-tier infrastructure** + Google AI services.

### 🎯 Core Purpose

Architect AI empowers users to:
- **Scan & Analyze** their complete digital footprint across 16 identity vectors
- **Classify Exposures** as **NUKED** (dangerous) or **KNOXED** (secured)
- **Generate Audit Reports** with SHA256 encryption and Lighthouse-style scoring
- **Chat with AI** for real-time privacy guidance (Gemini-powered)
- **Export & Archive** encrypted 2-year retention PDFs

---

## 🔐 Key Features

### 16-Layer Identity Vector Scanning
1. **Email Breach Scanner** (V-01) — Checks breaches, metadata exposure
2. **Social Media Footprint** (V-02) — Username reuse, profile scraping detection
3. **Device File Scan** (V-03) — Local & cloud file analysis
4. **Mobile Security Layer** (V-04) — Passkey enforcement, 2FA status
5. **Deep Web Exposure** (V-05) — Pattern-based lookup monitoring
6. **Data Broker Removal** (V-06) — Automated removal templates
7. **Password Vault Analysis** (V-07) — Weak credential detection
8. **Location Data Footprint** (V-08) — GPS history & metadata exposure
9. **Browser & Cookie Tracker** (V-09) — Third-party tracking detection
10. **Financial Identity Exposure** (V-10) — Banking/payment data leaks
11. **Medical Data Footprint** (V-11) — Health record exposure
12. **Voice & Biometric Data** (V-12) — Biometric sample detection
13. **IoT & Smart Device Scan** (V-13) — Connected device security audit
14. **Cloud Storage Exposure** (V-14) — Google Drive, OneDrive, iCloud analysis
15. **Dark Web Monitoring** (V-15) — Dark web credential indexing
16. **Behavioral Profile Analysis** (V-16) — Inferred demographic mapping

### Authentication & Security
- ✅ **Federated Identity** (Google OAuth + Apple ID)
- ✅ **Universal Passkey** (WebAuthn device-bound)
- ✅ **Zero-Knowledge Architecture** — User data never exposed to Google/admin
- ✅ **AES-256-GCM Encryption** — Firestore-level encryption at rest
- ✅ **Audit Trail** — Immutable activity logs for compliance

### Admin Portal (Restricted)
- Dashboard with Firebase infrastructure stats
- WebAuthn authentication logs
- Cloud Run, Firestore, Storage monitoring
- Audit trail querying (admin email: `idin@agape.nyc` or `agape@sovereign.nyc`)

### PDF Report Generation
- **Lighthouse-Style DIFF Report** with sovereign score (0-100)
- **SHA256 Digest** for each report
- **Cloud Audit ID** for verification
- **2-Year Retention** policy
- **ECRA 2026 · GDPR · CCPA** compliance certifications

---

## 🛠️ Tech Stack (100% Free-Tier)

### Frontend
- **Next.js 15+** (App Router)
- **React 19+** (with TypeScript)
- **TailwindCSS** + Custom neon gradient theme
- **WebAuthn API** (device-bound passkeys)

### Backend & Infrastructure
- **Firebase Authentication** (Google OAuth, Apple ID, WebAuthn)
- **Cloud Firestore** (NoSQL, real-time, free tier: 50K reads/day)
- **Firebase Storage** (PDF reports, user backups)
- **Cloud Functions** (Node.js 20, background processing)
- **Firebase Hosting** (CDN, auto-HTTPS)
- **Firebase App Check** (request attestation, abuse prevention)

### AI Engine
- **Gemini API** (free tier: 60 RPM, 1M TPM)
- **Context-bound sessions** (no token leakage)
- **Rate-limited by design** (cost guardrails)

### Compliance & Standards
- **ECRA 2026** (European digital rights framework)
- **GDPR** (data minimization, user consent, right to deletion)
- **CCPA** (California Privacy Rights Act alignment)

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Firebase Project** — Create at [console.firebase.google.com](https://console.firebase.google.com)
2. **Node.js 20+** — [Download](https://nodejs.org)
3. **Firebase CLI** — `npm install -g firebase-tools`
4. **Gemini API Key** — [Get here](https://ai.google.dev)
5. **Environment Variables** — Copy `.env.local.template` to `.env.local`

---

## 🚀 Deployment Guide

### Step 1: Clone & Setup
```bash
git clone https://github.com/izrl613/agape-sovereign.git
cd firebase
npm install
cd functions && npm install && cd ..
```

### Step 2: Configure Firebase Project

```bash
# Initialize Firebase CLI (if not done)
firebase init

# Select your Firebase project from the list
firebase use agape-sovereign
```

### Step 3: Set Environment Variables

```bash
# Copy template and fill with your credentials
cp .env.local.template .env.local

# Edit .env.local with:
# - Firebase credentials (from Firebase Console > Project Settings)
# - Gemini API Key (from Google AI)
# - Admin emails
```

### Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules

# Verify deployment:
firebase firestore:indexes
```

### Step 5: Deploy Cloud Functions

```bash
cd functions
npm run deploy
# This deploys:
# - initiateDIFFScan
# - generateDIFFReport
# - cleanupOldReports
# - healthCheck
```

### Step 6: Deploy Next.js App

```bash
# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# View live:
firebase open hosting:site
```

---

## 📊 Firebase Quotas & Limits (Free Tier)

| Service | Limit | Usage |
|---------|-------|-------|
| **Firestore Reads** | 50K/day | ~1K DIFF scans |
| **Firestore Writes** | 20K/day | 16 vectors × 20 scans |
| **Storage** | 5 GB | ~2,500 PDF reports/month |
| **Cloud Functions** | 2M invocations/month | ~66K scans/month |
| **Gemini API** | 60 RPM, 1M TPM | ~4,000 chat sessions/day |
| **App Check** | 1M calls/month | Built-in attestation |

---

## 🔑 Database Schema

### Firestore Collections

#### `/users/{userId}`
```javascript
{
  uid: "user_uuid",
  email: "user@example.com",
  displayName: "John Sovereign",
  provider: "google" | "apple",
  createdAt: Timestamp,
  passKeyBound: boolean,
  monitoredEmails: ["email1@example.com"],
  sovereignScore: 71,
  lastDIFFScan: Timestamp
}
```

#### `/diff_scans/{scanId}`
```javascript
{
  userId: "user_uuid",
  email: "user@example.com",
  scanId: "scan_123...",
  timestamp: Timestamp,
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED",
  vectorResults: { /* 16 vectors */ },
  sovereignScore: 71,
  totalNuked: 59,
  totalKnoxed: 207,
  totalMonitored: 18,
  sha256Hash: "abc123def456...",
  
  // Subcollections:
  // - vectorResults/{vectorId}
  // - findings/{findingId}
}
```

#### `/diff_reports/{reportId}`
```javascript
{
  userId: "user_uuid",
  reportId: "report_123...",
  scanId: "scan_123...",
  createdAt: Timestamp,
  sovereignScore: 71,
  totalNuked: 59,
  totalKnoxed: 207,
  pdfStoragePath: "diff_reports/pdfs/user_id/report_123.pdf",
  sha256Digest: "abc123def456...",
  downloadUrl: "https://storage.googleapis.com/...",
  expiresAt: Timestamp (2 years)
}
```

#### `/audit_logs/{logId}`
- **Admin-only read access**
- **Immutable** (no updates/deletes after creation)
- Action tracking for compliance

---

## 🔒 Firestore Security Rules

All rules are **user-restricted**:
- Users can only read/write their own data
- DIFF scans are immutable after creation
- Reports auto-delete after 2 years
- Admin portal logs require admin role check
- **Zero-knowledge**: Plaintext never stored

Deploy with:
```bash
firebase deploy --only firestore:rules
```

---

## 🤖 API Routes

### Authentication
```
POST /api/auth/login
  { provider: "google" | "apple" }
  → { success: true, provider: "..." }
```

### User Profile
```
GET  /api/user/profile
PUT  /api/user/profile
  → { uid, email, displayName, sovereignScore, ... }
```

### DIFF Scanning
```
POST /api/diff/scan
  → { success: true, scanId: "scan_...", message: "..." }

GET  /api/diff/scan?scanId=...
  → { scanId, vectorResults, sovereignScore, ... }
```

### Report Generation
```
POST /api/report/generate
  { scanId: "scan_..." }
  → { reportId, downloadUrl, sha256Digest, ... }

GET  /api/report/list
  → [ { reportId, sovereignScore, createdAt, ... } ]
```

### AI Chat
```
POST /api/ai/chat
  { messages: [ { role, content } ], context: {...} }
  → { success: true, response: "..." }
```

---

## 🧪 Local Development

### Firebase Emulator

```bash
# Install emulator (one-time)
firebase emulators:install

# Start emulator suite
firebase emulators:start

# In .env.local, set:
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# Emulator UI runs on: http://localhost:4000
```

### Run Next.js Dev Server
```bash
npm run dev

# Visit: http://localhost:3000
```

---

## 📱 User Flow

1. **Landing Page** → "Sign in with Google/Apple"
2. **Federated Auth** → OAuth consent screen
3. **Passkey Binding** → Create device-bound WebAuthn credential
4. **DIFF Profile Creation** → User document initialized in Firestore
5. **16-Vector Scan** → Cloud Functions process each identity vector
6. **Dashboard** → Visualize NUKED/KNOXED/MONITORED exposures
7. **Vector Detail** → Drill into findings per module
8. **Architect AI Chat** → Ask questions (Gemini-powered)
9. **Generate Report** → PDF with SHA256 digest
10. **Download & Archive** → Encrypted retention up to 2 years

---

## 🎨 Design System

### Color Palette (Neon Mixed Hue)
```
Magenta:  RGB(255, 46, 159)  #FF2E9F
Blue:     RGB(0, 212, 255)   #00D4FF
Orange:   RGB(255, 122, 24)  #FF7A18
Dark BG:  RGB(6, 13, 31)     #060D1F
```

### Typography
- **Headlines**: `Orbitron` 700-900 weight
- **Body**: `Rajdhani` 400-600 weight
- **Monospace**: `Share Tech Mono` for code/logs

### Components
- **Glassmorphism** (blur + transparency)
- **Gradient Borders** (rotating neon pulse)
- **Animated SVG** icons
- **Smooth Transitions** (0.2s - 0.4s ease)

---

## 🚨 Admin Portal Access

**Only accessible by:**
- `idin@agape.nyc`
- `agape@sovereign.nyc`

Admin features:
- Firebase infrastructure monitoring
- WebAuthn authentication audit
- Cloud Function invocation stats
- Firestore operation tracking
- Storage usage breakdown

---

## 📜 Compliance Certifications

✅ **ECRA 2026** — European digital rights compliance  
✅ **GDPR** — Right to erasure, data minimization, consent  
✅ **CCPA** — Consumer privacy rights, opt-out mechanisms  
✅ **Zero-Knowledge** — No plaintext user data at rest  
✅ **Encryption** — AES-256-GCM for all sensitive data  
✅ **Audit Trail** — Immutable action logging  

---

## 🐛 Troubleshooting

### "Quota exceeded" Error
- Check Firestore usage: `firebase firestore:indexes`
- Reduce scan frequency or batch processing
- Upgrade to Firebase Blaze plan if needed

### "Unauthenticated" API Error
- Verify Firebase credentials in `.env.local`
- Check auth state with `onAuthStateChanged`
- Ensure passkey is bound to device

### "PDF generation failed"
- Check Cloud Functions logs: `firebase functions:log`
- Verify Storage bucket permissions
- Ensure `pdfkit` dependency installed

### Passkey not persisting
- Check WebAuthn browser support (Chrome, Safari, Edge)
- Ensure HTTPS in production
- Clear browser cache & retry binding

---

## 📚 Additional Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **WebAuthn Spec**: https://www.w3.org/TR/webauthn-2/
- **ECRA 2026**: https://www.eur-lex.europa.eu (when published)
- **GDPR Compliance**: https://gdpr-info.eu
- **Gemini API**: https://ai.google.dev/docs

---

## 📝 License

**Architect AI** — Built for **Agape Sovereign Enclave 2026**

Proprietary software. All rights reserved.

**Contact**: idin@agape.nyc | agape@sovereign.nyc

---

## 🤝 Contributing

This is a closed-source project. Contact maintainers for contribution guidelines.

---

## 📞 Support

For issues, feature requests, or security concerns:

📧 **Email**: idin@agape.nyc  
🔗 **Website**: https://agape-sovereign.nyc

---

**Version**: 1.0.0  
**Last Updated**: May 5, 2026  
**Status**: Production Ready ✅  

---

**Architect AI — Reclaim Your Digital Sovereignty.**
