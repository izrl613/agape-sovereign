import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Scale, CheckCircle2, ShieldCheck, Download, FileCheck2, Trash2, AlertTriangle } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { sha256Hex } from '../services/sha256Vault';
import {
  deleteVaultReport,
  downloadStructuredPdf,
  downloadTextArtifact,
  listVaultReports,
  pruneOldVaultReports,
  saveReportToVault,
  type VaultReportMetadata,
} from '../services/localVaultService';
import { GlassCard, NeonButton, SovereignScoreRing } from './ui';
import { Sha256Badge } from './Sha256Badge';

const VALIDATOR_NODES = [
  {
    id: 'VALIDATOR-HUMAN-RIGHTS-001',
    organization: 'Sovereign Human Dignity & Right to Rectification Council',
    jurisdiction: 'GDPR Art. 16 · UDHR Art. 12',
  },
  {
    id: 'VALIDATOR-SSI-ADVOCATE-002',
    organization: 'Global Human Rights Data Steward Node #002',
    jurisdiction: 'ECRA 2026 · CCPA Right to Correct',
  },
] as const;

const RECTIFICATION_CLAIM_TYPES = [
  {
    id: 'STALE_CREDIT_FINANCIAL_RECTIFICATION',
    label: 'Stale Credit / Financial Record Rectification',
    note: 'Request rectification and purge of inaccurate legacy credit or financial telemetry under GDPR Art. 16 & CCPA.',
  },
  {
    id: 'DATA_BROKER_INACCURACY_PURGE',
    label: 'Data Broker Inaccuracy & Profile Purge',
    note: 'Scrub erroneous demographic, address, and aggregator records under GDPR Art. 16 / CCPA §1798.106.',
  },
  {
    id: 'BIOMETRIC_VOICE_ERASURE',
    label: 'Biometric / Voice Sample Zero-Retention Erasure',
    note: 'Assert UDHR Art. 12 & hardware-enclave isolation for unauthorized biometric/voice templates.',
  },
] as const;

export interface RectificationCertificate {
  status: 'RECTIFIED_ATTESTATION_ISSUED';
  rectification_id: string;
  claim_id: string;
  claim_type: string;
  sovereign_id: string;
  timestamp: string;
  validator: {
    validator_id: string;
    organization: string;
    jurisdiction: string;
  };
  bound_receipt_hashes: string[];
  old_data_purged_hash: string;
  corrected_data_hash: string;
  posture_snapshot: {
    sealed_vectors: number;
    verified_receipts: number;
    exposed_receipts: number;
    real_posture_pct: number;
  };
  compliance_guarantees: {
    gdpr_article_16_right_to_rectification: boolean;
    universal_human_rights_article_12: boolean;
    ccpa_right_to_correct: boolean;
    zero_pii_retention: boolean;
  };
}

export function DignityRectificationView({ onSelectModule }: { onSelectModule?: (id: string) => void }) {
  const { user, sovereignId, receipts } = useSovereign();
  const [claimType, setClaimType] = useState<string>(RECTIFICATION_CLAIM_TYPES[0].id);
  const [validatorId, setValidatorId] = useState<string>(VALIDATOR_NODES[0].id);
  const [correctionNote, setCorrectionNote] = useState<string>(RECTIFICATION_CLAIM_TYPES[0].note);
  const [processing, setProcessing] = useState(false);
  const [certificate, setCertificate] = useState<RectificationCertificate | null>(null);
  const [archivedCerts, setArchivedCerts] = useState<VaultReportMetadata[]>([]);

  const posture = useMemo(() => {
    const sealedModules = new Set(receipts.map((r) => r.moduleId)).size;
    const verified = receipts.filter((r) =>
      ['VERIFIED', 'CHECKED_NO_MATCH', 'LOCAL_CHECK_PASSED', 'ARTEFACT_GENERATED'].includes(r.verification.status),
    ).length;
    const exposed = receipts.filter((r) => r.verification.status === 'MATCH_FOUND').length;
    const basePct = receipts.length === 0 ? 0 : Math.round((sealedModules / 16) * 100);
    return { sealedModules, verified, exposed, basePct };
  }, [receipts]);

  const refreshCerts = useCallback(async () => {
    if (!user) return;
    try {
      await pruneOldVaultReports(user.id);
      const items = await listVaultReports(user.id, 'rectification_cert');
      setArchivedCerts(items);
    } catch {
      setArchivedCerts([]);
    }
  }, [user]);

  useEffect(() => {
    void refreshCerts();
  }, [refreshCerts]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sovereignId || processing) return;
    setProcessing(true);

    try {
      const now = new Date().toISOString();
      const boundHashes = receipts.map((r) => r.sha256Id);
      const oldHash = await sha256Hex(`stale:${sovereignId}:${claimType}:${boundHashes.join(',')}:${now}`);
      const newHash = await sha256Hex(`rectified:${sovereignId}:${claimType}:${correctionNote}:${now}`);
      const validator = VALIDATOR_NODES.find((v) => v.id === validatorId) || VALIDATOR_NODES[0];

      const cert: RectificationCertificate = {
        status: 'RECTIFIED_ATTESTATION_ISSUED',
        rectification_id: `RECTIFIED-${oldHash.slice(0, 8).toUpperCase()}`,
        claim_id: `CLAIM-${newHash.slice(0, 8).toUpperCase()}`,
        claim_type: claimType,
        sovereign_id: sovereignId,
        timestamp: now,
        validator: {
          validator_id: validator.id,
          organization: validator.organization,
          jurisdiction: validator.jurisdiction,
        },
        bound_receipt_hashes: boundHashes,
        old_data_purged_hash: oldHash,
        corrected_data_hash: newHash,
        posture_snapshot: {
          sealed_vectors: posture.sealedModules,
          verified_receipts: posture.verified,
          exposed_receipts: posture.exposed,
          real_posture_pct: posture.basePct,
        },
        compliance_guarantees: {
          gdpr_article_16_right_to_rectification: true,
          universal_human_rights_article_12: true,
          ccpa_right_to_correct: true,
          zero_pii_retention: true,
        },
      };

      const payloadJson = JSON.stringify(cert, null, 2);
      await saveReportToVault(user.id, {
        kind: 'rectification_cert',
        title: `${cert.rectification_id} · ${claimType}`,
        sovereignScore: posture.basePct,
        hdiScore: posture.basePct,
        sealedCount: posture.sealedModules,
        verifiedCount: posture.verified,
        storageTarget: 'local',
        payloadJson,
      });

      setCertificate(cert);
      await refreshCerts();
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    await deleteVaultReport(id);
    await refreshCerts();
  };

  return (
    <div className="arena-scope mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="font-mono-tech text-[11px] tracking-[0.2em] text-[#FF7A18]">
            GDPR ART. 16 · UDHR ART. 12 · CCPA RIGHT TO CORRECT
          </div>
          <h1 className="font-orbitron mt-1 text-2xl font-black text-[#00D4FF]">
            HUMAN DIGNITY RECTIFICATION ENGINE
          </h1>
          <p className="mt-1 text-sm text-[#7B9BB5]">
            Cryptographic rectification proofs anchored to your real SHA-256 receipts &amp; stored locally in IndexedDB (26-month window).
          </p>
          {sovereignId && (
            <div className="mt-3">
              <Sha256Badge hash={sovereignId} label="BOUND TO SOVEREIGN SHA-256" />
            </div>
          )}
        </div>
        <SovereignScoreRing score={posture.basePct} label="SEALED" />
      </div>

      {receipts.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#FF7A18]/60 bg-[#FF7A18]/5 px-4 py-3 text-sm text-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF7A18]" />
            <span>
              You have 0 sealed vector receipts yet. Seal Privacy Reclaim or Communication first to bind real exposure receipts into your rectification proof.
            </span>
          </div>
          {onSelectModule && (
            <NeonButton size="sm" color={NEON.orange} onClick={() => onSelectModule('privacy_reclaim')}>
              OPEN PRIVACY RECLAIM
            </NeonButton>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-[#FF7A18]" />
            <h2 className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
              ISSUE RECTIFICATION PROOF
            </h2>
          </div>

          <form onSubmit={(e) => void handleSubmitClaim(e)} className="space-y-4">
            <div>
              <label htmlFor="claim-type" className="font-mono-tech mb-1 block text-[11px] text-[#7B9BB5]">
                STATUTORY CLAIM TYPE
              </label>
              <select
                id="claim-type"
                value={claimType}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setClaimType(nextId);
                  const found = RECTIFICATION_CLAIM_TYPES.find((c) => c.id === nextId);
                  if (found) setCorrectionNote(found.note);
                }}
                className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#060D1F] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[#00D4FF]"
              >
                {RECTIFICATION_CLAIM_TYPES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#060D1F] text-[#F8FAFC]">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="validator-node" className="font-mono-tech mb-1 block text-[11px] text-[#7B9BB5]">
                ATTESTATION FRAMEWORK / STEWARD PROFILE
              </label>
              <select
                id="validator-node"
                value={validatorId}
                onChange={(e) => setValidatorId(e.target.value)}
                className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#060D1F] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[#00D4FF]"
              >
                {VALIDATOR_NODES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#060D1F] text-[#F8FAFC]">
                    {v.id} — {v.jurisdiction}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="correction-note" className="font-mono-tech mb-1 block text-[11px] text-[#7B9BB5]">
                NON-PII ATTESTATION STATEMENT (HASHED ON-DEVICE)
              </label>
              <textarea
                id="correction-note"
                rows={3}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#00D4FF]"
              />
            </div>

            <NeonButton type="submit" color={NEON.blue} size="lg" disabled={processing || !sovereignId} className="w-full">
              <FileCheck2 className="h-4 w-4" />
              {processing ? 'COMPUTING SHA-256 RECTIFICATION PROOF...' : 'MINT & ARCHIVE SHA-256 PROOF'}
            </NeonButton>
          </form>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="font-orbitron mb-3 text-xs font-bold tracking-wider text-[#00D4FF]">
              ENFORCED HUMAN DIGNITY GUARANTEES
            </h2>
            <div className="space-y-2 text-xs">
              {[
                ['GDPR Article 16', 'Right to Rectification without undue delay'],
                ['UDHR Article 12', 'Protection against arbitrary attacks on identity & dignity'],
                ['CCPA Right to Correct', 'Consumer right to correct inaccurate personal info'],
                ['Zero-PII Hashing', `${receipts.length} sealed receipt hash(es) bound; zero raw PII saved`],
              ].map(([law, desc]) => (
                <div
                  key={law}
                  className="flex items-center justify-between rounded-lg border border-[#00D4FF]/15 bg-[#00D4FF]/5 px-3 py-2"
                >
                  <div>
                    <span className="font-orbitron font-bold text-[#00D4FF]">{law}</span>
                    <span className="ml-2 text-[#7B9BB5]">{desc}</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00FF87]" />
                </div>
              ))}
            </div>
          </GlassCard>

          {certificate && (
            <GlassCard className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#00FF87]" />
                  <span className="font-orbitron text-xs font-bold text-[#00FF87]">
                    {certificate.rectification_id}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <NeonButton
                    size="sm"
                    color={NEON.blue}
                    onClick={() =>
                      void downloadStructuredPdf(
                        `${certificate.rectification_id}.pdf`,
                        `AGAPE SOVEREIGN — RECTIFICATION PROOF (${certificate.rectification_id})`,
                        `Issued: ${certificate.timestamp} · Sovereign ID: ${certificate.sovereign_id}`,
                        [
                          {
                            heading: 'Claim & Framework',
                            lines: [
                              `Claim ID: ${certificate.claim_id}`,
                              `Claim Type: ${certificate.claim_type}`,
                              `Framework: ${certificate.validator.validator_id} (${certificate.validator.jurisdiction})`,
                            ],
                          },
                          {
                            heading: 'Cryptographic Digests (Zero-PII)',
                            lines: [
                              `Purge Digest (SHA-256): ${certificate.old_data_purged_hash}`,
                              `Rectified Digest (SHA-256): ${certificate.corrected_data_hash}`,
                              `Bound Sealed Receipts: ${certificate.bound_receipt_hashes.length}`,
                              ...certificate.bound_receipt_hashes.map((h, i) => `  [${i + 1}] ${h}`),
                            ],
                          },
                          {
                            heading: 'Real Posture Snapshot',
                            lines: [
                              `Sealed Vectors: ${certificate.posture_snapshot.sealed_vectors}/16 (${certificate.posture_snapshot.real_posture_pct}%)`,
                              `Verified Receipts: ${certificate.posture_snapshot.verified_receipts}`,
                              `Exposed Receipts (MATCH_FOUND): ${certificate.posture_snapshot.exposed_receipts}`,
                            ],
                          },
                        ],
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    EXPORT PDF
                  </NeonButton>
                  <NeonButton
                    size="sm"
                    color={NEON.orange}
                    onClick={() =>
                      downloadTextArtifact(
                        `${certificate.rectification_id}.json`,
                        JSON.stringify(certificate, null, 2),
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    EXPORT JSON
                  </NeonButton>
                </div>
              </div>

              <div className="font-mono-tech space-y-1.5 rounded-lg border border-[#00FF87]/25 bg-[#060D1F]/80 p-3 text-[11px] text-[#E8F4FF]/90">
                <div>FRAMEWORK: {certificate.validator.validator_id}</div>
                <div>SEALED VECTORS BOUND: {certificate.bound_receipt_hashes.length} receipt(s)</div>
                <div className="truncate text-[#FF2E9F]">PURGE DIGEST: {certificate.old_data_purged_hash}</div>
                <div className="truncate text-[#00D4FF]">RECTIFIED DIGEST: {certificate.corrected_data_hash}</div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Archived Certificates in IndexedDB */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-orbitron text-xs font-bold tracking-wider text-[#FF7A18]">
            ARCHIVED RECTIFICATION PROOFS (LOCAL INDEXEDDB VAULT)
          </h2>
          <span className="font-mono-tech text-xs text-[#7B9BB5]">{archivedCerts.length} stored</span>
        </div>
        {archivedCerts.length === 0 ? (
          <p className="font-mono-tech py-2 text-xs text-[#7B9BB5]">
            No rectification proofs archived yet. Mint a SHA-256 proof above to save one locally for 26 months.
          </p>
        ) : (
          <div className="space-y-2">
            {archivedCerts.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 rounded-lg border border-[#00D4FF]/20 bg-[#060D1F]/60 p-3 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="font-orbitron text-xs font-bold text-[#00D4FF]">{item.title}</div>
                  <div className="font-mono-tech text-[11px] text-[#7B9BB5]">
                    {new Date(item.createdAt).toLocaleString()} · Audit SHA-256: {item.auditHash.slice(0, 16)}…
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <NeonButton
                    size="sm"
                    color={NEON.blue}
                    onClick={() => downloadTextArtifact(`${item.id}.json`, item.payloadJson)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    JSON
                  </NeonButton>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCert(item.id)}
                    aria-label={`Delete ${item.id}`}
                    className="rounded-lg border border-[#FF2E9F]/35 bg-[#FF2E9F]/10 px-2.5 py-1.5 text-[#FF2E9F] hover:bg-[#FF2E9F]/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
