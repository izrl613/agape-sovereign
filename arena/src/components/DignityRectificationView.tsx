import React, { useState } from 'react';
import { Scale, CheckCircle2, ShieldCheck, Download, FileCheck2 } from 'lucide-react';
import { GlassCard, NeonButton, SovereignScoreRing } from './ui';
import {
  NEON,
  RECTIFICATION_CLAIM_TYPES,
  VALIDATOR_NODES,
} from '../data/sovereignData';
import { downloadTextArtifact, sha256Hex } from '../services/localVaultService';

export interface RectificationCertificate {
  /** ALPHA SANDBOX: simulated demo output — not a real attestation. */
  status: 'SIMULATED_RECTIFIED_DEMO';
  rectification_id: string;
  claim_id: string;
  claim_type: string;
  timestamp: string;
  validator: {
    validator_id: string;
    organization: string;
    signature_status: 'SIMULATED_NOT_VERIFIED';
  };
  old_data_purged_hash: string;
  corrected_data_hash: string;
  human_dignity_index: {
    score_before: number;
    score_after: number;
    improvement_delta: number;
    dignity_tier: string;
  };
  compliance_guarantees: {
    gdpr_article_16_right_to_rectification: boolean;
    universal_human_rights_article_12: boolean;
    ccpa_right_to_correct: boolean;
    zero_pii_retention: boolean;
  };
}

export function DignityRectificationView({
  hdiScore,
  onHdiUpdated,
}: {
  hdiScore: number;
  onHdiUpdated: (newScore: number) => void;
}) {
  const [claimType, setClaimType] = useState(RECTIFICATION_CLAIM_TYPES[0].id);
  const [validatorId, setValidatorId] = useState(VALIDATOR_NODES[0].id);
  const [correctionNote, setCorrectionNote] = useState(RECTIFICATION_CLAIM_TYPES[0].note);
  const [processing, setProcessing] = useState(false);
  const [certificate, setCertificate] = useState<RectificationCertificate | null>(null);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const now = new Date().toISOString();
    const oldHash = await sha256Hex(`stale:${claimType}:${now}`);
    const newHash = await sha256Hex(`rectified:${claimType}:${correctionNote}:${now}`);
    const validator = VALIDATOR_NODES.find((v) => v.id === validatorId) || VALIDATOR_NODES[0];

    const scoreBefore = hdiScore;
    const scoreAfter = Math.min(99.5, Math.max(98.5, Number((scoreBefore + 16.5).toFixed(1))));

    setTimeout(() => {
      const cert: RectificationCertificate = {
        status: 'SIMULATED_RECTIFIED_DEMO',
        rectification_id: `RECTIFIED-${oldHash.slice(0, 8).toUpperCase()}`,
        claim_id: `CLAIM-${newHash.slice(0, 8).toUpperCase()}`,
        claim_type: claimType,
        timestamp: now,
        validator: {
          validator_id: validator.id,
          organization: validator.organization,
          signature_status: 'SIMULATED_NOT_VERIFIED',
        },
        old_data_purged_hash: oldHash,
        corrected_data_hash: newHash,
        human_dignity_index: {
          score_before: scoreBefore,
          score_after: scoreAfter,
          improvement_delta: Number((scoreAfter - scoreBefore).toFixed(1)),
          dignity_tier: 'SOVEREIGN_RECTIFIED_GOLD',
        },
        compliance_guarantees: {
          gdpr_article_16_right_to_rectification: true,
          universal_human_rights_article_12: true,
          ccpa_right_to_correct: true,
          zero_pii_retention: true,
        },
      };
      setCertificate(cert);
      onHdiUpdated(scoreAfter);
      setProcessing(false);
    }, 750);
  };

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="font-mono-tech text-[11px] tracking-[0.2em] text-[#FF7A18]">
            GDPR ART. 16 · UDHR ART. 12 · CCPA RIGHT TO CORRECT
          </div>
          <h2 className="font-orbitron text-2xl font-black text-[#00D4FF]">
            HUMAN DIGNITY RECTIFICATION ENGINE
          </h2>
          <p className="text-sm text-[#7B9BB5]">
            Simulated validator attestation, atomic stale-data purging & Zero-PII cryptographic proofs — ALPHA DEMO DATA
          </p>
        </div>
        <SovereignScoreRing score={Math.round(hdiScore)} label="HDI INDEX" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Claim Submission Form */}
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-[#FF7A18]" />
            <h3 className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
              SUBMIT RECTIFICATION CLAIM
            </h3>
          </div>

          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div>
              <label className="font-mono-tech mb-1 block text-[11px] text-[#7B9BB5]">
                CLAIM TYPE
              </label>
              <select
                value={claimType}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setClaimType(nextId);
                  const found = RECTIFICATION_CLAIM_TYPES.find((c) => c.id === nextId);
                  if (found) setCorrectionNote(found.note);
                }}
                className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#060D1F] px-3 py-2.5 text-sm text-[#E8F4FF] outline-none focus:border-[#00D4FF]"
              >
                {RECTIFICATION_CLAIM_TYPES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-mono-tech mb-1 block text-[11px] text-[#7B9BB5]">
                SIMULATED VALIDATOR NODE (DEMO)
              </label>
              <select
                value={validatorId}
                onChange={(e) => setValidatorId(e.target.value)}
                className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#060D1F] px-3 py-2.5 text-sm text-[#E8F4FF] outline-none focus:border-[#00D4FF]"
              >
                {VALIDATOR_NODES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} — {v.organization}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-mono-tech mb-1 block text-[11px] text-[#7B9BB5]">
                CORRECTION ATTESTATION NOTE
              </label>
              <textarea
                rows={3}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3 py-2 text-sm text-[#E8F4FF] outline-none focus:border-[#00D4FF]"
              />
            </div>

            <NeonButton type="submit" color={NEON.blue} size="lg" disabled={processing} className="w-full">
              <FileCheck2 className="h-4 w-4" />
              {processing ? 'EXECUTING ATOMIC PATCH & ZERO-SCRUB...' : 'EXECUTE RECTIFICATION & ISSUE PROOF'}
            </NeonButton>
          </form>
        </GlassCard>

        {/* Compliance & Certificate Output */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="font-orbitron mb-3 text-xs font-bold tracking-wider text-[#00D4FF]">
              ENFORCED HUMAN DIGNITY GUARANTEES
            </h3>
            <div className="space-y-2 text-xs">
              {[
                ['GDPR Article 16', 'Right to Rectification without undue delay'],
                ['UDHR Article 12', 'Protection against arbitrary attacks on identity & dignity'],
                ['CCPA Right to Correct', 'Consumer right to correct inaccurate personal info'],
                ['Zero-PII Retention', 'Transient memory zeroing after SHA-256 anchoring'],
              ].map(([law, desc]) => (
                <div
                  key={law}
                  className="flex items-center justify-between rounded-lg border border-[#00D4FF]/15 bg-[#00D4FF]/5 px-3 py-2"
                >
                  <div>
                    <span className="font-orbitron font-bold text-[#00D4FF]">{law}</span>
                    <span className="ml-2 text-[#7B9BB5]">{desc}</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                </div>
              ))}
            </div>
          </GlassCard>

          {certificate && (
            <GlassCard className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span className="font-orbitron text-xs font-bold text-emerald-400">
                    {certificate.rectification_id} · {certificate.human_dignity_index.dignity_tier}
                  </span>
                </div>
                <NeonButton
                  size="sm"
                  color={NEON.orange}
                  onClick={() =>
                    downloadTextArtifact(
                      `${certificate.rectification_id}.json`,
                      JSON.stringify(certificate, null, 2)
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  EXPORT PROOF
                </NeonButton>
              </div>

              <div className="font-mono-tech space-y-1.5 rounded-lg border border-emerald-400/20 bg-black/40 p-3 text-[11px] text-[#E8F4FF]/85">
                <div>VALIDATOR (SIMULATED): {certificate.validator.validator_id}</div>
                <div>STATUS: {certificate.status} — simulated demo output, not a real attestation</div>
                <div>HDI DELTA: {certificate.human_dignity_index.score_before} → {certificate.human_dignity_index.score_after} (+{certificate.human_dignity_index.improvement_delta})</div>
                <div className="truncate text-[#FF2E9F]">PURGED HASH: {certificate.old_data_purged_hash}</div>
                <div className="truncate text-[#00D4FF]">RECTIFIED HASH: {certificate.corrected_data_hash}</div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
