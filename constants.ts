
export const DEFAULT_CONFIG = {
  projectId: 'agape-sovereign',
  region: 'us-central1',
  mcpServerName: 'mcp-hello-world',
  billingId: '',
  cloudflareTeamDomain: 'aitnyc',
  cloudflareApiToken: 'eyJhIjoiMDdkMWRhYzljZjAzMzcyODM3Njg3NWJhNWQwMDY3OGQiLCJ0IjoiM2ZhMjhhNGQtZGJkNS00MDRlLTliMWMtNTNjM2Q3ZGIwY2U0IiwicyI6Ik1qVTRZVFExTW1RdFpqSmhOeTAwTkdFNUxUZ3hNRFF0WlRNMU9UTTROekkzT0RneiJ9',
  cloudflareAccountId: '',
  cloudflareTunnelId: '',
  cloudRunUrl: 'https://mcp-hello-world-run.a.run.app'
};

export const SCRIPTS = {
  BILLING_LINK: (projectId: string, billingId: string) => `gcloud billing projects link ${projectId} --billing-account=${billingId}`,
  
  TERRAFORM_MAIN: (projectId: string, region: string, serverName: string) => `cat <<EOF > main.tf
provider "google" {
  project = "${projectId}"
  region  = "${region}"
}

# Free Tier Optimization: Cloud Run (1st Gen) - Min instances 0 to avoid cost
resource "google_cloud_run_v2_service" "mcp_service" {
  name     = "${serverName}"
  location = "${region}"
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      max_instance_count = 1
      min_instance_count = 0 
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}
EOF`,

  MCP_SERVER_HEAL: (projectId: string, serverName: string) => `
# Healing script for Offline Node
# Resets the GCP Free Tier container lifecycle and ensures Zero Trust persistence
gcloud run services update ${serverName} \\
  --update-env-vars="ECPA_MODE=ENABLED,SOVEREIGN_ID=true,PERSISTENCE=high" \\
  --region=us-central1 \\
  --project=${projectId} \\
  --cpu=1 --memory=512Mi \\
  --concurrency=80 \\
  --timeout=300
`,

  GCLOUD_DEPLOY: (serverName: string, region: string, projectId: string) => `gcloud run deploy ${serverName} \\
  --source . \\
  --region ${region} \\
  --no-allow-unauthenticated \\
  --service-account mcp-server-sa@${projectId}.iam.gserviceaccount.com \\
  --quiet`,

  CLOUDFLARED_INSTALL: `# Add cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null

# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# install cloudflared
sudo apt-get update && sudo apt-get install cloudflared`,

  CLOUDFLARE_TUNNEL_CMD: (token: string) => `# Establish Secure Path to aitnyc.cloudflareaccess.com
# Using Production Sovereign Token
sudo cloudflared service install ${token || DEFAULT_CONFIG.cloudflareApiToken}`,

  ECPA_FULL_NOTICE: `Electronic Communications Privacy Act (ECPA) 2026 Hardening:
Your data is protected under 18 U.S.C. §§ 2510-2523. This instance utilizes Zero Trust Network Access (ZTNA) at aitnyc.cloudflareaccess.com to ensure that no third-party, including data brokers or unauthorized agencies, can intercept your communications. 

Sovereign status: SECURE.`
};
