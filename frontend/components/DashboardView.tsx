import React from 'react';
import { NEON } from '../theme';
import { MODULE_CONFIGS } from '../module-config';
import { ModuleReceipt } from '../services/moduleAgents';
import { Sha256Badge } from './Sha256Badge';

interface Props {
  receipts: ModuleReceipt[];
  sovereignId: string | null;
  onSelectModule: (moduleId: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  MATCH_FOUND: NEON.magenta,
  VERIFIED: NEON.green,
  CHECKED_NO_MATCH: NEON.blue,
  LOCAL_CHECK_PASSED: NEON.green,
  LOCAL_CHECK_FAILED: NEON.magenta,
  ARTEFACT_GENERATED: NEON.blue,
  SELF_ATTESTED: NEON.orange,
  API_UNREACHABLE: NEON.orange,
};

/** Real posture only: counts derive exclusively from actual receipts. */
export const DashboardView: React.FC<Props> = ({ receipts, sovereignId, onSelectModule }) => {
  const modules = Object.values(MODULE_CONFIGS);
  const latestByModule = new Map<string, ModuleReceipt>();
  for (const r of receipts) latestByModule.set(r.moduleId, r);
  const sealedCount = latestByModule.size;
  const matches = receipts.filter((r) => r.verification.status === 'MATCH_FOUND').length;
  const verified = receipts.filter((r) => ['VERIFIED', 'CHECKED_NO_MATCH', 'LOCAL_CHECK_PASSED'].includes(r.verification.status)).length;
  const selfAttested = receipts.filter((r) => r.verification.status === 'SELF_ATTESTED').length;

  const kpis = [
    { label: 'VECTORS SEALED', value: `${sealedCount}/16`, sub: 'Agent-gated receipts', color: NEON.blue },
    { label: 'THIRD-PARTY / DEVICE VERIFIED', value: String(verified), sub: 'Real checks, named sources', color: NEON.green },
    { label: 'EXPOSURES CONFIRMED', value: String(matches), sub: 'MATCH_FOUND receipts', color: NEON.magenta },
    { label: 'SELF-ATTESTED (HONEST)', value: String(selfAttested), sub: 'No free API exists — stated', color: NEON.orange },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.2em', marginBottom: 6 }}>
            DIGITAL IDENTITY FEDERATED FOOTPRINT
          </div>
          <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '1.6rem', fontWeight: 900, color: NEON.blue, textShadow: `0 0 16px ${NEON.blue}55` }}>
            DIFF COMMAND CENTER
          </h1>
          <p style={{ color: NEON.textMuted, fontSize: '0.85rem', marginTop: 6, maxWidth: 620 }}>
            16 identity vectors, each gated by a Module Agent: validate → SHA-256 → AES-256-GCM →
            third-party verify where a free API honestly exists → sealed receipt. No simulated data — ever.
          </p>
        </div>
        {sovereignId && <Sha256Badge hash={sovereignId} label="YOUR SOVEREIGN SHA-256 ID" size="md" />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 26 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: NEON.bgCard, border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.56rem', color: NEON.textMuted, letterSpacing: '0.1em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.7rem', fontWeight: 900, color: k.color, textShadow: `0 0 12px ${k.color}66` }}>{k.value}</div>
            <div style={{ fontSize: '0.7rem', color: NEON.textMuted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {sealedCount === 0 && (
        <div style={{ border: `1px dashed ${NEON.blue}66`, borderRadius: 12, padding: '16px 18px', marginBottom: 22, color: NEON.text, fontSize: '0.85rem' }}>
          <strong style={{ color: NEON.blue }}>Nothing sealed yet — and nothing faked.</strong>{' '}
          Start with <button type="button" onClick={() => onSelectModule('communication')} style={{ background: 'none', border: 'none', color: NEON.green, cursor: 'pointer', fontWeight: 700, padding: 0 }}>Communication</button> for a
          real breach check (XposedOrNot + Have I Been Pwned k-anonymity), then work through the vectors.
          Every completed module lights up its SHA-256 ID here.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {modules.map((m, i) => {
          const receipt = latestByModule.get(m.id);
          const color = receipt ? STATUS_COLOR[receipt.verification.status] : 'rgba(255,255,255,0.25)';
          return (
            <button
              key={m.id} type="button" onClick={() => onSelectModule(m.id)}
              style={{
                textAlign: 'left', background: NEON.bgCard, border: `1px solid ${receipt ? color + '55' : 'rgba(0,212,255,0.14)'}`,
                borderRadius: 12, padding: 15, cursor: 'pointer', color: NEON.text,
                boxShadow: receipt ? `0 0 14px ${color}22` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.textMuted }}>
                  VECTOR {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: "'Orbitron', monospace", fontSize: '0.55rem', fontWeight: 700, color,
                  border: `1px solid ${color}66`, borderRadius: 999, padding: '2px 8px',
                }}>
                  {receipt ? receipt.verification.status.replace(/_/g, ' ') : 'NOT SEALED'}
                </span>
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.92rem', marginBottom: 5 }}>{m.name}</div>
              <div style={{ fontSize: '0.72rem', color: NEON.textMuted, lineHeight: 1.45, minHeight: 32 }}>{m.thematicHook}</div>
              {receipt && (
                <div style={{ marginTop: 10 }}>
                  <Sha256Badge hash={receipt.sha256Id} label="SHA-256" />
                  <div style={{ fontSize: '0.62rem', color: NEON.textMuted, marginTop: 7, fontFamily: "'Share Tech Mono', monospace" }}>
                    {receipt.verification.source} · {receipt.sealedAt.slice(0, 10)} · {receipt.storage}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
