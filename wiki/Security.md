---
title: "Security model, authentication layers, and App Check"
description: "Zero-knowledge security architecture: Firestore isolation rules, Firebase App Check, MCP server authentication, and vulnerability reporting."
---

# Security

## Security Status

**⚠️ Important**: A comprehensive security audit was conducted on August 22, 2026, identifying **21 vulnerabilities** (5 critical, 7 high, 6 medium, 3 low). The system is currently marked as **NON-COMPLIANT** pending resolution of critical issues.

**Critical Vulnerabilities (Pending Fix)**:
1. Simulated passkey authentication (signature verification not implemented)
2. Non-persisted master encryption keys (data loss risk on restart)
3. Master key injection capability
4. AES-GCM parameter swap vulnerability

**Timeline**: Estimated 2-4 weeks for critical fixes. See [SECURITY_AUDIT_REPORT.md](../docs/SECURITY_AUDIT_REPORT.md) for full details.

**Recent Security Improvements (October 2026)**:
- Firestore security rules hardened with owner-based access control
- Admin function updated to use custom claims instead of hardcoded emails
- Git repository corruption fixed (.DS_Store files removed)
- Stale branches cleaned up to reduce attack surface

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
| MCP Tool Calls | Firebase ID token or API key | Server-side gate |

### Firebase App Check

App Check providers are declared in `firebase.json` and attest that requests to Auth, Firestore, and Storage come from your real apps:

- **Web:** reCAPTCHA v3 — set your site key in the `appCheck.providers.recaptchaV3.siteKey` field
- **Android:** Play Integrity with token exchange

### MCP server authentication

The `gemma4-mcp-server` Cloud Run service gates every POST (JSON-RPC) request. `GET /health` stays open for Cloud Run probes. A request is authorized by either:

1. A **Firebase ID token** in the `Authorization: Bearer <token>` header, verified as RS256 against Google's JWKS for the configured Firebase project
2. A **static API key** in the `X-API-Key` header, compared in constant time against the server's configured key

Unauthorized requests receive HTTP 401 with a JSON-RPC error (`code: -32600`, message `Unauthorized: <reason>`).

Configuration (environment variables on the Cloud Run service):

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_REQUIRE_AUTH` | `true` | Enforce the auth gate on POST. Force-enabled on Cloud Run regardless of value |
| `MCP_API_KEY` | unset | If set, requests may authenticate with `X-API-Key: <secret>` |
| `FIREBASE_PROJECT_ID` | `agape-sovereign` | Project used as issuer/audience for ID token verification |

Example authenticated tool call:

```bash
curl -X POST https://gemma4-mcp-server-vub7d55vga-uc.a.run.app \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

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
