# Architect AI — Agape Sovereign Enclave

**Product:** Digital Identity Federated Footprint (DIFF) privacy and security intelligence  
**Status:** Foundation specification / implementation blueprint  
**Primary repository:** `izrl613/agape-sovereign`

Architect AI is the intelligence layer of Agape Sovereign. It helps an authenticated user inventory, understand, and improve their digital identity exposure across explicitly authorized sources. It presents evidence, explains risk, recommends remediation, and tracks whether an exposure is **NUKED** (removed or remediation completed and verified) or **KNOXED** (protected, restricted, encrypted, or otherwise mitigated).

> **Truth-in-status rule:** A status is never presented as verified merely because a scan was requested or a recommendation was generated. Findings carry evidence, source, scan time, confidence, and verification state. “NUKED” means removal was confirmed by a reliable source or manually attested; “KNOXED” means the control was checked and evidence recorded. Otherwise use “ACTION REQUIRED” or “MONITORING.”

## Product principles

1. **User sovereignty:** user-authorized data only; revocable source connections; export and deletion controls.
2. **Data minimization:** collect the smallest metadata/evidence needed; avoid storing raw mailbox, social, or device contents by default.
3. **Least privilege:** each user can access only their own records; privileged operations run server-side.
4. **Explainability:** every risk score and recommendation links to its underlying finding and evidence.
5. **No false promises:** no claim of complete dark-web visibility, universal device scanning, guaranteed removal, or guaranteed real-time coverage.
6. **Cost transparency:** design for a $0 local development/demo path and free quotas where available. Production Firebase Functions and some Google Cloud integrations generally require the Blaze billing plan; quotas are not a guarantee of a permanently free deployment.

## User experience

### Primary navigation

- **Overview** — Sovereign Score, exposure summary, recent scans, remediation queue.
- **Sources** — connect, authorize, pause, revoke, and inspect connected identity sources.
- **Email Back Scan** — user-authorized breach/exposure checks and mailbox metadata analysis where supported.
- **Social Footprint** — account inventory, public-post review, username reuse and privacy settings.
- **Device & Files** — user-selected files, metadata checks, and device-security checklist.
- **Exposure Monitor** — public-source and supported breach intelligence; clearly disclose coverage limits.
- **NUKED / KNOXED** — remediation workflow, evidence, verification, and history.
- **Architect AI** — conversational security/privacy assistant grounded in the user's own findings and approved public information.
- **Reports** — accessible PDF and machine-readable exports.
- **Admin / Node Health** — restricted operational telemetry, security events, quota and service health. No unrestricted access to user content.

### Main flow

1. User signs in with Firebase Authentication (Google or configured Apple provider).
2. User registers a passkey through a supported WebAuthn implementation. Passkeys are an additional step-up control; they do not replace server-side authorization.
3. User chooses which sources to connect and grants only the requested scopes.
4. The user starts a scan or selects files. Browser apps cannot silently scan a whole phone, laptop, or local drive; use browser file pickers, provider APIs, or an explicitly installed companion agent.
5. Scan jobs normalize evidence into DIFF findings.
6. Findings receive severity, confidence, source, and remediation guidance.
7. User marks a finding for NUKED or KNOXED remediation; automated actions require provider support and explicit confirmation.
8. Verification updates status and the Sovereign Score.
9. User asks Architect AI questions or exports a timestamped report.

## Technology baseline

The repository already contains a React/TypeScript frontend and Firebase project scaffolding. Extend its existing structure and conventions rather than introducing a second frontend.

- **Frontend:** React, TypeScript, Vite (reuse existing frontend app), responsive PWA layout.
- **Identity:** Firebase Authentication; Google sign-in and Apple sign-in only after provider configuration; existing WebAuthn/passkey implementation.
- **Data:** Cloud Firestore for user-owned metadata, scan jobs, findings, report metadata, and audit events.
- **Files:** Firebase Storage for user-approved uploads and generated reports, with strict Storage Rules and lifecycle cleanup.
- **Server:** Firebase Cloud Functions v2 for trusted operations, scheduled checks, report generation, and AI gateway calls.
- **Abuse protection:** Firebase App Check where supported; callable auth checks, rate limits, schema validation, and quotas.
- **AI:** Gemini through a server-side gateway. Never put API keys in browser code. Send only the minimum redacted context needed.
- **Observability:** structured Cloud Logging and privacy-safe operational metrics; avoid logging sensitive payloads.

## Firebase data model

See [Firestore schema](./firestore-schema.md). All user data is partitioned under `users/{uid}`. Server-managed collections are not client-writable. Admin metrics are isolated from user content and require a trusted custom claim.

## Security

See [Security Rules template](./firestore.rules.template). The template is intentionally deny-by-default for privileged collections. Review it against the deployed schema and test with the Firebase Emulator Suite before deployment. Firestore Rules are not filters: every query must satisfy the rules.

Additional requirements:
- Store OAuth tokens only in a server-controlled secret/token store; never in readable profile documents.
- Encrypt sensitive values before persistence when the product truly needs to retain them; define key ownership and recovery before claiming end-to-end or zero-knowledge encryption.
- Use short-lived signed URLs for report downloads and enforce owner checks before issuing them.
- Keep passkey credential registration/challenge verification on trusted server endpoints.
- Require App Check and authenticated identity for callable endpoints; apply per-user rate limits.
- Record security-relevant actions in append-only audit records.
- Provide account export and deletion workflows, including Storage objects and scheduled jobs.

## NUKED / KNOXED state model

| State | Meaning |
|---|---|
| `DETECTED` | Evidence indicates an exposure or weak control. |
| `ACTION_REQUIRED` | A user-approved remediation is needed. |
| `NUKED_PENDING` | Removal request submitted; not yet verified. |
| `NUKED_VERIFIED` | Removal confirmed with dated evidence. |
| `KNOXED_PENDING` | A protection action is underway. |
| `KNOXED_VERIFIED` | Protection control verified with dated evidence. |
| `MONITORING` | No immediate action; continue periodic checks. |
| `FALSE_POSITIVE` | Reviewed and dismissed with a reason. |

## Sovereign Score

The score is an explainable product indicator, not a certified security rating. Version the scoring algorithm and store the component breakdown. Do not use missing scan coverage as evidence of safety. A score must display scan coverage, last scan time, and unresolved high-severity findings alongside the number.

## PDF report

Generate reports server-side from a consistent snapshot. Include:
- report ID, generation time, scan coverage and data freshness;
- executive summary and versioned Sovereign Score methodology;
- source inventory and permission/scope status;
- findings grouped by severity and NUKED/KNOXED state;
- evidence references and remediation history;
- limitations, unscanned sources, and user actions required.

Store the PDF in a private Storage path such as `users/{uid}/reports/{reportId}.pdf`; store only metadata in Firestore. Use an owner-checked callable function to create a short-lived download URL.

## Cost / free-tier operating model

A strictly zero-cost, always-on production promise is not technically reliable:
- Firebase Authentication, Firestore, Hosting, and some Storage usage may fit no-cost quotas depending on region, plan, and usage.
- Cloud Functions deployment generally requires the Blaze (pay-as-you-go) plan and a linked billing account, even when usage remains within included no-cost allowances.
- Gemini API free-tier availability, rate limits, model access, and data terms can change.
- Apple Developer enrollment may be required for some Apple sign-in configurations.
- Email/social providers may impose API approval, quotas, or paid plans.

**Build requirement:** provide a local emulator/demo mode that runs without paid services; keep optional cloud/AI integrations disabled until configured; set budgets, quotas, retention, and rate limits before enabling billing. Never silently switch to a paid service.

## Local development

Use the repository's existing root scripts and Firebase configuration. Typical workflow:

```bash
npm install
npm run dev
npm run build
npm run check
```

For Firebase local development, install the Firebase CLI and use the repository's configured emulator scripts. Before deployment:

1. Configure Firebase project aliases and environment-specific secrets.
2. Review Firestore and Storage Rules.
3. Run Emulator Suite rules tests.
4. Build frontend and Functions.
5. Confirm billing plan, quotas, budget alerts, region, retention, and provider permissions.
6. Deploy only the required Firebase targets.

## Delivery checklist

- [ ] Source authorization, revocation, and scope display.
- [ ] User-isolated Firestore and Storage rules.
- [ ] Passkey challenge lifecycle and step-up authorization.
- [ ] Scan-job queue, idempotency, retries, and cancellation.
- [ ] Evidence-backed DIFF findings and state transitions.
- [ ] Gemini gateway with redaction, safety, quotas, and audit metadata.
- [ ] Admin telemetry separated from private user content.
- [ ] PDF snapshot generation and owner-checked download.
- [ ] Emulator tests, accessibility, responsive UI, and cost guardrails.
