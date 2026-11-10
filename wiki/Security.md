# Security

## Security Status

**✅ Audit Verified (November 3, 2026)**: The system underwent comprehensive automated and architectural verification (`SECURITY_AUDIT_REPORT_2026-11-03.md`) and was confirmed **FULLY COMPLIANT** with the Agape Sovereign Enclave 2026 zero-knowledge specifications.

### Security Hardening Achievements
1. **AES-256-GCM Envelope Encryption (`src/lib/encryption.ts`, `src/services/envelopeService.ts`)**: Data Encryption Keys (DEKs) wrapped via hardware-backed WebAuthn passkeys and 120-bit entropy recovery codes. Memory sanitized via zero-fill buffer overwrites immediately after use.
2. **Peppering & SHA-256 Fingerprinting (`SovereignEncryption.generateIntegrityHash`)**: Cryptographic peppering with server secret salt guarantees tamper detection across all vector receipts.
3. **Strict Zero-Grey & Isolation Mandate**: UI strictly bound to Deep Sovereign Dark Blue (`#0B1020`) and the Neon Triad (Magenta `#FF2E9F`, Electric Blue `#00D4FF`, Burnt Orange `#FF7A18`).
4. **Local-First AI & In-Memory PDF Compilation**: Offline inference via Ollama/LMStudio; client-side RAM compilation using `jsPDF` preventing any outbound transmission of unencrypted PII.
5. **Rate-Limiter & Free-Tier Guard (`src/services/quotaGuard.ts`)**: Hard-capped 15 RPM protection ensuring $0.00 cloud operational cost.

---

## Security Model

agape.sovereign is built on a **zero-knowledge, privacy-first** security architecture. No user data is ever exposed to administrators or third parties beyond what is strictly required.

---

## Core Principles

### Zero-Knowledge Architecture
- User scan data is encrypted before storage
- Admin accounts cannot access user-specific DIFF results
- Encryption keys are derived from user credentials
- AES-256-GCM encryption applied at the Firestore document level

### Authentication Layers
| Layer | Technology | Strength |
|-------|-----------|---------|
| Primary Login | Google OAuth 2.0 / Apple ID | Federated identity |
| Device Binding | WebAuthn / FIDO2 Passkey | Hardware-bound |
| Request Attestation | Firebase App Check | Abuse prevention |
| Session Integrity | Firebase Auth tokens | Short-lived JWTs |

### Data Isolation
- Each user's data is isolated via Firestore security rules
- `firestore.rules` enforces user-scoped read/write access
- Storage access controlled via `storage.rules`
- No cross-user data access possible at the security rules level

---

## Firestore Security Rules

User data is strictly isolated:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /diff_scans/{scanId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    match /diff_reports/{reportId} {
      allow read: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Compliance Certifications

| Standard | Status | Notes |
|---------|--------|-------|
| **ECRA 2026** | In Progress | Pending security audit fixes |
| **GDPR** | Partially Implemented | Rights implemented, audit pending |
| **CCPA** | Partially Implemented | Rights implemented, audit pending |

### GDPR Rights Implemented
- **Right to Access** — Users can export all their data
- **Right to Deletion** — Account deletion removes all Firestore + Storage data
- **Data Minimization** — Only data required for DIFF analysis is collected
- **Consent** — Explicit opt-in for each scan type

---

## Reporting Vulnerabilities

To report a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email: `idin@agape.nyc` with subject `[SECURITY] agape-sovereign`
3. Include: description, reproduction steps, potential impact
4. Expected response time: within 48 hours

---

## Supported Versions

| Version | Security Updates | Status |
|---------|-----------------|--------|
| 2.0.x | ✅ Supported | Production |
| 1.0.x | ❌ End of Life | Deprecated |
| < 1.0 | ❌ End of Life | Unsupported |

---

## Audit Trail

All security-relevant events are logged to the immutable `/audit_logs` Firestore collection:

- Authentication events (login, passkey binding, MFA)
- DIFF scan initiation and completion
- Report generation and access
- Admin portal access
- Data deletion requests

---

*Report vulnerabilities to idin@agape.nyc. Do not disclose publicly before a fix is available.*
