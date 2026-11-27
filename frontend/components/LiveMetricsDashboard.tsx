import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Calendar, ShieldCheck, Activity, Database } from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { NEON, FONTS, GRADIENT_BORDER } from '../theme';
import {
  fetchLiveFirestoreMetrics,
  type DateFilter,
  type DateRangePreset,
  type DailyMetricPoint,
  type LiveMetricsSummary,
} from '../services/liveMetricsService';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface TrendChartProps {
  title: string;
  subtitle: string;
  series: DailyMetricPoint[];
  primaryKey: keyof DailyMetricPoint;
  primaryLabel: string;
  primaryColor: string;
  secondaryKey?: keyof DailyMetricPoint;
  secondaryLabel?: string;
  secondaryColor?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  subtitle,
  series,
  primaryKey,
  primaryLabel,
  primaryColor,
  secondaryKey,
  secondaryLabel,
  secondaryColor,
}) => {
  const width = 560;
  const height = 180;
  const padX = 36;
  const padY = 20;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const maxVal = Math.max(
    1,
    ...series.map((d) =>
      Math.max(
        Number(d[primaryKey] ?? 0),
        secondaryKey ? Number(d[secondaryKey] ?? 0) : 0
      )
    )
  );

  const toPoints = (key: keyof DailyMetricPoint) =>
    series
      .map((d, i) => {
        const x = series.length === 1 ? padX + plotW / 2 : padX + (i / (series.length - 1)) * plotW;
        const val = Number(d[key] ?? 0);
        const y = padY + plotH - (val / maxVal) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div
      style={{
        background: NEON.bgCard,
        border: `1px solid ${NEON.border}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: FONTS.orbitron, fontSize: '0.82rem', color: NEON.text, letterSpacing: '0.06em' }}>
            {title}
          </h3>
          <p style={{ margin: '2px 0 0', fontFamily: FONTS.mono, fontSize: '0.68rem', color: NEON.textMuted }}>
            {subtitle}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, fontFamily: FONTS.mono, fontSize: '0.66rem' }}>
          <span style={{ color: primaryColor }}>● {primaryLabel}</span>
          {secondaryKey && secondaryLabel && secondaryColor && (
            <span style={{ color: secondaryColor }}>● {secondaryLabel}</span>
          )}
        </div>
      </div>

      {series.length === 0 ? (
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px dashed ${NEON.border}`,
            borderRadius: 8,
            fontFamily: FONTS.mono,
            fontSize: '0.75rem',
            color: NEON.textMuted,
          }}
        >
          No live Firestore records in selected date range.
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {[0, 0.5, 1].map((t) => {
            const y = padY + plotH - t * plotH;
            const label = Math.round(t * maxVal);
            return (
              <g key={t}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="rgba(0,212,255,0.12)" strokeDasharray="3 3" />
                <text x={padX - 6} y={y + 3} textAnchor="end" fill={NEON.textMuted} fontSize="9" fontFamily={FONTS.mono}>
                  {label}
                </text>
              </g>
            );
          })}

          <polyline
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={toPoints(primaryKey)}
          />
          {secondaryKey && secondaryColor && (
            <polyline
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={toPoints(secondaryKey)}
            />
          )}

          {series.map((d, i) => {
            const x = series.length === 1 ? padX + plotW / 2 : padX + (i / (series.length - 1)) * plotW;
            const y = padY + plotH - (Number(d[primaryKey] ?? 0) / maxVal) * plotH;
            return (
              <g key={d.date}>
                <circle cx={x} cy={y} r="3.5" fill={primaryColor} />
                {(i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2)) && (
                  <text x={x} y={height - 2} textAnchor="middle" fill={NEON.textMuted} fontSize="9" fontFamily={FONTS.mono}>
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export const LiveMetricsDashboard: React.FC = () => {
  const { user } = useSovereign();
  const [filter, setFilter] = useState<DateFilter>({ preset: '30d' });
  const [summary, setSummary] = useState<LiveMetricsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(REFRESH_INTERVAL_MS / 1000);
  const requestTimestampsRef = useRef<number[]>([]);

  const loadMetrics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    const now = Date.now();
    requestTimestampsRef.current = requestTimestampsRef.current.filter((ts) => now - ts < 60_000);
    requestTimestampsRef.current.push(now);

    try {
      const data = await fetchLiveFirestoreMetrics(user.id, filter, requestTimestampsRef.current.length);
      setSummary(data);
      setSecondsUntilRefresh(REFRESH_INTERVAL_MS / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query live Firestore metrics');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    void loadMetrics();
    const refreshTimer = window.setInterval(() => {
      void loadMetrics();
    }, REFRESH_INTERVAL_MS);

    const countdownTimer = window.setInterval(() => {
      setSecondsUntilRefresh((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(countdownTimer);
    };
  }, [loadMetrics]);

  const setPreset = (preset: DateRangePreset) => {
    setFilter((prev) => ({ ...prev, preset }));
  };

  const mins = Math.floor(secondsUntilRefresh / 60);
  const secs = String(secondsUntilRefresh % 60).padStart(2, '0');

  return (
    <section style={{ padding: '20px 24px 80px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          padding: 1,
          borderRadius: 14,
          background: GRADIENT_BORDER,
        }}
      >
        <div
          style={{
            background: NEON.bg,
            borderRadius: 13,
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} color={NEON.blue} />
              <span style={{ fontFamily: FONTS.orbitron, fontSize: '0.95rem', color: NEON.text, letterSpacing: '0.08em' }}>
                LIVE TELEMETRY &amp; METRICS DASHBOARD
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontFamily: FONTS.mono, fontSize: '0.7rem', color: NEON.textMuted }}>
              Source: {summary?.source ?? 'Cloud Firestore (users/{uid}/receipts)'} · Auto-refresh: 5m ({mins}:{secs})
              {summary?.lastRefreshedAt ? ` · Updated ${new Date(summary.lastRefreshedAt).toLocaleTimeString()}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color={NEON.orange} />
            {(['7d', '30d', '90d', 'all', 'custom'] as DateRangePreset[]).map((p) => {
              const active = filter.preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: FONTS.mono,
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    background: active ? 'rgba(0,212,255,0.16)' : NEON.surface,
                    border: `1px solid ${active ? NEON.blue : NEON.border}`,
                    color: active ? NEON.blue : NEON.textMuted,
                  }}
                >
                  {p}
                </button>
              );
            })}

            {filter.preset === 'custom' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="date"
                  value={filter.startDate ?? ''}
                  onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
                  style={{
                    background: NEON.bgCard,
                    color: NEON.text,
                    border: `1px solid ${NEON.border}`,
                    borderRadius: 6,
                    padding: '4px 6px',
                    fontFamily: FONTS.mono,
                    fontSize: '0.68rem',
                  }}
                />
                <span style={{ color: NEON.textMuted, fontFamily: FONTS.mono, fontSize: '0.68rem' }}>to</span>
                <input
                  type="date"
                  value={filter.endDate ?? ''}
                  onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
                  style={{
                    background: NEON.bgCard,
                    color: NEON.text,
                    border: `1px solid ${NEON.border}`,
                    borderRadius: 6,
                    padding: '4px 6px',
                    fontFamily: FONTS.mono,
                    fontSize: '0.68rem',
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => void loadMetrics()}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                cursor: loading ? 'wait' : 'pointer',
                background: 'rgba(0,255,135,0.12)',
                border: `1px solid ${NEON.green}`,
                color: NEON.green,
                fontFamily: FONTS.mono,
                fontSize: '0.7rem',
              }}
            >
              <RefreshCw size={13} />
              {loading ? 'SYNCING...' : 'REFRESH NOW'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255,46,159,0.12)',
            border: `1px solid ${NEON.magenta}`,
            color: NEON.magenta,
            fontFamily: FONTS.mono,
            fontSize: '0.75rem',
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          {
            label: 'KNOXED VECTORS',
            value: `${summary?.knoxedVectors ?? 0} / ${summary?.totalVectors ?? 16}`,
            color: NEON.green,
            icon: <ShieldCheck size={15} color={NEON.green} />,
          },
          {
            label: 'VERIFICATION RECEIPTS',
            value: String(summary?.totalReceipts ?? 0),
            color: NEON.blue,
            icon: <Database size={15} color={NEON.blue} />,
          },
          {
            label: 'AVG DAILY SCANS',
            value: String(summary?.avgDailyScans ?? 0),
            color: NEON.orange,
            icon: <Activity size={15} color={NEON.orange} />,
          },
          {
            label: 'API RATE (RPM / CAP)',
            value: `${summary?.currentRpm ?? 0} / ${summary?.rpmLimit ?? 15}`,
            color: NEON.magenta,
            icon: <Activity size={15} color={NEON.magenta} />,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: NEON.bgCard,
              border: `1px solid ${NEON.border}`,
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '0.66rem', color: NEON.textMuted }}>{kpi.label}</span>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.25rem', color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14 }}>
        <TrendChart
          title="IDENTITY VECTOR SCANS & KNOXED STATUS"
          subtitle="Daily vector scans vs. sealed KNOXED vectors"
          series={summary?.series ?? []}
          primaryKey="vectorScans"
          primaryLabel="Vector Scans"
          primaryColor={NEON.blue}
          secondaryKey="knoxedCount"
          secondaryLabel="KNOXED"
          secondaryColor={NEON.green}
        />
        <TrendChart
          title="SECURITY AUDIT & VERIFICATION RECEIPTS"
          subtitle="Daily SHA-256 receipts & cumulative total"
          series={summary?.series ?? []}
          primaryKey="receiptCount"
          primaryLabel="Daily Receipts"
          primaryColor={NEON.magenta}
          secondaryKey="cumulativeReceipts"
          secondaryLabel="Cumulative"
          secondaryColor={NEON.orange}
        />
        <TrendChart
          title="API REQUEST RATE & QUOTA USAGE"
          subtitle="Requests per day & peak RPM (15 RPM hard cap)"
          series={summary?.series ?? []}
          primaryKey="apiRequests"
          primaryLabel="API Requests"
          primaryColor={NEON.orange}
          secondaryKey="peakRpm"
          secondaryLabel="Peak RPM"
          secondaryColor={NEON.blue}
        />
      </div>
    </section>
  );
};
