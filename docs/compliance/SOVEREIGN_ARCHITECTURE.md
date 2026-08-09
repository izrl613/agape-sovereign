# Sovereign Architecture Contract

## Purpose

Agape Sovereign processes sensitive identity and privacy information. This contract defines the minimum architecture required before public release.

## Non-Negotiable Boundaries

- AI inference for sensitive prompts is local-only through a user-controlled Ollama instance. No Gemini, Vertex AI, Google GenAI SDK, Cloud Run AI proxy, or undisclosed third-party fallback may receive such prompts.
- User-visible findings, scores, and reports must derive from user-provided input and documented processing. Seeded scores or demonstration findings are prohibited in the production surface.
- Sensitive operations require authenticated ownership checks. Administrator-only actions must be separately authorized and auditable.
- GitHub Actions may retain code-quality and aggregate pass/fail evidence only. They must never upload customer inputs, generated reports, API credentials, or application logs containing personal data.

## Local AI Boundary

1. The browser sends an AI request only to the app's authenticated local API boundary.
2. That boundary forwards only to the configured local Ollama endpoint.
3. A local service outage returns an offline response. It must not cause a cloud fallback.
4. The boundary check in `scripts/compliance/verify-sovereign-boundaries.mjs` prevents known cloud-AI markers and seeded findings from being released.

## Release Evidence

The `Compliance Gate` workflow verifies secrets, dependency vulnerabilities, Firebase rules, privacy signals, build integrity, and the sovereign boundary. Repository administrators must configure branch protection so these required checks pass before code reaches `main` or production.

## Free and Local Capabilities

The repository can use these without a required paid AI provider when they are run by the user:

- Ollama local inference and the Architect MCP server
- Browser/PWA offline behavior and local cache
- Local report generation with jsPDF
- Firebase Emulator Suite for development and security-rule testing
- GitHub Actions public-repository minutes within the account's applicable GitHub allowance

"Free" does not mean unlimited or zero-risk: local models require hardware, storage, and electricity; hosting, Firebase, and GitHub usage may have account-level limits.
