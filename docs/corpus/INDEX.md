# Agape Sovereign — Extracted Source Corpus

Text extracted 2026-11-25 from the source documents supplied with the
Architect AI / Agape Sovereign Enclave 2026 build-out request. Raw extracts
live in `docs/corpus/raw/`; this index records provenance, size, and what each
source contributes to the platform.

Extraction notes:

- PDFs were parsed with `pypdf`; page boundaries are preserved as
  `--- page N ---` markers.
- `privacy.pdf` was mislabeled — it is actually a `.docx` (Word 2007+ ZIP)
  containing the Privacy Policy. Extracted via `word/document.xml`.
- `GitHub GCP Automation.docx` likewise extracted from `word/document.xml`.
- `Pasted 2026-09-20 at 16.15.24.textClipping` is an RTF/bplist clip; the only
  payload is a license-style token string
  (`E6J43EVN-BGEEH72E-LMEDNSMX-U5W353SK-A3U8BFHR`).
- `claude092026.json` is a Qwen/Claude-style chat export (JSON); kept raw.
- Duplicate exports (`... 2.pdf`, `..._2.txt`) were byte-identical and are
  retained for provenance but carry no additional content.

## Source index

| Raw file | Origin document | Size | What it contributes |
|---|---|---|---|
| `Agape_Sovereign_-_Implementation_Status_-_2026-07-19.txt` | Implementation Status MD (2026-07-19) | 8 KB | Proof the 9-stage Sovereign Data Pipeline ran end-to-end via LM Studio `qwen3.5-9b-sushi-coder-rl-mlx`: Extraction → NER/LLM → DataMapper → Validator → Synthesis → Audit → Reporting → PDF. Confirms `workspace_outputs/` artifacts (`workflow_report.json`, `executive_briefing.md`). |
| `Agape_Sovereign_Engine_Validator.txt` | Engine Validator PDF (2026-08-01) | 5 KB | Third-Party Validator & Human Dignity Data Rectification Engine spec: SSI correction claims, validator nodes, Human Dignity Index (HDI), signed Rectification Certificates. Legal basis: GDPR Art. 16 + UDHR Art. 12. |
| `Architect-AI-IDE_Gemma4E4B_-_2026-05-27_08.22.txt` | LM Studio chat export (Gemma 4 E4B) | 162 KB | Design conversation for a local "SuperAgent" on LM Studio — unlimited-token local LLM rationale that became the Architect AI offline-first design (qwen3-vl:4b / gemma4 fallback, no paid cloud wall). |
| `Architect_AI_Privacy_Features.txt` | Privacy Features PDF | 22 KB | The original product brief: left-nav DIFF modules, Apple/Google federated auth, universal passkey, admin portal behind passkey, Firefox Monitor / SayMine / Jumbo / Optery design references, Google deep-web privacy, ECRA 2026 standard, Architect AI Q&A, Lighthouse-style PDF export, NUKED/KNOXED themes, dark-blue + neon magenta/blue/orange palette. |
| `GitHub_GCP_Automation-1.txt` / `GitHub_GCP_Automation.txt` | GitHub GCP Automation PDF + DOCX | ~19 KB each | 5-goal ops mandate: dissect OPERATION FRAMEWORK, verify project integrity vs Firebase/GCP `izrl613/agape-sovereign`, automate agentic appflow to GCP Agent Platform using credit balance, GitHub Actions agentic deploys to Issues/Wiki/Projects/Actions/Discussions, free monitoring/logging agent. Constraint: near-zero cost. |
| `OPERATION_FRAMEWORK.txt` | Operation Framework PDF | 169 KB | Master orchestration transcript: cross-module IdentityToken schema, UX flowmap requirements (trigger/steps/decisions/pain points/success state), persona-goal-trigger scoping, Colab-vs-local execution strategy. Defines the agent orchestration style used across the repo (`agents/`, `orchestrator`). |
| `Operational_Status_-_Autonomy_OS_-_2026-05-22_12.50*.txt` | Autonomy OS status PDF (×2 dup) | 29 KB | Phase-0 charter thinking for an "Autonomy OS": scope definition, niche selection, phased development. Context for the multi-agent autonomy layer, not a shipped feature. |
| `PWA_OPERATION_FRAMEWORK_INTEGRATION*.txt` | PWA integration MD (×2 dup) | 4 KB | Android bridge design (`com.agape.sovereign.ai`): native Compose UI + WebView PWA + in-app MCP server on port 3001. Defines how the PWA frontend and agent pipeline connect on-device. |
| ~~`Pasted_2026-09-20_at_16.15.24.txt`~~ | Text clipping | — | **EXCLUDED.** RTF/bplist clip containing a license-style token (`E6J43EVN-…-A3U8BFHR`). Removed from the corpus and blocked via `.gitignore` (`**/Pasted_2026-09-20*`) — secret-class artifact, never commit. |
| `Professional_GIthub_Integtation_-_Branched_-_2026-05-22_12.50*.txt` | GitHub integration PDF (×2 dup) | 84 KB | Gemma-4-e4b working session on GitHub Issues/Projects/Wiki/Actions/Insights — the basis for the repo's agent-driven issue/wiki/project automation. |
| `SHA256_Session_Export.txt` | Session export PDF (2026-08-01) | 13 KB | Records the Passkey WebAuthn integration session: `agents/security/passkey_webauthn_integration.py` (`SecurityEnhancedPasskeyManager`), session management hardening, git recovery, Firebase deploy, zero-knowledge audit trails. |
| `SOVEREIGN_HUMAN_DIGNITY_RECTIFICATION_MANIFEST.txt` | Rectification manifest MD | 5 KB | Markdown twin of the Engine Validator spec; adds `POST /api/dignity/rectify` endpoint sketch and unit/E2E verification commands. |
| `Sovereign_Data_Pipeline_Defined_-_2026-07-15_21.46.txt` | Pipeline definition chat (125 KB source PDF) | 126 KB | Canonical pipeline architecture: `IngestionPipeline v1.0` with `PageChunk` transaction model, schema-contract validation, per-page commit + `finalize_document_integrity`, and the 3-module contract — Module 1 extraction, Module 2 AIAgent (composite risk/stability scoring, `clean_memory`), Module 3 `PDFGenerationAgent` rendering the auditable PDF. |
| `TERMS.txt` | Terms of Service PDF | 32 KB | Legal ToS v1.0 effective 2026-03-11 for sovereign.nyc: operator Israel David / Agape Sovereign, contact `agape@sovereign.nyc`, NUKED/KNOXED/DIFF definitions, user rights, acceptable use. Mirrors `frontend/components/LegalPage.tsx`. |
| `Third-Party_Data_Rectification_Protocol.txt` | Rectification protocol PDF | 5 KB | Same engine spec as the validator PDF (near-duplicate), including the `POST /api/dignity/rectify` API contract. |
| `UNISLOTHconversation-2026-09-20T07-15-48.txt` | Unsloth/Llamba.cpp chat export | 772 KB | Contains the **Identity Vectors Orchestrator** skill: the canonical 16-vector table (V-01…V-16), priority tiers (Critical: V-01/05/07/10/11/12/14/15; High: V-02/03/06/08/09/13; Medium: V-04/16), and the remediation workflow (24h / 1wk / 1mo / ongoing). Also documents the Skills CLI discovery workflow. |
| `architect-ai.txt` | `architect-ai.jsx` source | 74 KB | The original monolithic Architect AI UI prototype (React JSX). Reference implementation for module cards, scanning states, and report generation that the `frontend/` app superseded. |
| `claude092026.txt` | Qwen chat JSON export | 258 KB | Session "Firebase and GCP Deployment Guide" — the instruction set that drove the current `frontend/` + `functions/` build (dual auth, local vault, Drive export, demo bypass). |
| `implementation_plan.txt` | Auth & Export plan MD | 5 KB | Concrete plan now implemented: dual auth panel (passkey + Google), `SaveExportWarningModal`, `localVaultService` (IndexedDB, 26-month rolling window — implemented as 2-year/24-month retention per later spec), `driveExportService` (Drive REST v3, `drive.file` scope), always-visible guest bypass. |
| `privacy.txt` | Privacy Policy (mislabeled .pdf → .docx) | 14 KB | Privacy Policy v1.0: data inventory (OAuth data, WebAuthn credential metadata, operational telemetry), explicit "information we do NOT collect" list, client-side AES encryption, zero plaintext storage, retention, user rights (access/delete/correct/port/restrict), GDPR/CCPA posture. Mirrors `LegalPage.tsx`. |

## Coverage map — corpus → codebase

| Corpus theme | Where it lives in the repo |
|---|---|
| 16 identity vectors + orchestrator workflow | `skills/` (identity-vectors orchestrator), `agents/secure/`, `frontend/module-config.ts` |
| Sovereign Data Pipeline (extract→map→validate→synthesize→audit→report→PDF) | `agents/` (`extraction*`, `data_mapper`, `audit`, `reporting`, `pdf_generation_agent`), `scripts/run-secure-scan.ts` |
| Passkey WebAuthn + session export | `functions/src/auth.ts`, `agents/security/`, `frontend/auth/passkey-service.ts`, `docs/PASSKEY_WEBAUTHN_IMPLEMENTATION.md` |
| Human Dignity / Third-Party Rectification Engine | `frontend/components/DignityRectificationView.tsx`, `docs/corpus/raw/*Rectification*` |
| PWA ↔ Android ↔ MCP bridge | `mcp_server/`, `architect-mcp-server/`, `docs/corpus/raw/PWA_OPERATION_FRAMEWORK_INTEGRATION.txt` |
| Legal (ToS, Privacy) | `frontend/components/LegalPage.tsx`, `docs/corpus/raw/TERMS.txt`, `privacy.txt` |
| Auth + export plan (vault, Drive, guest) | `frontend/services/localVaultService.ts`, `services/auditPdf.ts`, `components/SaveExportWarningModal.tsx`, `implementation_plan.txt` |
| GitHub/GCP agentic automation mandate | `.github/` workflows, `docs/gcp/`, `docs/GCP_OPS_STATUS.md` |
| Local-LLM unlimited-token rationale | `frontend/services/architect.ts` (LOCAL_QWEN → LOCAL_GEMMA → GEMINI → LOCAL_KB chain) |
| NUKED / KNOXED / MONITORED framework | `frontend/services/classification.ts`, surfaced in DashboardView, ModuleInterface, auditPdf |
| Arena alpha sandbox (simulated demo data) | `arena/` → `/alpha` route via `frontend/alpha/ArenaAlphaRoot.tsx`; all exports stamped `ALPHA-SIMULATED` |

See `DISTILLED_KNOWLEDGE.md` for the synthesized operational rules extracted
from this corpus.
