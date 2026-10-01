# Agape Sovereign — GCP + repo ops status

Updated: 2026-09-30 (local)

## Canonical paths
- Local clone: `/Users/aarondavid/Documents/agape-sovereign`
- GitHub: `https://github.com/izrl613/agape-sovereign`
- GCP project: `agape-sovereign` (number `956088455461`)
- Active gcloud identity: `idin@agape.nyc`

## Repo bloat

### Done
- History rewrite tip on cleaned graph (local `.git` pack ~43 MiB).
- Branch `chore/history-bloat-purge` + tag `cleaned/history-2026-09-30` on remote.
- Finder duplicate purge commit `172cb0720` — removed **267** tracked `* 2.*` / `* 3.*` / `.bak` paths + docx; tightened `.gitignore`.
- Pushed tip as **`chore/finder-dup-purge`**.
- Tracked file count after purge: **547** (was 815).

### Blocked
- GitHub **default `main` still large** (~history not rewritten on protected default). Local cleaned `main` is **not** a fast-forward of remote `main` (ahead/behind after rewrite).
- `gh` CLI **not logged in** on this machine; git HTTPS push to feature branches works.
- Force-push cleaned tip onto `main` still requires admin allow-force-push (or temporary protection change).

### Remaining local working-tree noise (ignored, not deleted)
- Root screenshots / PDFs / `.pages` (gitignored).
- `node_modules/` (~2.2G local only).
- Auth WIP uncommitted: `firebase.json`, `functions/src/auth.ts`, `functions/src/index.ts`, `server.ts`, `src/AuthContext.tsx`, `src/firebase.ts`, `vite.config.ts`.

## GCP services in use

### Cloud Run (us-central1) — live samples
| Service | HTTP check |
|---------|------------|
| `authapi` | 200 |
| `agape-sovereign-server` | 200 |
| `agape-sovereign-ee8f4200` (App Hosting) | 403 (expected if locked) |

Also present: gemma MCP, several gen* / sovereign* function-backed services (some dual-region rows show False without URL).

### Cloud Functions
ACTIVE include: `authApi`, analytics/diff/ECRA/passkey/policy/score/audit/pipeline helpers.  
FAILED: `cleanupExpiredPipelineRuns`.

### Firestore DBs
1. `(default)` — nam5  
2. `agape-sovereign` — nam7  
3. `ai-studio-allinoneprivacys-…` — us-west1 (ENTERPRISE)

### Storage buckets
- `agape-sovereign.firebasestorage.app`
- `agape-sovereign-documents-us`
- gcf / apphosting source buckets

### Artifact Registry (size watch)
- `firebaseapphosting-images` ≈ **29.5 GB** (prune candidate)
- `cloud-run-source-deploy` ≈ 603 MB
- `gemma-mcp-repo` ≈ 82 MB

### Secret Manager
| Secret | Notes |
|--------|--------|
| `FIREBASE_CONFIG` | Populated from `firebase-config.json` (client web config) |
| `GEMINI_API_KEY` | Still **REPLACE_ME** until you export a real key |
| `COOKIE_SECRET` / `PASSKEY_COOKIE_SECRET` / `BUILD_MANIFEST_SECRET` | Have versions |
| Multiple `*-github-oauthtoken-*` | App Hosting / Studio connectors |

### Runtime SA
- `agape-run@agape-sovereign.iam.gserviceaccount.com` — Run/Secret/Firestore/Storage/Logging/Monitoring roles from bootstrap.

## Scripts
```bash
./scripts/gcp/enable-apis.sh
./scripts/gcp/bootstrap-project.sh
./scripts/gcp/status.sh
./scripts/gcp/populate-secrets.sh              # needs GEMINI_API_KEY=...
./scripts/gcp/populate-secrets.sh --firebase-only
```

## Recommended next actions
1. **GitHub**: log in `gh auth login`, temporarily allow force-push on `main`, push cleaned tip (`9b0c3d7` history base + `172cb0720` dup purge), re-lock protection, re-clone other machines.
2. **Secrets**: `GEMINI_API_KEY=<real> ./scripts/gcp/populate-secrets.sh`
3. **Registry cost**: set cleanup policy / delete old `firebaseapphosting-images` digests.
4. **Functions**: investigate `cleanupExpiredPipelineRuns` FAILED state.
5. Keep auth WIP on a feature branch; do not mix with history force-push.
