# User Data Rights

**Standards**: ECRA 2026, CPRA, GDPR (where applicable)  
**App**: sovereign.nyc — AI Digital Identity Sovereign Restoration  
**Last Updated**: 2026-08-25  

---

## Your Rights

As a user of Agape Sovereign, you have the following rights:

### Right to Access
You can export all data associated with your account at any time from the Account Settings page.

### Right to Deletion
You can delete your account and all associated data. Deletion is permanent and irreversible. Retained data (audit logs) is expunged on request.

### Right to Portability
You can download your scan history, reports, and Sovereign Score data in JSON format.

### Right to Correction (GDPR Article 16)
You can update your profile information at any time (subject to a once-per-24-hours rate limit to prevent abuse). Formal rectification requests are processed by the Human Dignity Rectification engine, which enforces GDPR Article 16 and UDHR Article 12. See [Rectification and the Human Dignity Index](#rectification-and-the-human-dignity-index) below.

### Right to Opt Out of AI Processing
You can disable AI-assisted analysis and use manual classification only.

### Right to Know (ECRA 2026)
We will notify you within **72 hours** if we become aware of a data breach affecting your account.

---

## Rectification and the Human Dignity Index

Every formal correction request runs through the **Human Dignity Rectification engine** (GDPR Article 16 + UDHR Article 12). The engine validates the request, applies the corrected data, purges the original data, and returns a verifiable receipt.

### How a rectification works

1. You submit a rectification request containing the corrected data, a validator ID, and an Ed25519 signature.
2. The engine hashes the original data (SHA-256) before purging it, then hashes the corrected data.
3. The engine calculates a Human Dignity Index (HDI) score and assigns a dignity tier.
4. The original data is purged from memory (**Zero-Retention**). Only the two hashes are kept for verification.
5. You receive a response with a `RECT-` prefixed rectification ID, both hashes, the HDI detail, a timestamp, and `zero_retention_confirmed: true`.
6. The engine appends the rectification ID, timestamp, HDI score, and tier to the audit trail.

### HDI scoring (0–100)

The HDI score measures rectification quality across four weighted factors:

| Factor | Weight |
|---|---|
| Completeness of corrected fields | 40% |
| Cryptographic signature validity | 30% |
| Zero-Retention compliance | 20% |
| Audit trail integrity | 10% |

### Dignity tiers

| Tier | HDI score range | Meaning |
|---|---|---|
| `COMPROMISED` | 0–70 | Rectification incomplete or unverified; follow-up required |
| `RESTORED` | 71–90 | Rectification applied and verified |
| `SOVEREIGN_RECTIFIED_GOLD` | 91–100 | Complete, signed rectification with full Zero-Retention purge |

---

## Data We Collect

| Data Type | Purpose | Retention |
|---|---|---|
| Email address | Account identity | Until account deletion |
| DIFF scan results | Identity monitoring | 90 days (auto-purged) |
| Generated PDF reports | User audit records | 2 years |
| Passkey credentials | Passwordless auth | Until removed by user |
| AI session messages | In-session context only | Session lifetime only |
| Audit logs | Security compliance | 7 years (admin only) |

---

## Data We Do NOT Collect

- We do not collect SSNs, financial data, or government IDs.
- We do not sell user data to third parties.
- We do not use user data for AI model training.
- We do not use advertising trackers.

---

## Contact

Data rights requests: idin@agape.nyc
