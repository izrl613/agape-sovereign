
export enum SetupStep {
  PREREQUISITES = 'prerequisites',
  TERRAFORM = 'terraform',
  MCP_SERVER = 'mcp_server',
  CLOUDFLARE = 'cloudflare',
  TROUBLESHOOTING = 'troubleshooting'
}

export enum AppView {
  SOURCES = 'sources',
  SCANNER = 'scanner',
  MY_STUFF = 'my_stuff', // The "Vault"
  ENCLAVE = 'enclave',   // The "Architect / Admin"
}

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MODERATE = 'moderate',
  SAFE = 'safe'
}

export interface EmailProvider {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'authorizing';
  lastScan: string | null;
}

export interface PrivacyThreat {
  id: string;
  source: string;
  subject: string;
  emailProviderId: string;
  riskLevel: RiskLevel;
  detectedVia: string;
  timestamp: string;
  suggestedAction?: 'NUKE' | 'FT_KNOX' | 'IGNORE';
}

export interface VaultItem {
  id: string;
  title: string;
  origin: string;
  timestamp: string;
  type: 'document' | 'image' | 'thread';
  encryption: 'AES-256-GCM';
}

export interface PrivacyDefinition {
  id: string;
  entity: string;
  pattern: string;
  risk: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isPinned?: boolean;
}

export interface ApiKeyEvent {
  id: string;
  type: 'provision' | 'revocation' | 'visibility_toggle';
  timestamp: string;
  details: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  expiresAt: string;
  isVisible: boolean;
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked';
  auditTrail: ApiKeyEvent[];
}

export interface PasskeyRecord {
  id: string;
  rawId: string;
  label: string;
  type: string;
  algorithm: string;
  addedAt: string;
  lastUsedAt: string | null;
  status: 'active' | 'verified' | 'revoked';
}

export interface EnclaveProfile {
  minInstances: number;
  maxInstances: number;
  concurrency: number;
  cpuMode: 'always_on' | 'on_demand';
  postQuantumEnabled: boolean;
}

export interface SystemVitals {
  cpuUsage: number;
  memoryUsage: number;
  activeRequests: number;
  uptime: string;
}
