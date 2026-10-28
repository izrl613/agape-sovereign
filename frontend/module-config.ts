export interface ModuleConfig {
  id: string;
  name: string;
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
  communication: {
    id: 'communication',
    name: 'Communication',
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
    thematicHook: 'The audit of your digital footprint in corporate databases.',
    splash: {
      headline: 'Reclaim Your Data Shadow.',
      narrative: 'Your financial and personal data is scattered across a thousand corporate ledgers. This module audits your connections to these institutions, preparing you to reclaim ownership of your "data shadow."',
      privacyPledge: 'No aggregator has access to your accounts. This agent generates a real CCPA/GDPR erasure-request letter on this device for you to send; only the sealed hash of your entry is stored.',
    },
    dataFields: [
      { label: 'Institution Name', key: 'institution', type: 'text' },
      { label: 'Account Type', key: 'accountType', type: 'select', options: ['Checking', 'Savings', 'Credit'] },
      { label: 'Jurisdiction', key: 'jurisdiction', type: 'select', options: ['CCPA/CPRA (California)', 'GDPR Art. 17 (EU/EEA)', 'Other'] },
    ],
  },
  legal: {
    id: 'legal',
    name: 'Government/Legal Identity',
    thematicHook: 'The official state-recognized anchor.',
    splash: {
      headline: 'Anchor to the Physical Realm.',
      narrative: 'Sovereignty begins with the ability to prove your legal existence. By linking your government-issued identity, you bridge the gap between the state\'s ledger and your digital fortress.',
      privacyPledge: 'Your document number NEVER leaves this device. It is SHA-256 hashed and AES-encrypted locally; the agent only checks its format on-device. No government database is queried — none offers a free public API.',
    },
    dataFields: [
      { label: 'ID Type', key: 'idType', type: 'select', options: ['Passport', 'Driver License', 'National ID'] },
      { label: 'Issuing Country', key: 'country', type: 'text' },
      { label: 'Document Number', key: 'docNumber', type: 'password', sensitive: true, help: 'Hashed on-device only. Never transmitted, never stored in plaintext.' },
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional Identity',
    thematicHook: 'The record of expertise and contribution.',
    splash: {
      headline: 'Validate Your Expertise.',
      narrative: 'Your professional trajectory—degrees, certifications, and roles—is a testament to your skill. Transforming these into verifiable vectors turns a resume into a "Proof of Competence."',
      privacyPledge: 'Verification is handled via professional registries; no private employment contracts are stored.',
    },
    dataFields: [
      { label: 'Job Title', key: 'jobTitle', type: 'text' },
      { label: 'Company', key: 'company', type: 'text' },
      { label: 'Certification ID', key: 'certId', type: 'text', optional: true },
      { label: 'License Number', key: 'licenseNum', type: 'password', sensitive: true, optional: true, help: 'Hashed on-device only.' },
    ],
  },
  health: {
    id: 'health',
    name: 'Health Identity',
    thematicHook: 'The biological blueprint.',
    splash: {
      headline: 'Own Your Biological Ledger.',
      narrative: 'Your health data is the most intimate information you possess. By sovereignly managing your health records, you ensure that you—and only you—control who sees your biological blueprint.',
      privacyPledge: 'Health identifiers NEVER leave this device. There is no free public API that can verify a health record, so this entry is sealed as self-attested with on-device encryption only.',
    },
    dataFields: [
      { label: 'Provider', key: 'provider', type: 'text' },
      { label: 'Record Type', key: 'recordType', type: 'select', options: ['Immunization', 'General', 'Specialist'] },
      { label: 'Insurance Policy ID', key: 'policyId', type: 'password', sensitive: true, help: 'Hashed on-device only. Never transmitted.' },
    ],
  },
  educational: {
    id: 'educational',
    name: 'Educational Identity',
    thematicHook: 'The intellectual lineage.',
    splash: {
      headline: 'Codify Your Intellectual Lineage.',
      narrative: 'Education is a lifelong journey of expansion. By verifying your academic achievements, you create an immutable record of your intellectual growth and institutional affiliations.',
      privacyPledge: 'Direct verification with clearinghouses; no full transcripts are stored unless requested.',
    },
    dataFields: [
      { label: 'Institution', key: 'institution', type: 'text' },
      { label: 'Degree', key: 'degree', type: 'text' },
      { label: 'Graduation Year', key: 'year', type: 'date' },
      { label: 'Student ID', key: 'studentId', type: 'password', sensitive: true, optional: true, help: 'Hashed on-device only.' },
    ],
  },
  network: {
    id: 'network',
    name: 'Network Identity',
    thematicHook: 'The digital footprint of your hardware.',
    splash: {
      headline: 'Map Your Hardware Signature.',
      narrative: 'Every device you use leaves a network trail. By claiming your IP and MAC addresses, you turn a trackable footprint into a controlled network identity.',
      privacyPledge: 'The IP you enter is looked up for real against ipwho.is (free IP intelligence). MAC/UUID cannot be verified by any remote API and are sealed as self-attested.',
    },
    dataFields: [
      { label: 'IP Address', key: 'ip', type: 'text' },
      { label: 'MAC Address', key: 'mac', type: 'text', optional: true },
      { label: 'Device UUID', key: 'uuid', type: 'text', optional: true },
    ],
  },
  cryptographic: {
    id: 'cryptographic',
    name: 'Cryptographic Identity',
    thematicHook: 'The mathematical proof of ownership.',
    splash: {
      headline: 'Claim Your Cryptographic Keys.',
      narrative: 'In the new world, mathematics is the only truth. Your wallets and public keys are the ultimate proof of ownership and autonomy.',
      privacyPledge: 'Public addresses only — never enter a private key or seed phrase anywhere. BTC is verified against mempool.space and ETH via a public JSON-RPC node; both are free and keyless.',
    },
    dataFields: [
      { label: 'Wallet Address', key: 'address', type: 'text' },
      { label: 'ENS Name', key: 'ens', type: 'text', optional: true },
      { label: 'Public Key', key: 'publicKey', type: 'text', optional: true },
    ],
  },
  biometric: {
    id: 'biometric',
    name: 'Biometric Identity',
    thematicHook: 'The unique biological signature.',
    splash: {
      headline: 'Secure Your Biological Key.',
      narrative: 'Your body is the only key that cannot be stolen or duplicated. By linking your biometric hashes, you create an unforgeable link between your physical self and your digital identity.',
      privacyPledge: 'Raw biometrics cannot be read by a web app — by design. This agent verifies the real capability that matters: whether this device has a user-verifying platform authenticator (Face ID / Touch ID / Windows Hello) via the WebAuthn API.',
    },
    dataFields: [
      { label: 'Biometric Type', key: 'type', type: 'select', options: ['Face', 'Fingerprint', 'Iris'] },
      { label: 'Template Hash (optional, if an external enclave issued one)', key: 'hash', type: 'text', optional: true },
    ],
  },
  reputation: {
    id: 'reputation',
    name: 'Reputation Identity',
    thematicHook: 'The aggregate of trust and reliability.',
    splash: {
      headline: 'Quantify Your Digital Trust.',
      narrative: 'Trust is the currency of the network. By aggregating your reputation across platforms, you transform scattered reviews into a unified "Trust Score."',
      privacyPledge: 'Only the aggregate score and verified platform links are stored.',
    },
    dataFields: [
      { label: 'Platform', key: 'platform', type: 'select', options: ['Uber', 'Airbnb', 'Yelp', 'Google'] },
      { label: 'Trust Score', key: 'score', type: 'text' },
      { label: 'Review Count', key: 'count', type: 'text', optional: true },
    ],
  },
  subscription: {
    id: 'subscription',
    name: 'Subscription Identity',
    thematicHook: 'The record of chosen services and commitments.',
    splash: {
      headline: 'Audit Your Digital Commitments.',
      narrative: 'Your subscriptions are a map of your tools and preferences. By verifying these commitments, you create a proof of service and financial regularity.',
      privacyPledge: 'Only the service name and tier are verified; no credit card numbers are stored.',
    },
    dataFields: [
      { label: 'Service Name', key: 'service', type: 'text' },
      { label: 'Tier', key: 'tier', type: 'select', options: ['Free', 'Pro', 'Enterprise'] },
      { label: 'Billing ID', key: 'billingId', type: 'password', sensitive: true, optional: true, help: 'Hashed on-device only. Never enter a card number.' },
    ],
  },
  location: {
    id: 'location',
    name: 'Location Identity',
    thematicHook: 'The physical geography of your existence.',
    splash: {
      headline: 'Verify Your Physical Presence.',
      narrative: 'Identity is not just who you are, but where you are. By verifying your residency and citizenship, you anchor your digital identity to a physical jurisdiction.',
      privacyPledge: 'With your consent, the address text is geocoded once against OpenStreetMap Nominatim (free) to confirm it resolves to a real place. Only the hash and the matched place type are kept; do not enter an address you are not comfortable geocoding.',
    },
    dataFields: [
      { label: 'Physical Address', key: 'address', type: 'text' },
      { label: 'Citizenship', key: 'citizenship', type: 'text' },
      { label: 'Residency History', key: 'history', type: 'text', optional: true },
    ],
  },
  behavioral: {
    id: 'behavioral',
    name: 'Interests/Behavioral Identity',
    thematicHook: 'The psychological and intellectual fingerprint.',
    splash: {
      headline: 'Map Your Cognitive Blueprint.',
      narrative: 'Your interests and behaviors are the most honest reflection of who you are. By sovereignly claiming your behavioral data, you stop being a product and start being a partner.',
      privacyPledge: 'We only verify high-level categories; no individual search queries are stored.',
    },
    dataFields: [
      { label: 'Interest Category', key: 'category', type: 'text' },
      { label: 'Platform', key: 'platform', type: 'select', options: ['Amazon', 'Google', 'Meta'] },
      { label: 'Preference Level', key: 'level', type: 'text' },
    ],
  },
  membership: {
    id: 'membership',
    name: 'Membership Identity',
    thematicHook: 'The circles of trust and affiliation.',
    splash: {
      headline: 'Validate Your Affiliations.',
      narrative: 'We are defined by the communities we belong to. By verifying your memberships in professional, academic, or civic organizations, you prove your standing within these circles.',
      privacyPledge: 'Only the membership status and role are verified.',
    },
    dataFields: [
      { label: 'Organization Name', key: 'org', type: 'text' },
      { label: 'Role', key: 'role', type: 'select', options: ['Member', 'Board', 'Fellow'] },
      { label: 'Member ID', key: 'memberId', type: 'text', optional: true },
    ],
  },
  permissions: {
    id: 'permissions',
    name: 'Privacy Permissions',
    thematicHook: 'The master switch for your identity.',
    splash: {
      headline: 'Command Your Access.',
      narrative: 'Sovereignty is the power to say "No." This module is the master ledger of who has access to your identity vectors, for how long, and for what purpose.',
      privacyPledge: 'This is the most secure module. It manages the keys to all other vectors.',
    },
    dataFields: [
      { label: 'Entity', key: 'entity', type: 'text' },
      { label: 'Access Level', key: 'access', type: 'select', options: ['Read', 'Write', 'Full'] },
      { label: 'Expiry Date', key: 'expiry', type: 'date' },
    ],
  },
};
