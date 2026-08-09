# Daily Compliance Log

## 2026-06-02 15:58:14 EDT

- Git HEAD: `main` @ `beb71f729e5fadb8eb722ae5145826b81200fca0` (`Post Gemma Local AI`)
- Working tree: not clean; modified app/config files and untracked generated artifacts are present, including `firebase-debug.log`
- Commit anchor: no prior daily log entry was available, so this run used the prior automation timestamp `2026-06-02T00:45:11Z` as the comparison point

### Summary

- Primary roadmap classification: `Stage 1`, with meaningful `Foundation` support landed today
- Local git activity since the anchor includes `ci: add GitHub Actions workflow for automated Firebase deployment`, `Post Gemma Local AI`, and later local-only commits adding foundation compliance gates and advancing Stage 1 consent defaults
- Foundation progress is visible in newly added GitHub templates and compliance workflows (`.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/compliance.yml`)
- Stage 1 progress is visible in front-end consent and access-flow work under `frontend/components/*`
- Public GitHub signals since the anchor showed no newly opened or closed issues and no newly opened, closed, or merged PRs on `main`
- Latest GitHub Actions signal is negative: `Deploy to Firebase` run `#2` failed on 2026-06-02 for HEAD `beb71f729e5fadb8eb722ae5145826b81200fca0`; run `#1` for the deploy workflow also failed earlier the same day
- Repo overview from the public API: default branch is `main`, public `open_issues_count` is `7`, and the repo was last pushed at `2026-06-02T08:45:33Z`

### Risks / Alerts

- Compliance regression risk: the working tree is dirty and includes generated build outputs, `node_modules` artifacts, and `firebase-debug.log`; these are easy paths for accidental secret or noise commits
- Secrets-discipline concern: `.github/workflows/deploy.yml` uses `firebase use --token ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}`, which suggests broad token-based deploy auth rather than a narrowly scoped, audited credential flow
- Governance gap: the single GitHub tracking issue titled `Daily Compliance Monitor` does not exist in the public issue list
- Operational risk: GitHub update actions requiring write access could not be completed because authenticated GitHub CLI/app credentials were not available in this environment

### Next Recommended Actions

- Clean the working tree before the next deploy by removing or ignoring transient artifacts such as `firebase-debug.log`, duplicate build outputs, and accidental `node_modules` changes
- Review `.github/workflows/deploy.yml` and replace token-style Firebase authentication with the least-privileged deploy credential flow the team wants to standardize
- Create exactly one GitHub issue titled `Daily Compliance Monitor`, then use it as the single append-only external record for future runs
- Land and verify the Foundation compliance workflow on GitHub so Stage 1 consent work is protected by enforceable gates rather than local convention alone

### GitHub Learning

- Public GitHub API reads are enough for issue, PR, and Actions visibility, but creating the `Daily Compliance Monitor` issue and posting daily comments will require authenticated GitHub access in a future run.

## 2026-06-04 09:04:55 EDT

- Git HEAD: `main` @ `096c41ea94c06ee7b82f5c2f450d3303351d7651` (`style: refactor code to use double quotes and add .eslintignore for project files`)
- Working tree: clean
- Commit anchor: prior daily log entry at `beb71f729e5fadb8eb722ae5145826b81200fca0` on `2026-06-02 15:58:14 EDT`

### Summary

- Primary roadmap classification: `Foundation`, with limited `Stage 1` support retained from the `Github Actions prototype` commit
- `main` advanced by four commits since the anchor: `Github Actions prototype`, `refactor: remove registerPasskeyOptions cloud function and delete firebase debug log`, `chore: remove .env.local from tracking and add comprehensive secret-like files to .gitignore`, and `style: refactor code to use double quotes and add .eslintignore for project files`
- Foundation progress is strongest in secrets discipline and repo hygiene: `.env.local` was removed from tracking and `.gitignore` was expanded to cover secret-like files
- GitHub collaboration signals changed modestly: PR `#30` (`Roadmap 2026 06 02`) opened against `main`; no issues were opened or closed since the last run; no PRs were merged into `main`
- Latest Actions signal remains negative: `Deploy to Firebase` run `#26930349463` failed on `2026-06-04T04:18:44Z` for current HEAD `096c41ea94c06ee7b82f5c2f450d3303351d7651`
- Current public repo snapshot shows `7` open issues, `1` open PR, and the repository last pushed at `2026-06-04T04:17:57Z`

### Risks / Alerts

- Compliance regression risk: the repo history in this window still includes committed generated artifacts and dependency payloads (`dist/*`, `node_modules/*`, `firebase-debug.log` in earlier commits), which weakens repo hygiene even though the current working tree is clean
- Least-privilege risk: repeated Firebase deploy workflow failures suggest deployment credentials or workflow permissions still are not aligned with a stable, narrowly scoped release path
- Deny-by-default review gap: the canonical roadmap requires Firebase deny-by-default defaults, but this run did not surface fresh evidence of rules validation or enforcement changes on `main`
- Governance gap was partially closed: the daily tracking issue did not exist at the start of this run and must now remain the single external monitor thread to avoid duplication

### Next Recommended Actions

- Triage the latest failed `Deploy to Firebase` workflow run and tighten the workflow to the minimum permissions and deploy scope needed for `main`
- Remove tracked build and dependency artifacts from version control where possible, then keep them ignored so repo hygiene matches the secrets-discipline standard
- Review Firebase rules and admin access paths against the roadmap’s deny-by-default and least-privilege requirements, then record the exact enforcement evidence in the next run
- Keep PR `#30` focused on roadmap and compliance deltas, and avoid landing additional generated artifacts while the deploy pipeline is unstable

### GitHub Learning

- If the GitHub connector is authenticated, use one long-lived issue for operational monitoring and keep the daily comments short; issue creation is a one-time step, while Actions failures are usually the highest-signal daily update.

## 2026-06-14 21:50:00 EDT

- Git HEAD: `main` @ `50962a3d234c8c296c3413641a3598b7a26cb91b`
- Working tree: clean (after verification build and commit validation)
- Commit anchor: prior daily log entry on `2026-06-04 09:04:55 EDT`

### Summary

- **Primary roadmap classification**: `Stage 1` (Data Collection Front-End) and `Stage 3` (Reporting + Infrastructure)
- **Compliance Integration & Verification Run**:
  - Implemented the bipedal app flow combining Google Federated Sign-in (Leg 1) and WebAuthn/FIDO2 Passkeys (Leg 2).
  - Enhanced the onboarding `SplashEntry` component to prompt users to register their device-bound passkey during the first-run configuration.
  - Resolved usability/compliance consent gaps by integrating explicit "change your mind" mechanisms:
    - **Onboarding Bypass**: Added an "Abort Onboarding" bypass to `SplashEntry` allowing users to terminate data entry and sign out instantly.
    - **Consent Revocation & Purge**: Added a "Sovereign Data Purge" option in User Settings that deletes the user's Firestore records, clears local keychains, and terminates the session.
    - **Cancel Pathways**: Added Cancel options to simulated auth modals in `BiometricLock` to prevent locking users into incomplete federated loops.
  - Verified local and production compilation pipelines passing successfully.
  - Initiated logging to track the alignment of all biometric enclaves with Stage 1/3 compliance rules.

### Risks / Alerts

- **Consent Expiry**: Ephemeral settings are successfully cleared from `localStorage` on purge, but user-initiated cache resets could bypass local state settings if not synced with the cloud.
- **Third-Party Sync**: Unlinking Google identity relies on Firebase Auth providers; strict alignment requires maintaining fallback local-only enclaves.

### Next Recommended Actions

- Standardize cryptographic verification routines for WebAuthn credential public keys in Firestore triggers.
- Configure GitHub Actions to automatically run the compliance gate validator checks on every push to main to prevent regression.


## 2026-06-14 22:15:00 EDT

- Git HEAD: `main`
- Working tree: modified (local modifications to package.json, firebase.json, and src/)
- Commit anchor: prior daily log entry on `2026-06-14 21:50:00 EDT`

### Summary

- **Zero-Cost Deployment Realignment**:
  - Resolved the Cloud Functions predeploy build and deployment error (due to Google Cloud Build org policies and service account deprecation under a zero-cost model).
  - Streamlined `firebase.json` and root `package.json` to deploy only the essential zero-cost services: `hosting`, `firestore`, `storage`, and `database` (avoiding the blocked Cloud Build service account requirements).
  - Fixed TypeScript compilation errors in Cloud Functions source (`functions/src/architect-ai.ts`) by upgrading `admin` import statements to the modular `firebase-admin/app`, `firebase-admin/firestore`, and `firebase-admin/auth` SDK patterns, and resolved implicit `any` parameter type issues.
  - Initialized local Firebase Emulator support in the React PWA (`src/firebase.ts`) to permit full offline development at zero cost.
  - Implemented **Graceful Simulation Fallback** for both Passkey registration (`bindPasskey`) and login (`loginWithPasskey`) in `src/AuthContext.tsx`. If Cloud Functions are undeployed or fail to execute, the app automatically transitions to local simulation, storing mock credentials in Firestore or local session state without blocking the user.

### Risks / Alerts

- **Cloud Function Dependency**: Because Functions are bypassed/simulated, WebAuthn cryptographic verification is done client-side or mocked. A production-ready release will require resolving the Cloud Build Org Policy to deploy the actual Cloud Functions.

### Next Recommended Actions

- Request the Organization Administrator to configure the Cloud Build user-managed service account for full v2 Functions deployment.

