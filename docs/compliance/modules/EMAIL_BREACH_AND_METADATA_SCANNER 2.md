# Stage 1A1 — Email Breach & Metadata Scanner (Spec)

## Goal

Given a user-provided email address (or alias), classify its exposure posture and produce actionable steps:

- **NUKED**: evidence of breach exposure or risky reuse → remediation plan
- **KNOXED**: no active exposure evidence or exposure mitigated → hardening/monitoring plan

## Inputs

- User email (primary) and optional aliases
- Optional user context (provider hints, reuse/mfa flags, last rotation date)

## Outputs

- Classification: `NUKED | KNOXED | MONITORED`
- Evidence summary (sources, timestamps, confidence)
- Remediation plan (priority ordered)
- Sovereign Score delta contribution

## Data Handling

- Default to **ephemeral** analysis results unless the user explicitly saves to their profile.
- Store only the minimum required fields to power future remediation and scoring.

## Minimal Firestore Data Model (suggested)

- `users/{uid}/monitoredEmails/{id}`
  - `email` (string)
  - `status` (`active|paused`)
  - `createdAt` (timestamp)
- `diff_scans/{scanId}`
  - `userId` (string)
  - `timestamp` (timestamp)
  - `module` = `email_breach_scanner`
- `diff_scans/{scanId}/findings/{findingId}`
  - `severity`, `classification`, `summary`, `createdAt`

## UX

- Provide a single “Scan” action, then show:
  - top classification banner
  - key evidence (if any)
  - 3–7 recommended actions
  - “Save to profile” explicit consent step

