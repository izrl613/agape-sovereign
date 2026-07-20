# GCP Credit Preservation Plan
**Credit:** $1,000 GenAI Trial (Vertex AI / Discovery Engine)  
**Expiration:** 2027-01-26  
**Daily Budget Cap:** $1.80/day max to reach zero on expiry date  
**Goal:** Stretch credit to the last day — burn only on Vertex AI document processing and PDF rendering of user-encrypted SHA-256 data. All AI inference stays on local LM Studio / Gemma 4:e4b.

---

## What Was Changed (2026-07-19)

### Warmup Schedulers — PAUSED
- `agape-warmup-gemma4-mcp` (was: every 10 min) → **PAUSED**
- `agape-warmup-server` (was: every 10 min) → **PAUSED**
- **Savings:** ~288 Cloud Run invocations/day eliminated

### Cloud Run — Scale-to-Zero
All services set to `min-instances=0`, `max-instances=1`:
- `agape-sovereign-ee8f4200`
- `agape-sovereign-server`
- `gemma4-mcp-server`
- **Savings:** No idle CPU/memory cost; services spin up only on real traffic

### Artifact Registry — Cleanup Policies Active
Repos `firebaseapphosting-images` (5.9 GB), `cloud-run-source-deploy` (602 MB), `gemma-mcp-repo` (88 MB) now auto-delete untagged images and keep only the latest 2 versions.
- **Savings:** ~$0.60–$1.20/mo in storage once old layers expire

---

## Approved Vertex AI Usage (Credit Draws)
Only these operations should trigger Vertex AI API calls:

| Use Case | API | Max/month |
|---|---|---|
| Document ingestion & indexing | `discoveryengine` | On-demand only |
| PDF rendering of SHA-256 encrypted user data | `aiplatform` | On-demand only |
| Billing export queries | BigQuery (free tier) | Free |

**NOT allowed to use Vertex AI:**
- Architect AI inference (stays on local LM Studio / Gemma 4:e4b via MCP)
- Health checks, warmups, cron pings
- Speculative or background processing

---

## Monthly Cost Model (Target)

| Service | Before | After |
|---|---|---|
| Cloud Run idle (warmup) | ~$3–5/mo | **$0** |
| Artifact Registry storage | ~$1–2/mo (growing) | **~$0.10/mo** |
| Cloud Scheduler | ~$0.10/mo | **$0** (paused) |
| Vertex AI / Discovery Engine | On-demand | **$1.50–2/mo max** |
| Cloud Logging / Monitoring | Free tier | **$0** |
| Firestore | Free tier (50k reads/day) | **$0** |
| **Total target** | ~$6–9/mo | **< $2/mo** |

At $2/mo: $1,000 credit lasts **500 months** from start — well past Jan 2027. ✓  
At $1.80/day hard cap: reserve is fully consumed on 2027-01-26. ✓

---

## Do Not Touch (Preserved)
- All existing Cloud Run services (not deleted, only scaled to zero)
- All GitHub Actions workflows
- All Firestore data and rules
- All Firebase hosting configuration
- All GCS buckets (documents, hosting, functions)
- All service accounts and IAM bindings

---

## Budget Alerts (to be configured)
Set billing alerts at: $50 / $100 / $200 / $500 / $800 / $950  
Email: idin@agape.nyc  
Purpose: Early warning before each 10% increment is consumed.

---

## Resuming Services
To re-enable warmup (e.g. for a demo):
```bash
gcloud scheduler jobs resume agape-warmup-gemma4-mcp --location=us-central1 --project=agape-sovereign
gcloud scheduler jobs resume agape-warmup-server --location=us-central1 --project=agape-sovereign
```
Remember to pause again after the demo.
