import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  LifeBuoy,
  Search,
  ShieldAlert,
  TrendingUp,
  X,
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useSovereign } from '../context/SovereignContext';
import { NEON } from '../theme';
import {
  type AccountPlan,
  type CustomerAccount,
  type TicketSeverity,
} from '../data/accounts';

type SortKey = 'name' | 'plan' | 'usage' | 'tickets' | 'lastActive';
type SortDirection = 'ascending' | 'descending';
type AttentionFilter =
  | 'all'
  | 'needs_attention'
  | 'high_usage'
  | 'urgent_tickets'
  | 'inactive'
  | 'billing_risk';

const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const PLAN_ORDER: Record<AccountPlan, number> = {
  'Sovereign Free': 1,
  'Enclave Pro': 2,
  'Sentinel Enterprise': 3,
};

function usagePct(account: CustomerAccount): number {
  return Math.round((account.recentUsageCount / account.monthlyQuotaLimit) * 100);
}

function getAttentionReasons(account: CustomerAccount): string[] {
  const reasons: string[] = [];
  const pct = usagePct(account);
  if (pct >= 85) reasons.push(`High usage (${pct}% of quota)`);
  if (account.tickets.some((t) => t.severity === 'critical' || t.severity === 'high')) {
    reasons.push('Urgent support ticket');
  }
  if (account.lastActiveDaysAgo >= 14) {
    reasons.push(`Inactive (${account.lastActiveDaysAgo}d)`);
  }
  if (account.billingStatus !== 'healthy') {
    reasons.push(account.billingStatus === 'past_due' ? 'Past-due billing' : 'Trial ending');
  }
  return reasons;
}

function highestSeverity(account: CustomerAccount): TicketSeverity | null {
  if (account.tickets.length === 0) return null;
  const rank: Record<TicketSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return account.tickets.reduce<TicketSeverity>(
    (best, t) => (rank[t.severity] > rank[best] ? t.severity : best),
    account.tickets[0].severity,
  );
}

function severityColor(severity: TicketSeverity): string {
  switch (severity) {
    case 'critical':
      return NEON.magenta;
    case 'high':
      return NEON.orange;
    case 'medium':
      return NEON.yellow;
    case 'low':
      return NEON.blue;
  }
}

export const AccountExplorerView: React.FC = () => {
  const { user, receipts, collectedVectors } = useSovereign();
  const [liveAccounts, setLiveAccounts] = useState<CustomerAccount[]>([]);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | AccountPlan>('ALL');
  const [attentionFilter, setAttentionFilter] = useState<AttentionFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('tickets');
  const [sortDir, setSortDir] = useState<SortDirection>('descending');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setLiveAccounts([]);
      return;
    }

    const currentAccount: CustomerAccount = {
      id: user.id,
      name: user.email ? user.email.split('@')[0] : 'Sovereign Operator',
      email: user.email || 'anonymous@sovereign.nyc',
      organization: user.isAdmin ? 'Agape Sovereign Admin' : 'Personal Enclave',
      plan: user.isAdmin ? 'Sentinel Enterprise' : 'Sovereign Free',
      monthlyQuotaLimit: 1500,
      recentUsageCount: receipts.length,
      usageTrendPct: 0,
      activeVectors: collectedVectors.length,
      lastActiveDaysAgo: 0,
      lastActiveLabel: 'Active now',
      billingStatus: 'healthy',
      tickets: [],
    };

    if (!user.isAdmin) {
      setLiveAccounts([currentAccount]);
      setSelectedAccountId(currentAccount.id);
      return;
    }

    let active = true;
    getDocs(collection(db, 'users'))
      .then((snap) => {
        if (!active) return;
        const rows: CustomerAccount[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const email = String(data.email ?? '');
          return {
            id: d.id,
            name: String(data.name ?? (email ? email.split('@')[0] : d.id.slice(0, 10))),
            email: email || 'no-email@sovereign.nyc',
            organization: String(data.organization ?? 'Sovereign Enclave'),
            plan: (data.plan as AccountPlan) || 'Sovereign Free',
            monthlyQuotaLimit: Number(data.monthlyQuotaLimit ?? 1500),
            recentUsageCount: Number(data.recentUsageCount ?? (d.id === user.id ? receipts.length : 0)),
            usageTrendPct: Number(data.usageTrendPct ?? 0),
            activeVectors: Number(data.activeVectors ?? (d.id === user.id ? collectedVectors.length : 0)),
            lastActiveDaysAgo: Number(data.lastActiveDaysAgo ?? 0),
            lastActiveLabel: String(data.lastActiveLabel ?? 'Live'),
            billingStatus: (data.billingStatus as CustomerAccount['billingStatus']) || 'healthy',
            tickets: Array.isArray(data.tickets) ? (data.tickets as CustomerAccount['tickets']) : [],
          };
        });
        const finalRows = rows.length > 0 ? rows : [currentAccount];
        setLiveAccounts(finalRows);
        setSelectedAccountId(finalRows[0]?.id ?? null);
      })
      .catch(() => {
        if (!active) return;
        setLiveAccounts([currentAccount]);
        setSelectedAccountId(currentAccount.id);
      });

    return () => {
      active = false;
    };
  }, [user, receipts.length, collectedVectors.length]);

  const handleSort = (key: SortKey, label: string) => {
    const nextDir: SortDirection =
      sortKey === key && sortDir === 'ascending' ? 'descending' : 'ascending';
    setSortKey(key);
    setSortDir(nextDir);
    setStatusMessage(`Sorted by ${label}, ${nextDir}`);
  };

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = liveAccounts.filter((acc) => {
      if (planFilter !== 'ALL' && acc.plan !== planFilter) return false;

      if (q) {
        const haystack = `${acc.id} ${acc.name} ${acc.email} ${acc.organization} ${acc.plan}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      const pct = usagePct(acc);
      switch (attentionFilter) {
        case 'needs_attention':
          return getAttentionReasons(acc).length > 0;
        case 'high_usage':
          return pct >= 85;
        case 'urgent_tickets':
          return acc.tickets.some((t) => t.severity === 'critical' || t.severity === 'high');
        case 'inactive':
          return acc.lastActiveDaysAgo >= 14;
        case 'billing_risk':
          return acc.billingStatus !== 'healthy';
        default:
          return true;
      }
    });

    const factor = sortDir === 'ascending' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return factor * COLLATOR.compare(a.name, b.name);
        case 'plan':
          return factor * (PLAN_ORDER[a.plan] - PLAN_ORDER[b.plan]);
        case 'usage':
          return factor * (usagePct(a) - usagePct(b));
        case 'tickets':
          return factor * (a.tickets.length - b.tickets.length);
        case 'lastActive':
          return factor * (a.lastActiveDaysAgo - b.lastActiveDaysAgo);
      }
    });
  }, [liveAccounts, query, planFilter, attentionFilter, sortKey, sortDir]);

  const selectedAccount = useMemo(
    () =>
      filteredAndSorted.find((a) => a.id === selectedAccountId) ??
      filteredAndSorted[0] ??
      null,
    [filteredAndSorted, selectedAccountId],
  );

  const summary = useMemo(() => {
    const total = liveAccounts.length;
    const attention = liveAccounts.filter((a) => getAttentionReasons(a).length > 0).length;
    const openTickets = liveAccounts.reduce((sum, a) => sum + a.tickets.length, 0);
    const highUsage = liveAccounts.filter((a) => usagePct(a) >= 85).length;
    return { total, attention, openTickets, highUsage };
  }, [liveAccounts]);

  const hasActiveFilters = query.trim() !== '' || planFilter !== 'ALL' || attentionFilter !== 'all';

  const resetFilters = () => {
    setQuery('');
    setPlanFilter('ALL');
    setAttentionFilter('all');
    setStatusMessage('Cleared all account filters');
  };

  return (
    <section aria-labelledby="account-explorer-heading" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.16em', color: NEON.blue }}>
            CUSTOMER TELEMETRY · ZERO-KNOWLEDGE ENCLAVE
          </div>
          <h1
            id="account-explorer-heading"
            style={{
              margin: '4px 0 0',
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(1.25rem, 2.2vw, 1.75rem)',
              color: '#F8FAFC',
              letterSpacing: '0.06em',
            }}
          >
            ACCOUNT EXPLORER
          </h1>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={statPill(NEON.blue)}>
            <span style={statLabel}>TOTAL ACCOUNTS</span>
            <strong style={statValue}>{summary.total}</strong>
          </div>
          <div style={statPill(NEON.magenta)}>
            <span style={statLabel}>NEEDS ATTENTION</span>
            <strong style={statValue}>{summary.attention}</strong>
          </div>
          <div style={statPill(NEON.orange)}>
            <span style={statLabel}>OPEN TICKETS</span>
            <strong style={statValue}>{summary.openTickets}</strong>
          </div>
          <div style={statPill(NEON.yellow)}>
            <span style={statLabel}>HIGH USAGE (85%+)</span>
            <strong style={statValue}>{summary.highUsage}</strong>
          </div>
        </div>
      </header>

      {/* Search & Filter Controls */}
      <div
        style={{
          background: NEON.bgCard,
          border: `1px solid ${NEON.border}`,
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={16}
              aria-hidden="true"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: NEON.blue }}
            />
            <label htmlFor="account-search-input" className="sr-only">
              Search accounts by name, email, organization, ID, or plan
            </label>
            <input
              id="account-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, organization, email, or account ID…"
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: 8,
                background: '#060c1a',
                border: `1px solid ${NEON.border}`,
                color: '#F8FAFC',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} aria-hidden="true" style={{ color: NEON.textMuted }} />
            <label htmlFor="plan-filter-select" className="sr-only">
              Filter by plan
            </label>
            <select
              id="plan-filter-select"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as 'ALL' | AccountPlan)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: '#060c1a',
                border: `1px solid ${NEON.border}`,
                color: '#F8FAFC',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Plans</option>
              <option value="Sentinel Enterprise">Sentinel Enterprise</option>
              <option value="Enclave Pro">Enclave Pro</option>
              <option value="Sovereign Free">Sovereign Free</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(255,46,159,0.12)',
                border: `1px solid rgba(255,46,159,0.4)`,
                color: NEON.magenta,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <X size={14} aria-hidden="true" />
              CLEAR
            </button>
          )}
        </div>

        {/* Attention Filter Chips */}
        <div role="group" aria-label="Attention filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {(
            [
              { id: 'all', label: 'All Accounts' },
              { id: 'needs_attention', label: 'Needs Attention' },
              { id: 'high_usage', label: 'High Usage (≥85%)' },
              { id: 'urgent_tickets', label: 'Critical / High Tickets' },
              { id: 'inactive', label: 'Inactive (14d+)' },
              { id: 'billing_risk', label: 'Billing / Trial Risk' },
            ] as { id: AttentionFilter; label: string }[]
          ).map((chip) => {
            const active = attentionFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => setAttentionFilter(chip.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: active ? 'rgba(0,212,255,0.16)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? NEON.blue : 'rgba(0,212,255,0.16)'}`,
                  color: active ? '#F8FAFC' : NEON.textMuted,
                }}
              >
                {chip.label}
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', color: NEON.textMuted }}>
            SHOWING {filteredAndSorted.length} OF {liveAccounts.length}
          </span>
        </div>
      </div>

      {/* Visually hidden live region for sort/filter announcements */}
      <div role="status" className="sr-only">
        {statusMessage}
      </div>

      {/* Main Split: Responsive Sortable Table + Account Detail Panel */}
      <div className="explorer-grid">
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="account-explorer-caption"
          className="account-table-wrapper"
        >
          <table className="account-table">
            <caption id="account-explorer-caption" className="sr-only">
              Customer accounts showing plan, recent usage, open support tickets, and attention status
            </caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortKey === 'name' ? sortDir : undefined}>
                  <button type="button" onClick={() => handleSort('name', 'Customer')}>
                    <span>Customer</span>
                    <span className="sort-indicator" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === 'plan' ? sortDir : undefined}>
                  <button type="button" onClick={() => handleSort('plan', 'Plan')}>
                    <span>Plan</span>
                    <span className="sort-indicator" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === 'usage' ? sortDir : undefined}>
                  <button type="button" onClick={() => handleSort('usage', 'Recent Usage')}>
                    <span>Recent Usage</span>
                    <span className="sort-indicator" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === 'tickets' ? sortDir : undefined}>
                  <button type="button" onClick={() => handleSort('tickets', 'Open Tickets')}>
                    <span>Open Tickets</span>
                    <span className="sort-indicator" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === 'lastActive' ? sortDir : undefined}>
                  <button type="button" onClick={() => handleSort('lastActive', 'Last Active')}>
                    <span>Last Active</span>
                    <span className="sort-indicator" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col">Attention</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: NEON.textMuted }}>
                    No customer accounts match the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((acc) => {
                  const pct = usagePct(acc);
                  const reasons = getAttentionReasons(acc);
                  const sev = highestSeverity(acc);
                  const isSelected = selectedAccount?.id === acc.id;

                  return (
                    <tr
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      data-selected={isSelected ? 'true' : 'false'}
                      style={{ cursor: 'pointer' }}
                    >
                      <th scope="row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{acc.name}</span>
                          <span style={{ fontSize: '0.75rem', color: NEON.textMuted, fontWeight: 400 }}>
                            {acc.organization} · {acc.id}
                          </span>
                        </div>
                      </th>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: 6,
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            border: `1px solid ${
                              acc.plan === 'Sentinel Enterprise'
                                ? 'rgba(0,212,255,0.45)'
                                : acc.plan === 'Enclave Pro'
                                  ? 'rgba(188,19,254,0.45)'
                                  : 'rgba(255,122,24,0.4)'
                            }`,
                            color:
                              acc.plan === 'Sentinel Enterprise'
                                ? NEON.blue
                                : acc.plan === 'Enclave Pro'
                                  ? NEON.purple
                                  : NEON.orange,
                          }}
                        >
                          {acc.plan}
                        </span>
                      </td>
                      <td data-value={pct}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ color: pct >= 85 ? NEON.orange : '#F8FAFC', fontWeight: 600 }}>
                              {pct}%
                            </span>
                            <span style={{ color: NEON.textMuted, fontSize: '0.74rem' }}>
                              {acc.recentUsageCount.toLocaleString()} / {acc.monthlyQuotaLimit.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, pct)}%`,
                                background: pct >= 90 ? NEON.magenta : pct >= 85 ? NEON.orange : NEON.green,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td data-value={acc.tickets.length}>
                        {acc.tickets.length === 0 ? (
                          <span style={{ color: NEON.green, fontSize: '0.82rem' }}>0 open</span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              color: sev ? severityColor(sev) : '#F8FAFC',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                            }}
                          >
                            <LifeBuoy size={14} aria-hidden="true" />
                            {acc.tickets.length} ({sev})
                          </span>
                        )}
                      </td>
                      <td data-value={acc.lastActiveDaysAgo}>
                        <span style={{ color: acc.lastActiveDaysAgo >= 14 ? NEON.yellow : NEON.text }}>
                          {acc.lastActiveLabel}
                        </span>
                      </td>
                      <td>
                        {reasons.length === 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: NEON.green, fontSize: '0.8rem' }}>
                            <CheckCircle2 size={14} aria-hidden="true" />
                            Healthy
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: NEON.magenta, fontSize: '0.8rem', fontWeight: 600 }}>
                            <AlertTriangle size={14} aria-hidden="true" />
                            {reasons.length} {reasons.length === 1 ? 'flag' : 'flags'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Account Detail Panel */}
        <aside
          aria-label="Selected account details"
          style={{
            background: NEON.bgCard,
            border: `1px solid ${NEON.border}`,
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {selectedAccount ? (
            <>
              <div style={{ borderBottom: `1px solid ${NEON.border}`, paddingBottom: 12 }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', color: NEON.blue }}>
                  {selectedAccount.id} · {selectedAccount.plan.toUpperCase()}
                </div>
                <h2 style={{ margin: '4px 0 2px', fontSize: '1.15rem', color: '#F8FAFC', fontFamily: "'Orbitron', monospace" }}>
                  {selectedAccount.name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: NEON.textMuted }}>
                  {selectedAccount.organization} · {selectedAccount.email}
                </div>
              </div>

              {/* Attention Flags */}
              <div>
                <div style={sectionTitle}>ATTENTION SIGNALS</div>
                {getAttentionReasons(selectedAccount).length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: NEON.green, fontSize: '0.88rem' }}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    No attention flags. Account operating normally.
                  </div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, color: NEON.magenta, fontSize: '0.88rem' }}>
                    {getAttentionReasons(selectedAccount).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Usage & Billing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={miniCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: NEON.blue, fontSize: '0.72rem', fontFamily: "'Share Tech Mono', monospace" }}>
                    <TrendingUp size={13} aria-hidden="true" /> USAGE TREND
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                    {selectedAccount.usageTrendPct >= 0 ? `+${selectedAccount.usageTrendPct}%` : `${selectedAccount.usageTrendPct}%`}
                  </div>
                </div>
                <div style={miniCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: NEON.orange, fontSize: '0.72rem', fontFamily: "'Share Tech Mono', monospace" }}>
                    <CreditCard size={13} aria-hidden="true" /> BILLING
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: selectedAccount.billingStatus === 'healthy' ? NEON.green : NEON.magenta, marginTop: 4 }}>
                    {selectedAccount.billingStatus.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Open Support Tickets */}
              <div>
                <div style={sectionTitle}>
                  OPEN SUPPORT TICKETS ({selectedAccount.tickets.length})
                </div>
                {selectedAccount.tickets.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: NEON.textMuted }}>
                    No open support tickets.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedAccount.tickets.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: '#060c1a',
                          border: `1px solid ${severityColor(t.severity)}44`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: severityColor(t.severity) }}>
                            <ShieldAlert size={12} aria-hidden="true" style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }} />
                            {t.id} · {t.severity.toUpperCase()}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: NEON.textMuted }}>
                            <Clock size={11} aria-hidden="true" /> {t.openedAt}
                          </span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: '0.86rem', color: '#F8FAFC', lineHeight: 1.35 }}>
                          {t.subject}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: NEON.textMuted, fontSize: '0.9rem' }}>
              Select an account to inspect its plan, usage, and support tickets.
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
          border: 0;
        }

        .explorer-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 18px;
          align-items: start;
        }

        @media (max-width: 1120px) {
          .explorer-grid {
            grid-template-columns: 1fr;
          }
        }

        .account-table-wrapper {
          overflow: auto;
          max-inline-size: 100%;
          max-block-size: min(620px, 72vh);
          container-type: inline-size;
          background: rgba(10, 18, 38, 0.85);
          border: 1px solid rgba(0, 212, 255, 0.18);
          border-radius: 12px;
        }

        .account-table {
          width: 100%;
          min-inline-size: 680px;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
          font-size: 0.9rem;
        }

        .account-table thead {
          position: sticky;
          inset-block-start: 0;
          z-index: 2;
          background: #070e22;
        }

        .account-table th,
        .account-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 212, 255, 0.12);
          vertical-align: middle;
        }

        .account-table thead th {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #00d4ff;
          white-space: nowrap;
        }

        .account-table thead th:has(> button) {
          padding: 0;
        }

        .account-table thead th > button {
          width: 100%;
          min-height: 40px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: transparent;
          border: 0;
          color: inherit;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          cursor: pointer;
        }

        .account-table thead th > button:focus-visible {
          outline: 2px solid #00d4ff;
          outline-offset: -2px;
        }

        .sort-indicator::after {
          content: '⇅';
          opacity: 0.35;
          font-size: 0.75rem;
        }

        th[aria-sort='ascending'] .sort-indicator::after {
          content: '▲';
          opacity: 1;
          color: #00ff87;
        }

        th[aria-sort='descending'] .sort-indicator::after {
          content: '▼';
          opacity: 1;
          color: #00ff87;
        }

        .account-table tbody th {
          position: sticky;
          inset-inline-start: 0;
          z-index: 1;
          background: #0a1226;
        }

        .account-table tbody tr[data-selected='true'] {
          background: rgba(0, 212, 255, 0.1);
        }

        .account-table tbody tr[data-selected='true'] th {
          background: #0d1a36;
        }

        .account-table tbody tr:hover {
          background: rgba(0, 212, 255, 0.06);
        }

        @container (width < 600px) {
          .account-table {
            min-inline-size: 0;
            --label-2: "Plan";
            --label-3: "Recent Usage";
            --label-4: "Open Tickets";
            --label-5: "Last Active";
            --label-6: "Attention";
          }

          .account-table,
          .account-table thead,
          .account-table tbody,
          .account-table tr,
          .account-table th,
          .account-table td {
            display: block;
          }

          .account-table thead {
            display: none;
          }

          .account-table tbody tr {
            margin-bottom: 12px;
            border: 1px solid rgba(0, 212, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
          }

          .account-table tbody th {
            position: sticky;
            inset-block-start: 0;
            z-index: 2;
            background: #0d1a36;
          }

          .account-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .account-table tbody td:nth-child(2)::before { content: var(--label-2) ": "; color: rgba(180,190,220,0.65); font-size: 0.78rem; }
          .account-table tbody td:nth-child(3)::before { content: var(--label-3) ": "; color: rgba(180,190,220,0.65); font-size: 0.78rem; }
          .account-table tbody td:nth-child(4)::before { content: var(--label-4) ": "; color: rgba(180,190,220,0.65); font-size: 0.78rem; }
          .account-table tbody td:nth-child(5)::before { content: var(--label-5) ": "; color: rgba(180,190,220,0.65); font-size: 0.78rem; }
          .account-table tbody td:nth-child(6)::before { content: var(--label-6) ": "; color: rgba(180,190,220,0.65); font-size: 0.78rem; }
        }
      `}</style>
    </section>
  );
};

const statPill = (accent: string): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 12px',
  borderRadius: 8,
  background: 'rgba(10, 18, 38, 0.85)',
  border: `1px solid ${accent}44`,
});

const statLabel: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  color: NEON.textMuted,
};

const statValue: React.CSSProperties = {
  fontFamily: "'Orbitron', monospace",
  fontSize: '1rem',
  color: '#F8FAFC',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '0.68rem',
  letterSpacing: '0.12em',
  color: NEON.blue,
  marginBottom: 8,
};

const miniCard: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  background: '#060c1a',
  border: `1px solid ${NEON.border}`,
};
