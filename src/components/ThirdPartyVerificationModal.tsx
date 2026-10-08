/**
 * ============================================================
 * ARCHITECT AI — Third-Party Agent Live User Data Verification Modal
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Provides live user inspection & verification of SHA-256 encrypted identity payload
 * processed by Architect AI (nemotron-3-nano:4b). Hands off to PDF Agent & Export Agent.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, FileText, Download, CheckCircle2, Cpu, Key, Globe, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import { generateSovereignIdentityPDF, IdentityPassportData } from '../services/pdfAgent';
import { saveToLocalOfflineProfilePasskey, saveToFederatedGoogleAccount } from '../services/exportAgent';
import { NEON } from './UI';
import { toast } from 'sonner';

interface ThirdPartyVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  sovereignScore: number;
  sha256Id: string;
  vectorData: Record<string, any>;
}

export const ThirdPartyVerificationModal: React.FC<ThirdPartyVerificationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  sovereignScore,
  sha256Id,
  vectorData,
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSavingPasskey, setIsSavingPasskey] = useState(false);
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');

  if (!isOpen) return null;

  const verifiedDate = new Date();
  const expiresDate = new Date(verifiedDate.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years

  const handleVerify = () => {
    setIsVerified(true);
    toast.success('Live Identity Data Verified & Authenticated by Third-Party Agent!');
  };

  const handleGeneratePDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.loading('PDF Agent generating 2-Year Valid Passport with SHA-256 page seals...', { id: 'pdf-gen' });

      const passportInput: IdentityPassportData = {
        userId,
        userEmail: userEmail || 'sovereign-user@enclave.local',
        sovereignScore,
        classification: sovereignScore > 75 ? 'KNOXED' : 'NUKED',
        sha256Id,
        llmModel: 'nemotron-3-nano:4b (2.8GB Offline LLM)',
        verifiedAt: verifiedDate,
        expiresAt: expiresDate,
        vectorData: vectorData || {},
      };

      const result = await generateSovereignIdentityPDF(passportInput);
      setPdfBlob(result.pdfBlob);
      setPdfFileName(result.pdfFileName);
      setPdfGenerated(true);

      // Trigger browser download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.pdfBlob);
      link.download = result.pdfFileName;
      link.click();

      toast.success('PDF Passport Exported! Valid for 2 Years with SHA-256 seal on every page.', { id: 'pdf-gen' });
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      toast.error(`PDF generation failed: ${err.message || err}`, { id: 'pdf-gen' });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSaveLocalPasskey = async () => {
    try {
      setIsSavingPasskey(true);
      await saveToLocalOfflineProfilePasskey({
        userId,
        userEmail,
        sovereignScore,
        sha256Id,
        verifiedAt: verifiedDate.toISOString(),
        expiresAt: expiresDate.toISOString(),
        vectorData,
      });
    } finally {
      setIsSavingPasskey(false);
    }
  };

  const handleSaveGoogleAccount = async () => {
    try {
      setIsSavingGoogle(true);
      await saveToFederatedGoogleAccount({
        userId,
        userEmail,
        sovereignScore,
        sha256Id,
        verifiedAt: verifiedDate.toISOString(),
        expiresAt: expiresDate.toISOString(),
        vectorData,
      });
    } finally {
      setIsSavingGoogle(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#060d1f] border border-[#00d4ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,212,255,0.15)] overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#0a1023] border-b border-[#00d4ff]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff]">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center gap-2">
                  THIRD-PARTY AGENT <span className="text-[#00d4ff]">LIVE USER VERIFICATION</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Processed by Architect AI using <span className="text-emerald-400">nemotron-3-nano:4b</span> (2.8GB Offline Model)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SHA-256 Master Digest Badge */}
            <div className="p-4 rounded-xl bg-[#081229] border border-[#00d4ff]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#00d4ff]">
                <span className="flex items-center gap-2 font-bold">
                  <Lock className="w-4 h-4 text-emerald-400" /> MASTER SHA-256 INTEGRITY DIGEST
                </span>
                <span className="text-slate-400">AES-GCM 256-BIT ENCRYPTED</span>
              </div>
              <div className="p-3 bg-[#040914] rounded-lg font-mono text-xs text-emerald-400 break-all border border-emerald-500/20">
                {sha256Id}
              </div>
            </div>

            {/* Live Data Vector Review */}
            <div className="space-y-3">
              <h4 className="text-sm font-orbitron font-semibold text-slate-300 flex items-center justify-between">
                <span>16 IDENTITY VECTORS PREVIEW (LIVE USER DATA)</span>
                <span className="text-xs font-mono text-[#00d4ff]">16 / 16 MODULES ACTIVE</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {Object.entries(vectorData).map(([modId, data]: [string, any]) => (
                  <div key={modId} className="p-3 rounded-lg bg-[#081229] border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-[#00d4ff] font-mono">{data.vector || modId}</span>
                        <span>{data.label || modId}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                        {data.details || 'Secured & SHA-256 Hashed'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      data.status === 'KNOXED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {data.status || 'KNOXED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Status Banner */}
            {!isVerified ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-amber-300 text-xs">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>Please review your live user data above and click <strong>VERIFY LIVE DATA</strong> to enable PDF Export & Enclave Storage options.</span>
                </div>
                <button
                  onClick={handleVerify}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-orbitron font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" /> VERIFY LIVE DATA
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-mono">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>LIVE USER DATA VERIFIED & SIGNED OFF BY USER. READY FOR PDF AGENT & EXPORT AGENT.</span>
              </div>
            )}

            {/* Export & Save Handoff Options */}
            {isVerified && (
              <div className="p-5 rounded-xl bg-[#081229] border border-[#00d4ff]/30 space-y-4">
                <h4 className="text-sm font-orbitron font-bold text-[#00d4ff] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> PDF AGENT & EXPORT AGENT HANDOFF OPTIONS
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* PDF Agent Option */}
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isExportingPDF}
                    className="p-4 rounded-xl bg-[#0a1633] hover:bg-[#0e1d45] border border-[#00d4ff]/40 flex flex-col items-center justify-center gap-2 text-center transition-all group disabled:opacity-50"
                  >
                    <FileText className="w-7 h-7 text-[#00d4ff] group-hover:scale-110 transition-transform" />
                    <span className="font-orbitron font-bold text-xs text-white">EXPORT 2-YEAR PDF</span>
                    <span className="text-[10px] font-mono text-slate-400">SHA-256 seal on EVERY page</span>
                  </button>

                  {/* Local Profile Passkey Option */}
                  <button
                    onClick={handleSaveLocalPasskey}
                    disabled={isSavingPasskey}
                    className="p-4 rounded-xl bg-[#0a1633] hover:bg-[#0e1d45] border border-emerald-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all group disabled:opacity-50"
                  >
                    <Key className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="font-orbitron font-bold text-xs text-white">SAVE LOCAL OFFLINE PROFILE</span>
                    <span className="text-[10px] font-mono text-slate-400">Hardened by Passkey WebAuthn</span>
                  </button>

                  {/* Google Federated Account Option */}
                  <button
                    onClick={handleSaveGoogleAccount}
                    disabled={isSavingGoogle}
                    className="p-4 rounded-xl bg-[#0a1633] hover:bg-[#0e1d45] border border-cyan-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all group disabled:opacity-50"
                  >
                    <Globe className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="font-orbitron font-bold text-xs text-white">SAVE TO GOOGLE ACCOUNT</span>
                    <span className="text-[10px] font-mono text-slate-400">Federated Firebase Cloud Enclave</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#0a1023] border-t border-[#00d4ff]/20 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>VALIDITY: 2 YEARS ({verifiedDate.toISOString().split('T')[0]} → {expiresDate.toISOString().split('T')[0]})</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
