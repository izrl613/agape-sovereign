## Summary

> _Brief description of what this PR does and why._

---

## Compliance Checklist (required for merge)

### 🔐 Security
- [ ] No secrets, API keys, or `.env` files committed
- [ ] No hardcoded credentials or service account JSON
- [ ] Firestore / Storage rules remain deny-by-default
- [ ] Admin email allowlist unchanged (idin@agape.nyc / agape@sovereign.nyc)

### 🏛️ Privacy & ECRA 2026
- [ ] No new PII is logged to console or unprotected storage
- [ ] User data access remains zero-knowledge (users can only read their own data)
- [ ] Any new data collection has explicit consent mechanism
- [ ] Data retention policy honored (diff_scans: 90 days, reports: 2 years)

### 🤖 AI Act 2026 (where applicable)
- [ ] AI-generated outputs are disclosed to the user
- [ ] Sovereign Score model changes are documented in `docs/compliance/`
- [ ] No opaque AI decisions affecting user rights without explanation

### ✅ Quality Gate
- [ ] Compliance Gate workflow passes (all checks green)
- [ ] No new CRITICAL npm vulnerabilities introduced
- [ ] TypeScript type errors addressed

---

## Test Plan

- [ ] Manually tested locally
- [ ] Firebase emulator tested (if applicable)
- [ ] Relevant unit/integration tests updated

---

_By submitting this PR, I confirm the above compliance checklist has been reviewed._
