import React from 'react';
import { NEON, NeonText, GlassCard } from '../UI';
import { SovereignScore } from '../SovereignScore';
import { DIFF_MODULES } from '../lib/diffModules';

interface SovereignStatusViewProps {
  score: number;
  criticalExposures: number;
  requireReview: number;
  verifiedProtections: number;
  sourcesMonitored: number;
  aiSummary: string;
  liveMonitoring: Array<{ label: string; status: string; time: string }>;
  recentActivity: Array<{ label: string; time: string }>;
}

export const SovereignStatusView: React.FC<SovereignStatusViewProps> = ({
  score,
  criticalExposures,
  requireReview,
  verifiedProtections,
  sourcesMonitored,
  aiSummary,
  liveMonitoring,
  recentActivity,
}) => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 0.4s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 24 }}>

        {/* Left Column: Status Gauge & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GlassCard style={{ padding: '24px', textAlign: 'center', position: 'relative' }}>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: NEON.textMuted, letterSpacing: '0.2em', marginBottom: 16 }}>
              SOVEREIGN STATUS
            </div>
            <div style={{ marginBottom: 16 }}>
              <SovereignScore score={score} />
            </div>
            <div style={{ fontFamily: "'Orbitron'", fontSize: '1.2rem', fontWeight: 900, color: score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta, textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>
              {score > 75 ? 'GOOD' : score > 50 ? 'MODERATE' : 'EXPOSED'}
            </div>
            <div style={{ fontSize: '0.7rem', color: NEON.textMuted, marginTop: 4 }}>
              3 things need your attention
            </div>
          </GlassCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Critical Exposures', value: criticalExposures, color: NEON.magenta, icon: '🛡️' },
              { label: 'Require Review', value: requireReview, color: NEON.orange, icon: '⚠️' },
              { label: 'Verified Protections', value: verifiedProtections, color: NEON.blue, icon: '✅' },
              { label: 'Sources Monitored', value: sourcesMonitored, color: NEON.blue, icon: '👁️' },
            ].map((stat) => (
              <GlassCard key={stat.label} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span style={{ fontSize: '1.1rem' }}>{stat.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "'Rajdhani'", fontSize: '0.8rem', color: NEON.text }}>{stat.label}</span>
                </div>
                <div style={{ fontFamily: "'Orbitron'", fontSize: '1rem', fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
                <ChevronRight />
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Center Column: Architect AI Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GlassCard style={{ padding: '24px', background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle, #00D4FF, #0B1020)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #00D4FF' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>AI</span>
              </div>
              <NeonText color={NEON.blue} size="1.2rem" weight={900}>Architect AI</NeonText>
            </div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: '1rem', lineHeight: 1.6, color: NEON.text, marginBottom: 20 }}>
              "{aiSummary}"
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <NeonButton color={NEON.magenta} size="sm">Review Findings</NeonButton>
              <NeonButton color={NEON.blue} size="sm">Ask Architect AI</NeonButton>
            </div>
          </GlassCard>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
             {/* Placeholder for the Brain Graphic from the image */}
             <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <div style={{ width: 100, height: 100, borderRadius: '50%', border: `2px dashed ${NEON.blue}`, animation: 'rotate-gradient 10s linear infinite' }} />
             </div>
          </div>
        </div>

        {/* Right Column: Live Monitoring & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GlassCard style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <NeonText color={NEON.blue} size="0.75rem">LIVE MONITORING</NeonText>
              <span style={{ fontSize: '0.6rem', color: NEON.blue, cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liveMonitoring.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: item.status === 'Clean' ? '#00FF87' : NEON.orange }} />
                    <span style={{ color: NEON.text }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: NEON.textMuted, fontSize: '0.65rem' }}>{item.status}</span>
                    <span style={{ color: NEON.textMuted, fontSize: '0.65rem' }}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <NeonText color={NEON.blue} size="0.75rem">RECENT ACTIVITY</NeonText>
              <span style={{ fontSize: '0.6rem', color: NEON.blue, cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivity.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: NEON.text }}>{item.label}</span>
                  <span style={{ color: NEON.textMuted, fontSize: '0.65rem' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Strip: 16 Identity Vectors */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <NeonText color={NEON.blue} size="0.75rem">YOUR 16 IDENTITY VECTORS</NeonText>
          <span style={{ fontSize: '0.6rem', color: NEON.blue, cursor: 'pointer' }}>View All Modules</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
          {DIFF_MODULES.map((m) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', background: 'rgba(0,212,255,0.05)',
              borderRadius: 8, border: '1px solid rgba(0,212,255,0.1)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '1rem' }}>{m.icon}</span>
              <span style={{ fontFamily: "'Rajdhani'", fontSize: '0.7rem', color: NEON.text }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple Chevron component to avoid importing from lucide-react if not needed, but I can just use it.
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
