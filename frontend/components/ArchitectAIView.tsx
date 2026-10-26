import React, { useState } from 'react';
import { NEON, FONTS } from '../theme';
import { NeonText, NeonButton, GlassCard } from './DesignSystem';
import { MODULE_AGENTS } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { buildModuleBriefing, statusColor } from '../utils/briefing';
import { runArchitectPipeline } from '../services/architectPipeline';

interface ArchitectAIViewProps {
  userId: string;
  collectedVectors: string[];
  onOpenReport?: () => void;
}

export const ArchitectAIView: React.FC<ArchitectAIViewProps> = ({ userId, collectedVectors, onOpenReport }) => {
  const { modules, user, setFindings, pipeline, setPipeline } = useSovereign();
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETE'>(pipeline?.valid ? 'COMPLETE' : 'IDLE');
  const [logs, setLogs] = useState<string[]>(pipeline?.logs || []);
  const [synthesis, setSynthesis] = useState(pipeline?.synthesis || '');
  const [busy, setBusy] = useState(false);

  const startHandoff = async () => {
    if (!user || busy) return;
    setBusy(true);
    setStatus('PROCESSING');
    setLogs([]);
    setSynthesis('');
    try {
      const result = await runArchitectPipeline(modules, { id: user.id, displayName: user.displayName || userId }, (msg) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      });
      Object.entries(result.findingUpdates).forEach(([id, findings]) => setFindings(id, findings));
      setPipeline(result);
      setSynthesis(result.synthesis);
      setStatus(result.valid ? 'COMPLETE' : 'IDLE');
    } catch (err) {
      setLogs((prev) => [...prev, `Compile failed: ${err instanceof Error ? err.message : 'unknown'}`]);
      setStatus('IDLE');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', animation: 'fade-in 0.35s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.16em' }}>
            ARCHITECT → THIRD-PARTY VALIDATOR → ARCHITECT COMPILE
          </div>
          <NeonText color={NEON.blue} size="1.3rem" weight={900}>
            ARCHITECT AI
          </NeonText>
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: status === 'COMPLETE' ? NEON.blue : NEON.orange }}>{status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.textMuted, marginBottom: 10 }}>
            IDENTITY VECTOR MATRIX · NUKED / KNOXED / MONITORED
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {MODULE_AGENTS.map((m) => {
              const row = modules[m.id];
              const briefing = buildModuleBriefing(m, row?.record || {}, row?.findings || [], user?.displayName || 'You');
              const c = statusColor(briefing.status);
              const nuked = (row?.findings || []).filter((f) => f.status === 'NUKED').length;
              const knoxed = (row?.findings || []).filter((f) => f.status === 'KNOXED').length;
              return (
                <div
                  key={m.id}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${c}33`,
                    background: `${c}10`,
                  }}
                >
                  <div style={{ fontSize: '0.9rem' }}>{m.icon}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '0.5rem', color: c }}>{m.vector}</div>
                  <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.68rem', color: NEON.text, lineHeight: 1.2 }}>{m.shortLabel}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '0.48rem', color: NEON.textMuted, marginTop: 4 }}>
                    {briefing.status} · N{nuked} K{knoxed}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <NeonButton color={NEON.blue} onClick={startHandoff} disabled={busy}>
              {busy ? 'VALIDATING…' : 'RUN VALIDATOR HANDOFF'}
            </NeonButton>
            {status === 'COMPLETE' && onOpenReport && (
              <NeonButton color={NEON.orange} onClick={onOpenReport}>
                OPEN IDENTITY AUDIT
              </NeonButton>
            )}
          </div>
          {pipeline && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
              {[
                { l: 'NUKED', v: pipeline.nuked, c: NEON.magenta },
                { l: 'KNOXED', v: pipeline.knoxed, c: NEON.blue },
                { l: 'WATCH', v: pipeline.monitored, c: NEON.orange },
                { l: 'COMPILE', v: pipeline.valid ? 'OK' : 'NO', c: pipeline.valid ? NEON.blue : NEON.magenta },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: 'center', padding: 8, borderRadius: 8, border: `1px solid ${s.c}33` }}>
                  <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.1rem', color: s.c, fontWeight: 800 }}>{s.v}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '0.5rem', color: s.c }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
          {synthesis && (
            <p style={{ fontFamily: FONTS.rajdhani, fontSize: '0.95rem', color: NEON.text, lineHeight: 1.5, marginTop: 16, whiteSpace: 'pre-wrap' }}>
              {synthesis}
            </p>
          )}
          {pipeline?.compileHash && (
            <div style={{ fontFamily: FONTS.mono, fontSize: '0.52rem', color: NEON.blue, marginTop: 10, wordBreak: 'break-all' }}>
              COMPILE SHA-256 {pipeline.compileHash}
            </div>
          )}
        </GlassCard>

        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.textMuted, marginBottom: 10 }}>NEURAL LOG · HANDOFF</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.blue, lineHeight: 1.6, minHeight: 200 }}>
            {logs.length === 0 && (
              <span style={{ color: NEON.textMuted }}>
                Waiting to hand {collectedVectors.length}/16 sealed vectors to the Third-Party Validator Agent. NUKED findings stay NUKED until you knox them.
              </span>
            )}
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
