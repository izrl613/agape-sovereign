import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { NeonButton } from './ui';
import { NEON, type DiffModule, type SovereignUser } from '../data/sovereignData';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export function ArchitectAIView({
  user,
  diffModules,
  hdiScore,
}: {
  user: SovereignUser;
  diffModules: DiffModule[];
  hdiScore: number;
}) {
  const sovereignScore = Math.round(
    diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1)
  );
  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);
  const weakest = [...diffModules].sort((a, b) => a.severity - b.severity).slice(0, 3);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Greetings, ${user.displayName}. I am Architect AI — your Digital Identity Federated Footprint (DIFF) intelligence engine.\n\nYour Sovereign Score is ${sovereignScore}/100 and your Human Dignity Index (HDI) is ${hdiScore.toFixed(1)}/100.\n\n• ${totalNuked} NUKED exposures purged or queued across brokers & breach feeds.\n• ${totalKnoxed} KNOXED assets cryptographically hardened.\n\nAsk me about your highest-risk vectors, ECRA 2026 / GDPR Art. 16 compliance, or Local Vault retention.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildReply = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('risk') || q.includes('exposure') || q.includes('weak')) {
      return `Highest-risk DIFF vectors right now:\n${weakest
        .map((m) => `• ${m.vector} ${m.label}: ${m.severity}% (${m.nuked} NUKED, ${m.monitored} MONITORED)`)
        .join('\n')}\n\nOpen any of these vectors in the sidebar to NUKE remaining exposures or KNOX hardened controls.`;
    }
    if (q.includes('nuke') || q.includes('broker')) {
      return `NUKED means an exposure (such as Spokeo, Whitepages, BeenVerified, or a legacy paste dump) has been flagged for deletion and a CCPA/GDPR removal or purge has been dispatched. In V-06 Data Broker Removal, click "NUKE ALL EXPOSURES" to escalate remaining items.`;
    }
    if (q.includes('knox')) {
      return `KNOXED means the asset or identity layer is hardened with zero-knowledge encryption, FIDO2/WebAuthn passkeys, or verified breach-clear status. You currently have ${totalKnoxed} KNOXED controls across your 16 vectors.`;
    }
    if (q.includes('ecra') || q.includes('gdpr') || q.includes('dignity') || q.includes('hdi')) {
      return `Agape Sovereign AI enforces ECRA 2026, GDPR Article 16 (Right to Rectification), UDHR Article 12, and CCPA Right to Correct. Use the "HDI Rectification" tab to submit a correction claim to a Third-Party Validator Node and mint a SHA-256 Rectification Certificate.`;
    }
    if (q.includes('score') || q.includes('vault') || q.includes('drive')) {
      return `Your Sovereign Score (${sovereignScore}/100) is the mean security posture across all 16 DIFF vectors (V-01 through V-16). Passkey users store DPC reports in the encrypted IndexedDB Local Vault with a 26-month rolling window; Google users can also export to Google Drive.`;
    }
    return `Analysis complete for "${query}":\n• Sovereign Score: ${sovereignScore}/100\n• Human Dignity Index: ${hdiScore.toFixed(1)}/100\n• Lowest vector: ${weakest[0]?.vector} ${weakest[0]?.label} (${weakest[0]?.severity}%)\n\nRecommendation: Run the 9-Agent Sovereign Data Pipeline or export a certified DPC report from the DIFF Report tab.`;
  };

  const sendQuery = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    if (!text) setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: buildReply(msg) }]);
      setLoading(false);
    }, 450);
  };

  const suggested = [
    'What are my highest-risk exposures?',
    'How do I NUKE my data broker profiles?',
    'Explain ECRA 2026 & GDPR Art. 16 compliance',
    'What does KNOXED mean for my files?',
    'How is my Sovereign Score calculated?',
  ];

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="mb-4 border-b border-[#00D4FF]/20 pb-3">
        <div className="font-mono-tech text-[11px] tracking-[0.2em] text-[#FF7A18]">
          AI INTELLIGENCE ENGINE · GEMMA 4 E4B / QWEN3.5-9B
        </div>
        <h2 className="font-orbitron text-2xl font-black text-[#00D4FF]">ARCHITECT AI</h2>
        <p className="text-xs text-[#7B9BB5]">
          Real-time DIFF privacy & security intelligence · Zero-PII context-bound enclave
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className="max-w-[82%] whitespace-pre-line rounded-2xl border px-4 py-3 text-sm leading-relaxed"
              style={{
                borderColor: m.role === 'user' ? 'rgba(255,46,159,0.35)' : 'rgba(0,212,255,0.25)',
                background: m.role === 'user' ? 'rgba(255,46,159,0.1)' : 'rgba(8,18,40,0.9)',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="font-mono-tech text-xs text-[#00D4FF]">
            ARCHITECT AI SYNTHESIZING RESPONSE...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 2 && (
        <div className="my-3 flex flex-wrap gap-2">
          {suggested.map((q) => (
            <button
              key={q}
              onClick={() => sendQuery(q)}
              className="font-rajdhani rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/5 px-3 py-1 text-xs text-[#00D4FF] transition hover:bg-[#00D4FF]/15"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendQuery()}
          placeholder="Ask Architect AI about your digital sovereignty..."
          className="font-rajdhani flex-1 rounded-xl border border-[#00D4FF]/30 bg-[#00D4FF]/5 px-4 py-2.5 text-sm text-[#E8F4FF] placeholder-[#7B9BB5]/60 outline-none focus:border-[#00D4FF]"
        />
        <NeonButton onClick={() => sendQuery()} disabled={loading || !input.trim()} color={NEON.blue}>
          <Send className="h-4 w-4" />
          SEND
        </NeonButton>
      </div>
    </div>
  );
}
