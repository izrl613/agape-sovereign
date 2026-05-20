import React, { useState, useEffect } from 'react';
import { NEON, GRADIENT_BORDER, ADMIN_EMAILS } from '../constants';
import { NeonButton } from './ui/NeonElements';

interface TopHeaderProps {
  user: { name: string, email: string, provider: string } | null;
  onAdmin: () => void;
  onProfile: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ user, onAdmin, onProfile }) => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => { 
    const t = setInterval(() => setTime(new Date()), 1000); 
    return () => clearInterval(t); 
  }, []);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  return (
    <div className="h-14 flex items-center px-5 gap-4 relative shrink-0" style={{ background: "rgba(6,13,31,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-60" style={{ background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 4s linear infinite" }} />
      
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0f0]" style={{ boxShadow: "0 0 8px #0f0", animation: "pulse-border 1.5s infinite" }} />
        <span className="font-['Share_Tech_Mono'] text-[0.65rem] text-[#0f0] tracking-[0.1em]">LIVE</span>
      </div>

      <div className="h-5 w-[1px]" style={{ background: "rgba(0,212,255,0.2)" }} />

      {/* Time */}
      <span className="font-['Share_Tech_Mono'] text-[0.7rem]" style={{ color: NEON.blue }}>
        {time.toLocaleTimeString("en-US", { hour12: false })} UTC
      </span>

      <div className="h-5 w-[1px]" style={{ background: "rgba(0,212,255,0.2)" }} />

      <span className="font-['Share_Tech_Mono'] text-[0.65rem] tracking-[0.08em]" style={{ color: NEON.orange }}>
        ECRA 2026 · GDPR · CCPA
      </span>

      <div className="flex-1" />

      {/* DIFF label */}
      <div className="flex gap-2 items-center">
        <span className="font-['Orbitron'] text-[0.65rem]" style={{ color: NEON.textMuted }}>DIFF ACTIVE</span>
        <div className="w-2 h-2 rounded-full" style={{ background: NEON.blue, animation: "glow-pulse 2s infinite" }} />
      </div>

      <div className="h-5 w-[1px]" style={{ background: "rgba(0,212,255,0.2)" }} />

      {/* Admin portal button */}
      {isAdmin && (
        <NeonButton onClick={onAdmin} color={NEON.orange} size="sm">⬡ ADMIN</NeonButton>
      )}

      {/* Profile button */}
      <button 
        className="btn-neon neon-border w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center text-base" 
        onClick={onProfile} 
        style={{ background: "rgba(255,46,159,0.1)", color: NEON.magenta }}
      >
        {user?.provider === "google" ? "G" : "A"}
      </button>
    </div>
  );
};
