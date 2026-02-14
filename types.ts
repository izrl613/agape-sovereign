
export enum AppView {
  DASHBOARD = 'dashboard',
  SOURCES = 'sources',
  SCANNER = 'scanner',
  ENCLAVE = 'enclave',   
  ARCHITECT = 'architect',
}

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MODERATE = 'moderate',
  SAFE = 'safe'
}

export type DiscoveryType = 'PII' | 'SECRET' | 'IDENTITY_BROKER' | 'BIOMETRIC' | 'GENERAL';

export interface EmailArtifact {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  risk: RiskLevel;
  type: DiscoveryType;
}

export interface LinkedAccount {
  id: string;
  platform: 'Google' | 'X' | 'Meta' | 'GitHub' | 'LinkedIn';
  handle: string;
  status: 'synced' | 'pending' | 'revoked';
  lastSync: string;
}

export interface HardwareNode {
  id: string;
  model: string;
  os: string;
  status: 'authenticated' | 'standby' | 'attested';
  lastHandshake: string;
}

export interface ComplianceItem {
  id: string;
  label: string;
  status: 'passed' | 'failed' | 'pending';
  description: string;
}
