# Agape Sovereign - Billing & Cost Management Quick Reference
# ==============================================================================
# Project: agape-sovereign | Billing: idin@agape.nyc
# Generated: $(date)
# ==============================================================================

# ─── PREREQUISITES ────────────────────────────────────────────────────────────
# 1. Install tools:
#    brew install gcloud terraform node@24
#    gcloud components install beta

# 2. Authenticate:
#    gcloud auth login idin@agape.nyc
#    gcloud auth application-default login
#    gcloud config set project agape-sovereign

# 3. Get your billing account ID:
#    gcloud billing accounts list
#    # Format: 012345-ABCDEF-123456


# ─── QUICK START (Manual) ─────────────────────────────────────────────────────

# 1. ENABLE BILLING EXPORT TO BIGQUERY (Required for analysis)
#    Console: https://console.cloud.google.com/billing/linkedaccount?project=agape-sovereign
#    → Billing export → Edit settings → Export to BigQuery
#    → Project: agape-sovereign | Dataset: billing_export | Table prefix: gcp_billing_export_v1

# 2. CREATE BUDGET ALERTS
gcloud billing budgets create \
  --billing-account=<YOUR_BILLING_ACCOUNT_ID> \
  --display-name="Agape Sovereign - Monthly Budget ($50)" \
  --budget-amount=50USD \
  --threshold-rule=percent=0.5,basis=current-spend \
  --threshold-rule=percent=0.75,basis=current-spend \
  --threshold-rule=percent=0.9,basis=current-spend \
  --threshold-rule=percent=1.0,basis=current-spend \
  --all-services

# 3. FREE TIER WARNING ($1 equivalent)
gcloud billing budgets create \
  --billing-account=<YOUR_BILLING_ACCOUNT_ID> \
  --display-name="Agape Sovereign - Free Tier Warning" \
  --budget-amount=1USD \
  --threshold-rule=percent=0.5,basis=current-spend \
  --threshold-rule=percent=0.8,basis=current-spend \
  --all-services


# ─── AUTOMATED SETUP (Terraform) ──────────────────────────────────────────────

cd /Users/aarondavid/Documents/agape-sovereign/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your billing_account_id

terraform init
terraform plan
terraform apply


# ─── BILLING ANALYSIS QUERIES (Run in BigQuery Console) ────────────────────────

# July 2026 Detailed Breakdown
SELECT
  DATE(usage_start_time, 'America/New_York') AS usage_date,
  service.description AS service,
  sku.description AS sku,
  SUM(cost) AS daily_cost_usd,
  SUM(usage.amount) AS usage_quantity,
  usage.unit
FROM `agape-sovereign.billing_export.gcp_billing_export_v1_*`
WHERE DATE(usage_start_time, 'America/New_York') BETWEEN '2026-07-01' AND '2026-07-31'
  AND project.id = 'agape-sovereign'
GROUP BY usage_date, service, sku, usage_quantity, usage_unit
ORDER BY usage_date, daily_cost_usd DESC;

# Aug 2019 - Jul 2026 Monthly Trend
SELECT
  FORMAT_DATE('%Y-%m', DATE(usage_start_time, 'America/New_York')) AS month,
  service.description AS service,
  SUM(cost) AS total_cost_usd
FROM `agape-sovereign.billing_export.gcp_billing_export_v1_*`
WHERE DATE(usage_start_time, 'America/New_York') BETWEEN '2019-08-01' AND '2026-07-31'
  AND project.id = 'agape-sovereign'
GROUP BY month, service
ORDER BY month DESC, total_cost_usd DESC;

# Free Tier Utilization (Last 30 days)
WITH daily AS (
  SELECT
    DATE(usage_start_time, 'America/New_York') AS date,
    service.description AS service,
    sku.description AS sku,
    SUM(usage.amount) AS usage,
    usage.unit
  FROM `agape-sovereign.billing_export.gcp_billing_export_v1_*`
  WHERE DATE(usage_start_time, 'America/New_York') >= DATE_SUB(CURRENT_DATE('America/New_York'), INTERVAL 30 DAY)
    AND project.id = 'agape-sovereign'
    AND service.description IN ('Cloud Firestore', 'Cloud Functions', 'Firebase Hosting', 'Cloud Storage')
  GROUP BY date, service, sku, usage, unit
)
SELECT
  date,
  service,
  sku,
  usage,
  unit,
  CASE
    WHEN service = 'Cloud Firestore' AND sku LIKE '%Read%' THEN usage / 50000 * 100
    WHEN service = 'Cloud Firestore' AND sku LIKE '%Write%' THEN usage / 20000 * 100
    WHEN service = 'Cloud Functions' AND sku LIKE '%Invocations%' THEN usage / 66667 * 100
    WHEN service = 'Firebase Hosting' AND sku LIKE '%GB%' THEN usage / 12 * 100
    WHEN service = 'Cloud Storage' AND sku LIKE '%GB%' THEN usage / 0.166 * 100
    ELSE NULL
  END AS pct_of_daily_free_limit
FROM daily
ORDER BY date DESC, service;


# ─── FIREBASE FREE TIER LIMITS (Spark Plan) ───────────────────────────────────
# Service                 | Daily Limit          | Monthly Limit
# ────────────────────────|──────────────────────|──────────────────
# Firestore Reads         | 50,000               | ~1.5M
# Firestore Writes        | 20,000               | ~600K
# Firestore Deletes       | 20,000               | ~600K
# Firestore Storage       | 1 GB                 | 1 GB
# Cloud Functions         | 2M invocations/mo    | 2M invocations
# Cloud Functions GB-sec  | 400,000              | 400,000
# Cloud Functions CPU-sec | 200,000              | 200,000
# Firebase Hosting        | 10 GB storage        | 10 GB
# Firebase Hosting        | 360 MB/day egress    | ~10 GB/mo
# Cloud Storage           | 5 GB storage         | 5 GB
# Cloud Storage           | 1 GB/day egress      | ~30 GB/mo
# Cloud Build             | 120 build-min/day    | 3,600 build-min
# Artifact Registry       | 0.5 GB storage       | 0.5 GB


# ─── DAILY BUDGET MONITORING ──────────────────────────────────────────────────

# Option A: GitHub Actions (scheduled daily)
# Already configured in .github/workflows/deploy.yml (budget-check job)

# Option B: Cloud Scheduler + Cloud Function
gcloud scheduler jobs create http daily-budget-check \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-agape-sovereign.cloudfunctions.net/budget-check" \
  --http-method=POST \
  --oauth-service-account-email="budget-check@agape-sovereign.iam.gserviceaccount.com"

# Option C: Manual run
node scripts/budget-check.js


# ─── USEFUL COMMANDS ──────────────────────────────────────────────────────────

# View current budgets
gcloud billing budgets list --billing-account=<BILLING_ACCOUNT_ID>

# View billing export status
gcloud billing accounts describe <BILLING_ACCOUNT_ID> --format="value(billingExportConfig)"

# Check BigQuery export data
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) FROM \`agape-sovereign.billing_export.gcp_billing_export_v1_*\`"

# View recent costs (last 7 days)
bq query --use_legacy_sql=false \
  "SELECT DATE(usage_start_time) as date, SUM(cost) as cost FROM \`agape-sovereign.billing_export.gcp_billing_export_v1_*\` WHERE DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) GROUP BY date ORDER BY date DESC"


# ─── RECOMMENDED BUDGETS FOR AGAPE SOVEREIGN ──────────────────────────────────
# Based on DEPLOYMENT_GUIDE.md recommendation: "$50/month spending limit"
#
# Budget Tier          | Amount | Thresholds          | Purpose
# ─────────────────────|--------|---------------------|────────────────────
# Free Tier Warning    | $1     | 50%, 80%            | Alert before leaving free tier
# Monthly Budget       | $25    | 50%, 75%, 90%, 100% | Primary budget (per DEPLOYMENT_GUIDE)
# Hard Limit           | $50    | 100%                | Emergency stop (DEPLOYMENT_GUIDE max)
# Emergency Stop       | $100   | 100%                | Absolute ceiling


# ─── FILES CREATED ────────────────────────────────────────────────────────────
# scripts/
#   ├── setup-billing-export.sh      # Interactive billing export setup
#   ├── create-budget-alerts.sh      # gcloud budget creation
#   ├── budget-check.js              # Daily budget monitoring (Node.js)
#   └── billing-queries/             # BigQuery SQL analysis queries
# terraform/
#   ├── billing.tf                   # Main Terraform config
#   ├── variables.tf                 # Variable definitions
#   ├── outputs.tf                   # Outputs
#   └── terraform.tfvars.example     # Variables template
# .github/workflows/
#   └── deploy.yml                   # CI/CD with budget check


# ─── NEXT STEPS ───────────────────────────────────────────────────────────────
# 1. Run: ./scripts/setup-billing-export.sh <BILLING_ACCOUNT_ID>
# 2. Complete manual step in Console (billing export)
# 3. Run: ./scripts/create-budget-alerts.sh <BILLING_ACCOUNT_ID>
# 4. Wait 24-48 hours for first billing data
# 5. Run analysis queries in BigQuery
# 6. Share CSV/results for July 2026 + Aug 2019-Jul 2026 analysis