import React, { useMemo, useState } from 'react';
import { ShieldCheck, Lock, Hash, SearchCheck, Stamp, ArrowLeft, Download } from 'lucide-react';
import { NEON } from '../theme';
import { MODULE_CONFIGS } from '../module-config';
import { useSovereign } from '../context/SovereignContext';
import {
  AgentStep,
  ModuleReceipt,
  runModuleAgent,
  validateEntry,
} from '../services/moduleAgents';
import { Sha256Badge } from './Sha256Badge';

interface Props {
  moduleId: string;
  onBack: () => void;
}

const STEPS: { id: AgentStep; label: string; icon: React.ReactNode }[] = [
  { id: 'VALIDATE', label: 'Validate', icon: <ShieldCheck size={14} /> },
  { id: 'HASH', label: 'SHA-256 Hash', icon: <Hash size={14} /> },
  { id: 'ENCRYPT', label: 'AES-256-GCM Encrypt', icon: <Lock size={14} /> },
  { id: 'VERIFY', label: 'Third-Party Verify', icon: <SearchCheck size={14} /> },
  { id: 'SEAL', label: 'Seal Receipt', icon: <Stamp size={14} /> },
];

/**
 * One identity-vector module, gated by its Module Agent. Every pipeline
 * step shown is a real awaited operation — progress is the agent's own
 * step callbacks, never a timed animation.
 */
export const ModuleInterface: React.FC<Props> = ({ moduleId, onBack }) => {
  const config = MODULE_CONFIGS[moduleId];
  const { user, sovereignId, receipts, addReceipt } = useSovereign();
  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [stepState, setStepState] = useState<Partial<Record<AgentStep, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ModuleReceipt | null>(null);
  const [artefact, setArtefact] = useState<{ filename: string; text: string } | null>(null);

  const priorReceipts = useMemo(
    () => receipts.filter((r) => r.moduleId === moduleId),
    [receipts, moduleId],
  );
  if (!config) return <p style={{ color: NEON.magenta }}>Unknown module.</p>;

  const set = (key: string, value: string) => setValues((p) => ({ ...p, [key]: value }));

  const run = async () => {
    if (!user || !sovereignId) return;
    setError(null);
    setReceipt(null);
    setArtefact(null);
    const errors = validateEntry(moduleId, values);
    if (errors.length) { setError(errors.join(' ')); return; }
    setRunning(true);
    setStepState({});
    try {
      const { receipt: raw, artefact: art } = await runModuleAgent(
        moduleId, values, user.id, sovereignId,
        (step, state) => setStepState((p) => ({ ...p, [step]: state })),
      );
      const stored = await addReceipt(raw, values);
      setReceipt(stored);
      setArtefact(art ?? null);
      setValues((p) => ({ ...p, passwordCheck: '' }));
    } catch (err: any) {
      setError(err?.message ?? 'The Module Agent rejected this entry.');
    } finally {
      setRunning(false);
    }
  };

  const downloadArtefact = () => {
    if (!artefact) return;
    const url = URL.createObjectURL(new Blob([artefact.text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = artefact.filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 9,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,255,0.25)',
    color: NEON.text, fontSize: '0.85rem', fontFamily: "'Rajdhani', sans-serif",
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 90 }}>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: NEON.blue, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', marginBottom: 14, padding: 0 }}>
        <ArrowLeft size={13} /> DASHBOARD
      </button>

      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.18em' }}>
        MODULE AGENT · IDENTITY VECTOR
      </div>
      <h1 style={{ margin: '6px 0 4px', fontFamily: "'Orbitron', sans-serif", fontSize: '1.45rem', fontWeight: 900, color: NEON.text }}>
        {config.splash.headline}
      </h1>
      <p style={{ color: NEON.textMuted, fontSize: '0.88rem', lineHeight: 1.55, maxWidth: 680 }}>{config.splash.narrative}</p>

      <div style={{ borderLeft: `3px solid ${NEON.green}`, background: 'rgba(0,255,135,0.05)', padding: '11px 14px', borderRadius: '0 10px 10px 0', margin: '16px 0 22px', fontSize: '0.78rem', color: NEON.text, lineHeight: 1.5 }}>
        <strong style={{ color: NEON.green, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em' }}>PRIVACY PLEDGE · </strong>
        {config.splash.privacyPledge}
      </div>

      {sovereignId && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Sha256Badge hash={sovereignId} label="SEALING UNDER SOVEREIGN SHA-256" />
          <span style={{ fontSize: '0.7rem', color: NEON.textMuted }}>This hash binds every receipt below to your zero-knowledge session.</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); void run(); }} style={{ background: NEON.bgCard, border: '1px solid rgba(0,212,255,0.16)', borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {config.dataFields.filter((f) => f.type !== 'hidden').map((field) => (
            <label key={field.key} style={{ display: 'block' }}>
              <span style={{ display: 'block', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: NEON.blue, letterSpacing: '0.08em', marginBottom: 7 }}>
                {field.label.toUpperCase()}{field.optional ? ' (OPTIONAL)' : ''}{field.sensitive ? ' · 🔒 ON-DEVICE ONLY' : ''}
              </span>
              {field.type === 'select' ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {field.options?.map((opt) => (
                    <button
                      key={opt} type="button" onClick={() => set(field.key, opt)}
                      style={{
                        padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: '0.75rem',
                        background: values[field.key] === opt ? 'rgba(0,212,255,0.16)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${values[field.key] === opt ? NEON.blue : 'rgba(255,255,255,0.14)'}`,
                        color: values[field.key] === opt ? NEON.blue : NEON.textMuted,
                      }}
                    >{opt}</button>
                  ))}
                </div>
              ) : (
                <input
                  type={field.type === 'date' ? 'date' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.sensitive ? 'Hashed on-device — never transmitted' : `Enter ${field.label.toLowerCase()}…`}
                  autoComplete="off"
                  style={inputStyle}
                />
              )}
              {field.help && <span style={{ display: 'block', fontSize: '0.66rem', color: NEON.textMuted, marginTop: 6, lineHeight: 1.45 }}>{field.help}</span>}
            </label>
          ))}
        </div>

        {(running || Object.keys(stepState).length > 0) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22 }} aria-live="polite">
            {STEPS.map((s) => {
              const state = stepState[s.id];
              const color = state === 'DONE' ? NEON.green : state === 'FAILED' ? NEON.magenta : state === 'RUNNING' ? NEON.blue : 'rgba(255,255,255,0.25)';
              return (
                <span key={s.id} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', border: `1px solid ${color}66`, color, borderRadius: 999, padding: '5px 11px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', boxShadow: state === 'DONE' ? `0 0 10px ${color}33` : 'none' }}>
                  {s.icon} {s.label}{state === 'DONE' ? ' ✓' : state === 'FAILED' ? ' — see receipt' : state === 'RUNNING' ? ' …' : ''}
                </span>
              );
            })}
          </div>
        )}

        {error && (
          <div role="alert" style={{ marginTop: 16, border: `1px solid ${NEON.magenta}66`, background: 'rgba(255,46,159,0.07)', color: '#ffb3d9', borderRadius: 10, padding: '11px 14px', fontSize: '0.78rem' }}>
            ⚠ Agent gate: {error}
          </div>
        )}

        <button
          type="submit" disabled={running}
          style={{
            marginTop: 22, padding: '13px 26px', borderRadius: 10, border: `1px solid ${NEON.green}88`,
            background: 'rgba(0,255,135,0.1)', color: NEON.green, cursor: running ? 'wait' : 'pointer',
            fontFamily: "'Orbitron', monospace", fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em',
            boxShadow: '0 0 16px rgba(0,255,135,0.18)', opacity: running ? 0.6 : 1,
          }}
        >
          {running ? 'MODULE AGENT RUNNING…' : '⬡ HASH · ENCRYPT · VERIFY · SEAL'}
        </button>
      </form>

      {receipt && (
        <section aria-label="Sealed receipt" style={{ marginTop: 22, background: 'rgba(0,255,135,0.04)', border: `1px solid ${NEON.green}55`, borderRadius: 14, padding: 20, boxShadow: '0 0 22px rgba(0,255,135,0.1)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <strong style={{ fontFamily: "'Orbitron', monospace", color: NEON.green, fontSize: '0.8rem' }}>SEALED ✓</strong>
            <Sha256Badge hash={receipt.sha256Id} label="ENTRY SHA-256 ID" size="md" />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.textMuted }}>
              {receipt.storage} · {receipt.sealedAt.slice(0, 19).replace('T', ' ')}Z
            </span>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: NEON.textMuted, wordBreak: 'break-all', marginBottom: 12 }}>
            FULL SHA-256: {receipt.sha256Id}
          </div>
          <p style={{ fontSize: '0.84rem', color: NEON.text, lineHeight: 1.55, margin: '0 0 8px' }}>
            <strong style={{ color: NEON.blue }}>{receipt.verification.status.replace(/_/g, ' ')}</strong> · {receipt.verification.detail}
          </p>
          <p style={{ fontSize: '0.7rem', color: NEON.textMuted, margin: '0 0 10px' }}>
            Verified by: {receipt.verification.source} · {receipt.verification.checkedAt.slice(0, 10)}
          </p>
          {receipt.verification.findings.map((f) => (
            <div key={f.label} style={{ fontSize: '0.78rem', color: NEON.text, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: NEON.textMuted }}>{f.label}: </span>{f.value}
            </div>
          ))}
          {artefact && (
            <button type="button" onClick={downloadArtefact} style={{ marginTop: 14, display: 'inline-flex', gap: 7, alignItems: 'center', padding: '10px 18px', borderRadius: 9, border: `1px solid ${NEON.blue}`, background: 'rgba(0,212,255,0.1)', color: NEON.blue, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.68rem', fontWeight: 700 }}>
              <Download size={13} /> DOWNLOAD ERASURE LETTER (.TXT)
            </button>
          )}
        </section>
      )}

      {priorReceipts.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.72rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>
            SEALED RECEIPTS IN THIS MODULE ({priorReceipts.length})
          </h2>
          {priorReceipts.map((r) => (
            <div key={r.sha256Id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Sha256Badge hash={r.sha256Id} />
              <span style={{ fontSize: '0.7rem', color: NEON.textMuted }}>
                {r.verification.status.replace(/_/g, ' ')} · {r.sealedAt.slice(0, 10)} · {r.storage}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
