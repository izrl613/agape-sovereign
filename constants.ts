export const DEFAULT_CONFIG = {
  projectId: 'agape-sovereign',
  region: 'us-central1',
  mcpServerName: 'mcp-hello-world',
  githubRepo: 'izrl613/agape-sovereign',
};

// The Local "Antivirus" Definitions for Privacy
export const PRIVACY_DEFINITIONS_DB = [
  { id: 'DEF-001', entity: 'Acxiom', pattern: 'Identity Graphing', risk: 'critical' },
  { id: 'DEF-002', entity: 'Epsilon', pattern: 'Pixel Tracking', risk: 'critical' },
  { id: 'DEF-003', entity: 'Oracle BlueKai', pattern: 'Behavioral Auction', risk: 'high' },
  { id: 'DEF-004', entity: 'Experian', pattern: 'Credit Ledger Scrape', risk: 'high' },
  { id: 'DEF-005', entity: 'Unroll.Me', pattern: 'Mailbox Scraping', risk: 'critical' }, // Ironic, but true
  { id: 'DEF-006', entity: 'Google Location', pattern: 'Timeline History', risk: 'moderate' },
];

export const SCRIPTS = {
  SOVEREIGN_HEALER: (projectId: string, serviceName: string) => `
# SOVEREIGN ENCLAVE CLOUD RUN DEPLOYMENT PROTOCOL
# 1. Ensure project is active
gcloud config set project ${projectId}

# 2. Deploy from local source
gcloud run deploy ${serviceName} \\
  --source . \\
  --region us-central1 \\
  --allow-unauthenticated \\
  --memory 512Mi \\
  --cpu 1 \\
  --timeout 300
`,
  ACM_LEVEL_CREATE: `gcloud access-context-manager levels create PASSKEY_ENFORCED`
};