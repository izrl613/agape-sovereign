# Security

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

| Standard | Scope |
|---------|-------|
| **ECRA 2026** | European Cybersecurity Resilience Act |
| **GDPR** | Data minimization, consent, right to deletion |
| **CCPA** | California Privacy Rights Act |

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

| Version | Security Updates |
|---------|-----------------|
| 5.1.x | ✅ Supported |
| 5.0.x | ❌ End of Life |
| 4.0.x | ✅ Supported |
| < 4.0 | ❌ End of Life |

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
