/**
 * Canonical 16 DIFF Module Agents — splash copy, fields, and briefing templates.
 * Source of truth for splash screens, workspaces, nav, and agents.
 */

export type FindingStatus = 'NUKED' | 'KNOXED' | 'MONITORED';
export type FieldType = 'text' | 'email' | 'select' | 'textarea' | 'password';

export interface ModuleField {
  key: string;
  label: string;
  placeholder: string;
  type: FieldType;
  help: string;
  options?: string[];
}

export interface ModuleFinding {
  id: string;
  status: FindingStatus;
  label: string;
  detail: string;
  remediation: string;
}

export interface ModuleAgentDef {
  id: string;
  vector: string;
  icon: string;
  name: string;
  shortLabel: string;
  category: string;
  thematicHook: string;
  splash: {
    headline: string;
    narrative: string;
    privacyPledge: string;
    youWillSee: string[];
  };
  fields: ModuleField[];
  capabilities: string[];
  pillar: string;
  weight: number;
  demoRecord: Record<string, string>;
  demoFindings: ModuleFinding[];
}

export const MODULE_AGENTS: ModuleAgentDef[] = [
  {
    id: 'email',
    vector: 'V-01',
    icon: '✉',
    name: 'Email Breach Scanner',
    shortLabel: 'Email',
    category: 'COMMUNICATIONS',
    thematicHook: 'Your inbox is the front door of your digital life.',
    splash: {
      headline: 'See every place your email has leaked.',
      narrative:
        'We check your addresses against known breaches, paste dumps, and spoofable DNS records — then translate the jargon into a plain-English briefing you can act on in minutes.',
      privacyPledge:
        'Only hashed prefixes leave this device. We never store your plaintext inbox or passwords on our servers.',
      youWillSee: [
        'Which of your addresses showed up in dumps',
        'Whether MFA and forwarding look safe',
        'A one-line next step (rotate, alias, or knox)',
      ],
    },
    fields: [
      { key: 'primaryEmail', label: 'Primary email', placeholder: 'you@domain.com', type: 'email', help: 'The inbox you actually use day to day.' },
      { key: 'aliases', label: 'Aliases / forwards', placeholder: 'alias@simplelogin.io, work@company.com', type: 'text', help: 'Cloaked or secondary addresses we should watch too.' },
      { key: 'recoveryEmail', label: 'Recovery email', placeholder: 'backup@proton.me', type: 'email', help: 'If this is weak, attackers reset everything else.' },
      { key: 'provider', label: 'Provider', placeholder: 'Gmail', type: 'select', options: ['Gmail', 'Outlook', 'Proton', 'iCloud', 'Fastmail', 'Custom'], help: 'Used to score SPF / DMARC / forwarding risk.' },
    ],
    capabilities: ['HIBP / paste-dump correlation', 'MFA & forwarding posture', 'SPF / DMARC spoof check', 'Alias reuse scoring'],
    pillar: 'Polymer',
    weight: 0.12,
    demoRecord: {
      primaryEmail: 'idin@agape.nyc',
      aliases: 'ops@agape.nyc, hello@sovereign.nyc',
      recoveryEmail: 'idin.backup@gmail.com',
      provider: 'Gmail',
    },
    demoFindings: [
      {
        id: 'email-canva',
        status: 'NUKED',
        label: '2019 Canva breach + recent Pastebin dump',
        detail:
          'idin@agape.nyc appeared in the 2019 Canva dump and a 2024 Pastebin dump with plaintext password material. That combination is how credential-stuffing bots get in.',
        remediation: 'Rotate the password, kill reused credentials, and bind a hardware passkey. Then re-scan — this tile should flip to KNOXED.',
      },
      {
        id: 'email-mfa',
        status: 'NUKED',
        label: 'Recovery inbox has no hardware MFA',
        detail:
          'The backup address still uses SMS / password only. Anyone who lands that inbox can reset the primary account.',
        remediation: 'Turn on a passkey or security key on the recovery account before you do anything else.',
      },
      {
        id: 'email-dmarc',
        status: 'MONITORED',
        label: 'DMARC / SPF gaps on agape.nyc',
        detail:
          'Look-alike spoofing is easier when DMARC is missing or p=none. Outsiders can send mail that looks like it came from you.',
        remediation: 'Publish SPF + DMARC p=quarantine, then p=reject once mail flow is clean.',
      },
    ],
  },
  {
    id: 'social',
    vector: 'V-02',
    icon: '◈',
    name: 'Social Media Footprint',
    shortLabel: 'Social',
    category: 'DIGITAL_PRESENCE',
    thematicHook: 'Your public persona is a searchable map of you.',
    splash: {
      headline: 'Map the handles that still point back to you.',
      narrative:
        'Username reuse, EXIF in photos, and old bios are how strangers stitch a life together. This agent shows the public graph in one screen — not a dump of every post.',
      privacyPledge: 'We verify ownership of handles. We do not scrape your private messages or store photo binaries.',
      youWillSee: ['Which handles match across platforms', 'Location / EXIF leftovers', 'Apps that still have OAuth to your accounts'],
    },
    fields: [
      { key: 'handles', label: 'Handles', placeholder: '@sovereign · linkedin.com/in/you', type: 'text', help: 'List the public names people can search.' },
      { key: 'platforms', label: 'Platforms', placeholder: 'X, LinkedIn, Instagram', type: 'text', help: 'Where those handles live today.' },
      { key: 'publicCity', label: 'City shown on profiles', placeholder: 'New York, NY', type: 'text', help: 'If this matches your real home, lock it down.' },
    ],
    capabilities: ['Handle reuse across 50+ networks', 'EXIF / geotag leftovers', 'OAuth app sprawl', 'Bio PII detection'],
    pillar: 'Unosecur',
    weight: 0.08,
    demoRecord: {
      handles: '@sovereign_identity, linkedin.com/in/agape-sovereign',
      platforms: 'X, LinkedIn, Meta',
      publicCity: 'New York, NY',
    },
    demoFindings: [
      {
        id: 'social-exif',
        status: 'NUKED',
        label: '14 public posts still carry location EXIF',
        detail: 'Photo metadata on X and Meta still encodes a New York neighborhood. Combined with your handle, that is a home-area map.',
        remediation: 'Strip EXIF, bulk-archive posts older than 90 days, and switch profiles to private / no-exact-city.',
      },
      {
        id: 'social-reuse',
        status: 'MONITORED',
        label: 'Same handle reused on 3 networks',
        detail: 'Handle consistency helps friends find you — and helps brokers correlate you. That is a tradeoff, not an automatic fail.',
        remediation: 'Keep one public professional handle. Use unique names on anything personal.',
      },
    ],
  },
  {
    id: 'device',
    vector: 'V-03',
    icon: '⬡',
    name: 'Device File Scan',
    shortLabel: 'Files',
    category: 'DEVICES_SYSTEMS',
    thematicHook: 'Unencrypted files on disk are an identity leak waiting to happen.',
    splash: {
      headline: 'Find the documents that should never sit in Downloads.',
      narrative:
        'Tax PDFs, passport scans, and API keys in local folders are the #1 accidental leak. This agent looks at file names and metadata — not the full contents — and tells you what to shred or vault.',
      privacyPledge: 'Pattern matching runs on-device. Raw file bytes are never uploaded.',
      youWillSee: ['Sensitive filenames in Downloads / Drive', 'Public share links', 'What to shred vs encrypt'],
    },
    fields: [
      { key: 'deviceName', label: 'Primary device', placeholder: 'MacBook Pro 16"', type: 'text', help: 'The machine you actually work on.' },
      { key: 'cloudSync', label: 'Cloud folders in play', placeholder: 'Google Drive, iCloud Desktop', type: 'text', help: 'Sync is how local files become public links.' },
      { key: 'sensitiveHints', label: 'Known sensitive files', placeholder: 'passport.pdf, 2025-taxes.pdf', type: 'textarea', help: 'Optional. Names only — never the file itself.' },
    ],
    capabilities: ['Filename / EXIF PII patterns', 'Drive public-link audit', 'DoD-style shred guidance', 'Vault encryption check'],
    pillar: 'Nymiz',
    weight: 0.07,
    demoRecord: {
      deviceName: 'MacBook Pro + Google Drive Enclave',
      cloudSync: 'Google Drive, iCloud',
      sensitiveHints: 'SSN-scan.pdf, passport-2024.jpg',
    },
    demoFindings: [
      {
        id: 'device-ssn',
        status: 'NUKED',
        label: '2 unencrypted SSN PDFs in Downloads',
        detail: 'Filenames match tax / ID patterns and are not in a FileVault-protected vault. Anyone with disk access — or a sync client — can open them.',
        remediation: 'Move them into the AES-GCM vault and shred the originals with a multi-pass wipe.',
      },
    ],
  },
  {
    id: 'mobile',
    vector: 'V-04',
    icon: '◻',
    name: 'Mobile Security Layer',
    shortLabel: 'Mobile',
    category: 'DEVICES_SYSTEMS',
    thematicHook: 'Your phone is a hardware key — or an open window.',
    splash: {
      headline: 'Check the pocket computer that holds everything.',
      narrative:
        'Passkeys, OS patches, and app permissions decide whether your phone is an enclave or a tracker. We score the posture in language you can check in Settings in under two minutes.',
      privacyPledge: 'We read what the browser / PWA can see. We never require MDM or root.',
      youWillSee: ['Passkey vs password fallback', 'OS freshness', 'Over-privileged apps'],
    },
    fields: [
      { key: 'phone', label: 'Phone', placeholder: 'Pixel 9 / iPhone 16', type: 'text', help: 'Model is enough — no IMEI needed.' },
      { key: 'osVersion', label: 'OS version', placeholder: 'Android 16 / iOS 18.5', type: 'text', help: 'Out-of-date OS is the most common NUKED flag.' },
      { key: 'passkey', label: 'Passkey on this device?', placeholder: 'Yes — platform authenticator', type: 'select', options: ['Yes — hardware / platform', 'Yes — password manager', 'No'], help: 'Hardware-backed is the gold standard.' },
      { key: 'screenLock', label: 'Auto-lock', placeholder: '30 seconds', type: 'select', options: ['15 seconds', '30 seconds', '1 minute', '5 minutes+', 'None'], help: 'Long lock windows undo biometric security.' },
    ],
    capabilities: ['Passkey enrollment', 'Patch-level guidance', 'Permission sprawl', 'Backup encryption'],
    pillar: 'Unosecur',
    weight: 0.08,
    demoRecord: {
      phone: 'Pixel 9 Pro + iPhone 16',
      osVersion: 'Android 16 / iOS 18.4',
      passkey: 'Yes — hardware / platform',
      screenLock: '5 minutes+',
    },
    demoFindings: [
      {
        id: 'mobile-lock',
        status: 'MONITORED',
        label: 'Auto-lock window is too generous',
        detail: 'Biometrics are on, but a 5-minute lock means a borrowed phone stays unlocked in the most sensitive apps.',
        remediation: 'Set auto-lock to 30 seconds and require passkey for password-manager / banking apps.',
      },
      {
        id: 'mobile-enclave',
        status: 'KNOXED',
        label: 'Hardware passkey bound',
        detail: 'Platform authenticator is enrolled. This is the posture we want on every module.',
        remediation: 'Keep a second security key as backup; do not fall back to SMS.',
      },
    ],
  },
  {
    id: 'laptop',
    vector: 'V-05',
    icon: '💻',
    name: 'Laptop System Security',
    shortLabel: 'Laptop',
    category: 'DEVICES_SYSTEMS',
    thematicHook: 'Firmware and disk encryption are the floor, not the ceiling.',
    splash: {
      headline: 'Confirm the machine itself cannot be quietly read.',
      narrative:
        'FileVault / BitLocker, Secure Boot, and extension hygiene decide whether a stolen laptop is a brick or a biography. We turn those checkboxes into a single score.',
      privacyPledge: 'No kernel agent is installed. You report posture; we score and advise.',
      youWillSee: ['Disk encryption status', 'Secure Boot / firmware', 'Risky browser extensions'],
    },
    fields: [
      { key: 'laptop', label: 'Laptop', placeholder: 'MacBook Pro M4', type: 'text', help: 'Model + chip is enough.' },
      { key: 'diskEncryption', label: 'Full-disk encryption', placeholder: 'FileVault on', type: 'select', options: ['FileVault on', 'BitLocker on', 'LUKS on', 'Off / unknown'], help: 'Off is an automatic NUKED.' },
      { key: 'secureBoot', label: 'Secure Boot / SIP', placeholder: 'Enabled', type: 'select', options: ['Enabled', 'Disabled', 'Unknown'], help: 'Disabled firmware is how persistent malware hides.' },
    ],
    capabilities: ['FDE verification', 'Secure Boot / SIP', 'Extension risk', 'Open-port posture'],
    pillar: 'Prisma AIRS',
    weight: 0.08,
    demoRecord: {
      laptop: 'MacBook Pro (Apple Silicon)',
      diskEncryption: 'FileVault on',
      secureBoot: 'Enabled',
    },
    demoFindings: [
      {
        id: 'laptop-fv',
        status: 'KNOXED',
        label: 'FileVault + Secure Enclave active',
        detail: 'Disk is encrypted with hardware-backed keys. A lost laptop is inconvenient, not an identity event — as long as the unlock password is not on a sticky note.',
        remediation: 'Store the recovery key in the passkey vault, not in iCloud Notes.',
      },
    ],
  },
  {
    id: 'deepweb',
    vector: 'V-06',
    icon: '◉',
    name: 'Deep Web Exposure',
    shortLabel: 'Deep Web',
    category: 'DEEP_WEB_BROKERS',
    thematicHook: 'If it was dumped once, it is still being sold.',
    splash: {
      headline: 'Watch the places search engines will not show you.',
      narrative:
        'Stealer logs, telegram channels, and onion paste sites recycle old emails and session cookies. This agent tells you whether your identifiers are circulating — in one paragraph, not a threat-intel novel.',
      privacyPledge: 'Lookups use hashed identifiers. We never browse onion sites from your IP.',
      youWillSee: ['Whether your email/phone is in recent dumps', 'Cookie / token risk', 'What to rotate tonight'],
    },
    fields: [
      { key: 'watchTerms', label: 'Watch terms', placeholder: 'email, phone last-4, company domain', type: 'text', help: 'What we hash and look up. No full SSN.' },
      { key: 'knownAliases', label: 'Dark-web aliases (if any)', placeholder: 'none', type: 'text', help: 'Only if you actually used one. Most people should leave this blank.' },
    ],
    capabilities: ['Stealer-log correlation', 'Paste-site watch', 'Credential-pair detection', 'Session-cookie invalidation advice'],
    pillar: 'PrivacyProctor',
    weight: 0.1,
    demoRecord: {
      watchTerms: 'idin@agape.nyc, agape.nyc, sovereign.nyc',
      knownAliases: 'none',
    },
    demoFindings: [
      {
        id: 'deepweb-clean',
        status: 'KNOXED',
        label: 'No fresh 2026 stealer-log hit',
        detail: 'Hashed identifiers did not match circulating RedLine / Lumma batches this cycle. Historical dumps still exist (see Email) but are not being re-sold as a live cookie pack.',
        remediation: 'Keep monitoring on. Rotate any password that ever overlapped with the 2019 Canva pair.',
      },
    ],
  },
  {
    id: 'broker',
    vector: 'V-07',
    icon: '⧫',
    name: 'Data Broker Removal',
    shortLabel: 'Brokers',
    category: 'DEEP_WEB_BROKERS',
    thematicHook: 'People-search sites are a public dossier of your life.',
    splash: {
      headline: 'See who is selling your home address — then send the takedown.',
      narrative:
        'Brokers stitch voter rolls, deeds, and leaked emails into a page about you. This agent lists the active listings in plain language and drafts the CCPA / GDPR letter you can send today.',
      privacyPledge: 'Opt-out letters are generated on-device. We do not create new broker accounts in your name.',
      youWillSee: ['How many sites list you', 'What data they show', 'A ready-to-send erasure letter'],
    },
    fields: [
      { key: 'legalName', label: 'Name they would list', placeholder: 'First Last', type: 'text', help: 'The name on utility bills and voter rolls.' },
      { key: 'city', label: 'City / state', placeholder: 'New York, NY', type: 'text', help: 'Used to match people-search pages — not stored as a precise address.' },
      { key: 'knownBrokers', label: 'Sites you already found', placeholder: 'Spokeo, Whitepages, BeenVerified', type: 'text', help: 'Optional. We will add the usual 200+ anyway.' },
    ],
    capabilities: ['200+ broker enumeration', 'CCPA / GDPR Art. 17 templates', 'Re-scrape suppression', 'Relative-link detection'],
    pillar: 'Polymer',
    weight: 0.12,
    demoRecord: {
      legalName: 'Sovereign Operator',
      city: 'New York, NY',
      knownBrokers: 'Spokeo, Whitepages, Intelius, BeenVerified',
    },
    demoFindings: [
      {
        id: 'broker-18',
        status: 'NUKED',
        label: '18 active people-search listings',
        detail: 'Home-area, relative names, and prior addresses are compiled on Spokeo, Whitepages, Intelius and 15 others. This is the graph kidnappers and stalkers use.',
        remediation: 'Dispatch ECRA / CCPA deletion to all 18, then re-scan in 30 days. Brokers re-list — suppression has to stay on.',
      },
    ],
  },
  {
    id: 'password',
    vector: 'V-08',
    icon: '⬟',
    name: 'Password Vault Analysis',
    shortLabel: 'Passwords',
    category: 'CREDENTIALS_FINANCE',
    thematicHook: 'Reused passwords are one breach away from every account.',
    splash: {
      headline: 'Find the passwords that are doing double duty.',
      narrative:
        'We never ask for the passwords themselves. You tell us patterns (length, reuse, MFA gaps) and we score entropy + blast radius — then point you at passkeys.',
      privacyPledge: 'Type nothing you would not put on a sticky note. Hashes, if any, stay on this device.',
      youWillSee: ['Reuse clusters', 'MFA coverage gaps', 'Which accounts should become passkeys first'],
    },
    fields: [
      { key: 'vault', label: 'Where passwords live', placeholder: '1Password / Apple Passwords / none', type: 'select', options: ['1Password', 'Bitwarden', 'Apple Passwords', 'Google Password Manager', 'Browser only', 'Memory / notes'], help: 'Browser-only is treated as high risk.' },
      { key: 'reuse', label: 'Any reused passwords?', placeholder: '2 legacy accounts share a password', type: 'text', help: 'Count and where — not the password.' },
      { key: 'mfaGaps', label: 'Accounts still on SMS OTP', placeholder: 'Bank, old university mail', type: 'text', help: 'SMS is better than nothing and worse than a passkey.' },
    ],
    capabilities: ['Reuse clustering', 'HIBP k-anonymity', 'Passkey upgrade queue', 'Recovery-code hygiene'],
    pillar: 'Nymiz',
    weight: 0.1,
    demoRecord: {
      vault: '1Password',
      reuse: '2 legacy web accounts share a 12-char password',
      mfaGaps: '6 services still on SMS OTP',
    },
    demoFindings: [
      {
        id: 'pw-reuse',
        status: 'NUKED',
        label: '2 legacy accounts still share a password',
        detail: 'A 12-character shared password is a single point of failure. If either site leaks, the other falls with it.',
        remediation: 'Nuke the duplicates, close the unused account, and migrate both to unique 32-char entries or passkeys.',
      },
      {
        id: 'pw-sms',
        status: 'MONITORED',
        label: '6 services still use SMS 2FA',
        detail: 'SIM-swap risk is real for banks and mail. SMS is a stepping stone, not a destination.',
        remediation: 'Replace SMS with passkeys or TOTP, then remove the phone number as a fallback.',
      },
    ],
  },
  {
    id: 'network',
    vector: 'V-09',
    icon: '◎',
    name: 'Network & DNS Security',
    shortLabel: 'Network',
    category: 'DEVICES_SYSTEMS',
    thematicHook: 'Your ISP can still see every domain you visit — unless you close that window.',
    splash: {
      headline: 'Stop leaking your browsing map to the network.',
      narrative:
        'Unencrypted DNS, WebRTC IP leaks, and default ISP resolvers paint a diary of your day. We check the easy wins: DoH, VPN, and leak tests — explained without packet-capture jargon.',
      privacyPledge: 'Leak tests run in your browser. We do not retain your real IP.',
      youWillSee: ['Whether DNS is encrypted', 'If WebRTC reveals your IP', 'A one-click hardening path'],
    },
    fields: [
      { key: 'dns', label: 'DNS setup', placeholder: 'Cloudflare DoH / ISP default', type: 'select', options: ['DNS-over-HTTPS (Cloudflare / Quad9)', 'VPN DNS', 'ISP default', 'Unknown'], help: 'ISP default = they keep a query log.' },
      { key: 'vpn', label: 'VPN', placeholder: 'WireGuard / none', type: 'select', options: ['WireGuard / Mullvad-style', 'Commercial VPN', 'None', 'Corporate only'], help: 'A no-log WireGuard tunnel is the knoxed pattern.' },
      { key: 'ssid', label: 'Home network name', placeholder: 'not the default router name', type: 'text', help: 'Default SSIDs advertise your router model.' },
    ],
    capabilities: ['DoH enforcement', 'WebRTC / IPv6 leak', 'SSID fingerprinting', 'ISP log exposure'],
    pillar: 'PrivacyProctor',
    weight: 0.08,
    demoRecord: {
      dns: 'ISP default',
      vpn: 'None',
      ssid: 'NETGEAR-Guest',
    },
    demoFindings: [
      {
        id: 'net-isp',
        status: 'NUKED',
        label: 'Home DNS still goes to the ISP',
        detail: 'Every domain you type is logged by the broadband provider. Combined with your account name, that is a browsing biography.',
        remediation: 'Switch the router to DNS-over-HTTPS (Quad9 or Cloudflare) and optionally put a WireGuard tunnel in front.',
      },
    ],
  },
  {
    id: 'cloud',
    vector: 'V-10',
    icon: '⊞',
    name: 'Cloud Storage Exposure',
    shortLabel: 'Cloud',
    category: 'COMMUNICATIONS',
    thematicHook: 'A “anyone with the link” folder is a public folder.',
    splash: {
      headline: 'Audit the Drive / iCloud folders that wandered into public.',
      narrative:
        'Shared links do not expire unless you tell them to. We inventory what is linked, who can still open it, and whether backups are actually end-to-end encrypted.',
      privacyPledge: 'We never download your files. Sharing metadata only.',
      youWillSee: ['Public or stale share links', 'ADP / CSE encryption status', 'Who still has access'],
    },
    fields: [
      { key: 'providers', label: 'Cloud providers', placeholder: 'Google Drive, iCloud', type: 'text', help: 'Where the important files actually live.' },
      { key: 'e2ee', label: 'Client-side encryption', placeholder: 'iCloud ADP on', type: 'select', options: ['iCloud Advanced Data Protection on', 'Google CSE on', 'Provider-side only', 'Unknown'], help: 'Provider-side means they can open it with a warrant — or a bug.' },
      { key: 'publicLinks', label: 'Known public links', placeholder: 'none / 2 old deck links', type: 'text', help: 'Anything you remember sending “anyone with the link”.' },
    ],
    capabilities: ['Public-link crawl', 'Collaborator review', 'ADP / CSE check', 'Link-expiry enforcement'],
    pillar: 'Prisma AIRS',
    weight: 0.07,
    demoRecord: {
      providers: 'iCloud + Google Drive',
      e2ee: 'iCloud Advanced Data Protection on',
      publicLinks: '2 stale “anyone with the link” decks',
    },
    demoFindings: [
      {
        id: 'cloud-adp',
        status: 'KNOXED',
        label: 'iCloud Advanced Data Protection is on',
        detail: 'Apple cannot read those backups. Keep the recovery key offline.',
        remediation: 'Print the ADP recovery key into the vault. Do not screenshot it into Camera Roll.',
      },
      {
        id: 'cloud-links',
        status: 'MONITORED',
        label: '2 share links have no expiry',
        detail: 'Old slide decks with “anyone with the link” still resolve. They may include client names.',
        remediation: 'Kill the links or set a 7-day expiry and a specific-people ACL.',
      },
    ],
  },
  {
    id: 'comm',
    vector: 'V-11',
    icon: '💬',
    name: 'Communication Privacy',
    shortLabel: 'Messages',
    category: 'COMMUNICATIONS',
    thematicHook: 'If it is not end-to-end, it is mail the provider can read.',
    splash: {
      headline: 'Score the apps you actually talk on.',
      narrative:
        'iMessage, Signal, and WhatsApp are not equal. Neither is Gmail vs Proton. We rank the channels you listed and flag the ones that still ship metadata or plaintext.',
      privacyPledge: 'No message bodies are read. Channel names and encryption posture only.',
      youWillSee: ['Which chats are E2EE', 'Metadata leftovers (calendar, receipts)', 'What to move this week'],
    },
    fields: [
      { key: 'messengers', label: 'Daily messengers', placeholder: 'iMessage, Signal, Slack', type: 'text', help: 'The apps you open without thinking.' },
      { key: 'emailChannel', label: 'Sensitive email', placeholder: 'Proton / Gmail', type: 'select', options: ['Proton / Tuta (E2EE)', 'Gmail with confidential mode', 'Gmail / Outlook default', 'Mixed'], help: 'Default Gmail is TLS in transit, readable at rest by Google.' },
      { key: 'calendar', label: 'Calendar visibility', placeholder: 'Private', type: 'select', options: ['Private', 'Free/busy only', 'Public / shareable link'], help: 'Public calendars leak travel and medical appointments.' },
    ],
    capabilities: ['E2EE channel scoring', 'Calendar privacy', 'Outbound PII DLP', 'Work-chat sprawl'],
    pillar: 'Polymer',
    weight: 0.05,
    demoRecord: {
      messengers: 'iMessage, Signal, Slack',
      emailChannel: 'Gmail / Outlook default',
      calendar: 'Free/busy only',
    },
    demoFindings: [
      {
        id: 'comm-gmail',
        status: 'MONITORED',
        label: 'Sensitive mail still sits in default Gmail',
        detail: 'Transport is encrypted; the mailbox is not. Legal, medical, and financial threads belong in an E2EE box or a passkey-gated vault.',
        remediation: 'Move the high-sensitivity threads to Proton / a local vault and keep Gmail for low-stakes mail.',
      },
      {
        id: 'comm-signal',
        status: 'KNOXED',
        label: 'Signal + iMessage in daily use',
        detail: 'Personal conversations already ride E2EE. Keep disappearing messages on for anything operational.',
        remediation: 'Lock Signal behind the phone passkey and disable cloud backups of chat history.',
      },
    ],
  },
  {
    id: 'financial',
    vector: 'V-12',
    icon: '⬡',
    name: 'Financial Identity Surface',
    shortLabel: 'Finance',
    category: 'CREDENTIALS_FINANCE',
    thematicHook: 'Card numbers in merchant databases outlive the cards themselves.',
    splash: {
      headline: 'See where your cards and credit file still live.',
      narrative:
        'Old merchants keep PAN data. Brokers sell “financial propensity.” We list the exposure in household language: freeze the file, tokenize the cards, close the zombie accounts.',
      privacyPledge: 'No full card numbers. Last-4 and institution names only.',
      youWillSee: ['Merchants keeping raw cards', 'Credit-freeze status', 'Virtual-card vs PAN advice'],
    },
    fields: [
      { key: 'banks', label: 'Institutions', placeholder: 'Chase, Apple Card, Fidelity', type: 'text', help: 'Names only.' },
      { key: 'freeze', label: 'Credit freeze', placeholder: 'Equifax / Experian / TransUnion', type: 'select', options: ['All three frozen', 'Partial', 'None', 'Unknown'], help: 'A freeze is the single highest-leverage knox.' },
      { key: 'tokenization', label: 'How you pay online', placeholder: 'Apple Pay / raw card', type: 'select', options: ['Apple Pay / Google Wallet only', 'Virtual cards', 'Raw card on file', 'Mixed'], help: 'Raw PAN on file is how a restaurant breach becomes a cloned card.' },
    ],
    capabilities: ['Merchant PAN retention', 'Credit-freeze guidance', 'Dark-web financial patterns', 'Virtual-card migration'],
    pillar: 'PrivacyProctor',
    weight: 0.07,
    demoRecord: {
      banks: 'Apple Card, local credit union',
      freeze: 'Partial',
      tokenization: 'Mixed',
    },
    demoFindings: [
      {
        id: 'fin-merchants',
        status: 'NUKED',
        label: '3 merchants still store a raw card',
        detail: 'Expired numbers sitting at old shops are still useful for “card-on-file” fraud and for proving identity to a social engineer.',
        remediation: 'Delete the cards at those merchants and move recurring charges to a virtual card you can kill in one tap.',
      },
      {
        id: 'fin-freeze',
        status: 'MONITORED',
        label: 'Credit freeze is only partial',
        detail: 'One bureau left open is enough to open a new line of credit in your name.',
        remediation: 'Freeze Equifax, Experian, and TransUnion. Store the PINs in the vault, not in mail.',
      },
    ],
  },
  {
    id: 'docs',
    vector: 'V-13',
    icon: '📄',
    name: 'Identity Document Exposure',
    shortLabel: 'Documents',
    category: 'CREDENTIALS_FINANCE',
    thematicHook: 'A photo of your license in Notes is a public document.',
    splash: {
      headline: 'Find every scan of your license, passport, or SSN.',
      narrative:
        'Camera rolls and note apps are where IDs go to leak. We help you inventory the copies, shred the extras, and move the real credential to a hardware-backed mDL if your state supports it.',
      privacyPledge: 'Never upload the ID image. Names of copies only.',
      youWillSee: ['Where copies live', 'Whether IRS IP PIN is on', 'mDL migration path'],
    },
    fields: [
      { key: 'idType', label: 'Primary ID', placeholder: 'NY driver license / passport', type: 'select', options: ['Driver license', 'Passport', 'National ID', 'mDL (mobile)'], help: 'The one you actually show people.' },
      { key: 'copies', label: 'Where copies live today', placeholder: 'Notes app, email to self, Drive', type: 'text', help: 'Be honest — that is the whole point.' },
      { key: 'ipPin', label: 'IRS IP PIN enrolled?', placeholder: 'No', type: 'select', options: ['Yes', 'No', 'Not a US filer'], help: 'Stops someone else from filing a tax return as you.' },
    ],
    capabilities: ['Copy inventory', 'IRS IP PIN', 'mDL (ISO 18013-5)', 'SSA account lock'],
    pillar: 'Nymiz',
    weight: 0.04,
    demoRecord: {
      idType: 'Driver license',
      copies: 'Notes app scan, 2023 email to self',
      ipPin: 'No',
    },
    demoFindings: [
      {
        id: 'docs-notes',
        status: 'NUKED',
        label: 'Driver license scan sitting in Notes',
        detail: 'Notes sync. A screenshot of a license in an unencrypted note is a gift to anyone with your cloud password.',
        remediation: 'Shred the image, keep the physical card, and enroll an IRS IP PIN this week.',
      },
    ],
  },
  {
    id: 'oauth',
    vector: 'V-14',
    icon: '🔑',
    name: 'Third-Party OAuth Audit',
    shortLabel: 'OAuth',
    category: 'DIGITAL_PRESENCE',
    thematicHook: 'Apps you forgot still have the keys to your mail.',
    splash: {
      headline: 'Revoke the apps that should not still be in your account.',
      narrative:
        'OAuth grants linger for years. We help you list them, rank by blast radius (mail, drive, contacts), and queue the ones to kill — zombies first.',
      privacyPledge: 'You paste app names from Google / Apple security pages. We never request those OAuth tokens ourselves.',
      youWillSee: ['High-scope apps', 'Zombies unused > 180 days', 'A revoke order'],
    },
    fields: [
      { key: 'highScope', label: 'Apps with mail/drive access', placeholder: 'Old CRM, PDF tool, “Sign in with Google” games', type: 'textarea', help: 'From Google Account → Third-party access.' },
      { key: 'zombies', label: 'Apps you have not used in 6 months', placeholder: 'That one workout app…', type: 'text', help: 'If you cannot remember it, revoke it.' },
    ],
    capabilities: ['Scope scoring', 'Zombie detection', 'Least-privilege queue', 'Non-human identity mapping'],
    pillar: 'Unosecur',
    weight: 0.05,
    demoRecord: {
      highScope: 'Legacy PDF compressor, abandoned CRM, “Sign in with Google” newsletter',
      zombies: '3 apps last used in 2023',
    },
    demoFindings: [
      {
        id: 'oauth-zombies',
        status: 'NUKED',
        label: '3 zombie apps still hold Gmail scope',
        detail: 'They have not been opened in a year and can still read mail. That is a silent inbox tap.',
        remediation: 'Revoke them in Google Account → Security → Third-party access, then re-scan.',
      },
    ],
  },
  {
    id: 'legal',
    vector: 'V-15',
    icon: '⚖',
    name: 'Public Records & Legal',
    shortLabel: 'Records',
    category: 'DEEP_WEB_BROKERS',
    thematicHook: 'Courts and deeds are public — your mobile number does not have to be.',
    splash: {
      headline: 'See what a stranger learns from a 30-second records search.',
      narrative:
        'Voter rolls, property deeds, and dockets are public by design. We cannot un-publish a deed, but we can tell you what is out there and which optional fields (phone, email) you can pull back.',
      privacyPledge: 'We do not file anything in your name. Guidance only.',
      youWillSee: ['Property / voter exposure', 'Whether a phone is listed', 'Opt-out paths that actually work'],
    },
    fields: [
      { key: 'jurisdiction', label: 'Home jurisdiction', placeholder: 'New York County, NY', type: 'text', help: 'County is enough. No street address required.' },
      { key: 'voter', label: 'Voter-roll privacy option', placeholder: 'Not requested', type: 'select', options: ['Confidential / protected', 'Standard', 'Unknown'], help: 'Many states let you hide the address on the public extract.' },
      { key: 'property', label: 'Property in your name?', placeholder: 'Yes / no / LLC', type: 'select', options: ['Yes — personal name', 'Held in LLC / trust', 'Renter', 'Prefer not to say'], help: 'An LLC does not make you invisible, but it breaks the easy people-search join.' },
    ],
    capabilities: ['Voter-roll opt-out', 'Deed PII review', 'Docket mention watch', 'Professional-license check'],
    pillar: 'PrivacyProctor',
    weight: 0.03,
    demoRecord: {
      jurisdiction: 'New York County, NY',
      voter: 'Standard',
      property: 'Yes — personal name',
    },
    demoFindings: [
      {
        id: 'legal-voter',
        status: 'MONITORED',
        label: 'Standard voter extract still lists you',
        detail: 'NY public extracts are milder than some states, but brokers still ingest them. Confidential voter status is available in limited cases.',
        remediation: 'Ask the county board about confidentiality if you have a safety need; otherwise suppress the downstream broker copies in V-07.',
      },
    ],
  },
  {
    id: 'ai',
    vector: 'V-16',
    icon: '⊛',
    name: 'AI & Biometric Exposure',
    shortLabel: 'Biometrics',
    category: 'DIGITAL_PRESENCE',
    thematicHook: 'Your face is a password you cannot rotate.',
    splash: {
      headline: 'Find out if your face is in someone else’s training set.',
      narrative:
        'Clearview-style scrapers and conference photos put a biometric key on the open web. We check the obvious indexes, explain BIPA / ECRA deletion, and tell you how to cloak public avatars.',
      privacyPledge: 'No selfie is uploaded. We work from public URLs you already control.',
      youWillSee: ['Indexed conference / press photos', 'Voice-print app permissions', 'Opt-out + cloaking steps'],
    },
    fields: [
      { key: 'publicPhotos', label: 'Known public photo URLs', placeholder: 'company about page, conference recap', type: 'textarea', help: 'Pages a scraper would find first.' },
      { key: 'voiceApps', label: 'Apps that have used your voice / face', placeholder: 'Bank app, Clear, airline', type: 'text', help: 'Anything that enrolled a biometric template.' },
      { key: 'optouts', label: 'Opt-outs already filed', placeholder: 'none / Clearview / PimEyes', type: 'text', help: 'So we do not nag you twice.' },
    ],
    capabilities: ['Clearview / PimEyes guidance', 'BIPA deletion templates', 'Voice-print inventory', 'Avatar cloaking'],
    pillar: 'Prisma AIRS',
    weight: 0.04,
    demoRecord: {
      publicPhotos: 'Two 2024 conference group photos on the organizer site',
      voiceApps: 'Bank app, airport Clear',
      optouts: 'none',
    },
    demoFindings: [
      {
        id: 'ai-photos',
        status: 'NUKED',
        label: '2 conference photos match at 98%',
        detail: 'Public group photos are in visual-search indexes. That is enough for a face-search product to return your name next to a room you were in.',
        remediation: 'Ask the organizer to take them down or crop you out, file BIPA / ECRA deletion, and add cloaking noise to the avatars you do control.',
      },
    ],
  },
];

export const MODULE_BY_ID: Record<string, ModuleAgentDef> = Object.fromEntries(
  MODULE_AGENTS.map((m) => [m.id, m])
);

export function getModule(id: string): ModuleAgentDef | undefined {
  return MODULE_BY_ID[id];
}
