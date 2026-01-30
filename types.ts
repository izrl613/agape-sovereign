
export enum SetupStep {
  PREREQUISITES = 'prerequisites',
  TERRAFORM = 'terraform',
  MCP_SERVER = 'mcp_server',
  CLOUDFLARE = 'cloudflare',
  TROUBLESHOOTING = 'troubleshooting'
}

export enum AppView {
  DASHBOARD = 'dashboard',
  DEPLOY = 'deploy',
  IMAGES = 'images',
  CHAT = 'chat',
  ERADICATOR = 'eradicator',
  DATA_MAP = 'data_map',
  ECPA_SHIELD = 'ecpa_shield',
  MONITOR = 'monitor',
  EMAIL_SCANNER = 'email_scanner'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface Config {
  projectId: string;
  region: string;
  mcpServerName: string;
  billingId: string;
  cloudflareTeamDomain: string;
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  cloudflareTunnelId: string;
  cloudRunUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isPinned?: boolean;
}

export interface DeploymentRecord {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'online' | 'offline';
  timestamp: string;
  isPinned?: boolean;
}

export interface PrivacyThreat {
  id: string;
  source: 'Firefox Monitor' | 'Jumbo' | 'Say Mine' | 'Unroll.me' | 'Optery';
  entity: string;
  details: string;
  riskLevel: 'critical' | 'moderate' | 'low';
  type: 'Data Breach' | 'Subscription' | 'Data Broker' | 'Shadow Profile' | 'Removal Request';
  status?: 'pending' | 'eradicated' | 'ignored';
  breachDate?: string;
}

export interface MockEmail {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  riskReason: string;
  category: 'Tracker' | 'Data Harvest' | 'Dark Pattern' | 'ECPA Violation';
}

export interface ECPAShieldStatus {
  protectionActive: boolean;
  legalRequestsSent: number;
  lastAudit: string;
  encryptionStandard: string;
  jurisdiction: string;
}
