import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Download,
  ExternalLink,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { RETENTION_MONTHS } from '../services/sovereignCrypto';

export const ReportView: React.FC = () => {
  const {
    user,
    sha256Id,
    scannedVectorCount,
    sovereignScore,
    hasGoogleFederated,
    hasBoundPasskey,
    lastCompiledAudit,
    lastGoogleDriveExport,
    download26MonthAuditPdf,
    save26MonthAuditPdfToGoogleDrive,
    purgeZeroKnowledgeVault,
  } = useSovereign();

  const [busyAction, setBusyAction] = useState<'download' | 'drive' | 'purge' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownloadLocal = async () => {
    setBusyAction('download');
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const artifact = await download26MonthAuditPdf();
      setStatusMessage(
        `Compiled and downloaded ${artifact.fileName} (SHA-256 Seal: ${artifact.auditSealSha256.slice(0, 18)}…).`
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'PDF compilation failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveGoogleDrive = async () => {
    setBusyAction('drive');
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const exported = await save26MonthAuditPdfToGoogleDrive();
      setStatusMessage(
        `Saved 26-month Identity Audit PDF "${exported.name}" directly to your Federated Google Account Drive.`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to save to Google Drive. Sign in with Google and approve drive.file scope.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handlePurge = async () => {
    setBusyAction('purge');
    setErrorMessage(null);
    try {
      await purgeZeroKnowledgeVault();
      setStatusMessage('Local IndexedDB zero-knowledge vault cryptographically purged.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-[#091224] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold text-emerald-300">
              <FileCheck2 className="h-3.5 w-3.5" />
              {RETENTION_MONTHS}-MONTH ARCHIVAL AUDIT CERTIFICATE
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              26-Month Digital Identity Audit PDF &amp; Federated Google Drive Backup
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Generates a cryptographically sealed multi-page PDF attesting to your verified 16 Identity Vector Module scans, third-party API latencies, Dual Security status, and active{' '}
              <strong className="text-emerald-300">SHA256 ID</strong> commitment. Save directly to your Federated Google Account via least-privilege OAuth <code className="text-cyan-300">drive.file</code> scope.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4">
            <div className="text-slate-400">Federated Account Principal</div>
            <div className="mt-1 font-bold text-white truncate">
              {user?.email || 'Not yet signed in (Local Enclave)'}
            </div>
            <div className="mt-1 text-[11px] text-cyan-300">
              Google Linked: {hasGoogleFederated ? 'YES' : 'Sign in on export'} · Passkey: {hasBoundPasskey ? 'BOUND' : 'Optional'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4">
            <div className="text-slate-400">Verified Vector Coverage</div>
            <div className="mt-1 font-bold text-emerald-300 text-base">
              {scannedVectorCount} / 16 Modules ({scannedVectorCount > 0 ? `${sovereignScore}/100 Score` : 'Ready'})
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Retention Window: {RETENTION_MONTHS} Months (Auto-Pruning Enforced)
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4">
            <div className="text-slate-400">Active SHA256 ID Seal</div>
            <div className="mt-1 font-mono-code text-[11px] text-emerald-200 break-all">
              {sha256Id}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/50 bg-rose-950/40 p-3.5 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-3.5 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {lastGoogleDriveExport && (
          <div className="rounded-xl border border-cyan-400/50 bg-cyan-950/30 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-cyan-200">
                Federated Google Drive Backup Confirmed
              </div>
              <div className="text-slate-300 mt-0.5 font-mono-code text-[11px]">
                File: {lastGoogleDriveExport.name} · Drive ID: {lastGoogleDriveExport.fileId}
              </div>
            </div>
            <a
              href={lastGoogleDriveExport.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-3.5 py-2 font-bold text-cyan-200 hover:bg-cyan-500/30 transition"
            >
              Open in Google Drive
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveGoogleDrive}
              disabled={busyAction !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-5 py-3 text-xs font-extrabold text-cyan-100 hover:bg-cyan-500/30 transition disabled:opacity-60"
            >
              <CloudUpload className="h-4 w-4 text-cyan-300" />
              {busyAction === 'drive'
                ? 'Encrypting & Uploading to Google Drive…'
                : 'Save 26-Month Audit PDF to Federated Google Account'}
            </button>

            <button
              type="button"
              onClick={handleDownloadLocal}
              disabled={busyAction !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-5 py-3 text-xs font-extrabold text-emerald-100 hover:bg-emerald-500/30 transition disabled:opacity-60"
            >
              <Download className="h-4 w-4 text-emerald-300" />
              {busyAction === 'download'
                ? 'Compiling Sealed PDF…'
                : 'Download 26-Month Audit PDF Locally'}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePurge}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Purge Local ZK Vault
          </button>
        </div>

        {lastCompiledAudit && (
          <div className="border-t border-slate-800 pt-4 font-mono-code text-[11px] text-slate-400 space-y-1">
            <div>Last Compiled File: {lastCompiledAudit.fileName}</div>
            <div>Master Document SHA-256 Seal: {lastCompiledAudit.auditSealSha256}</div>
            <div>26-Month Retention Valid Through: {lastCompiledAudit.retentionUntilIso}</div>
          </div>
        )}
      </div>
    </div>
  );
};
