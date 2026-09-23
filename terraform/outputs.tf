# Agape Sovereign - Terraform Outputs
# Billing Configuration Outputs

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "billing_account_id" {
  description = "GCP Billing Account ID"
  value       = var.billing_account_id
  sensitive   = true
}

output "bigquery_dataset_id" {
  description = "BigQuery dataset for billing export"
  value       = google_bigquery_dataset.billing_export.dataset_id
}

output "billing_export_table_pattern" {
  description = "BigQuery table pattern for billing export queries"
  value       = "${google_bigquery_dataset.billing_export.dataset_id}.${var.bigquery_table_id}*"
}

output "budget_alert_pubsub_topic" {
  description = "Pub/Sub topic for budget alerts"
  value       = google_pubsub_topic.billing_alerts.id
}

output "budget_alert_pubsub_subscription" {
  description = "Pub/Sub subscription for budget alert consumer"
  value       = google_pubsub_subscription.billing_alerts_function.id
}

output "monthly_budget" {
  description = "Monthly budget configuration"
  value = {
    name        = google_billing_budget.monthly_budget.name
    display_name = google_billing_budget.monthly_budget.display_name
    amount_usd  = var.budget_amount_usd
    thresholds  = var.budget_alert_thresholds
  }
}

output "free_tier_warning_budget" {
  description = "Free tier warning budget configuration"
  value = {
    name        = google_billing_budget.free_tier_warning.name
    display_name = google_billing_budget.free_tier_warning.display_name
    amount_usd  = 1
    thresholds  = [0.5, 0.8]
  }
}

output "emergency_stop_budget" {
  description = "Emergency stop budget configuration"
  value = {
    name        = google_billing_budget.emergency_stop.name
    display_name = google_billing_budget.emergency_stop.display_name
    amount_usd  = 100
    thresholds  = [1.0]
  }
}

output "terraform_state_backend" {
  description = "Terraform state backend configuration"
  value = {
    bucket = "agape-sovereign-terraform-state"
    prefix = "billing"
  }
}

output "next_steps" {
  description = "Manual steps required after Terraform apply"
  value = [
    "1. Enable Billing Export to BigQuery in Console: https://console.cloud.google.com/billing/linkedaccount?project=agape-sovereign",
    "2. Or use REST API: POST https://cloudbilling.googleapis.com/v1/billingAccounts/${var.billing_account_id}:setBillingExportConfig",
    "3. Verify BigQuery dataset receives data after 24-48 hours",
    "4. Set up budget alert Cloud Function (optional): deploy scripts/budget-check.js as Cloud Function",
    "5. Configure Slack/email notifications via Pub/Sub subscription"
  ]
}