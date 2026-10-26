import React, { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { askArchitect, ArchitectSource } from '../services/architect';
import { Sha256Badge } from './Sha256Badge';

interface Msg {
  role: 'user' | 'architect';
  text: string;
  source?: ArchitectSource;
}

const STARTERS = [
  'What is my status?',
  'Explain my SHA-256 ID',
  'How do I erase myself from data brokers?',
  'Passkey vs Google — which protects me more?',
  'What does zero-knowledge mean here?',
  'Tell me about the 26-month audit',
];

/**
 * Architect AI — privacy/security backbone. Answers come from the
 * Cloud Function (Gemini free tier) when configured, otherwise from
 * the on-device knowledge engine over the user's real receipts.
 * Every answer is labelled with its true source.
 */
export const ArchitectAIView: React.FC = () => {
  const { receipts, sovereignId } = useSovereign();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'architect',
      text: `I am Architect AI. I reason over your real sealed receipts (${receipts.length} so far) — hashes and verification outcomes only, never your plaintext. Ask me about your results, any module, or any privacy/security question.`,
      source: 'LOCAL_KB',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy) return;
    setInput('');
    const userMsg: Msg = { role: 'user', text: question };
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.text }));
    setMessages((p) => [...p, userMsg]);
    setBusy(true);
    try {
      const answer = await askArchitect(question, receipts, history);
      setMessages((p) => [...p, { role: 'architect', text: answer.text, source: answer.source }]);
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '70vh', paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.18em' }}>PRIVACY & SECURITY BACKBONE</div>
          <h1 style={{ margin: '6px 0 4px', fontFamily: "'Orbitron', sans-serif", fontSize: '1.45rem', fontWeight: 900, color: NEON.blue, textShadow: `0 0 14px ${NEON.blue}55` }}>ARCHITECT AI</h1>
          <p style={{ color: NEON.textMuted, fontSize: '0.82rem', margin: 0, maxWidth: 560 }}>
            Answers are labelled <strong style={{ color: NEON.green }}>GEMINI</strong> (cloud function) or{' '}
            <strong style={{ color: NEON.orange }}>LOCAL KB</strong> (on-device engine over your receipts). No plaintext identity data is ever sent.
          </p>
        </div>
        {sovereignId && <Sha256Badge hash={sovereignId} label="SESSION SEALED UNDER" />}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {STARTERS.map((s) => (
          <button key={s} type="button" onClick={() => void send(s)} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.06)', color: NEON.blue, fontSize: '0.7rem', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: m.role === 'user' ? 'rgba(255,46,159,0.09)' : NEON.bgCard,
              border: `1px solid ${m.role === 'user' ? NEON.magenta + '44' : 'rgba(0,212,255,0.2)'}`,
              borderRadius: 13, padding: '12px 15px', color: NEON.text, fontSize: '0.85rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {m.text}
            </div>
            {m.role === 'architect' && m.source && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.56rem', marginTop: 4, color: m.source === 'GEMINI' ? NEON.green : NEON.orange, letterSpacing: '0.08em' }}>
                {m.source === 'GEMINI' ? '◈ ARCHITECT AI · GEMINI VIA CLOUD FUNCTION' : '◈ ARCHITECT AI · LOCAL KNOWLEDGE ENGINE (ON-DEVICE)'}
              </div>
            )}
          </div>
        ))}
        {busy && <div style={{ color: NEON.blue, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem' }}>Architect is checking your sealed ledger…</div>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); void send(); }}
        style={{ display: 'flex', gap: 9, position: 'sticky', bottom: 64, background: 'rgba(6,12,26,0.92)', padding: 8, borderRadius: 12, border: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(12px)' }}
      >
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your results, a module, or any privacy/security question…"
          aria-label="Ask Architect AI"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: NEON.text, padding: '10px 8px', fontSize: '0.86rem' }}
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 9, border: `1px solid ${NEON.blue}`, background: 'rgba(0,212,255,0.12)', color: NEON.blue, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.68rem', fontWeight: 700, opacity: busy || !input.trim() ? 0.5 : 1 }}>
          <Send size={13} /> ASK
        </button>
      </form>
    </div>
  );
};
