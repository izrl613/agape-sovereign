/**
 * ============================================================
 * ARCHITECT AI — 16-Layer DIFF Module Data Structure
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Complete configuration for 16 canonical identity vector modules.
 * Each vector represents a critical surface of digital identity exposure.
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
    id: 'email',
    vector: 'V-01',
    icon: '✉',
    label: 'Email Breach Scanner',
    description:
      'Cross-reference emails against breach databases (XposedOrNot, HaveIBeenPwned, Dehashed). Identify data broker records and exposed metadata patterns.',
    capabilities: [
      'Cross-reference email addresses against known breach databases',
      'Identify data broker records tied to each email',
      'Analyze email metadata exposure patterns',
      'Detect alias reuse and correlation risk',
      'Identify login credential pairs in public breaches',
    ],
    nukedTriggers: ['Email found in active breach', 'Credential pair exposed', 'Email tied to spam database'],
    knoxedTriggers: ['Unique alias per service', 'Breach resolved', 'No active data broker record'],
    severity: 72,
    nukedCount: 3,
    knoxedCount: 12,
    monitoredCount: 2,
    weight: 0.12,
    integratedWith: ['XposedOrNot', 'HaveIBeenPwned', 'Google Safe Browsing'],
  },
  {
    id: 'social',
    vector: 'V-02',
    icon: '◈',
    label: 'Social Media Footprint',
    description: 'Username reuse detection across 50+ platforms. Public post scraping analysis and third-party app permission audit.',
    capabilities: [
      'Username reuse detection across 50+ platforms',
      'Public post sentiment and PII exposure analysis',
      'Profile visibility risk scoring',
      'Third-party app permission audit (OAuth)',
      'Account graph and permission sprawl mapping',
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
    integratedWith: ['Platform APIs', 'OSINT services', 'Unosecur'],
  },
  {
    id: 'device',
    vector: 'V-03',
    icon: '⬡',
    label: 'Device File Scan',
    description: 'Local and cloud file analysis. EXIF metadata extraction and PII tokenization across documents and images.',
    capabilities: [
      'Scan file metadata for PII patterns (SSN, DOB, financial)',
      'Flag documents with overly broad permissions',
      'Identify sensitive file types (tax docs, medical records)',
      'EXIF geolocation stripping on media assets',
      'Client-side AES-256-GCM file sealing',
    ],
    nukedTriggers: ['File shared publicly', 'File contains unencrypted PII', 'EXIF metadata reveals private GPS'],
    knoxedTriggers: ['File encrypted', 'Sharing restricted to specific identities', 'No public links'],
    severity: 88,
    nukedCount: 1,
    knoxedCount: 24,
    monitoredCount: 3,
    weight: 0.07,
    integratedWith: ['Nymiz', 'Local Storage', 'File System API'],
  },
  {
    id: 'mobile',
    vector: 'V-04',
    icon: '◻',
    label: 'Mobile Security Layer',
    description: 'Passkey enforcement, biometric enrollment audit, 2FA status, and mobile OS security posture verification.',
    capabilities: [
      'Passkey/WebAuthn enrollment verification',
      'Biometric authentication posture assessment',
      '2FA status enforcement across mobile endpoints',
      'App permission audit (camera, location, microphone)',
      'Device encryption and secure enclave verification',
    ],
    nukedTriggers: ['No passkey enabled', 'Outdated OS', 'Weak screen lock', 'Over-privileged app permissions'],
    knoxedTriggers: ['Passkey enrolled', 'Full disk encryption active', 'OS current', 'Minimal app permissions'],
    severity: 95,
    nukedCount: 0,
    knoxedCount: 18,
    monitoredCount: 1,
    weight: 0.10,
    integratedWith: ['FIDO2/WebAuthn', 'Unosecur', 'Device APIs'],
  },
  {
    id: 'deepweb',
    vector: 'V-05',
    icon: '◉',
    label: 'Deep Web Exposure',
    description: 'Pattern-based lookup monitoring across indexed deep web sources, paste repositories, and unindexed public data surfaces.',
    capabilities: [
      'Pattern-based lookup for leaked credentials',
      'Deep web database matching',
      'Paste site historical monitoring',
      'Image reverse-lookup scan',
      'Real-time alert on new exposure detection',
    ],
    nukedTriggers: ['Email/credential match in deep web source', 'PII fragment indexed on paste site', 'Identity pattern matched in public dump'],
    knoxedTriggers: ['No active mention', 'Credentials rotated post-breach', 'Monitoring alert active'],
    severity: 42,
    nukedCount: 5,
    knoxedCount: 3,
    monitoredCount: 8,
    weight: 0.10,
    integratedWith: ['PrivacyProctor', 'Paste Indices', 'Deep Web Search'],
  },
  {
    id: 'broker',
    vector: 'V-06',
    icon: '⧫',
    label: 'Data Broker Removal',
    description: 'Automated opt-out template generation and submission tracking across 200+ data brokers under GDPR, CCPA, and ECRA 2026.',
    capabilities: [
      'Broker database enumeration (Acxiom, Spokeo, Whitepages, Intelius, etc.)',
      'Automated removal request template generation',
      'Submission tracking and verification receipt generation',
      'DLP guard preventing PII re-exposure during opt-out',
      '90-day re-aggregation re-scan engine',
    ],
    nukedTriggers: ['Active data broker listing found', 'Broker holds address, phone, and relatives graph', 'Opt-out request ignored or expired'],
    knoxedTriggers: ['Removal confirmed with verification receipt', '90-day re-scan clean', 'Suppression flag active'],
    severity: 38,
    nukedCount: 12,
    knoxedCount: 4,
    monitoredCount: 6,
    weight: 0.12,
    integratedWith: ['Polymer', 'Acxiom', 'Whitepages', 'Spokeo', 'Intelius', 'Radaris'],
  },
  {
    id: 'password',
    vector: 'V-07',
    icon: '⬟',
    label: 'Password Vault Analysis',
    description: 'Weak and reused credential detection, HIBP k-anonymity checks, vault security audit, and passkey migration recommendations.',
    capabilities: [
      'Weak, reused, and compromised password detection',
      'k-Anonymity SHA-1/SHA-256 hash lookup against pwned passwords',
      'MFA coverage and passkey upgrade path recommendations',
      'Vault export pseudonymization and client-side encryption',
      'Entropy scoring and dictionary attack risk quantification',
    ],
    nukedTriggers: ['Password reused across accounts', 'Password appears in known breach dump', 'No MFA on critical service'],
    knoxedTriggers: ['Unique high-entropy password per account', 'Passkey or hardware FIDO2 active', 'Vault encrypted with AES-256'],
    severity: 91,
    nukedCount: 2,
    knoxedCount: 31,
    monitoredCount: 0,
    weight: 0.10,
    integratedWith: ['Have I Been Pwned', 'Nymiz', 'Password Managers'],
  },
  {
    id: 'location',
    vector: 'V-08',
    icon: '◎',
    label: 'Location Data Footprint',
    description: 'GPS history, cell-tower telemetry, and EXIF metadata exposure analysis. Detects passive location harvesting by apps and ad SDKs.',
    capabilities: [
      'GPS and location history grant audit across installed apps',
      'Photo and document EXIF location metadata extraction',
      'Ad-network and data-broker location SDK mapping',
      'Revocation workflows for over-privileged location grants',
      'Geofencing leakage risk scoring',
    ],
    nukedTriggers: ['Continuous background location granted to ad SDK', 'Shared media contains raw GPS coordinates', 'Location profile sold on data broker market'],
    knoxedTriggers: ['Precise location disabled for non-essential apps', 'EXIF metadata stripped before upload', 'Location history purged'],
    severity: 75,
    nukedCount: 3,
    knoxedCount: 14,
    monitoredCount: 4,
    weight: 0.08,
    integratedWith: ['Unosecur', 'Device Location APIs'],
  },
  {
    id: 'browser',
    vector: 'V-09',
    icon: '◯',
    label: 'Browser & Cookie Tracker',
    description: 'Third-party tracking detection, canvas and WebGL fingerprinting analysis, session-replay SDK audit, and cookie inventorying.',
    capabilities: [
      'Third-party cookie and supercookie enumeration',
      'Canvas, WebGL, and audio fingerprinting detection',
      'Session-replay and behavioral keylogger script identification',
      'DLP-style redaction of PII transmitted in query strings',
      'Strict tracker-blocking and container configuration guidance',
    ],
    nukedTriggers: ['Cross-site tracking cookies active', 'Fingerprinting scripts detected on frequent domains', 'Sensitive input captured by session replay'],
    knoxedTriggers: ['Tracking protection in strict mode', 'Third-party cookies blocked', 'Fingerprint randomization active'],
    severity: 55,
    nukedCount: 4,
    knoxedCount: 9,
    monitoredCount: 7,
    weight: 0.08,
    integratedWith: ['Polymer', 'Privacy Badger', 'Browser APIs'],
  },
  {
    id: 'financial',
    vector: 'V-10',
    icon: '⬡',
    label: 'Financial Identity Exposure',
    description: 'Banking and payment data leak monitoring, dark-web carding paste detection, fintech OAuth scope audit, and credit freeze guidance.',
    capabilities: [
      'Bank and card data dark-web monitoring',
      'Fintech app OAuth permission and Plaid connection audit',
      'Transaction metadata and PII exposure assessment',
      'Credit freeze and fraud alert enrollment guidance (Equifax, Experian, TransUnion)',
      'Real-time alert on financial credential exposure',
    ],
    nukedTriggers: ['Card or account number found in breach dump', 'Fintech app has unlimited transaction read access', 'Credit report unfrozen and exposed to inquiry'],
    knoxedTriggers: ['All three credit bureaus frozen', 'Fintech connections scoped to least privilege', 'Zero financial leaks detected'],
    severity: 87,
    nukedCount: 1,
    knoxedCount: 15,
    monitoredCount: 2,
    weight: 0.08,
    integratedWith: ['PrivacyProctor', 'Credit Bureau APIs', 'ChexSystems'],
  },
  {
    id: 'medical',
    vector: 'V-11',
    icon: '⊕',
    label: 'Medical Data Footprint',
    description: 'Health record exposure, health-app data sharing audits, HIPAA compliance drift detection, and medical PII anonymization.',
    capabilities: [
      'Health and wellness app privacy policy and data broker sharing audit',
      'HIPAA safe-harbor 18 identifier pattern detection in health exports',
      'Electronic Health Record (EHR) patient portal API token check',
      'Medical data anonymization and tokenization via Nymiz',
      'Revocation templates for health data aggregation brokers',
    ],
    nukedTriggers: ['Health condition or prescription data found in public breach', 'Health app shares biometric data with ad networks', 'Unencrypted medical documents detected'],
    knoxedTriggers: ['Health records strictly encrypted client-side', 'No health data broker matching', 'HIPAA compliant sharing controls active'],
    severity: 82,
    nukedCount: 1,
    knoxedCount: 10,
    monitoredCount: 3,
    weight: 0.06,
    integratedWith: ['Nymiz', 'HIPAA Guidance', 'Health Data Protocols'],
  },
  {
    id: 'biometric',
    vector: 'V-12',
    icon: '⊛',
    label: 'Voice & Biometric Data',
    description: 'Voiceprint, facial geometry, and fingerprint telemetry exposure audit. BIPA compliance and AI model scraping protection.',
    capabilities: [
      'Voiceprint and audio sample cloud sync exposure detection',
      'Facial recognition training dataset lookup (Clearview, LAION)',
      'Biometric SDK permission audit in mobile and web apps',
      'BIPA (Illinois Biometric Information Privacy Act) deletion requests',
      'Client-side biometric template pseudonymization',
    ],
    nukedTriggers: ['Biometric sample found in scraping dataset', 'Voice recording stored unencrypted on third-party cloud', 'Facial geometry matched in public AI dataset'],
    knoxedTriggers: ['Biometrics stored strictly in local secure enclave', 'Opt-out registered with facial recognition scrapers', 'Zero cloud biometric leakage'],
    severity: 89,
    nukedCount: 1,
    knoxedCount: 12,
    monitoredCount: 1,
    weight: 0.06,
    integratedWith: ['Prisma AIRS', 'Nymiz', 'BIPA Templates'],
  },
  {
    id: 'iot',
    vector: 'V-13',
    icon: '⊡',
    label: 'IoT & Smart Device Scan',
    description: 'Connected device security audit, smart-home attack surface mapping, default credential risk detection, and firmware CVE scanning.',
    capabilities: [
      'LAN smart device discovery and hardware fingerprinting',
      'Default password and unauthenticated access risk scoring',
      'Known CVE vulnerability scanning for smart home firmware',
      'Smart speaker and camera outbound streaming telemetry review',
      'IoT network segmentation and VLAN hardening guidance',
    ],
    nukedTriggers: ['Device uses factory default credentials', 'Outdated firmware with active remote code execution CVE', 'Unencrypted camera stream exposed to WAN'],
    knoxedTriggers: ['IoT devices isolated on dedicated VLAN', 'Strong unique passwords on all smart hardware', 'Firmware fully patched'],
    severity: 68,
    nukedCount: 2,
    knoxedCount: 11,
    monitoredCount: 4,
    weight: 0.05,
    integratedWith: ['Unosecur', 'CVE Database', 'Network Discovery'],
  },
  {
    id: 'cloud',
    vector: 'V-14',
    icon: '⊞',
    label: 'Cloud Storage Exposure',
    description: 'Google Drive, OneDrive, and iCloud security analysis. Public link audits, collaborator access review, and AI cloud exfiltration defense.',
    capabilities: [
      'Audit public and "anyone with the link" shared files',
      'Review collaborator access scopes on cloud drives',
      'Identify sensitive file types stored in plaintext',
      'AI agent cloud sync exfiltration guard (Prisma AIRS)',
      'Enforce automatic link expiration and access revocation',
    ],
    nukedTriggers: ['Sensitive folder shared with public link', 'Stale collaborator retains editor rights on private documents', 'Cloud backup stored without end-to-end encryption'],
    knoxedTriggers: ['Zero public sharing links active', 'All private archives encrypted before cloud upload', 'Access reviewed within last 30 days'],
    severity: 85,
    nukedCount: 1,
    knoxedCount: 19,
    monitoredCount: 2,
    weight: 0.07,
    integratedWith: ['Prisma AIRS', 'Google Drive', 'OneDrive', 'iCloud'],
  },
  {
    id: 'darkweb',
    vector: 'V-15',
    icon: '◈',
    label: 'Dark Web Monitoring',
    description: 'Real-time dark-web credential indexing across Tor hidden services, paste sites, Telegram leak channels, and underground marketplaces.',
    capabilities: [
      'Continuous monitoring of dark web paste sites and marketplaces',
      'Credential and password hash index matching',
      'Phone number, SSN, and driver license fragment surveillance',
      'Telegram and Discord credential-stuffing channel indexing',
      'Rapid exposure alerting within 15 minutes of dump publication',
    ],
    nukedTriggers: ['Raw plaintext credentials published on dark web market', 'Compromised identity combo list actively circulating', 'Identity documents offered for sale'],
    knoxedTriggers: ['Zero dark web matches across all monitored identifiers', 'Compromised records fully rotated and neutralized', 'Dark web alert triggers active'],
    severity: 45,
    nukedCount: 4,
    knoxedCount: 6,
    monitoredCount: 5,
    weight: 0.12,
    integratedWith: ['PrivacyProctor', 'Tor Intelligence', 'Dark Web Gateways'],
  },
  {
    id: 'behavioral',
    vector: 'V-16',
    icon: '⊟',
    label: 'Behavioral Profile Analysis',
    description: 'Inferred demographic mapping, psychographic fingerprinting analysis, ad-network tracking segment de-anonymization, and AI profile defense.',
    capabilities: [
      'Reconstruct ad-platform behavioral and interest segments',
      'Cross-device browsing correlation and identity graph mapping',
      'Psychographic tag and consumer score de-anonymization',
      'AI model inference and behavioral profiling resistance',
      'Guidance for poison-pill and differential privacy techniques',
    ],
    nukedTriggers: ['Comprehensive commercial profile assembled by data broker', 'Cross-device graph connects work and personal identities', 'Behavioral score used for predatory pricing or risk rating'],
    knoxedTriggers: ['Behavioral tracking minimized via anti-tracking tools', 'Synthetic noise added to commercial interest profiles', 'Identity partitioned across isolated personas'],
    severity: 58,
    nukedCount: 3,
    knoxedCount: 7,
    monitoredCount: 4,
    weight: 0.05,
    integratedWith: ['Prisma AIRS', 'Polymer', 'Ad-Transparency Portals'],
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
