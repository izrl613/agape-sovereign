export type VectorStatus = 'EXPOSED' | 'KNOXED' | 'NUKED' | 'MONITORED';

export type VectorCategory = 
  | 'COMMUNICATIONS'
  | 'DIGITAL_PRESENCE'
  | 'DEVICES_SYSTEMS'
  | 'DEEP_WEB_BROKERS'
  | 'CREDENTIALS_FINANCE';

export interface DiffVector {
  id: string;
  moduleNumber: number;
  name: string;
  category: VectorCategory;
  shortDesc: string;
  dataValue: string;
  exposureDetails: string;
  status: VectorStatus;
  sha256Hash: string;
  sourceInspiration: string; // e.g., 'Firefox Monitor', 'SayMine', 'Jumbo', 'Optery'
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  nukedAction: string;
  knoxedAction: string;
  lastScanned: string;
}

export interface UserProfile {
  fullName: string;
  primaryEmail: string;
  backupEmails: string[];
  federatedProvider: 'Google' | 'Apple';
  passkeyStatus: 'BOUND' | 'PENDING' | 'HARDWARE_ENFORCED';
  passkeyDeviceId: string;
  masterKeyHash: string;
  createdAt: string;
  sovereignScore: number;
  cloudAuditId: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  serviceName: string;
  status: 'OPTIMAL' | 'SECURED' | 'ALERT';
  latencyMs: number;
  operation: string;
  shaFingerprint: string;
}

export interface AdminTelemetryState {
  cloudRunStatus: string;
  webAuthnHandshakes: number;
  zeroKnowledgeViolations: number;
  nodeHealth: number;
  activeEcraProtocol: string;
  logs: TelemetryLog[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'architect_ai';
  text: string;
  timestamp: string;
  suggestedAction?: 'NUKE' | 'KNOX' | 'AUDIT';
  vectorReferenceId?: string;
}
