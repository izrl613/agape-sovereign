# Agape Sovereign AI — Auth & PWA Buildout Handoff

## Completed in this sandbox

- Firebase Hosting now serves the Vite production bundle from `dist/`.
- Added Hosting routing for `/api/auth/**` to the `authApi` Cloud Function, region `us-central1`.
- Exported `authApi` from `functions/src/index.ts` so Firebase can deploy the HTTP handler.
- Bound WebAuthn credential reads/writes to the configured Firestore database `agape-sovereign`.
- Removed the fake Anonymous Auth fallback from passkey sign-in. If a challenge or WebAuthn verification fails, sign-in now fails closed with an error.
- Passkey sign-in asks for the account email so the server can return that account's allowed credentials. It does not treat an arbitrary browser passkey prompt as a valid login.
- Passkey registration uses required user verification and discoverable credentials; enrollment begins only after user gesture.
- **Auth model:** The login screen offers three entry choices: existing passkey sign-in, Google sign-in, and real Firebase Anonymous Auth. Anonymous users can link Google with `linkWithPopup`, preserving Firebase UID and Firestore-owned data. Link conflicts are reported; accounts are not silently switched or merged. Passkey registration requires a linked Google identity.
- Demo findings appear only in development builds, not production.
- Public `/` renders the Agape landing page; `/login` is the unified three-path login; `/architect` explicitly opens the standalone Architect UI behind auth.
- The standalone Architect UI's missing `useScan` import was fixed.
- Service-worker cache version was bumped and app-shell/scripts bypass stale cache; HTML updates its service worker with `updateViaCache: none`.
- Firebase client configuration uses the supplied Firebase project config.

## Verified runs

- Frontend `npm run build:frontend` — passed.
- Root `npm run typecheck` — passed.
- Functions `npm run lint && npm run build && npm run test` — passed; 11 tests.
- `git diff --check` — passed.
- Vite warns that the main JavaScript bundle exceeds 500 kB; code splitting remains follow-up work.

## Product roadmap: identity audit/report pipeline

The following architecture is a **planned product scope**, not yet end-to-end implemented or verified. Do not present unfinished module integrations, AI processing, validation, encryption, or retention as live capabilities.

1. **Identity Vector Modules (16):** Build a shared schema with module id, user-provided or explicitly consented evidence, source/provenance, status (`Not assessed`, `Monitored`, `Action required`, `Resolved`), confidence/limitations, and remediation. A module agent handles only its selected evidence. Never fabricate scan results or imply broad platform scans without working, authorized integrations.
2. **Encrypted agent handoff:** Define a versioned data contract, explicit consent boundary, client-side encryption/key lifecycle, authenticated transport, least-privilege service identity, and audit events. SHA-256 is an integrity digest, not encryption; a passkey credential is not an encryption key.
3. **Architect AI / Gemma 4 12B:** Specify where the model runs, how requests reach it, whether evidence leaves the device, budget/rate controls, and how untrusted evidence is separated from agent prompts. Keep claims about local/offline Gemma strictly limited to tested deployments; an offline PWA cannot assume a local model endpoint exists.
4. **Independent third-party validator:** Use a distinct validator step on structured candidate findings and evidence references, with provenance, field-level outcomes, uncertainty, and disagreement handling. Validation must not invent data; disputed or unsupported fields should be marked unverified.
5. **PDF Export Agent:** Generate a professional **Identity Audit Report** from only validated fields. Include report scope/date, account-controlled identity reference, evidence/source, module status, confidence/limitations, reviewer/validator result, recommendations, and content hash/signature where implemented.
6. **Storage choices:** Local user-controlled profile/vault with a verified 26-month deletion policy, or explicit, separately consented Google-account/Drive export. The repo contains conflicting prior retention/storage statements (26-month local vault vs two-year Firebase). Resolve policy and ensure implementation, Firestore/Storage rules, UI, Terms, and Privacy Policy agree before launch. For anonymous accounts, explain data-loss risk if that Firebase session is lost; linking Google should preserve the same UID.

## Before further production deploy

1. Verify the `sovereign.nyc` custom domain release and the exact Firebase Hosting site mapping.
2. Validate Google linking and Anonymous Auth in real browser sessions including account-conflict recovery.
3. Verify passkey registration/login challenges, origin/RP ID, cookie lifetime/samesite behavior, Firestore credential storage, and account linking on the deployed custom origin.
4. Confirm `authApi` secrets, service-account database access, Google authorized domains, App Check, Firestore/Storage rules, quotas, and budget guardrails.
5. Resolve report retention/storage policy before publishing promises or enabling Drive scope.

## Scope note

This is authentication and deployment wiring plus a phased plan, not a production-complete 16-vector assessment/validator pipeline. Do not describe SHA-256 as encryption or as anonymization.
