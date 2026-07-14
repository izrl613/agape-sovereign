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

5. **Stage 4 — Local-Only AI Cutover**
   - Route production AI requests only to the user-controlled Ollama endpoint.
   - Remove Gemini, Vertex AI, Google GenAI SDK, Cloud Run AI proxies, and all cloud-AI fallback paths from the production application.
   - Treat AI service unavailability as an offline state; do not silently transmit a prompt to another provider.
   - Require an authenticated, rate-limited server boundary for sensitive AI-assisted actions.

6. **Stage 5 — Evidence and Release Controls**
   - Run the sovereign boundary check, secret scan, rules validation, dependency audit, type check, and production build for every pull request and push to `main`.
   - Record only aggregate CI evidence in GitHub Actions. Do not upload prompts, identity findings, reports, logs, or customer documents as artifacts.
   - Block release until the local-only AI boundary and real-data checks pass.

## Current Release Blockers

- Production files still include Google/Gemini/Vertex and Cloud Run AI paths alongside Ollama.
- The compliance evidence workflow exists, but branch protection must require its checks before deployment.
- The app must replace seeded findings and scores with user-generated scan output before public release.

## Working Rules (Non-Negotiables)

- **Zero-knowledge posture**: user data access is restricted to the authenticated user.
- **Least privilege**: admin access only for the two admin emails above.
- **No secret sprawl**: never commit `.env`, service account keys, or private credentials.
