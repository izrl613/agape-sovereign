#!/usr/bin/env bash
# =============================================================================
# Agape Sovereign - Billing Export Setup Script
# =============================================================================
# Sets up GCP Billing Export to BigQuery for cost analysis
# Run once after getting billing account ID from: gcloud billing accounts list
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - Billing Admin role on billing account
#   - Project owner on agape-sovereign
#
# Usage:
#   ./scripts/setup-billing-export.sh <BILLING_ACCOUNT_ID>
#   ./scripts/setup-billing-export.sh 012345-ABCDEF-123456
# =============================================================================

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────
PROJECT_ID="agape-sovereign"
REGION="us-central1"
BIGQUERY_DATASET="billing_export"
BIGQUERY_TABLE="gcp_billing_export_v1"
BIGQUERY_LOCATION="US"

# ─── Colors ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── Validation ─────────────────────────────────────────────────────────────
if [[ $# -ne 1 ]]; then
    log_error "Usage: $0 <BILLING_ACCOUNT_ID>"
    log_error "Get your billing account ID with: gcloud billing accounts list"
    exit 1
fi

BILLING_ACCOUNT_ID="$1"

if ! [[ "$BILLING_ACCOUNT_ID" =~ ^[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$ ]]; then
    log_error "Invalid billing account format. Expected: XXXXXX-XXXXXX-XXXXXX"
    exit 1
fi

# ─── Check prerequisites ────────────────────────────────────────────────────
log_info "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v bq &> /dev/null; then
    log_error "bq CLI not found. Install: gcloud components install bq"
    exit 1
fi

# Check authentication
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
if [[ -z "$CURRENT_ACCOUNT" ]]; then
    log_error "Not authenticated. Run: gcloud auth login"
    exit 1
fi
log_info "Authenticated as: $CURRENT_ACCOUNT"

# Check project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [[ "$CURRENT_PROJECT" != "$PROJECT_ID" ]]; then
    log_warn "Current project is '$CURRENT_PROJECT', switching to '$PROJECT_ID'"
    gcloud config set project "$PROJECT_ID"
fi

# Verify billing admin permissions
log_info "Checking billing account permissions..."
if ! gcloud billing accounts get-iam-policy "$BILLING_ACCOUNT_ID" --format="value(bindings.members)" | grep -q "$CURRENT_ACCOUNT"; then
    log_warn "You may not have Billing Admin role on $BILLING_ACCOUNT_ID"
    log_warn "Ensure you have 'roles/billing.admin' on the billing account"
fi

# ─── Enable required APIs ───────────────────────────────────────────────────
log_info "Enabling required APIs..."
gcloud services enable \
    cloudbilling.googleapis.com \
    bigquery.googleapis.com \
    cloudbuild.googleapis.com \
    --project="$PROJECT_ID" --quiet

# ─── Create BigQuery Dataset ────────────────────────────────────────────────
log_info "Creating BigQuery dataset: $BIGQUERY_DATASET"
if bq --project_id="$PROJECT_ID" ls -d "$BIGQUERY_DATASET" &>/dev/null; then
    log_warn "Dataset $BIGQUERY_DATASET already exists"
else
    bq --project_id="$PROJECT_ID" mk \
        --location="$BIGQUERY_LOCATION" \
        --description="GCP Billing Export for $PROJECT_ID" \
        --label="project:$PROJECT_ID" \
        --label="managed_by:gcloud" \
        "$BIGQUERY_DATASET"
    log_success "Created dataset $BIGQUERY_DATASET"
fi

# ─── Configure Billing Export ───────────────────────────────────────────────
log_info "Configuring billing export to BigQuery..."
log_warn "This requires Billing Admin role. If it fails, run manually in console:"
log_warn "  Console → Billing → Billing export → Export to BigQuery"

# Note: Billing export configuration via gcloud is limited.
# The recommended approach is via console or REST API.
# We'll provide the REST API command as alternative.

cat <<EOF

┌─────────────────────────────────────────────────────────────────────────────┐
│ BILLING EXPORT SETUP - MANUAL STEP REQUIRED                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ The gcloud CLI doesn't fully support billing export configuration.         │
│ Please complete this in the Google Cloud Console:                          │
│                                                                             │
│ 1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID
│ 2. Click "Billing export" → "Export to BigQuery"                           │
│ 3. Configure:                                                               │
│    - Project: $PROJECT_ID                                                  │
│    - Dataset: $BIGQUERY_DATASET                                            │
│    - Table prefix: (leave blank for default)                               │
│    - Export frequency: Daily                                               │
│ 4. Click "Save"                                                             │
│                                                                             │
│ OR use the REST API (requires OAuth token):                                │
│                                                                             │
│ curl -X POST \\\                                                             │
│   -H "Authorization: Bearer \$(gcloud auth print-access-token)" \\\        │
│   -H "Content-Type: application/json" \\\                                  │
│   -d '{"dataset": "projects/$PROJECT_ID/datasets/$BIGQUERY_DATASET"}' \\\ │
│   "https://cloudbilling.googleapis.com/v1/billingAccounts/$BILLING_ACCOUNT_ID/billingExport" │
└─────────────────────────────────────────────────────────────────────────────┘

EOF

# ─── Verify Export Works ────────────────────────────────────────────────────
log_info "Waiting for billing export to populate (may take 24-48 hours)..."
log_info "You can verify with:"
echo "  bq query --use_legacy_sql=false \\"
echo "    'SELECT * FROM \`$PROJECT_ID.$BIGQUERY_DATASET.$BIGQUERY_TABLE\` LIMIT 10'"

# ─── Create Budget Alert (via gcloud) ───────────────────────────────────────
log_info "Creating budget alert (\$50/month)..."
cat <<BUDGET_CMD

# Run this command to create the budget alert (requires Billing Admin):
gcloud billing budgets create \\
  --billing-account=$BILLING_ACCOUNT_ID \\
  --display-name="Agape Sovereign Monthly Budget" \\
  --budget-amount=50USD \\
  --threshold-rule=percent=0.5,basis=current-spend \\
  --threshold-rule=percent=0.75,basis=current-spend \\
  --threshold-rule=percent=0.9,basis=current-spend \\
  --threshold-rule=percent=1.0,basis=current-spend \\
  --all-services

# To list existing budgets:
gcloud billing budgets list --billing-account=$BILLING_ACCOUNT_ID

BUDGET_CMD

# ─── Terraform Alternative ──────────────────────────────────────────────────
log_info "Alternatively, use Terraform for full automation:"
cat <<TF_CMD

cd terraform
cp variables.tf.example terraform.tfvars  # Edit with your billing_account_id
terraform init
terraform plan -var="billing_account_id=$BILLING_ACCOUNT_ID"
terraform apply -var="billing_account_id=$BILLING_ACCOUNT_ID"

TF_CMD

# ─── Summary ────────────────────────────────────────────────────────────────
log_success "Setup script complete!"
echo
echo "Next steps:"
echo "  1. Complete billing export in Console (link above)"
echo "  2. Create budget alert (command above)"
echo "  3. Wait 24-48 hours for first billing data"
echo "  4. Run analysis queries:"
echo "     bq query --use_legacy_sql=false 'SELECT * FROM \`$PROJECT_ID.$BIGQUERY_DATASET.$BIGQUERY_TABLE\` LIMIT 10'"
echo
echo "Files created:"
echo "  - terraform/billing.tf        (Terraform config)"
echo "  - terraform/variables.tf      (Variables template)"
echo "  - scripts/budget-check.js     (Daily budget monitor)"
echo "  - .github/workflows/deploy.yml (CI/CD with budget check)"