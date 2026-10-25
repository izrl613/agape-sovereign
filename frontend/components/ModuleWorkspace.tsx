import React, { useMemo, useState } from 'react';
import { NEON, FONTS } from '../theme';
import { ModuleAgentDef, FindingStatus } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { buildModuleBriefing, statusColor } from '../utils/briefing';
import { ModuleBriefingCard } from './UserBriefing';
import { ModuleSplash } from './ModuleSplash';
import { NeonButton, GlassCard, StatusBadge } from './DesignSystem';
import { ModuleAgentRuntime } from '../services/moduleAgents';

interface Props {
  module: ModuleAgentDef;
}

export const ModuleWorkspace: React.FC<Props> = ({ module }) => {
  const { user, modules, updateRecord, setFindings, dossier } = useSovereign();
  const state = modules[module.id] || { record: {}, findings: [], hash: '', lastScanned: null, customized: false };
  const [draft, setDraft] = useState<Record<string, string>>(state.record);
  const [showSplash, setShowSplash] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [subTask, setSubTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState(false);

  const briefing = useMemo(
    () => buildModuleBriefing(module, state.record, state.findings, user?.displayName || dossier.displayName),
    [module, state.record, state.findings, user, dossier.displayName]
  );

  const color = statusColor(briefing.status);
  const findings = state.findings.length
    ? state.findings
    : [
        {
          id: 'await',
          status: 'MONITORED' as FindingStatus,
          label: 'Awaiting scan',
          detail: 'Seal your fields, then run the agent. We will turn the result into a briefing you can actually use.',
          remediation: 'Tap Scan this vector.',
        },
      ];

  const handleSeal = async () => {
    setSaving(true);
    await updateRecord(module.id, draft);
    setSaving(false);
  };

  const handleScan = async () => {
    setScanning(true);
    setProgress(4);
    try {
      const result = await ModuleAgentRuntime.execute(module.id, draft, (pct, msg) => {
        setProgress(pct);
        setSubTask(msg);
      });
      await updateRecord(module.id, draft);
      setFindings(module.id, result.findings);
    } finally {
      setScanning(false);
      setProgress(100);
    }
  };

  const patchFinding = (id: string, status: FindingStatus) => {
    setFindings(
      module.id,
      state.findings.map((f) => (f.id === id ? { ...f, status } : f))
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {showSplash && (
        <ModuleSplash
          module={module}
          briefing={briefing}
          hash={state.hash}
          uid={user?.id}
          onEnter={() => setShowSplash(false)}
        />
      )}

      <div style={{ height: '100%', overflowY: 'auto', padding: 24, animation: 'fade-in 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
          <span style={{ fontSize: '2rem', filter: `drop-shadow(0 0 10px ${color})` }}>{module.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.16em' }}>
              {module.vector} · {module.pillar.toUpperCase()} · {module.category.replace('_', ' ')}
            </div>
            <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.25rem', fontWeight: 800, color, textShadow: `0 0 12px ${color}44` }}>
              {module.name}
            </div>
            <div style={{ fontFamily: FONTS.rajdhani, color: NEON.textMuted, fontSize: '0.9rem' }}>{module.thematicHook}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <NeonButton size="sm" color={NEON.blue} onClick={handleScan} disabled={scanning}>
              {scanning ? 'SCANNING…' : 'SCAN THIS VECTOR'}
            </NeonButton>
            <button
              onClick={() => setShowSplash(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: NEON.textMuted,
                fontFamily: FONTS.mono,
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              REPLAY SPLASH
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'NUKED', count: state.findings.filter((f) => f.status === 'NUKED').length, c: NEON.magenta },
            { label: 'KNOXED', count: state.findings.filter((f) => f.status === 'KNOXED').length, c: NEON.blue },
            { label: 'MONITORED', count: state.findings.filter((f) => f.status === 'MONITORED').length, c: NEON.orange },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                padding: '14px 8px',
                borderRadius: 12,
                border: `1px solid ${s.c}33`,
                background: `${s.c}10`,
              }}
            >
              <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.5rem', fontWeight: 800, color: s.c }}>{s.count}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: s.c, letterSpacing: '0.12em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <ModuleBriefingCard briefing={briefing} />
        </div>

        {scanning && (
          <GlassCard style={{ padding: 16, marginBottom: 16, border: `1px solid ${NEON.blue}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: FONTS.orbitron, fontSize: '0.72rem', color: NEON.blue }}>AGENT RUNNING</span>
              <span style={{ fontFamily: FONTS.orbitron, color: NEON.blue }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: NEON.blue, boxShadow: `0 0 8px ${NEON.blue}` }} />
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: NEON.textMuted, marginTop: 8 }}>{subTask}</div>
          </GlassCard>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginBottom: 18 }}>
          <GlassCard style={{ padding: 18 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.orange, letterSpacing: '0.14em', marginBottom: 12 }}>
              SEALED FIELDS · {reveal ? 'VISIBLE' : 'MASKED'}
            </div>
            {module.fields.map((field) => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.textMuted, marginBottom: 6 }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {field.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setDraft({ ...draft, [field.key]: opt })}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: `1px solid ${(draft[field.key] || state.record[field.key]) === opt ? NEON.blue : 'rgba(255,255,255,0.12)'}`,
                          background: (draft[field.key] || state.record[field.key]) === opt ? 'rgba(0,212,255,0.15)' : 'transparent',
                          color: NEON.text,
                          fontFamily: FONTS.rajdhani,
                          cursor: 'pointer',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={draft[field.key] ?? state.record[field.key] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={3}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type={!reveal && field.type === 'email' ? 'text' : field.type === 'password' ? 'password' : 'text'}
                    value={draft[field.key] ?? state.record[field.key] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={inputStyle}
                  />
                )}
                <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.75rem', color: NEON.textMuted, marginTop: 4 }}>{field.help}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <NeonButton size="sm" color={NEON.orange} onClick={() => setReveal(!reveal)}>
                {reveal ? 'MASK' : 'REVEAL'}
              </NeonButton>
              <NeonButton size="sm" color={NEON.blue} onClick={handleSeal} disabled={saving}>
                {saving ? 'SEALING…' : 'UPDATE & SEAL'}
              </NeonButton>
            </div>
            {state.hash && (
              <div style={{ fontFamily: FONTS.mono, fontSize: '0.52rem', color: NEON.blue, marginTop: 10, wordBreak: 'break-all' }}>
                SHA256 {state.hash}
              </div>
            )}
          </GlassCard>

          <div>
            <div style={{ fontFamily: FONTS.orbitron, fontSize: '0.7rem', color: NEON.orange, letterSpacing: '0.12em', marginBottom: 10 }}>
              INTELLIGENCE FINDINGS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {findings.map((f) => {
                const c = statusColor(f.status);
                return (
                  <GlassCard key={f.id} style={{ padding: 14, borderLeft: `3px solid ${c}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <StatusBadge type={f.status} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <MiniAction color={NEON.magenta} onClick={() => patchFinding(f.id, 'NUKED')}>
                          NUKE
                        </MiniAction>
                        <MiniAction color={NEON.blue} onClick={() => patchFinding(f.id, 'KNOXED')}>
                          KNOX
                        </MiniAction>
                      </div>
                    </div>
                    <div style={{ fontFamily: FONTS.orbitron, fontSize: '0.78rem', color: NEON.text, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.85rem', color: NEON.textMuted, lineHeight: 1.4 }}>{f.detail}</div>
                    <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.8rem', color: NEON.blue, marginTop: 8 }}>→ {f.remediation}</div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {module.capabilities.map((c) => (
            <span
              key={c}
              style={{
                fontFamily: FONTS.mono,
                fontSize: '0.55rem',
                color: NEON.blue,
                border: `1px solid ${NEON.blue}33`,
                borderRadius: 4,
                padding: '3px 7px',
              }}
            >
              ▸ {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#E8F4FF',
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '0.85rem',
  outline: 'none',
};

const MiniAction: React.FC<{ color: string; onClick: () => void; children: React.ReactNode }> = ({ color, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: `${color}18`,
      border: `1px solid ${color}55`,
      color,
      fontFamily: "'Orbitron', monospace",
      fontSize: '0.5rem',
      letterSpacing: '0.08em',
      padding: '4px 8px',
      borderRadius: 6,
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);
