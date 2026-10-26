import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Copy,
  Lock,
  Play,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { VectorCategory } from '../services/moduleAgents';
import { formatSha256Display } from '../services/sovereignCrypto';
import { StatusBadge } from './DesignSystem';

const CATEGORIES: Array<'ALL' | VectorCategory> = [
  'ALL',
  'IDENTITY & AUTH',
  'NETWORK & DNS',
  'PRIVACY & BROKERS',
  'CLOUD, SUPPLY CHAIN & DOCS',
];

export const ModuleInterface: React.FC = () => {
  const {
    modules,
    selectedModuleId,
    setSelectedModuleId,
    resultsByModule,
    scanningModules,
    sha256Id,
    runModuleScan,
    setActiveView,
    sendArchitectInquiry,
  } = useSovereign();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | VectorCategory>('ALL');
  const activeDef = modules.find((m) => m.id === selectedModuleId) || modules[0];

  const [inputValue, setInputValue] = useState<string>(activeDef.defaultSuggestion || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    setInputValue(activeDef.defaultSuggestion || '');
    setSelectedFile(null);
    setScanError(null);
  }, [activeDef.id, activeDef.defaultSuggestion]);

  const filteredModules = modules.filter(
    (m) => categoryFilter === 'ALL' || m.category === categoryFilter
  );

  const activeResult = resultsByModule[activeDef.id];
  const isScanning = Boolean(scanningModules[activeDef.id]);

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError(null);
    try {
      await runModuleScan(activeDef.id, inputValue, selectedFile);
      if (activeDef.id === 'V-03') {
        // Clear credential from DOM state immediately after k-anonymity check
        setInputValue('');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Module Agent verification failed.');
    }
  };

  const handleAskArchitect = async () => {
    setActiveView('architect');
    await sendArchitectInquiry(
      `Inspect my ${activeDef.id} (${activeDef.name}) results gated by ${activeDef.agentId} and explain any security risks and exact remediation commands.`
    );
  };

  const handleCopyOptOut = async () => {
    if (!activeResult?.optOutArtifact) return;
    try {
      await navigator.clipboard.writeText(activeResult.optOutArtifact);
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              categoryFilter === cat
                ? 'border border-cyan-400/70 bg-cyan-500/20 text-cyan-200'
                : 'border border-slate-800 bg-[#091224] text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Selector Rail: 16 Identity Vector Modules */}
        <div className="lg:col-span-4 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {filteredModules.map((mod) => {
            const res = resultsByModule[mod.id];
            const selected = mod.id === activeDef.id;
            const scanning = Boolean(scanningModules[mod.id]);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
                className={`w-full rounded-xl border p-3.5 text-left transition flex items-start justify-between gap-2 ${
                  selected
                    ? 'border-emerald-400/70 bg-emerald-950/35 shadow-[0_0_18px_rgba(16,185,129,0.18)]'
                    : 'border-slate-800/90 bg-[#091224] hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-mono-code text-[11px]">
                    <span className="font-bold text-cyan-300">{mod.id}</span>
                    <span className="text-emerald-400">{mod.agentId}</span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-white">{mod.name}</div>
                </div>
                <StatusBadge status={scanning ? 'SCANNING' : res?.status || 'IDLE'} />
              </button>
            );
          })}
        </div>

        {/* Right Module Agent Gate & Verified Telemetry Panel */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-[#091224] p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono-code text-xs">
                  <span className="rounded bg-cyan-500/15 px-2.5 py-0.5 font-bold text-cyan-300">
                    {activeDef.id}
                  </span>
                  <span className="rounded bg-emerald-500/15 px-2.5 py-0.5 font-bold text-emerald-300">
                    Gated by {activeDef.agentId} ({activeDef.agentName})
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold text-white">{activeDef.name}</h2>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{activeDef.description}</p>
              </div>
              <StatusBadge status={isScanning ? 'SCANNING' : activeResult?.status || 'IDLE'} />
            </div>

            {/* SHA256 ID Module Agent Gate Guarantee */}
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 p-3.5 text-xs space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                  <Lock className="h-3.5 w-3.5" />
                  Module Agent Zero-Knowledge Gate Active ({formatSha256Display(sha256Id, true)})
                </span>
                <span className="font-mono-code text-[11px] text-cyan-300">
                  AES-256-GCM + PBKDF2-SHA256
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">{activeDef.zeroKnowledgeRule}</p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleRunScan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  {activeDef.inputLabel}
                </label>
                <input
                  type={activeDef.inputType}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={activeDef.inputPlaceholder}
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {activeDef.supportsFileUpload && (
                <div className="rounded-xl border border-dashed border-cyan-500/40 bg-slate-950/60 p-3.5">
                  <label className="flex items-center justify-between gap-3 cursor-pointer text-xs">
                    <span className="flex items-center gap-2 text-cyan-200 font-semibold">
                      <Upload className="h-4 w-4 text-cyan-400" />
                      {selectedFile
                        ? `Selected in Local RAM: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
                        : 'Attach Local JPEG / PNG / PDF for Zero-Upload Binary EXIF & Metadata Scan'}
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <span className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[11px] text-cyan-200">
                      Choose File
                    </span>
                  </label>
                </div>
              )}

              {scanError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 p-3 text-xs text-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{scanError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/80 bg-emerald-500/20 px-5 py-2.5 text-xs font-extrabold text-emerald-200 hover:bg-emerald-500/30 transition disabled:opacity-60"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {isScanning
                    ? `${activeDef.agentId} Sealing & Verifying…`
                    : `Seal with SHA256 ID & Verify (${activeDef.thirdPartyApis.length} APIs)`}
                </button>

                <button
                  type="button"
                  onClick={handleAskArchitect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 transition"
                >
                  <Bot className="h-4 w-4" />
                  Discuss with Architect AI
                </button>
              </div>
            </form>
          </div>

          {/* Live Verified Results */}
          {activeResult && (
            <div className="rounded-2xl border border-slate-800 bg-[#091224] p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                  <div className="text-xs text-slate-400">
                    Verified Target: <strong className="text-white">{activeResult.sanitizedTargetLabel}</strong>
                  </div>
                  <div className="mt-0.5 text-base font-bold text-white">{activeResult.headline}</div>
                </div>
                <div className="text-right font-mono-code">
                  <div className="text-lg font-extrabold text-emerald-300">
                    Risk {activeResult.riskScore}/100
                  </div>
                  <div className="text-[10px] text-slate-400">{activeResult.verifiedAtIso}</div>
                </div>
              </div>

              {/* Third-Party Zero-Cost API Verification Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Live Third-Party API Verification Proofs ($0 Cost)
                </h3>
                <div className="space-y-2">
                  {activeResult.verifications.map((v, idx) => (
                    <div
                      key={`${v.provider}-${idx}`}
                      className="rounded-xl border border-slate-800 bg-slate-950/75 p-3 text-xs flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2
                            className={`h-3.5 w-3.5 ${
                              v.status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          />
                          {v.provider}
                        </div>
                        <div className="text-slate-300 mt-0.5">{v.summary}</div>
                      </div>
                      <div className="font-mono-code text-[11px] text-slate-400 shrink-0">
                        {v.status} · {v.latencyMs}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings & Remediations */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Module Agent Findings &amp; Hardening Directives
                </h3>
                <div className="space-y-2.5">
                  {activeResult.findings.map((f, idx) => (
                    <div
                      key={`${f.title}-${idx}`}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 font-mono-code text-[10px] font-bold ${
                            f.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : f.severity === 'WARN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : f.severity === 'SAFE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="font-bold text-white">{f.title}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{f.detail}</p>
                      {f.remediation && (
                        <p className="text-cyan-300 text-[11px] pt-0.5">
                          <strong>Remediation:</strong> {f.remediation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Opt-Out Artifact (V-06) */}
              {activeResult.optOutArtifact && (
                <div className="rounded-xl border border-cyan-500/40 bg-[#061527] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">
                      Generated Statutory CPRA / GDPR Erasure Notice
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOptOut}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedNotice ? 'Copied Notice' : 'Copy Notice'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono-code text-[11px] text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    {activeResult.optOutArtifact}
                  </pre>
                </div>
              )}

              {/* Cryptographic Zero-Knowledge Envelope Proof */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 font-mono-code text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-sans text-xs font-bold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Cryptographic Zero-Knowledge Envelope Attestation
                </div>
                <div className="break-all">SHA256 ID Key Anchor: {activeResult.sha256IdUsed}</div>
                <div className="break-all">Input Commitment: {activeResult.inputCommitmentSha256}</div>
                <div className="break-all">Result Audit Seal: {activeResult.resultSealSha256}</div>
                <div className="break-all">
                  AES-256-GCM Ciphertext Preview: {activeResult.encryptedEnvelope.ciphertextBase64.slice(0, 64)}…
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
