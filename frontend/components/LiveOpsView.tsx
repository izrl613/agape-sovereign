import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  Pause,
  Play,
  RefreshCw,
  Rocket,
  Send,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';
import { FONTS, NEON } from '../theme';
import { GlassCard, NeonButton } from './ui';

type DeployStatus = 'SUCCEEDED' | 'IN_PROGRESS' | 'ROLLING_BACK' | 'FAILED';
type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';
type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING';

interface DeployItem {
  id: string;
  service: string;
  version: string;
  commit: string;
  owner: string;
  env: 'prod' | 'staging';
  status: DeployStatus;
  durationSec: number;
  timestamp: string;
}

interface IncidentUpdate {
  id: string;
  timestamp: string;
  author: string;
  status: IncidentStatus;
  message: string;
}

interface IncidentItem {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner: string;
  ownerRole: string;
  service: string;
  startedAt: string;
  errorRateImpact: string;
  updates: IncidentUpdate[];
}

interface ErrorPoint {
  time: string;
  rate: number;
}

const INITIAL_DEPLOYS: DeployItem[] = [
  {
    id: 'dep-9042',
    service: 'enclave-auth',
    version: 'v2.18.4',
    commit: '8f3a1c9',
    owner: 'm.chen',
    env: 'prod',
    status: 'SUCCEEDED',
    durationSec: 42,
    timestamp: '2m ago',
  },
  {
    id: 'dep-9041',
    service: 'vector-worker',
    version: 'v4.3.1',
    commit: 'c41d0e2',
    owner: 'a.patel',
    env: 'prod',
    status: 'ROLLING_BACK',
    durationSec: 68,
    timestamp: '9m ago',
  },
  {
    id: 'dep-9040',
    service: 'api-gateway',
    version: 'v3.11.0',
    commit: '19b7f44',
    owner: 's.okafor',
    env: 'prod',
    status: 'IN_PROGRESS',
    durationSec: 27,
    timestamp: '14m ago',
  },
  {
    id: 'dep-9039',
    service: 'kms-signer',
    version: 'v1.9.2',
    commit: '77e2a10',
    owner: 'd.kim',
    env: 'staging',
    status: 'SUCCEEDED',
    durationSec: 35,
    timestamp: '31m ago',
  },
  {
    id: 'dep-9038',
    service: 'audit-ledger',
    version: 'v2.4.0',
    commit: '50a9d81',
    owner: 'r.silva',
    env: 'prod',
    status: 'FAILED',
    durationSec: 54,
    timestamp: '48m ago',
  },
];

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-412',
    title: 'Elevated 5xx spike on vector-worker attestation pipeline',
    severity: 'SEV-1',
    status: 'INVESTIGATING',
    owner: 'Aarav Patel',
    ownerRole: 'Primary On-Call · SRE',
    service: 'vector-worker',
    startedAt: '11m ago',
    errorRateImpact: '+2.4% 5xx',
    updates: [
      {
        id: 'u-1',
        timestamp: '06:31 EST',
        author: 'PagerDuty Bot',
        status: 'INVESTIGATING',
        message: 'Alert triggered: vector-worker 5xx error rate crossed 2.5% SLO threshold in us-east1.',
      },
      {
        id: 'u-2',
        timestamp: '06:34 EST',
        author: 'Aarav Patel',
        status: 'INVESTIGATING',
        message: 'Acknowledged incident. Correlating spike with v4.3.1 deploy (commit c41d0e2).',
      },
      {
        id: 'u-3',
        timestamp: '06:38 EST',
        author: 'Aarav Patel',
        status: 'INVESTIGATING',
        message: 'Initiated automated rollback of vector-worker to v4.3.0; monitoring pod drain.',
      },
    ],
  },
  {
    id: 'INC-411',
    title: 'Intermittent WebAuthn challenge timeout on edge PoPs',
    severity: 'SEV-2',
    status: 'IDENTIFIED',
    owner: 'Maya Chen',
    ownerRole: 'Auth Platform Lead',
    service: 'enclave-auth',
    startedAt: '37m ago',
    errorRateImpact: '+0.8% 504',
    updates: [
      {
        id: 'u-4',
        timestamp: '06:05 EST',
        author: 'Maya Chen',
        status: 'INVESTIGATING',
        message: 'Seeing elevated p99 latency on /webauthn/verify from EU-West edge nodes.',
      },
      {
        id: 'u-5',
        timestamp: '06:19 EST',
        author: 'Maya Chen',
        status: 'IDENTIFIED',
        message: 'Root cause isolated to stale Redis connection pool after key rotation. Patching poolconfig.',
      },
    ],
  },
  {
    id: 'INC-409',
    title: 'Audit ledger batch export delayed by 4 minutes',
    severity: 'SEV-3',
    status: 'MONITORING',
    owner: 'Rafael Silva',
    ownerRole: 'DataOps Engineer',
    service: 'audit-ledger',
    startedAt: '1h 22m ago',
    errorRateImpact: '0.2% retry',
    updates: [
      {
        id: 'u-6',
        timestamp: '05:20 EST',
        author: 'Rafael Silva',
        status: 'INVESTIGATING',
        message: 'Batch export worker stalled on GCS multipart upload.',
      },
      {
        id: 'u-7',
        timestamp: '05:44 EST',
        author: 'Rafael Silva',
        status: 'MONITORING',
        message: 'Restarted worker with increased chunk timeout. Queue backlog draining normally.',
      },
    ],
  },
];

const INITIAL_SERIES: ErrorPoint[] = [
  { time: '06:00', rate: 0.32 },
  { time: '06:06', rate: 0.41 },
  { time: '06:12', rate: 0.38 },
  { time: '06:18', rate: 0.85 },
  { time: '06:24', rate: 0.72 },
  { time: '06:30', rate: 1.45 },
  { time: '06:36', rate: 2.64 },
  { time: '06:42', rate: 2.18 },
];

const SERVICE_RATES = [
  { service: 'vector-worker', rate: 2.42, slo: 1.0 },
  { service: 'enclave-auth', rate: 0.84, slo: 1.0 },
  { service: 'api-gateway', rate: 0.41, slo: 1.0 },
  { service: 'kms-signer', rate: 0.12, slo: 0.5 },
  { service: 'audit-ledger', rate: 0.24, slo: 1.0 },
];

function severityColor(sev: IncidentSeverity): string {
  if (sev === 'SEV-1') return NEON.magenta;
  if (sev === 'SEV-2') return NEON.orange;
  if (sev === 'SEV-3') return NEON.yellow;
  return NEON.blue;
}

function deployStatusMeta(status: DeployStatus): { color: string; label: string } {
  switch (status) {
    case 'SUCCEEDED':
      return { color: NEON.green, label: 'SUCCEEDED' };
    case 'IN_PROGRESS':
      return { color: NEON.blue, label: 'DEPLOYING' };
    case 'ROLLING_BACK':
      return { color: NEON.orange, label: 'ROLLBACK' };
    case 'FAILED':
      return { color: NEON.magenta, label: 'FAILED' };
  }
}

export const LiveOpsView: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [deploys, setDeploys] = useState<DeployItem[]>(INITIAL_DEPLOYS);
  const [incidents, setIncidents] = useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [errorSeries, setErrorSeries] = useState<ErrorPoint[]>(INITIAL_SERIES);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(INITIAL_INCIDENTS[0].id);
  const [deployFilter, setDeployFilter] = useState<'ALL' | DeployStatus>('ALL');
  const [newUpdateText, setNewUpdateText] = useState('');
  const [lastTick, setLastTick] = useState<string>('06:42:49 EST');

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId) ?? incidents[0],
    [incidents, selectedIncidentId],
  );

  const tickSimulation = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setLastTick(`${hh}:${mm}:${ss} EST`);

    setErrorSeries((prev) => {
      const last = prev[prev.length - 1]?.rate ?? 1.5;
      const delta = (Math.random() - 0.52) * 0.45;
      const nextRate = Math.max(0.15, Math.min(3.2, Number((last + delta).toFixed(2))));
      return [...prev.slice(1), { time: `${hh}:${mm}`, rate: nextRate }];
    });
  };

  useEffect(() => {
    if (!isLive) return;
    const id = window.setInterval(tickSimulation, 4000);
    return () => window.clearInterval(id);
  }, [isLive]);

  const currentErrorRate = errorSeries[errorSeries.length - 1]?.rate ?? 0;
  const sev1Count = incidents.filter((i) => i.severity === 'SEV-1').length;
  const sev2Count = incidents.filter((i) => i.severity === 'SEV-2').length;
  const filteredDeploys =
    deployFilter === 'ALL' ? deploys : deploys.filter((d) => d.status === deployFilter);

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUpdateText.trim();
    if (!trimmed || !selectedIncident) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident.id
          ? {
              ...inc,
              updates: [
                ...inc.updates,
                {
                  id: `u-${Date.now()}`,
                  timestamp: `${hh}:${mm} EST`,
                  author: 'Sovereign Operator',
                  status: inc.status,
                  message: trimmed,
                },
              ],
            }
          : inc,
      ),
    );
    setNewUpdateText('');
  };

  // SVG chart geometry
  const chartW = 520;
  const chartH = 140;
  const maxRate = Math.max(3.0, ...errorSeries.map((p) => p.rate));
  const points = errorSeries
    .map((p, idx) => {
      const x = (idx / Math.max(1, errorSeries.length - 1)) * chartW;
      const y = chartH - (p.rate / maxRate) * (chartH - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const areaPoints = `0,${chartH} ${points} ${chartW},${chartH}`;
  const sloY = chartH - (1.0 / maxRate) * (chartH - 16) - 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: NEON.text,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Activity size={20} color={NEON.blue} />
            LIVE OPERATIONS COMMAND
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.7rem',
              color: NEON.textMuted,
              marginTop: 4,
            }}
          >
            REAL-TIME DEPLOYMENTS · ERROR TELEMETRY · INCIDENT TIMELINES · LAST TICK {lastTick}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NeonButton
            size="sm"
            color={isLive ? NEON.green : NEON.orange}
            onClick={() => setIsLive((v) => !v)}
          >
            {isLive ? <Pause size={13} /> : <Play size={13} />}
            {isLive ? 'LIVE STREAM ON' : 'STREAM PAUSED'}
          </NeonButton>
          <NeonButton size="sm" color={NEON.blue} onClick={tickSimulation}>
            <RefreshCw size={13} />
            REFRESH
          </NeonButton>
        </div>
      </div>

      {/* KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        <GlassCard className="p-4">
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: NEON.textMuted }}>
            RECENT DEPLOYS (24H)
          </div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '1.6rem',
              fontWeight: 700,
              color: NEON.blue,
              marginTop: 6,
            }}
          >
            {deploys.length}
          </div>
          <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.78rem', color: NEON.green }}>
            2 succeeded · 1 rolling back
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: NEON.textMuted }}>
            GLOBAL ERROR RATE
          </div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '1.6rem',
              fontWeight: 700,
              color: currentErrorRate > 1.0 ? NEON.magenta : NEON.green,
              marginTop: 6,
            }}
          >
            {currentErrorRate.toFixed(2)}%
          </div>
          <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.78rem', color: NEON.textMuted }}>
            SLO target: &lt; 1.00%
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: NEON.textMuted }}>
            OPEN INCIDENTS
          </div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '1.6rem',
              fontWeight: 700,
              color: sev1Count > 0 ? NEON.magenta : NEON.orange,
              marginTop: 6,
            }}
          >
            {incidents.length}
          </div>
          <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.78rem', color: NEON.orange }}>
            {sev1Count} SEV-1 · {sev2Count} SEV-2
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: NEON.textMuted }}>
            MEAN TIME TO MITIGATE
          </div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '1.6rem',
              fontWeight: 700,
              color: NEON.yellow,
              marginTop: 6,
            }}
          >
            14m
          </div>
          <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.78rem', color: NEON.green }}>
            -22% vs 7-day baseline
          </div>
        </GlassCard>
      </div>

      {/* Middle Row: Error Rates Chart + Recent Deploys */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {/* Error Rates Panel */}
        <GlassCard className="p-4">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.orbitron,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: NEON.text,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={15} color={NEON.magenta} />
              ERROR RATES (5XX / TIMEOUT %)
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: NEON.magenta }}>
              SLO 1.0%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ width: '100%', height: 140, overflow: 'visible' }}
            role="img"
            aria-label="Live error rate trend"
          >
            <defs>
              <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NEON.magenta} stopOpacity="0.38" />
                <stop offset="100%" stopColor={NEON.magenta} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <line
              x1={0}
              y1={sloY}
              x2={chartW}
              y2={sloY}
              stroke={NEON.orange}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <polygon points={areaPoints} fill="url(#errGrad)" />
            <polyline
              fill="none"
              stroke={NEON.magenta}
              strokeWidth="2.4"
              points={points}
            />
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {SERVICE_RATES.map((s) => {
              const over = s.rate > s.slo;
              const barColor = over ? NEON.magenta : NEON.blue;
              const widthPct = Math.min(100, (s.rate / 3.0) * 100);
              return (
                <div key={s.service} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: '0.68rem',
                      color: NEON.text,
                      width: 112,
                      flexShrink: 0,
                    }}
                  >
                    {s.service}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(232,244,255,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${widthPct}%`,
                        height: '100%',
                        background: barColor,
                        boxShadow: `0 0 8px ${barColor}`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: '0.68rem',
                      color: barColor,
                      width: 48,
                      textAlign: 'right',
                    }}
                  >
                    {s.rate.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Recent Deploys Panel */}
        <GlassCard className="p-4">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.orbitron,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: NEON.text,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Rocket size={15} color={NEON.blue} />
              RECENT DEPLOYS
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['ALL', 'SUCCEEDED', 'ROLLING_BACK', 'FAILED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDeployFilter(f)}
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: '0.6rem',
                    padding: '3px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background:
                      deployFilter === f ? 'rgba(0,212,255,0.16)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      deployFilter === f ? NEON.blue : 'rgba(0,212,255,0.18)'
                    }`,
                    color: deployFilter === f ? NEON.blue : NEON.textMuted,
                  }}
                >
                  {f === 'ROLLING_BACK' ? 'ROLLBACK' : f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredDeploys.map((dep) => {
              const meta = deployStatusMeta(dep.status);
              return (
                <div
                  key={dep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 11px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(0,212,255,0.12)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: FONTS.rajdhani,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: NEON.text,
                      }}
                    >
                      <span>{dep.service}</span>
                      <span style={{ fontFamily: FONTS.mono, fontSize: '0.68rem', color: NEON.blue }}>
                        {dep.version}
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: '0.58rem',
                          padding: '1px 5px',
                          borderRadius: 4,
                          border: `1px solid ${NEON.border}`,
                          color: NEON.textMuted,
                        }}
                      >
                        {dep.env}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: FONTS.mono,
                        fontSize: '0.64rem',
                        color: NEON.textMuted,
                        marginTop: 3,
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <GitBranch size={11} /> {dep.commit}
                      </span>
                      <span>by {dep.owner}</span>
                      <span>{dep.durationSec}s</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: '0.64rem',
                        color: meta.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {dep.status === 'SUCCEEDED' ? (
                        <CheckCircle2 size={12} />
                      ) : dep.status === 'FAILED' ? (
                        <XCircle size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {meta.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: '0.6rem',
                        color: NEON.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {dep.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Open Incidents + Incident Timeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {/* Open Incidents List */}
        <GlassCard className="p-4">
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              color: NEON.text,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <ShieldAlert size={15} color={NEON.orange} />
            OPEN INCIDENTS ({incidents.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.map((inc) => {
              const sevCol = severityColor(inc.severity);
              const active = inc.id === selectedIncident?.id;
              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelectedIncidentId(inc.id)}
                  style={{
                    textAlign: 'left',
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: active ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? NEON.blue : 'rgba(0,212,255,0.14)'}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          color: sevCol,
                          background: `${sevCol}1f`,
                          border: `1px solid ${sevCol}66`,
                        }}
                      >
                        {inc.severity}
                      </span>
                      <span style={{ fontFamily: FONTS.mono, fontSize: '0.68rem', color: NEON.blue }}>
                        {inc.id}
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: '0.62rem',
                          color: NEON.textMuted,
                        }}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <span style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.magenta }}>
                      {inc.errorRateImpact}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: FONTS.rajdhani,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: NEON.text,
                      marginTop: 6,
                    }}
                  >
                    {inc.title}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 12,
                      fontFamily: FONTS.mono,
                      fontSize: '0.64rem',
                      color: NEON.textMuted,
                      marginTop: 6,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: NEON.text }}>
                      <User size={11} color={NEON.blue} /> {inc.owner}
                    </span>
                    <span>{inc.service}</span>
                    <span>started {inc.startedAt}</span>
                    <span>{inc.updates.length} updates</span>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Selected Incident Timeline */}
        {selectedIncident && (
          <GlassCard className="p-4">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 12,
                paddingBottom: 10,
                borderBottom: '1px solid rgba(0,212,255,0.14)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 4,
                      color: severityColor(selectedIncident.severity),
                      border: `1px solid ${severityColor(selectedIncident.severity)}66`,
                    }}
                  >
                    {selectedIncident.severity}
                  </span>
                  <span style={{ fontFamily: FONTS.orbitron, fontSize: '0.82rem', color: NEON.text }}>
                    {selectedIncident.id} · TIMELINE
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: FONTS.rajdhani,
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    color: NEON.text,
                    marginTop: 4,
                  }}
                >
                  {selectedIncident.title}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: '0.66rem',
                    color: NEON.blue,
                    marginTop: 3,
                  }}
                >
                  OWNER: {selectedIncident.owner} ({selectedIncident.ownerRole})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedIncident.updates.map((upd, idx) => (
                <div
                  key={upd.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      paddingTop: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: idx === selectedIncident.updates.length - 1 ? NEON.blue : NEON.green,
                        boxShadow: `0 0 8px ${
                          idx === selectedIncident.updates.length - 1 ? NEON.blue : NEON.green
                        }`,
                        flexShrink: 0,
                      }}
                    />
                    {idx < selectedIncident.updates.length - 1 && (
                      <span
                        style={{
                          width: 1,
                          flex: 1,
                          background: 'rgba(0,212,255,0.22)',
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: FONTS.mono,
                        fontSize: '0.64rem',
                        color: NEON.textMuted,
                      }}
                    >
                      <span style={{ color: NEON.blue }}>{upd.timestamp}</span>
                      <span>·</span>
                      <span style={{ color: NEON.text }}>{upd.author}</span>
                      <span>·</span>
                      <span style={{ color: NEON.orange }}>{upd.status}</span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.inter,
                        fontSize: '0.82rem',
                        color: NEON.text,
                        marginTop: 3,
                        lineHeight: 1.45,
                      }}
                    >
                      {upd.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddUpdate}
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid rgba(0,212,255,0.14)',
              }}
            >
              <input
                type="text"
                value={newUpdateText}
                onChange={(e) => setNewUpdateText(e.target.value)}
                placeholder={`Post timeline update for ${selectedIncident.id}...`}
                aria-label="Post incident timeline update"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.22)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: NEON.text,
                  fontFamily: FONTS.inter,
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <NeonButton type="submit" size="sm" color={NEON.blue} disabled={!newUpdateText.trim()}>
                <Send size={13} />
                POST
              </NeonButton>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
