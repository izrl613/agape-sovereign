import { useState } from 'react';
import { ArrowLeft, Flame, ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { GlassCard, NeonButton, StatusBadge } from './ui';
import { NEON, type DiffModule, type FindingStatus } from '../data/sovereignData';

export function ModuleDetailView({
  module,
  onBack,
  onUpdateFinding,
  onBulkAction,
}: {
  module: DiffModule;
  onBack: () => void;
  onUpdateFinding: (moduleId: string, findingId: string, nextStatus: FindingStatus) => void;
  onBulkAction: (moduleId: string, action: 'NUKE_ALL' | 'KNOX_ALL') => void;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);

  const sevColor = module.severity >= 80 ? NEON.blue : module.severity >= 65 ? NEON.orange : NEON.magenta;

  const stages = [
    'INITIALIZING SENSORS',
    'ESTABLISHING ZERO-KNOWLEDGE ENCLAVE',
    `QUERYING ${module.label.toUpperCase()} REGISTRIES`,
    'ANALYZING METADATA FOOTPRINT',
    'CROSS-REFERENCING THREAT INTEL',
    'COMPILING DIFF VECTORS',
    'SCAN COMPLETE',
  ];

  const handleSweep = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setActiveStageIndex(0);

    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      if (idx < stages.length) {
        setActiveStageIndex(idx);
        setScanProgress(Math.min(100, Math.round(((idx + 1) / stages.length) * 100)));
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setIsScanning(false);
          setActiveStageIndex(-1);
        }, 700);
      }
    }, 450);
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="font-mono-tech text-[11px] tracking-widest text-[#FF7A18]">
              {module.vector} · DIFF MODULE
            </div>
            <h2 className="font-orbitron text-xl font-bold" style={{ color: sevColor }}>
              {module.label}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="font-orbitron text-3xl font-black" style={{ color: sevColor }}>
            {module.severity}%
          </div>
          <div className="font-mono-tech text-[10px] text-[#7B9BB5]">VECTOR SCORE</div>
        </div>
      </div>

      {/* Security Posture Summary */}
      <GlassCard className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono-tech text-xs text-[#7B9BB5]">SECURITY POSTURE</span>
          <span className="font-orbitron text-xs font-bold" style={{ color: sevColor }}>
            {module.severity >= 80 ? 'SECURED' : module.severity >= 65 ? 'MODERATE' : 'EXPOSED'}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${module.severity}%`,
              background: `linear-gradient(90deg, ${NEON.magenta}, ${sevColor})`,
              boxShadow: `0 0 10px ${sevColor}`,
            }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'NUKED', val: module.nuked, color: NEON.magenta },
            { label: 'KNOXED', val: module.knoxed, color: NEON.blue },
            { label: 'MONITORED', val: module.monitored, color: NEON.orange },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border p-3 text-center"
              style={{ borderColor: `${s.color}33`, background: `${s.color}10` }}
            >
              <div className="font-orbitron text-2xl font-black" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="font-mono-tech text-[10px] tracking-wider text-[#7B9BB5]">{s.label}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Scan Progress Visualization */}
      {isScanning && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-orbitron text-xs font-bold text-[#00D4FF]">
              VECTOR ANALYSIS ACTIVE · {module.vector}
            </span>
            <span className="font-orbitron text-lg font-black text-[#00D4FF]">{scanProgress}%</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#00D4FF] transition-all duration-300"
              style={{ width: `${scanProgress}%`, boxShadow: `0 0 12px ${NEON.blue}` }}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {stages.map((stage, idx) => {
              const done = idx < activeStageIndex;
              const active = idx === activeStageIndex;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2.5 text-xs ${
                    done || active ? 'opacity-100' : 'opacity-35'
                  }`}
                >
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded-full border"
                    style={{
                      borderColor: done ? NEON.blue : active ? NEON.orange : 'rgba(255,255,255,0.2)',
                      background: done ? NEON.blue : 'transparent',
                    }}
                  >
                    {done && <Check className="h-2.5 w-2.5 text-[#060D1F]" />}
                  </div>
                  <span
                    className="font-mono-tech text-[11px]"
                    style={{ color: active ? NEON.orange : done ? NEON.blue : NEON.textMuted }}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Findings List */}
      <div>
        <div className="mb-2.5 font-orbitron text-xs font-bold tracking-wider text-[#FF7A18]">
          INTELLIGENCE FINDINGS
        </div>
        <div className="space-y-2.5">
          {module.findings.map((f) => {
            const borderColor =
              f.type === 'NUKED' ? NEON.magenta : f.type === 'KNOXED' ? NEON.blue : NEON.orange;
            return (
              <div
                key={f.id}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                  f.type === 'NUKED' ? 'nuked-item' : f.type === 'KNOXED' ? 'knoxed-item' : ''
                }`}
                style={{ borderColor: `${borderColor}44` }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge type={f.type} />
                    <span className="font-rajdhani text-base font-bold text-[#E8F4FF]">{f.label}</span>
                  </div>
                  <div className="font-mono-tech text-xs text-[#7B9BB5]">{f.detail}</div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {f.type !== 'NUKED' && (
                    <NeonButton
                      size="sm"
                      color={NEON.magenta}
                      onClick={() => onUpdateFinding(module.id, f.id, 'NUKED')}
                    >
                      <Flame className="h-3.5 w-3.5" />
                      NUKE
                    </NeonButton>
                  )}
                  {f.type !== 'KNOXED' && (
                    <NeonButton
                      size="sm"
                      color={NEON.blue}
                      onClick={() => onUpdateFinding(module.id, f.id, 'KNOXED')}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      KNOX
                    </NeonButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NeonButton onClick={handleSweep} disabled={isScanning} color={NEON.orange}>
          <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          INITIATE VECTOR SWEEP
        </NeonButton>
        <NeonButton
          onClick={() => onBulkAction(module.id, 'NUKE_ALL')}
          disabled={isScanning}
          color={NEON.magenta}
        >
          <Flame className="h-4 w-4" />
          NUKE ALL EXPOSURES
        </NeonButton>
        <NeonButton
          onClick={() => onBulkAction(module.id, 'KNOX_ALL')}
          disabled={isScanning}
          color={NEON.blue}
        >
          <ShieldCheck className="h-4 w-4" />
          KNOX ALL SECURED
        </NeonButton>
      </div>
    </div>
  );
}
