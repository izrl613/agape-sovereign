export type AccountPlan = 'Sovereign Free' | 'Enclave Pro' | 'Sentinel Enterprise';

export type TicketSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SupportTicket {
  id: string;
  subject: string;
  severity: TicketSeverity;
  openedAt: string;
  status: 'open' | 'escalated' | 'awaiting-customer';
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  organization: string;
  plan: AccountPlan;
  monthlyQuotaLimit: number;
  recentUsageCount: number;
  usageTrendPct: number;
  activeVectors: number;
  lastActiveDaysAgo: number;
  lastActiveLabel: string;
  billingStatus: 'healthy' | 'past_due' | 'trial_ending';
  tickets: SupportTicket[];
}

export const CUSTOMER_ACCOUNTS: CustomerAccount[] = [
  {
    id: 'ACC-9041',
    name: 'Elena Vance',
    email: 'elena.vance@aegis-bio.io',
    organization: 'Aegis BioLabs',
    plan: 'Sentinel Enterprise',
    monthlyQuotaLimit: 50000,
    recentUsageCount: 47850,
    usageTrendPct: 24,
    activeVectors: 16,
    lastActiveDaysAgo: 0,
    lastActiveLabel: '2h ago',
    billingStatus: 'healthy',
    tickets: [
      {
        id: 'TKT-4812',
        subject: 'WebAuthn passkey rotation failing on secondary hardware key',
        severity: 'critical',
        openedAt: '2026-11-26',
        status: 'escalated',
      },
      {
        id: 'TKT-4799',
        subject: 'Custom retention policy export for 26-month audit',
        severity: 'medium',
        openedAt: '2026-11-24',
        status: 'open',
      },
    ],
  },
  {
    id: 'ACC-8824',
    name: 'Marcus Thorne',
    email: 'm.thorne@obsidianfund.com',
    organization: 'Obsidian Capital',
    plan: 'Enclave Pro',
    monthlyQuotaLimit: 15000,
    recentUsageCount: 14100,
    usageTrendPct: 38,
    activeVectors: 14,
    lastActiveDaysAgo: 1,
    lastActiveLabel: '1d ago',
    billingStatus: 'past_due',
    tickets: [
      {
        id: 'TKT-4805',
        subject: 'Invoice settlement webhook returned 402',
        severity: 'high',
        openedAt: '2026-11-25',
        status: 'open',
      },
    ],
  },
  {
    id: 'ACC-7710',
    name: 'Sora Takahashi',
    email: 'sora@kurokawa-sec.jp',
    organization: 'Kurokawa Security',
    plan: 'Sentinel Enterprise',
    monthlyQuotaLimit: 50000,
    recentUsageCount: 21400,
    usageTrendPct: -4,
    activeVectors: 16,
    lastActiveDaysAgo: 0,
    lastActiveLabel: '45m ago',
    billingStatus: 'healthy',
    tickets: [],
  },
  {
    id: 'ACC-6539',
    name: 'Devon Brooks',
    email: 'dbrooks@veritaslegal.org',
    organization: 'Veritas Legal Group',
    plan: 'Enclave Pro',
    monthlyQuotaLimit: 15000,
    recentUsageCount: 4200,
    usageTrendPct: -18,
    activeVectors: 9,
    lastActiveDaysAgo: 19,
    lastActiveLabel: '19d ago',
    billingStatus: 'healthy',
    tickets: [
      {
        id: 'TKT-4740',
        subject: 'Need assistance mapping Financial/Legal vector #14',
        severity: 'low',
        openedAt: '2026-11-12',
        status: 'awaiting-customer',
      },
    ],
  },
  {
    id: 'ACC-5412',
    name: 'Nadia Al-Mansoor',
    email: 'nadia@heliosgrid.net',
    organization: 'Helios Grid',
    plan: 'Sovereign Free',
    monthlyQuotaLimit: 1000,
    recentUsageCount: 960,
    usageTrendPct: 62,
    activeVectors: 6,
    lastActiveDaysAgo: 0,
    lastActiveLabel: '15m ago',
    billingStatus: 'trial_ending',
    tickets: [
      {
        id: 'TKT-4815',
        subject: '15 RPM rate limit hit during automated vector scan',
        severity: 'high',
        openedAt: '2026-11-27',
        status: 'open',
      },
    ],
  },
  {
    id: 'ACC-4903',
    name: 'Liam O’Connor',
    email: 'liam@emeraldcloud.ie',
    organization: 'Emerald Cloud',
    plan: 'Enclave Pro',
    monthlyQuotaLimit: 15000,
    recentUsageCount: 8950,
    usageTrendPct: 7,
    activeVectors: 12,
    lastActiveDaysAgo: 2,
    lastActiveLabel: '2d ago',
    billingStatus: 'healthy',
    tickets: [],
  },
  {
    id: 'ACC-3820',
    name: 'Priya Nair',
    email: 'priya.nair@synapsemed.ai',
    organization: 'SynapseMed AI',
    plan: 'Sentinel Enterprise',
    monthlyQuotaLimit: 50000,
    recentUsageCount: 44900,
    usageTrendPct: 19,
    activeVectors: 15,
    lastActiveDaysAgo: 1,
    lastActiveLabel: '1d ago',
    billingStatus: 'healthy',
    tickets: [
      {
        id: 'TKT-4801',
        subject: 'SHA-256 receipt batch export latency spike',
        severity: 'high',
        openedAt: '2026-11-25',
        status: 'escalated',
      },
      {
        id: 'TKT-4788',
        subject: 'Clarification on zero-knowledge DEK rotation interval',
        severity: 'medium',
        openedAt: '2026-11-21',
        status: 'open',
      },
      {
        id: 'TKT-4772',
        subject: 'Add secondary admin to enclave workspace',
        severity: 'low',
        openedAt: '2026-11-18',
        status: 'awaiting-customer',
      },
    ],
  },
  {
    id: 'ACC-2195',
    name: 'Julian Mercer',
    email: 'jmercer@northstar.vc',
    organization: 'Northstar Ventures',
    plan: 'Sovereign Free',
    monthlyQuotaLimit: 1000,
    recentUsageCount: 180,
    usageTrendPct: -40,
    activeVectors: 3,
    lastActiveDaysAgo: 24,
    lastActiveLabel: '24d ago',
    billingStatus: 'healthy',
    tickets: [],
  },
];
