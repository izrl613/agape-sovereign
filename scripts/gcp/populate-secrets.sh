#!/usr/bin/env bash
# Populate Secret Manager values for agape-sovereign from local non-secret sources / env.
# Usage:
#   GEMINI_API_KEY=... ./scripts/gcp/populate-secrets.sh
#   ./scripts/gcp/populate-secrets.sh --firebase-only
set -euo pipefail
PROJECT_ID="${GCP_PROJECT_ID:-agape-sovereign}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIREBASE_ONLY=0
[[ "${1:-}" == "--firebase-only" ]] && FIREBASE_ONLY=1

gcloud config set project "$PROJECT_ID" >/dev/null

if [[ -f "$ROOT/firebase-config.json" ]]; then
  echo "Updating FIREBASE_CONFIG from firebase-config.json"
  gcloud secrets versions add FIREBASE_CONFIG --project="$PROJECT_ID" --data-file="$ROOT/firebase-config.json"
else
  echo "WARN: firebase-config.json missing" >&2
fi

if [[ "$FIREBASE_ONLY" -eq 1 ]]; then
  exit 0
fi

if [[ -n "${GEMINI_API_KEY:-}" && "${GEMINI_API_KEY}" != "REPLACE_ME" ]]; then
  echo "Updating GEMINI_API_KEY from env"
  printf '%s' "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --project="$PROJECT_ID" --data-file=-
else
  echo "Skip GEMINI_API_KEY (set GEMINI_API_KEY env to a real key to update)"
fi

echo "Done. List:"
gcloud secrets list --project="$PROJECT_ID" --format='table(name)'
