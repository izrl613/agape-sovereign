/**
 * ============================================================
 * ARCHITECT AI — 16-Layer DIFF Module Data Structure
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Complete configuration for 16 identity vector modules.
 * Each vector represents a surface of digital identity exposure.
 *
 * Reconciled to match the Architect AI dashboard (sovereign.nyc):
 *   V-01  Email Scanner       V-09  Biometrics
 *   V-02  Social Map          V-10  Crypto Assets
 *   V-03  Device Health       V-11  Smart Home
 *   V-04  System Security     V-12  Metadata Purge
 *   V-05  Deep Web            V-13  Kernel Health
 *   V-06  Broker Removal      V-14  BIOS Integrity
 *   V-07  Network Vector      V-15  Sovereign ID
 *   V-08  Cloud Enclave       V-16  Optery Privacy
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
  // ── V-01 EMAIL SCANNER ─────────────────────────────────────────────────────
  {
    id: 'email-scanner',
    vector: 'V-01',
    icon: '✉',
    label: 'Email Scanner',
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
    weight: 0.08,
    integratedWith: ['HaveIBeenPwned', 'Dehashed', 'XposedOrNot', 'Google Safe Browsing'],
  },

  // ── V-02 SOCIAL MAP ────────────────────────────────────────────────────────
  {
    id: 'social-map',
    vector: 'V-02',
    icon: '◈',
    label: 'Social Map',
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
    weight: 0.06,
    integratedWith: ['Platform APIs', 'OSINT services'],
  },

  // ── V-03 DEVICE HEALTH ─────────────────────────────────────────────────────
  {
    id: 'device-health',
    vector: 'V-03',
    icon: '⬡',
    label: 'Device Health',
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
    weight: 0.06,
    integratedWith: ['Google Drive API', 'iCloud signals'],
  },

  // ── V-04 SYSTEM SECURITY ───────────────────────────────────────────────────
  {
    id: 'system-security',
    vector: 'V-04',
    icon: '◻',
    label: 'System Security',
    description: 'Passkey enrollment verification, OS patching, app permissions audit, encryption verification, and firewall configuration.',
    capabilities: [
      'Passkey enrollment verification',
      'OS version and patch level guidance',
      'Screen lock enforcement status',
      'App permission audit (camera, location, microphone)',
      'Device encryption verification',
      'Browser extension risk audit',
      'Firewall configuration guidance',
    ],
    nukedTriggers: ['No passkey', 'Outdated OS', 'Weak screen lock', 'High-risk extensions', 'No VPN'],
    knoxedTriggers: ['Passkey enrolled', 'Full disk encryption', 'OS current', 'Minimal app permissions'],
    severity: 95,
    nukedCount: 0,
    knoxedCount: 18,
    monitoredCount: 1,
    weight: 0.08,
    integratedWith: ['MDM signals', 'Device APIs', 'Browser API'],
  },

  // ── V-05 DEEP WEB ──────────────────────────────────────────────────────────
  {
    id: 'deep-web',
    vector: 'V-05',
    icon: '◉',
    label: 'Deep Web',
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
    weight: 0.08,
    integratedWith: ['Dark Web indices', 'Paste sites monitoring'],
  },

  // ── V-06 BROKER REMOVAL ────────────────────────────────────────────────────
  {
    id: 'broker-removal',
    vector: 'V-06',
    icon: '⧫',
    label: 'Broker Removal',
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
    weight: 0.08,
    integratedWith: ['Spokeo', 'Whitepages', 'Intelius', 'BeenVerified', 'Radaris'],
  },

  // ── V-07 NETWORK VECTOR ────────────────────────────────────────────────────
  {
    id: 'network-vector',
    vector: 'V-07',
    icon: '◎',
    label: 'Network Vector',
    description: 'DNS leak detection. WebRTC IP leak analysis. IPv6 leak assessment. DoH enforcement.',
    capabilities: [
      'DNS leak test results',
      'WebRTC IP leak detection',
      'IPv6 leak analysis',
      'DNS-over-HTTPS enforcement',
      'ISP metadata exposure assessment',
      'VPN usage and no-log policy verification',
    ],
    nukedTriggers: ['Real IP leaking via WebRTC', 'DNS queries unencrypted', 'ISP logging active'],
    knoxedTriggers: ['DoH active', 'VPN masking real IP', 'WebRTC disabled'],
    severity: 55,
    nukedCount: 4,
    knoxedCount: 9,
    monitoredCount: 7,
    weight: 0.06,
    integratedWith: ['DNS leak test', 'Browser APIs'],
  },

  // ── V-08 CLOUD ENCLAVE ─────────────────────────────────────────────────────
  {
    id: 'cloud-enclave',
    vector: 'V-08',
    icon: '☁',
    label: 'Cloud Enclave',
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
    weight: 0.06,
    integratedWith: ['Google Drive', 'Dropbox', 'iCloud', 'OneDrive'],
  },

  // ── V-09 BIOMETRICS ────────────────────────────────────────────────────────
  {
    id: 'biometrics',
    vector: 'V-09',
    icon: '⊛',
    label: 'Biometrics',
    description: 'Biometric data submission detection. BIPA deletion request templates. AI training dataset opt-out. Voice print assessment.',
    capabilities: [
      'Detect platforms with submitted biometric data',
      'BIPA-compliant deletion request templates',
      'AI training dataset opt-out guidance',
      'Clearview AI database guidance',
      'Voice print exposure assessment',
      'Facial recognition opt-out tracking',
    ],
    nukedTriggers: ['Biometric data submitted', 'Clearview AI exposure', 'Training dataset inclusion'],
    knoxedTriggers: ['No biometric submission', 'Clearview deletion', 'Training dataset opt-out'],
    severity: 62,
    nukedCount: 2,
    knoxedCount: 11,
    monitoredCount: 4,
    weight: 0.06,
    integratedWith: ['Clearview AI', 'Common Crawl', 'LAION'],
  },

  // ── V-10 CRYPTO ASSETS ─────────────────────────────────────────────────────
  {
    id: 'crypto-assets',
    vector: 'V-10',
    icon: '⬟',
    label: 'Crypto Assets',
    description: 'Cryptocurrency wallet exposure detection. Exchange account security audit. Seed phrase and private key storage assessment.',
    capabilities: [
      'Wallet address exposure detection on chain explorers',
      'Exchange account security audit (2FA, API keys)',
      'Seed phrase storage security assessment',
      'Smart contract approval revocation guidance',
      'DeFi protocol permission audit',
      'Phishing domain detection for crypto sites',
    ],
    nukedTriggers: ['Wallet address linked to identity', 'Seed phrase stored in plaintext', 'Exchange API key with withdrawal permissions'],
    knoxedTriggers: ['Hardware wallet in use', 'Exchange 2FA active', 'No plaintext seed phrases'],
    severity: 70,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.06,
    integratedWith: ['Etherscan', 'Blockchain explorers', 'Revoke.cash'],
  },

  // ── V-11 SMART HOME ────────────────────────────────────────────────────────
  {
    id: 'smart-home',
    vector: 'V-11',
    icon: '⊕',
    label: 'Smart Home',
    description: 'IoT and connected device security audit. Smart home hub exposure. Firmware update compliance.',
    capabilities: [
      'Connected device inventory and risk scoring',
      'Smart home hub security posture (Alexa, Google Home, HomeKit)',
      'Firmware update compliance check',
      'Default credential detection',
      'Network segmentation assessment',
      'Camera and microphone access audit',
    ],
    nukedTriggers: ['Default credentials on IoT device', 'Unpatched firmware', 'Camera publicly accessible'],
    knoxedTriggers: ['All devices updated', 'Network segmented', 'Unique credentials per device'],
    severity: 70,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.06,
    integratedWith: ['Smart home APIs', 'Shodan', 'Device manufacturer APIs'],
  },

  // ── V-12 METADATA PURGE ────────────────────────────────────────────────────
  {
    id: 'metadata-purge',
    vector: 'V-12',
    icon: '⊡',
    label: 'Metadata Purge',
    description: 'EXIF data stripping from images. Document metadata cleanup. GPS coordinate purge from shared media.',
    capabilities: [
      'EXIF metadata stripping from images',
      'PDF/Office document metadata cleanup',
      'GPS coordinate purge from photos and videos',
      'Social media upload metadata analysis',
      'Camera serial number and device fingerprint removal',
      'Batch metadata audit across cloud storage',
    ],
    nukedTriggers: ['Photos with GPS coordinates shared publicly', 'Documents containing author/organization metadata', 'Camera serial number in EXIF'],
    knoxedTriggers: ['All shared images stripped of EXIF', 'Documents cleaned before sharing', 'GPS auto-strip enabled'],
    severity: 70,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.04,
    integratedWith: ['ExifTool', 'Cloud storage APIs'],
  },

  // ── V-13 KERNEL HEALTH ─────────────────────────────────────────────────────
  {
    id: 'kernel-health',
    vector: 'V-13',
    icon: '⊞',
    label: 'Kernel Health',
    description: 'OS kernel integrity verification. Rootkit detection guidance. Kernel extension and driver signing audit.',
    capabilities: [
      'Kernel version and patch level check',
      'Rootkit detection guidance (chkrootkit, rkhunter)',
      'Kernel extension / driver signing audit',
      'System Integrity Protection (SIP) status',
      'Kernel-level vulnerability scanning',
      'Loaded kernel module audit',
    ],
    nukedTriggers: ['Unsigned kernel extension loaded', 'SIP disabled', 'Known vulnerable kernel version'],
    knoxedTriggers: ['SIP enabled', 'All extensions signed', 'Kernel current and patched'],
    severity: 70,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.04,
    integratedWith: ['System APIs', 'CVE databases'],
  },

  // ── V-14 BIOS INTEGRITY ────────────────────────────────────────────────────
  {
    id: 'bios-integrity',
    vector: 'V-14',
    icon: '⊟',
    label: 'BIOS Integrity',
    description: 'UEFI/BIOS firmware verification. Secure Boot status. TPM attestation guidance. Firmware tampering detection.',
    capabilities: [
      'UEFI firmware version and patch status',
      'Secure Boot configuration verification',
      'TPM 2.0 attestation guidance',
      'Firmware tampering detection heuristics',
      'Boot chain integrity assessment',
      'ME/PSP firmware exposure analysis',
    ],
    nukedTriggers: ['Secure Boot disabled', 'Outdated UEFI firmware', 'No TPM enrolled'],
    knoxedTriggers: ['Secure Boot enabled', 'Firmware current', 'TPM 2.0 active'],
    severity: 70,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.04,
    integratedWith: ['System firmware APIs', 'Manufacturer update feeds'],
  },

  // ── V-15 SOVEREIGN ID ──────────────────────────────────────────────────────
  {
    id: 'sovereign-id',
    vector: 'V-15',
    icon: '⬢',
    label: 'Sovereign ID',
    description: 'Identity document exposure remediation. IRS Identity Protection PIN. SSA lockdown. Passport and DL exposure detection.',
    capabilities: [
      'Scan for document metadata patterns',
      'Passport/DL/SSN exposure remediation',
      'IRS Identity Protection PIN guidance',
      'Social Security Administration lockdown',
      'Credit freeze/thaw guidance (Equifax, Experian, TransUnion)',
      'ChexSystems exposure guidance',
    ],
    nukedTriggers: ['ID metadata exposure', 'SSN pattern detected', 'Passport exposed', 'Credit monitoring gap'],
    knoxedTriggers: ['No ID exposure', 'IRS IP PIN enrolled', 'SSA account locked', 'Credit frozen'],
    severity: 71,
    nukedCount: 3,
    knoxedCount: 8,
    monitoredCount: 5,
    weight: 0.06,
    integratedWith: ['IRS', 'SSA services', 'Credit bureaus'],
  },

  // ── V-16 SHADOWPURGE DATA EXCISION ─────────────────────────────────────────
  {
    id: 'shadow-purge',
    vector: 'V-16',
    icon: '◈',
    label: 'ShadowPurge Data Excision',
    description:
      'Automated data broker eradication & ghosting across 200+ people-search networks (Optery Engine). Continuous re-scrape detection and identity suppression.',
    capabilities: [
      'Automated opt-out submission across 200+ people-search networks',
      'People-search profile suppression & ghost protocol activation',
      'Data broker lifecycle tracking (submission → confirmation → verification)',
      'Re-aggregation & re-scrape detection (real-time broker watchdog)',
      'Sovereign privacy rating tracking over time',
      'ECRA / CCPA / GDPR legal removal enforcement',
    ],
    nukedTriggers: [
      'Active profile on 10+ people-search sites',
      'Re-aggregated after confirmed removal',
      'Profile includes home address + relatives + phone',
    ],
    knoxedTriggers: [
      'All 200+ broker profiles ghosted & suppressed',
      '90-day re-scan clean',
      'Automated watchdog active',
    ],
    severity: 70,
    nukedCount: 0,
    knoxedCount: 0,
    monitoredCount: 0,
    weight: 0.06,
    integratedWith: ['Optery API', 'People-Search Networks', 'Privacy Law Enforcers'],
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
