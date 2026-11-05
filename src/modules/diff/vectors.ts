import { SovereignState } from './DiffEngine';

export interface IdentityVector {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const DIFF_VECTORS: IdentityVector[] = [
  // Category A: Communications
  { id: 'comm_1', label: 'Email Breach Scanner', category: 'Communications', description: 'Scans for dark web stealer logs.' },
  { id: 'comm_2', label: 'Phone/SIM-Swap Vector', category: 'Communications', description: 'Audits carrier PIN statuses.' },
  { id: 'comm_3', label: 'Password Entropy Vault', category: 'Communications', description: 'Evaluates password reuse patterns.' },
  { id: 'comm_4', label: 'Universal Passkey Registry', category: 'Communications', description: 'Tracks FIDO2 hardware key deployment.' },
  
  // Category B: Social/Deep Web
  { id: 'soc_1', label: 'Social Media Scanner', category: 'Social/Deep Web', description: 'Maps reputation vulnerabilities.' },
  { id: 'soc_2', label: 'Data Broker Engine', category: 'Social/Deep Web', description: 'Dispatches automated opt-out requests.' },
  { id: 'soc_3', label: 'Darknet Index Monitor', category: 'Social/Deep Web', description: 'Surveillance across .onion domains.' },
  { id: 'soc_4', label: 'Public Record De-Indexing', category: 'Social/Deep Web', description: 'Tracks real estate and court filings.' },
  
  // Category C: Hardware/Network
  { id: 'hw_1', label: 'Local File Scanner', category: 'Hardware/Network', description: 'Offline scan for unencrypted PII.' },
  { id: 'hw_2', label: 'Mobile Posture Audit', category: 'Hardware/Network', description: 'Audits OS patch levels.' },
  { id: 'hw_3', label: 'Cloud Storage Scanner', category: 'Hardware/Network', description: 'Identifies exposed share links.' },
  { id: 'hw_4', label: 'Network Footprint', category: 'Hardware/Network', description: 'Analyzes IP entropy and WebRTC leaks.' },
  
  // Category D: Financial/Legal
  { id: 'fin_1', label: 'Financial Identity Vector', category: 'Financial/Legal', description: 'Monitors credit bureau freeze status.' },
  { id: 'fin_2', label: 'AI-Clone Defense', category: 'Financial/Legal', description: 'Monitors for voice/facial training exposure.' },
  { id: 'fin_3', label: 'OAuth Token Revocation', category: 'Financial/Legal', description: 'Scans dormant 3rd party permissions.' },
  { id: 'fin_4', label: 'Legal Sovereignty Ledger', category: 'Financial/Legal', description: 'Immutable ledger of deletion notices.' },
];
