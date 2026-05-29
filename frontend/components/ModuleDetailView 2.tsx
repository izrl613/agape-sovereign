import React, { useState } from 'react';
import { NEON, DIFF_MODULES } from '../constants';
import { GlassCard, NeonText, NeonButton, StatusBadge } from './ui/NeonElements';

interface ModuleDetailViewProps {
  moduleId: string;
}

export const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({ moduleId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);

  const m = DIFF_MODULES.find(x => x.id === moduleId);
  if (!m) return null;

  const sev = m.severity;
  const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;

  const findings = [
    { type: "NUKED", label: "Data broker profile found", detail: "Spokeo, Whitepages, BeenVerified", action: "Request removal initiated" },
    { type: "MONITORED", label: "Metadata exposure detected", detail: "Email headers contain IP address", action: "Review & configure" },
    { type: "KNOXED", label: "Breach database clear", detail: "No matches in HaveIBeenPwned", action: "Verified secure" },
    { type: "KNOXED", label: "2FA enforced", detail: "TOTP active on primary account", action: "Hardened" },
    { type: "NUKED", label: "Personal info indexed", detail: "Name + phone on 3 data aggregators", action: "Removal in progress" },
  ].slice(0, m.nuked + m.knoxed > 5 ? 5 : 3) as { type: "NUKED" | "KNOXED" | "MONITORED", label: string, detail: string, action: string }[];

  const baseStages = [
    "INITIALIZING SENSORS",
    "ESTABLISHING SECURE CONNECTION",
    `QUERYING ${m.label.toUpperCase()} REGISTRIES`,
    "ANALYZING METADATA FOOTPRINT",
    "CROSS-REFERENCING THREAT INTEL",
    "COMPILING DIFF VECTORS",
    "SCAN COMPLETE"
  ];

  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setCompletedStages([]);
    setActiveStageIndex(0);
    setCurrentStage(baseStages[0]);
    
    let current = 0;
    const interval = setInterval(() => {
      if (current < baseStages.length) {
        const progress = Math.min(100, Math.floor(((current + 1) / baseStages.length) * 100));
        setScanProgress(progress);
        setCurrentStage(baseStages[current]);
        setActiveStageIndex(current);
        if (current > 0) {
          setCompletedStages(prev => [...prev, baseStages[current-1]]);
        }
        current++;
      } else {
        setCompletedStages(prev => [...prev, baseStages[baseStages.length-1]]);
        setActiveStageIndex(-1);
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 3000);
      }
    }, 1200);
  };

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ animation: "fade-in 0.3s ease" }}>
      <div className="flex items-center gap-4 mb-6">
        <span className="text-3xl" style={{ color: sevColor, filter: `drop-shadow(0 0 8px ${sevColor})` }}>{m.icon}</span>
        <div>
          <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.15em]" style={{ color: NEON.orange }}>{m.vector} · DIFF MODULE</div>
          <NeonText color={sevColor} size="1.2rem" weight={700}>{m.label}</NeonText>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <div className="font-['Orbitron'] text-3xl font-black" style={{ color: sevColor, textShadow: `0 0 20px ${sevColor}` }}>{sev}%</div>
          <div className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>SOVEREIGN SCORE</div>
        </div>
      </div>

      {/* Score bar */}
      <GlassCard className="p-4 mb-5">
        <div className="flex justify-between mb-2">
          <span className="font-['Share_Tech_Mono'] text-[0.65rem]" style={{ color: NEON.textMuted }}>SECURITY POSTURE</span>
          <span className="font-['Orbitron'] text-[0.65rem]" style={{ color: sevColor }}>{sev > 80 ? "SECURED" : sev > 60 ? "MODERATE" : "EXPOSED"}</span>
        </div>
        <div className="h-1.5 rounded-[3px] overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-[3px] transition-all duration-1000 ease-out" style={{ width: `${sev}%`, background: `linear-gradient(90deg, ${NEON.magenta}, ${sevColor})`, boxShadow: `0 0 10px ${sevColor}` }} />
        </div>
        <div className="flex justify-between mt-3 gap-3">
          {[{ l: "NUKED", v: m.nuked, c: NEON.magenta }, { l: "KNOXED", v: m.knoxed, c: NEON.blue }, { l: "MONITORED", v: m.monitored, c: NEON.orange }].map(s => (
            <div key={s.l} className="flex-1 text-center rounded-lg py-2.5 border" style={{ background: `rgba(${s.c === NEON.magenta ? "255,46,159" : s.c === NEON.blue ? "0,212,255" : "255,122,24"},0.08)`, borderColor: `${s.c}22` }}>
              <div className="font-['Orbitron'] text-xl font-black" style={{ color: s.c }}>{s.v}</div>
              <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.1em]" style={{ color: NEON.textMuted }}>{s.l}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Findings */}
      <div className="mb-4">
        <NeonText color={NEON.orange} size="0.72rem">INTELLIGENCE FINDINGS</NeonText>
      </div>
      <div className="flex flex-col gap-2.5 mb-5">
        {findings.map((f, i) => (
          <div key={i} className={`rounded-lg py-3.5 px-4 border flex items-center gap-3.5 ${f.type === "NUKED" ? "nuked-item" : f.type === "KNOXED" ? "knoxed-item" : ""}`} style={{ borderColor: `${f.type === "NUKED" ? NEON.magenta : f.type === "KNOXED" ? NEON.blue : NEON.orange}33` }}>
            <div className="shrink-0"><StatusBadge type={f.type} /></div>
            <div className="flex-1">
              <div className="font-['Rajdhani'] font-semibold text-[0.85rem]" style={{ color: NEON.text }}>{f.label}</div>
              <div className="font-['Share_Tech_Mono'] text-[0.62rem] mt-0.5" style={{ color: NEON.textMuted }}>{f.detail}</div>
            </div>
            <div>
              <NeonButton size="sm" color={f.type === "NUKED" ? NEON.magenta : f.type === "KNOXED" ? NEON.blue : NEON.orange}>
                {f.type === "NUKED" ? "NUKE" : f.type === "KNOXED" ? "KNOX" : "REVIEW"}
              </NeonButton>
            </div>
          </div>
        ))}
      </div>

      {/* Scan Progress Visualization */}
      {isScanning && (
        <GlassCard className="p-5 mb-5 border" style={{ borderColor: `${NEON.blue}55`, background: "rgba(0, 212, 255, 0.05)" }}>
          <div className="flex justify-between mb-3 items-center">
            <div className="flex items-baseline gap-2.5">
              <span className="font-['Orbitron'] text-[0.85rem] font-extrabold" style={{ color: NEON.blue }}>VECTOR ANALYSIS ACTIVE</span>
              <span className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>{m.vector}</span>
            </div>
            <div className="text-right">
              <span className="font-['Orbitron'] text-[1.1rem] font-black" style={{ color: NEON.blue }}>{scanProgress}%</span>
            </div>
          </div>

          <div className="h-1.5 rounded-[3px] overflow-hidden mb-5 border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(0,212,255,0.1)" }}>
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${scanProgress}%`, background: `linear-gradient(90deg, ${NEON.blue}88, ${NEON.blue})`, boxShadow: `0 0 15px ${NEON.blue}` }} />
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {baseStages.map((stage, idx) => {
              const isCompleted = completedStages.includes(stage);
              const isActive = activeStageIndex === idx;
              return (
                <div key={idx} className="flex items-center gap-2.5 transition-all duration-300" style={{ opacity: isCompleted || isActive ? 1 : 0.3 }}>
                  <div className="w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center" style={{ borderColor: isCompleted ? NEON.blue : isActive ? NEON.orange : 'rgba(255,255,255,0.2)', background: isCompleted ? NEON.blue : 'transparent' }}>
                    {isCompleted && <span className="text-[0.5rem] font-black" style={{ color: NEON.bg }}>✓</span>}
                    {isActive && <div className="w-1 h-1 rounded-full" style={{ background: NEON.orange, animation: 'pulse-border 1s infinite' }} />}
                  </div>
                  <span className="font-['Share_Tech_Mono'] text-[0.62rem]" style={{ color: isActive ? NEON.orange : isCompleted ? NEON.blue : NEON.textMuted, fontWeight: isActive ? 700 : 400 }}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t flex justify-between items-center" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
             <div className="flex gap-1">
                {[0,1,2,3].map(i => <div key={i} className="w-0.5 h-2.5" style={{ background: NEON.blue, opacity: 0.3 + (i * 0.2) }} />)}
             </div>
             <div className="font-['Share_Tech_Mono'] text-[0.55rem] tracking-[0.1em]" style={{ color: NEON.blue }}>
                CURRENT: {currentStage}
             </div>
          </div>
        </GlassCard>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pb-6">
        <NeonButton onClick={handleScan} disabled={isScanning} color={NEON.orange} className="flex-1">⟳ INITIATE VECTOR SWEEP</NeonButton>
        <NeonButton disabled={isScanning} color={NEON.magenta} className="flex-1">🔥 NUKE ALL EXPOSURES</NeonButton>
        <NeonButton disabled={isScanning} color={NEON.blue} className="flex-1">🛡️ KNOX ALL SECURED</NeonButton>
      </div>
    </div>
  );
};
