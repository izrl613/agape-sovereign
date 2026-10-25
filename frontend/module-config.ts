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
    type: 'text' | 'select' | 'date' | 'hidden';
    options?: string[];
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
      privacyPledge: 'Emails are verified via OAuth2; only the verification status and encrypted identifiers are passed to the Architect AI.',
    },
    dataFields: [
      { label: 'Email Address', key: 'email', type: 'text' },
      { label: 'Provider', key: 'provider', type: 'select', options: ['Gmail', 'Outlook', 'Custom'] },
      { label: 'Usage Type', key: 'usageType', type: 'select', options: ['Work', 'Personal', 'Secure'] },
    ],
  },
  social: {
    id: 'social',
    name: 'Social Identity',
    thematicHook: 'The public-facing persona and social graph.',
    splash: {
      headline: 'Map Your Social Graph.',
      narrative: 'Your social presence is a living record of your interactions and influence. Mapping these handles creates a verifiable "Proof of Presence" across the social web.',
      privacyPledge: 'We do not scrape your posts. We only verify the ownership of the handle via API.',
    },
    dataFields: [
      { label: 'Platform', key: 'platform', type: 'select', options: ['X', 'LinkedIn', 'Meta', 'TikTok'] },
      { label: 'Handle', key: 'handle', type: 'text' },
      { label: 'Profile URL', key: 'url', type: 'text' },
    ],
  },
  privacy_reclaim: {
    id: 'privacy_reclaim',
    name: 'Privacy Reclaim',
    thematicHook: 'The audit of your digital footprint in corporate databases.',
    splash: {
      headline: 'Reclaim Your Data Shadow.',
      narrative: 'Your financial and personal data is scattered across a thousand corporate ledgers. This module audits your connections to these institutions, preparing you to reclaim ownership of your "data shadow."',
      privacyPledge: 'Read-only access via secure financial aggregators. No credentials are stored.',
    },
    dataFields: [
      { label: 'Institution Name', key: 'institution', type: 'text' },
      { label: 'Account Type', key: 'accountType', type: 'select', options: ['Checking', 'Savings', 'Credit'] },
      { label: 'Connection Status', key: 'status', type: 'hidden' },
    ],
  },
  legal: {
    id: 'legal',
    name: 'Government/Legal Identity',
    thematicHook: 'The official state-recognized anchor.',
    splash: {
      headline: 'Anchor to the Physical Realm.',
      narrative: 'Sovereignty begins with the ability to prove your legal existence. By linking your government-issued identity, you bridge the gap between the state\'s ledger and your digital fortress.',
      privacyPledge: 'ID documents are processed in a secure enclave; only a "Verified Legal" token is stored.',
    },
    dataFields: [
      { label: 'ID Type', key: 'idType', type: 'select', options: ['Passport', 'Driver License', 'National ID'] },
      { label: 'Issuing Country', key: 'country', type: 'text' },
      { label: 'Document Number', key: 'docNumber', type: 'text' },
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
      { label: 'Certification ID', key: 'certId', type: 'text' },
      { label: 'License Number', key: 'licenseNum', type: 'text' },
    ],
  },
  health: {
    id: 'health',
    name: 'Health Identity',
    thematicHook: 'The biological blueprint.',
    splash: {
      headline: 'Own Your Biological Ledger.',
      narrative: 'Your health data is the most intimate information you possess. By sovereignly managing your health records, you ensure that you—and only you—control who sees your biological blueprint.',
      privacyPledge: 'Zero-knowledge encryption. Data is verified via FHIR standards and never leaves your control.',
    },
    dataFields: [
      { label: 'Provider', key: 'provider', type: 'text' },
      { label: 'Record Type', key: 'recordType', type: 'select', options: ['Immunization', 'General', 'Specialist'] },
      { label: 'Insurance Policy ID', key: 'policyId', type: 'text' },
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
      { label: 'Student ID', key: 'studentId', type: 'text' },
    ],
  },
  network: {
    id: 'network',
    name: 'Network Identity',
    thematicHook: 'The digital footprint of your hardware.',
    splash: {
      headline: 'Map Your Hardware Signature.',
      narrative: 'Every device you use leaves a network trail. By claiming your IP and MAC addresses, you turn a trackable footprint into a controlled network identity.',
      privacyPledge: 'We store the hash of your hardware IDs, not the raw addresses.',
    },
    dataFields: [
      { label: 'IP Address', key: 'ip', type: 'text' },
      { label: 'MAC Address', key: 'mac', type: 'text' },
      { label: 'Device UUID', key: 'uuid', type: 'text' },
    ],
  },
  cryptographic: {
    id: 'cryptographic',
    name: 'Cryptographic Identity',
    thematicHook: 'The mathematical proof of ownership.',
    splash: {
      headline: 'Claim Your Cryptographic Keys.',
      narrative: 'In the new world, mathematics is the only truth. Your wallets and public keys are the ultimate proof of ownership and autonomy.',
      privacyPledge: 'We only verify ownership of the public key; your private keys never leave your wallet.',
    },
    dataFields: [
      { label: 'Wallet Address', key: 'address', type: 'text' },
      { label: 'ENS Name', key: 'ens', type: 'text' },
      { label: 'Public Key', key: 'publicKey', type: 'text' },
    ],
  },
  biometric: {
    id: 'biometric',
    name: 'Biometric Identity',
    thematicHook: 'The unique biological signature.',
    splash: {
      headline: 'Secure Your Biological Key.',
      narrative: 'Your body is the only key that cannot be stolen or duplicated. By linking your biometric hashes, you create an unforgeable link between your physical self and your digital identity.',
      privacyPledge: 'We store only the one-way hash of the biometric template. We never store raw biometric images.',
    },
    dataFields: [
      { label: 'Biometric Type', key: 'type', type: 'select', options: ['Face', 'Fingerprint', 'Iris'] },
      { label: 'Template Hash', key: 'hash', type: 'text' },
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
      { label: 'Review Count', key: 'count', type: 'text' },
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
      { label: 'Billing ID', key: 'billingId', type: 'text' },
    ],
  },
  location: {
    id: 'location',
    name: 'Location Identity',
    thematicHook: 'The physical geography of your existence.',
    splash: {
      headline: 'Verify Your Physical Presence.',
      narrative: 'Identity is not just who you are, but where you are. By verifying your residency and citizenship, you anchor your digital identity to a physical jurisdiction.',
      privacyPledge: 'Addresses are hashed; only the jurisdiction and residency status are verified.',
    },
    dataFields: [
      { label: 'Physical Address', key: 'address', type: 'text' },
      { label: 'Citizenship', key: 'citizenship', type: 'text' },
      { label: 'Residency History', key: 'history', type: 'text' },
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
      { label: 'Member ID', key: 'memberId', type: 'text' },
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
