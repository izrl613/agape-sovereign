# Google Cloud setup — Agape Sovereign

**Project ID:** `agape-sovereign`  
**Primary account (historical):** `idin@agape.nyc`  
**Default region:** `us-central1`

## Prerequisites

```bash
gcloud auth login --update-adc
gcloud config set project agape-sovereign
```

## One-shot bootstrap

From the repo root:

```bash
./scripts/gcp/enable-apis.sh
./scripts/gcp/bootstrap-project.sh
./scripts/gcp/status.sh
```

## Services this project uses

| Service | Purpose |
|---|---|
| Firebase / Identity Toolkit | Auth (Google, Passkey, anonymous) |
| Cloud Functions / Cloud Run | `authapi`, passkey options, App Hosting, server |
| Firestore | App data (`agape-sovereign` + default DBs) |
| Cloud Storage | Documents + Firebase Storage |
| Secret Manager | `PASSKEY_COOKIE_SECRET`, API keys |
| Cloud Build + Artifact Registry | Image builds (`cloudbuild.yaml`) |
| Vertex AI / Generative Language | Architect AI / Gemma paths |
| Logging + Monitoring | Ops |

## Deploy server (Cloud Run)

```bash
npm run deploy:cloudrun
# or
gcloud builds submit --config cloudbuild.yaml
```

## After auth works

1. Run `./scripts/gcp/status.sh` and keep the printout.
2. Replace `REPLACE_ME` secret values in Secret Manager.
3. Confirm Cloud Run services bind the `agape-run` service account.
4. Revisit public `allUsers` invoker on MCP if it should be private.

## Local env

Copy `.env.example` → `.env` and point Firebase/GCP vars at `agape-sovereign`.
Never commit `.env` or service-account JSON keys.

## Repo history cleanup (2026-09-30)

Git history was rewritten locally to drop SDK tarballs, `node_modules`, `.venv`, media, and other binary dumps.

- Local pack: **~676 MiB → ~43 MiB**
- Cleaned tip pushed to branch: `chore/history-bloat-purge`
- Tag: `cleaned/history-2026-09-30`
- **Default `main` is branch-protected and rejected force-push.** To finish cleanup on GitHub:
  1. Temporarily allow force pushes on `main`, or merge via admin override.
  2. `git push --force origin 6a8465ad9c37b06e35a6000cc22f139eca71ee6b:main`
  3. Re-lock branch protection.
  4. Ask collaborators to re-clone (old SHAs are orphaned).

Until then GitHub still reports the old ~664 MiB repo size on `main`.

