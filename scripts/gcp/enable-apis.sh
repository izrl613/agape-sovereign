#!/usr/bin/env bash
# Enable core Google Cloud APIs for project agape-sovereign
set -euo pipefail
PROJECT_ID="${GCP_PROJECT_ID:-agape-sovereign}"
REGION="${GCP_REGION:-us-central1}"

echo "Using project: $PROJECT_ID (region: $REGION)"
gcloud config set project "$PROJECT_ID"

APIS=(
  run.googleapis.com
  cloudbuild.googleapis.com
  artifactregistry.googleapis.com
  secretmanager.googleapis.com
  firestore.googleapis.com
  firebase.googleapis.com
  identitytoolkit.googleapis.com
  storage.googleapis.com
  logging.googleapis.com
  monitoring.googleapis.com
  cloudfunctions.googleapis.com
  cloudscheduler.googleapis.com
  iam.googleapis.com
  iamcredentials.googleapis.com
  serviceusage.googleapis.com
  compute.googleapis.com
  aiplatform.googleapis.com
  generativelanguage.googleapis.com
  datacatalog.googleapis.com
)

echo "Enabling ${#APIS[@]} APIs..."
gcloud services enable "${APIS[@]}" --project="$PROJECT_ID"
echo "Done. Enabled services:"
gcloud services list --enabled --project="$PROJECT_ID" --format='value(config.name)' | sort
