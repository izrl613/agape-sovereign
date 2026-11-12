/**
 * ============================================================
 * ARCHITECT AI — Identity Vector Module Configurations
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Central configuration for all 16 identity vector modules.
 * Defines visual styles, gatekeeper requirements, and field schemas.
 */

import type { DataProvider } from '../services/gatekeeperService';

export interface IVectorModule {
  id: string;
  name: string;
  vector: string;
  description: string;
  icon: string;
  color: string; // NEON hex without #
  encryptionLevel: 'Standard' | 'High' | 'Quantum-Resistant';
  gateMinFields: number;
  gateMaxFields: number;
  gateRequiredProviders: DataProvider[];
  defaultProvider: DataProvider;
  fieldSchema: FieldConfig[];
}

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'textarea';
}

/**
 * All 16 Identity Vector Modules with Visual Configurations
 */
export const VECTOR_MODULES: IVectorModule[] = [
  {
    id: 'v01',
    name: 'Email Scanner',
    vector: 'V-01',
    description: 'Email breach & credential reuse scan across HIBP/Dehashed databases',
    icon: 'Mail',
    color: '#FF2E9F',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'primaryEmail', label: 'Primary Email', placeholder: 'user@sovereign.nyc' },
      { key: 'backupAliases', label: 'Cloaked Aliases', placeholder: 'alias1@anon.me' },
      { key: 'compromisedPasswords', label: 'Exposed Passwords', placeholder: 'P@ssword123', type: 'password' },
      { key: 'forwardingRules', label: 'Forwarding Domains', placeholder: 'protonmail.com' },
    ],
  },
  {
    id: 'v02',
    name: 'Social Map',
    vector: 'V-02',
    description: 'OSINT social profile & OAuth audit across 50+ networks',
    icon: 'Users',
    color: '#00D4FF',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['manual-entry', 'api-integration'],
    defaultProvider: 'api-integration',
    fieldSchema: [
      { key: 'socialHandles', label: 'Social Handles', placeholder: '@username (X, GitHub, LI)' },
      { key: 'oauthTokens', label: 'OAuth Tokens', placeholder: 'Google/GitHub token' },
      { key: 'publicPostPII', label: 'Public PII', placeholder: 'Phone, address mentions' },
      { key: 'profileURLs', label: 'Profile URLs', placeholder: 'https://twitter.com/user' },
    ],
  },
  {
    id: 'v03',
    name: 'Device Health',
    vector: 'V-03',
    description: 'Local PII scan & encryption audit of device storage',
    icon: 'Activity',
    color: '#FF2E9F',
    encryptionLevel: 'High',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['webauthn-passkey'],
    defaultProvider: 'webauthn-passkey',
    fieldSchema: [
      { key: 'hardwareSerial', label: 'Hardware Serial', placeholder: 'C02FX001MD6M' },
      { key: 'operatingSystem', label: 'OS & Build', placeholder: 'macOS Tahoe 15.4' },
      { key: 'diskEncryptionKey', label: 'Disk Encryption Key', placeholder: 'SHA256:...', type: 'password' },
      { key: 'cloudSyncFolders', label: 'Cloud Folders', placeholder: '~/iCloud' },
    ],
  },
  {
    id: 'v04',
    name: 'System Security',
    vector: 'V-04',
    description: 'Passkey/WebAuthn hardware key & disk encryption verification',
    icon: 'Shield',
    color: '#00D4FF',
    encryptionLevel: 'High',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['webauthn-passkey'],
    defaultProvider: 'webauthn-passkey',
    fieldSchema: [
      { key: 'firewallPolicy', label: 'Firewall Policy', placeholder: 'PF / UFW active' },
      { key: 'openPorts', label: 'Open Ports', placeholder: '22 (SSH), 443 (HTTPS)' },
      { key: 'sshPublicKeys', label: 'SSH Public Keys', placeholder: 'ssh-ed25519...' },
      { key: 'antivirusSignature', label: 'Antivirus Agent', placeholder: 'Sovereign Monitor' },
    ],
  },
  {
    id: 'v05',
    name: 'Deep Web',
    vector: 'V-05',
    description: 'Dark web marketplace & onion site monitoring',
    icon: 'Dna',
    color: '#FF2E9F',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 3,
    gateRequiredProviders: ['api-integration'],
    defaultProvider: 'api-integration',
    fieldSchema: [
      { key: 'darknetHandles', label: 'Darknet Handles', placeholder: 'shadow_user99' },
      { key: 'breachQueryTerms', label: 'Breach Terms', placeholder: 'Domain names, SSN hashes' },
      { key: 'pastebinWatchlist', label: 'Paste Watchlist', placeholder: 'API keys, DB passwords' },
    ],
  },
  {
    id: 'v06',
    name: 'Broker Removal',
    vector: 'V-06',
    description: 'Data broker opt-out & ECRA 2026 compliance SLA tracking',
    icon: 'Trash2',
    color: '#FF7A18',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 5,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'legalName', label: 'Legal Name', placeholder: 'Jane Sovereign Doe' },
      { key: 'residentialAddresses', label: 'Addresses', placeholder: '123 Sovereign Way' },
      { key: 'phoneNumbers', label: 'Phone Numbers', placeholder: '+1 (555) 019-2834' },
      { key: 'brokerOptOutIDs', label: 'Opt-Out IDs', placeholder: 'Optery Ref #99281' },
    ],
  },
  {
    id: 'v07',
    name: 'Network Vector',
    vector: 'V-07',
    description: 'WebRTC IP leak probe & DNS-over-HTTPS verification',
    icon: 'Globe',
    color: '#00D4FF',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['api-integration'],
    defaultProvider: 'api-integration',
    fieldSchema: [
      { key: 'homeSSID', label: 'Home SSID', placeholder: 'Sovereign_Enclave_5G' },
      { key: 'routerMAC', label: 'Router MAC', placeholder: '00:1A:2B:3C:4D:5E' },
      { key: 'vpnEndpoint', label: 'VPN Endpoint', placeholder: 'vpn.sovereign.nyc:51820' },
      { key: 'dnsResolver', label: 'DNS Resolver', placeholder: '1.1.1.1, 9.9.9.9' },
    ],
  },
  {
    id: 'v08',
    name: 'Cloud Enclave',
    vector: 'V-08',
    description: 'Cloud file share audit & permission scope verification',
    icon: 'Cloud',
    color: '#FF2E9F',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['api-integration'],
    defaultProvider: 'api-integration',
    fieldSchema: [
      { key: 'gcpProjectId', label: 'GCP Project', placeholder: 'agape-sovereign-prod' },
      { key: 'firebaseAppId', label: 'Firebase App', placeholder: '1:1029384756:web:abcd1234' },
      { key: 's3BucketURIs', label: 'S3 Buckets', placeholder: 'gs://vault-data' },
      { key: 'apiKeysHashes', label: 'API Key Hashes', placeholder: 'SHA256:7f8a9b...', type: 'password' },
    ],
  },
  {
    id: 'v09',
    name: 'Biometrics',
    vector: 'V-09',
    description: 'Facial recognition dataset index check & BIPA compliance',
    icon: 'Fingerprint',
    color: '#00D4FF',
    encryptionLevel: 'High',
    gateMinFields: 1,
    gateMaxFields: 3,
    gateRequiredProviders: ['webauthn-passkey'],
    defaultProvider: 'webauthn-passkey',
    fieldSchema: [
      { key: 'webauthnCredID', label: 'WebAuthn Cred ID', placeholder: 'cred-pubkey-webauthn-2026' },
      { key: 'faceIdHash', label: 'FaceID Hash', placeholder: 'e3b0c44298fc1c149af...', type: 'password' },
      { key: 'secureEnclaveID', label: 'Secure Enclave', placeholder: 'TPM-SECURE-ID-9921' },
    ],
  },
  {
    id: 'v10',
    name: 'Crypto Assets',
    vector: 'V-10',
    description: 'On-chain wallet audit & smart contract unlimited allowance check',
    icon: 'Cpu',
    color: '#FF7A18',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 4,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'evmAddress', label: 'EVM Address', placeholder: '0x71C7656EC7ab88b098def' },
      { key: 'btcAddress', label: 'BTC Address', placeholder: 'bc1qxy2kgdygjrsqtzq2n0y' },
      { key: 'solAddress', label: 'Solana Address', placeholder: '7v91Nbdg2wP1s8mN29384756...' },
      { key: 'seedPhraseHash', label: 'Seed Phrase Hash', placeholder: 'e3b0c44298fc1c149af...', type: 'password' },
    ],
  },
  {
    id: 'v11',
    name: 'Smart Home IoT',
    vector: 'V-11',
    description: 'IoT device discovery & security audit via mDNS/UPnP',
    icon: 'Smartphone',
    color: '#00D4FF',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 3,
    gateRequiredProviders: ['api-integration'],
    defaultProvider: 'api-integration',
    fieldSchema: [
      { key: 'homeAssistantURL', label: 'Home Assistant', placeholder: 'https://homeassistant.local:8123' },
      { key: 'zigbeeGatewayMAC', label: 'Zigbee MAC', placeholder: '00:15:8D:00:01:23:45:67' },
      { key: 'smartCameraIDs', label: 'Camera RTSP', placeholder: 'rtsp://admin:pass@192.168.1.100' },
    ],
  },
  {
    id: 'v12',
    name: 'Metadata Purge',
    vector: 'V-12',
    description: 'EXIF GPS lat/long extraction & PDF metadata sanitization',
    icon: 'BookOpen',
    color: '#FF2E9F',
    encryptionLevel: 'High',
    gateMinFields: 1,
    gateMaxFields: 2,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'exifStripperTags', label: 'EXIF Tags', placeholder: 'GPS, camera serials, timestamp' },
      { key: 'pdfRedactionRules', label: 'PDF Redaction', placeholder: 'Strip Author, Date, Producer' },
    ],
  },
  {
    id: 'v13',
    name: 'Kernel Health',
    vector: 'V-13',
    description: 'Kernel extensions, SIP status & eBPF security probe audit',
    icon: 'Cpu',
    color: '#00D4FF',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 3,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'kernelModuleHashes', label: 'Kernel Modules', placeholder: 'sha256(vboxdrv), sha256(nvidia)' },
      { key: 'ebpfRules', label: 'eBPF Rules', placeholder: 'sys_execve monitoring, socket filter' },
      { key: 'driverCertFingerprint', label: 'Driver Cert', placeholder: 'SHA1: 4B:92:A1...' },
    ],
  },
  {
    id: 'v14',
    name: 'BIOS Integrity',
    vector: 'V-14',
    description: 'UEFI firmware hash verification against OEM baseline',
    icon: 'Scale',
    color: '#FF2E9F',
    encryptionLevel: 'High',
    gateMinFields: 1,
    gateMaxFields: 3,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'motherboardSerial', label: 'Motherboard Serial', placeholder: 'MB-992104-SYSTEM' },
      { key: 'tpmPcr0Hash', label: 'TPM PCR0', placeholder: '8f92a10b4c890d2e...', type: 'password' },
      { key: 'secureBootKey', label: 'Secure Boot Key', placeholder: 'CN=Platform Key 2026' },
    ],
  },
  {
    id: 'v15',
    name: 'Sovereign ID',
    vector: 'V-15',
    description: 'Credit bureau freeze status & SSN dark web exposure check',
    icon: 'Lock',
    color: '#06FFFF',
    encryptionLevel: 'Quantum-Resistant',
    gateMinFields: 2,
    gateMaxFields: 3,
    gateRequiredProviders: ['webauthn-passkey', 'manual-entry'],
    defaultProvider: 'webauthn-passkey',
    fieldSchema: [
      { key: 'decentralizedID', label: 'DID', placeholder: 'did:key:z6MkpTHR8VNsBxYAAAcUQ2283...' },
      { key: 'passportIDHash', label: 'Passport Hash', placeholder: 'SHA256(Passport+Salt)', type: 'password' },
      { key: 'ssnHashSeal', label: 'SSN Hash', placeholder: 'SHA256(SSN+Salt)', type: 'password' },
    ],
  },
  {
    id: 'v16',
    name: 'ShadowPurge',
    vector: 'V-16',
    description: 'Data broker profile suppression & Ghost protocol execution',
    icon: 'Trash2',
    color: '#FF7A18',
    encryptionLevel: 'Standard',
    gateMinFields: 1,
    gateMaxFields: 2,
    gateRequiredProviders: ['manual-entry'],
    defaultProvider: 'manual-entry',
    fieldSchema: [
      { key: 'unusedAppList', label: 'Unused Apps', placeholder: 'Old e-commerce, legacy social' },
      { key: 'opteryRemovalTarget', label: 'Opt-Out Targets', placeholder: 'Spokeo, Radaris' },
    ],
  },
];

/**
 * Color mapping for encryption levels
 */
export const ENCRYPTION_COLORS: Record<string, string> = {
  'Standard': '#64748B',      // Slate blue-gray
  'High': '#00D4FF',          // Deep sovereign blue
  'Quantum-Resistant': '#A855F7', // Quantum violet
};

/**
 * Get module by ID
 */
export function getModuleById(id: string): IVectorModule | undefined {
  return VECTOR_MODULES.find(m => m.id === id);
}

/**
 * Get module by vector label
 */
export function getModuleByVector(vector: string): IVectorModule | undefined {
  return VECTOR_MODULES.find(m => m.vector === vector);
}

/ */