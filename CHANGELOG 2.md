# Agape Sovereign — Full Journey Changelog

> _From Project Genesis to v2.0 — every commit, issue, and milestone documented._
> _Repo created: 2026-04-20 · Last updated: 2026-07-21_

---

## Phase 4 — v2.0 Identity Vectors & Shield Platform _(Jul 2026 · In Progress)_

### Milestone: `Phase 4 — v2.0 Identity Vectors & Shield Platform` (due 2026-07-30)

**Highlights:** Firebase deploy reliability overhaul, autonomous agentic workflows, sovereign pipeline v1 complete, LM Studio integration, NotebookLM documentation, YouTube script outline.

| Date | Type | Description |
|------|------|-------------|
| 2026-07-21 | `fix` | Resolve 10 Firebase deploy failure root causes (lint configs, apphosting, workspaces, deps, workflows) |
| 2026-07-21 | `feat` | Add `scripts/validate-firebase-deploy.mjs` — autonomous agentic validation of all 10 deploy conditions |
| 2026-07-21 | `feat` | Integrate Firebase deploy validation into `agentic-sovereign-updater` (6h), `gcp-monitoring-agent` (daily), `compliance-agent` (weekly) |
| 2026-07-21 | `feat` | Create `scripts/validate-repo-health.mjs` — validates all GitHub services (Issues, Wiki, Actions, Insights, Projects, Discussions) |
| 2026-07-21 | `docs` | Create comprehensive CHANGELOG.md spanning full repo journey (Phase 0 → Phase 4) |
| 2026-07-21 | `docs` | Update TIMELINE.md with full journey documentation |
| 2026-07-21 | `docs` | Create NotebookLM-ready Colab notebook (`ocr_output/agape_sovereign_colab_notebook.md`) |
| 2026-07-21 | `docs` | Create YouTube video script outline (`ocr_output/agape_sovereign_youtube_script.md`) |
| 2026-07-21 | `ops` | Create GitHub Release v1.0.0 with full release notes |
| 2026-07-21 | `ops` | Create GitHub Release v2.0.0-alpha with Phase 4 milestones |
| 2026-07-20 | `feat` | Sovereign pipeline v1 complete — 9-agent pipeline (extraction → mapping → validation → synthesis → audit → reporting → PDF → export) |
| 2026-07-20 | `feat` | LM Studio integration — `qwen3.5-9b-sushi-coder-rl-mlx` as primary local LLM |
| 2026-07-20 | `feat` | Sovereign pipeline run #5738d7fb — 166K char extraction from 92-page Operation Framework PDF |
| 2026-07-20 | `feat` | Vertex AI boundary enforcement — `agents/boundary.py` restricts Vertex to document_processing/pdf_rendering only |
| 2026-07-20 | `feat` | Architect AI MCP server — `gemma4:e2b` offline LLM with Cloud Run deployment |
| 2026-07-20 | `feat` | GCP monitoring agent — probes 5/6 Cloud Run services, daily PDF report generation |
| 2026-07-20 | `feat` | Agentic workflows: `agentic-sovereign-updater` (6h), `agentic-notator` (daily), `compliance-agent` (weekly) |
| 2026-07-20 | `feat` | Timeline sync workflow — `timeline-sync.yml` syncs milestones/issues/TIMELINE.md |
| 2026-07-20 | `feat` | BIP-39 mnemonic removal — stripped from sovereign export, kept SHA-256 integrity seals |
| 2026-07-20 | `feat` | Biometric passkey integration for vault and identity zones |
| 2026-07-20 | `fix` | Combine schedule trigger, update budget check script |
| 2026-07-20 | `chore` | Migrate local LLM fallback from Ollama to LM Studio |
| 2026-07-20 | `chore` | Configure local LMStudio model to qwen3.5-9b-sushi-coder-rl-mlx |
| 2026-07-20 | `chore` | add `scripts/git-reconcile.sh` for repo reconciliation |
| 2026-07-20 | `chore` | add daily GCP budget monitoring script with Slack alerting |
| 2026-07-20 | `chore` | add `rolldown` to dependencies, update executive briefing docs |
| 2026-07-20 | `chore` | remove functions TypeScript unused import errors |
| 2026-07-20 | `chore` | add GCP credit preservation plan ($1,000 → extend to 2027-01-26) |
| 2026-07-20 | `deps` | bump `@typescript-eslint/eslint-plugin` — various security patches |
| 2026-07-20 | `deps` | bump `github/codeql-action` from 3 to 4 |
| 2026-07-20 | `deps` | bump `typescript` from 6.0.3 to 7.0.2 in functions |
| 2026-07-20 | `deps` | bump `actions/setup-node` from 4 to 7 |
| 2026-07-20 | `deps` | bump various npm_and_yarn groups across workspaces |
| 2026-07-20 | `deps` | bump `firebase-functions-test` from 3.4.1 to 3.5.0 |
| 2026-07-20 | `deps` | bump `gitleaks/gitleaks-action` from 2 to 3 |
| 2026-07-20 | `deps` | bump `google-github-actions/auth` from 2 to 3 |
| 2026-07-20 | `deps` | bump `actions/upload-artifact` from 4 to 7 (open) |
| 2026-07-20 | `deps` | bump `actions/dependency-review-action` from 4 to 5 (open) |
| 2026-07-20 | `deps` | bump `@types/node` from 20.19.43 to 26.1.1 (open) |
| 2026-07-20 | `deps` | bump `@vitejs/plugin-react` from 4.7.0 to 6.0.3 (open) |
| 2026-07-20 | `deps` | bump `vite` from 5.4.21 to 8.1.5 (open) |
| 2026-07-20 | `deps` | bump `react` + `@types/react` (open) |
| 2026-07-20 | `deps` | bump `react-dom` + `@types/react-dom` (open) |
| 2026-07-20 | `deps` | bump `firebase-admin` from 13.10.0 to 14.2.0 in /functions (open) |
| 2026-07-20 | `deps` | bump `eslint` from 8.57.1 to 10.7.0 in /functions (open) |
| 2026-07-20 | `deps` | bump `@typescript-eslint/eslint-plugin` 5.62.0 → 8.65.0 (open) |
| 2026-07-20 | `deps` | bump `typescript` 5.9.3 → 7.0.2 (open) |
| 2026-07-20 | `deps` | bump various npm_and_yarn across 1 dir with 4 updates (open) |
| 2026-07-19 | `feat` | PWA offline support — service worker registration |
| 2026-07-19 | `feat` | MCP server proxy + rewrite for Architect AI |
| 2026-07-19 | `feat` | 120-second timeout on Ollama API requests (AbortController) |
| 2026-07-19 | `feat` | SSE endpoint with proper MCP server connection lifecycle |
| 2026-07-19 | `feat` | App Hosting configuration — `alwaysDeployFromSource`, storage bucket |
| 2026-07-19 | `refactor` | Migrate to Firebase Admin SDK v12 modular imports |
| 2026-07-19 | `refactor` | Remove Firebase Data Connect generated files and configuration |
| 2026-07-19 | `refactor` | Remove obsolete/unused files |
| 2026-07-19 | `chore` | Update submodule references (gemma-chat-public) |
| 2026-07-19 | `chore` | Clean up Python bytecode artifacts from version control |
| 2026-07-19 | `deps` | bump npm_and_yarn group across 1 dir with 3 updates |

---

## Phase 3 — Repository Creation & v1.0.0 _(Apr 20 – Jul 12, 2026)_

### Milestone: `Phase 3 — Repository & v1.0.0` (closed · due 2026-04-29)

**Highlights:** Repo created, v1.0.0 deployed to production, Firebase hosting + Cloud Run + Firestore operational.

| Date | Type | Description |
|------|------|-------------|
| 2026-07-18 | `style` | Redesign landing page footer with neon-themed typography |
| 2026-07-18 | `chore` | VS Code terminal profiles + shell integration config |
| 2026-07-17 | `feat` | **Production deployment v1.0.0** — agape-sovereign live |
| 2026-07-17 | `feat` | Validity window tracking for identity exports |
| 2026-07-17 | `feat` | firebase-functions dependency added |
| 2026-07-17 | `feat` | PDF text extraction agent + multi-range extraction script |
| 2026-07-17 | `refactor` | Disable Genkit samples, update Firebase config, add range-parser types |
| 2026-07-17 | `chore` | Unify auth session cookies, WebAuthn config for production |
| 2026-07-17 | `chore` | Enable notebook agent for VS Code inline chat |
| 2026-07-16 | `deps` | bump npm_and_yarn group across 1 dir with 2 updates |
| 2026-07-15 | `feat` | Sovereign audit report + manifest files generated |
| 2026-07-15 | `feat` | PDF resource processing + application config services |
| 2026-07-15 | `feat` | Production entry build refresh |
| 2026-07-15 | `fix` | Route local authentication to app backend |
| 2026-07-15 | `fix` | Production authentication flows hardened |
| 2026-07-15 | `fix` | Legal links pointed to published PDFs |
| 2026-07-15 | `fix` | Passkey enrollment errors stay on login page |
| 2026-07-15 | `fix` | Firestore ID configuration, remove redundant backend deploy target |
| 2026-07-15 | `chore` | Reinstall project dependencies |
| 2026-07-15 | `chore` | Remove temporary PDF review artifacts |
| 2026-07-15 | `chore` | Update bundled script reference + legal document paths |
| 2026-07-15 | `chore` | Update index.html main script reference (new build hash) |
| 2026-07-14 | `feat` | Migrate auth API to function-based routing + PASSKEY_COOKIE_SECRET |
| 2026-07-14 | `chore` | Update default Python interpreter to python3 |
| 2026-07-13 | `feat` | MCP server for gemma4:e2b + PWA offline integration |
| 2026-07-13 | `feat` | Android REST bridge + emulator CORS |
| 2026-07-13 | `feat` | Emergency bypass login flow for anonymous accounts |
| 2026-07-13 | `feat` | Architect AI deployment-safe configuration |
| 2026-07-13 | `refactor` | Migrate all AI from Google GenAI SDK → local Ollama gemma4:e2b |
| 2026-07-13 | `refactor` | Login component + environment configuration + venv deps |
| 2026-07-13 | `style` | Footer copyright year update + navigation link restyle |
| 2026-07-13 | `chore` | Project dependencies update + gitleaks configuration |
| 2026-07-13 | `chore` | Resolve merge conflicts (TermsOfService + PrivacyPolicy) |
| 2026-07-13 | `deps` | bump express from 4.22.2 to 5.2.1 in functions |
| 2026-07-13 | `deps` | bump firebase-admin from 13.10.0 to 14.2.0 in functions |
| 2026-07-13 | `deps` | bump github/codeql-action from 3 to 4 |
| 2026-07-13 | `deps` | bump actions/checkout from 4 to 7 (open) |
| 2026-07-12 | `fix` | Correct all 16 identity-vector navigation paths + vector numbering |
| 2026-07-12 | `fix` | TypeScript compile errors + compliance false positive + deploy secret |
| 2026-07-12 | `fix` | Homepage privacy-policy link for Google OAuth verification |
| 2026-07-12 | `fix` | Cloud Run rewrite + auth router fix + tsconfig cleanup |
| 2026-07-12 | `fix` | Routes — add PrivacyPolicy + TermsOfService components |
| 2026-07-12 | `fix` | functions — missing auth dependencies + cleanup old files |
| 2026-07-12 | `fix` | authapi-003-law — firebase-admin compat + compliance fix |
| 2026-07-12 | `feat` | Add Privacy Policy page + homepage link for Google OAuth verification |
| 2026-07-12 | `chore` | Downgrade firebase-admin to v13.10.0 + update lockfiles |
| 2026-07-12 | `ci` | Fix authapi deploy — merge pull request #70 |
| 2026-07-12 | `deps` | bump lucide-react from 1.23.0 to 1.24.0 |
| 2026-07-12 | `deps` | bump @google/genai from 2.10.0 to 2.11.0 |
| 2026-07-12 | `deps` | bump firebase from 12.15.0 to 12.16.0 |
| 2026-07-12 | `deps` | bump express-rate-limit from 7.5.1 to 8.6.0 |
| 2026-07-12 | `deps` | bump firebase-admin from 13.10.0 to 14.1.0 in /functions |
| 2026-07-12 | `deps` | bump npm from 11.18.0 to 12.0.1 |
| 2026-07-12 | `deps` | bump typescript from 6.0.3 to 7.0.2 in /functions |
| 2026-07-12 | `deps` | bump gitleaks/gitleaks-action from 2 to 3 |
| 2026-07-12 | `deps` | bump firebase-functions-test from 3.4.1 to 3.5.0 in /functions |
| 2026-07-12 | `deps` | bump actions/setup-node from 4 to 7 |
| 2026-07-12 | `deps` | bump google-github-actions/auth from 2 to 3 |
| 2026-07-11 | `deps` | bump form-data from 2.5.5 to 2.5.6 in /functions |
| 2026-07-09 | `deps` | bump npm_and_yarn group across 1 dir with 2 updates |
| 2026-07-08 | `deps` | bump npm_and_yarn group across 1 dir with 3 updates |
| 2026-07-06 | `deps` | bump npm_and_yarn group across 2 dirs with 13 updates |
| 2026-07-04 | `deps` | bump rsa in gsutil, bump npm_and_yarn groups |

---

## Phase 2 — Official Launch _(Feb 26 – Apr 19, 2026)_

### Milestone: `Phase 2 — Official Launch` (closed · due 2026-02-27)

**Highlights:** Architect AI core infrastructure, Firebase project live, Genkit integration, VS Code extension.

| Date | Type | Description |
|------|------|-------------|
| 2026-06-27 | `deps` | bump rsa in gsutil |
| 2026-06-22 | `deps` | bump form-data + npm_and_yarn groups |
| 2026-06-21 | `deps` | bump npm_and_yarn group across 1 dir with 2 updates |
| 2026-06-17 | `deps` | bump npm_and_yarn group across 1 dir with 2 updates |
| 2026-06-16 | `deps` | bump form-data in functions |
| 2026-06-14 | `deps` | bump npm_and_yarn group across 1 dir with 5 updates |
| 2026-06-10 | `feat` | **Daily Compliance Monitor** issue created |
| 2026-06-02 | `feat` | Roadmap 2026-06-02 — project roadmap documented (branch: `roadmap-2026-06-02`) |
| 2026-06-02 | `feat` | Roadmap 2026-06-04 — refined project roadmap (branch: `roadmap-2026-06-04`) |
| 2026-06-02 | `feat` | Roadmap 2026-06-08 — detailed project roadmap (branch: `roadmap-2026-06-08`) |
| 2026-05-25 | `docs` | Incident response runbook + audit logging policy (open) |
| 2026-05-25 | `docs` | Dependabot vulnerability triage + remediation plan (open) |
| 2026-05-25 | `docs` | App Check enforcement rollout plan (open) |
| 2026-05-25 | `docs` | Stage 3: Admin portal passkey-only access (open) |
| 2026-05-24 | `docs` | Stage 3: PDF report generator + retention (open) |
| 2026-05-24 | `docs` | Stage 2: NUKED/KNOXED classification + Sovereign Score engine (open) |
| 2026-05-24 | `docs` | Stage 1A1: Email Breach & Metadata Scanner module (open) |
| 2026-05-23 | `deps` | bump npm_and_yarn group across 1-2 dirs with 9-10 updates |
| 2026-05-22 | `deps` | bump npm_and_yarn group across 1-2 dirs with various updates (x7) |
| 2026-05-21 | `feat` | **Implement core infrastructure for Architect AI** |
| 2026-05-21 | `deps` | bump terser, loader-utils, npm_and_yarn groups (x4) |
| 2026-05-20 | `deps` | bump npm_and_yarn group across 1 dir with 1 update |
| 2026-05-20 | `deps` | bump protobufjs in agape-sovereign |
| 2026-05-18 | `deps` | bump npm_and_yarn groups across 2-3 dirs with updates |
| 2026-05-09 | `deps` | bump npm_and_yarn group across 1 dir with 2 updates |
| 2026-05-08 | `deps` | bump npm_and_yarn group across 2 dirs with 2 updates |
| 2026-05-04 | `deps` | bump npm_and_yarn group across 1 dir with 2 updates |
| 2026-04-25 | `deps` | bump postcss from 8.5.2 to 8.5.10 |
| 2026-04-23 | `deps` | bump fast-xml-parser from 5.5.9 to 5.7.1 |

---

## Phase 1 — Foundation & GitHub Infrastructure _(Jan – Feb 25, 2026)_

### Milestone: `Phase 1 — Foundation & GitHub Infrastructure` (closed · due 2026-01-30)

> **Pre-repo phase.** Project groundwork laid before `izrl613/agape-sovereign` was created.

- Firebase project `agape-sovereign` provisioned
- Google Cloud project created (billing account `018175-BBE06D-3B0276`)
- Vertex AI API enabled ($1,000 credit applied)
- Domain `sovereign.nyc` registered
- Cloud Run services conceptualized (agape-sovereign-server, authapi, gemma4-mcp-server)
- Firestore database plan (nam7 location)
- Firebase Auth providers configured (anonymous, email/password, Google Sign-In)
- GCP budget alerts created ($1 / $5 / $25 / $50 tiers)
- GCP billing export to BigQuery enabled
- GitHub organization `izrl613` created
- ECRA 2026 compliance requirements documented
- Zero-trust architecture principles established

---

## Phase 0 — Project Genesis _(Dec 20, 2025 – Jan 2026)_

### Milestone: `Phase 0 — Project Genesis` (closed · due 2025-12-30)

> _The seed of Agape Sovereign: AI Digital Identity First Web App._

- **Project conception** — December 20, 2025
- Mission: Sovereign digital identity restoration through AI-powered identity vector analysis
- Core principles: Zero-trust, local-first AI, zero-knowledge architecture
- Identity vector model designed (16 vectors)
- NUKED/KNOXED classification framework created
- Sovereign Score engine conceptualized
- Operation Framework specification drafted
- BIP-39 mnemonic recovery design
- Local LLM strategy selected (Ollama → LM Studio)
- Genkit evaluation as AI framework
- React PWA frontend architecture chosen
- VS Code extension design for local AI management

---

## Repository Health Dashboard

| Metric | Value |
|--------|-------|
| **Repo created** | 2026-04-20 |
| **Total commits** | 100+ (main branch since Apr 20) |
| **Open issues** | 31 |
| **Closed issues** | 66 |
| **Total issues** | 97 |
| **Milestones** | 5 (Phase 0–4) |
| **Branches** | 27 |
| **Releases** | 2 (v1.0.0, v2.0.0-alpha) |
| **Workflows** | 13 GitHub Actions |
| **Wiki pages** | 5+ (Architecture, Agent Pipeline, Deployment, Billing, Journey) |
| **Discussions** | Enabled |
| **Projects (v2)** | Active |
| **Stars** | 1 |
| **Size** | 606 MB |
| **License** | None (proprietary) |

---

## Remaining Work (as of 2026-07-21)

### Phase 4 — Must Complete by 2026-07-30

- [ ] **Issue #84** — Phase 4 Identity Vectors & Shield Platform
- [ ] **Issue #79** — Near-Zero Cost GCP Monitoring & Logging Setup
- [ ] **Issue #78** — Firebase > GCP Cost Analysis & Remediation Plan
- [ ] **Issue #26** — App Check enforcement rollout
- [ ] **Issue #25** — Stage 3: Admin portal passkey-only access
- [ ] **Issue #24** — Stage 3: PDF report generator + retention
- [ ] **Issue #23** — Stage 2: NUKED/KNOXED + Sovereign Score engine
- [ ] **Issue #22** — Stage 1A1: Email Breach & Metadata Scanner
- [ ] **10 open Dependabot PRs** — dependency updates across workspaces
- [ ] **GCP credit preservation** — stretch $1,000 to 2027-01-26
- [ ] **Firebase deploy** — push main branch to production

---

_This CHANGELOG is auto-maintained. Updates are committed as part of the daily autonomous compliance workflow._
_Last updated: 2026-07-21_
