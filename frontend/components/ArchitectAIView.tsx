import React, { useState, useEffect, useRef } from 'react';
import { NEON, GRADIENT_BORDER, SYSTEM_PROMPT } from '../constants';
import { NeonText, NeonButton } from './ui/NeonElements';

export const ArchitectAIView: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Greetings, Sovereign. I am Architect AI — your real-time Digital Identity Federated Footprint intelligence engine.\n\nI have analyzed your 16-layer identity vector profile. Your Sovereign Score is currently 71/100.\n\n🔥 59 NUKED exposures identified across data brokers and breach databases.\n🛡️ 207 KNOXED vectors hardened and secured.\n\nWhat aspect of your digital sovereignty would you like to reclaim today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMsg }
          ],
          max_tokens: -1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Local AI returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "No response received from local AI.";
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Local AI is unavailable. Start Ollama and retry." }]);
    }
    setLoading(false);
  };

  const suggestedQueries = [
    "What are my highest-risk exposures?",
    "How do I NUKE my data broker profiles?",
    "Explain ECRA 2026 compliance",
    "What does KNOXED mean for my files?",
    "How is my Sovereign Score calculated?",
  ];

  const renderMsg = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###') || line.startsWith('##')) return <div key={i} className="font-bold my-1" style={{ color: NEON.blue }}>{line.replace(/#/g, '').trim()}</div>;
      if (line.includes('**')) return <div key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${NEON.blue}">$1</strong>`) }} />;
      if (line.startsWith('🔥') || line.startsWith('🛡️') || line.startsWith('⚠️')) return <div key={i} className="my-1" style={{ color: NEON.text }}>{line}</div>;
      if (line.startsWith('- ')) return <div key={i} className="ml-4 my-0.5">• {line.substring(2)}</div>;
      return <div key={i} className="my-0.5 min-h-[1em]">{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.2em] mb-1" style={{ color: NEON.orange }}>AI INTELLIGENCE ENGINE</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>ARCHITECT AI</NeonText>
        <div className="text-[0.75rem] mt-0.5" style={{ color: NEON.textMuted }}>Real-time security & privacy intelligence · ECRA 2026 compliant · Gemma 4 E4B local AI</div>
      </div>
      <div className="h-[1px] mb-4 opacity-50 shrink-0" style={{ background: GRADIENT_BORDER }} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-3 flex flex-col gap-3.5 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className="chat-bubble flex gap-3" style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1" style={{ background: "rgba(0,212,255,0.1)", borderColor: `${NEON.blue}44` }}>
                <span className="text-[0.75rem]" style={{ color: NEON.blue }}>AI</span>
              </div>
            )}
            <div className="max-w-[78%] p-3 border font-['Rajdhani'] text-[0.85rem] leading-relaxed" style={{ 
              background: msg.role === "user" ? "rgba(255,46,159,0.1)" : NEON.bgCard, 
              borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", 
              borderColor: `${msg.role === "user" ? NEON.magenta : NEON.blue}33`, 
              color: NEON.text 
            }}>
              {msg.role === "assistant" ? renderMsg(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ background: "rgba(0,212,255,0.1)", borderColor: `${NEON.blue}44` }}>
              <span className="text-[0.75rem]" style={{ color: NEON.blue }}>AI</span>
            </div>
            <div className="p-3 border rounded-[4px_16px_16px_16px] flex gap-1.5 items-center" style={{ background: NEON.bgCard, borderColor: `${NEON.blue}33` }}>
              <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Suggested queries */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {suggestedQueries.map(q => (
            <button key={q} onClick={() => setInput(q)} className="border rounded-full py-1.5 px-3.5 font-['Rajdhani'] text-[0.75rem] cursor-pointer transition-all hover:bg-opacity-20" style={{ background: "rgba(0,212,255,0.06)", borderColor: `${NEON.blue}33`, color: NEON.blue }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2.5 shrink-0">
        <div className="neon-border flex-1 rounded-lg">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && send()} 
            placeholder="Ask Architect AI about your digital sovereignty..." 
            className="w-full border-none outline-none py-3 px-4 rounded-lg font-['Rajdhani'] text-[0.9rem]" 
            style={{ background: "rgba(0,212,255,0.04)", color: NEON.text }} 
          />
        </div>
        <NeonButton onClick={send} disabled={loading || !input.trim()} color={NEON.blue} className="py-3 px-5">
          {loading ? "..." : "SEND"}
        </NeonButton>
      </div>
    </div>
  );
};
