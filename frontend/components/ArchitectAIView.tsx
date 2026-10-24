import React, { useState, useEffect, useRef } from 'react';
import { NEON } from '../theme';
import { NeonText, NeonButton } from './DesignSystem';

export const ArchitectAIView = ({ user, diffModules }) => {
  const initialGreeting = `Greetings, ${user?.displayName || "Sovereign"}. I am Architect AI — your real-time Digital Identity Federated Footprint intelligence engine.\n\nI have analyzed your 16-layer identity vector profile. Your Sovereign Score is currently **${Math.round(diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1))}/100**.\n\n🔥 **${diffModules.reduce((s, m) => s + m.nuked, 0)} NUKED** exposures identified across data brokers and breach databases.\n🛡️ **${diffModules.reduce((s, m) => s + m.knoxed, 0)} KNOXED** vectors hardened and secured.\n\nWhat aspect of your digital sovereignty would you like to reclaim today?`;

  const [messages, setMessages] = useState([
    { role: "assistant", content: initialGreeting }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }))
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Unable to process request." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Secure channel temporarily interrupted. Reconnecting..." }]);
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

  const renderMsg = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, color: NEON.blue, margin: "4px 0" }}>{line.replace(/\*\*/g, '')}</div>;
      if (line.includes('**')) return <div key={i} style={{ margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${NEON.blue}">$1</strong>`) }} />;
      if (line.startsWith('🔥') || line.startsWith('🛡️') || line.startsWith('⚠️')) return <div key={i} style={{ margin: "4px 0", color: NEON.text }}>{line}</div>;
      return <div key={i} style={{ margin: "1px 0" }}>{line}</div>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>AI INTELLIGENCE ENGINE</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>ARCHITECT AI</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Real-time security & privacy intelligence · ECRA 2026 compliant · Gemini-powered</div>
      </div>
      <div style={{ height: 1, background: `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`, marginBottom: 16, opacity: 0.5 }} />
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((msg, i) => (
          <div key={i} className="chat-bubble" style={{ display: "flex", gap: 12, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                <span style={{ fontSize: "0.75rem", color: NEON.blue }}>AI</span>
              </div>
            )}
            <div style={{ maxWidth: "78%", background: msg.role === "user" ? "rgba(255,46,159,0.1)" : "rgba(8, 18, 40, 0.85)", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "12px 16px", border: `1px solid ${msg.role === "user" ? NEON.magenta : NEON.blue}33`, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", lineHeight: 1.6, color: NEON.text }}>
              {msg.role === "assistant" ? renderMsg(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.75rem", color: NEON.blue }}>AI</span>
            </div>
            <div style={{ background: "rgba(8, 18, 40, 0.85)", borderRadius: "4px 16px 16px 16px", padding: "12px 20px", border: `1px solid ${NEON.blue}33`, display: "flex", gap: 6, alignItems: "center" }}>
              <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>
      {messages.length <= 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {suggestedQueries.map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ background: "rgba(0,212,255,0.06)", border: `1px solid ${NEON.blue}33`, borderRadius: 20, padding: "6px 14px", color: NEON.blue, fontFamily: "'Rajdhani'", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
              {q}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <div className="neon-border" style={{ flex: 1, borderRadius: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask Architect AI about your digital sovereignty..." style={{ width: "100%", background: "rgba(0,212,255,0.04)", border: "none", outline: "none", padding: "12px 16px", borderRadius: 10, color: NEON.text, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem" }} />
        </div>
        <NeonButton onClick={send} disabled={loading || !input.trim()} color={NEON.blue} style={{ padding: "12px 20px" }}>
          {loading ? "..." : "SEND"}
        </NeonButton>
      </div>
    </div>
  );
};
