#!/usr/bin/env bash
# Print live GCP status for agape-sovereign
set -euo pipefail
PROJECT_ID="${GCP_PROJECT_ID:-agape-sovereign}"
REGION="${GCP_REGION:-us-central1}"
gcloud config set project "$PROJECT_ID" >/dev/null
echo "=== Project ==="
gcloud projects describe "$PROJECT_ID" --format='yaml(projectId,name,projectNumber,lifecycleState)'
echo "=== Enabled APIs (count) ==="
gcloud services list --enabled --project="$PROJECT_ID" --format='value(config.name)' | wc -l
echo "=== Cloud Run ==="
gcloud run services list --region="$REGION" --project="$PROJECT_ID"
echo "=== Secrets ==="
gcloud secrets list --project="$PROJECT_ID" --format='table(name,createTime)'
echo "=== Artifact Registry ==="
gcloud artifacts repositories list --project="$PROJECT_ID" --location="$REGION"
echo "=== Firestore DBs ==="
gcloud firestore databases list --project="$PROJECT_ID" 2>/dev/null || true
