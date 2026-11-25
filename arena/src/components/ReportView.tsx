import { useEffect, useState } from 'react';
import { FileCheck2, HardDrive, Trash2, Download, CheckCircle2 } from 'lucide-react';
import { GlassCard, NeonButton } from './ui';
import { SaveExportWarningModal } from './SaveExportWarningModal';
import { NEON, type DiffModule, type SovereignUser } from '../data/sovereignData';
import {
  deleteVaultReport,
  downloadTextArtifact,
  listVaultReports,
  pruneOldVaultReports,
  saveReportToVault,
  type VaultReportMetadata,
} from '../services/localVaultService';

export function ReportView({
  user,
  diffModules,
  hdiScore,
}: {
  user: SovereignUser;
  diffModules: DiffModule[];
  hdiScore: number;
}) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [vaultReports, setVaultReports] = useState<VaultReportMetadata[]>([]);
  const [statusBanner, setStatusBanner] = useState('');

  const sovereignScore = Math.round(
    diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1)
  );
  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);

  const refreshVault = async () => {
    try {
      await pruneOldVaultReports(user.uid);
      const items = await listVaultReports(user.uid);
      setVaultReports(items);
    } catch {
      setVaultReports([]);
    }
  };

  useEffect(() => {
    refreshVault();
  }, [user.uid]);

  const handleConfirmExport = async (target: 'local' | 'drive' | 'download') => {
    setShowExportModal(false);
    const payload = {
      system: 'AGAPE SOVEREIGN ENCLAVE 2026 — ARENA ALPHA SANDBOX',
      simulated_demo_data: true,
      notice: 'SIMULATED DEMO DATA — Arena alpha build. Not a real Agape Sovereign audit.',
      compliance: ['ECRA 2026', 'GDPR Article 16', 'UDHR Article 12', 'CCPA Right to Correct'],
      generatedAt: new Date().toISOString(),
      sovereignScore,
      humanDignityIndex: hdiScore,
      totalNuked,
      totalKnoxed,
      vectors: diffModules.map((m) => ({
        vector: m.vector,
        label: m.label,
        severity: m.severity,
        nuked: m.nuked,
        knoxed: m.knoxed,
        monitored: m.monitored,
      })),
    };
    const payloadJson = JSON.stringify(payload, null, 2);

    if (target === 'download') {
      downloadTextArtifact(`agape-sovereign-diff-${Date.now()}.json`, payloadJson);
      setStatusBanner('DPC Sovereignty Report downloaded to your device.');
      return;
    }

    const saved = await saveReportToVault(user.uid, {
      title: `DIFF Sovereignty Audit · Score ${sovereignScore}`,
      sovereignScore,
      hdiScore,
      totalNuked,
      totalKnoxed,
      storageTarget: target,
      payloadJson,
    });
    await refreshVault();
    setStatusBanner(
      target === 'drive'
        ? `Saved ${saved.id} to IndexedDB Vault & queued Google Drive sync (Agape Sovereign/DPC Reports/).`
        : `Saved ${saved.id} to encrypted IndexedDB Local Vault (26-month rolling retention).`
    );
  };

  const handleDelete = async (id: string) => {
    await deleteVaultReport(id);
    await refreshVault();
  };

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="font-mono-tech text-[11px] tracking-[0.2em] text-[#FF7A18]">
            LIGHTHOUSE-V3 AUDIT · 26-MONTH ROLLING DPC ARCHIVE
          </div>
          <h2 className="font-orbitron text-2xl font-black text-[#00D4FF]">
            DIFF SOVEREIGNTY REPORT
          </h2>
          <p className="text-sm text-[#7B9BB5]">
            Zero-knowledge DPC export to IndexedDB Local Vault, Google Drive, or local artifact — <span className="text-[#FF2E9F] font-bold">SIMULATED DEMO DATA (ALPHA)</span>
          </p>
        </div>
        <NeonButton onClick={() => setShowExportModal(true)} color={NEON.blue} size="lg">
          <FileCheck2 className="h-4 w-4" />
          EXPORT / SAVE DPC REPORT
        </NeonButton>
      </div>

      {statusBanner && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      <GlassCard className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'VECTORS SCANNED', val: '16 / 16', color: NEON.blue },
            { label: 'SOVEREIGN SCORE', val: `${sovereignScore} / 100`, color: NEON.blue },
            { label: 'DIGNITY INDEX', val: `${hdiScore.toFixed(1)} / 100`, color: NEON.orange },
            { label: 'ENCRYPTION', val: 'AES-256-GCM', color: NEON.magenta },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#00D4FF]/15 bg-[#00D4FF]/5 p-3"
            >
              <div className="font-mono-tech text-[10px] text-[#7B9BB5]">{item.label}</div>
              <div className="font-orbitron mt-1 text-sm font-bold" style={{ color: item.color }}>
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* IndexedDB 26-Month Local Vault */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[#FF7A18]" />
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-[#FF7A18]">
              LOCAL PROFILE VAULT (INDEXEDDB · 26-MONTH ARCHIVE)
            </h3>
          </div>
          <span className="font-mono-tech text-xs text-[#7B9BB5]">
            {vaultReports.length} stored
          </span>
        </div>

        {vaultReports.length === 0 ? (
          <p className="font-mono-tech py-4 text-xs text-[#7B9BB5]">
            No DPC reports archived yet. Click "EXPORT / SAVE DPC REPORT" above to store your first encrypted snapshot.
          </p>
        ) : (
          <div className="space-y-2.5">
            {vaultReports.map((r) => (
              <div
                key={r.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-[#00D4FF]/20 bg-black/30 p-3.5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="font-orbitron text-xs font-bold text-[#00D4FF]">
                    {r.id} · {r.title}
                  </div>
                  <div className="font-mono-tech mt-0.5 text-[11px] text-[#7B9BB5]">
                    Created: {new Date(r.createdAt).toLocaleString()} · Expires: {new Date(r.expiresAt).toLocaleDateString()} · Hash: {r.auditHash.slice(0, 14)}…
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <NeonButton
                    size="sm"
                    color={NEON.blue}
                    onClick={() => downloadTextArtifact(`${r.id}.json`, r.payloadJson)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    DOWNLOAD
                  </NeonButton>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="rounded-lg border border-[#FF2E9F]/30 bg-[#FF2E9F]/10 px-2.5 py-1.5 text-[#FF2E9F] hover:bg-[#FF2E9F]/20"
                    aria-label="Delete report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {showExportModal && (
        <SaveExportWarningModal
          authType={user.provider}
          storageTarget={user.provider === 'google' ? 'drive' : 'local'}
          onConfirm={handleConfirmExport}
          onCancel={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
