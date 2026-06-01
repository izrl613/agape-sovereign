# Agape AI Compliance Roadmap (Implementation)

This repository follows a security-first build order:

1. **Foundation (Governance + Guardrails)**
   - Repo hygiene: PR templates, issue templates, CI compliance gates
   - Firebase security defaults: deny-by-default rules, least privilege
   - Secrets discipline: no committed credentials or API keys

2. **Stage 1 — Data Collection Front-End**
   - Module specs live in `docs/compliance/modules/`
   - Data minimization: ephemeral by default unless user explicitly saves
   - No external transmission of user-provided sensitive data without explicit consent

3. **Stage 2 — Analysis Core**
   - Classify findings as **NUKED** or **KNOXED** (optionally **MONITORED**)
   - Maintain a transparent **Sovereign Score** model and logging

4. **Stage 3 — Reporting + Infrastructure**
   - Lighthouse-style PDF export
   - Admin portal lockdown: passkey-only for `idin@agape.nyc` / `agape@sovereign.nyc`
   - Audit logs with immutable write patterns

## Working Rules (Non-Negotiables)

- **Zero-knowledge posture**: user data access is restricted to the authenticated user.
- **Least privilege**: admin access only for the two admin emails above.
- **No secret sprawl**: never commit `.env`, service account keys, or private credentials.

