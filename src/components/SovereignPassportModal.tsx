/**
 * SOVEREIGN PASSPORT MODAL
 * ============================================================
 * OPERATION FRAMEWORK — Phase 4: Export & Recovery UI
 *
 * Displays the Digital Sovereign Passport export flow:
 * 1. Confirms audit report summary
 * 2. Generates BIP-39 mnemonic phrase
 * 3. Forces user acknowledgment before download
 * 4. Triggers manifest JSON download
 * 5. Shows SHA-256 identity fingerprint at all times (privacy guarantee)
 * ============================================================
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Download, Eye, EyeOff, Copy, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { NEON, NeonText, GlassCard, NeonButton } from './UI';
import { useAuth } from '../AuthContext';
import { runExportStage } from '../services/poaOrchestratorService';
import { downloadManifest } from '../services/exportRecoveryService';
import { formatHashDisplay } from '../services/sovereignHashService';
import type { AuditReport } from '../services/architectAIAgentService';
import type { PassportManifest, SovereignPassport } from '../services/exportRecoveryService';

interface Props {
  auditReport: AuditReport;
  onClose: () => void;
}

type ExportStep = 'confirm' | 'generating' | 'mnemonic' | 'acknowledged' | 'complete' | 'error';

export const SovereignPassportModal: React.FC<Props> = ({ auditReport, onClose }) => {
  const { sovereignHash } = useAuth();
  const [step, setStep] = useState<ExportStep>('confirm');
  const [passport, setPassport] = useState<SovereignPassport | null>(null);
  const [manifest, setManifest] = useState<PassportManifest | null>(null);
  const [mnemonicVisible, setMnemonicVisible] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = auditReport.reportableData.sovereignAuditScore;
  const riskLevel = auditReport.reportableData.financialRisk.riskLevel;
  const activeModules = auditReport.reportableData.stabilityIndex.activeModules;

  const riskColor: Record<string, string> = {
    LOW: NEON.blue,
    MEDIUM: NEON.orange,
    HIGH: '#FF6B35',
    CRITICAL: NEON.magenta,
  };

  const handleGeneratePassport = async () => {
    if (!sovereignHash) {
      setError('Identity hash not available. Please re-authenticate.');
      setStep('error');
      return;
    }

    setStep('generating');
    try {
      const result = await runExportStage(sovereignHash, auditReport);
      if (result.status === 'FAILED') {
        setError(result.reason || 'Export failed.');
        setStep('error');
        return;
      }

      // Build the full manifest for download
      const fullManifest: PassportManifest = {
        targetHash: sovereignHash,
        targetHashDisplay: formatHashDisplay(sovereignHash),
        exportTimestamp: result.exportTimestamp,
        systemPolicy: 'GDPR-Compliant V1.3 — Agape Sovereign',
        auditSummary: {
          sovereignScore: score,
          riskLevel,
          activeModules,
          policyVersion: 'V1.3',
        },
        publicFingerprint: result.publicFingerprint,
        integrityHash: result.publicFingerprint, // simplified for UI
        legalNotice:
          'This document constitutes the Minimum Viable Identity Blueprint (MVIB). ' +
          'Under no circumstances shall there be any record of data scraping through any method or means.',
        instructions: result.instructions,
      };

      setPassport(result);
      setManifest(fullManifest);
      setStep('mnemonic');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during export.');
      setStep('error');
    }
  };

  const handleCopyMnemonic = async () => {
    if (!passport?.mnemonicPhrase) return;
    await navigator.clipboard.writeText(passport.mnemonicPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    if (!passport || !manifest) return;
    downloadManifest(passport, manifest);
    setStep('complete');
  };

  const mnemonicWords = passport?.mnemonicPhrase?.split(' ') ?? [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px',
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          style={{ width: '100%', maxWidth: 560 }}
        >
          <GlassCard style={{ padding: '32px', position: 'relative' }}>
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                color: NEON.textMuted,
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Shield size={28} color={NEON.blue} />
              <div>
                <NeonText color={NEON.blue} size="1.2rem" weight={700}>Sovereign Digital Passport</NeonText>
                <div style={{ color: NEON.textMuted, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'" }}>
                  AGAPE SOVEREIGN — EXPORT & RECOVERY
                </div>
              </div>
            </div>

            {/* SHA-256 identity display — always visible */}
            {sovereignHash && (
              <div style={{
                background: 'rgba(0,212,255,0.05)', border: `1px solid ${NEON.blue}30`,
                borderRadius: 8, padding: '8px 12px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: NEON.blue, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: NEON.textMuted, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", marginBottom: 2 }}>
                    SHA-256 IDENTITY ANCHOR
                  </div>
                  <div style={{ color: NEON.blue, fontSize: '0.75rem', fontFamily: "'Share Tech Mono'" }}>
                    {formatHashDisplay(sovereignHash)}
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Confirm */}
            {step === 'confirm' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ color: NEON.text, fontSize: '0.85rem', marginBottom: 16 }}>
                  Generate your Minimum Viable Identity Blueprint (MVIB) — a cryptographic proof of your
                  digital sovereignty without exposing raw personal data.
                </div>

                {/* Audit summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {[
                    { label: 'Sovereign Score', value: score.toFixed(1), color: NEON.blue },
                    { label: 'Risk Level', value: riskLevel, color: riskColor[riskLevel] ?? NEON.text },
                    { label: 'Active Modules', value: `${activeModules}/16`, color: NEON.orange },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '12px 8px', textAlign: 'center',
                    }}>
                      <div style={{ color, fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Share Tech Mono'" }}>{value}</div>
                      <div style={{ color: NEON.textMuted, fontSize: '0.6rem', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'rgba(255,122,24,0.08)', border: `1px solid ${NEON.orange}30`,
                  borderRadius: 8, padding: '12px', marginBottom: 20,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <AlertTriangle size={16} color={NEON.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: NEON.text, fontSize: '0.75rem', lineHeight: 1.5 }}>
                    A <strong>12-word Mnemonic Phrase</strong> will be generated. Write it on paper.
                    It will <strong>not be stored</strong> by Agape Sovereign and cannot be recovered if lost.
                    2-year export limit applies.
                  </div>
                </div>

                <NeonButton color={NEON.blue} onClick={handleGeneratePassport} style={{ width: '100%' }}>
                  Generate My Sovereign Passport
                </NeonButton>
              </motion.div>
            )}

            {/* STEP: Generating */}
            {step === 'generating' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '24px 0' }}
              >
                <div style={{
                  width: 48, height: 48, margin: '0 auto 16px',
                  border: `3px solid ${NEON.blue}30`,
                  borderTop: `3px solid ${NEON.blue}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ color: NEON.text, fontSize: '0.9rem' }}>Generating Sovereign Passport...</div>
                <div style={{ color: NEON.textMuted, fontSize: '0.7rem', marginTop: 8 }}>
                  Executing cryptographic key derivation
                </div>
              </motion.div>
            )}

            {/* STEP: Mnemonic */}
            {step === 'mnemonic' && passport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{
                  background: 'rgba(255,46,159,0.08)', border: `1px solid ${NEON.magenta}30`,
                  borderRadius: 8, padding: '12px', marginBottom: 16,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <AlertTriangle size={16} color={NEON.magenta} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: NEON.text, fontSize: '0.75rem', lineHeight: 1.5 }}>
                    <strong>CRITICAL:</strong> Write your Mnemonic Phrase on paper NOW.
                    This is your ONLY recovery key. It is displayed once and never stored.
                  </div>
                </div>

                {/* Mnemonic phrase grid */}
                <div style={{
                  background: 'rgba(0,0,0,0.4)', border: `1px solid ${NEON.blue}40`,
                  borderRadius: 10, padding: '16px', marginBottom: 16, position: 'relative',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <div style={{ color: NEON.textMuted, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'" }}>
                      12-WORD RECOVERY PHRASE
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setMnemonicVisible(!mnemonicVisible)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: NEON.textMuted }}
                      >
                        {mnemonicVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={handleCopyMnemonic}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00FF88' : NEON.textMuted }}
                      >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {mnemonicVisible ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {mnemonicWords.map((word, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(0,212,255,0.05)', borderRadius: 6,
                            padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <span style={{ color: NEON.textMuted, fontSize: '0.6rem', minWidth: 16 }}>{i + 1}.</span>
                          <span style={{ color: NEON.blue, fontSize: '0.8rem', fontFamily: "'Share Tech Mono'" }}>{word}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: NEON.textMuted, fontSize: '0.75rem', letterSpacing: '0.2em',
                    }}>
                      ● ● ● ● ● ● ● ● ● ● ● ●
                    </div>
                  )}
                </div>

                {/* Acknowledge checkbox */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                  marginBottom: 16, padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                  border: acknowledged ? `1px solid ${NEON.blue}50` : '1px solid rgba(255,255,255,0.05)',
                }}>
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    style={{ marginTop: 2, accentColor: NEON.blue }}
                  />
                  <div style={{ color: NEON.text, fontSize: '0.75rem', lineHeight: 1.5 }}>
                    I have written my Mnemonic Phrase on paper and understand that Agape Sovereign
                    does not store it. I accept sole responsibility for its safekeeping.
                  </div>
                </label>

                <NeonButton
                  color={acknowledged ? NEON.blue : NEON.textMuted}
                  onClick={handleDownload}
                  disabled={!acknowledged}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Download size={16} />
                  Download Passport Manifest
                </NeonButton>
              </motion.div>
            )}

            {/* STEP: Complete */}
            {step === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '16px 0' }}
              >
                <CheckCircle size={48} color="#00FF88" style={{ margin: '0 auto 16px' }} />
                <NeonText color="#00FF88" size="1.1rem" weight={700}>Passport Exported</NeonText>
                <div style={{ color: NEON.textMuted, fontSize: '0.8rem', marginTop: 8, lineHeight: 1.6 }}>
                  Your Sovereign Passport Manifest has been downloaded.
                  <br />
                  <strong style={{ color: NEON.text }}>Agape Sovereign — One Love.</strong>
                </div>
                {passport && (
                  <div style={{
                    marginTop: 16, padding: '10px 12px',
                    background: 'rgba(0,212,255,0.05)', borderRadius: 8, textAlign: 'left',
                  }}>
                    <div style={{ color: NEON.textMuted, fontSize: '0.6rem', fontFamily: "'Share Tech Mono'", marginBottom: 4 }}>
                      PUBLIC FINGERPRINT
                    </div>
                    <div style={{ color: NEON.blue, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", wordBreak: 'break-all' }}>
                      {formatHashDisplay(passport.publicFingerprint)}
                    </div>
                  </div>
                )}
                <NeonButton color={NEON.blue} onClick={onClose} style={{ width: '100%', marginTop: 20 }}>
                  Close
                </NeonButton>
              </motion.div>
            )}

            {/* STEP: Error */}
            {step === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                <AlertTriangle size={40} color={NEON.magenta} style={{ margin: '0 auto 12px' }} />
                <div style={{ color: NEON.magenta, fontWeight: 700, marginBottom: 8 }}>Export Failed</div>
                <div style={{ color: NEON.textMuted, fontSize: '0.8rem', marginBottom: 20 }}>{error}</div>
                <NeonButton color={NEON.blue} onClick={onClose} style={{ width: '100%' }}>Close</NeonButton>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
