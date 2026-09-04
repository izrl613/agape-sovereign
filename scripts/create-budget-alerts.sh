#!/usr/bin/env bash
# =============================================================================
# Agape Sovereign - Budget Alert Setup Script
# =============================================================================
# Creates Cloud Billing budgets with pub/sub alerts for cost monitoring
# Supports multiple budget tiers: Free Tier Warning, Budget Warning, Hard Limit
#
# Usage:
#   ./scripts/create-budget-alerts.sh [BILLING_ACCOUNT_ID]
# =============================================================================

set -euo pipefail

PROJECT_ID="agape-sovereign"
BUDGET_NAME_PREFIX="agape-sovereign"
NOTIFICATION_EMAIL="idin@agape.nyc"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

get_billing_account() {
  local provided="${1:-}"
  if [[ -n "$provided" ]]; then echo "$provided"; return; fi
  local detected
  detected=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null | sed 's/.*billingAccounts\///')
  if [[ -z "$detected" ]]; then
    log_error "No billing account linked. Run: gcloud billing accounts list"
    exit 1
  fi
  echo "$detected"
}

create_pubsub_topic() {
  local topic_name="$1"
  log_info "Creating Pub/Sub topic: $topic_name"
  gcloud pubsub topics create "$topic_name" --project="$PROJECT_ID" --quiet 2>/dev/null || log_warn "Topic may already exist"
}

create_budget() {
  local billing_account="$1"
  local budget_name="$2"
  local display_name="$3"
  local amount_usd="$4"
  local threshold_percent="$5"
  local description="$6"

  log_info "Creating budget: $display_name (\$${amount_usd} @ ${threshold_percent}%)"

  local budget_json
  budget_json=$(cat <<EOF
{
  "displayName": "$display_name",
  "budgetFilter": {
    "projects": ["projects/$PROJECT_ID"]
  },
  "amount": {
    "specifiedAmount": {
      "currencyCode": "USD",
      "units": "$amount_usd"
    }
  },
  "thresholdRules": [
    {
      "thresholdPercent": $threshold_percent,
      "spendBasis": "CURRENT_SPEND"
    }
  ],
  "notificationsRule": {
    "monitoringNotificationChannels": [],
    "pubsubTopic": "projects/$PROJECT_ID/topics/billing-alerts",
    "schemaVersion": "1.0"
  },
  "etag": ""
}
EOF
)

  echo "$budget_json" | gcloud billing budgets create \
    --billing-account="$billing_account" \
    --budget-from-file=- \
    --format="value(name)" 2>/dev/null || {
    log_warn "Budget may already exist or creation failed"
    return 1
  }
}

main() {
  local billing_account="${1:-}"
  billing_account=$(get_billing_account "$billing_account")

  echo "================================================================================"
  echo "Agape Sovereign - Budget Alert Setup"
  echo "Project: $PROJECT_ID | Billing Account: $billing_account"
  echo "================================================================================"
  echo ""

  # Enable required APIs
  log_info "Enabling required APIs..."
  gcloud services enable cloudbilling.googleapis.com monitoring.googleapis.com pubsub.googleapis.com --project="$PROJECT_ID" --quiet

  # Create Pub/Sub topic for alerts
  create_pubsub_topic "billing-alerts"

  # Budget 1: Free Tier Warning (50% of estimated free tier value ~$0.50)
  create_budget "$billing_account" \
    "${BUDGET_NAME_PREFIX}-free-tier-warning" \
    "Agape Sovereign - Free Tier Warning (50%)" \
    1 \
    0.5 \
    "Alert at 50% of estimated free tier usage (~\$0.50)"

  # Budget 2: Budget Warning (\$5/month)
  create_budget "$billing_account" \
    "${BUDGET_NAME_PREFIX}-budget-warning" \
    "Agape Sovereign - Budget Warning (\$5 @ 80%)" \
    5 \
    0.8 \
    "Alert at 80% of \$5/month budget (\$4.00)"

  # Budget 3: Hard Limit (\$25/month)
  create_budget "$billing_account" \
    "${BUDGET_NAME_PREFIX}-hard-limit" \
    "Agape Sovereign - Hard Limit (\$25 @ 100%)" \
    25 \
    1.0 \
    "Alert at 100% of \$25/month hard limit"

  # Budget 4: Emergency Stop (\$50/month)
  create_budget "$billing_account" \
    "${BUDGET_NAME_PREFIX}-emergency-stop" \
    "Agape Sovereign - Emergency Stop (\$50 @ 100%)" \
    50 \
    1.0 \
    "Emergency alert at \$50/month - investigate immediately"

  echo ""
  echo "================================================================================"
  log_success "Budget alerts configured!"
  echo "================================================================================"
  echo ""
  echo "View budgets:"
  echo "  gcloud billing budgets list --billing-account=$billing_account"
  echo ""
  echo "Pub/Sub topic for alerts: projects/$PROJECT_ID/topics/billing-alerts"
  echo ""
  echo "To create Cloud Function for automated shutdown at \$50:"
  echo "  See: scripts/budget-shutdown-function/"
  echo ""
}

main "$@"