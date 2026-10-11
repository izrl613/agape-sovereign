import { DiffVector, AdminTelemetryState } from './types';

export const ADMIN_AUTHORIZED_EMAILS = ['idin@agape.nyc', 'agape@sovereign.nyc'];

export const INITIAL_16_DIFF_VECTORS: DiffVector[] = [
  // 1. Email Breach & Metadata Scanner (Firefox Monitor inspired)
  {
    id: 'diff-01',
    moduleNumber: 1,
    name: 'Email Breach & Metadata Engine',
    category: 'COMMUNICATIONS',
    shortDesc: 'Deep crawl of leaked password databases, raw credential dumps, and email headers.',
    dataValue: 'israel.david@agape.nyc',
    exposureDetails: 'Found in 3 historical credential aggregations (2021-2024)',
    status: 'EXPOSED',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sourceInspiration: 'Firefox Monitor Standard',
    riskLevel: 'HIGH',
    nukedAction: 'Issue GDPR Article 17 Erasure request & scrub from public Pastebins',
    knoxedAction: 'Re-bind to hardware FIDO2 passkey; activate ephemeral aliasing',
    lastScanned: '2 mins ago'
  },
  // 2. Social Media Footprint Scanner (Jumbo inspired)
  {
    id: 'diff-02',
    moduleNumber: 2,
    name: 'Social Media Footprint & Scraping',
    category: 'DIGITAL_PRESENCE',
    shortDesc: 'Analyzes public posts, handle reuse, indexed bio metadata, and photo EXIF leaks.',
    dataValue: '@sovereign_identity (X, LinkedIn, Meta)',
    exposureDetails: 'Indexed location metadata on 14 public posts across platforms',
    status: 'EXPOSED',
    sha256Hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    sourceInspiration: 'Jumbo Privacy Protocol',
    riskLevel: 'MODERATE',
    nukedAction: 'Batch purge historic posts older than 90 days and wipe profile caches',
    knoxedAction: 'Enforce private enclave mode, strip EXIF geo-tags, restrict viewer radius',
    lastScanned: '5 mins ago'
  },
  // 3. Device File Scan (Local & Cloud)
  {
    id: 'diff-03',
    moduleNumber: 3,
    name: 'Device & Cloud File Vault Scan',
    category: 'DEVICES_SYSTEMS',
    shortDesc: 'Deep pattern recognition for unencrypted tax forms, passport scans, and API keys.',
    dataValue: 'MacBook Pro + Google Drive Enclave',
    exposureDetails: '2 unencrypted SSN-containing PDFs located in local Downloads folder',
    status: 'EXPOSED',
    sha256Hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    sourceInspiration: 'BitDefender Zero-Trust Vault',
    riskLevel: 'CRITICAL',
    nukedAction: 'Zero-out shred local plain files using DoD 5220.22-M sanitization',
    knoxedAction: 'AES-256-GCM local vault encryption with Web Crypto API derivation',
    lastScanned: 'Just now'
  },
  // 4. Mobile & Laptop Hardware Security
  {
    id: 'diff-04',
    moduleNumber: 4,
    name: 'Mobile & Laptop Hardware Enclave',
    category: 'DEVICES_SYSTEMS',
    shortDesc: 'Apple Secure Enclave / Google Titan status, disk encryption, and TPM verification.',
    dataValue: 'Apple Silicon T2 + Pixel Titan M2',
    exposureDetails: 'FileVault active, but biometric backup passcode timeout is too permissive',
    status: 'KNOXED',
    sha256Hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    sourceInspiration: 'ECRA 2026 Hardware Baseline',
    riskLevel: 'LOW',
    nukedAction: 'Revoke remote legacy device authorizations from Google/Apple accounts',
    knoxedAction: 'Force 1-minute auto-lockdown and require passkey for all privilege changes',
    lastScanned: '10 mins ago'
  },
  // 5. Deep Web Exposure Monitoring
  {
    id: 'diff-05',
    moduleNumber: 5,
    name: 'Deep Web Exposure & Darknet Index',
    category: 'DEEP_WEB_BROKERS',
    shortDesc: 'Continuous polling of onion repositories, telegram channels, and breach forums.',
    dataValue: 'Encrypted hash identifier #9910-NYC',
    exposureDetails: 'No direct raw credential leak found in recent 2026 darknet dumps',
    status: 'KNOXED',
    sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    sourceInspiration: 'Google Deep Web Privacy Suite',
    riskLevel: 'LOW',
    nukedAction: 'Immediate credential rotation for all linked alias accounts',
    knoxedAction: 'Permanent cryptographic blind monitoring via zero-knowledge proofs',
    lastScanned: '1 hour ago'
  },
  // 6. Data Broker Removal Engine (Optery & SayMine inspired)
  {
    id: 'diff-06',
    moduleNumber: 6,
    name: 'Data Broker Removal Engine',
    category: 'DEEP_WEB_BROKERS',
    shortDesc: 'Automated legal erasure against 220+ people-search engines (LexisNexis, Whitepages).',
    dataValue: 'Personal profile & residential records',
    exposureDetails: '18 active broker listings indexing home address and relative links',
    status: 'EXPOSED',
    sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    sourceInspiration: 'Optery & SayMine Protocols',
    riskLevel: 'HIGH',
    nukedAction: 'Deploy ECRA 2026 automated DSAR deletion requests to all 18 brokers',
    knoxedAction: 'Enable continuous re-scrape suppression registry',
    lastScanned: '30 mins ago'
  },
  // 7. Passkey & WebAuthn Vault
  {
    id: 'diff-07',
    moduleNumber: 7,
    name: 'Universal Passkey & FIDO2 Vault',
    category: 'CREDENTIALS_FINANCE',
    shortDesc: 'Eliminates phishable passwords by deploying biometric passkeys across all sites.',
    dataValue: 'WebAuthn PRF Authenticator: bound',
    exposureDetails: '6 services still utilizing static SMS-based OTP fallback',
    status: 'EXPOSED',
    sha256Hash: 'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683',
    sourceInspiration: 'FIDO Alliance 2026 Passkey Standard',
    riskLevel: 'HIGH',
    nukedAction: 'Deprecate SMS 2FA numbers across all linked banking and cloud portals',
    knoxedAction: 'Upgrade all accounts to passkey-only login with physical security keys',
    lastScanned: '15 mins ago'
  },
  // 8. DNS & Network Surveillance Trail
  {
    id: 'diff-08',
    moduleNumber: 8,
    name: 'DNS Queries & ISP Telemetry Footprint',
    category: 'DEVICES_SYSTEMS',
    shortDesc: 'Inspection of ISP log retention, unencrypted DNS queries, and WiFi beaconing.',
    dataValue: 'Encrypted DNS over HTTPS (DoH / Oblivious DNS)',
    exposureDetails: 'Home router exposed to ISP transparent proxy log analysis',
    status: 'EXPOSED',
    sha256Hash: '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451',
    sourceInspiration: 'Firefox DNS Shield Standard',
    riskLevel: 'MODERATE',
    nukedAction: 'Flush network lease ARP tables and kill broadcast identifiers',
    knoxedAction: 'Tunnel traffic through Quantum-Resistant WireGuard Enclave with ODoH',
    lastScanned: '8 mins ago'
  },
  // 9. Financial & Credit Card Tokenization
  {
    id: 'diff-09',
    moduleNumber: 9,
    name: 'Financial Footprint & Tokenization',
    category: 'CREDENTIALS_FINANCE',
    shortDesc: 'Monitors raw credit card storage on e-commerce carts and merchant databases.',
    dataValue: 'Virtual Apple Pay / Google Wallet tokens',
    exposureDetails: '3 merchant sites retaining expired raw card numbers without tokenization',
    status: 'EXPOSED',
    sha256Hash: '2c624232cdd221771294dfbb310aca000a0df6ec8b6604b7242343ce29f50b4e',
    sourceInspiration: 'Zero-Knowledge Financial Shield',
    riskLevel: 'HIGH',
    nukedAction: 'Dispatch automated merchant card purge and close stale merchant accounts',
    knoxedAction: 'Lock all recurring billing behind single-use virtual masked cards',
    lastScanned: '4 hours ago'
  },
  // 10. Biometric Telemetry & Facial Scraping Index
  {
    id: 'diff-10',
    moduleNumber: 10,
    name: 'Biometric Face Scraping & Clearview Defense',
    category: 'DIGITAL_PRESENCE',
    shortDesc: 'Scans public web for unconsented face indexing by AI visual search models.',
    dataValue: 'Reverse image hashes (Clearview/PimEyes check)',
    exposureDetails: '2 public conference group photos indexed with 98% biometric match',
    status: 'EXPOSED',
    sha256Hash: '19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7',
    sourceInspiration: 'ECRA 2026 Biometric Sovereignty',
    riskLevel: 'CRITICAL',
    nukedAction: 'Submit biometric opt-out and image hash deletion under BIPA / ECRA',
    knoxedAction: 'Apply digital cloaking noise filters to public sovereign avatars',
    lastScanned: '1 day ago'
  },
  // 11. Cloud Backup Integrity & End-to-End Encryption
  {
    id: 'diff-11',
    moduleNumber: 11,
    name: 'Cloud Backup Zero-Knowledge Verification',
    category: 'COMMUNICATIONS',
    shortDesc: 'Checks whether iCloud Advanced Data Protection or Google client-side encryption is active.',
    dataValue: 'iCloud ADP + Google Workspace CSE',
    exposureDetails: 'Advanced Data Protection verified active with hardware security key',
    status: 'KNOXED',
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    sourceInspiration: 'Apple Enclave Security Protocol',
    riskLevel: 'LOW',
    nukedAction: 'Delete unencrypted legacy device cloud backups older than 180 days',
    knoxedAction: 'Rotate recovery keys and verify zero cloud provider server-side access',
    lastScanned: '12 mins ago'
  },
  // 12. Identity Documents & Credentials
  {
    id: 'diff-12',
    moduleNumber: 12,
    name: 'Identity Credentials & mDL Sovereignty',
    category: 'CREDENTIALS_FINANCE',
    shortDesc: 'Protects state IDs, driver licenses, and passport credentials from unencrypted photo leaks.',
    dataValue: 'ISO 18013-5 Mobile Driver License (mDL)',
    exposureDetails: 'Driver license scan stored in unencrypted notes folder',
    status: 'EXPOSED',
    sha256Hash: '4a44dc55e643ed7fc41e4ff02c2e0b5f1f912ae0d6e27b686d6ee477033fae68',
    sourceInspiration: 'Agape Sovereign Enclave Standard',
    riskLevel: 'CRITICAL',
    nukedAction: 'Permanent cryptographic shredding of plain image files from note apps',
    knoxedAction: 'Migrate to hardware-backed ISO 18013-5 cryptographically signed mDL',
    lastScanned: '25 mins ago'
  },
  // 13. Smart Home & IoT Footprint
  {
    id: 'diff-13',
    moduleNumber: 13,
    name: 'IoT & Smart Home Telemetry Siphon',
    category: 'DEVICES_SYSTEMS',
    shortDesc: 'Identifies home devices beaconing telemetry, unencrypted audio snippets, and MAC addresses.',
    dataValue: 'Matter & Thread Local VLAN Isolation',
    exposureDetails: 'Smart TV beaconing viewing telemetry to third-party ad attribution server',
    status: 'EXPOSED',
    sha256Hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    sourceInspiration: 'BitDefender Home Guard',
    riskLevel: 'MODERATE',
    nukedAction: 'Block ACR automatic content recognition and wipe TV profiling history',
    knoxedAction: 'Isolate all IoT devices onto an air-gapped non-routable VLAN',
    lastScanned: '40 mins ago'
  },
  // 14. Geolocation & Advertising ID Tracking (AdID)
  {
    id: 'diff-14',
    moduleNumber: 14,
    name: 'Ad Profiling ID & Precise Location Trail',
    category: 'DIGITAL_PRESENCE',
    shortDesc: 'Audits mobile Advertising IDs (IDFA / GAID) and broker location data reseller sales.',
    dataValue: 'Zero-IDFA mode + Random MAC Rotation',
    exposureDetails: 'Historical location breadcrumbs found in aggregated mobility dataset',
    status: 'EXPOSED',
    sha256Hash: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce',
    sourceInspiration: 'Jumbo Anti-Tracking Protocol',
    riskLevel: 'HIGH',
    nukedAction: 'Reset & permanently delete Google/Apple Advertising Identifiers',
    knoxedAction: 'Enforce fuzzy 5-mile location radius for non-essential applications',
    lastScanned: '3 hours ago'
  },
  // 15. Dark Web Forum Mentions & Pastebins
  {
    id: 'diff-15',
    moduleNumber: 15,
    name: 'Breach Forum & Stealer Log Scanner',
    category: 'DEEP_WEB_BROKERS',
    shortDesc: 'RedLine, Lumma, and Vidar stealer malware log analysis for stolen cookies & tokens.',
    dataValue: 'Session token & browser vault analysis',
    exposureDetails: 'Clean - No browser session cookies detected in circulating stealer logs',
    status: 'KNOXED',
    sha256Hash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
    sourceInspiration: 'Google Mandiant Threat Intelligence',
    riskLevel: 'LOW',
    nukedAction: 'Invalidate all current active OAuth browser refresh tokens immediately',
    knoxedAction: 'Lock browser storage behind hardware YubiKey session bindings',
    lastScanned: '50 mins ago'
  },
  // 16. Past Password & Hash Strength Analysis
  {
    id: 'diff-16',
    moduleNumber: 16,
    name: 'Cryptographic Hash Strength & Reuse Matrix',
    category: 'CREDENTIALS_FINANCE',
    shortDesc: 'Calculates entropy and identifies shared password clusters across legacy services.',
    dataValue: 'Argon2id KDF Master Derivation',
    exposureDetails: '2 legacy web accounts still using identical 12-character passwords',
    status: 'EXPOSED',
    sha256Hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    sourceInspiration: 'NIST 800-63B & 2026 ECRA',
    riskLevel: 'HIGH',
    nukedAction: 'Nuke duplicate passwords and close redundant inactive online accounts',
    knoxedAction: 'Migrate to 32-character cryptographically random passwords via passkey vault',
    lastScanned: '18 mins ago'
  }
];

export const INITIAL_ADMIN_TELEMETRY: AdminTelemetryState = {
  cloudRunStatus: 'HEALTHY - 0 COLD STARTS (REGION: US-EAST4)',
  webAuthnHandshakes: 419,
  zeroKnowledgeViolations: 0,
  nodeHealth: 99.98,
  activeEcraProtocol: '2026-ECRA-LTS-REV4-STRICT',
  logs: [
    {
      id: 'log-101',
      timestamp: '2026-03-30 08:42:11 UTC',
      serviceName: 'WebCrypto_Subtle_Digest',
      status: 'OPTIMAL',
      latencyMs: 1.4,
      operation: 'SHA-256 Vector Fingerprinting across 16 channels',
      shaFingerprint: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      id: 'log-102',
      timestamp: '2026-03-30 08:42:15 UTC',
      serviceName: 'FIDO2_Passkey_Authenticator',
      status: 'SECURED',
      latencyMs: 3.2,
      operation: 'Universal Passkey challenge verified: Apple Silicon enclave',
      shaFingerprint: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce'
    },
    {
      id: 'log-103',
      timestamp: '2026-03-30 08:42:20 UTC',
      serviceName: 'Firestore_Rule_Enforcer',
      status: 'OPTIMAL',
      latencyMs: 0.8,
      operation: 'Blocked plaintext inspection on /users/ collections. Zero-access verified.',
      shaFingerprint: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
    },
    {
      id: 'log-104',
      timestamp: '2026-03-30 08:42:28 UTC',
      serviceName: 'Cloud_Functions_PDF_Compiler',
      status: 'OPTIMAL',
      latencyMs: 142.0,
      operation: 'Ephemeral in-memory Lighthouse PDF renderer stream prepared',
      shaFingerprint: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35'
    }
  ]
};
