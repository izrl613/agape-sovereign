# Agape Sovereign - Terraform Variables Definition
# Billing Configuration Variables

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
  validation {
    condition     = length(var.billing_account_id) > 0
    error_message = "Billing account ID must be provided."
  }
}

variable "budget_amount_usd" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 50
  validation {
    condition     = var.budget_amount_usd > 0
    error_message = "Budget amount must be greater than 0."
  }
}

variable "budget_alert_thresholds" {
  description = "Alert thresholds as percentages of budget (0.0-1.0)"
  type        = list(number)
  default     = [0.5, 0.75, 0.9, 1.0]
  validation {
    condition     = alltrue([for t in var.budget_alert_thresholds : t > 0 && t <= 1.0])
    error_message = "All thresholds must be between 0 and 1."
  }
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
  default     = {
    project     = "agape-sovereign"
    environment = "production"
    managed_by  = "terraform"
    cost_center = "agape-sovereign"
  }
}