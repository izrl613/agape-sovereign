# Agape Sovereign — Security Policy

**Effective Date**: 2026-01-01  
**App**: sovereign.nyc — AI Digital Identity Sovereign Restoration  
**Maintainer**: idin@agape.nyc  

---

## Supported Versions

| Version | Supported |
|---|---|
| Latest (main) | ✅ Yes |
| Previous releases | Security patches only |

## Reporting a Vulnerability

Do **not** open a public GitHub Issue for security vulnerabilities.

**Email**: idin@agape.nyc  
**Subject line**: `[SECURITY] agape-sovereign — <brief description>`  

We will respond within **72 hours**. Critical findings will be acknowledged within 24 hours.

## Disclosure Policy

- Vulnerabilities are assessed by severity (CVSS 3.1).
- Critical (CVSS 9.0+): patched within 48 hours, coordinated disclosure after fix.
- High (CVSS 7.0–8.9): patched within 7 days.
- Medium/Low: addressed in next scheduled release.

## Security Architecture

Agape Sovereign is designed with a zero-knowledge, zero-trust architecture:

- **Firestore rules**: deny-by-default, user-scoped data access only.
- **Storage rules**: deny-by-default, cloud-function-only PDF writes.
- **Admin access**: passkey-only for `idin@agape.nyc` and `agape@sovereign.nyc`.
- **Audit logs**: immutable, admin-read-only.
- **Sessions**: ephemeral AI chat sessions with auto-expiry.
- **No PII logging**: console/logger statements are scanned in CI.

## Compliance Standards (2026)

- ECRA (Electronic Communications and Records Act)
- CPRA (California Privacy Rights Act)
- NIST Cybersecurity Framework 2.0
- EU AI Act (for AI-assisted identity restoration features)
- FIDO2/WebAuthn for passwordless authentication
