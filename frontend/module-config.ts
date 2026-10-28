export interface ModuleConfig {
  id: string;
  name: string;
  category?: 'A' | 'B' | 'C' | 'D';
  thematicHook: string;
  splash: {
    headline: string;
    narrative: string;
    privacyPledge: string;
  };
  dataFields: {
    label: string;
    key: string;
    type: 'text' | 'select' | 'date' | 'hidden' | 'email' | 'password';
    options?: string[];
    /** Optional fields may be left blank and are excluded from the hash when empty. */
    optional?: boolean;
    /** Sensitive fields are hashed/encrypted on-device and NEVER sent to any verification API. */
    sensitive?: boolean;
    help?: string;
  }[];
}

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  /* Category A: Communications & Credential Footprint */
  communication: {
    id: 'communication',
    name: 'Communication',
    category: 'A',
    thematicHook: 'The primary node of digital contact.',
    splash: {
      headline: 'Establish Your Primary Node.',
      narrative: 'Your email is the anchor of your digital existence. By verifying your primary and secondary communication channels, you create a verifiable link between your physical identity and your digital presence.',
      privacyPledge: 'Your email is hashed (SHA-256) and encrypted on this device. Only the checks you run leave the device: breach lookup sends the email to XposedOrNot, MX lookup sends the domain to Cloudflare DNS, and the optional password check sends only the first 5 characters of its hash (k-anonymity).',
    },
    dataFields: [
      { label: 'Email Address', key: 'email', type: 'email' },
      { label: 'Provider', key: 'provider', type: 'select', options: ['Gmail', 'Outlook', 'Custom'] },
      { label: 'Usage Type', key: 'usageType', type: 'select', options: ['Work', 'Personal', 'Secure'] },
      { label: 'Password to breach-check (optional)', key: 'passwordCheck', type: 'password', optional: true, sensitive: true, help: 'Checked against Have I Been Pwned using k-anonymity: only the first 5 of 40 hash characters leave this device, and the password itself is never stored or hashed into your receipt.' },
    ],
  },
  social: {
    id: 'social',
    name: 'Social Identity',
    category: 'A',
    thematicHook: 'The public-facing persona and social graph.',
    splash: {
      headline: 'Map Your Social Graph.',
      narrative: 'Your social presence is a living record of your interactions and influence. Mapping these handles creates a verifiable "Proof of Presence" across the social web.',
      privacyPledge: 'No scraping. GitHub handles are verified against the public GitHub API. Other platforms offer no free verification API, so those entries are sealed as self-attested — the receipt says so honestly.',
    },
    dataFields: [
      { label: 'Platform', key: 'platform', type: 'select', options: ['GitHub', 'X', 'LinkedIn', 'Meta', 'TikTok'] },
      { label: 'Handle', key: 'handle', type: 'text' },
      { label: 'Profile URL', key: 'url', type: 'text', optional: true },
    ],
  },
  privacy_reclaim: {
    id: 'privacy_reclaim',
    name: 'Privacy Reclaim',
    category: 'A',
    thematicHook: 'The audit of your digital footprint in corporate databases.',
    splash: {
      headline: 'Reclaim Your Data Shadow.',
      narrative: 'Data brokers aggregate your existence into commodity dossiers. By asserting your statutory rights (CCPA §1798.105 / GDPR Art. 17), you force removal from commercial registries.',
      privacyPledge: 'No free API deletes data brokers on your behalf. This module generates a real statutory erasure letter directly on your device, sealed with a SHA-256 receipt for your legal audit trail.',
    },
    dataFields: [
      { label: 'Target Broker', key: 'broker', type: 'select', options: ['Acxiom', 'Experian Marketing', 'LexisNexis', 'LiveRamp', 'Spokeo', 'Whitepages'] },
      { label: 'Statutory Basis', key: 'statute', type: 'select', options: ['CCPA §1798.105 (California)', 'GDPR Article 17 (EU/UK)', 'General Deletion Request'] },
      { label: 'Your Full Legal Name (for the letter)', key: 'legalName', type: 'text' },
      { label: 'State / Country of Residence', key: 'jurisdiction', type: 'text' },
    ],
  },
  legal: {
    id: 'legal',
    name: 'Legal Sovereign Identity',
    category: 'A',
    thematicHook: 'The bridge between physical citizenship and digital sovereignty.',
    splash: {
      headline: 'Assert Your Legal Persona.',
      narrative: 'Your sovereign existence is anchored in legal agreements, property rights, and jurisdictional standing. Verifying these documents creates an undeniable digital chain of custody.',
      privacyPledge: 'Document numbers are never uploaded to any remote server. They are hashed and AES-256-GCM encrypted locally in your browser enclave.',
    },
    dataFields: [
      { label: 'Document Type', key: 'docType', type: 'select', options: ['Passport', 'Driver License', 'National ID', 'State ID'] },
      { label: 'Issuing Jurisdiction', key: 'jurisdiction', type: 'text' },
      { label: 'Document Number', key: 'docNumber', type: 'text', sensitive: true, help: 'Encrypted locally on-device; never transmitted.' },
      { label: 'Expiration Date', key: 'expiry', type: 'date' },
    ],
  },

  /* Category B: Social, Public & Network Surface */
  professional: {
    id: 'professional',
    name: 'Professional Identity',
    category: 'B',
    thematicHook: 'Your verifiable career footprint and licenses.',
    splash: {
      headline: 'Verify Your Professional Standing.',
      narrative: 'A verifiable history of work, certifications, and affiliations proves your competence and credibility without surrendering your employment records to third-party scrapers.',
      privacyPledge: 'Your license number is hashed and stored in your encrypted vault. Only verified credentials are cryptographically stamped into your identity audit.',
    },
    dataFields: [
      { label: 'Organization / Issuer', key: 'organization', type: 'text' },
      { label: 'Role / Title', key: 'role', type: 'text' },
      { label: 'License / Certification ID', key: 'licenseId', type: 'text', optional: true },
    ],
  },
  health: {
    id: 'health',
    name: 'Health & Medical Identity',
    category: 'B',
    thematicHook: 'Zero-knowledge records of medical authorizations.',
    splash: {
      headline: 'Shield Your Medical Privacy.',
      narrative: 'Medical records and insurance claims are deeply private identity vectors. Seal your emergency directives and health tokens without exposing sensitive diagnostic data.',
      privacyPledge: 'Strictly zero-knowledge. Health insurance policy numbers and medical directives are AES-256 encrypted on-device. No health data ever leaves your device.',
    },
    dataFields: [
      { label: 'Coverage Provider', key: 'provider', type: 'text' },
      { label: 'Policy / Member ID', key: 'policyId', type: 'text', sensitive: true },
      { label: 'Emergency Contact Phone', key: 'emergencyContact', type: 'text' },
    ],
  },
  educational: {
    id: 'educational',
    name: 'Educational Verification',
    category: 'B',
    thematicHook: 'Academic credentials and institutional proofs.',
    splash: {
      headline: 'Certify Your Education.',
      narrative: 'Anchor academic degrees, institutional affiliations, and research publications into an immutable sovereign receipt.',
      privacyPledge: 'Academic credentials are encrypted in-browser. Verified institutional domains are validated via public DNS.',
    },
    dataFields: [
      { label: 'Institution Name', key: 'institution', type: 'text' },
      { label: 'Degree / Program', key: 'degree', type: 'text' },
      { label: 'Graduation Year', key: 'year', type: 'date', optional: true },
    ],
  },
  network: {
    id: 'network',
    name: 'Network & Infrastructure',
    category: 'B',
    thematicHook: 'Auditing your IP, DNS, and hardware routing posture.',
    splash: {
      headline: 'Audit Your Network Surface.',
      narrative: 'Your IP address and DNS configurations reveal your geographic movements and ISP telemetry. Audit what your public network presence broadcasts.',
      privacyPledge: 'Public IPs are queried against ipwho.is for ASN and geolocation transparency. Private LAN addresses pass local check without network queries.',
    },
    dataFields: [
      { label: 'IP Address', key: 'ip', type: 'text' },
      { label: 'Network Adapter MAC (optional)', key: 'mac', type: 'text', optional: true },
      { label: 'DNS Provider', key: 'dns', type: 'select', options: ['Cloudflare (1.1.1.1)', 'Google (8.8.8.8)', 'Quad9 (9.9.9.9)', 'ISP Default'] },
    ],
  },

  /* Category C: Hardware, Cryptographic & Reputation */
  cryptographic: {
    id: 'cryptographic',
    name: 'Cryptographic & Wallets',
    category: 'C',
    thematicHook: 'Web3 public addresses, keypairs, and on-chain proofs.',
    splash: {
      headline: 'Anchor Your Public Cryptography.',
      narrative: 'Public blockchain keys and Web3 addresses represent self-sovereign economic agency. Verify your public keys without ever touching a private seed phrase.',
      privacyPledge: 'Public addresses only! Addresses are checked against mempool.space (BTC) or public JSON-RPC (ETH). Private keys and seed phrases are strictly rejected.',
    },
    dataFields: [
      { label: 'Network', key: 'network', type: 'select', options: ['Bitcoin Mainnet', 'Ethereum Mainnet', 'Solana', 'Polygon'] },
      { label: 'Public Address', key: 'address', type: 'text', help: 'Public address only. Never enter private keys or seed phrases.' },
    ],
  },
  biometric: {
    id: 'biometric',
    name: 'Biometric & FIDO2 Identity',
    category: 'C',
    thematicHook: 'Hardware-backed WebAuthn biometric enrollment.',
    splash: {
      headline: 'Hardware Enclave & Biometrics.',
      narrative: 'FIDO2 biometric authenticators (Touch ID, Face ID, Windows Hello) bind identity to physical hardware, eliminating phishable secrets.',
      privacyPledge: 'Biometric templates never leave your device secure enclave. Only cryptographic FIDO2 public keys are verified.',
    },
    dataFields: [
      { label: 'Authenticator Type', key: 'authenticatorType', type: 'select', options: ['Platform (TouchID/FaceID)', 'Hardware Key (YubiKey)', 'Windows Hello'] },
      { label: 'Device Platform', key: 'platform', type: 'select', options: ['macOS / iOS', 'Windows', 'Android', 'Linux'] },
    ],
  },
  reputation: {
    id: 'reputation',
    name: 'Trust & Reputation Score',
    category: 'C',
    thematicHook: 'Consolidated sovereign trust matrix across platforms.',
    splash: {
      headline: 'Consolidate Your Trust Metrics.',
      narrative: 'Compile your credit, peer trust, and platform ratings into a unified, zero-knowledge reputation score.',
      privacyPledge: 'Self-calculated on your device. Only the cryptographic score digest is sealed.',
    },
    dataFields: [
      { label: 'Reputation Source', key: 'source', type: 'text' },
      { label: 'Trust Score (0-5)', key: 'score', type: 'text' },
      { label: 'Verification Date', key: 'date', type: 'date' },
    ],
  },
  subscription: {
    id: 'subscription',
    name: 'Digital Services & Subscriptions',
    category: 'C',
    thematicHook: 'Audit active digital accounts and payment leaks.',
    splash: {
      headline: 'Audit Recurring Subscriptions.',
      narrative: 'Dormant subscription accounts leak payment metadata and personal profiles across third-party marketing brokers.',
      privacyPledge: 'Subscription entries are hashed and sealed locally to construct your statutory erasure checklist.',
    },
    dataFields: [
      { label: 'Service Provider', key: 'provider', type: 'text' },
      { label: 'Renewal Cadence', key: 'cadence', type: 'select', options: ['Monthly', 'Annual', 'Lifetime'] },
      { label: 'Masked Payment Token', key: 'paymentToken', type: 'text', optional: true },
    ],
  },

  /* Category D: Location, Behavioral & Legal Ledger */
  location: {
    id: 'location',
    name: 'Location & Geospatial Footprint',
    category: 'D',
    thematicHook: 'Audit residency, citizenship, and travel footprint.',
    splash: {
      headline: 'Audit Geospatial Disclosures.',
      narrative: 'Location trackers and mobile brokers sell real-time GPS coordinates. Verify physical residency without disclosing raw telemetry.',
      privacyPledge: 'Physical addresses resolve once via OpenStreetMap Nominatim for postal validation. Raw coordinates are never uploaded.',
    },
    dataFields: [
      { label: 'Physical Address', key: 'address', type: 'text' },
      { label: 'Citizenship', key: 'citizenship', type: 'text' },
      { label: 'Residency History', key: 'history', type: 'text', optional: true },
    ],
  },
  behavioral: {
    id: 'behavioral',
    name: 'Behavioral & Cognitive Blueprint',
    category: 'D',
    thematicHook: 'AI profiling and interest vector defenses.',
    splash: {
      headline: 'Map Your Cognitive Blueprint.',
      narrative: 'AI aggregators build behavioral profiles from browsing habits. Sovereignly declare your high-level domains to prevent synthetic profiling.',
      privacyPledge: 'Only high-level self-declared interests are sealed; raw search history or telemetry is never ingested.',
    },
    dataFields: [
      { label: 'Interest Category', key: 'category', type: 'text' },
      { label: 'Platform Monitored', key: 'platform', type: 'select', options: ['Amazon', 'Google', 'Meta', 'TikTok', 'Apple'] },
      { label: 'Data Sharing Preference', key: 'level', type: 'select', options: ['Strict Zero-Share', 'Minimal', 'Aggregated Only'] },
    ],
  },
  membership: {
    id: 'membership',
    name: 'Membership & Communities',
    category: 'D',
    thematicHook: 'Affiliations, civic groups, and communities of trust.',
    splash: {
      headline: 'Validate Your Affiliations.',
      narrative: 'Verify organizational standing in academic, professional, and civic bodies without surrendering personal directories.',
      privacyPledge: 'Membership records are encrypted on-device. Verification hashes confirm standing without leaking directory entries.',
    },
    dataFields: [
      { label: 'Organization Name', key: 'org', type: 'text' },
      { label: 'Role / Designation', key: 'role', type: 'select', options: ['Member', 'Board', 'Fellow', 'Alumnus'] },
      { label: 'Member ID (optional)', key: 'memberId', type: 'text', optional: true },
    ],
  },
  permissions: {
    id: 'permissions',
    name: 'Privacy Permissions & Access Ledger',
    category: 'D',
    thematicHook: 'The master zero-trust switch for your digital identity.',
    splash: {
      headline: 'Command Your Sovereign Access.',
      narrative: 'Sovereignty is the power to say "No." This module is the master cryptographic ledger of who has access to your vectors, for how long, and for what purpose.',
      privacyPledge: 'This is the master enclave module. It manages cryptographic seals and statutory audit checkpoints.',
    },
    dataFields: [
      { label: 'Authorized Entity', key: 'entity', type: 'text' },
      { label: 'Access Level', key: 'access', type: 'select', options: ['Read-Only Receipt', 'Zero-Knowledge Proof Only', 'Revoked'] },
      { label: 'Expiry Date', key: 'expiry', type: 'date' },
    ],
  },
};
