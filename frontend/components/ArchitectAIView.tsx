import React, { useState } from 'react';
import { NEON, FONTS } from '../theme';
import { NeonText, NeonButton, GlassCard } from './DesignSystem';
import { MODULE_AGENTS } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { buildModuleBriefing, statusColor } from '../utils/briefing';

interface ArchitectAIViewProps {
  userId: string;
  collectedVectors: string[];
}

export const ArchitectAIView: React.FC<ArchitectAIViewProps> = ({ userId, collectedVectors }) => {
  const { modules, dossier, user } = useSovereign();
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETE'>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [synthesis, setSynthesis] = useState('');

  const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const startSynthesis = async () => {
    setStatus('PROCESSING');
    setLogs([]);
    addLog(`Architect AI waking for ${user?.displayName || userId}…`);
    for (const m of MODULE_AGENTS) {
      addLog(`Reading ${m.vector} ${m.name} briefing…`);
      await new Promise((r) => setTimeout(r, 120));
    }
    addLog('Compressing 16 vectors into one operator story…');
    await new Promise((r) => setTimeout(r, 400));
    const story = `${dossier.oneLiner}

You have ${dossier.nuked} live exposures, ${dossier.knoxed} hardened controls, and ${dossier.monitored} items still being watched. Start with whatever is NUKED — usually email, brokers, or an ID scan sitting in Notes — then re-seal those vectors so the score can climb.

This is not a threat dump. It is the same condensed briefing each splash screen already showed you, stitched into one paragraph you can act on today.`;
    setSynthesis(story);
    addLog('Synthesis complete. Identity story is ready.');
    setStatus('COMPLETE');
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', animation: 'fade-in 0.35s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.16em' }}>LOCAL MCP · QWEN / GEMMA</div>
          <NeonText color={NEON.blue} size="1.3rem" weight={900}>
            ARCHITECT AI
          </NeonText>
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: status === 'COMPLETE' ? NEON.blue : NEON.orange }}>{status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.textMuted, marginBottom: 10 }}>IDENTITY VECTOR MATRIX</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {MODULE_AGENTS.map((m) => {
              const row = modules[m.id];
              const briefing = buildModuleBriefing(m, row?.record || {}, row?.findings || [], user?.displayName || 'You');
              const c = statusColor(briefing.status);
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
                </div>
              );
            })}
          </div>
          <NeonButton color={NEON.blue} onClick={startSynthesis} disabled={status === 'PROCESSING'}>
            {status === 'PROCESSING' ? 'SYNTHESIZING…' : 'WRITE THE OPERATOR STORY'}
          </NeonButton>
          {synthesis && (
            <p style={{ fontFamily: FONTS.rajdhani, fontSize: '0.95rem', color: NEON.text, lineHeight: 1.5, marginTop: 16, whiteSpace: 'pre-wrap' }}>
              {synthesis}
            </p>
          )}
        </GlassCard>

        <GlassCard style={{ padding: 16 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.textMuted, marginBottom: 10 }}>NEURAL LOG</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.blue, lineHeight: 1.6, minHeight: 200 }}>
            {logs.length === 0 && <span style={{ color: NEON.textMuted }}>Waiting to synthesize {collectedVectors.length}/16 sealed vectors.</span>}
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
