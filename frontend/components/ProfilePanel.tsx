import React, { useState } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText, NeonButton, StatusBadge } from './ui/NeonElements';

interface ProfilePanelProps {
  user: { name: string, email: string, provider: string } | null;
  onClose: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, onClose }) => {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState(["user@agape.nyc"]);

  return (
    <div className="fixed inset-0 z-[900] flex items-start justify-end backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.75)", animation: "fade-in 0.2s ease" }} onClick={onClose}>
      <GlassCard className="w-[340px] mt-14 mr-4 p-5" style={{ animation: "slide-in-left 0.3s ease" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <NeonText color={NEON.magenta} size="0.9rem">SOVEREIGN PROFILE</NeonText>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl" style={{ color: NEON.textMuted }}>×</button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg mb-4 border" style={{ background: "rgba(255,46,159,0.06)", borderColor: "rgba(255,46,159,0.15)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-['Orbitron'] font-black text-white text-[1.2rem]" style={{ background: `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})` }}>
            {user?.name?.[0] || "S"}
          </div>
          <div>
            <div className="font-['Rajdhani'] font-bold" style={{ color: NEON.text }}>{user?.name}</div>
            <div className="font-['Share_Tech_Mono'] text-[0.62rem]" style={{ color: NEON.textMuted }}>{user?.email}</div>
            <div className="font-['Share_Tech_Mono'] text-[0.58rem] mt-0.5" style={{ color: NEON.blue }}>● {user?.provider} · Passkey bound</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="font-['Share_Tech_Mono'] text-[0.6rem] mb-2 tracking-[0.1em]" style={{ color: NEON.orange }}>MONITORED EMAIL ADDRESSES</div>
          {savedEmails.map((e, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2.5 rounded-md mb-1 border" style={{ background: "rgba(0,212,255,0.04)", borderColor: "rgba(0,212,255,0.1)" }}>
              <span className="text-[0.75rem]" style={{ color: NEON.blue }}>✉</span>
              <span className="font-['Share_Tech_Mono'] text-[0.65rem] flex-1" style={{ color: NEON.text }}>{e}</span>
              <StatusBadge type="KNOXED" />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <div className="neon-border flex-1 rounded-md">
              <input 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Add email to monitor" 
                className="w-full border-none outline-none py-2 px-2.5 rounded-md font-['Rajdhani'] text-[0.8rem]" 
                style={{ background: "rgba(0,212,255,0.04)", color: NEON.text }} 
              />
            </div>
            <NeonButton size="sm" color={NEON.blue} onClick={() => { if (email.trim()) { setSavedEmails(p => [...p, email.trim()]); setEmail(""); } }}>ADD</NeonButton>
          </div>
        </div>

        <div className="h-[1px] my-3" style={{ background: `${NEON.blue}22` }} />

        <div className="flex flex-col gap-2">
          {[
            ["🔑", "Passkey Settings", NEON.blue], 
            ["☁️", "Backup to Google Account", NEON.blue], 
            ["🍎", "Backup to Apple Account", NEON.textMuted], 
            ["🔓", "Sign Out", NEON.magenta]
          ].map(([icon, label, color]) => (
            <button key={label} className="flex items-center gap-2.5 py-2 px-2.5 bg-transparent rounded-md font-['Rajdhani'] text-[0.8rem] cursor-pointer text-left border" style={{ borderColor: `${color}22`, color }}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
