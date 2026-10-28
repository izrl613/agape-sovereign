import React, { useEffect, useRef, useState } from 'react';
import { Send, Cpu, Shield, Lock, Sparkles } from 'lucide-react';
import { NEON, FONTS } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { askArchitect, checkLocalLlmStatus, ArchitectSource, LocalLlmStatus } from '../services/architect';
import { Sha256Badge } from './Sha256Badge';

interface Msg {
  role: 'user' | 'architect';
  text: string;
  source?: ArchitectSource;
  modelUsed?: string;
}

const STARTERS = [
  'What is my status?',
  'Explain my SHA-256 ID',
  'How does offline local LLM qwen3-vl:4b protect me?',
  'How do I erase myself from data brokers?',
  'Passkey vs Google — which protects me more?',
  'What does zero-knowledge mean here?',
  'Tell me about the 26-month audit',
];

export const ArchitectAIView: React.FC = () => {
  const { receipts, sovereignId } = useSovereign();
  const [llmStatus, setLlmStatus] = useState<LocalLlmStatus>({
    online: false,
    model: 'qwen3-vl:4b',
    fallbackModel: 'gemma4:12b',
  });
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'architect',
      text: `I am Architect AI, backed by client-side AES-256-GCM encryption and offline local LLM qwen3-vl:4b. I reason over your real sealed receipts (${receipts.length} sealed so far) — hashes and cryptographic outcomes only, never your plaintext. Ask me about your security posture, any of the 16 identity modules, or zero-knowledge encryption.`,
      source: 'LOCAL_KB',
      modelUsed: 'qwen3-vl:4b Enclave',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    checkLocalLlmStatus().then((s) => {
      if (active) setLlmStatus(s);
    });
    return () => {
      active = false;
    };
  }, []);

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
      setMessages((p) => [
        ...p,
        {
          role: 'architect',
          text: answer.text,
          source: answer.source,
          modelUsed: answer.modelUsed,
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '72vh', paddingBottom: 80 }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.orange, letterSpacing: '0.18em' }}>
              PRIVACY & SECURITY BACKBONE
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: '0.58rem',
                color: llmStatus.online ? NEON.green : NEON.blue,
                border: `1px solid ${llmStatus.online ? NEON.green : NEON.blue}55`,
                borderRadius: 999,
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Cpu size={10} />
              {llmStatus.online
                ? `LOCAL LLM ACTIVE (${llmStatus.model} · FALLBACK: ${llmStatus.fallbackModel})`
                : 'OFFLINE LOCAL ENGINE (qwen3-vl:4b · FALLBACK: gemma4:12b)'}
            </span>
          </div>

          <h1 style={{ margin: '4px 0 6px', fontFamily: FONTS.orbitron, fontSize: '1.5rem', fontWeight: 900, color: NEON.blue, textShadow: `0 0 16px ${NEON.blue}55` }}>
            ARCHITECT AI
          </h1>
          <p style={{ color: NEON.textMuted, fontSize: '0.82rem', margin: 0, maxWidth: 620, lineHeight: 1.45 }}>
            Powered by client-side AES-256-GCM zero-knowledge encryption and offline local LLM (primary: <strong>qwen3-vl:4b</strong>, fallback: <strong>gemma4:12b</strong>).
            Your plaintext identity data never leaves your device.
          </p>
        </div>
        {sovereignId && <Sha256Badge hash={sovereignId} label="SESSION SEALED UNDER" />}
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(0,212,255,0.25)',
              background: 'rgba(0,212,255,0.06)',
              color: NEON.blue,
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontFamily: FONTS.rajdhani,
              transition: 'all 0.15s',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div
              style={{
                background: m.role === 'user' ? 'rgba(255,46,159,0.09)' : NEON.bgCard,
                border: `1px solid ${m.role === 'user' ? NEON.magenta + '44' : 'rgba(0,212,255,0.2)'}`,
                borderRadius: 13,
                padding: '13px 16px',
                color: NEON.text,
                fontSize: '0.86rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                boxShadow: m.role === 'user' ? '0 2px 12px rgba(255,46,159,0.1)' : '0 2px 12px rgba(0,212,255,0.05)',
              }}
            >
              {m.text}
            </div>

            {m.role === 'architect' && m.source && (
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: '0.58rem',
                  marginTop: 5,
                  color:
                    m.source === 'LOCAL_QWEN' || m.source === 'LOCAL_GEMMA'
                      ? NEON.green
                      : m.source === 'GEMINI'
                        ? NEON.blue
                        : NEON.orange,
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {m.source === 'LOCAL_QWEN' && '◈ ARCHITECT AI · OFFLINE LOCAL LLM (qwen3-vl:4b @ localhost)'}
                {m.source === 'LOCAL_GEMMA' && '◈ ARCHITECT AI · OFFLINE FALLBACK LLM (gemma4:12b @ localhost)'}
                {m.source === 'GEMINI' && '◈ ARCHITECT AI · GEMINI VIA CLOUD FUNCTION'}
                {m.source === 'LOCAL_KB' && '◈ ARCHITECT AI · ON-DEVICE ENCLAVE KNOWLEDGE ENGINE (qwen3-vl:4b / gemma4:12b)'}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div style={{ color: NEON.blue, fontFamily: FONTS.mono, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: NEON.blue, animation: 'pulse 1s infinite' }} />
            Architect is synthesizing cryptographic vectors via local neural pipeline…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{
          display: 'flex',
          gap: 9,
          position: 'sticky',
          bottom: 64,
          background: 'rgba(6,12,26,0.94)',
          padding: 8,
          borderRadius: 12,
          border: '1px solid rgba(0,212,255,0.25)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Architect AI about your 16 modules, SHA-256 IDs, or zero-knowledge encryption…"
          aria-label="Ask Architect AI"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: NEON.text,
            padding: '10px 10px',
            fontSize: '0.88rem',
            fontFamily: FONTS.rajdhani,
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 9,
            border: `1px solid ${NEON.blue}`,
            background: 'rgba(0,212,255,0.15)',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: FONTS.orbitron,
            fontSize: '0.72rem',
            fontWeight: 700,
            opacity: busy || !input.trim() ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          <Send size={13} /> ASK
        </button>
      </form>
    </div>
  );
};
