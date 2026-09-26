import React from 'react';
import { useScan } from '../../ScanContext';

const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  bgCard: "rgba(8, 18, 40, 0.85)",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
};

const GlassCard = ({ children, style = {}, className = "" }: any) => (
  <div className={`neon-border ${className}`} style={{
    background: NEON.bgCard, backdropFilter: "blur(20px)", borderRadius: 12,
    border: "1px solid rgba(0,212,255,0.15)", position: "relative", ...style
  }}>
    {children}
  </div>
);

const StatusBadge = ({ type }: any) => {
  const cfg: Record<string, any> = {
    NUKED: { color: NEON.magenta, label: "🔥 NUKED" },
    KNOXED: { color: NEON.blue, label: "🛡️ KNOXED" },
    MONITORED: { color: NEON.orange, label: "👁️ MONITORED" },
    SCANNING: { color: "#FFD700", label: "⟳ SCANNING" },
  };
  const c = cfg[type] || cfg.MONITORED;
  return (
    <span style={{ color: c.color, fontSize: "0.6rem", fontWeight: 700, fontFamily: "'Orbitron', monospace" }}>
      {c.label}
    </span>
  );
};

export const ActivitySidebar: React.FC = () => {
  const { findings, isScanning, currentModule, currentSubTask, vectors } = useScan();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {/* Live Monitoring Section */}
      <GlassCard style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0f0', boxShadow: '0 0 8px #0f0', animation: 'pulse-border 1.5s infinite' }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.7rem', fontWeight: 700, color: NEON.blue, letterSpacing: '0.1em' }}>LIVE MONITORING</span>
          </div>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: NEON.blue, cursor: 'pointer' }}>View All</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isScanning ? (
            <div style={{ padding: '12px', background: 'rgba(0,212,255,0.06)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.2)', animation: 'pulse-border 2s infinite' }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.8rem', color: NEON.blue }}>{currentModule || 'Scanning...'}</div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: NEON.textMuted }}>{currentSubTask || 'Analyzing vectors...'}</div>
            </div>
          ) : (
            vectors.slice(0, 6).map((m: any) => (
              <div key={m.moduleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: NEON.blue, fontSize: '0.9rem' }}>{m.icon}</span>
                  <span style={{ fontFamily: 'Rajdhani', fontSize: '0.75rem', color: NEON.text }}>{m.label}</span>
                </div>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: m.lastScanned ? (m.thirdPartyVerified ? '#00FF87' : NEON.orange) : NEON.textMuted }}>
                  {m.lastScanned ? (m.thirdPartyVerified ? 'Verified' : 'Unverified') : 'Not scanned'}
                </span>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Recent Activity Section */}
      <GlassCard style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.7rem', fontWeight: 700, color: NEON.blue, letterSpacing: '0.1em' }}>RECENT ACTIVITY</span>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: NEON.blue, cursor: 'pointer' }}>View All</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {findings.length > 0 ? (
            findings.slice(0, 8).map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0', borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Rajdhani', fontSize: '0.75rem', color: NEON.text, fontWeight: 500 }}>{f.finding}</span>
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: NEON.textMuted }}>{f.timestamp ? new Date(f.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <StatusBadge type={f.status} />
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: NEON.textMuted }}>{f.module}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: NEON.textMuted, fontFamily: 'Share Tech Mono', fontSize: '0.7rem', marginTop: '20px' }}>
              No recent activity detected.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
