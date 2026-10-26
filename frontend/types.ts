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

export type BrokerOptOutStatus = 'LISTED' | 'DISPATCHED' | 'VERIFYING' | 'CONFIRMED_NUKED';

export interface DataBrokerEntry {
  id: string;
  name: string;
  domain: string;
  category: 'PEOPLE_SEARCH' | 'PUBLIC_RECORDS' | 'MARKETING_PROFILER' | 'FINANCIAL_RISK';
  recordsExposed: string[];
  privacyOfficerEmail: string;
  optOutPortalUrl: string;
  statutoryJurisdiction: 'CCPA_CPRA' | 'GDPR_ART17' | 'GLOBAL_ECRA';
  status: BrokerOptOutStatus;
  dispatchTimestamp?: string;
  verificationHash?: string;
  complianceDeadlineDays: number;
}

export interface BrokerDispatchLog {
  id: string;
  brokerId: string;
  brokerName: string;
  action: 'DISPATCHED' | 'ACKNOWLEDGED' | 'VERIFIED_NUKED';
  timestamp: string;
  statutoryStandard: string;
  receiptSha256: string;
}

export type VaultFileState = 'PLAIN_EXPOSED' | 'SHREDDING' | 'NUKED_SHREDDED' | 'KNOXED_ENCRYPTED';

export interface SensitiveFileItem {
  id: string;
  fileName: string;
  fileType: 'TAX_DOCUMENT' | 'PASSPORT_SCAN' | 'API_KEY_SECRET' | 'SEED_PHRASE' | 'MEDICAL_RECORD' | 'ID_DRIVER_LICENSE';
  fileSizeKb: number;
  detectedLocation: string;
  extractedSnippet: string;
  status: VaultFileState;
  entropyScore: number;
  sha256Hash: string;
  shredPassCount?: number;
  encryptionIv?: string;
}

export type StealerMalwareFamily = 'REDLINE' | 'LUMMA' | 'VIDAR' | 'RACCOON' | 'MEDUZA';

export type StealerItemStatus = 'ACTIVE_THREAT' | 'TOKEN_REVOKED_NUKED' | 'ENCLAVE_ISOLATED_KNOXED';

export interface StealerLogEntry {
  id: string;
  malwareFamily: StealerMalwareFamily;
  botId: string;
  compromisedHost: string;
  exfiltratedItemType: 'BROWSER_SESSION_COOKIE' | 'OAUTH_REFRESH_TOKEN' | 'CREDENTIAL_PAIR' | 'CRYPTO_EXTENSION_VAULT';
  serviceAffected: string;
  credentialSnippet: string;
  detectedDate: string;
  status: StealerItemStatus;
  sha256Verification: string;
  cveReference: string;
  ipGeolocation: string;
}

export type BiometricEngine = 'CLEARVIEW_AI' | 'PIMEYES' | 'FACECHECK_ID' | 'SEARCHFACE_VK';

export type BiometricIndexStatus = 'INDEXED_EXPOSED' | 'BIPA_ERASURE_REQUESTED' | 'CRYPTOGRAPHIC_PURGED';

export interface ScrapedFaceIndex {
  id: string;
  engine: BiometricEngine;
  sourceContext: string;
  confidenceScore: number;
  matchedFacialLandmarks: number;
  detectedUrl: string;
  status: BiometricIndexStatus;
  bipaClaimId?: string;
  sha256Attestation: string;
}

export type CloakFilterAlgorithm = 'FAWKES_ADVERSARIAL' | 'LOWKEY_PERTURBATION' | 'SPECTRAL_DIFFUSION_MASK' | 'ENCLAVE_NOISE_VECTOR';

export type AdBeaconType = 'APPLE_IDFA' | 'GOOGLE_GAID' | 'CONNECTED_TV_IFA' | 'CROSS_APP_DEVICE_FINGERPRINT';

export interface AdBeaconItem {
  id: string;
  beaconType: AdBeaconType;
  devicePlatform: string;
  identifierValue: string;
  linkedAppEcosystem: string;
  resellerBroker: string;
  status: 'EXPOSED_TRACKING' | 'NUKED_ZEROED' | 'KNOXED_ROTATING';
  lastBroadcast: string;
  sha256Fingerprint: string;
}

export interface LocationBreadcrumbRecord {
  id: string;
  brokerSource: 'SafeGraph' | 'Veraset' | 'Outlogic / X-Mode' | 'Cuebiq Mobility' | 'Unacast';
  approxCity: string;
  preciseLatLong: string;
  timestamp: string;
  dwellTimeMinutes: number;
  sdkCarrierApp: string;
  status: 'PROFILED_FOR_SALE' | 'PURGE_ORDER_DISPATCHED' | 'FUZZED_OBSCURED';
  sha256Attestation: string;
}

export interface LocationFuzzingProfile {
  fuzzRadiusMiles: number;
  fuzzAlgorithm: 'LAPLACE_DIFFERENTIAL_PRIVACY' | 'GEO_HASH_TRUNCATION' | 'RANDOMIZED_HEX_VORONOI' | 'BLIND_PROXIMITY_MASK';
  activeMacRotation: boolean;
  suppressCellularTriangulation: boolean;
  sha256Proof: string;
}

// Module 2: Social Media Scrubber & Footprint Models
export interface SocialMediaPostAudit {
  id: string;
  platform: 'X / Twitter' | 'LinkedIn' | 'Meta / Instagram' | 'Threads' | 'Reddit';
  postSnippet: string;
  ageDays: number;
  hasExifGeoTag: boolean;
  embeddedCoordinates?: string;
  handleReuseCount: number;
  status: 'EXPOSED_PUBLIC' | 'EXIF_STRIPPED_KNOXED' | 'DELETED_NUKED';
  sha256Proof: string;
}

// Module 9: Financial Vault & Virtual Card Tokenization Models
export interface ExposedMerchantCard {
  id: string;
  merchantName: string;
  merchantCategory: string;
  cardBrand: 'Visa' | 'Mastercard' | 'Amex';
  last4: string;
  vaultStorageType: 'RAW_PAN_RETAINED' | 'PCI_LEGACY_UNTOKENIZED';
  status: 'EXPOSED_AT_REST' | 'PURGE_REQUESTED' | 'TOKENIZED_REPLACED';
  sha256Attestation: string;
}

export interface VirtualMaskedCard {
  id: string;
  merchantBound: string;
  maskedCardNumber: string;
  expDate: string;
  cvv: string;
  spendingLimitDollars: number;
  isSingleUse: boolean;
  isEnclaveLocked: boolean;
  sha256Seal: string;
}

// Module 13: IoT & Smart Home Telemetry Models
export interface SmartHomeDeviceAudit {
  id: string;
  deviceName: string;
  deviceType: 'SMART_TV' | 'VOICE_ASSISTANT' | 'SECURITY_CAM' | 'SMART_APPLIANCE';
  macAddress: string;
  telemetryDestination: string;
  acrTrackingActive: boolean;
  unencryptedAudioStream: boolean;
  networkVlanStatus: 'UNISOLATED_DEFAULT' | 'ACR_PURGED_NUKED' | 'VLAN_ISOLATED_KNOXED';
  sha256Audit: string;
}

// Module 1: Email Breach & Metadata Models
export interface EmailBreachRecord {
  id: string;
  breachName: string;
  breachDomain: string;
  leakDate: string;
  pwnCount: number;
  dataClassesCompromised: string[];
  status: 'LEAK_UNREMEDIATED' | 'GDPR_ERASURE_DISPATCHED' | 'ALIASED_KNOXED';
  sha256Verification: string;
  dpoEmail: string;
  passwordCompromisedType: 'PLAIN_PLAINTEXT' | 'MD5_HASH' | 'SHA1_UNSALTED' | 'BCRYPT_CRACKED';
}

export interface EphemeralEmailAlias {
  id: string;
  aliasAddress: string;
  forwardToTarget: string;
  purposeLabel: string;
  isAutoExpiring: boolean;
  ttlHours: number;
  status: 'ACTIVE_FORWARDING' | 'MUTED_BLOCKED' | 'SHREDDED';
  sha256Fingerprint: string;
  createdAt: string;
}

// Module 8: DNS & ISP Surveillance Models
export interface DnsSurveillanceQuery {
  id: string;
  domainRequested: string;
  queryType: 'A' | 'AAAA' | 'HTTPS' | 'TXT';
  protocol: 'UNENCRYPTED_UDP_53' | 'DOH_TLS_443' | 'ODOH_QUANTUM_BLINDED';
  ispInterceptionRisk: 'HIGH_LOGGED' | 'RESOLVED_LOCAL' | 'ZERO_KNOWLEDGE_ODOH';
  destinationIp: string;
  sha256Receipt: string;
  timestamp: string;
}

export interface IspSurveillanceProfile {
  ispName: string;
  asnNumber: string;
  retentionWindowDays: number;
  inspectsSniEch: boolean;
  supportsOdoh: boolean;
  activeWireguardTunnel: boolean;
  wireguardEndpoint: string;
  wireguardQuantumPubKey: string;
  arpFlushTimestamp: string;
}

// Module 16: Password & Hash Strength Models
export interface PasswordClusterItem {
  id: string;
  serviceName: string;
  accountIdentifier: string;
  hashType: 'ARGON2ID' | 'BCRYPT' | 'SHA256_LEGACY' | 'MD5_VULNERABLE';
  passwordLength: number;
  entropyBits: number;
  reuseClusterTag: string;
  status: 'REUSED_EXPOSED' | 'NUKED_DEPRECATED' | 'KNOXED_ARGON2ID';
  sha256Proof: string;
}

export interface Argon2idDerivationParams {
  memoryCostKiB: number;
  iterations: number;
  parallelism: number;
  saltHex: string;
  derivedKeyLength: number;
}

// Module 12: Identity Document & mDL Models
export interface IdentityDocumentScan {
  id: string;
  documentType: 'PASSPORT' | 'DRIVER_LICENSE' | 'STATE_ID' | 'GLOBAL_ENTRY';
  issuingJurisdiction: string;
  documentNumberMasked: string;
  plainFileLocation: string;
  mrzDetected: boolean;
  status: 'EXPOSED_UNENCRYPTED' | 'SHREDDED_NUKED' | 'MDL_ISO18013_KNOXED';
  sha256Fingerprint: string;
  iso18013Digest?: string;
}

// Module 4: Hardware Enclave Inspector Models
export interface HardwareEnclavePosture {
  hardwareModel: string;
  secureEnclaveType: 'APPLE_SILICON_SEP' | 'GOOGLE_TITAN_M2' | 'TPM_2_0_DISCRETE' | 'EMULATED_TEE';
  diskEncryptionActive: boolean;
  biometricHardwareAvailable: boolean;
  jailbreakRootDetected: boolean;
  autoLockTimeoutSeconds: number;
  enclaveStatus: 'FULLY_HARDENED' | 'ELEVATED_RISK' | 'NON_COMPLIANT';
  attestationNonce: string;
  sha256Verification: string;
}

// Module 5: Deep Web Exposure & Darknet Index Models
export interface DarknetPasteExposure {
  id: string;
  sourceType: 'ONION_MARKETPLACE' | 'PUBLIC_PASTEBIN' | 'TELEGRAM_DUMP_CHANNEL' | 'BREACH_INDEX_TOR';
  sourceTitle: string;
  onionAddressMasked: string;
  exposedDataSnippet: string;
  threatSeverity: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  detectedTimestamp: string;
  status: 'ACTIVE_EXPOSURE' | 'TAKEDOWN_DISPATCHED' | 'BLIND_HASH_MONITORED';
  sha256Hash: string;
}

export interface BlindHashMonitorProfile {
  zeroKnowledgePrefix: string; // First 8 chars of SHA-256 for blinded k-Anonymity
  alertThreshold: 'IMMEDIATE' | 'DAILY_DIGEST' | 'STRICT_LOCKDOWN';
  activeWebhookAlerts: boolean;
  lastSyncTimestamp: string;
  sha256Attestation: string;
}

// Module 11: Cloud Backup Zero-Knowledge Verification Models
export interface CloudBackupVaultItem {
  id: string;
  providerName: 'iCloud Advanced Data Protection' | 'Google Workspace CSE' | 'Legacy Cloud Backup';
  storageService: string;
  clientSideEncryptionActive: boolean;
  recoveryKeyType: 'POST_QUANTUM_KYBER1024' | 'HARDWARE_FIDO2_BACKUP' | 'LEGACY_SMS_ESCROW';
  staleAgeDays: number;
  totalSizeGb: number;
  status: 'ZERO_KNOWLEDGE_VERIFIED' | 'STALE_LEGACY_EXPOSED' | 'PURGED_NUKED';
  sha256AuditReceipt: string;
}
