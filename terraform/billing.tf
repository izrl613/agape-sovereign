# Agape Sovereign - Terraform Billing Configuration
# Manages GCP Billing Budgets, Alerts, and BigQuery Export

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "agape-sovereign-terraform-state"
    prefix = "billing"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ─── Variables ──────────────────────────────────────────────────────────────
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "agape-sovereign"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "billing_account_id" {
  description = "GCP Billing Account ID (e.g., 012345-ABCDEF-123456)"
  type        = string
}

variable "budget_amount_usd" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 50
}

variable "budget_alert_thresholds" {
  description = "Alert thresholds as percentages of budget"
  type        = list(number)
  default     = [0.5, 0.75, 0.9, 1.0]
}

variable "bigquery_dataset_id" {
  description = "BigQuery dataset for billing export"
  type        = string
  default     = "billing_export"
}

variable "bigquery_table_id" {
  description = "BigQuery table for billing export"
  type        = string
  default     = "gcp_billing_export_v1"
}

variable "budget_alert_pubsub_topic" {
  description = "Pub/Sub topic for budget notifications"
  type        = string
  default     = "projects/agape-sovereign/topics/billing-alerts"
}

variable "labels" {
  description = "Labels for all resources"
  type        = map(string)
  default     = {}
}

# ─── BigQuery Dataset for Billing Export ────────────────────────────────────
resource "google_bigquery_dataset" "billing_export" {
  dataset_id    = var.bigquery_dataset_id
  location      = "US"
  description   = "GCP Billing Export data for project ${var.project_id}"
  labels        = var.labels
  default_table_expiration_ms = 365 * 24 * 60 * 60 * 1000  # 1 year retention
  access {
    role          = "READER"
    special_group = "projectReaders"
  }
  access {
    role          = "WRITER"
    special_group = "projectWriters"
  }
  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }
}

# ─── Billing Export to BigQuery ─────────────────────────────────────────────
# Note: This requires the google-beta provider and Billing Account Administrator role
resource "google_billing_budget" "billing_export" {
  provider = google-beta

  billing_account = var.billing_account_id
  display_name    = "${var.project_id}-billing-export"
  description     = "Export billing data to BigQuery for analysis"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }
}

# ─── Pub/Sub Topic for Budget Alerts ────────────────────────────────────────
resource "google_pubsub_topic" "billing_alerts" {
  name = "billing-alerts"
  labels = var.labels
}

# ─── Pub/Sub Subscription for Cloud Function (optional) ─────────────────────
resource "google_pubsub_subscription" "billing_alerts_function" {
  name  = "billing-alerts-function-sub"
  topic = google_pubsub_topic.billing_alerts.id
  ack_deadline_seconds = 600
  labels = var.labels
}

# ─── Monthly Budget with Alerts ──────────────────────────────────────────────
resource "google_billing_budget" "monthly_budget" {
  provider = google-beta

  billing_account = var.billing_account_id
  display_name    = "${var.project_id}-monthly-budget-\$${var.budget_amount_usd}"
  description     = "Monthly budget for ${var.project_id} with alerts at ${join(", ", var.budget_alert_thresholds)} thresholds"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = var.budget_amount_usd
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.75
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.9
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  notifications_rule {
    pubsub_topic = google_pubsub_topic.billing_alerts.id
    schema_version = "1.0"
    monitoring_notification_channels = []
  }
}

# ─── Free Tier Warning Budget (~$1/month equivalent) ────────────────────────
resource "google_billing_budget" "free_tier_warning" {
  provider = google-beta

  billing_account = var.billing_account_id
  display_name    = "${var.project_id}-free-tier-warning"
  description     = "Alert when approaching free tier limits (~$1 equivalent)"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = 1
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }

  notifications_rule {
    pubsub_topic = google_pubsub_topic.billing_alerts.id
    schema_version = "1.0"
  }
}

# ─── Emergency Stop Budget ($100) ────────────────────────────────────────────
resource "google_billing_budget" "emergency_stop" {
  provider = google-beta

  billing_account = var.billing_account_id
  display_name    = "${var.project_id}-emergency-stop-\$100"
  description     = "Emergency alert at \$100/month - investigate immediately"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = 100
    }
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  notifications_rule {
    pubsub_topic = google_pubsub_topic.billing_alerts.id
    schema_version = "1.0"
  }
}

# ─── Cloud Function for Budget Enforcement (Optional) ────────────────────────
# Uncomment to enable automated shutdown on budget exceed
# resource "google_cloudfunctions2_function" "budget_enforcement" {
#   name        = "budget-enforcement"
#   location    = var.region
#   description = "Automatically disable billing on budget exceed"
#
#   build_config {
#     runtime     = "nodejs20"
#     entry_point = "handleBudgetAlert"
#     source {
#       storage_source {
#         bucket = "agape-sovereign-functions-source"
#         object = "budget-enforcement.zip"
#       }
#     }
#   }
#
#   service_config {
#     max_instance_count = 1
#     available_memory   = "256M"
#     timeout_seconds    = 60
#     environment_variables = {
#       PROJECT_ID = var.project_id
#     }
#   }
#
#   event_trigger {
#     event_type = "google.cloud.pubsub.topic.v1.messagePublished"
#     pubsub_topic = google_pubsub_topic.billing_alerts.id
#     service_account = "budget-enforcement@${var.project_id}.iam.gserviceaccount.com"
#   }
# }

# ─── IAM for Budget Enforcement (Optional) ──────────────────────────────────
# resource "google_service_account" "budget_enforcement" {
#   account_id   = "budget-enforcement"
#   display_name = "Budget Enforcement Service Account"
#   labels       = var.labels
# }
#
# resource "google_project_iam_member" "budget_enforcement_billing_admin" {
#   project = var.project_id
#   role    = "roles/billing.projectManager"
#   member  = "serviceAccount:${google_service_account.budget_enforcement.email}"
# }

# ─── Outputs ────────────────────────────────────────────────────────────────
output "billing_export_dataset" {
  description = "BigQuery dataset for billing export"
  value       = google_bigquery_dataset.billing_export.dataset_id
}

output "billing_export_table" {
  description = "BigQuery table for billing export (auto-created by export)"
  value       = "${google_bigquery_dataset.billing_export.dataset_id}.${var.bigquery_table_id}*"
}

output "budget_alert_topic" {
  description = "Pub/Sub topic for budget alerts"
  value       = google_pubsub_topic.billing_alerts.id
}

output "monthly_budget_name" {
  description = "Monthly budget resource name"
  value       = google_billing_budget.monthly_budget.name
}

output "free_tier_budget_name" {
  description = "Free tier warning budget resource name"
  value       = google_billing_budget.free_tier_warning.name
}

output "emergency_budget_name" {
  description = "Emergency stop budget resource name"
  value       = google_billing_budget.emergency_stop.name
}