export interface IdentityVector {
  id: string;
  name: string;
  description: string;
  encryptionLevel: 'Standard' | 'High' | 'Quantum-Resistant';
  status: 'Active' | 'Processing' | 'Idle' | 'Purging';
  agentId: string;
  icon: string;
}

export type VectorDataPayload = Record<string, any>;
