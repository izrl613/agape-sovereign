---
title: "GCP and Firebase project report for agape-sovereign"
description: "Inventory of the agape-sovereign GCP project: Cloud Run services, Firestore, auth providers, billing budgets, and security recommendations."
---

# agape.sovereign — GCP/Firebase Project Report
**Generated:** 2026-07-20 · **Account:** idin@agape.nyc · **Project:** `agape-sovereign` (956088455461)  
**Billing Account:** 018175-BBE06D-3B0276 · **Billing:** Enabled

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Display Name** | Agape Sovereign AI |
| **Firebase State** | ACTIVE |
| **Realtime DB** | `agape-sovereign-default-rtdb` |
| **Firebase Hosting** | `agape-sovereign` |
| **PWA Hosted URL** | `agape-sovereign--agape-sovereign.us-central1.hosted.app` |
| **Android App** | `com.agape.sovereign.ai` |
| **Web App** | `1:956088455461:web:5d83545efc8961e4904acc` |

---

## 2. Live Cloud Run Services

All 5 services are **READY** in `us-central1`.

| Service | URL | Role |
|---|---|---|
| `agape-sovereign-ee8f4200` | `https://agape-sovereign-ee8f4200-vub7d55vga-uc.a.run.app` | Firebase App Hosting (PWA) — latest build `2026-07-19` |
| `agape-sovereign-server` | `https://agape-sovereign-server-vub7d55vga-uc.a.run.app` | Backend Node.js server |
| `authapi` | `https://authapi-vub7d55vga-uc.a.run.app` | Passkey / Auth Cloud Function |
| `gemma4-mcp-server` | `https://gemma4-mcp-server-vub7d55vga-uc.a.run.app` | Architect AI (Gemma4) MCP server — Cloud |
| `registerpasskeyoptions` | `https://registerpasskeyoptions-vub7d55vga-uc.a.run.app` | Passkey registration Cloud Function |

**Notes:**
- All services are publicly invokable (`allUsers` → `roles/run.invoker`). `gemma4-mcp-server` now enforces an application-level auth gate on all POST (JSON-RPC) requests: a Firebase ID token (`Authorization: Bearer`) or a static `X-API-Key`. `GET /health` stays open for Cloud Run probes. Auth is auto-enabled whenever the server runs on Cloud Run.
- `gemma4-mcp-server` is capped at 3 max instances and 512 MiB RAM — adequate for single-user.
- `authapi` uses `PASSKEY_COOKIE_SECRET` from Secret Manager ✓

---

## 3. Databases

### Firestore
| DB | Name | Tier | Location |
|---|---|---|---|
| Named | `agape-sovereign` | **FREE** | `nam7` |
| Default | `(default)` | Standard | `nam5` |

Realtime Database: `agape-sovereign-default-rtdb` — currently empty (no top-level data).

### Cloud Storage Buckets (10 buckets)
Key buckets:
- `agape-sovereign.firebasestorage.app` — Firebase Storage (US-CENTRAL1)
- `agape-sovereign-documents-us` — Document storage
- `run-sources-agape-sovereign-us-central1` — Cloud Run source artifacts
- `firebaseapphosting-sources-*` — App Hosting CI/CD

---

## 4. Authentication

| Provider | Status |
|---|---|
| Email/Password | ✓ Enabled |
| Phone (SMS) | ✓ Enabled (test: +19296861130 → 000000) |
| Anonymous | ✓ Enabled |
| **Google Sign-In** | ✓ Enabled |
| **GitHub OAuth** | ✓ Enabled |
| Passkey (WebAuthn) | ✓ Implemented via `authapi` / `registerpasskeyoptions` |

**Recommendation:** Disable Anonymous auth if it's not used for onboarding flows — reduces abuse surface. Run `./scripts/prod-hardening.sh --apply --only=auth` to disable it.

---

## 5. Artifact Registry (us-central1)

| Repo | Format | Purpose |
|---|---|---|
| `cloud-run-source-deploy` | Docker | Cloud Run source builds |
| `firebaseapphosting-images` | Docker | Firebase App Hosting CI |
| `gcf-artifacts` | Docker | Cloud Functions container images |
| `gemma-mcp-repo` | Docker | Gemma4 MCP Server |
| `mcp-cloud-run-deployments` | Docker | MCP Cloud Run deployments |

---

## 6. Secret Manager

| Secret | Created |
|---|---|
| `PASSKEY_COOKIE_SECRET` | 2026-07-14 |
| `Studio-github-oauthtoken-74c207` | 2026-03-14 |
| `agape-sovereign-github-oauthtoken-0f9d5d` | 2026-02-25 |
| `apphosting-github-conn-*` (×4) | Various |
| `izrl613-github-oauthtoken-*` (×2) | Recent |

---

## 7. GitHub Integration & CI/CD

### Developer Connect (GitHub ↔ GCP)
- 6 connections: `COMPLETE` — Firebase App Hosting, Developer Connect, Studio
- GitHub Actions service account: `github-action-1216214957@agape-sovereign.iam.gserviceaccount.com`

### Workflows (`.github/workflows/`)
| Workflow | Trigger | Purpose |
|---|---|---|
| `deploy.yml` | Push to `main` | Full Firebase deploy (hosting + functions + Firestore rules) |
| `firebase-hosting-merge.yml` | Push to `main` | Firebase Hosting fast lane (auto-generated) |
| `firebase-hosting-pull-request.yml` | PR | Preview channel deploy |
| `compliance.yml` | Schedule + manual | ECRA/CPRA/AI Act compliance scan |
| `compliance-agent.yml` | Weekly Sunday 04:00 UTC | Autonomous compliance monitoring → GitHub Issues |
| `security-scan.yml` | Schedule | Security scan |

**Logging sink:** `bq-operational-logs` → BigQuery dataset `agape_sovereign_analytics` (Cloud Run + Functions + Build logs).

---

## 8. Observability

### Cloud Monitoring
- **Cloud Trace:** ✓ Enabled
- **Cloud Logging:** ✓ Active with operational log sink to BigQuery

### Billing Budgets (Already Configured)
| Budget | Cap | Alerts |
|---|---|---|
| `agape-sovereign Monthly Cap Alert` | $15 | 50% / 90% / 100% |
| `agape-sovereign Vertex AI Guard` | $50 | 50% / 90% / 100% |
| `AgapeFire` | $20 | 50% / 90% / 100% |

---

## 9. Actions Taken by This Agent

### ✅ Services Enabled
| Service | API | Tier |
|---|---|---|
| Cloud Error Reporting | `clouderrorreporting.googleapis.com` | **FREE** |
| Cloud Profiler | `cloudprofiler.googleapis.com` | **FREE** (5 GB/month) |

### ✅ Cloud Scheduler Jobs Created (Free Tier: 3 free jobs)
| Job | Schedule | Target | Purpose |
|---|---|---|---|
| `agape-warmup-gemma4-mcp` | Every 10 min | `gemma4-mcp-server/health` | Prevent cold starts on Architect AI MCP |
| `agape-warmup-server` | Every 10 min | `agape-sovereign-server/` | Prevent cold starts on backend |

### ✅ Uptime Monitoring Created
| Check | Target | Interval |
|---|---|---|
| `agape.sovereign PWA Uptime` | `agape-sovereign--agape-sovereign.us-central1.hosted.app` | 5 min |
| `AuthAPI Uptime` | `authapi-vub7d55vga-uc.a.run.app` | 5 min |

### ✅ Firebase Remote Config — Feature Flags
4 parameters published (version 5):
| Parameter | Default | Purpose |
|---|---|---|
| `ai_provider_default` | `ollama` | Switch AI provider at runtime |
| `architect_mcp_enabled` | `true` | Toggle Architect AI MCP |
| `identity_modules_enabled` | `all` | Control active identity modules |
| `maintenance_mode` | `false` | Emergency kill switch |

### ✅ OpenCode MCP Integration Updated
`~/.config/opencode/mcp.json` now includes:
- **`architect-ai`** — existing local Architect AI MCP
- **`firebase-mcp`** — Firestore access via `firebase-mcp@latest` (Cursor/Claude-compatible)
- **`gcloud-terminal`** — exposes `gcloud` bin to OpenCode filesystem tool

---

## 10. Recommendations & Next Steps

### High Priority

1. ✅ **DONE (2026-08-24): Lock down `gemma4-mcp-server`** — the server now gates every POST (JSON-RPC `tools/call`) request behind a Firebase ID token (RS256, verified against Google's JWKS) or a static `X-API-Key`. Configure via `MCP_REQUIRE_AUTH`, `MCP_API_KEY`, and `FIREBASE_PROJECT_ID` env vars; auth is force-enabled on Cloud Run. Unauthorized requests receive HTTP 401 with a JSON-RPC error.
2. **Enable Google Sign-In in Firebase Auth UI** — it's configured at the project level but `signIn` block was empty in the config response. Verify it's wired in the PWA's `firebase.ts`.
3. ✅ **DONE (2026-08-24): Blaze budget alerts wired to Pub/Sub auto-cap** — the `billing-alerts` Pub/Sub topic now triggers the `budget-enforcement` Gen 2 Cloud Function (deployed via Terraform). When a budget alert crosses the configured threshold (default 100%), the function scales the cost-driving Cloud Run services (`agape-sovereign-ee8f4200`, `agape-sovereign-server`, `gemma4-mcp-server`) to `maxScale=0` so they can no longer accrue cost. The cap is reversible by redeploying or raising `maxScale`.
4. **Delete or rotate stale GitHub OAuth tokens** in Secret Manager — 4 `apphosting-github-conn-*` tokens + 2 `izrl613-github-oauthtoken-*` from different dates. Audit which are still active.

### Medium Priority

5. ✅ **DONE (2026-08-24): Firebase App Check enabled** — `firebase.json` now declares App Check providers: `reCAPTCHA v3` for web (set the site key) and `Play Integrity` for Android. Protects Auth, Firestore, and Storage from abuse. Free tier.
6. **Add Error Reporting to Cloud Run services** — now that `clouderrorreporting.googleapis.com` is enabled, add `@google-cloud/error-reporting` client to `agape-sovereign-server` and `authapi`.
7. **Add Cloud Profiler to backend** — `cloudprofiler.googleapis.com` is now enabled. Add `import('pprof')` in the Node.js server to track CPU/memory.
8. **Enable Point-in-Time Recovery on Firestore** — `(default)` DB has `POINT_IN_TIME_RECOVERY_DISABLED`. Run `./scripts/prod-hardening.sh --apply --only=pitr` to enable it.
9. **BigQuery analytics** — `bq-operational-logs` sink is writing to `agape_sovereign_analytics` but no dashboard exists. Create a Looker Studio report from the BigQuery data.

### Low Priority / Nice-to-Have

10. **Remote Config A/B conditions** — add user-segment conditions (e.g., `platform == 'android'`) to `ai_provider_default` so Android app can use a different AI backend.
11. **Cloud Run min-instances** — `gemma4-mcp-server` cold starts take ~3s. If used interactively, set `minInstances: 1` in `apphosting.yaml` (costs ~$4/mo).
12. **Firebase Extensions** — `firebaseextensions.googleapis.com` is enabled. Consider `Trigger Email` extension for auth notifications, or `Resize Images` for user uploads.
13. **Disable `sql-component`, `sqladmin`, `compute`** if not actively using Cloud SQL or VMs — reduces attack surface (though they don't cost money when idle).

---

## 11. Architecture Summary

```
sovereign.nyc / agape-sovereign--agape-sovereign.us-central1.hosted.app
        │
        ▼
Firebase App Hosting (Cloud Run: agape-sovereign-ee8f4200)
        │                    │
        ▼                    ▼
agape-sovereign-server    Firestore (agape-sovereign DB)
        │                    │
        ▼                    ▼
authapi / registerpasskeyoptions     Firebase Storage
        │
        ▼
gemma4-mcp-server (Architect AI — Gemma4 on Cloud)
        │
        ▼
Firebase Auth (Google + GitHub + Passkey + Email + Phone)
```

**Local Dev:** OpenCode → architect-mcp-server (localhost:3001 → Ollama gemma4) → Firebase Emulators

---

*Report generated by Invoko agent. Project ID: agape-sovereign. All changes are reversible.*
