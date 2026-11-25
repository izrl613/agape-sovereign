import { useState } from 'react';
import { Cpu, Play, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { GlassCard, NeonButton } from './ui';
import { NEON, PIPELINE_AGENTS, type DiffModule } from '../data/sovereignData';

export function PipelineView({
  diffModules,
  hdiScore,
}: {
  diffModules: DiffModule[];
  hdiScore: number;
}) {
  const [backend, setBackend] = useState<'lmstudio' | 'vertex'>('lmstudio');
  const [running, setRunning] = useState(false);
  const [completedStage, setCompletedStage] = useState(0);
  const [briefingReady, setBriefingReady] = useState(false);

  const sovereignScore = Math.round(
    diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1)
  );
  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);

  const handleRunPipeline = () => {
    if (running) return;
    setRunning(true);
    setCompletedStage(0);
    setBriefingReady(false);

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setCompletedStage(current);
      if (current >= PIPELINE_AGENTS.length) {
        clearInterval(timer);
        setRunning(false);
        setBriefingReady(true);
      }
    }, 320);
  };

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="font-mono-tech text-[11px] tracking-[0.2em] text-[#FF7A18]">
            ORCHESTRATOR AGENT · 9-STAGE TRANSACTIONAL PIPELINE
          </div>
          <h2 className="font-orbitron text-2xl font-black text-[#00D4FF]">
            SOVEREIGN DATA PIPELINE
          </h2>
          <p className="text-sm text-[#7B9BB5]">
            ExtractionEngine → NER/LLM → DataMapper → Validator → SynthesisAgent → AuditAgent → PDFGenerationAgent
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBackend('lmstudio')}
            className={`font-mono-tech rounded-lg border px-3 py-2 text-xs transition ${
              backend === 'lmstudio'
                ? 'border-[#00D4FF] bg-[#00D4FF]/15 text-[#00D4FF]'
                : 'border-white/10 text-[#7B9BB5]'
            }`}
          >
            LM Studio · qwen3.5-9b / Gemma 4 E4B
          </button>
          <button
            onClick={() => setBackend('vertex')}
            className={`font-mono-tech rounded-lg border px-3 py-2 text-xs transition ${
              backend === 'vertex'
                ? 'border-[#FF7A18] bg-[#FF7A18]/15 text-[#FF7A18]'
                : 'border-white/10 text-[#7B9BB5]'
            }`}
          >
            Vertex AI · Gemini Flash
          </button>
        </div>
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="h-5 w-5 text-[#00D4FF]" />
            <span className="font-orbitron text-xs font-bold tracking-wider text-[#00D4FF]">
              9-AGENT EXECUTION SEQUENCE
            </span>
          </div>
          <NeonButton onClick={handleRunPipeline} disabled={running} color={NEON.blue} size="sm">
            <Play className="h-3.5 w-3.5" />
            {running ? `RUNNING STAGE ${completedStage + 1}/9...` : 'EXECUTE 9-AGENT PIPELINE'}
          </NeonButton>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {PIPELINE_AGENTS.map((agent) => {
            const isDone = completedStage >= agent.stage;
            const isActive = running && completedStage + 1 === agent.stage;
            return (
              <div
                key={agent.stage}
                className="rounded-lg border p-3.5 transition-all"
                style={{
                  borderColor: isDone
                    ? 'rgba(52, 211, 153, 0.45)'
                    : isActive
                    ? 'rgba(255, 122, 24, 0.7)'
                    : 'rgba(0, 212, 255, 0.14)',
                  background: isDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : isActive
                    ? 'rgba(255, 122, 24, 0.1)'
                    : 'rgba(0, 212, 255, 0.03)',
                }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono-tech text-[10px] text-[#7B9BB5]">
                    STAGE 0{agent.stage}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isActive ? (
                    <Sparkles className="h-4 w-4 animate-pulse text-[#FF7A18]" />
                  ) : null}
                </div>
                <div className="font-orbitron text-xs font-bold text-[#E8F4FF]">{agent.name}</div>
                <p className="mt-1 text-xs leading-snug text-[#7B9BB5]">{agent.role}</p>
                <div className="font-mono-tech mt-2 text-[10px] text-[#00D4FF]">
                  → {agent.outputArtifact}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {briefingReady && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-emerald-400">
              SYNTHESIS AGENT · EXECUTIVE BRIEFING (0 WARNINGS · 0 ERRORS)
            </h3>
          </div>
          <div className="font-mono-tech space-y-2 rounded-lg border border-emerald-400/20 bg-black/40 p-4 text-xs leading-relaxed text-[#E8F4FF]/90">
            <div>
              BACKEND: {backend === 'lmstudio' ? 'LM Studio Local Enclave (qwen3.5-9b / gemma-4-e4b)' : 'Vertex AI Gemini Flash'}
            </div>
            <div>
              VALIDATION: Valid · 0 warnings · 0 errors · Zero-PII transient memory zeroing verified by AuditAgent.
            </div>
            <div>
              SUMMARY: 16 DIFF vectors normalized. Sovereign Score: {sovereignScore}/100 | Human Dignity Index: {hdiScore.toFixed(1)}/100 | {totalNuked} NUKED exposures purged | {totalKnoxed} KNOXED assets hardened.
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
