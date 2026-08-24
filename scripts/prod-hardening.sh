#!/usr/bin/env bash
# Agape Sovereign — Production hardening (consolidated, safe-by-default).
#
# Implements the remaining Implementation Status action items that mutate
# live GCP/Firebase state:
#   ar     — Artifact Registry cleanup policy (keep 3 newest, prune >30d) for 6 repos
#   pitr   — enable point-in-time recovery on the (default) Firestore DB
#   auth   — disable Firebase Anonymous Auth (abuse/billing surface)
#
# USAGE
#   ./scripts/prod-hardening.sh                  # dry-run (prints commands only)
#   ./scripts/prod-hardening.sh --apply          # execute all three
#   ./scripts/prod-hardening.sh --apply --only=pitr
#
# Requires: gcloud (authenticated as Owner/Billing Admin on agape-sovereign),
# curl, jq. Current credential: idin@agape.nyc.
set -euo pipefail

PROJECT="agape-sovereign"
REGION="us-central1"
AR_REPOS=(gcr.io cloud-run-source-deploy firebaseapphosting-images gcf-artifacts gemma-mcp-repo mcp-cloud-run-deployments)
APPLY=0
ONLY=""

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --only=*) ONLY="${arg#*=}" ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# Echo the command; only execute when --apply was passed.
run() { echo "+ $*"; if [ "$APPLY" -eq 1 ]; then "$@"; fi; }
want() { [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }

step_ar() {
  echo "=== [ar] Artifact Registry cleanup policy (keep 3 newest, prune >30d) ==="
  local policy
  policy="$(mktemp -t ar-cleanup.XXXXXX.yaml)"
  cat > "$policy" <<'YAML'
cleanupPolicies:
  - id: keep-most-recent-3
    action: KEEP
    mostRecentVersions:
      keepCount: 3
  - id: prune-older-than-30-days
    action: DELETE
    condition:
      olderThan: 30d
      tagState: ANY
YAML
  for repo in "${AR_REPOS[@]}"; do
    echo "--- $repo ---"
    run gcloud artifacts repositories set-cleanup-policy "$repo" \
      --project="$PROJECT" --location="$REGION" --policy="$policy"
  done
  rm -f "$policy"
}

step_pitr() {
  echo "=== [pitr] Firestore point-in-time recovery on (default) ==="
  run gcloud firestore databases update \
    --database='(default)' --project="$PROJECT" --point-in-time-recovery-enable
  echo "NOTE: firebase.json routes PWA writes to the free 'agape-sovereign' DB."
  echo "      Dedup: stop writing to the extra 'ai-studio-...-54f1b46e-...' DB manually."
}

step_auth() {
  echo "=== [auth] Disable Firebase Anonymous Auth ==="
  local url="https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config?updateMask=signIn.anonymous.enabled"
  echo "+ curl -s -X PATCH -H 'Authorization: Bearer ***' -H 'Content-Type: application/json' -d '{\"signIn\":{\"anonymous\":{\"enabled\":false}}}' $url"
  if [ "$APPLY" -eq 1 ]; then
    local token
    token="$(gcloud auth print-access-token)"
    curl -s -X PATCH -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '{"signIn":{"anonymous":{"enabled":false}}}' "$url"
  fi
  echo
  echo "Re-enable with the same call setting enabled:true if an onboarding flow needs it."
}

if want ar; then step_ar; fi
if want pitr; then step_pitr; fi
if want auth; then step_auth; fi

if [ "$APPLY" -eq 0 ]; then
  echo
  echo "DRY-RUN only. Re-run with --apply to execute."
fi
