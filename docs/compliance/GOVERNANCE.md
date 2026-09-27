# Governance & Compliance Gates

## Pull Requests

- Every PR must link to an Issue (e.g., `Fixes #123`).
- PRs that introduce high-cost operations must document mitigation (pagination, caching, index strategy).

## Required Review Areas (when touched)

- `firestore.rules` / `storage.rules`: access control and data retention safety
- `functions/`: privileged operations and logging
- `frontend/`: auth gating and PII exposure in UI

## Repository Artifacts

- Issue templates: `.github/ISSUE_TEMPLATE/`
- PR template: `.github/PULL_REQUEST_TEMPLATE.md`
- CI compliance gates: `.github/workflows/`

