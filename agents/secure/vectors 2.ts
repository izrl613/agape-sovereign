/**
 * ============================================================
 * Agape Sovereign — Canonical 16 Identity Vectors
 * ============================================================
 *
 * Single source of truth for the DIFF identity vectors used by the
 * secure orchestrator, plugins, and the automation MCP server.
 *
 * Categories follow the DIFF Vector Specialist mandate:
 *   Communications · Social/Deep Web · Hardware/Network · Financial/Legal
 *
 * Weights are normalized at scoring time, so the table need not sum
 * to exactly 1.0 (it is kept close to the product spec).
 */

export const VECTOR_CATEGORIES = [
  'Communications',
  'Social/Deep Web',
  'Hardware/Network',
  'Financial/Legal',
] as const;

export type VectorCategory = (typeof VECTOR_CATEGORIES)[number];

export interface VectorDef {
  /** Stable module identifier used across the app. */
  moduleId: string;
  /** Human-facing vector label (V-01 … V-16). */
  vector: string;
  label: string;
  category: VectorCategory;
  /** Relative weight for the Sovereign Score (normalized at runtime). */
  weight: number;
  description: string;
  /** Logical source(s) a real probe would integrate with. */
  sources: readonly string[];
}

export const IDENTITY_VECTORS: readonly VectorDef[] = [
  {
    moduleId: 'email-scanner',
    vector: 'V-01',
    label: 'Email Breach Scanner',
    category: 'Communications',
    weight: 0.08,
    description: 'Breach detection, credential reuse, and alias hygiene.',
    sources: ['HIBP', 'Dehashed', 'XposedOrNot'],
  },
  {
    moduleId: 'social-map',
    vector: 'V-02',
    label: 'Social Media Footprint',
    category: 'Social/Deep Web',
    weight: 0.06,
    description: 'Username reuse, profile scraping, and OAuth scope audit.',
    sources: ['OSINT', 'Meta Graph', 'X API'],
  },
  {
    moduleId: 'device-health',
    vector: 'V-03',
    label: 'Device File Scan',
    category: 'Hardware/Network',
    weight: 0.06,
    description: 'Local and cloud file PII pattern analysis.',
    sources: ['Local Storage'],
  },
  {
    moduleId: 'system-security',
    vector: 'V-04',
    label: 'Mobile Security Layer',
    category: 'Hardware/Network',
    weight: 0.08,
    description: 'Passkey enforcement, disk encryption, and 2FA status.',
    sources: ['WebAuthn', 'FileVault', 'BitLocker'],
  },
  {
    moduleId: 'deep-web',
    vector: 'V-05',
    label: 'Deep Web Exposure',
    category: 'Social/Deep Web',
    weight: 0.08,
    description: 'Dark web credential index monitoring.',
    sources: ['Tor indices', 'Telegram leak channels'],
  },
  {
    moduleId: 'broker-removal',
    vector: 'V-06',
    label: 'Data Broker Removal',
    category: 'Financial/Legal',
    weight: 0.08,
    description: 'Data broker listings and ECRA opt-out generation.',
    sources: ['Optery', 'Spokeo', 'Whitepages'],
  },
  {
    moduleId: 'network-vector',
    vector: 'V-07',
    label: 'Network Vector',
    category: 'Hardware/Network',
    weight: 0.06,
    description: 'WebRTC and DNS-over-HTTPS leak probing.',
    sources: ['STUN', 'DoH'],
  },
  {
    moduleId: 'cloud-enclave',
    vector: 'V-08',
    label: 'Cloud Storage Exposure',
    category: 'Hardware/Network',
    weight: 0.06,
    description: 'Cloud file share and permission audit.',
    sources: ['Google Drive', 'Dropbox', 'iCloud'],
  },
  {
    moduleId: 'biometrics',
    vector: 'V-09',
    label: 'Voice & Biometric Data',
    category: 'Hardware/Network',
    weight: 0.05,
    description: 'Facial recognition and biometric dataset exposure.',
    sources: ['PimEyes', 'Secure Enclave'],
  },
  {
    moduleId: 'crypto-assets',
    vector: 'V-10',
    label: 'Financial Identity Exposure',
    category: 'Financial/Legal',
    weight: 0.05,
    description: 'On-chain wallet and smart-contract allowance audit.',
    sources: ['Etherscan', 'Revoke.cash'],
  },
  {
    moduleId: 'smart-home',
    vector: 'V-11',
    label: 'IoT & Smart Device Scan',
    category: 'Hardware/Network',
    weight: 0.05,
    description: 'IoT discovery and device security audit.',
    sources: ['mDNS', 'UPnP'],
  },
  {
    moduleId: 'metadata-purge',
    vector: 'V-12',
    label: 'Metadata Purge',
    category: 'Communications',
    weight: 0.05,
    description: 'EXIF GPS and document metadata sanitization.',
    sources: ['ExifTool'],
  },
  {
    moduleId: 'kernel-health',
    vector: 'V-13',
    label: 'Kernel Health',
    category: 'Hardware/Network',
    weight: 0.05,
    description: 'Kernel extensions and System Integrity Protection.',
    sources: ['OS Kernel'],
  },
  {
    moduleId: 'bios-integrity',
    vector: 'V-14',
    label: 'BIOS Integrity',
    category: 'Hardware/Network',
    weight: 0.05,
    description: 'UEFI firmware hash and Secure Boot verification.',
    sources: ['SPI Flash', 'Secure Boot'],
  },
  {
    moduleId: 'sovereign-id',
    vector: 'V-15',
    label: 'Sovereign ID',
    category: 'Financial/Legal',
    weight: 0.06,
    description: 'Credit bureau freeze and SSN dark web exposure.',
    sources: ['Equifax', 'Experian', 'TransUnion'],
  },
  {
    moduleId: 'shadow-purge',
    vector: 'V-16',
    label: 'Behavioral Profile Analysis',
    category: 'Social/Deep Web',
    weight: 0.06,
    description: 'Data broker profile suppression and re-scrape watch.',
    sources: ['Optery', 'Data Brokers'],
  },
] as const;

/** Look up a vector definition by module id or vector label. */
export function findVector(key: string): VectorDef | undefined {
  return IDENTITY_VECTORS.find((v) => v.moduleId === key || v.vector === key);
}

/**
 * Enforce registry integrity. Throws if the registry is not exactly the
 * canonical 16 vectors with unique ids, labels, and positive weights.
 */
export function assertCompleteRegistry(): void {
  if (IDENTITY_VECTORS.length !== 16) {
    throw new Error(`Vector registry must contain exactly 16 vectors (found ${IDENTITY_VECTORS.length}).`);
  }
  const moduleIds = new Set<string>();
  const labels = new Set<string>();
  for (const def of IDENTITY_VECTORS) {
    if (moduleIds.has(def.moduleId)) {
      throw new Error(`Duplicate moduleId in vector registry: ${def.moduleId}`);
    }
    if (labels.has(def.vector)) {
      throw new Error(`Duplicate vector label in vector registry: ${def.vector}`);
    }
    if (!(def.weight > 0) || !Number.isFinite(def.weight)) {
      throw new Error(`Vector ${def.vector} has an invalid weight: ${def.weight}`);
    }
    moduleIds.add(def.moduleId);
    labels.add(def.vector);
  }
  for (const category of VECTOR_CATEGORIES) {
    if (!IDENTITY_VECTORS.some((v) => v.category === category)) {
      throw new Error(`Vector registry is missing category: ${category}`);
    }
  }
}
