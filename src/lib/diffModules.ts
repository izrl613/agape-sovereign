/**
 * ============================================================
 * ARCHITECT AI — 16-Layer DIFF Module Data Structure
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Complete configuration for 16 identity vector modules
 * Each vector represents a surface of digital identity exposure
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
  {
    id: 'email-breach',
    vector: 'V-01',
    icon: '✉',
    label: 'Email Breach & Metadata Scanner',
    description:
      'Cross-reference emails against breach databases (HaveIBeenPwned, Dehashed). Identify data broker records and metadata exposure patterns.',
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
    nukedCount: 3,
    knoxedCount: 12,
    monitoredCount: 2,
    weight: 0.12,
    integratedWith: ['HaveIBeenPwned', 'Dehashed', 'Google Safe Browsing'],
  },
  {
    id: 'social-media',
    vector: 'V-02',
    icon: '◈',
    label: 'Social Media Footprint Scanner',
    description: 'Username reuse detection across 50+ platforms. Public post analysis and third-party app audit.',
    capabilities: [
      'Username reuse detection across 50+ platforms',
      'Public post sentiment and PII exposure analysis',
      'Profile visibility risk scoring',
      'Third-party app permission audit (OAuth)',
      'Historical post metadata analysis',
    ],
    nukedTriggers: [
      'Username found on data broker sites',
      'Public post contains PII (address, phone, location)',
      'Third-party app with excessive OAuth scope',
    ],
    knoxedTriggers: ['Private account', 'Unique username per platform', 'No PII in public posts'],
    severity: 61,
    nukedCount: 7,
    knoxedCount: 8,
    monitoredCount: 5,
    weight: 0.08,
    integratedWith: ['Platform APIs', 'OSINT services'],
  },
  {
    id: 'device-files',
    vector: 'V-03',
    icon: '⬡',
    label: 'Device File System Scanner (Local + Cloud)',
    description: 'Scan file metadata for PII patterns. Audit Google Drive and iCloud sharing permissions.',
    capabilities: [
      'Scan file metadata for PII patterns (SSN, DOB)',
      'Flag documents with overly broad permissions',
      'Identify sensitive file types (tax docs, medical records)',
      'Google Drive sharing audit (public links)',
      'Local file encryption status check',
    ],
    nukedTriggers: ['File shared publicly', 'File contains unencrypted PII', 'Drive folder publicly accessible'],
    knoxedTriggers: ['File encrypted', 'Sharing restricted to specific identities', 'No public links'],
    severity: 88,
    nukedCount: 1,
    knoxedCount: 24,
    monitoredCount: 3,
    weight: 0.07,
    integratedWith: ['Google Drive API', 'iCloud signals'],
  },
  {
    id: 'mobile-security',
    vector: 'V-04',
    icon: '◻',
    label: 'Mobile Device Security Posture',
    description: 'Passkey enrollment verification, OS patching, app permissions audit, and encryption verification.',
    capabilities: [
      'Passkey enrollment verification',
      'OS version and patch level guidance',
      'Screen lock enforcement status',
      'App permission audit (camera, location, microphone)',
      'Device encryption verification',
      'Bluetooth and WiFi exposure surface',
    ],
    nukedTriggers: ['No passkey', 'Outdated OS', 'Weak screen lock', 'Unnecessary app permissions'],
    knoxedTriggers: ['Passkey enrolled', 'Full disk encryption', 'OS current', 'Minimal app permissions'],
    severity: 95,
    nukedCount: 0,
    knoxedCount: 18,
    monitoredCount: 1,
    weight: 0.1,
    integratedWith: ['MDM signals', 'Device APIs'],
  },
  {
    id: 'laptop-desktop',
    vector: 'V-05',
    icon: '◯',
    label: 'Laptop & Desktop Security Posture',
    description: 'Browser extension audit, password manager detection, FDE status, VPN usage, and firewall configuration.',
    capabilities: [
      'Browser extension risk audit',
      'Password manager usage detection',
      'Full disk encryption status',
      'VPN usage and DNS leak exposure',
      'Firewall configuration guidance',
      'Secure boot status check',
    ],
    nukedTriggers: ['No FDE', 'No password manager', 'High-risk extensions', 'No VPN', 'DNS leaking real IP'],
    knoxedTriggers: ['FDE enabled', 'Password manager active', 'Minimal extensions', 'VPN with no-log policy'],
    severity: 79,
    nukedCount: 4,
    knoxedCount: 9,
    monitoredCount: 7,
    weight: 0.1,
    integratedWith: ['Browser API', 'System configuration'],
  },
  {
    id: 'deep-web',
    vector: 'V-06',
    icon: '◉',
    label: 'Deep Web & Dark Web Exposure Monitor',
    description: 'Credential pair detection on dark web. Financial data and identity document pattern lookups.',
    capabilities: [
      'Credential pair exposure detection',
      'Financial data exposure patterns',
      'Identity document pattern detection',
      'Dark web mention monitoring',
      'Paste site historical lookup',
    ],
    nukedTriggers: ['Credential pair in dark web dump', 'Financial identifier exposed', 'SSN pattern match'],
    knoxedTriggers: ['No active mention', 'Credentials rotated post-breach', 'Monitoring alert active'],
    severity: 42,
    nukedCount: 5,
    knoxedCount: 3,
    monitoredCount: 8,
    weight: 0.12,
    integratedWith: ['Dark Web indices', 'Paste sites monitoring'],
  },
  {
    id: 'data-broker',
    vector: 'V-07',
    icon: '⧫',
    label: 'Data Broker Removal Engine',
    description: 'Identify data brokers holding records (Spokeo, Whitepages, Intelius, etc.). Generate ECRA-compliant opt-out requests.',
    capabilities: [
      'Identify active data broker records',
      'Generate ECRA 2026 compliant opt-out templates',
      'Track removal request status',
      'Re-scan for re-aggregation',
      'Prioritize brokers by risk',
    ],
    nukedTriggers: ['Active data broker listing found', 'Record includes address + phone + relatives'],
    knoxedTriggers: ['Removal confirmed', '90-day re-scan clean'],
    severity: 38,
    nukedCount: 12,
    knoxedCount: 4,
    monitoredCount: 6,
    weight: 0.12,
    integratedWith: ['Spokeo', 'Whitepages', 'Intelius', 'BeenVerified', 'Radaris'],
  },
  {
    id: 'credential-vault',
    vector: 'V-08',
    icon: '⬟',
    label: 'Password & Credential Vault Audit',
    description: 'Weak/reused password detection. HIBP k-anonymity check. MFA coverage audit across accounts.',
    capabilities: [
      'Weak/reused password detection',
      'HIBP password hash check (k-anonymity)',
      'MFA coverage audit',
      'Passkey upgrade recommendations',
      'Recovery code security assessment',
    ],
    nukedTriggers: ['Reused password', 'No MFA on financial accounts', 'Recovery codes in plaintext'],
    knoxedTriggers: ['Unique strong password per account', 'TOTP/passkey MFA everywhere', 'Recovery codes encrypted'],
    severity: 91,
    nukedCount: 2,
    knoxedCount: 31,
    monitoredCount: 0,
    weight: 0.1,
    integratedWith: ['Have I Been Pwned', 'Password managers'],
  },
  {
    id: 'network-dns',
    vector: 'V-09',
    icon: '◎',
    label: 'Network & DNS Security Posture',
    description: 'DNS leak detection. WebRTC IP leak analysis. IPv6 leak assessment. DoH enforcement.',
    capabilities: [
      'DNS leak test results',
      'WebRTC IP leak detection',
      'IPv6 leak analysis',
      'DNS-over-HTTPS enforcement',
      'ISP metadata exposure assessment',
    ],
    nukedTriggers: ['Real IP leaking via WebRTC', 'DNS queries unencrypted', 'ISP logging active'],
    knoxedTriggers: ['DoH active', 'VPN masking real IP', 'WebRTC disabled'],
    severity: 55,
    nukedCount: 4,
    knoxedCount: 9,
    monitoredCount: 7,
    weight: 0.08,
    integratedWith: ['DNS leak test', 'Browser APIs'],
  },
  {
    id: 'cloud-storage',
    vector: 'V-10',
    icon: '◯',
    label: 'Cloud Storage & Sync Security',
    description: 'Publicly shared file audit. Sync client permission scope review. Sensitive folder exposure detection.',
    capabilities: [
      'Publicly shared file audit',
      'Sync client permission scope audit',
      'Sensitive folder exposure detection',
      'Collaborator access review',
      'Link-sharing expiry enforcement',
    ],
    nukedTriggers: ['Publicly shared file', 'Excessive permission scope', 'No link expiry'],
    knoxedTriggers: ['Restricted sharing', 'Minimal permissions', 'Link expiry set'],
    severity: 85,
    nukedCount: 1,
    knoxedCount: 19,
    monitoredCount: 2,
    weight: 0.07,
    integratedWith: ['Google Drive', 'Dropbox', 'iCloud'],
  },
  {
    id: 'communication',
    vector: 'V-11',
    icon: '⊕',
    label: 'Communication Privacy Audit',
    description: 'Email provider encryption posture. Messaging app security tier assessment. Metadata exposure analysis.',
    capabilities: [
      'Email provider encryption posture (Gmail TLS vs E2E)',
      'Messaging app security tier assessment',
      'Metadata exposure in communications',
      'Calendar privacy review',
    ],
    nukedTriggers: ['Email unencrypted', 'Insecure messaging app', 'Public calendar events'],
    knoxedTriggers: ['E2E encryption enabled', 'Signal/iMessage usage', 'Private calendar'],
    severity: 66,
    nukedCount: 2,
    knoxedCount: 11,
    monitoredCount: 4,
    weight: 0.04,
    integratedWith: ['Gmail', 'Signal', 'WhatsApp API'],
  },
  {
    id: 'financial-identity',
    vector: 'V-12',
    icon: '⊛',
    label: 'Financial Identity Surface',
    description: 'Data broker financial record detection. Credit monitoring exposure guidance. Dark web financial patterns.',
    capabilities: [
      'Data broker financial record detection',
      'Credit monitoring exposure guidance',
      'Dark web financial identifier patterns',
      'Credit freeze/thaw guidance (Equifax, Experian)',
      'ChexSystems exposure guidance',
    ],
    nukedTriggers: ['Financial record on data broker', 'Credit monitoring gap', 'Dark web financial data'],
    knoxedTriggers: ['No financial record exposure', 'Credit monitoring active', 'Credit frozen'],
    severity: 87,
    nukedCount: 1,
    knoxedCount: 15,
    monitoredCount: 2,
    weight: 0.07,
    integratedWith: ['Credit bureaus', 'ChexSystems'],
  },
  {
    id: 'identity-documents',
    vector: 'V-13',
    icon: '⊡',
    label: 'Identity Document Exposure',
    description: 'Document metadata pattern scanning. Passport, DL, SSN exposure remediation. IRS Identity Protection PIN enrollment.',
    capabilities: [
      'Scan for document metadata patterns',
      'Passport/DL/SSN exposure remediation',
      'IRS Identity Protection PIN guidance',
      'Social Security Administration lockdown',
    ],
    nukedTriggers: ['ID metadata exposure', 'SSN pattern detected', 'Passport exposed'],
    knoxedTriggers: ['No ID exposure', 'IRS IP PIN enrolled', 'SSA account locked'],
    severity: 71,
    nukedCount: 3,
    knoxedCount: 8,
    monitoredCount: 5,
    weight: 0.03,
    integratedWith: ['IRS', 'SSA services'],
  },
  {
    id: 'oauth-apps',
    vector: 'V-14',
    icon: '⊞',
    label: 'Third-Party App OAuth Audit',
    description: 'List all OAuth-connected apps. Score by permission scope risk. Generate revocation queue.',
    capabilities: [
      'List all OAuth-connected third-party apps',
      'Score each app by permission scope risk',
      'Generate revocation queue sorted by risk',
      'Identify zombie apps (last used >180d)',
    ],
    nukedTriggers: ['High-risk OAuth scope', 'Zombie app active', 'Excessive permissions'],
    knoxedTriggers: ['Minimal OAuth scope', 'Active apps only', 'Restricted permissions'],
    severity: 73,
    nukedCount: 2,
    knoxedCount: 14,
    monitoredCount: 3,
    weight: 0.05,
    integratedWith: ['Google Account API', 'Apple privacy report'],
  },
  {
    id: 'public-records',
    vector: 'V-15',
    icon: '⊟',
    label: 'Public Records & Legal Exposure',
    description: 'Court record exposure detection. Property record PII review. Voter registration opt-out guidance.',
    capabilities: [
      'Court record exposure detection',
      'Property record PII exposure',
      'Voter registration record opt-out',
      'Professional license review',
      'PACER / state court assessment',
    ],
    nukedTriggers: ['Public court record exposure', 'Property PII visible', 'Voter registration exposed'],
    knoxedTriggers: ['No court record exposure', 'Property records secured', 'Voter reg opted out'],
    severity: 51,
    nukedCount: 1,
    knoxedCount: 5,
    monitoredCount: 2,
    weight: 0.01,
    integratedWith: ['Court databases', 'PACER'],
  },
  {
    id: 'ai-biometric',
    vector: 'V-16',
    icon: '◈',
    label: 'AI & Biometric Data Exposure',
    description: 'Biometric data submission detection. BIPA deletion request templates. AI training dataset opt-out.',
    capabilities: [
      'Detect platforms with submitted biometric data',
      'BIPA-compliant deletion request templates',
      'AI training dataset opt-out guidance',
      'Clearview AI database guidance',
      'Voice print exposure assessment',
    ],
    nukedTriggers: ['Biometric data submitted', 'Clearview AI exposure', 'Training dataset inclusion'],
    knoxedTriggers: ['No biometric submission', 'Clearview deletion', 'Training dataset opt-out'],
    severity: 62,
    nukedCount: 2,
    knoxedCount: 11,
    monitoredCount: 4,
    weight: 0.01,
    integratedWith: ['Clearview AI', 'Common Crawl', 'LAION'],
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
