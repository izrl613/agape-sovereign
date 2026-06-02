# GitHub Tracking Drafts

Use these drafts when GitHub access is available again. Do not create duplicates; update existing artifacts if they already exist.

## Meta Issue

- Title: `Agape Sovereign: Compliance Roadmap`
- Body:

```md
Tracks implementation of the compliance roadmap in Foundation -> Stage 3 order.

## Stage Issues

- [ ] Foundation
- [ ] Stage 1 — Data Collection Front-End
- [ ] Stage 2 — Analysis Core
- [ ] Stage 3 — Reporting + Infrastructure

## Related Operational Threads

- [ ] Daily Compliance Monitor
- [ ] agape-sovereign: GCP change request (approval required)

## Current Local Progress

- Foundation repo hygiene and CI guardrails landed locally on `roadmap-2026-06-02`
- Stage 1 data-minimization UI messaging and explicit save consent landed locally on `roadmap-2026-06-02`

## Rules

- No changes will be applied in GCP automatically.
- Non-Firebase GCP work must stay manual and be documented in the GCP approval issue.
```

## Stage Issues

### Foundation

- Title: `agape-sovereign: Foundation compliance guardrails`
- Body:

```md
Roadmap section: Foundation (Governance + Guardrails)

## Scope

- PR template aligned to governance
- Issue templates for roadmap work and GCP change approvals
- CI compliance workflow
- Manual-only Firebase deploy workflow

## Acceptance checklist

- [ ] PRs link to issues
- [ ] Firebase security artifacts are checked in CI
- [ ] Automatic non-Firebase GCP automation is blocked
- [ ] Secret-like files are blocked in repo workflows
```

### Stage 1

- Title: `agape-sovereign: Stage 1 explicit save consent and ephemeral defaults`
- Body:

```md
Roadmap section: Stage 1 — Data Collection Front-End

## Scope

- Make data handling explicit in auth and module views
- Keep analysis ephemeral by default
- Require explicit opt-in before saving monitored emails or profile-linked findings

## Acceptance checklist

- [ ] Auth flow explains ephemeral-by-default handling
- [ ] Module detail view explains in-session handling
- [ ] Profile save action requires explicit consent
- [ ] No external transmission of sensitive user data is implied without consent
```

### Stage 2

- Title: `agape-sovereign: Stage 2 sovereign score transparency and classification logging`
- Body:

```md
Roadmap section: Stage 2 — Analysis Core

## Scope

- Document or implement transparent Sovereign Score inputs
- Ensure NUKED / KNOXED / MONITORED classification logic is inspectable
- Add logging guidance that avoids hidden scoring behavior

## Acceptance checklist

- [ ] Score model is documented in repo artifacts
- [ ] Classification outputs are named consistently
- [ ] Logging guidance preserves privacy and explainability
```

### Stage 3

- Title: `agape-sovereign: Stage 3 passkey-only admin and immutable audit trail`
- Body:

```md
Roadmap section: Stage 3 — Reporting + Infrastructure

## Scope

- Enforce passkey-only admin access for approved admin emails
- Strengthen audit log immutability messaging and implementation notes
- Keep reporting and infrastructure work within Firebase-only automation boundaries

## Acceptance checklist

- [ ] Admin access path is limited to approved emails
- [ ] Passkey-only flow is documented or enforced
- [ ] Audit trail behavior is immutable by default
- [ ] Any non-Firebase GCP dependencies remain manual-only
```

## GCP Change Request Issue

- Title: `agape-sovereign: GCP change request (approval required)`
- Body:

```md
No changes will be applied in GCP automatically.

## Requested change

Document any Cloud Run, Cloud Build, Artifact Registry, or other non-Firebase GCP work here.

## Cost-risk notes and free-tier constraints

- Stay within a strict zero-cost posture unless a maintainer explicitly approves otherwise.
- Do not enable always-on compute, paid build capacity, managed registries, or background services automatically.
- Prefer Firebase-native controls when possible.

## Manual maintainer steps

1. Review the requested change and confirm why Firebase-only alternatives are insufficient.
2. Confirm written approval before any GCP action.
3. Apply the change manually in GCP.
4. Record resource IDs, spend controls, rollback steps, and verification evidence in this issue.
```

## PR Draft

- Title: `agape-sovereign: stage 1 consent and zero-cost messaging`
- Body:

```md
## Summary

- advances Stage 1 data-minimization UI work
- makes explicit-save consent visible in the profile flow
- aligns admin messaging with the zero-cost Firebase-only automation policy

## Compliance Link

- Fixes #(Stage 1 issue)

## Roadmap Checklist

- [ ] Foundation
- [x] Stage 1
- [ ] Stage 2
- [ ] Stage 3

## Required Review Areas

- [ ] frontend/

## Zero-Cost GCP Check

- [x] No non-Firebase GCP services were created, configured, deployed, or called automatically
- [x] Any non-Firebase GCP work remains documentation-only

## Validation

- [x] `npm run build`
```
