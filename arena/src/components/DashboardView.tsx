import {
  Mail,
  Share2,
  HardDrive,
  Smartphone,
  Globe,
  Database,
  KeyRound,
  MapPin,
  Cookie,
  Landmark,
  HeartPulse,
  Fingerprint,
  Cpu,
  Cloud,
  ShieldAlert,
  BrainCircuit,
  Flame,
  ShieldCheck,
  Eye,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { GlassCard, NeonButton, SovereignScoreRing } from './ui';
import { NEON, type DiffModule } from '../data/sovereignData';

const VECTOR_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  social: Share2,
  device: HardDrive,
  mobile: Smartphone,
  deepweb: Globe,
  broker: Database,
  password: KeyRound,
  location: MapPin,
  browser: Cookie,
  financial: Landmark,
  medical: HeartPulse,
  biometric: Fingerprint,
  iot: Cpu,
  cloud: Cloud,
  darkweb: ShieldAlert,
  behavioral: BrainCircuit,
};

export function DashboardView({
  diffModules,
  hdiScore,
  onModuleClick,
  onSweepAll,
  onOpenDignity,
  isSweepingAll,
}: {
  diffModules: DiffModule[];
  hdiScore: number;
  onModuleClick: (id: string) => void;
  onSweepAll: () => void;
  onOpenDignity: () => void;
  isSweepingAll: boolean;
}) {
  const sovereignScore = Math.round(
    diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1)
  );
  const totalExposures = diffModules.reduce((s, m) => s + m.nuked + m.monitored, 0);
  const totalSecured = diffModules.reduce((s, m) => s + m.knoxed, 0);
  const criticalModules = diffModules.filter((m) => m.severity < 65);

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Header Row */}
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="font-orbitron text-[11px] font-bold tracking-[0.22em] text-[#FF7A18]">
            DIGITAL IDENTITY FEDERATED FOOTPRINT
          </div>
          <h1 className="font-orbitron text-2xl font-black tracking-wider text-[#00D4FF] sm:text-3xl">
            DIFF COMMAND CENTER
          </h1>
          <p className="text-sm text-[#7B9BB5]">
            16-Layer identity vector telemetry · Real-time threat intelligence · Zero-PII enclave
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <NeonButton onClick={onSweepAll} disabled={isSweepingAll} color={NEON.blue} size="sm">
              <RefreshCw className={`h-3.5 w-3.5 ${isSweepingAll ? 'animate-spin' : ''}`} />
              {isSweepingAll ? 'SWEEPING 16 VECTORS...' : 'RUN 16-VECTOR SWEEP'}
            </NeonButton>
            <NeonButton onClick={onOpenDignity} color={NEON.orange} size="sm">
              <Scale className="h-3.5 w-3.5" />
              HDI RECTIFICATION ({hdiScore.toFixed(1)})
            </NeonButton>
          </div>
        </div>

        <div className="flex items-center gap-6 self-center lg:self-auto">
          <SovereignScoreRing score={sovereignScore} label="SOVEREIGN" />
          <SovereignScoreRing score={Math.round(hdiScore)} label="DIGNITY" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'VECTORS ACTIVE', value: '16 / 16', sub: 'All DIFF layers online', color: NEON.blue },
          { label: 'EXPOSURES TRACKED', value: totalExposures, sub: 'Nuked & monitored surfaces', color: NEON.magenta },
          { label: 'SECURED ASSETS', value: totalSecured, sub: 'KNOXED & hardened', color: NEON.blue },
          { label: 'CRITICAL FLAGS', value: criticalModules.length, sub: 'Severity below 65%', color: NEON.orange },
        ].map((kpi) => (
          <GlassCard key={kpi.label} className="p-4">
            <div className="font-mono-tech text-[11px] tracking-wider text-[#7B9BB5]">{kpi.label}</div>
            <div
              className="font-orbitron mt-1 text-2xl font-black sm:text-3xl"
              style={{ color: kpi.color, textShadow: `0 0 12px ${kpi.color}55` }}
            >
              {kpi.value}
            </div>
            <div className="mt-1 text-xs text-[#7B9BB5]">{kpi.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* 16 Identity Vector Grid */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-orbitron text-xs font-bold tracking-widest text-[#FF7A18]">
            IDENTITY VECTOR MODULES (V-01 — V-16)
          </span>
          <div className="h-px flex-1 bg-[#FF7A18]/25" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {diffModules.map((m) => {
            const Icon = VECTOR_ICONS[m.id] || ShieldCheck;
            const sevColor = m.severity >= 80 ? NEON.blue : m.severity >= 65 ? NEON.orange : NEON.magenta;
            return (
              <GlassCard
                key={m.id}
                onClick={() => onModuleClick(m.id)}
                className="cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/60"
              >
                <div className="mb-2.5 flex items-start justify-between">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ borderColor: `${sevColor}44`, background: `${sevColor}14`, color: sevColor }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-right">
                    <div className="font-orbitron text-xs font-bold" style={{ color: sevColor }}>
                      {m.severity}%
                    </div>
                    <div className="font-mono-tech text-[10px] text-[#7B9BB5]">{m.vector}</div>
                  </div>
                </div>

                <div className="font-rajdhani text-sm font-bold text-[#E8F4FF]">{m.label}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-[#7B9BB5]">{m.description}</div>

                <div className="my-2.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${m.severity}%`,
                      background: sevColor,
                      boxShadow: `0 0 8px ${sevColor}`,
                    }}
                  />
                </div>

                <div className="font-mono-tech flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-[#FF2E9F]">
                    <Flame className="h-3 w-3" /> {m.nuked}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#00D4FF]">
                    <ShieldCheck className="h-3 w-3" /> {m.knoxed}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#FF7A18]">
                    <Eye className="h-3 w-3" /> {m.monitored}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
