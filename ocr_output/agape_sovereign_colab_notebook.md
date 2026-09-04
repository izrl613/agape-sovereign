# Agape Sovereign AI PWA — Complete System Documentation

**Author:** Agape Sovereign Engineering Team
**Contact:** idin@agape.nyc
**Repository:** github.com/izrl613/agape-sovereign
**Date:** 2026-07-20

---

## TABLE OF CONTENTS

### 📐 SECTION 1: PROJECT OVERVIEW
- 1.1 What is Agape Sovereign?
- 1.2 Core Philosophy — Digital Sovereignty
- 1.3 Target Architecture Diagram
- 1.4 Technology Stack Summary
- 1.5 Compliance Framework (ECRA 2026, GDPR, CCPA)

### 🏗️ SECTION 2: SYSTEM ARCHITECTURE
- 2.1 High-Level Component Map
- 2.2 Zero Trust Perimeter (Cloudflare ZTNA)
- 2.3 The Gatekeeper — Dual Auth Paths
  - 2.3.1 Path A: Google OAuth (Federated)
  - 2.3.2 Path B: WebAuthn Passkey (Anonymous/Local)
  - 2.3.3 SHA-256 Identity Binding
- 2.4 Capacity Management (50-User ZTNA Limit)
- 2.5 Offline State Machine (Service Workers + IndexedDB)

### 🤖 SECTION 3: THE SOVEREIGN DATA PIPELINE (AGENTS)
- 3.1 Pipeline Overview — OrchestratorAgent Flow
- 3.2 Stage 1: IngestionAgent — File Intake & OCR
- 3.3 Stage 2: ExtractionEngine — PDF/Text Parsing
- 3.4 Stage 3: ExtractionAgent — NER & Entity Extraction
- 3.5 Stage 4: DataMapper — Sovereign Field Pattern Mapping
- 3.6 Stage 5: Validator — Normalization & Business Rules
- 3.7 Stage 6: SynthesisAgent — Executive Briefing Generation
- 3.8 Stage 7: AuditAgent — Compliance Scanning
- 3.9 Stage 8: ReportingAgent — Execution Summary
- 3.10 Stage 9: PDFGenerationAgent — Sovereign Report Rendering
- 3.11 Stage 10: SovereignExportAgent — Identity Export & Mnemonic

### 🧠 SECTION 4: SOVEREIGN STATE ENGINE
- 4.1 POAOrchestrator — The Master Control Program
- 4.2 IVMAgent — Identity Verification Module
- 4.3 AIAgent — Local LLM Inference Core
  - 4.3.1 Financial Risk Scoring
  - 4.3.2 Stability Indexing
  - 4.3.3 Composite Audit Score
- 4.4 PDFAgent — Document Guarantee & Integrity Hashing
- 4.5 ExportRecoveryAgent — Digital Passport & BIP-39 Mnemonic
- 4.6 CoreStorageManager — Zero-Retention Policy

### 🔐 SECTION 5: SECURITY ARCHITECTURE
- 5.1 SHA-256 Identity Token Flow
- 5.2 Zero-Knowledge Enclave Design
- 5.3 Memory Cleanup Protocol (Zero-Retention)
- 5.4 Architecture Boundary Enforcement (boundary.py)
- 5.5 Firestore Security Rules (Default Deny)
- 5.6 Storage Security Rules
- 5.7 Audit Trail Immutability

### ☁️ SECTION 6: FIREBASE / GCP INFRASTRUCTURE
- 6.1 GCP Project Overview (agape-sovereign #956088455461)
- 6.2 Cloud Run Services (11 Services)
- 6.3 Firestore Databases (3 Databases)
- 6.4 Cloud Storage Buckets (7 Buckets)
- 6.5 Firebase Auth Providers
- 6.6 Firebase App Hosting
- 6.7 Vertex AI Credit ($1,000, Expires 2027-01-26)
- 6.8 Billing Budget Configuration

### 🔄 SECTION 7: CI/CD & GITHUB ACTIONS
- 7.1 Workflow Inventory (14 Workflows)
- 7.2 Deploy Pipeline (Firebase + Cloud Run)
- 7.3 Compliance Agent (Autonomous Scanning)
- 7.4 Agentic Notator (Auto-Issue Generation)
- 7.5 GCP Monitoring Agent
- 7.6 Security Scan (CodeQL + SAST)
- 7.7 Dependabot & Dependency Management

### 🧪 SECTION 8: LOCAL DEVELOPMENT
- 8.1 LM Studio Setup (qwen3.5-9b-sushi-coder-rl-mlx)
- 8.2 Running the Pipeline Locally
- 8.3 MCP Server (Local LLM Bridge)
- 8.4 Firebase Emulator Suite
- 8.5 VS Code Extension Integration

### 🌐 SECTION 9: PWA FRONTEND
- 9.1 Next.js App Router Structure
- 9.2 Auth Flow (Google + Passkey)
- 9.3 DIFF Scanning (16 Identity Vectors)
- 9.4 Dashboard & Reporting UI
- 9.5 Offline Capabilities

### 📊 SECTION 10: MONITORING & OBSERVABILITY
- 10.1 GCP Monitoring Agent
- 10.2 Daily Infrastructure Reports (PDF)
- 10.3 BigQuery Log Export
- 10.4 Cloud Trace & Error Reporting
- 10.5 Cost Guardian (Budget Alerts)

### 🗺️ SECTION 11: ROADMAP & PHASES
- 11.1 Phase 1: Foundation (Complete)
- 11.2 Phase 2: Core Pipeline (Complete)
- 11.3 Phase 3: Reporting & Infrastructure (Complete)
- 11.4 Phase 4: v2.0 Identity Vectors & Shield Platform
- 11.5 Phase 5: Commercial Launch

### 📝 SECTION 12: APPENDIX
- 12.1 Complete File Tree
- 12.2 All Python Agent Signatures
- 12.3 Firestore Schema Definitions
- 12.4 API Routes Inventory
- 12.5 GitHub Issues Reference (31 Open)
- 12.6 Compliance Certifications
- 12.7 Troubleshooting Guide

---

## 📐 SECTION 1: PROJECT OVERVIEW

### 1.1 What is Agape Sovereign?

Agape Sovereign is a **zero-knowledge, security-first sovereign identity platform** that enables users to scan, analyze, and control their complete digital footprint. It operates on a **local-first AI architecture** where all sensitive data processing occurs on-device via LM Studio, with zero cloud dependency for PII handling.

The platform provides:
- **16-Layer DIFF Scanning** (Digital Identity Federated Footprint)
- **Real-time Privacy Analysis** with NUKED/KNOXED classification
- **SHA-256 Encrypted Audit Reports** with Lighthouse-style scoring
- **Local AI Chat** for privacy guidance (Gemma 4 via LM Studio)
- **Encrypted 2-Year Retention PDF Exports**

### 1.2 Core Philosophy — Digital Sovereignty

> "Fluid freedom with no barriers when it comes to safeguarding privacy and security and final reclamation of a user's digital sovereign identity."

Key principles:
- **Zero-Knowledge**: Plaintext user data never exposed to cloud infra
- **Local-First AI**: All inference runs on-device via LM Studio
- **Portable Identity**: BIP-39 mnemonic recovery, cross-platform
- **Auditable**: Every operation leaves a cryptographic trail
- **ECRA 2026 Compliant**: 2-year retention, right to erasure

### 1.3 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Next.js 15, TailwindCSS | PWA UI |
| Auth | Firebase Auth + WebAuthn/Passkeys | Identity |
| Database | Firestore (NoSQL) | User data |
| Storage | Firebase Storage | PDF reports, backups |
| AI (Local) | LM Studio (qwen3.5-9b) | All PII-adjacent inference |
| AI (Cloud) | Vertex AI Gemini | Document processing only |
| Pipeline | Python (agents/) | Sovereign data workflow |
| CI/CD | GitHub Actions + Cloud Build | Automated deployment |
| Infrastructure | Cloud Run, GCP | Serverless backend |

---

## 🏗️ SECTION 2: SYSTEM ARCHITECTURE

### 2.1 High-Level Component Map

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   Browser   │────▶│  Cloudflare ZTNA  │────▶│ Firebase Auth    │
│   (PWA)     │     │  (Zero Trust)     │     │ Google / Passkey │
└─────────────┘     └───────────────────┘     └───────┬──────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  SHA-256_ID      │
                                              │  (Sovereign Hash)│
                                              └───────┬──────────┘
                                                       │
              ┌────────────────────────────────────────┼────────────────────────┐
              │                                        │                        │
              ▼                                        ▼                        ▼
     ┌────────────────┐                     ┌──────────────────┐     ┌─────────────────┐
     │ Local Pipeline │                     │  Cloud Run       │     │ Firestore /     │
     │ (Python Agents)│                     │  Services (11)   │     │ Storage         │
     │ LM Studio AI   │                     │  gemma4-mcp      │     │                 │
     └────────────────┘                     └──────────────────┘     └─────────────────┘
```

### 2.2 The Gatekeeper — Dual Auth Paths

Two entry points converge to a single SHA-256 identity token:

**Path A: Google OAuth**
1. User clicks "Sign In with Google"
2. Firebase Auth returns JWT claims
3. Critical Hashing Step: `SHA256(JSON_Claims)` → SHA256_ID
4. Raw PII immediately purged from memory
5. Only the hash passes forward

**Path B: WebAuthn Passkey**
1. Device biometric prompt (Touch ID / Face ID)
2. Cryptographic challenge-response
3. Critical Hashing Step: `SHA256(UUID_or_Session_Nonce)` → SHA256_ID
4. Raw UUID immediately purged

**Global State:** `Authenticated(SHA256_ID)` — regardless of entry path

---

## 🤖 SECTION 3: THE SOVEREIGN DATA PIPELINE

### 3.1 Pipeline Overview

The orchestrator runs 10 sequential agent stages:

```
Input → Ingestion → Extraction → Mapping → Validation → Synthesis → Audit → Reporting → PDF → Export
```

All stages are implemented as Python classes in `agents/`. The `OrchestratorAgent` manages the sequence and state transitions.

### 3.2 IngestionAgent

Multi-tier PDF text extraction with graceful fallback:

1. pdftotext (poppler) — fastest for native text PDFs
2. PyMuPDF (fitz) — embedded text extraction
3. Tesseract OCR — image-only / corrupted PDFs
4. Companion .md sidecar — pre-extracted text

### 3.3 ExtractionEngine

Converts file input into structured page-by-page text:

```
Input: /path/to/file.pdf
Output: ExtractedDocument(pages=[...], full_text="...", page_count=N)
```

Supports: PDF (pdfplumber), Markdown, plain text, generic fallback.

### 3.4 ExtractionAgent

Three-tier entity extraction:

**Tier 1 — Regex Fast Path:**
- Names: `[A-Z][a-z]+ [A-Z][a-z]+`
- Dates: ISO 8601, US format, text dates
- Financial: `$[\d,]+(?:\.\d+)?`
- Technical: OAuth, API, PDF, PWA, MCP, JSON, SHA-256, etc.

**Tier 2 — LM Studio LLM:** When regex yields < threshold, calls local model

**Tier 3 — Ollama Fallback:** If LM Studio unavailable

### 3.5 DataMapper

Sovereign-domain pattern mapping using regex patterns:

| Field Pattern | Example Match |
|--------------|---------------|
| `identity_token` | `[A-F0-9]{64}` |
| `sha256_hash` | `SHA-256: abc123...` |
| `user_email` | `user@domain.nyc` |
| `capacity_limit` | `50 user cap` |
| `zero_trust_rule` | `zero-trust: device posture check` |
| `mnemonic_phrase` | `mnemonic: golden river moon...` |
| `firebase_project` | `project_id: agape-sovereign` |
| `domain` | `agape.nyc, sovereign.nyc` |

### 3.6 Validator

Business-rule enforcement and normalization:

- Email validation (RFC 5322 pattern)
- SHA-256 hash format verification (64 hex chars)
- Capacity limit check (max 50 users per ZTNA policy)
- ISO date validation
- Generic deduplication and whitespace normalization

### 3.7 SynthesisAgent

Generates executive briefing using LM Studio. Sections:
- Overview
- Key Objectives
- Critical Risks
- Technical Dependencies
- Security & Privacy Posture
- Recommended Next Actions

Falls back to template-based summary when no LLM is available.

### 3.8 AuditAgent

Compliance scanning against known patterns:
- GDPR references → flags for review
- Contractual deviations → flagged
- Returns: `{issues: [...], status: "reviewed" | "clear"}`

### 3.9 ReportingAgent

Generates execution summary with:
- Run overview
- Source content analysis
- Audit status summary
- Next action recommendations

### 3.10 PDFGenerationAgent

Renders sovereign identity PDF report using reportlab:
- Title page with sovereign watermark
- Executive briefing section
- Data-mapped fields table
- Validation report section
- Audit chain footer
- LLM model attribution

Falls back to plain text if reportlab unavailable.

### 3.11 SovereignExportAgent

The Crown Jewel — identity export and recovery:

```
1. Retention window check (2-year ECRA limit)
2. Build sovereign identity manifest
3. Compute SHA-256 integrity seal
4. Generate BIP-39 mnemonic phrase (12 words)
5. Write sealed manifest
6. Zero out intermediate data in memory
```

---

## 🧠 SECTION 4: SOVEREIGN STATE ENGINE

The `sovereign/` directory contains the complete State Engine:

### 4.1 POAOrchestrator

Master control program managing:
- Identity hash reception
- Capacity checking (50-user ZTNA limit)
- Sequential agent execution (IVM → AI → PDF → Export)
- Memory cleanup on completion
- Error handling with rollback

### 4.2 IVMAgent

Identity Verification Module:
- Takes: SHA256_ID (64-char hex)
- Returns: Raw JSON data payload
- Zero transformation — pure data collection
- Validates hash format before querying

### 4.3 AIAgent

Local LLM inference core with unlimited tokens:
- Financial Risk Scoring (rapid small txns, high-value alerts)
- Stability Indexing (address turnover, account age)
- Composite Audit Score synthesis
- Zero-retention memory cleanup after inference

### 4.4 PDFAgent

Immutable document generator:
- Consumes AIAgent structured JSON output
- Embeds SHA-256 integrity hash in document metadata
- Idempotent: same input → same PDF
- Legal compliance structure

### 4.5 ExportRecoveryAgent

Digital sovereignty manifest:
- Ephemeral key pair generation (local secure enclave)
- Portable identity blueprint
- BIP-39 mnemonic recovery phrase
- 2-year retention enforcement
- Public fingerprint hashing

### 4.6 CoreStorageManager

Zero-retention local cache:
- Platform-aware state directory (macOS: `~/Library/Application Support/`)
- SHA-256 digest persistence only (never raw PII)
- Memory zeroing before deletion
- Atomic secure writes (chmod 600)

---

## 🔐 SECTION 5: SECURITY ARCHITECTURE

### 5.1 SHA-256 Identity Flow

```
User Auth → JWT/Passkey → SHA256(all_claims) → SHA256_ID → Forward to agents
                                                            ↓
                                                    Raw PII purged
                                                    from memory
```

### 5.2 Zero-Knowledge Design

- No plaintext user data at rest (Firestore)
- All PII hashed before leaving client context
- Local LLM handles encrypted SHA-256 data only
- Vertex AI restricted to document processing

### 5.3 Memory Cleanup Protocol

```python
DELETE raw_payload;   // Wipe original data
CLEANED_DATA = NULL;  // Wipe working set
```

Enforced at every agent boundary via CoreStorageManager.purge_sensitive_data().

### 5.4 Architecture Boundary (boundary.py)

```python
VERTEX_ALLOWED_PURPOSES = frozenset(["document_processing", "pdf_rendering"])
```

Runtime enforcement: any agent attempting to route AI reasoning through Vertex AI raises BoundaryViolationError.

### 5.5 Firestore Security Rules

Default deny — user-scoped access only:
```
match /users/{userId} { allow read, write: if isOwner(userId); }
match /{document=**} { allow read, write: if false; }
```

### 5.6 Storage Rules

- PDF reports: owner read only
- Backups: 100MB limit per user
- Audit logs: admin emails only (idin@agape.nyc, agape@sovereign.nyc)
- Temp uploads: 24-hour auto-delete

---

## ☁️ SECTION 6: FIREBASE / GCP INFRASTRUCTURE

### 6.1 GCP Project

- Project ID: `agape-sovereign`
- Project Number: `956088455461`
- Organization: `230005932885`
- Billing: Enabled (account `018175-BBE06D-3B0276`)
- Created: 2026-01-22
- Status: ACTIVE

### 6.2 Cloud Run Services (11)

| Service | URL | Status |
|---------|-----|--------|
| agape-sovereign-ee8f4200 | PWA hosting | ✅ Healthy |
| agape-sovereign-server | Backend Node.js | ✅ Healthy |
| authapi | Auth API | ✅ Reachable |
| gemma4-mcp-server | ML/AI bridge | ✅ Healthy |
| cleanupauditlogs | Maintenance | ✅ |
| fetchanalyticsdata | Analytics | ✅ |
| generatediffreport | Report gen | ✅ |
| generateecraoptout | Compliance | ✅ |
| generatepasskeychallenge | Auth | ✅ |
| generatepolicydocument | Policy | ✅ |
| recalculatesovereignscore | Scoring | ✅ |

### 6.3 Firestore Databases

| Database | Type | Location |
|----------|------|----------|
| agape-sovereign | FIRESTORE_NATIVE | nam7 (primary) |
| (default) | FIRESTORE_NATIVE | nam5 (legacy) |
| ai-studio-allinoneprivac-* | FIRESTORE_NATIVE | us-west1 |

### 6.4 Vertex AI Credit

- Balance: **$1,000.00**
- Used: **$0.02**
- Expires: **2027-01-26**
- Scope: Vertex AI API calls only (not Cloud Run compute)

---

## 🔄 SECTION 7: CI/CD & GITHUB ACTIONS

### 7.1 Workflow Inventory (14 Total)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| deploy.yml | Push main, PR, daily | Full Firebase deploy |
| security-scan.yml | Push main, PR, weekly | CodeQL + SAST |
| compliance.yml | Push main, PR, weekly | Compliance gate |
| compliance-agent.yml | Weekly Sunday | Autonomous compliance scan |
| agentic-notator.yml | Push main, daily 06:00 | Auto-issue generation |
| agentic-sovereign-updater.yml | Push main, every 6h | Issue triage, wiki sync |
| daily-report.yml | Daily 12:00 UTC | PDF report + email |
| gcp-monitoring-agent.yml | Daily 14:17 UTC | Platform health scan |
| deploy-mcp-server.yml | Push main (mcp_server/) | MCP Cloud Run deploy |
| firebase-hosting-merge.yml | Push main | Hosting deploy |
| firebase-hosting-pull-request.yml | PR | Hosting preview |
| timeline-sync.yml | Daily 06:00 UTC | Timeline sync |
| Dependabot Updates | Automatic | Dependency updates |
| Dependency Graph | Automatic | Graph generation |

### 7.2 GitHub Repository

- URL: `github.com/izrl613/agape-sovereign`
- Visibility: Public
- Default branch: `main`
- Open issues: **31**
- Stars: 1
- Discussions: 1
- Active branches: 25+
- Last push: 2026-07-21

---

## 🧪 SECTION 8: LOCAL DEVELOPMENT

### 8.1 Running the Pipeline

```bash
# Check LLM status
python3 run_pipeline.py --llm-status

# Run pipeline against a plan file
python3 run_pipeline.py --source path/to/plan.md

# Run with sovereign export
python3 run_pipeline.py --source path/to/plan.md --export

# Custom output directory
python3 run_pipeline.py --source path/to/plan.md --out ./my_run
```

### 8.2 LM Studio Setup

- Model: `qwen3.5-9b-sushi-coder-rl-mlx`
- API: `http://localhost:1234/v1`
- Fallback: Ollama `qwen2.5-coder:7b` at `http://localhost:11434`

### 8.3 MCP Server

- Location: `mcp_server/server.py`
- Protocol: JSON-RPC 2.0 over HTTP
- Endpoint: `http://localhost:5005/mcp`
- Docker: `mcp_server/Dockerfile`

---

## 🌐 SECTION 9: PWA FRONTEND

### 9.1 Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- TailwindCSS with neon gradient theme
- WebAuthn API for passkeys
- Service Workers for offline support
- IndexedDB for local state persistence

### 9.2 Auth Flow

1. Landing → Sign In with Google or Passkey
2. Firebase Auth → JWT or challenge-response
3. SHA-256 binding → Sovereign identity hash
4. Dashboard access with capacity check

### 9.3 16-Layer DIFF Scanning

| Vector | Name | Scope |
|--------|------|-------|
| V-01 | Email Breach Scanner | Breaches, metadata |
| V-02 | Social Media Footprint | Username reuse, scraping |
| V-03 | Device File Scan | Local & cloud files |
| V-04 | Mobile Security | Passkey, 2FA |
| V-05 | Deep Web Exposure | Pattern monitoring |
| V-06 | Data Broker Removal | Removal templates |
| V-07 | Password Vault | Weak credentials |
| V-08 | Location Data | GPS history |
| V-09 | Browser Tracking | 3rd-party cookies |
| V-10 | Financial Identity | Banking leaks |
| V-11 | Medical Data | Health records |
| V-12 | Voice & Biometric | Biometric samples |
| V-13 | IoT Devices | Smart device audit |
| V-14 | Cloud Storage | Drive, iCloud |
| V-15 | Dark Web | Credential indexing |
| V-16 | Behavioral Profile | Inferred demographics |

---

## 📊 SECTION 10: MONITORING & OBSERVABILITY

### 10.1 GCP Monitoring Agent

Daily scan of:
- 5 Cloud Run services (HTTP health probes)
- LM Studio availability
- Pipeline filesystem health
- Cost recommendations

### 10.2 Daily Reports

PDF generation via `agents/daily_report_agent.py`:
- Cloud Run status table
- Cloud Functions inventory
- Firestore databases
- Storage buckets
- Enabled APIs (60+)
- Billing budgets
- Local AI status
- GitHub Actions recent runs

### 10.3 BigQuery Log Export

- Sink: `bq-operational-logs`
- Dataset: `agape_sovereign_analytics`
- Zero-cost queries (1 TB/month free tier)

---

## 🗺️ SECTION 11: ROADMAP

### Completed Phases:
- ✅ Phase 1: Foundation (Auth, Gatekeeper, Capacity)
- ✅ Phase 2: Core Pipeline (IVM → AI → PDF → Export)
- ✅ Phase 3: Reporting & Infrastructure (PDF, Monitoring)

### In Progress:
- 🔄 Phase 4: v2.0 Identity Vectors & Shield Platform
- 🔄 Phase 5: Commercial Launch Preparation

### Open Issues (31):
- 21 Dependabot dependency updates
- Compliance agent findings
- Feature requests (DIFF scanning, reporting)
- Infrastructure improvements

---

## 📝 SECTION 12: APPENDIX

### 12.1 File Tree (Top-Level)

```
agape-sovereign/
├── agents/          (Python pipeline agents)
├── sovereign/       (Sovereign State Engine)
├── architectai/     (Google ADK agents)
├── functions/       (Firebase Cloud Functions)
├── frontend/        (React PWA frontend)
├── backend/         (Node.js Genkit backend)
├── src/             (PWA main source)
├── docs/            (Documentation)
├── .github/         (CI/CD workflows)
├── terraform/       (Infrastructure as code)
├── mcp_server/      (Local LLM bridge)
├── local-llm-pwa/   (Standalone PWA)
├── scripts/         (Utility scripts)
└── workspace_outputs/ (Pipeline artifacts)
```

### 12.2 All Python Agent Signatures

```python
# agents/orchestrator.py
class OrchestratorAgent:
    def run(self, plan_source, enable_export=False) -> dict: ...

# agents/extraction_engine.py
class ExtractionEngine:
    def extract(self, source_path: str) -> ExtractedDocument: ...

# agents/extraction.py
class ExtractionAgent:
    def run(self, text: str) -> ExtractionResult: ...

# agents/data_mapper.py
class DataMapper:
    def map(self, text, page_hints=None) -> list[MappedRecord]: ...
    def to_dict(self, records) -> dict[str, list[str]]: ...

# agents/validator.py
class Validator:
    def validate(self, mapped: dict) -> ValidationReport: ...

# agents/synthesis.py
class SynthesisAgent:
    def run(self, plan_text, extraction) -> str: ...

# agents/audit.py
class AuditAgent:
    def run(self, plan_text) -> dict: ...

# agents/reporting.py
class ReportingAgent:
    def run(self, plan_text, extraction, audit) -> str: ...

# agents/pdf_generation_agent.py
class PDFGenerationAgent:
    def generate(self, run_id, briefing, mapped_fields, ...) -> str: ...

# agents/sovereign_export.py
class SovereignExportAgent:
    def run(self, user_id, extraction_data, output_dir) -> dict: ...

# agents/core_storage.py
class CoreStorageManager:
    def save_session_state(self, key, data): ...
    def retrieve_session_state(self, key): ...
    def purge_sensitive_data(self, keys): ...
    @staticmethod def sha256_id(raw_value) -> str: ...

# agents/boundary.py
class BoundaryViolationError(RuntimeError): ...
def assert_not_vertex(url, purpose=None): ...
def assert_local_llm(url): ...
```

### 12.3 Firestore Collections

```
/users/{userId}                  → User profile, settings
/users/{userId}/modules/{id}     → Module data
/users/{userId}/passwords/{id}   → Password vault
/users/{userId}/messages/{id}    → Messages
/users/{userId}/vault/{id}       → Identity vault
/users/{userId}/trackers/{id}    → Tracker data
/users/{userId}/auditLogs/{id}   → Audit trail
/diff_scans/{scanId}             → DIFF scan results
/diff_reports/{reportId}         → Generated reports
/audit_logs/{logId}              → Admin audit logs
/pipeline_runs/{runId}           → Pipeline execution records
```

### 12.4 Known Issues

- Firebase CLI not authenticated (cannot deploy from CLI)
- GitHub CLI not authenticated (cannot create PRs/issues from CLI)
- 3 Firestore databases; 1 potentially unused (`ai-studio-*`)
- GitHub wiki not enabled
- LM Studio offline (local AI falls back to template mode)
- Some CI/CD workflows failing due to build config

---

*End of Document — Agape Sovereign AI PWA v1.0*
*Generated 2026-07-20 | Agent: Invoko Autonomous Pipeline*
*Repository: github.com/izrl613/agape-sovereign*
