#!/usr/bin/env bash
# Bootstrap Artifact Registry, Secret Manager placeholders, and Cloud Run SA for agape-sovereign
set -euo pipefail
PROJECT_ID="${GCP_PROJECT_ID:-agape-sovereign}"
REGION="${GCP_REGION:-us-central1}"
REPO_NAME="${AR_REPO:-cloud-run-source-deploy}"
SA_NAME="${RUN_SA:-agape-run}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
bash "$(dirname "$0")/enable-apis.sh"

echo "Ensuring Artifact Registry repo: $REPO_NAME"
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Agape Sovereign Cloud Run images" \
    --project="$PROJECT_ID"
else
  echo "Repo exists."
fi

echo "Ensuring runtime service account: $SA_EMAIL"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Agape Sovereign Cloud Run" \
    --project="$PROJECT_ID"
fi

for ROLE in \
  roles/run.invoker \
  roles/secretmanager.secretAccessor \
  roles/datastore.user \
  roles/storage.objectAdmin \
  roles/logging.logWriter \
  roles/monitoring.metricWriter
 do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None \
    --quiet >/dev/null || true
done

# Secret placeholders (create empty if missing; values set manually)
for SECRET in PASSKEY_COOKIE_SECRET GEMINI_API_KEY FIREBASE_CONFIG; do
  if ! gcloud secrets describe "$SECRET" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Creating secret shell: $SECRET"
    printf 'REPLACE_ME' | gcloud secrets create "$SECRET" \
      --data-file=- \
      --replication-policy=automatic \
      --project="$PROJECT_ID"
  else
    echo "Secret exists: $SECRET"
  fi
done

echo "Bootstrap complete for $PROJECT_ID"
gcloud run services list --region="$REGION" --project="$PROJECT_ID" 2>/dev/null || true
