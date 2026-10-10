import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Flame, ShieldCheck, Bot, User, RefreshCw, Hash } from 'lucide-react';
import { DiffVector, ChatMessage } from '../types';
import { architectAI } from '../services/geminiService';

interface ArchitectAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: DiffVector[];
  sovereignScore: number;
  focusedVector: DiffVector | null;
  onNukeVector: (id: string) => void;
  onKnoxVector: (id: string) => void;
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'architect_ai',
      text: `Greetings Sovereign. I am your **Architect AI Chief of Staff** for the Agape Sovereign Enclave. I continuously cross-examine your 16 DIFF identity vectors against the 2026 ERCA/ECRA privacy frameworks. Ask me anything regarding breach remediations, whether to **NUKE** or **KNOX** specific surfaces, or how to eradicate data broker listings.`,
      timestamp: 'Active Now',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedVector) {
      const prompt = `Conduct an in-depth security & privacy analysis of Module #${focusedVector.moduleNumber}: "${focusedVector.name}". Its current status is ${focusedVector.status}. Should I NUKE it or KNOX it?`;
      handleSendPrompt(prompt);
    }
  }, [focusedVector]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendPrompt = async (textToSend: string) => {
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
      const reply = await architectAI.askChiefOfStaff(
        textToSend,
        vectors,
        sovereignScore,
        focusedVector
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'architect_ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vectorReferenceId: focusedVector?.id,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md">
      {/* Outer neon glowing wrapper */}
      <div className="relative w-full max-w-3xl h-[85vh] rounded-3xl p-[2px] overflow-hidden flex flex-col">
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
                  <h3 className="text-base font-bold text-white">Chief of Staff AI Engine</h3>
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

          {/* Quick Suggestion Pills */}
          <div className="px-4 py-2.5 bg-[#0B1020] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-mono text-slate-300 shrink-0 font-bold uppercase">Quick Inquiries:</span>
            <button
              onClick={() => handleSendPrompt("Which identity vectors are currently causing the highest risk exposure to my profile?")}
              className="px-2.5 py-1 rounded-lg bg-[#111A33] hover:bg-slate-800 text-cyan-200 border border-cyan-500/30 shrink-0 whitespace-nowrap"
            >
              Where am I most vulnerable?
            </button>
            <button
              onClick={() => handleSendPrompt("Explain how data brokers obtain my mobile and home address and how the NUKE command works.")}
              className="px-2.5 py-1 rounded-lg bg-[#111A33] hover:bg-slate-800 text-pink-200 border border-pink-500/30 shrink-0 whitespace-nowrap"
            >
              How does NUKE handle Data Brokers?
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
            {messages.map((msg) => (
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
                  
                  {/* Action buttons if vector reference exists */}
                  {msg.vectorReferenceId && (
                    <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-2">
                      <button
                        onClick={() => onNukeVector(msg.vectorReferenceId!)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40 hover:bg-[#FF2E9F]/30 text-xs font-mono font-bold"
                      >
                        <Flame className="w-3.5 h-3.5" /> Execute NUKE
                      </button>
                      <button
                        onClick={() => onKnoxVector(msg.vectorReferenceId!)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 hover:bg-[#00D4FF]/30 text-xs font-mono font-bold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Execute KNOX
                      </button>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] font-mono text-slate-300 flex justify-end">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/20 border border-[#00D4FF]/50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-xs font-mono text-[#00D4FF]">
                <div className="w-8 h-8 rounded-lg bg-[#111A33] border border-cyan-500/40 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00D4FF]" />
                </div>
                <span>Architect AI is synthesizing 16-vector telemetry...</span>
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
                placeholder="Ask Chief of Staff AI about security, privacy, or vector remediation..."
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
