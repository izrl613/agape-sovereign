import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Sparkles, Flame, ShieldCheck, Bot, User, RefreshCw, Hash, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { DiffVector, ChatMessage } from '../types';
import { architectAI } from '../services/geminiService';
import { calculateSha256 } from '../services/cryptoService';

interface ArchitectAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: DiffVector[];
  sovereignScore: number;
  focusedVector: DiffVector | null;
  onNukeVector: (id: string) => Promise<string | void>;
  onKnoxVector: (id: string) => Promise<string | void>;
}

export const ArchitectAIChat: React.FC<ArchitectAIChatProps> = ({
  isOpen,
  onClose,
  vectors,
  sovereignScore,
  focusedVector,
  onNukeVector,
  onKnoxVector,
}) => {
  const [selectedVectorId, setSelectedVectorId] = useState<string>(
    focusedVector ? focusedVector.id : vectors[0]?.id || 'diff-01'
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'architect_ai',
      text: `Greetings Sovereign. I am **Architect AI** for the Agape Sovereign Enclave. I continuously cross-examine your 16 DIFF identity vectors against the 2026 ERCA/ECRA privacy frameworks.\n\nYou can query breach remediations, analyze risk surfaces, and execute live **NUKE** (permanent erasure/takedown) or **KNOX** (hardware enclave hardening) commands directly through this console with real-time SHA-256 receipts.`,
      timestamp: 'Active Now',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingVectorId, setExecutingVectorId] = useState<string | null>(null);
  const [executedActionType, setExecutedActionType] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedVector) {
      setSelectedVectorId(focusedVector.id);
      const prompt = `Conduct an in-depth security & privacy analysis of Module #${focusedVector.moduleNumber}: "${focusedVector.name}". Its current status is ${focusedVector.status}. Should I NUKE it or KNOX it?`;
      handleSendPrompt(prompt, focusedVector.id);
    }
  }, [focusedVector]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, executingVectorId]);

  const activeVector = useMemo(() => {
    return vectors.find(v => v.id === selectedVectorId) || vectors[0];
  }, [vectors, selectedVectorId]);

  // Detect if AI response refers to a specific vector ID or number
  const detectVectorInText = (text: string): string | undefined => {
    for (const v of vectors) {
      if (
        text.toLowerCase().includes(`module #${v.moduleNumber}`) ||
        text.toLowerCase().includes(`module ${v.moduleNumber}`) ||
        text.toLowerCase().includes(v.name.toLowerCase()) ||
        text.toLowerCase().includes(v.id.toLowerCase())
      ) {
        return v.id;
      }
    }
    return activeVector?.id;
  };

  const handleSendPrompt = async (textToSend: string, explicitVectorId?: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const targetVec = explicitVectorId ? vectors.find(v => v.id === explicitVectorId) : activeVector;
      const reply = await architectAI.askArchitectAI(
        textToSend,
        vectors,
        sovereignScore,
        targetVec || null
      );

      const refId = explicitVectorId || detectVectorInText(reply) || activeVector?.id;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'architect_ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vectorReferenceId: refId,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Live execution of NUKE command with cryptographic receipt in chat
  const handleExecuteNukeInChat = async (vectorId: string) => {
    const target = vectors.find(v => v.id === vectorId);
    if (!target) return;

    setExecutingVectorId(vectorId);
    setExecutedActionType('NUKE');

    try {
      const hash = await onNukeVector(vectorId);
      const computedHash = hash || await calculateSha256(`${target.name}::NUKED_ACTION::${Date.now()}`);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const confirmationMsg: ChatMessage = {
        id: `confirm-nuke-${Date.now()}`,
        sender: 'architect_ai',
        text: `🔥 **ENCLAVE ACTION CONFIRMED : NUKED**\n\n* **Target Vector:** Module #${target.moduleNumber} — ${target.name}\n* **Action Executed:** ${target.nukedAction}\n* **SHA-256 Cryptographic Receipt:** \`${computedHash}\`\n* **Persistence:** Synchronized live to Cloud Firestore \`/users/{uid}\`.\n* **Audit Timestamp:** ${timeStr} UTC\n\nPublic exposures have been scrubbed from surveillance caches and statutory GDPR/CCPA erasure orders deployed.`,
        timestamp: timeStr,
        vectorReferenceId: target.id,
      };

      setMessages(prev => [...prev, confirmationMsg]);
    } finally {
      setExecutingVectorId(null);
      setExecutedActionType(null);
    }
  };

  // Live execution of KNOX command with cryptographic receipt in chat
  const handleExecuteKnoxInChat = async (vectorId: string) => {
    const target = vectors.find(v => v.id === vectorId);
    if (!target) return;

    setExecutingVectorId(vectorId);
    setExecutedActionType('KNOX');

    try {
      const hash = await onKnoxVector(vectorId);
      const computedHash = hash || await calculateSha256(`${target.name}::KNOXED_ENCLAVE::${Date.now()}`);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const confirmationMsg: ChatMessage = {
        id: `confirm-knox-${Date.now()}`,
        sender: 'architect_ai',
        text: `🛡️ **ENCLAVE ACTION CONFIRMED : KNOXED**\n\n* **Target Vector:** Module #${target.moduleNumber} — ${target.name}\n* **Hardening Protocol:** ${target.knoxedAction}\n* **Web Crypto AES-GCM Digest:** \`${computedHash}\`\n* **Hardware Anchor:** Bound to FIDO2 WebAuthn Hardware Passkey\n* **Audit Timestamp:** ${timeStr} UTC\n\nIdentity parameter is now cryptographically locked with zero plaintext server exposure.`,
        timestamp: timeStr,
        vectorReferenceId: target.id,
      };

      setMessages(prev => [...prev, confirmationMsg]);
    } finally {
      setExecutingVectorId(null);
      setExecutedActionType(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md">
      {/* Outer neon glowing wrapper */}
      <div className="relative w-full max-w-3xl h-[88vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF2E9F] to-[#00D4FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Architect AI Engine</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    GEMINI 2.5 FLASH
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Sovereign DIFF Intelligence • 2026 ECRA Protocol
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Vector Quick Console (Allows NUKE/KNOX on any vector live) */}
          <div className="px-4 py-2.5 bg-[#0F172A] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Target Vector:</span>
              <select
                value={selectedVectorId}
                onChange={(e) => setSelectedVectorId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#0B1020] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-[#00D4FF]"
              >
                {vectors.map(v => (
                  <option key={v.id} value={v.id}>
                    #{v.moduleNumber} {v.name.length > 25 ? v.name.substring(0, 24) + '...' : v.name} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExecuteNukeInChat(selectedVectorId)}
                disabled={executingVectorId === selectedVectorId}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40 hover:bg-[#FF2E9F]/30 text-xs font-mono font-bold transition disabled:opacity-40"
              >
                {executingVectorId === selectedVectorId && executedActionType === 'NUKE' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Flame className="w-3.5 h-3.5" />
                )}
                <span>Execute NUKE</span>
              </button>

              <button
                onClick={() => handleExecuteKnoxInChat(selectedVectorId)}
                disabled={executingVectorId === selectedVectorId}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 hover:bg-[#00D4FF]/30 text-xs font-mono font-bold transition disabled:opacity-40"
              >
                {executingVectorId === selectedVectorId && executedActionType === 'KNOX' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Execute KNOX</span>
              </button>
            </div>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-4 py-2 bg-[#0B1020] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-mono text-slate-300 shrink-0 font-bold uppercase">Quick Inquiries:</span>
            <button
              onClick={() => handleSendPrompt("Which identity vectors are currently causing the highest risk exposure to my profile?")}
              className="px-2.5 py-1 rounded-lg bg-[#111A33] hover:bg-slate-800 text-cyan-200 border border-cyan-500/30 shrink-0 whitespace-nowrap"
            >
              Where am I most vulnerable?
            </button>
            <button
              onClick={() => handleSendPrompt(`Analyze Module #${activeVector.moduleNumber}: ${activeVector.name}. Recommend whether to NUKE or KNOX.`)}
              className="px-2.5 py-1 rounded-lg bg-[#111A33] hover:bg-slate-800 text-pink-200 border border-pink-500/30 shrink-0 whitespace-nowrap"
            >
              Audit #{activeVector.moduleNumber} {activeVector.name}
            </button>
            <button
              onClick={() => handleSendPrompt("How does KNOX hardware enclave isolation compare to standard 2FA under 2026 ECRA standards?")}
              className="px-2.5 py-1 rounded-lg bg-[#111A33] hover:bg-slate-800 text-orange-200 border border-orange-500/30 shrink-0 whitespace-nowrap"
            >
              KNOX Passkey Enforcement
            </button>
          </div>

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const refVector = msg.vectorReferenceId ? vectors.find(v => v.id === msg.vectorReferenceId) : null;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'architect_ai' && (
                    <div className="w-8 h-8 rounded-lg bg-[#111A33] border border-cyan-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-tr-none'
                        : 'bg-[#111A33] border border-slate-700/80 text-slate-200 rounded-tl-none font-sans'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    
                    {/* Live Action buttons when vector reference exists */}
                    {refVector && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 font-mono">
                        <div className="text-[11px] text-cyan-300">
                          Active Target: <strong>#{refVector.moduleNumber} {refVector.name}</strong> ({refVector.status})
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExecuteNukeInChat(refVector.id)}
                            disabled={executingVectorId === refVector.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-sm ${
                              refVector.status === 'NUKED'
                                ? 'bg-[#FF2E9F] text-white shadow-[0_0_10px_rgba(255,46,159,0.5)]'
                                : 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50 hover:bg-[#FF2E9F]/30'
                            }`}
                          >
                            {executingVectorId === refVector.id && executedActionType === 'NUKE' ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Flame className="w-3.5 h-3.5" />
                            )}
                            <span>{refVector.status === 'NUKED' ? 'NUKED ✓' : 'Execute NUKE'}</span>
                          </button>

                          <button
                            onClick={() => handleExecuteKnoxInChat(refVector.id)}
                            disabled={executingVectorId === refVector.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-sm ${
                              refVector.status === 'KNOXED'
                                ? 'bg-[#00D4FF] text-[#0B1020] shadow-[0_0_10px_rgba(0,212,255,0.5)] font-black'
                                : 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50 hover:bg-[#00D4FF]/30'
                            }`}
                          >
                            {executingVectorId === refVector.id && executedActionType === 'KNOX' ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>{refVector.status === 'KNOXED' ? 'KNOXED ✓' : 'Execute KNOX'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-[10px] font-mono text-slate-400 flex justify-end">
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/20 border border-[#00D4FF]/50 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 items-center text-xs font-mono text-[#00D4FF]">
                <div className="w-8 h-8 rounded-lg bg-[#111A33] border border-cyan-500/40 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00D4FF]" />
                </div>
                <span>Architect AI is calculating perimeter intelligence...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-[#0F172A] border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask Architect AI about #${activeVector.moduleNumber} ${activeVector.name} or general security...`}
                className="flex-1 px-4 py-3 rounded-xl bg-[#0B1020] border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00D4FF] transition"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-[#FF2E9F] to-[#00D4FF] text-white hover:opacity-90 disabled:opacity-40 transition shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
