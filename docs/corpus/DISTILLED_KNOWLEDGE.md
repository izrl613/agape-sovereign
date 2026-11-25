# Distilled Knowledge — Agape Sovereign Corpus

Synthesized operational rules extracted from `docs/corpus/raw/`. These are the
authoritative intents behind the codebase; when code and corpus disagree, the
corpus records *why* the system was designed the way it was.

## 1. Sovereign Data Pipeline contract

The canonical ingestion pipeline (from `Sovereign_Data_Pipeline_Defined`) is a
three-module transactional contract:

1. **Module 1 — Extraction/Ingestion**: source documents are chunked into
   `PageChunk` objects; each chunk is processed transactionally and committed
   per page. `finalize_document_integrity()` compiles the body only after all
   chunks validate against the schema contract.
2. **Module 2 — AIAgent (core logic)**: produces structured analysis including
   `calculate_composite_score(risk, stability)` and `clean_memory(data)` —
   memory hygiene is a first-class pipeline stage, not an afterthought.
3. **Module 3 — PDFGenerationAgent**: renders the structured report into the
   final auditable PDF. It depends on Module 2's perfectly formed output —
   never on raw chunks.

Orchestration runs 9 stages end-to-end (verified 2026-07-19):
ExtractionEngine → ExtractionAgent (NER/LLM) → DataMapper → Dict →
Validator (schema/normalization) → SynthesisAgent (local LLM executive
briefing) → AuditAgent → ReportingAgent → PDFGenerationAgent.

**Rule:** every pipeline run must emit `workflow_report.json`,
`executive_briefing.md`, `execution_summary.md`, and a validation verdict
(0 warnings / 0 errors target).

## 2. Identity Vectors Orchestrator

Canonical 16-vector table (V-01…V-16) and priority tiers from the Unsloth
orchestrator export:

- **Critical (act within 24h):** V-01 Email Breach, V-05 Deep Web, V-07
  Password Vault, V-10 Financial, V-11 Medical, V-12 Voice/Biometric, V-14
  Cloud Storage, V-15 Dark Web.
- **High (within 1 week):** V-02 Social, V-03 Device Files, V-06 Data Broker,
  V-08 Location, V-09 Browser/Cookies, V-13 IoT.
- **Medium (ongoing monitoring):** V-04 Mobile Security, V-16 Behavioral.

Remediation plan shape: immediate (<24h) → short-term (<1wk) → long-term
(<1mo) → ongoing monitoring.

## 3. Security & zero-knowledge mandates

- User data is hashed (SHA-256) and AES-256-GCM encrypted **on-device**
  before anything is stored. Servers — including Agape Firestore and the
  operator — only ever hold ciphertext plus SHA-256 receipt IDs.
- Sensitive fields (document numbers, policy numbers, passwords) **never
  leave the device** and are excluded from verification APIs.
- The only permitted remote checks are keyless/k-anonymity: XposedOrNot
  breach corpus, Have I Been Pwned range (first 5 of 40 hash chars), GitHub
  public API, Cloudflare DoH MX, ipwho.is, mempool.space, public ETH RPC,
  OpenStreetMap Nominatim/Photon.
- Passkey (FIDO2/WebAuthn) is auth method #1; Google OAuth is #2 and adds
  `drive.file`-scoped PDF export. Apple ID is the federation target.
- Admin portal is restricted to operator identities (`idin@agape.nyc`,
  `agape@sovereign.nyc`) and passkey-gated; it must never expose plaintext
  user data.

## 4. Cost guardrails (near-zero / free-tier)

- Firebase Spark tier only: Hosting, Auth, Firestore (50K reads/day),
  Storage (5 GB), Functions, App Check, Remote Config.
- Cloud Functions Node.js 22; Gemini free tier (60 RPM) only as a *fallback*
  behind local LLM.
- Primary AI path is offline: LM Studio/Ollama local model
  (`qwen3-vl:4b`, fallback `gemma4:12b`) — the "unlimited tokens, no paid
  wall" requirement from the Architect-AI-IDE export.
- GitHub/GCP automation mandate: agentic workflows may use the GCP credit
  balance but all monitoring/logging must stay on free services.

## 5. Report & retention rules

- Identity Audit PDF: Lighthouse-style, includes per-module SHA-256
  receipt IDs, Sovereign Score, verification sources, timestamp, and cloud
  audit ID. Retention window: **2 years** in the user profile (earlier plan
  said 26 months — the shipped spec is 2 years; treat 26 months as the
  minimum rolling checkpoint interval).
- `SaveExportWarningModal` must precede every export and state destination
  (device vault / Google Drive / download) + retention + zero-knowledge
  reminder.
- Local vault = IndexedDB encrypted store, per-UID, with automatic pruning.

## 6. Legal posture

- Operator: Israel David, Agape Sovereign — `agape@sovereign.nyc`,
  `sovereign.nyc`. ToS effective 2026-03-11 v1.0.
- Privacy Policy inventory: collects OAuth identity data, WebAuthn
  credential *metadata* (never private keys), operational telemetry.
  Explicitly does NOT collect: plaintext identity entries, passwords,
  document numbers, browsing history.
- Compliance alignment: GDPR (Arts. 16/17), CCPA (§1798.105), UDHR Art. 12,
  conceptual ECRA 2026 framework.
- Third-Party Data Rectification Engine: users may file SSI correction
  claims against stale/discriminatory records; validator nodes issue signed
  Rectification Certificates and recompute a Human Dignity Index (HDI).
  Endpoint sketch: `POST /api/dignity/rectify`.

## 7. UX flowmap contract (from OPERATION FRAMEWORK)

Every user-facing flow must define: starting trigger, sequential steps,
decision points (IF/THEN/ELSE), pain points + graceful error recovery, and
the success state. Design reviews that lack these five elements are
incomplete.

## 8. Known secrets-class artifacts

- The `Pasted 2026-09-20 at 16.15.24.textClipping` source contains a single
  license-style token. It has been **excluded from the corpus** and blocked
  by `.gitignore`. If it is a live credential it should be rotated.
