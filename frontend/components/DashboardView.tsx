import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileDown,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { StatusBadge } from './DesignSystem';
import { Sha256IdBeacon } from './Sha256IdBeacon';

export const DashboardView: React.FC = () => {
  const {
    modules,
    resultsByModule,
    scanningModules,
    sweepRunning,
    sovereignScore,
    scannedVectorCount,
    isDualSecured,
    hasGoogleFederated,
    hasBoundPasskey,
    runBaselineSovereignSweep,
    setActiveView,
    setSelectedModuleId,
    sendArchitectInquiry,
    save26MonthAuditPdfToGoogleDrive,
  } = useSovereign();

  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  const [savingDrive, setSavingDrive] = useState(false);

  const handleOpenModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveView('modules');
  };

  const handleAskArchitectForModule = async (moduleId: string, name: string) => {
    setActiveView('architect');
    await sendArchitectInquiry(`Analyze my privacy and security posture for ${moduleId} (${name}) and recommend concrete hardening steps.`);
  };

  const handleQuickDriveSave = async () => {
    setSavingDrive(true);
    setDriveNotice(null);
    try {
      const exported = await save26MonthAuditPdfToGoogleDrive();
      setDriveNotice(`Saved "${exported.name}" to your Federated Google Drive.`);
    } catch (err) {
      setDriveNotice(err instanceof Error ? err.message : 'Sign in with Google to save your 26-month Audit PDF to Drive.');
    } finally {
      setSavingDrive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Illuminated SHA256 ID Zero-Knowledge Protection Banner */}
      <Sha256IdBeacon variant="banner" />

      {/* Sovereign KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#091224] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified Sovereign Posture</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {scannedVectorCount > 0 ? sovereignScore : '—'}
            </span>
            <span className="text-xs text-slate-400">
              {scannedVectorCount > 0 ? '/ 100 Verified Score' : 'Run sweep to score'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Computed strictly from live third-party verified scans (zero simulated scores).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#091224] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>16 Identity Vector Modules</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-300">{scannedVectorCount}</span>
            <span className="text-xs text-slate-400">/ 16 Agent-Gated Vectors Verified</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.round((scannedVectorCount / 16) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#091224] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dual Security Protection</span>
            <ShieldCheck className={`h-4 w-4 ${isDualSecured ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="mt-2 text-sm font-bold text-white">
            {isDualSecured
              ? 'Level 3 Dual Sovereignty Active'
              : hasGoogleFederated
                ? 'Federated Google Active · Passkey Ready'
                : hasBoundPasskey
                  ? 'Passkey Active · Google Link Ready'
                  : 'Enclave Session · Bind Dual Auth'}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Combine Hardware Passkey + Sign-In With Google for phishing immunity &amp; Drive backup.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-[#081529] p-4 flex flex-col justify-between gap-2">
          <div className="text-xs font-bold text-cyan-300">
            26-Month Identity Audit PDF
          </div>
          <p className="text-[11px] text-slate-300">
            Seal all 16 vector results with SHA-256 and archive to your Federated Google Account.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleQuickDriveSave}
              disabled={savingDrive}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 transition disabled:opacity-50"
            >
              <FileDown className="h-3.5 w-3.5" />
              {savingDrive ? 'Uploading…' : 'Save PDF to Google'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('audit-pdf')}
              className="text-xs font-semibold text-slate-300 hover:text-white underline"
            >
              Audit Vault →
            </button>
          </div>
        </div>
      </div>

      {driveNotice && (
        <div className="rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-4 py-2.5 text-xs text-cyan-200 flex items-center justify-between">
          <span>{driveNotice}</span>
          <button
            type="button"
            onClick={() => setDriveNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      )}

      {/* Action Bar: Live Zero-Cost Vector Sweep + Architect AI Shortcut */}
      <div className="rounded-2xl border border-slate-800 bg-[#091224] p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            16 Identity Vector Modules (Gated by Module Agents AG-01 .. AG-16)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Run a live zero-cost third-party verification sweep across core vectors or open any individual Module Agent to verify custom inputs under your SHA256 ID.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => runBaselineSovereignSweep()}
            disabled={sweepRunning}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 transition disabled:opacity-60"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {sweepRunning ? 'Verifying Live Third-Party APIs…' : 'Verify Default Sovereign Vectors'}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('architect')}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
          >
            <Bot className="h-4 w-4" />
            Ask Architect AI
          </button>
        </div>
      </div>

      {/* 16 Identity Vector Modules Matrix */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((mod) => {
          const res = resultsByModule[mod.id];
          const isScanning = Boolean(scanningModules[mod.id]);
          const effectiveStatus = isScanning ? 'SCANNING' : res?.status || 'IDLE';

          return (
            <div
              key={mod.id}
              className="rounded-2xl border border-slate-800/90 bg-[#091224] p-4 flex flex-col justify-between gap-3.5 hover:border-cyan-400/45 transition"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono-code text-xs">
                    <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-bold text-cyan-300">
                      {mod.id}
                    </span>
                    <span className="text-[11px] text-emerald-400">{mod.agentId}</span>
                  </div>
                  <StatusBadge status={effectiveStatus} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{mod.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{mod.description}</p>
                </div>

                {res ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 truncate max-w-[165px]">
                        {res.sanitizedTargetLabel}
                      </span>
                      <span
                        className={`font-mono-code font-bold ${
                          res.riskScore >= 65
                            ? 'text-rose-400'
                            : res.riskScore >= 30
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                        }`}
                      >
                        Risk {res.riskScore}/100
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium line-clamp-2">{res.headline}</p>
                    <div className="flex items-center gap-1 text-[10px] font-mono-code text-emerald-400/90">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      Seal {res.resultSealSha256.slice(0, 14)}…
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-2.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Zero-Cost APIs:</span>{' '}
                    {mod.thirdPartyApis.join(' · ')}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleOpenModule(mod.id)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition"
                >
                  Open {mod.agentId} Gate
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAskArchitectForModule(mod.id, mod.shortTitle)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-emerald-300 transition"
                >
                  Ask Architect AI
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
