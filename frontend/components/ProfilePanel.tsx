import React, { useState } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText, NeonButton, StatusBadge } from './ui/NeonElements';

interface ProfilePanelProps {
  user: { name: string, email: string, provider: string } | null;
  onClose: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, onClose }) => {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [consentToSave, setConsentToSave] = useState(false);

  const handleAddEmail = () => {
    const trimmed = email.trim();
    if (!trimmed || !consentToSave) return;
    setSavedEmails((prev) => [...prev, trimmed]);
    setEmail("");
    setConsentToSave(false);
  };

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
          <div className="rounded-md border px-3 py-2.5 mb-2" style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.12)" }}>
            <div className="font-['Share_Tech_Mono'] text-[0.58rem] tracking-[0.08em]" style={{ color: NEON.blue }}>
              EPHEMERAL BY DEFAULT
            </div>
            <div className="text-[0.72rem] leading-relaxed mt-1" style={{ color: NEON.textMuted }}>
              Nothing is saved to your profile until you explicitly opt in below.
            </div>
          </div>
          {savedEmails.length === 0 ? (
            <div className="rounded-md border px-3 py-2.5 mb-1" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="font-['Share_Tech_Mono'] text-[0.62rem]" style={{ color: NEON.textMuted }}>
                No monitored emails saved yet.
              </div>
            </div>
          ) : savedEmails.map((e, i) => (
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
            <NeonButton size="sm" color={NEON.blue} onClick={handleAddEmail} disabled={!email.trim() || !consentToSave}>SAVE</NeonButton>
          </div>
          <label className="flex items-start gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentToSave}
              onChange={(e) => setConsentToSave(e.target.checked)}
              className="mt-0.5"
            />
            <span className="font-['Share_Tech_Mono'] text-[0.58rem] leading-relaxed" style={{ color: NEON.textMuted }}>
              I explicitly consent to save this monitored email to my profile.
            </span>
          </label>
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
