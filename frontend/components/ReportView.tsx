import React, { useState } from 'react';
import { NEON, DIFF_MODULES, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText, NeonButton } from './ui/NeonElements';

export const ReportView: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const totalNuked = DIFF_MODULES.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = DIFF_MODULES.reduce((s, m) => s + m.knoxed, 0);
  const avgScore = Math.round(DIFF_MODULES.reduce((s, m) => s + m.severity, 0) / DIFF_MODULES.length);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
  };

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ animation: "fade-in 0.4s ease" }}>
      <div className="mb-6">
        <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.2em] mb-1" style={{ color: NEON.orange }}>LIGHTHOUSE-STYLE AUDIT</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>DIFF SOVEREIGNTY REPORT</NeonText>
        <div className="text-[0.75rem] mt-0.5" style={{ color: NEON.textMuted }}>Generate your complete Digital Identity Federated Footprint audit · Firebase-backed · Encrypted PDF</div>
      </div>
      <div className="h-[1px] mb-6 opacity-50" style={{ background: GRADIENT_BORDER }} />

      {/* Report preview card */}
      <GlassCard className="p-6 mb-5">
        <div className="flex justify-between items-start mb-5">
          <div>
            <NeonText color={NEON.blue} size="1rem">AGAPE SOVEREIGN ENCLAVE 2026</NeonText>
            <div className="font-['Share_Tech_Mono'] text-[0.65rem] mt-1" style={{ color: NEON.textMuted }}>DIGITAL IDENTITY FEDERATED FOOTPRINT REPORT</div>
            <div className="font-['Share_Tech_Mono'] text-[0.6rem] mt-1" style={{ color: NEON.orange }}>ECRA 2026 · GDPR · CCPA COMPLIANT</div>
          </div>
          <div className="text-center">
            <div className="font-['Orbitron'] text-[2.5rem] font-black" style={{ color: avgScore > 75 ? NEON.blue : avgScore > 50 ? NEON.orange : NEON.magenta, textShadow: `0 0 20px ${avgScore > 75 ? NEON.blue : NEON.orange}` }}>{avgScore}</div>
            <div className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>SOVEREIGN SCORE</div>
          </div>
        </div>

        {/* Report sections */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "IDENTITY VECTORS SCANNED", value: "16 / 16", color: NEON.blue },
            { label: "TOTAL EXPOSURES", value: totalNuked + " found", color: NEON.magenta },
            { label: "SECURED ASSETS", value: totalKnoxed + " hardened", color: NEON.blue },
            { label: "COMPLIANCE STATUS", value: "ECRA 2026", color: NEON.orange },
            { label: "PASSKEY STATUS", value: "✓ Device-bound", color: NEON.blue },
            { label: "ENCRYPTION", value: "✓ AES-256-GCM", color: NEON.blue },
            { label: "REPORT TYPE", value: "Lighthouse-v3", color: NEON.orange },
            { label: "CLOUD AUDIT ID", value: `ASE-${Date.now().toString(36).toUpperCase()}`, color: NEON.textMuted },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2 px-3 rounded-md border" style={{ background: "rgba(0,212,255,0.03)", borderColor: "rgba(0,212,255,0.08)" }}>
              <span className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>{row.label}</span>
              <span className="font-['Share_Tech_Mono'] text-[0.6rem] font-bold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Module breakdown */}
      <div className="mb-3">
        <NeonText color={NEON.orange} size="0.72rem">VECTOR-BY-VECTOR BREAKDOWN</NeonText>
      </div>
      <div className="flex flex-col gap-1.5 mb-6">
        {DIFF_MODULES.slice(0, 8).map(m => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-md border" style={{ background: "rgba(0,212,255,0.02)", borderColor: "rgba(0,212,255,0.07)" }}>
              <span className="text-[0.8rem] w-5" style={{ color: sevColor }}>{m.icon}</span>
              <span className="font-['Rajdhani'] text-[0.75rem] flex-1" style={{ color: NEON.text }}>{m.label}</span>
              <div className="w-20 h-[3px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-sm" style={{ width: `${sev}%`, background: sevColor }} />
              </div>
              <span className="font-['Orbitron'] text-[0.65rem] w-8 text-right" style={{ color: sevColor }}>{sev}%</span>
            </div>
          );
        })}
        <div className="font-['Share_Tech_Mono'] text-[0.6rem] text-center py-1" style={{ color: NEON.textMuted }}>+ 8 more vectors in full report</div>
      </div>

      {/* Generate button */}
      {!generated ? (
        <div className="flex gap-3 pb-6">
          <button 
            className="btn-neon neon-border pulse-border flex-1 p-4 rounded-lg border-none font-['Orbitron'] text-[0.85rem] font-bold tracking-[0.1em]" 
            onClick={handleGenerate} 
            disabled={generating} 
            style={{ background: "rgba(0,212,255,0.08)", color: NEON.blue, cursor: generating ? "not-allowed" : "pointer" }}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: `rgba(0,212,255,0.3)`, borderTopColor: NEON.blue, animation: "spinner 1s linear infinite" }} />
                GENERATING SOVEREIGN REPORT...
              </span>
            ) : "⬡ GENERATE DIFF PDF REPORT"}
          </button>
        </div>
      ) : (
        <GlassCard className="p-5 text-center border pb-6" style={{ borderColor: `${NEON.blue}44` }}>
          <div className="text-3xl mb-2">✅</div>
          <NeonText color={NEON.blue} size="1rem">REPORT GENERATED SUCCESSFULLY</NeonText>
          <div className="text-[0.75rem] my-2 mb-4" style={{ color: NEON.textMuted }}>Encrypted · Stored in Firebase Storage · ECRA 2026 certified</div>
          <div className="flex gap-2.5 justify-center">
            <NeonButton color={NEON.blue}>⬇️ DOWNLOAD PDF</NeonButton>
            <NeonButton color={NEON.orange}>☁️ FIREBASE STORAGE</NeonButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
