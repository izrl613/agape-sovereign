/**
 * Demo mode data — realistic pre-populated state so the dashboard
 * is fully explorable without a real Firebase auth session.
 *
 * None of this data is persisted to Firestore. It is injected in-memory
 * when demoMode is active.
 */

import type { ScanFinding } from '../services/scanService';

// ---------------------------------------------------------------------------
// Demo user document (matches Firestore users/{uid} shape)
// ---------------------------------------------------------------------------
export const DEMO_USER_DATA = {
  uid: 'demo-user',
  email: 'demo@sovereign.nyc',
  displayName: 'Demo Explorer',
  role: 'user',
  sovereignScore: 74,
  setupComplete: true,
  authType: 'google',
  hasPasskey: false,
  notificationsEnabled: false,
  createdAt: { toDate: () => new Date('2026-01-15') },
} as const;

export const DEMO_SOVEREIGN_SCORE = 74;

// ---------------------------------------------------------------------------
// Demo score history — 8 data points over ~30 days showing improvement arc
// ---------------------------------------------------------------------------
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export const DEMO_SCORE_HISTORY: { score: number; timestamp: string }[] = [
  { score: 52, timestamp: daysAgo(30).toLocaleDateString() },
  { score: 55, timestamp: daysAgo(26).toLocaleDateString() },
  { score: 58, timestamp: daysAgo(22).toLocaleDateString() },
  { score: 61, timestamp: daysAgo(18).toLocaleDateString() },
  { score: 64, timestamp: daysAgo(14).toLocaleDateString() },
  { score: 68, timestamp: daysAgo(10).toLocaleDateString() },
  { score: 71, timestamp: daysAgo(5).toLocaleDateString()  },
  { score: 74, timestamp: daysAgo(0).toLocaleDateString()  },
];

// ---------------------------------------------------------------------------
// Demo findings — 24 entries spread across all 17 modules
// mix of NUKED / KNOXED / MONITORED
// ---------------------------------------------------------------------------
const now = new Date();
const ts = (hoursAgo: number): Date => {
  const d = new Date(now);
  d.setHours(d.getHours() - hoursAgo);
  return d;
};

export const DEMO_FINDINGS: ScanFinding[] = [
  // email — V-01
  {
    id: 'demo-01',
    userId: 'demo-user',
    module: 'email',
    finding: 'Email found in 3 data breaches',
    status: 'NUKED',
    timestamp: ts(2),
    details: 'Breached services: LinkedIn (2021), Adobe (2013), Canva (2019). Plaintext passwords exposed in 1 breach.',
  },
  {
    id: 'demo-02',
    userId: 'demo-user',
    module: 'email',
    finding: 'Spam trap subscription confirmed',
    status: 'MONITORED',
    timestamp: ts(4),
    details: 'Email address enrolled in 14 marketing lists without explicit consent. Unsubscribe sweep recommended.',
  },
  {
    id: 'demo-03',
    userId: 'demo-user',
    module: 'email',
    finding: 'Secondary alias hardened',
    status: 'KNOXED',
    timestamp: ts(48),
    details: 'Alias sovereign@pm.me configured with DMARC/SPF protection. No breaches detected.',
  },

  // social — V-02
  {
    id: 'demo-04',
    userId: 'demo-user',
    module: 'social',
    finding: 'Public geotag metadata in 47 posts',
    status: 'NUKED',
    timestamp: ts(6),
    details: 'Instagram and Twitter posts contain embedded GPS coordinates. Location history reconstructable to within 10 m.',
  },
  {
    id: 'demo-05',
    userId: 'demo-user',
    module: 'social',
    finding: 'Facebook profile visibility hardened',
    status: 'KNOXED',
    timestamp: ts(72),
    details: 'Friends-only visibility, off-Facebook activity tracking disabled, face recognition opted out.',
  },

  // device — V-03
  {
    id: 'demo-06',
    userId: 'demo-user',
    module: 'device',
    finding: 'Browser fingerprint uniqueness: 99.7th percentile',
    status: 'NUKED',
    timestamp: ts(3),
    details: 'Canvas + AudioContext + font enumeration combination creates a globally unique fingerprint. Recommend Firefox + RFP mode.',
  },
  {
    id: 'demo-07',
    userId: 'demo-user',
    module: 'device',
    finding: 'OS telemetry reduced',
    status: 'KNOXED',
    timestamp: ts(96),
    details: 'Windows diagnostic data set to Basic. Application error reporting anonymised.',
  },

  // mobile — V-04
  {
    id: 'demo-08',
    userId: 'demo-user',
    module: 'mobile',
    finding: '7 apps with excessive background location access',
    status: 'NUKED',
    timestamp: ts(5),
    details: 'Food delivery, weather, and two gaming apps request "Always On" location. Revoke background permission in iOS Settings.',
  },
  {
    id: 'demo-09',
    userId: 'demo-user',
    module: 'mobile',
    finding: 'Microphone permission restricted to 3 apps',
    status: 'KNOXED',
    timestamp: ts(80),
    details: 'Only Phone, Voice Memos, and Signal retain microphone access. All others revoked.',
  },

  // deepweb — V-05
  {
    id: 'demo-10',
    userId: 'demo-user',
    module: 'deepweb',
    finding: 'SSN partial match on paste site',
    status: 'NUKED',
    timestamp: ts(1),
    details: 'Last 4 digits of SSN paired with full name and DOB found on Pastebin dump dated 3 weeks ago. Freeze credit immediately.',
  },
  {
    id: 'demo-11',
    userId: 'demo-user',
    module: 'deepweb',
    finding: 'Home address scrubbed from 2 aggregator leaks',
    status: 'KNOXED',
    timestamp: ts(120),
    details: 'Removal confirmed from WhitePages and Spokeo. Suppression request filed with BeenVerified.',
  },

  // broker — V-06
  {
    id: 'demo-12',
    userId: 'demo-user',
    module: 'broker',
    finding: 'Profile active on 9 data broker sites',
    status: 'MONITORED',
    timestamp: ts(10),
    details: 'PeopleFinder, Intelius, Spokeo, MyLife, ZabaSearch, and 4 others. Opt-out requests pending for 6.',
  },
  {
    id: 'demo-13',
    userId: 'demo-user',
    module: 'broker',
    finding: 'Acxiom marketing profile suppressed',
    status: 'KNOXED',
    timestamp: ts(200),
    details: 'Acxiom opt-out confirmed. Profile will be rebuilt unless annual renewal is submitted.',
  },

  // password — V-07
  {
    id: 'demo-14',
    userId: 'demo-user',
    module: 'password',
    finding: 'Password reuse across 7 sites detected',
    status: 'NUKED',
    timestamp: ts(8),
    details: 'Single password variant used on Amazon, Netflix, GitHub, Dropbox, and 3 forums. One forum was breached in 2022.',
  },
  {
    id: 'demo-15',
    userId: 'demo-user',
    module: 'password',
    finding: 'Critical accounts migrated to unique passwords',
    status: 'KNOXED',
    timestamp: ts(144),
    details: 'Banking, email, and social media accounts now use 24-character unique passwords stored in 1Password.',
  },

  // location — V-08
  {
    id: 'demo-16',
    userId: 'demo-user',
    module: 'location',
    finding: 'Google Timeline active — 3 years of location history',
    status: 'MONITORED',
    timestamp: ts(12),
    details: 'Google Maps Timeline has detailed location history since 2021. Disable in Google Account settings under Data & Privacy.',
  },

  // browser — V-09
  {
    id: 'demo-17',
    userId: 'demo-user',
    module: 'browser',
    finding: '34 third-party tracking cookies active',
    status: 'NUKED',
    timestamp: ts(7),
    details: 'Cross-site tracking cookies from 12 ad networks detected. No privacy-focused browser extension active.',
  },
  {
    id: 'demo-18',
    userId: 'demo-user',
    module: 'browser',
    finding: 'DNS-over-HTTPS enabled',
    status: 'KNOXED',
    timestamp: ts(168),
    details: 'DoH configured via Cloudflare 1.1.1.1. DNS queries are encrypted and not visible to ISP.',
  },

  // darkweb — V-14
  {
    id: 'demo-19',
    userId: 'demo-user',
    module: 'darkweb',
    finding: 'Dark web mention detected in threat forum',
    status: 'NUKED',
    timestamp: ts(14),
    details: 'Email address appears in a credential combo list circulating on a private Telegram channel. Rotate all passwords.',
  },
  {
    id: 'demo-20',
    userId: 'demo-user',
    module: 'darkweb',
    finding: 'Credit card data — no active listings found',
    status: 'KNOXED',
    timestamp: ts(240),
    details: 'No active card number listings detected across monitored dark web markets. Last scan: today.',
  },

  // cloud — V-13
  {
    id: 'demo-21',
    userId: 'demo-user',
    module: 'cloud',
    finding: 'Public Dropbox folder with 12 documents',
    status: 'MONITORED',
    timestamp: ts(20),
    details: 'A "shared" Dropbox folder is publicly accessible via link. Documents include a tax return and two ID scans.',
  },

  // behavioral — V-15
  {
    id: 'demo-22',
    userId: 'demo-user',
    module: 'behavioral',
    finding: 'Ad-interest profile: 340 inferred categories',
    status: 'MONITORED',
    timestamp: ts(25),
    details: 'Google ad interests include: health conditions, financial stress, political affiliation, and relationship status. Clear and disable.',
  },

  // medical — V-10
  {
    id: 'demo-23',
    userId: 'demo-user',
    module: 'medical',
    finding: 'Health app shares data with 4 third parties',
    status: 'NUKED',
    timestamp: ts(9),
    details: 'MyFitnessPal shares caloric and weight data with analytics partners. Data is not anonymised per their current policy.',
  },

  // shield — V-17
  {
    id: 'demo-24',
    userId: 'demo-user',
    module: 'shield',
    finding: 'Two-factor authentication enabled on primary accounts',
    status: 'KNOXED',
    timestamp: ts(300),
    details: 'TOTP 2FA active on Google, GitHub, and banking accounts. Hardware key registered as backup for Google.',
  },
];
