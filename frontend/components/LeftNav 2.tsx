import React from 'react';
import { NEON, DIFF_MODULES, GRADIENT_BORDER } from '../constants';

interface LeftNavProps {
  activeModule: string | null;
  setActiveModule: (id: string | null) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
}

export const LeftNav: React.FC<LeftNavProps> = ({ activeModule, setActiveModule, activeSection, setActiveSection }) => {
  const sections = [
    { id: "dashboard", icon: "⬡", label: "DASHBOARD" },
    { id: "architect", icon: "◈", label: "ARCHITECT AI" },
    { id: "report", icon: "⊟", label: "DIFF REPORT" },
  ];

  const totalNuked = DIFF_MODULES.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = DIFF_MODULES.reduce((s, m) => s + m.knoxed, 0);

  return (
    <div className="w-[260px] h-screen flex flex-col overflow-hidden relative" style={{ background: "rgba(6,13,31,0.97)", borderRight: "1px solid rgba(0,212,255,0.12)" }}>
      {/* Scanning line */}
      <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-10" style={{ background: `linear-gradient(90deg, transparent, ${NEON.blue}44, transparent)`, animation: "scan-line 4s linear infinite" }} />
      
      {/* Logo area */}
      <div className="p-5 pb-4 border-b" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" width="28" className="shrink-0" style={{ filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
            <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.8" opacity="0.7" />
            <text x="16" y="20" textAnchor="middle" fill={NEON.blue} className="font-['Orbitron'] text-[8px] font-black">AI</text>
          </svg>
          <div>
            <div className="font-['Orbitron'] text-[0.7rem] font-bold tracking-[0.1em]" style={{ color: NEON.blue }}>ARCHITECT AI</div>
            <div className="font-['Share_Tech_Mono'] text-[0.55rem] tracking-[0.1em]" style={{ color: NEON.textMuted }}>AGAPE SOVEREIGN 2026</div>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 rounded-md py-1 px-2 text-center border" style={{ background: "rgba(255,46,159,0.1)", borderColor: "rgba(255,46,159,0.2)" }}>
            <div className="font-['Orbitron'] text-[0.85rem] font-bold" style={{ color: NEON.magenta }}>{totalNuked}</div>
            <div className="text-[0.58rem] tracking-[0.1em]" style={{ color: NEON.textMuted }}>NUKED</div>
          </div>
          <div className="flex-1 rounded-md py-1 px-2 text-center border" style={{ background: "rgba(0,212,255,0.08)", borderColor: "rgba(0,212,255,0.2)" }}>
            <div className="font-['Orbitron'] text-[0.85rem] font-bold" style={{ color: NEON.blue }}>{totalKnoxed}</div>
            <div className="text-[0.58rem] tracking-[0.1em]" style={{ color: NEON.textMuted }}>KNOXED</div>
          </div>
        </div>
      </div>

      {/* Main sections */}
      <div className="p-3 pb-1">
        {sections.map(s => (
          <div 
            key={s.id} 
            className={`nav-item flex items-center gap-2.5 py-2.5 px-3 rounded-lg mb-0.5 border-l-2 ${activeSection === s.id ? "active" : ""}`} 
            onClick={() => { setActiveSection(s.id); setActiveModule(null); }} 
            style={{ borderColor: activeSection === s.id ? NEON.blue : "transparent" }}
          >
            <span className="text-base w-5" style={{ color: NEON.blue }}>{s.icon}</span>
            <span className="font-['Orbitron'] text-[0.68rem] font-semibold tracking-[0.08em]" style={{ color: activeSection === s.id ? NEON.blue : NEON.text }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 h-[1px] opacity-30" style={{ background: GRADIENT_BORDER }} />

      {/* DIFF Modules label */}
      <div className="px-4 py-1.5 flex items-center gap-2">
        <span className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.15em]" style={{ color: NEON.orange }}>DIFF MODULES</span>
        <div className="flex-1 h-[1px]" style={{ background: `${NEON.orange}44` }} />
        <span className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.orange }}>16</span>
      </div>

      {/* Scrollable modules */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {DIFF_MODULES.map((m) => {
          const isActive = activeModule === m.id;
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          const bgOpacity = sev > 80 ? "0,212,255" : sev > 60 ? "255,122,24" : "255,46,159";
          
          return (
            <div 
              key={m.id} 
              className={`nav-item flex items-center gap-2 py-2 px-2.5 rounded-md mb-px border-l-2 ${isActive ? "active" : ""}`} 
              onClick={() => { setActiveModule(m.id); setActiveSection("modules"); }} 
              style={{ 
                borderColor: isActive ? sevColor : "transparent", 
                background: isActive ? `rgba(${bgOpacity},0.06)` : "transparent" 
              }}
            >
              <span className="text-[0.85rem] w-4 text-center shrink-0" style={{ color: sevColor }}>{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-['Rajdhani'] text-[0.72rem] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: isActive ? sevColor : NEON.text }}>{m.label}</div>
                <div className="font-['Share_Tech_Mono'] text-[0.55rem]" style={{ color: NEON.textMuted }}>{m.vector} · {m.nuked}🔥 {m.knoxed}🛡️</div>
              </div>
              <div className="w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center shrink-0" style={{ borderColor: sevColor }}>
                <span className="font-['Orbitron'] text-[0.5rem] font-bold" style={{ color: sevColor }}>{sev}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom pulsing line */}
      <div className="h-[2px] opacity-80 shrink-0" style={{ background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite" }} />
    </div>
  );
};
