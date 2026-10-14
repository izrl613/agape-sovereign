# Security Policy

## Supported Versions

| Version | Supported          | Security Updates |
| ------- | ------------------ | ----------------- |
| 2.0.x   | :white_check_mark: | Yes               |
| 1.0.x   | :x:                | No                |
| < 1.0   | :x:                | No                |

**Current Production Version**: 2.0.x

## Security Status

**Last Security Audit**: August 22, 2026
**Audit Status**: Critical vulnerabilities identified - See [docs/SECURITY_AUDIT_REPORT.md](docs/SECURITY_AUDIT_REPORT.md)

### Known Critical Vulnerabilities (Pending Fix)
1. Simulated passkey authentication (signature verification not implemented)
2. Non-persisted master encryption keys (data loss risk on restart)
3. Master key injection capability
4. AES-GCM parameter swap vulnerability

**Timeline**: Estimated 2-4 weeks for critical fixes, 4-8 weeks for complete security architecture redesign.

## Reporting a Vulnerability

### How to Report
If you discover a security vulnerability in agape-sovereign, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email: `idin@agape.nyc` with subject `[SECURITY] agape-sovereign vulnerability`
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Timeline
- **Initial response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix timeline**: Based on severity (Critical: 48-72 hours, High: 7 days, Medium: 14 days, Low: 30 days)

### What to Expect
- We will acknowledge receipt of your report
- We will provide regular updates on our progress
- If the vulnerability is accepted, we will work on a fix
- If declined, we will explain our reasoning
- We will credit you in the security advisory (unless you request anonymity)

## Security Features

### Zero-Knowledge Architecture
- User data encrypted before storage (AES-256-GCM)
- Admin accounts cannot access user-specific data
- Encryption keys derived from user credentials
- Firestore document-level encryption

### Authentication Layers
| Layer | Technology | Strength |
|-------|-----------|---------|
| Primary Login | Google OAuth 2.0 / Apple ID | Federated identity |
| Device Binding | WebAuthn / FIDO2 Passkey | Hardware-bound |
| Request Attestation | Firebase App Check | Abuse prevention |
| Session Integrity | Firebase Auth tokens | Short-lived JWTs |

### Data Isolation
- User-scoped Firestore security rules
- Storage access controlled via security rules
- No cross-user data access possible
- Audit logging for all security events

## Compliance

| Standard | Status |
|---------|--------|
| ECRA 2026 | In Progress |
| GDPR | Partially Implemented |
| CCPA | Partially Implemented |

### GDPR Rights Implemented
- Right to Access (data export)
- Right to Deletion (account deletion removes all data)
- Data Minimization (only required data collected)
- Consent (explicit opt-in for each scan type)

## Security Resources

- [Security Audit Report](docs/SECURITY_AUDIT_REPORT.md) - Detailed vulnerability analysis
- [Wiki Security Page](wiki/Security.md) - Security model and architecture
- [Firestore Security Rules](firestore.rules) - Database access controls
- [Storage Security Rules](storage.rules) - File storage access controls

## Best Practices for Contributors

1. Never commit secrets or API keys
2. Use `.env.example` for environment variable templates
3. Follow security review process for sensitive changes
4. Test security rules locally with Firebase emulators
5. Review security scan results in PRs

## Security Tooling

- **Gitleaks**: Secret scanning configured
- **Trufflehog**: Additional secret detection
- **CodeQL**: Static analysis (GitHub Actions)
- **Dependabot**: Automated dependency updates
- **Dependency Review**: License and vulnerability checking
