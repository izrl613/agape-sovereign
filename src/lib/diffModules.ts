/**
 * ============================================================
 * ARCHITECT AI — 16-Layer DIFF Module Data Structure
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Complete configuration for 16 identity vector modules.
 * This mapping strictly follows the Sovereign Enclave 2026 Specification.
 */

export interface DiffModule {
  id: string;
  vector: string; // V-01 through V-16
  icon: string;
  label: string;
  description: string;
  capabilities: string[];
  nukedTriggers: string[];
  knoxedTriggers: string[];
  severity: number; // 0-100 current severity
  nukedCount: number; // Found exposures
  knoxedCount: number; // Secured assets
  monitoredCount: number; // Items under observation
  weight: number; // Sovereign Score weight (0-1)
  lastScanned?: number; // Timestamp of last scan
  remediationSteps?: string[];
  integratedWith?: string[]; // External services/APIs
}

export const DIFF_MODULES: DiffModule[] = [
  // CATEGORY A: Communications & Credential Footprint
  {
    id: 'email-breach',
    vector: 'V-01',
    icon: '✉',
    label: 'Email Breach & Metadata Scanner',
    description: 'Scans bound email addresses against live breach databases and dark web stealer logs. Audits email header metadata to detect hidden tracking pixels and IP exposure.',
    capabilities: [
      'Cross-reference email addresses against known breach databases',
      'Identify data broker records tied to each email',
      'Analyze email metadata exposure patterns',
      'Detect alias reuse and correlation risk',
      'Identify login credential pairs in breaches',
    ],
    nukedTriggers: ['Email found in active breach', 'Credential pair exposed', 'Email tied to spam database'],
    knoxedTriggers: ['Unique alias per service', 'Breach resolved', 'No active data broker record'],
    severity: 72,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.20,
    integratedWith: ['HaveIBeenPwned', 'Dehashed', 'Google Safe Browsing'],
  },
  {
    id: 'phone-voip',
    vector: 'V-02',
    icon: '📲',
    label: 'Phone, VoIP & SIM-Swap Vector',
    description: 'Audits mobile carrier PIN statuses, detects unauthorized VoIP forwarding rules, and highlights SMS 2FA vulnerabilities to preempt SIM-swap attacks.',
    capabilities: [
      'Audit mobile carrier PIN statuses',
      'Detect unauthorized VoIP forwarding rules',
      'Highlight SMS 2FA vulnerabilities',
      'Verify port-out protection (PIN lock)',
      'Analyze VoIP provider privacy policies',
    ],
    nukedTriggers: ['PIN lock disabled', 'Unauthorized forwarding active', 'SMS 2FA enabled on high-risk account'],
    knoxedTriggers: ['Port-out protection verified', 'VoIP numbers isolated', '2FA migrated to Passkey/TOTP'],
    severity: 85,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.05,
    integratedWith: ['Telecom Carrier APIs'],
  },
  {
    id: 'credential-vault',
    vector: 'V-03',
    icon: '🔑',
    label: 'Credential & Password Entropy Vault',
    description: 'Evaluates password reuse patterns, matches local hashes against known zero-knowledge breach lists, and flags weak tokens for rotation.',
    capabilities: [
      'Evaluate password reuse patterns',
      'Match local hashes against zero-knowledge breach lists',
      'Identify weak tokens for rotation',
      'Audit MFA coverage across critical accounts',
      'Passkey upgrade recommendations',
    ],
    nukedTriggers: ['Password reuse detected', 'Weak entropy token', 'No MFA on financial account'],
    knoxedTriggers: ['Unique strong password per account', 'TOTP/Passkey MFA active', 'Recovery codes encrypted'],
    severity: 91,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.10,
    integratedWith: ['Have I Been Pwned', 'Password Managers'],
  },
  {
    id: 'passkey-registry',
    vector: 'V-04',
    icon: '🛡️',
    label: 'Universal Passkey & WebAuthn Registry',
    description: 'Tracks the deployment of FIDO2 hardware keys across mobile and desktop environments, guaranteeing access is bound to physical biometric enclaves.',
    capabilities: [
      'Track FIDO2 hardware key deployment',
      'Verify biometric enclave binding',
      'Audit WebAuthn registry for unauthorized keys',
      'Guidance on hardware key redundancy',
      'Verify passkey-first authentication flow',
    ],
    nukedTriggers: ['No hardware passkey enrolled', 'Fallback to SMS 2FA active', 'Unverified authenticator added'],
    knoxedTriggers: ['Hardware passkey bound', 'Biometric enclave verified', 'No insecure fallback methods'],
    severity: 95,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.20,
    integratedWith: ['WebAuthn API', 'FIDO2 Standards'],
  },
  // CATEGORY B: Social, Public & Deep Web Surface
  {
    id: 'social-scanner',
    vector: 'V-05',
    icon: '📱',
    label: 'Social Media Posts & Account Scanner',
    description: 'Scrapes public permissions across connected social networks, maps user reputation vulnerabilities, and detects username reuse.',
    capabilities: [
      'Scrape public permissions across social networks',
      'Map user reputation vulnerabilities',
      'Detect username reuse across platforms',
      'Analyze public post PII exposure',
      'Audit third-party app permissions',
    ],
    nukedTriggers: ['Username reuse found', 'Public PII in posts', 'Excessive app permissions'],
    knoxedTriggers: ['Private accounts', 'Unique usernames', 'Minimal permissions'],
    severity: 61,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.08,
    integratedWith: ['Platform APIs', 'OSINT Services'],
  },
  {
    id: 'data-broker',
    vector: 'V-06',
    icon: '🗂️',
    label: 'Data Broker Exposure & Removal Engine',
    description: 'Maps commercial data brokers indexing user PII. Dispatches legally binding automated opt-out and deletion requests.',
    capabilities: [
      'Map commercial data broker indexing',
      'Generate ECRA-compliant opt-out requests',
      'Track removal request status',
      'Recursive re-scan for re-aggregation',
      'Prioritize brokers by risk',
    ],
    nukedTriggers: ['Active broker record found', 'Record includes PII'],
    knoxedTriggers: ['Removal confirmed', '90-day re-scan clean'],
    severity: 38,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.12,
    integratedWith: ['Spokeo', 'Whitepages', 'Intelius'],
  },
  {
    id: 'deep-web-monitor',
    vector: 'V-07',
    icon: '🕸️',
    label: 'Deep Web & Darknet Index Monitor',
    description: 'Executes real-time surveillance across darknet pastes, hacker forums, and public index caches for leaked identity attributes.',
    capabilities: [
      'Real-time surveillance of darknet pastes',
      'Hacker forum mention detection',
      'Public index cache lookups',
      'Identify leaked identity attributes',
      'Parse newly established .onion domains',
    ],
    nukedTriggers: ['Identity attribute in darknet dump', 'Financial identifier exposed'],
    knoxedTriggers: ['No active mention', '30-day zero-hit rolling window'],
    severity: 42,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.12,
    integratedWith: ['Darknet Indices', 'Paste sites'],
  },
  {
    id: 'public-records',
    vector: 'V-08',
    icon: '⚖️',
    label: 'Search Engine & Public Record De-Indexing',
    description: 'Tracks real estate property records, court filings, and legacy search engine caches, initiating one-click de-indexing workflows.',
    capabilities: [
      'Track property record PII',
      'Audit court filing exposure',
      'Legacy search cache analysis',
      'Initiate de-indexing requests',
      'Verify 404 Not Found results',
    ],
    nukedTriggers: ['Public property PII visible', 'Court record exposed'],
    knoxedTriggers: ['Records secured', 'Search cache cleared', 'De-indexing verified'],
    severity: 51,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.01,
    integratedWith: ['PACER', 'Search Engine APIs'],
  },
  // CATEGORY C: Hardware, Local Files & Network Posture
  {
    id: 'local-file-scan',
    vector: 'V-09',
    icon: '💻',
    label: 'Local Computer & Laptop File Scanner',
    description: 'Utilizes browser native File System Access API to scan local directories for unencrypted PII entirely offline.',
    capabilities: [
      'Scan local directories for PII patterns',
      'Identify unencrypted tax/medical docs',
      'Detect plaintext seed phrases',
      'Audit local file encryption status',
      'Offline PII pattern matching',
    ],
    nukedTriggers: ['Unencrypted PII found', 'Plaintext seed phrase detected'],
    knoxedTriggers: ['No high-risk files found', 'Files encrypted'],
    severity: 88,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.07,
    integratedWith: ['File System Access API'],
  },
  {
    id: 'mobile-posture',
    vector: 'V-10',
    icon: '📲',
    label: 'Mobile Device Posture & Telemetry Audit',
    description: 'Audits mobile OS patch levels, biometric status, and malicious application permission creep.',
    capabilities: [
      'Audit OS patch levels',
      'Verify biometric enrollment',
      'Detect app permission creep',
      'Query device user-agent telemetry',
      'Flag zero-day patch gaps',
    ],
    nukedTriggers: ['Outdated OS', 'Weak screen lock', 'Excessive app permissions'],
    knoxedTriggers: ['OS current', 'Biometrics active', 'Minimal app permissions'],
    severity: 95,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.10,
    integratedWith: ['Mobile OS APIs'],
  },
  {
    id: 'cloud-storage',
    vector: 'V-11',
    icon: '☁️',
    label: 'Cloud Drive & Federated Storage Scanner',
    description: 'Audits Google Drive and Apple iCloud metadata to identify publicly exposed share links and unencrypted vaults.',
    capabilities: [
      'Identify publicly exposed share links',
      'Audit cloud metadata for PII',
      'Detect unencrypted document vaults',
      'Review collaborator access',
      'Enforce link-sharing expiry',
    ],
    nukedTriggers: ['Public share link active', 'No link expiry', 'Unencrypted vault'],
    knoxedTriggers: ['Restricted sharing', 'Link expiry set', 'Encrypted vaults'],
    severity: 85,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.07,
    integratedWith: ['Google Drive API', 'iCloud'],
  },
  {
    id: 'network-footprint',
    vector: 'V-12',
    icon: '🌐',
    label: 'Network, DNS, IP & Geolocation Footprint',
    description: 'Evaluates connection integrity by analyzing IP entropy, WebRTC leaks, DNS over HTTPS status, and SSID tracking.',
    capabilities: [
      'Analyze IP entropy',
      'Detect WebRTC IP leaks',
      'Verify DNS-over-HTTPS (DoH)',
      'Audit SSID tracking history',
      'Evaluate connection integrity',
    ],
    nukedTriggers: ['Real IP leaking', 'DNS unencrypted', 'VPN bypass detected'],
    knoxedTriggers: ['DoH active', 'WebRTC disabled', 'VPN masking IP'],
    severity: 55,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.08,
    integratedWith: ['WebRTC API', 'DNS APIs'],
  },
  // CATEGORY D: Financial, Biometric & Legal Sovereignty
  {
    id: 'financial-identity',
    vector: 'V-13',
    icon: '💳',
    label: 'Financial, Credit & Crypto Identity Vector',
    description: 'Monitors freeze statuses of major credit bureaus, audits virtual card usage, and scans for public blockchain associations.',
    capabilities: [
      'Monitor bureau freeze status',
      'Audit virtual card usage',
      'Scan public blockchain associations',
      'Guidance on credit freezes',
      'ChexSystems exposure check',
    ],
    nukedTriggers: ['Credit freeze lifted', 'Blockchain identity exposed', 'Financial record on broker'],
    knoxedTriggers: ['Credit frozen', 'No blockchain association', 'No financial record exposure'],
    severity: 87,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.07,
    integratedWith: ['Credit Bureaus', 'Blockchain Indices'],
  },
  {
    id: 'ai-biometric',
    vector: 'V-14',
    icon: '🧬',
    label: 'Biometric, Voice & AI-Clone Defense',
    description: 'Monitors for illicit voice or facial training data exposure, automates AI opt-out registries, and applies digital watermarks.',
    capabilities: [
      'Detect biometric training data exposure',
      'Automate AI opt-out requests',
      'Apply digital watermarks to media',
      'Scan public datasets (LAION, etc)',
      'Voice print exposure assessment',
    ],
    nukedTriggers: ['Biometric data submitted', 'AI training inclusion', 'Clearview AI exposure'],
    knoxedTriggers: ['No biometric submission', 'AI opt-out verified', 'Clearview deletion confirmed'],
    severity: 62,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.01,
    integratedWith: ['AI Registry APIs', 'LAION'],
  },
  {
    id: 'oauth-revocation',
    vector: 'V-15',
    icon: '⊞',
    label: 'Application OAuth & API Token Revocation',
    description: 'Scans third-party OAuth permissions bound to federated identities, allowing one-click revocation of dormant apps.',
    capabilities: [
      'Scan OAuth permission scopes',
      'Identify zombie apps (>90d unused)',
      'One-click token revocation',
      'Score app risk by scope',
      'Audit federated identity bindings',
    ],
    nukedTriggers: ['High-risk OAuth scope', 'Zombie app active', 'Excessive permissions'],
    knoxedTriggers: ['Minimal OAuth scope', 'Active apps only', 'Restricted permissions'],
    severity: 73,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.05,
    integratedWith: ['Google OAuth', 'Apple ID'],
  },
  {
    id: 'legal-sovereignty',
    vector: 'V-16',
    icon: '⚖️',
    label: 'ECRA/ERCA 2026 Compliance & Legal Sovereignty Ledger',
    description: 'Maintains an immutable, timestamped cryptographic ledger of all privacy enforcement requests and statutory deletion notices.',
    capabilities: [
      'Maintain immutable legal ledger',
      'Track statutory deletion deadlines',
      'Generate cryptographic proof of request',
      'Audit regulatory compliance',
      'Escalate unfulfilled requests',
    ],
    nukedTriggers: ['Statutory deadline missed', 'Deletion request denied'],
    knoxedTriggers: ['Deletion verified', 'Proof of request archived'],
    severity: 51,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.01,
    integratedWith: ['Legal Ledger', 'Statutory APIs'],
  },
];

/**
 * Get module by ID
 */
export const getDiffModule = (id: string): DiffModule | undefined => {
  return DIFF_MODULES.find((m) => m.id === id);
};

/**
 * Get all modules
 */
export const getAllDiffModules = (): DiffModule[] => {
  return DIFF_MODULES;
};

/**
 * Get modules by vector range
 */
export const getDiffModulesByVectors = (start: number, end: number): DiffModule[] => {
  return DIFF_MODULES.filter((m) => {
    const vectorNum = parseInt(m.vector.slice(2));
    return vectorNum >= start && vectorNum <= end;
  });
};
