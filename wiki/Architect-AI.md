# Architect AI — DIFF Intelligence Platform

> *Digital Identity Federated Footprint (DIFF) Scanner*

Architect AI is the core intelligence engine of agape.sovereign. It performs deep analysis of a user's digital footprint across **16 identity vectors**, generates a DIFF sovereign score, and produces compliance-grade audit reports.

---

## Core Purpose

| Capability | Description |
|-----------|-------------|
| **Scan & Analyze** | Complete digital footprint across 16 identity vectors |
| **Classify Exposures** | **NUKED** (dangerous) or **KNOXED** (secured) |
| **Score** | Lighthouse-style DIFF sovereign score (0–100) |
| **AI Guidance** | Real-time privacy recommendations via Gemini |
| **Audit Reports** | SHA256-signed PDFs with 2-year retention |

---

## 16 Identity Vectors

| # | Vector | ID | Description |
|---|--------|----|-------------|
| 1 | Email Breach Scanner | V-01 | Breach detection, metadata exposure |
| 2 | Social Media Footprint | V-02 | Username reuse, profile scraping detection |
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

## DIFF Score System

The **DIFF Sovereign Score** (0–100) is a Lighthouse-style privacy health metric:

| Score Range | Status | Meaning |
|-------------|--------|---------|
| 90–100 | 🟢 KNOXED | Highly secured digital identity |
| 70–89 | 🟡 Moderate | Some exposures, action recommended |
| 50–69 | 🟠 Exposed | Significant risk, urgent remediation |
| 0–49 | 🔴 NUKED | Critical exposure, immediate action required |

---

## Authentication & Security

```
┌──────────────────────────────────────────────────┐
│               Authentication Stack               │
├──────────────────────────────────────────────────┤
│  ✅ Google OAuth 2.0          (primary login)     │
│  ✅ Apple ID Federation       (iOS/macOS)         │
│  ✅ Universal Passkey (WebAuthn) (device-bound)   │
│  ✅ AES-256-GCM Encryption    (data at rest)      │
│  ✅ Zero-Knowledge Arch       (admin-blind)       │
│  ✅ Firebase App Check        (abuse prevention)  │
│  ✅ Immutable Audit Trail     (compliance logs)   │
└──────────────────────────────────────────────────┘
```

---

## PDF Report Generation

Each completed DIFF scan can generate a compliance-grade PDF report:

- **Format:** Lighthouse-style DIFF Report
- **Digest:** SHA256 fingerprint per report
- **Cloud Audit ID:** Unique verifiable identifier
- **Retention:** 2 years in Firebase Storage
- **Compliance:** ECRA 2026 · GDPR · CCPA certified

---

## Admin Portal

Restricted to admin emails (`idin@agape.nyc`, `agape@sovereign.nyc`):

- Firebase infrastructure dashboard
- WebAuthn authentication logs
- Cloud Run, Firestore, Storage monitoring
- Audit trail querying

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
| `initiateDIFFScan` | HTTP call | Start a new 16-vector scan |
| `generateDIFFReport` | Firestore write | Generate PDF after scan completion |
| `cleanupOldReports` | Scheduled | Delete reports older than 2 years |
| `healthCheck` | HTTP call | Infrastructure monitoring endpoint |
| `architectApi` | HTTP request | Serves `POST /api/architect`, the Gemini chat proxy |

---

## Chat Endpoint (`/api/architect`)

The `architectApi` function exposes the Architect AI chat at `POST /api/architect`. Send `{ message, history }` and receive `{ reply, uid }`. The last 10 history entries are used as session context.

Requests must pass three security layers:

- **Auth**: `Authorization: Bearer <Firebase ID token>` header (401 otherwise)
- **App Check**: `X-Firebase-AppCheck` token when enforcement is enabled (401 otherwise)
- **Rate limit**: 30 requests per 15-minute window per client (429 otherwise)

See the [Architect AI README](/ARCHITECT_AI_README) for the full request schema and a curl example.

---

*See [[Architecture]] for system overview, [[Quick-Start]] to begin scanning.*
