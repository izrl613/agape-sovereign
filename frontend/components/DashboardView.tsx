import React from 'react';
import { NEON, DIFF_MODULES } from '../constants';
import { GlassCard, NeonText, SovereignScore } from './ui/NeonElements';

interface DashboardViewProps {
  onModuleClick: (id: string) => void;
  user: { name: string; email: string; provider: string; nukedCount?: number; knoxedCount?: number };
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onModuleClick, user }) => {
  const totalExposures = user.nukedCount !== undefined ? user.nukedCount : DIFF_MODULES.reduce((s, m) => s + m.nuked + m.monitored, 0);
  const totalSecured = user.knoxedCount !== undefined ? user.knoxedCount : DIFF_MODULES.reduce((s, m) => s + m.knoxed, 0);
  const sovereignScore = user.nukedCount !== undefined ? Math.max(10, 100 - (user.nukedCount * 6)) : 71;
  const criticalModules = DIFF_MODULES.filter(m => m.severity < 60);

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ animation: "fade-in 0.4s ease" }}>
      {/* Header row */}
      <div className="flex items-start gap-6 mb-7">
        <div className="flex-1">
          <div className="font-['Orbitron'] text-[0.6rem] tracking-[0.2em] mb-1.5" style={{ color: NEON.orange }}>DIGITAL IDENTITY FEDERATED FOOTPRINT</div>
          <NeonText color={NEON.blue} size="1.5rem" weight={900}>DIFF COMMAND CENTER</NeonText>
          <div className="text-[0.8rem] mt-1" style={{ color: NEON.textMuted }}>16-Layer identity vector analysis · Real-time threat intelligence</div>
        </div>
        <SovereignScore score={sovereignScore} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "VECTORS ACTIVE", value: "16", sub: "All layers online", color: NEON.blue },
          { label: "EXPOSURES FOUND", value: totalExposures, sub: "Across all surfaces", color: NEON.magenta },
          { label: "SECURED", value: totalSecured, sub: "KNOXED & hardened", color: NEON.blue },
          { label: "CRITICAL FLAGS", value: criticalModules.length, sub: "Require attention", color: NEON.orange },
        ].map((kpi) => (
          <GlassCard key={kpi.label} className="p-4">
            <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.1em] mb-1.5" style={{ color: NEON.textMuted }}>{kpi.label}</div>
            <div className="font-['Orbitron'] text-[1.8rem] font-black" style={{ color: kpi.color, textShadow: `0 0 12px ${kpi.color}66` }}>{kpi.value}</div>
            <div className="text-[0.7rem] mt-1" style={{ color: NEON.textMuted }}>{kpi.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Module Grid */}
      <div className="mb-4 flex items-center gap-3">
        <NeonText color={NEON.orange} size="0.75rem" weight={700}>IDENTITY VECTOR MODULES</NeonText>
        <div className="flex-1 h-[1px]" style={{ background: `${NEON.orange}33` }} />
      </div>

      <div className="grid grid-cols-4 gap-2.5 pb-6">
        {DIFF_MODULES.map((m) => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          
          return (
            <GlassCard key={m.id} className="module-card p-3.5" onClick={() => onModuleClick(m.id)}>
              <div className="flex justify-between items-start mb-2.5">
                <span className="text-[1.2rem]" style={{ color: sevColor }}>{m.icon}</span>
                <div className="text-right">
                  <span className="font-['Orbitron'] text-[0.7rem] font-bold" style={{ color: sevColor }}>{sev}%</span>
                  <div className="font-['Share_Tech_Mono'] text-[0.5rem]" style={{ color: NEON.textMuted }}>{m.vector}</div>
                </div>
              </div>
              <div className="font-['Rajdhani'] text-[0.72rem] font-semibold mb-2 leading-snug" style={{ color: NEON.text }}>{m.label}</div>
              
              {/* Progress bar */}
              <div className="h-[2px] rounded-[1px] overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-[1px] transition-all duration-1000 ease-out" style={{ width: `${sev}%`, background: sevColor, boxShadow: `0 0 6px ${sevColor}` }} />
              </div>
              
              <div className="flex gap-1.5">
                <span className="font-['Share_Tech_Mono'] text-[0.58rem]" style={{ color: NEON.magenta }}>🔥{m.nuked}</span>
                <span className="font-['Share_Tech_Mono'] text-[0.58rem]" style={{ color: NEON.blue }}>🛡️{m.knoxed}</span>
                <span className="font-['Share_Tech_Mono'] text-[0.58rem]" style={{ color: NEON.orange }}>👁️{m.monitored}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
