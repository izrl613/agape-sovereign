export interface ModuleConfig {
  id: string;
  name: string;
  category: 'A' | 'B' | 'C' | 'D';
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

/**
 * 16-Layer DIFF Engine — Identity Vector Breakdown aligned with Architect AI Architecture v2026.
 * Category A: Communications & Credential Footprint (1-4)
 * Category B: Social, Public & Deep Web Surface (5-8)
 * Category C: Hardware, Local Files & Network Posture (9-12)
 * Category D: Financial, Biometric & Legal Sovereignty (13-16)
 */
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
    /* 2. Phone, VoIP & SIM-Swap Vector */
    simSwap: {
      id: 'simSwap',
      name: 'SIM-Swap Vector',
      category: 'A',
      thematicHook: 'Carrier port-out protection and VoIP security.',
      splash: {
        headline: 'Protect Your Phone Number.',
        narrative: 'Your mobile number is a critical identity vector. Unauthorized SIM-swap or VoIP forwarding can hijack your 2FA codes and intercept your communications.',
        privacyPledge: 'Your phone carrier PIN and VoIP forwarding status are verified on-device. Carrier telecom APIs confirm port-out PIN lock status. No carrier data is uploaded.',
      },
      dataFields: [
        { label: 'Carrier', key: 'carrier', type: 'select', options: ['Verizon', 'AT&T', 'T-Mobile', 'Ting', 'Other'] },
        { label: 'Port-Out PIN Status', key: 'pinStatus', type: 'select', options: ['Enabled', 'Disabled', 'Unknown'] },
        { label: 'VoIP Forwarding Active', key: 'voipForwarding', type: 'select', options: ['None', 'Enabled', 'Unknown'] },
      ],
    },
    /* 3. Credential & Password Entropy Vault */
    passwordVault: {
      id: 'passwordVault',
      name: 'Credential Entropy Vault',
      category: 'A',
      thematicHook: 'The mathematical proof of password security.',
      splash: {
        headline: 'Harden Your Credentials.',
        narrative: 'Password reuse and weak tokens are the most common entry point for identity theft. This module evaluates your password posture and flags exposures.',
        privacyPledge: 'Passwords are never transmitted or stored. Only the SHA-256 hash (first 5 characters sent to HIBP via k-anonymity) is used for breach lookup. Your actual password never leaves this device.',
      },
      dataFields: [
        { label: 'Password to audit (optional)', key: 'passwordAudit', type: 'password', optional: true, sensitive: true, help: 'Hashed on-device only; first 5 hash chars may be sent to HIBP for k-anonymity lookup.' },
      ],
    },
    /* 4. Universal Passkey & WebAuthn Registry */
    passkeyRegistry: {
      id: 'passkeyRegistry',
      name: 'Passkey & WebAuthn Registry',
      category: 'A',
      thematicHook: 'Cryptographic proof of ownership — FIDO2/WebAuthn.',
      splash: {
        headline: 'Claim Your Cryptographic Keys.',
        narrative: 'Your body is the only key that cannot be stolen or duplicated. By linking your biometric hashes, you create an unforgeable link between your physical self and your digital identity.',
        privacyPledge: 'Raw biometrics cannot be read by a web app — by design. This agent verifies the real capability that matters: whether this device has a user-verifying platform authenticator via the WebAuthn API.',
      },
      dataFields: [
        { label: 'Biometric Type', key: 'type', type: 'select', options: ['Face', 'Fingerprint', 'Iris'] },
        { label: 'Passkey Registered', key: 'passkeyRegistered', type: 'select', options: ['Yes', 'No', 'Hardware Key'] },
      ],
    },

    /* Category B: Social, Public & Deep Web Surface */
    /* 5. Social Media Posts & Account Scanner */
    social: {
      id: 'social',
      name: 'Social Identity',
      category: 'B',
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
    /* 6. Data Broker Exposure & Removal Engine */
    dataBroker: {
      id: 'dataBroker',
      name: 'Data Broker Exposure',
      category: 'B',
      thematicHook: 'The audit of your data shadow in corporate databases.',
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
    /* 7. Deep Web & Darknet Index Monitor */
    deepWeb: {
      id: 'deepWeb',
      name: 'Deep Web Monitor',
      category: 'B',
      thematicHook: 'Real-time surveillance of leaked identity attributes.',
      splash: {
        headline: 'Monitor the Deep Web.',
        narrative: 'Your identity attributes may appear on darknet forums, paste sites, or illicit Telegram channels. This module executes real-time surveillance across known .onion domains and public index caches.',
        privacyPledge: 'The module queries verified dark web indexing APIs in real time. No raw PII is transmitted; only structural anonymity data and SHA-256 hashes are checked against known leak corpuses.',
      },
      dataFields: [
        { label: 'Monitor Email Aliases', key: 'emailAliases', type: 'text' },
        { label: 'Monitored Domains', key: 'domains', type: 'text', optional: true },
      ],
    },
    /* 8. Search Engine & Public Record De-Indexing */
    deIndexing: {
      id: 'deIndexing',
      name: 'De-Indexing & Public Records',
      category: 'B',
      thematicHook: 'Initiating one-click de-indexing workflows.',
      splash: {
        headline: 'Request De-Indexing.',
        narrative: 'Search engines do not instantly drop indexed pages. This module initiates one-click de-indexing workflows for real estate property records, court filings, and legacy search engine caches.',
        privacyPledge: 'After submitting a de-indexing request, the engine queries the search provider’s public index every 30 days until it mathematically verifies a 404 Not Found or a sanitized cache result.',
      },
      dataFields: [
        { label: 'Record Type', key: 'recordType', type: 'select', options: ['Property Record', 'Court Filing', 'Legacy Cache'] },
        { label: 'Target Search Engine', key: 'searchEngine', type: 'select', options: ['Google', 'Bing', 'DuckDuckGo'] },
      ],
    },

    /* Category C: Hardware, Local Files & Network Posture */
    /* 9. Local Computer & Laptop File Scanner */
    localFileScanner: {
      id: 'localFileScanner',
      name: 'Local File Scanner',
      category: 'C',
      thematicHook: 'Offline scan for unencrypted PII on local hardware.',
      splash: {
        headline: 'Scan Local Hardware.',
        narrative: 'Utilizes the browser\'s native File System Access API to scan local directories for unencrypted tax documents, plaintext seed phrases, or PII—executing this entirely offline without uploading files.',
        privacyPledge: 'Because local files change constantly, this module operates on an on-demand user-initiated loop. Users are prompted weekly to authorize a local directory sweep. A KNOXED rating relies on the scanner finding zero unencrypted high-risk documents in the selected local pathways.',
      },
      dataFields: [
        { label: 'Directory Path', key: 'directoryPath', type: 'text' },
        { label: 'Scan Depth', key: 'scanDepth', type: 'select', options: ['Shallow', 'Deep'] },
      ],
    },
    /* 10. Mobile Device Posture & Telemetry Audit */
    mobilePosture: {
      id: 'mobilePosture',
      name: 'Mobile Device Posture',
      category: 'C',
      thematicHook: 'OS patch levels, biometric status, and permission audit.',
      splash: {
        headline: 'Audit Your Mobile Posture.',
        narrative: 'Audits mobile OS patch levels, biometric status, and malicious application permission creep. Whenever Architect AI is accessed via a mobile client, it queries the device\'s user-agent and OS telemetry.',
        privacyPledge: 'This module enforces a boot-time and session-initiation verification loop. Whenever Architect AI is accessed via a mobile client, it queries the device\'s user-agent and OS telemetry. If the OS version falls behind known zero-day patch levels, the device is immediately flagged as NUKED.',
      },
      dataFields: [
        { label: 'Device OS', key: 'os', type: 'text' },
        { label: 'OS Patch Level', key: 'patchLevel', type: 'text' },
      ],
    },
    /* 11. Cloud Drive & Federated Storage Scanner */
    cloudStorage: {
      id: 'cloudStorage',
      name: 'Cloud Drive Storage',
      category: 'C',
      thematicHook: 'Audit Google Drive and iCloud for publicly exposed shares.',
      splash: {
        headline: 'Audit Cloud Storage.',
        narrative: 'Audits Google Drive and Apple iCloud metadata to identify publicly exposed share links and unencrypted document vaults. Cloud access permissions frequently suffer from "privilege creep."',
        privacyPledge: 'Cloud access permissions frequently suffer from "privilege creep." Therefore, this module requires a 30-to-90 day recurring access review loop. The engine audits the metadata of shared links. Any link older than 90 days without an active expiration date is flagged as NUKED until the user explicitly re-authorizes or revokes it.',
      },
      dataFields: [
        { label: 'Storage Provider', key: 'provider', type: 'select', options: ['Google Drive', 'iCloud', 'OneDrive'] },
        { label: 'Shared Link Age (days)', key: 'sharedLinkAge', type: 'number', minimum: 0 },
      ],
    },
    /* 12. Network, DNS, IP & Geolocation Footprint */
    network: {
      id: 'network',
      name: 'Network Identity',
      category: 'C',
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

    /* Category D: Financial, Biometric & Legal Sovereignty */
    /* 13. Financial, Credit & Crypto Identity Vector */
    financial: {
      id: 'financial',
      name: 'Financial & Credit',
      category: 'D',
      thematicHook: 'Monitor credit freezes, virtual cards, and blockchain exposure.',
      splash: {
        headline: 'Protect Your Financial Sovereignty.',
        narrative: 'Monitors the freeze statuses of major credit bureaus (Equifax, Experian, TransUnion), audits virtual card usage, and scans for public blockchain wallet associations. A credit freeze is critical to halt identity thieves from opening unauthorized lines of credit.',
        privacyPledge: 'The module performs a monthly bureau freeze status verification loop. Users are instructed to maintain the freeze continuously, lifting it only 3 to 5 business days before actively applying for a lease or loan. The module flags the vector as NUKED if a freeze is detected as lifted without a scheduled re-freeze date.',
      },
      dataFields: [
        { label: 'Credit Freeze Status', key: 'creditFreeze', type: 'select', options: ['Frozen', 'Thawed', 'Unknown'] },
        { label: 'Virtual Card Active', key: 'virtualCard', type: 'select', options: ['Yes', 'No', 'Unknown'] },
        { label: 'Wallet Address', key: 'walletAddress', type: 'text', help: 'BTC verified against mempool.space; ETH via public JSON-RPC. Never enter private keys.' },
      ],
    },
    /* 14. Biometric, Voice & AI-Clone Defense */
    biometricDefense: {
      id: 'biometricDefense',
      name: 'Biometric & AI-Clone Defense',
      category: 'D',
      thematicHook: 'Defend against voice/facial training data exposure.',
      splash: {
        headline: 'Defend Against AI Cloning.',
        narrative: 'Monitors for illicit voice or facial training data exposure, automates AI opt-out registries, and applies digital watermarks to personal media to defend against deepfake synthesis. To combat the rapid ingestion of media by AI scraping bots, this module relies on a quarterly AI-training footprint scan.',
        privacyPledge: 'To combat the rapid ingestion of media by AI scraping bots, this module relies on a quarterly AI-training footprint scan. It queries public datasets (like LAION) for matches to the user\'s watermarked media. KNOXED status requires affirmative opt-out receipts from major generative AI platform registries.',
      },
      dataFields: [
        { label: 'Watermarked Media Hash', key: 'mediaHash', type: 'text', optional: true },
        { label: 'AI Opt-Out Status', key: 'aiOptOut', type: 'select', options: ['Opted Out', 'Not Opted Out', 'Unknown'] },
      ],
    },
    /* 15. Application OAuth & API Token Revocation */
    oauthRevoc: {
      id: 'oauthRevoc',
      name: 'OAuth & API Token Revocation',
      category: 'D',
      thematicHook: 'Third-party OAuth permissions and dormant app revocation.',
      splash: {
        headline: 'Review Connected Apps.',
        narrative: 'Scans third-party OAuth permissions bound to federated identities, allowing one-click NUKED revocation of dormant or overly permissive applications. Third-party OAuth tokens create long-lived identity risk and act as hidden backdoors if a connected SaaS application is breached.',
        privacyPledge: 'This module enforces a strict quarterly review loop. Any OAuth token that remains unused for 90 days, or possesses highly permissive read/write scopes without recent verification, is flagged for manual review or automatic NUKED revocation.',
      },
      dataFields: [
        { label: 'Service Name', key: 'serviceName', type: 'text' },
        { label: 'OAuth Scope', key: 'oauthScope', type: 'select', options: ['Read', 'Write', 'Full Access'] },
        { label: 'Last Used (days ago)', key: 'lastUsedDays', type: 'number' },
      ],
    },
    /* 16. ECRA/ERCA 2026 Compliance & Legal Sovereignty Ledger */
    legalLedger: {
      id: 'legalLedger',
      name: 'ECRA/ERCA Compliance Ledger',
      category: 'D',
      thematicHook: 'Immutable cryptographic ledger of all privacy enforcement requests.',
      splash: {
        headline: 'Your Sovereignty Ledger.',
        narrative: 'Maintains an immutable, timestamped cryptographic ledger of all privacy enforcement requests and statutory deletion notices for legal auditing. Every time a NUKED action is dispatched (e.g., a data broker deletion request), the ledger records the timestamp and SHA-256 hash. The system rolls these logs up weekly, verifying that all statutory deadlines (e.g., a 30-day legal response window) are actively tracked and escalating any unfulfilled requests.',
        privacyPledge: 'The ledger operates via real-time event commits with a weekly audit rollup. Every time a NUKED action is dispatched, the ledger records the timestamp and SHA-256 hash. The system rolls these logs up weekly, verifying that all statutory deadlines are actively tracked.',
      },
      dataFields: [
        { label: 'Last NUKED Action', key: 'lastNukedAction', type: 'text', optional: true },
        { label: 'Days Since Last Audit', key: 'daysSinceAudit', type: 'number' },
      ],
    },
  };