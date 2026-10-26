import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { formatSha256Display } from '../services/sovereignCrypto';

const QUICK_PROMPTS = [
  'Summarize my verified Identity Vector Module risks and top fixes.',
  'How does my lit SHA256 ID enforce zero-knowledge and stop data leaks?',
  'Explain Dual Security (Passkey + Google) and saving my 26-month PDF to Google Drive.',
  'Verify sovereign.nyc DMARC and DNSSEC anti-spoofing posture.',
];

export const ArchitectAIView: React.FC = () => {
  const {
    architectMessages,
    architectThinking,
    sendArchitectInquiry,
    sha256Id,
    setActiveView,
    setSelectedModuleId,
  } = useSovereign();

  const [draft, setDraft] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || architectThinking) return;
    const q = draft;
    setDraft('');
    await sendArchitectInquiry(q);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091224] flex flex-col min-h-[640px]">
      {/* Header */}
      <div className="border-b border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/15 text-cyan-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Architect AI — Privacy, Security &amp; Module Telemetry Backbone
            </h2>
            <p className="text-xs text-slate-400">
              Zero-cost deterministic &amp; live DoH security reasoning bound to{' '}
              <span className="font-mono-code text-emerald-300">{formatSha256Display(sha256Id, true)}</span>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          ZERO DATA EXFILTRATION
        </span>
      </div>

      {/* Starter Prompt Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/50 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          Quick Inquiries:
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={architectThinking}
            onClick={() => sendArchitectInquiry(prompt)}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200 transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversation Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 max-h-[500px]">
        {architectMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'architect' && (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-3xl rounded-2xl border p-4 text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                msg.role === 'user'
                  ? 'border-emerald-400/40 bg-emerald-950/40 text-emerald-100'
                  : 'border-slate-800 bg-slate-950/85 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.referencedModules && msg.referencedModules.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">Inspect Module Gate:</span>
                  {msg.referencedModules.map((modId) => (
                    <button
                      key={modId}
                      type="button"
                      onClick={() => {
                        setSelectedModuleId(modId);
                        setActiveView('modules');
                      }}
                      className="rounded bg-cyan-500/15 border border-cyan-400/40 px-2 py-0.5 font-mono-code text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/25"
                    >
                      {modId} →
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {architectThinking && (
          <div className="text-xs text-cyan-300 font-mono-code animate-pulse">
            Architect AI evaluating zero-knowledge module seals &amp; live DNS/advisory posture…
          </div>
        )}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4 flex items-center gap-2.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Architect AI about privacy, zero-knowledge security, Dual Auth, or any module V-01..V-16…"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={architectThinking || !draft.trim()}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 transition disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
};
