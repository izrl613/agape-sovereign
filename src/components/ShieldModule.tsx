/**
 * ShieldModule.tsx — Sovereign Privacy & Security Shield Platform
 *
 * Unified dashboard fusing:
 *   1. DLP Shield        — Polymer-inspired adaptive data loss prevention
 *   2. Identity Guard    — Unosecur-inspired identity risk & privilege remediation
 *   3. PII Anonymizer    — Nymiz-inspired masking / tokenization / substitution
 *   4. Privacy Monitor   — PrivacyProctor-inspired real-time data-leak detection
 *   5. AI Armor          — Prisma AIRS-inspired AI model & agent runtime protection
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { NEON, NeonText, GlassCard, NeonButton } from './UI';
import { PasskeyLockOverlay } from './auth/PasskeyLockOverlay';
import { passkeyLockService } from '../services/passkeyLockService';

import { dlpEngine, DlpScanResult, DlpViolation, subscribeDlpViolations, logDlpViolation } from '../services/dlpService';
import { anonymizePii, detectPiiWithAi, PiiScanResult, AnonymizeTechnique, logPiiScan } from '../services/piiService';
import { subscribeIdentityRisks, remediateIdentity, IdentityRecord, DEMO_IDENTITIES, saveIdentityRisk } from '../services/identityRiskService';

// ── Panel type ─────────────────────────────────────────────────────────────────

type ShieldPanel = 'overview' | 'dlp' | 'identity' | 'pii' | 'monitor' | 'airs';

const PANELS: Array<{ id: ShieldPanel; label: string; icon: string; color: string; tag: string }> = [
  { id: 'overview',  label: 'Shield Suite',   icon: '⬡', color: NEON.blue,    tag: 'OVERVIEW'  },
  { id: 'dlp',       label: 'DLP Engine',     icon: '◈', color: NEON.magenta, tag: 'POLYMER'   },
  { id: 'identity',  label: 'Identity Guard', icon: '⊛', color: NEON.orange,  tag: 'UNOSECUR'  },
  { id: 'pii',       label: 'PII Anonymizer', icon: '◉', color: NEON.blue,    tag: 'NYMIZ'     },
  { id: 'monitor',   label: 'Privacy Monitor',icon: '◎', color: NEON.orange,  tag: 'PROCTOR'   },
  { id: 'airs',      label: 'AI Armor',       icon: '⊡', color: NEON.magenta, tag: 'PRISMA'    },
];

// ── Layout ─────────────────────────────────────────────────────────────────────

export const ShieldModule: React.FC = () => {
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<ShieldPanel>('overview');
  const [isLocked, setIsLocked] = useState(passkeyLockService.getState().vaultLocked && passkeyLockService.getState().vaultEnabled);

  useEffect(() => {
    return passkeyLockService.subscribe(state => {
      setIsLocked(state.vaultLocked && state.vaultEnabled);
    });
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: NEON.bg,
    color: NEON.text,
    fontFamily: "'Rajdhani', 'Orbitron', monospace",
    paddingBottom: 40,
  };

  return (
    <div style={{ ...containerStyle, position: 'relative' }}>
      <PasskeyLockOverlay zone="vault" />
      
      <div style={{ filter: isLocked ? 'blur(12px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: isLocked ? 'none' : 'auto' }}>
        {/* Header */}
      <div style={{ padding: '24px 24px 0', borderBottom: `1px solid ${NEON.blue}22` }}>
        <NeonText color={NEON.blue} size="1.4rem" style={{ letterSpacing: '0.15em' }}>
          ⬡ SOVEREIGN SHIELD PLATFORM
        </NeonText>
        <div style={{ color: NEON.textMuted, fontSize: '0.75rem', marginTop: 4, letterSpacing: '0.08em' }}>
          ADAPTIVE PRIVACY · ZERO-KNOWLEDGE · RUNTIME PROTECTION
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, overflowX: 'auto', paddingBottom: 1 }}>
          {PANELS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              style={{
                background: activePanel === p.id ? `${p.color}18` : 'transparent',
                border: `1px solid ${activePanel === p.id ? p.color : p.color + '33'}`,
                borderRadius: 8,
                padding: '6px 14px',
                cursor: 'pointer',
                color: activePanel === p.id ? p.color : NEON.textMuted,
                fontFamily: "'Orbitron', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {p.icon} {p.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePanel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          style={{ padding: '24px 24px 0' }}
        >
          {activePanel === 'overview'  && <OverviewPanel onNavigate={setActivePanel} userId={user?.uid} />}
          {activePanel === 'dlp'       && <DlpPanel userId={user?.uid ?? ''} />}
          {activePanel === 'identity'  && <IdentityPanel userId={user?.uid ?? ''} />}
          {activePanel === 'pii'       && <PiiPanel userId={user?.uid ?? ''} />}
          {activePanel === 'monitor'   && <MonitorPanel />}
          {activePanel === 'airs'      && <AirsPanel />}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
};

// ── Overview ───────────────────────────────────────────────────────────────────

const SUITE_STATS = [
  { label: 'DLP Violations Blocked', value: '1,284', color: NEON.magenta, panel: 'dlp' as ShieldPanel },
  { label: 'Over-Privileged Identities', value: '4', color: NEON.orange, panel: 'identity' as ShieldPanel },
  { label: 'PII Fields Anonymized', value: '3,817', color: NEON.blue, panel: 'pii' as ShieldPanel },
  { label: 'Privacy Alerts', value: '7', color: NEON.orange, panel: 'monitor' as ShieldPanel },
  { label: 'AI Threats Blocked', value: '89', color: NEON.magenta, panel: 'airs' as ShieldPanel },
];

const OverviewPanel: React.FC<{ onNavigate: (p: ShieldPanel) => void; userId?: string }> = ({ onNavigate }) => {
  const score = 91;
  const r = 54, cx = 68, cy = 68;
  const circ = 2 * Math.PI * r;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 28 }}>
        {/* Score Ring */}
        <svg width="136" height="136" style={{ filter: `drop-shadow(0 0 14px ${NEON.blue}88)`, flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none" stroke={NEON.blue} strokeWidth="8"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - score / 100) }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            strokeLinecap="round"
          />
          <text x={cx} y={cy - 8} textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="24" fontWeight="900">{score}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SHIELD</text>
          <text x={cx} y={cy + 22} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SCORE</text>
        </svg>

        <div>
          <NeonText color={NEON.blue} size="1.1rem">AEGIS SHIELD — ACTIVE</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: '0.75rem', marginTop: 6, lineHeight: 1.6 }}>
            Five-pillar consumer privacy platform running.<br />
            All engines nominal. Runtime protection enabled.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {['DLP', 'ID GUARD', 'PII', 'MONITOR', 'AI ARMOR'].map(tag => (
              <span key={tag} style={{
                background: `${NEON.blue}18`, border: `1px solid ${NEON.blue}44`,
                borderRadius: 6, padding: '2px 8px', fontSize: '0.62rem',
                fontFamily: "'Orbitron', monospace", color: NEON.blue, letterSpacing: '0.08em'
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {SUITE_STATS.map(stat => (
          <GlassCard key={stat.label} onClick={() => onNavigate(stat.panel)} style={{ cursor: 'pointer', padding: '16px 20px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: "'Orbitron', monospace", color: stat.color, textShadow: `0 0 10px ${stat.color}66` }}>
              {stat.value}
            </div>
            <div style={{ color: NEON.textMuted, fontSize: '0.72rem', marginTop: 4, letterSpacing: '0.06em' }}>
              {stat.label.toUpperCase()}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Engine Status */}
      <div style={{ marginTop: 24 }}>
        <NeonText color={NEON.textMuted} size="0.7rem" style={{ letterSpacing: '0.12em' }}>ENGINE STATUS</NeonText>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {[
            { name: 'DLP Shield', desc: 'Adaptive data loss prevention · 8 active rules', ok: true },
            { name: 'Identity Guard', desc: '4 over-privileged entities flagged', ok: false },
            { name: 'PII Anonymizer', desc: 'Masking · Tokenization · Substitution active', ok: true },
            { name: 'Privacy Monitor', desc: '3 real-time alerts active', ok: false },
            { name: 'AI Armor (AIRS)', desc: 'Prompt injection & exfil protection enabled', ok: true },
          ].map(engine => (
            <GlassCard key={engine.name} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: engine.ok ? NEON.blue : NEON.orange, boxShadow: `0 0 6px ${engine.ok ? NEON.blue : NEON.orange}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: NEON.text, fontSize: '0.8rem', fontWeight: 600 }}>{engine.name}</div>
                <div style={{ color: NEON.textMuted, fontSize: '0.68rem' }}>{engine.desc}</div>
              </div>
              <span style={{ color: engine.ok ? NEON.blue : NEON.orange, fontSize: '0.65rem', fontFamily: "'Orbitron', monospace" }}>
                {engine.ok ? 'NOMINAL' : 'ALERT'}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── DLP Panel (Polymer) ────────────────────────────────────────────────────────

const DlpPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<DlpScanResult | null>(null);
  const [violations, setViolations] = useState<DlpViolation[]>([]);
  const [rules, setRules] = useState(dlpEngine.getRules());
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const unsub = subscribeDlpViolations(userId, setViolations);
    return unsub;
  }, [userId]);

  const runScan = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 400));
    const res = dlpEngine.scan(inputText, 'manual');
    setResult(res);
    if (res.violations.length > 0 && userId) {
      for (const v of res.violations) {
        await logDlpViolation({
          userId, ruleId: v.ruleName, ruleName: v.ruleName,
          dataType: v.ruleName, redactedPreview: res.processed.slice(0, 80),
          action: v.action, sourceContext: 'manual', timestamp: new Date(),
        });
      }
    }
    setIsScanning(false);
  };

  const toggleRule = (id: string) => {
    dlpEngine.setRuleEnabled(id, !rules.find(r => r.id === id)?.enabled);
    setRules(dlpEngine.getRules());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <NeonText color={NEON.magenta} size="0.85rem" style={{ letterSpacing: '0.12em' }}>◈ DLP SHIELD ENGINE · POLYMER</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: '0.72rem', marginTop: 4 }}>
          Paste text to scan for sensitive data. The engine applies REDACT · BLOCK · REPLACE actions based on active rules.
        </div>
      </div>

      {/* Input + Run */}
      <GlassCard style={{ padding: 16 }}>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste sensitive content here — SSN, card numbers, API keys, emails…"
          style={{
            width: '100%', minHeight: 100, background: 'transparent', border: `1px solid ${NEON.magenta}33`,
            borderRadius: 8, color: NEON.text, fontFamily: "'Rajdhani', monospace",
            fontSize: '0.85rem', padding: 12, resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <NeonButton color={NEON.magenta} onClick={runScan} disabled={isScanning || !inputText.trim()} size="sm">
            {isScanning ? 'SCANNING…' : 'RUN DLP SCAN'}
          </NeonButton>
          {result && <NeonButton color={NEON.textMuted} onClick={() => { setResult(null); setInputText(''); }} size="sm">CLEAR</NeonButton>}
        </div>
      </GlassCard>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard style={{ padding: 16 }}>
              <div style={{ color: result.blocked ? NEON.magenta : NEON.blue, fontSize: '0.72rem', fontFamily: "'Orbitron', monospace", marginBottom: 8 }}>
                {result.blocked ? '⊠ CONTENT BLOCKED' : `⊞ ${result.violations.length} VIOLATIONS PROCESSED`}
              </div>
              <div style={{ background: `${NEON.bg}cc`, borderRadius: 8, padding: 12, color: NEON.text, fontSize: '0.82rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {result.processed}
              </div>
              {result.violations.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.violations.map((v, i) => (
                    <span key={i} style={{
                      background: `${NEON.magenta}14`, border: `1px solid ${NEON.magenta}44`,
                      borderRadius: 6, padding: '2px 8px', fontSize: '0.62rem',
                      fontFamily: "'Orbitron', monospace", color: NEON.magenta,
                    }}>{v.action}: {v.ruleName}</span>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules */}
      <div>
        <NeonText color={NEON.textMuted} size="0.68rem" style={{ letterSpacing: '0.12em' }}>ACTIVE RULES</NeonText>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {rules.map(rule => (
            <GlassCard key={rule.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => toggleRule(rule.id)}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: rule.enabled ? NEON.magenta : NEON.textMuted, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: rule.enabled ? NEON.text : NEON.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>{rule.name}</div>
                <div style={{ color: NEON.textMuted, fontSize: '0.65rem' }}>{rule.action} · {rule.severity}</div>
              </div>
              <span style={{ fontSize: '0.62rem', fontFamily: "'Orbitron', monospace", color: rule.enabled ? NEON.blue : NEON.textMuted }}>
                {rule.enabled ? 'ON' : 'OFF'}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Identity Guard Panel (Unosecur) ────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  CRITICAL: NEON.magenta, HIGH: NEON.orange, MEDIUM: '#FFD700', LOW: NEON.blue, SAFE: '#00FF9D',
};

const IdentityPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const [identities, setIdentities] = useState<IdentityRecord[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const unsub = subscribeIdentityRisks(userId, recs => {
      setIdentities(recs);
      setSeeded(true);
    });
    return unsub;
  }, [userId]);

  // Seed demo data on first load if Firestore is empty
  useEffect(() => {
    if (seeded && identities.length === 0) {
      DEMO_IDENTITIES.forEach(d => {
        saveIdentityRisk({ ...d, userId, timestamp: new Date() });
      });
    }
  }, [seeded, identities.length, userId]);

  const remediate = async (id: string) => {
    if (!id) return;
    await remediateIdentity(id);
  };

  const overPrivileged = identities.filter(i => !i.isRemediated && i.privilegeLevel === 'OVER_PRIVILEGED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <NeonText color={NEON.orange} size="0.85rem" style={{ letterSpacing: '0.12em' }}>⊛ IDENTITY GUARD · UNOSECUR</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: '0.72rem', marginTop: 4 }}>
          Human and non-human identity discovery with privilege analysis and one-click remediation.
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Identities', value: identities.length, color: NEON.blue },
          { label: 'Over-Privileged', value: overPrivileged.length, color: NEON.magenta },
          { label: 'Remediated', value: identities.filter(i => i.isRemediated).length, color: '#00FF9D' },
        ].map(s => (
          <GlassCard key={s.label} style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: "'Orbitron', monospace", color: s.color }}>{s.value}</div>
            <div style={{ color: NEON.textMuted, fontSize: '0.65rem', marginTop: 4 }}>{s.label.toUpperCase()}</div>
          </GlassCard>
        ))}
      </div>

      {/* Identity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(identities.length > 0 ? identities : DEMO_IDENTITIES.map((d, i) => ({ ...d, id: `demo-${i}`, userId, timestamp: new Date() }))).map((identity, i) => (
          <GlassCard key={identity.id ?? i} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${RISK_COLOR[identity.riskLevel] ?? NEON.blue}18`, border: `1px solid ${RISK_COLOR[identity.riskLevel] ?? NEON.blue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                {identity.entityType === 'HUMAN' ? '◯' : '⬡'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: identity.isRemediated ? NEON.textMuted : NEON.text, fontWeight: 600, fontSize: '0.85rem' }}>{identity.entityName}</span>
                  <span style={{ color: RISK_COLOR[identity.riskLevel] ?? NEON.blue, fontSize: '0.62rem', fontFamily: "'Orbitron', monospace", flexShrink: 0 }}>{identity.riskLevel}</span>
                </div>
                <div style={{ color: NEON.textMuted, fontSize: '0.68rem', marginTop: 2 }}>{identity.entityType} · {identity.privilegeLevel}</div>
                {identity.notes && <div style={{ color: NEON.textMuted, fontSize: '0.65rem', marginTop: 4 }}>{identity.notes}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {identity.exposedScopes.slice(0, 4).map(s => (
                    <span key={s} style={{ background: `${NEON.orange}12`, border: `1px solid ${NEON.orange}33`, borderRadius: 4, padding: '1px 6px', fontSize: '0.6rem', color: NEON.orange }}>{s}</span>
                  ))}
                  {identity.exposedScopes.length > 4 && <span style={{ color: NEON.textMuted, fontSize: '0.6rem' }}>+{identity.exposedScopes.length - 4} more</span>}
                </div>
              </div>
            </div>
            {!identity.isRemediated && identity.privilegeLevel === 'OVER_PRIVILEGED' && identity.id && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <NeonButton color={NEON.orange} size="sm" onClick={() => remediate(identity.id!)}>
                  ⊠ REMEDIATE — {identity.recommendedAction}
                </NeonButton>
              </div>
            )}
            {identity.isRemediated && (
              <div style={{ marginTop: 8, color: '#00FF9D', fontSize: '0.65rem', fontFamily: "'Orbitron', monospace" }}>✓ REMEDIATED</div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// ── PII Anonymizer Panel (Nymiz) ───────────────────────────────────────────────

const PiiPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const [inputText, setInputText] = useState('');
  const [technique, setTechnique] = useState<AnonymizeTechnique>('MASKING');
  const [result, setResult] = useState<PiiScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAi, setUseAi] = useState(false);

  const run = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 300));
    const res = useAi
      ? await detectPiiWithAi(inputText, technique)
      : anonymizePii(inputText, technique);
    setResult(res);

    if (res.fieldCount > 0 && userId) {
      await logPiiScan({
        userId, sourceContext: 'manual',
        piiTypes: [...new Set(res.entitiesFound.map(e => e.type))],
        anonymizedPreview: res.anonymized.slice(0, 80),
        technique, fieldCount: res.fieldCount, timestamp: new Date(),
      });
    }
    setIsProcessing(false);
  };

  const TECHNIQUES: AnonymizeTechnique[] = ['MASKING', 'TOKENIZATION', 'SUBSTITUTION', 'PSEUDONYMIZATION'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <NeonText color={NEON.blue} size="0.85rem" style={{ letterSpacing: '0.12em' }}>◉ PII ANONYMIZER · NYMIZ</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: '0.72rem', marginTop: 4 }}>
          AI-assisted PII detection with masking, tokenization, substitution, or pseudonymization.
        </div>
      </div>

      {/* Technique Selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TECHNIQUES.map(t => (
          <button key={t} onClick={() => setTechnique(t)} style={{
            background: technique === t ? `${NEON.blue}18` : 'transparent',
            border: `1px solid ${technique === t ? NEON.blue : NEON.blue + '33'}`,
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
            color: technique === t ? NEON.blue : NEON.textMuted,
            fontFamily: "'Orbitron', monospace", fontSize: '0.62rem', letterSpacing: '0.06em',
          }}>{t}</button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={useAi} onChange={e => setUseAi(e.target.checked)} style={{ accentColor: NEON.blue }} />
          <span style={{ color: NEON.textMuted, fontSize: '0.7rem' }}>AI-Enhanced (Gemini)</span>
        </label>
      </div>

      {/* Input */}
      <GlassCard style={{ padding: 16 }}>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter text containing personal information to anonymize…"
          style={{
            width: '100%', minHeight: 100, background: 'transparent', border: `1px solid ${NEON.blue}33`,
            borderRadius: 8, color: NEON.text, fontFamily: "'Rajdhani', monospace",
            fontSize: '0.85rem', padding: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <NeonButton color={NEON.blue} onClick={run} disabled={isProcessing || !inputText.trim()} size="sm">
            {isProcessing ? 'PROCESSING…' : `ANONYMIZE — ${technique}`}
          </NeonButton>
          {result && <NeonButton color={NEON.textMuted} onClick={() => { setResult(null); setInputText(''); }} size="sm">CLEAR</NeonButton>}
        </div>
      </GlassCard>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard style={{ padding: 16 }}>
              <div style={{ color: NEON.blue, fontSize: '0.7rem', fontFamily: "'Orbitron', monospace", marginBottom: 8 }}>
                ⊞ {result.fieldCount} PII FIELDS PROCESSED · {result.processingMs}ms
              </div>
              <div style={{ background: `${NEON.bg}cc`, borderRadius: 8, padding: 12, color: NEON.text, fontSize: '0.82rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {result.anonymized}
              </div>
              {result.entitiesFound.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[...new Set(result.entitiesFound.map(e => e.type))].map(type => (
                    <span key={type} style={{
                      background: `${NEON.blue}14`, border: `1px solid ${NEON.blue}44`,
                      borderRadius: 6, padding: '2px 8px', fontSize: '0.62rem',
                      fontFamily: "'Orbitron', monospace", color: NEON.blue,
                    }}>{type} ×{result.entitiesFound.filter(e => e.type === type).length}</span>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Privacy Monitor Panel (PrivacyProctor) ─────────────────────────────────────

const MONITOR_ALERTS = [
  { id: 'a1', title: 'Clipboard Access Without Permission', detail: "App 'QuickNote' accessed clipboard silently — no user trigger detected.", severity: 'HIGH', surface: 'APP', status: 'ACTIVE' },
  { id: 'a2', title: 'Tracking Pixel Detected', detail: 'Facebook pixel fired on checkout page before consent confirmation.', severity: 'CRITICAL', surface: 'WEB', status: 'ACTIVE' },
  { id: 'a3', title: 'Background Location Request', detail: 'Weather SDK queried GPS with application in background state.', severity: 'MEDIUM', surface: 'APP', status: 'BLOCKED' },
  { id: 'a4', title: 'Hidden Canvas Fingerprinting', detail: 'Third-party script attempting canvas fingerprint extraction.', severity: 'HIGH', surface: 'WEB', status: 'BLOCKED' },
  { id: 'a5', title: 'Cookie Sync Without Consent', detail: 'Ad network attempting cross-site cookie synchronization.', severity: 'HIGH', surface: 'WEB', status: 'ACTIVE' },
  { id: 'a6', title: 'WebRTC IP Leak Detected', detail: 'Browser WebRTC exposing real IP address behind VPN.', severity: 'MEDIUM', surface: 'WEB', status: 'ACTIVE' },
  { id: 'a7', title: 'Microphone Permission Probe', detail: 'Third-party SDK probing microphone access without prompting user.', severity: 'CRITICAL', surface: 'APP', status: 'ACTIVE' },
];

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: NEON.magenta, HIGH: NEON.orange, MEDIUM: '#FFD700', LOW: NEON.blue,
};

const MonitorPanel: React.FC = () => {
  const [alerts, setAlerts] = useState(MONITOR_ALERTS);
  const [monitorOn, setMonitorOn] = useState(true);

  const block = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'BLOCKED' } : a));
  };

  const dismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <NeonText color={NEON.orange} size="0.85rem" style={{ letterSpacing: '0.12em' }}>◎ PRIVACY MONITOR · PRIVACYPROCTOR</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: '0.72rem', marginTop: 4 }}>
            Real-time detection of tracking pixels, data leaks, fingerprinting, and permission abuse.
          </div>
        </div>
        <button onClick={() => setMonitorOn(p => !p)} style={{
          background: monitorOn ? `${NEON.blue}18` : `${NEON.magenta}18`,
          border: `1px solid ${monitorOn ? NEON.blue : NEON.magenta}`,
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          color: monitorOn ? NEON.blue : NEON.magenta, fontFamily: "'Orbitron', monospace", fontSize: '0.62rem',
        }}>
          {monitorOn ? '● MONITORING' : '○ PAUSED'}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Active Alerts', value: alerts.filter(a => a.status === 'ACTIVE').length, color: NEON.magenta },
          { label: 'Blocked', value: alerts.filter(a => a.status === 'BLOCKED').length, color: NEON.blue },
          { label: 'Critical', value: alerts.filter(a => a.severity === 'CRITICAL').length, color: NEON.orange },
        ].map(s => (
          <GlassCard key={s.label} style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Orbitron', monospace", color: s.color }}>{s.value}</div>
            <div style={{ color: NEON.textMuted, fontSize: '0.62rem', marginTop: 4 }}>{s.label.toUpperCase()}</div>
          </GlassCard>
        ))}
      </div>

      {/* Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map(alert => (
          <GlassCard key={alert.id} style={{ padding: '12px 16px', borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity] ?? NEON.blue}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: SEVERITY_COLOR[alert.severity], fontWeight: 700, fontSize: '0.82rem' }}>{alert.title}</span>
                  <span style={{ background: `${SEVERITY_COLOR[alert.severity]}18`, border: `1px solid ${SEVERITY_COLOR[alert.severity]}44`, borderRadius: 4, padding: '1px 6px', fontSize: '0.6rem', color: SEVERITY_COLOR[alert.severity], fontFamily: "'Orbitron', monospace' " }}>{alert.severity}</span>
                </div>
                <div style={{ color: NEON.textMuted, fontSize: '0.7rem' }}>{alert.detail}</div>
                <div style={{ color: NEON.textMuted, fontSize: '0.6rem', marginTop: 4, fontFamily: "'Orbitron', monospace" }}>{alert.surface} · {alert.status}</div>
              </div>
            </div>
            {alert.status === 'ACTIVE' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <NeonButton color={NEON.orange} size="sm" onClick={() => block(alert.id)}>BLOCK</NeonButton>
                <NeonButton color={NEON.textMuted} size="sm" onClick={() => dismiss(alert.id)}>DISMISS</NeonButton>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// ── AI Armor Panel (Prisma AIRS) ───────────────────────────────────────────────

const AI_EVENTS = [
  { id: 'ai1', description: 'Prompt injection attempt blocked in sovereign chat agent', source: 'chat-agent/v2', type: 'INJECTION', severity: 'CRITICAL', ts: '2 min ago' },
  { id: 'ai2', description: 'Exfiltration of API key via model output intercepted', source: 'llm-gateway/openai', type: 'EXFIL', severity: 'CRITICAL', ts: '8 min ago' },
  { id: 'ai3', description: 'Model misuse: jailbreak pattern detected & rejected', source: 'llm-gateway/anthropic', type: 'MISUSE', severity: 'HIGH', ts: '15 min ago' },
  { id: 'ai4', description: 'Agent scope violation: filesystem tool call blocked', source: 'auto-agent/tasks', type: 'BLOCK', severity: 'HIGH', ts: '28 min ago' },
  { id: 'ai5', description: 'PII in LLM output sanitized before delivery', source: 'llm-gateway/gemini', type: 'EXFIL', severity: 'MEDIUM', ts: '41 min ago' },
  { id: 'ai6', description: 'Indirect prompt injection via user-uploaded document', source: 'doc-agent/parser', type: 'INJECTION', severity: 'HIGH', ts: '1 hr ago' },
];

const TYPE_COLOR: Record<string, string> = {
  INJECTION: NEON.magenta, EXFIL: NEON.orange, MISUSE: '#FFD700', BLOCK: NEON.blue,
};

const AirsPanel: React.FC = () => {
  const [armorOn, setArmorOn] = useState(true);
  const protectedModels = ['Gemini 2.0 Flash', 'Local Gemma 4B', 'Architect-AI Agent', 'Anthropic Claude'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <NeonText color={NEON.magenta} size="0.85rem" style={{ letterSpacing: '0.12em' }}>⊡ AI ARMOR · PRISMA AIRS</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: '0.72rem', marginTop: 4 }}>
            Runtime protection for AI models, agents, and pipelines. Shields against prompt injection, data exfiltration, and misuse.
          </div>
        </div>
        <button onClick={() => setArmorOn(p => !p)} style={{
          background: armorOn ? `${NEON.blue}18` : `${NEON.magenta}18`,
          border: `1px solid ${armorOn ? NEON.blue : NEON.magenta}`,
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          color: armorOn ? NEON.blue : NEON.magenta, fontFamily: "'Orbitron', monospace", fontSize: '0.62rem',
        }}>
          {armorOn ? '● ARMORED' : '○ DISARMED'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'Threats Blocked', value: '89', color: NEON.magenta },
          { label: 'AI Models Protected', value: protectedModels.length, color: NEON.blue },
          { label: 'Injections Intercepted', value: '24', color: NEON.orange },
          { label: 'Exfil Attempts Blocked', value: '18', color: NEON.magenta },
        ].map(s => (
          <GlassCard key={s.label} style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Orbitron', monospace", color: s.color }}>{s.value}</div>
            <div style={{ color: NEON.textMuted, fontSize: '0.62rem', marginTop: 4 }}>{s.label.toUpperCase()}</div>
          </GlassCard>
        ))}
      </div>

      {/* Protected Models */}
      <div>
        <NeonText color={NEON.textMuted} size="0.68rem" style={{ letterSpacing: '0.12em' }}>PROTECTED MODELS & AGENTS</NeonText>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {protectedModels.map(m => (
            <GlassCard key={m} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: NEON.blue, boxShadow: `0 0 5px ${NEON.blue}` }} />
              <span style={{ color: NEON.text, fontSize: '0.75rem' }}>{m}</span>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Event Log */}
      <div>
        <NeonText color={NEON.textMuted} size="0.68rem" style={{ letterSpacing: '0.12em' }}>RUNTIME EVENT LOG</NeonText>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {AI_EVENTS.map(ev => (
            <GlassCard key={ev.id} style={{ padding: '10px 14px', borderLeft: `3px solid ${TYPE_COLOR[ev.type] ?? NEON.blue}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: NEON.text, fontSize: '0.78rem', fontWeight: 600 }}>{ev.description}</div>
                  <div style={{ color: NEON.textMuted, fontSize: '0.65rem', marginTop: 3, fontFamily: "'Orbitron', monospace" }}>{ev.source}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                  <span style={{ background: `${TYPE_COLOR[ev.type]}18`, border: `1px solid ${TYPE_COLOR[ev.type]}44`, borderRadius: 4, padding: '1px 6px', fontSize: '0.58rem', color: TYPE_COLOR[ev.type], fontFamily: "'Orbitron', monospace" }}>{ev.type}</span>
                  <span style={{ color: NEON.textMuted, fontSize: '0.62rem' }}>{ev.ts}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShieldModule;
