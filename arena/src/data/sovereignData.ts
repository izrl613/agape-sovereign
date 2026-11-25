export type FindingStatus = 'NUKED' | 'KNOXED' | 'MONITORED';

export interface VectorFinding {
  id: string;
  type: FindingStatus;
  label: string;
  detail: string;
  action: string;
}

export interface DiffModule {
  id: string;
  vector: string;
  label: string;
  description: string;
  nuked: number;
  knoxed: number;
  monitored: number;
  severity: number;
  findings: VectorFinding[];
}

export type AuthProviderType = 'passkey' | 'google' | 'guest';

export interface SovereignUser {
  uid: string;
  displayName: string;
  email: string;
  provider: AuthProviderType;
  isAdmin: boolean;
  guestExpiresAt?: number;
}

export const NEON = {
  magenta: '#FF2E9F',
  blue: '#00D4FF',
  orange: '#FF7A18',
  bg: '#060D1F',
  bgCard: 'rgba(8, 18, 40, 0.85)',
  text: '#E8F4FF',
  textMuted: '#7B9BB5',
} as const;

export const ADMIN_EMAILS = ['idin@agape.nyc', 'agape@sovereign.nyc'];

export const INITIAL_DIFF_MODULES: DiffModule[] = [
  {
    id: 'email',
    vector: 'V-01',
    label: 'Email Breach Scanner',
    description: 'Breach detection, metadata exposure & header IP sanitization',
    nuked: 2,
    knoxed: 3,
    monitored: 1,
    severity: 76,
    findings: [
      { id: 'v01-1', type: 'NUKED', label: 'Legacy paste dump exposure', detail: '2021 credential combo list — purge request dispatched', action: 'Purge verified' },
      { id: 'v01-2', type: 'MONITORED', label: 'SMTP header metadata leak', detail: 'Originating client IP visible in outbound relay headers', action: 'Enable relay masking' },
      { id: 'v01-3', type: 'KNOXED', label: 'Primary alias breach-clear', detail: 'Zero matches in HaveIBeenPwned & enclave feeds', action: 'Hardened' },
    ],
  },
  {
    id: 'social',
    vector: 'V-02',
    label: 'Social Media Footprint',
    description: 'Username reuse, profile scraping & public graph audit',
    nuked: 1,
    knoxed: 2,
    monitored: 2,
    severity: 72,
    findings: [
      { id: 'v02-1', type: 'NUKED', label: 'Cross-platform handle correlation', detail: 'Legacy forum handle linked to public bio', action: 'De-indexed' },
      { id: 'v02-2', type: 'MONITORED', label: 'Public follower graph scraping', detail: 'Open API visibility on social profile', action: 'Restrict visibility' },
      { id: 'v02-3', type: 'KNOXED', label: 'OAuth app permissions pruned', detail: '14 stale third-party tokens revoked', action: 'Secured' },
    ],
  },
  {
    id: 'device',
    vector: 'V-03',
    label: 'Device File Scan',
    description: 'Local & cloud file analysis, EXIF & PII artifact scrubbing',
    nuked: 1,
    knoxed: 4,
    monitored: 1,
    severity: 84,
    findings: [
      { id: 'v03-1', type: 'NUKED', label: 'Unencrypted tax PDF cache', detail: 'Temporary downloads folder artifact zero-erased', action: 'Scrubbed' },
      { id: 'v03-2', type: 'KNOXED', label: 'FileVault / FDE active', detail: 'AES-256-XTS volume encryption verified', action: 'Hardened' },
      { id: 'v03-3', type: 'MONITORED', label: 'EXIF GPS tags in media', detail: '12 local images contain camera coordinates', action: 'Strip EXIF' },
    ],
  },
  {
    id: 'mobile',
    vector: 'V-04',
    label: 'Mobile Security Layer',
    description: 'Passkey enforcement, 2FA status & Android enclave integrity',
    nuked: 0,
    knoxed: 5,
    monitored: 1,
    severity: 92,
    findings: [
      { id: 'v04-1', type: 'KNOXED', label: 'WebAuthn Passkey bound', detail: 'Hardware-backed FIDO2 attestation active', action: 'Verified' },
      { id: 'v04-2', type: 'KNOXED', label: 'SIM-swap carrier lock', detail: 'Port-out PIN & hardware 2FA enforced', action: 'Hardened' },
      { id: 'v04-3', type: 'MONITORED', label: 'Background telemetry permission', detail: '2 apps requesting coarse location in background', action: 'Review permissions' },
    ],
  },
  {
    id: 'deepweb',
    vector: 'V-05',
    label: 'Deep Web Exposure',
    description: 'Pattern-based lookup monitoring across unindexed directories',
    nuked: 2,
    knoxed: 2,
    monitored: 1,
    severity: 68,
    findings: [
      { id: 'v05-1', type: 'NUKED', label: 'Unindexed WHOIS historical record', detail: 'Registrar privacy proxy applied & cached copy purged', action: 'Nuked' },
      { id: 'v05-2', type: 'MONITORED', label: 'Archived public court/directory mirror', detail: 'Pattern match detected on mirror node', action: 'File GDPR Art. 16 claim' },
      { id: 'v05-3', type: 'KNOXED', label: 'DNS-over-HTTPS enforced', detail: 'Encrypted resolver active on all endpoints', action: 'Secured' },
    ],
  },
  {
    id: 'broker',
    vector: 'V-06',
    label: 'Data Broker Removal',
    description: 'Automated removal template generation & CCPA/GDPR opt-outs',
    nuked: 3,
    knoxed: 2,
    monitored: 2,
    severity: 58,
    findings: [
      { id: 'v06-1', type: 'NUKED', label: 'People-search aggregator profiles', detail: 'Spokeo, Whitepages, BeenVerified opt-outs dispatched', action: 'Removal queued' },
      { id: 'v06-2', type: 'NUKED', label: 'Marketing audience segment broker', detail: 'CCPA Right to Delete & Rectify notice sent', action: 'Purge active' },
      { id: 'v06-3', type: 'MONITORED', label: 'LexisNexis / Acxiom refresh cycle', detail: '90-day re-indexing watch scheduled', action: 'Monitor' },
    ],
  },
  {
    id: 'password',
    vector: 'V-07',
    label: 'Password Vault Analysis',
    description: 'Weak credential detection, reuse & passkey migration',
    nuked: 1,
    knoxed: 4,
    monitored: 1,
    severity: 86,
    findings: [
      { id: 'v07-1', type: 'NUKED', label: 'Reused legacy password retired', detail: 'Replaced with 24-char CSPRNG secret', action: 'Rotated' },
      { id: 'v07-2', type: 'KNOXED', label: 'Zero-knowledge vault encrypted', detail: 'Argon2id + AES-256-GCM key derivation verified', action: 'Hardened' },
      { id: 'v07-3', type: 'MONITORED', label: '3 accounts eligible for Passkey', detail: 'Upgrade from TOTP to FIDO2 passkeys', action: 'Upgrade' },
    ],
  },
  {
    id: 'location',
    vector: 'V-08',
    label: 'Location Data Footprint',
    description: 'GPS history, SDK telemetry & metadata exposure',
    nuked: 1,
    knoxed: 3,
    monitored: 1,
    severity: 79,
    findings: [
      { id: 'v08-1', type: 'NUKED', label: 'Ad-SDK location ping history', detail: 'Advertising ID reset & history purged', action: 'Purged' },
      { id: 'v08-2', type: 'KNOXED', label: 'Precise location disabled', detail: 'Approximate-only mode enforced for non-nav apps', action: 'Hardened' },
      { id: 'v08-3', type: 'MONITORED', label: 'Wi-Fi BSSID SSID broadcast', detail: 'Randomized MAC address enabled on mobile', action: 'Verify' },
    ],
  },
  {
    id: 'browser',
    vector: 'V-09',
    label: 'Browser & Cookie Tracker',
    description: 'Third-party tracking detection & fingerprint resistance',
    nuked: 2,
    knoxed: 3,
    monitored: 1,
    severity: 81,
    findings: [
      { id: 'v09-1', type: 'NUKED', label: 'Cross-site CNAME trackers blocked', detail: '47 tracking cookies & localStorage tokens cleared', action: 'Purged' },
      { id: 'v09-2', type: 'KNOXED', label: 'Canvas/WebGL fingerprint randomization', detail: 'Strict container isolation active', action: 'Secured' },
      { id: 'v09-3', type: 'MONITORED', label: 'Extension permission audit', detail: '1 extension requests broad host access', action: 'Restrict' },
    ],
  },
  {
    id: 'financial',
    vector: 'V-10',
    label: 'Financial Identity Exposure',
    description: 'Banking/payment data leaks & stale credit record rectification',
    nuked: 1,
    knoxed: 3,
    monitored: 2,
    severity: 66,
    findings: [
      { id: 'v10-1', type: 'NUKED', label: 'Stale legacy credit record', detail: 'Flagged for Human Dignity Rectification Engine', action: 'Rectify via HDI' },
      { id: 'v10-2', type: 'KNOXED', label: 'Virtual card masking active', detail: 'Merchant-locked virtual PANs enabled', action: 'Hardened' },
      { id: 'v10-3', type: 'MONITORED', label: 'Credit bureau freeze status', detail: 'Equifax & Experian freeze verified; TransUnion pending', action: 'Confirm freeze' },
    ],
  },
  {
    id: 'medical',
    vector: 'V-11',
    label: 'Medical Data Footprint',
    description: 'Health record exposure & HIPAA/GDPR special category guard',
    nuked: 0,
    knoxed: 4,
    monitored: 1,
    severity: 88,
    findings: [
      { id: 'v11-1', type: 'KNOXED', label: 'Patient portal MFA enforced', detail: 'Zero unauthorized OAuth health-app links', action: 'Secured' },
      { id: 'v11-2', type: 'MONITORED', label: 'Wellness app telemetry opt-out', detail: 'Disable anonymized data sharing in wearable settings', action: 'Opt-out' },
    ],
  },
  {
    id: 'biometric',
    vector: 'V-12',
    label: 'Voice & Biometric Data',
    description: 'Biometric sample detection & on-device enclave isolation',
    nuked: 1,
    knoxed: 3,
    monitored: 1,
    severity: 83,
    findings: [
      { id: 'v12-1', type: 'NUKED', label: 'Cloud voice assistant clips', detail: 'Voice recording history deleted & retention disabled', action: 'Purged' },
      { id: 'v12-2', type: 'KNOXED', label: 'Local Secure Enclave biometrics', detail: 'Templates never leave hardware TPM/Keystore', action: 'Hardened' },
    ],
  },
  {
    id: 'iot',
    vector: 'V-13',
    label: 'IoT & Smart Device Scan',
    description: 'Connected device security audit & VLAN segmentation',
    nuked: 1,
    knoxed: 2,
    monitored: 2,
    severity: 74,
    findings: [
      { id: 'v13-1', type: 'NUKED', label: 'UPnP port forwarding disabled', detail: 'Closed 2 exposed smart-hub ports on gateway', action: 'Closed' },
      { id: 'v13-2', type: 'MONITORED', label: 'Guest IoT VLAN isolation', detail: '3 smart devices pending separate SSID assignment', action: 'Isolate' },
    ],
  },
  {
    id: 'cloud',
    vector: 'V-14',
    label: 'Cloud Storage Exposure',
    description: 'Google Drive, OneDrive, iCloud public link & ACL audit',
    nuked: 1,
    knoxed: 4,
    monitored: 1,
    severity: 85,
    findings: [
      { id: 'v14-1', type: 'NUKED', label: 'Publicly shared link revoked', detail: '1 legacy shared folder set back to private ACL', action: 'Revoked' },
      { id: 'v14-2', type: 'KNOXED', label: 'Client-side encrypted vault', detail: 'IndexedDB & Drive DPC archive AES-256-GCM wrapped', action: 'Secured' },
    ],
  },
  {
    id: 'darkweb',
    vector: 'V-15',
    label: 'Dark Web Monitoring',
    description: 'Dark web credential indexing & stealer-log surveillance',
    nuked: 1,
    knoxed: 3,
    monitored: 1,
    severity: 77,
    findings: [
      { id: 'v15-1', type: 'NUKED', label: '2022 stealer-log session token', detail: 'All refresh tokens invalidated & rotated', action: 'Invalidated' },
      { id: 'v15-2', type: 'KNOXED', label: 'Continuous hash-prefix watch', detail: 'Zero-knowledge k-anonymity feed active', action: 'Active' },
    ],
  },
  {
    id: 'behavioral',
    vector: 'V-16',
    label: 'Behavioral Profile Analysis',
    description: 'Inferred demographic mapping & algorithmic profiling defense',
    nuked: 2,
    knoxed: 2,
    monitored: 1,
    severity: 70,
    findings: [
      { id: 'v16-1', type: 'NUKED', label: 'Ad-personalization profile reset', detail: 'Inferred interest segments purged across 4 networks', action: 'Purged' },
      { id: 'v16-2', type: 'MONITORED', label: 'LLM training opt-out flags', detail: 'Verify zero-retention headers on external AI endpoints', action: 'Enforce' },
    ],
  },
];

export interface PipelineAgent {
  stage: number;
  name: string;
  role: string;
  outputArtifact: string;
}

export const PIPELINE_AGENTS: PipelineAgent[] = [
  { stage: 1, name: 'ExtractionEngine', role: 'Ingests raw identity & document streams into chunked enclave buffers', outputArtifact: 'raw_chunks.bin' },
  { stage: 2, name: 'ExtractionAgent (NER/LLM)', role: 'Extracts entities, PII tokens & exposure markers via local LLM', outputArtifact: 'ner_entities.json' },
  { stage: 3, name: 'DataMapper', role: 'Normalizes extracted fields onto the 16-Vector DIFF schema', outputArtifact: 'mapped_vectors.json' },
  { stage: 4, name: 'DataMapper → Dict', role: 'Compiles deterministic key-value dictionary for zero-ambiguity audit', outputArtifact: 'sovereign_dict.json' },
  { stage: 5, name: 'Validator', role: 'Enforces schema integrity, ECRA 2026 & GDPR Art. 16 constraints', outputArtifact: 'validation_pass.log' },
  { stage: 6, name: 'SynthesisAgent', role: 'Generates executive privacy briefing using qwen3.5-9b / Gemma 4 E4B', outputArtifact: 'executive_briefing.md' },
  { stage: 7, name: 'AuditAgent', role: 'Performs transient memory zeroing & Zero-PII retention verification', outputArtifact: 'audit_attestation.sig' },
  { stage: 8, name: 'ReportingAgent', role: 'Assembles Sovereign Score, NUKED/KNOXED totals & HDI delta', outputArtifact: 'workflow_report.json' },
  { stage: 9, name: 'PDFGenerationAgent', role: 'Renders auditable, encrypted DPC proof ready for Local Vault or Drive', outputArtifact: 'sovereign_report.pdf' },
];

export interface ValidatorNode {
  id: string;
  organization: string;
  jurisdiction: string;
  trustTier: string;
}

export const VALIDATOR_NODES: ValidatorNode[] = [
  {
    id: 'VALIDATOR-HUMAN-RIGHTS-001',
    organization: 'Sovereign Human Dignity & Right to Rectification Council',
    jurisdiction: 'GDPR Art. 16 · UDHR Art. 12',
    trustTier: 'TIER-1 ATTESTED',
  },
  {
    id: 'VALIDATOR-SSI-ADVOCATE-002',
    organization: 'Global Human Rights Data Steward Node #002',
    jurisdiction: 'ECRA 2026 · CCPA Right to Correct',
    trustTier: 'TIER-1 ATTESTED',
  },
];

export const RECTIFICATION_CLAIM_TYPES = [
  {
    id: 'STALE_CREDIT_FINANCIAL_RECTIFICATION',
    label: 'Stale Credit / Financial Record Rectification',
    note: 'Inaccurate legacy debt or credit record purged per Human Dignity Right to Rectification',
  },
  {
    id: 'DATA_BROKER_INACCURACY_PURGE',
    label: 'Data Broker Inaccuracy & Profile Purge',
    note: 'Erroneous demographic & address aggregation scrubbed under GDPR Art. 16 & CCPA',
  },
  {
    id: 'BIOMETRIC_VOICE_ERASURE',
    label: 'Biometric / Voice Sample Zero-Retention Erasure',
    note: 'Unauthorized biometric template purged and hardware-enclave isolation attested',
  },
];

export const CLOUD_RUN_SERVICES = [
  { name: 'agape-sovereign-ee8f4200', role: 'Firebase App Hosting PWA', region: 'us-central1', status: 'READY' },
  { name: 'agape-sovereign-server', role: 'Backend Node.js Orchestrator', region: 'us-central1', status: 'READY' },
  { name: 'authapi', role: 'WebAuthn / Passkey Auth API', region: 'us-central1', status: 'READY' },
  { name: 'gemma4-mcp-server', role: 'Gemma 4 E4B MCP Server', region: 'us-central1', status: 'READY' },
  { name: 'registerpasskeyoptions', role: 'Passkey Registration Service', region: 'us-central1', status: 'READY' },
];
