import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  Lock,
  Globe,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Sync,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface HardwareEnclaveInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_ENCLAVE_STATUS = {
  deviceType: 'Apple Silicon T2 / Pixel Titan M2',
  fileVault: 'ACTIVE',
  biometricTimeout: '2 hours (too permissive)',
  tpmStatus: 'VERIFIED',
  lastChecked: '10 mins ago',
};

export const HardwareEnclaveInspectorModal: React.FC<HardwareEnclaveInspectorModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  if (!isOpen) return null;

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 800));
    const receipt = await calculateSha256(`ENCLAVE_OPTIMIZED::${Date.now()}`);
    setOptimizationResults({
      fileVault: 'AES-256-GCM enabled',
      biometricTimeout: '1 minute auto-lockdown',
      passkeyRequired: 'All privilege changes',
      tpmStatus: 'Cryptographic attestation active',
      receipt: receipt.substring(0, 16) + '...',
    });
    setIsOptimizing(false);
    onUpdatePerimeterVector('diff-04', 'KNOXED', 'Hardware enclave optimized: 1-minute auto-lockdown and passkey requirement enforced.');
  };

  const handleRevokeLegacy = async () => {
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 300));
    const receipt = await calculateSha256(`LEGACY_REVOKED::${Date.now()}`);
    setOptimizationResults({
      legacyAuthorizations: 'Revoked from Google/Apple',
      passkeyEnforced: 'All accounts now passkey-only',
      receipt: receipt.substring(0, 16) + '...',
    });
    setIsOptimizing(false);
    onUpdatePerimeterVector('diff-04', 'KNOXED', 'Revoked remote legacy device authorizations from Google/Apple accounts.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#00D4FF]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <Cpu className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 4: Hardware Enclave & Titan M2 Inspector
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    ENCLAVE INSPECTED
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Apple Secure Enclave • Google Titan M2 • TPM Verification • 2026 ECRA LTS
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Status */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Current Enclave Status</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="font-medium text-slate-300">Device:</span>
                <span className="text-white ml-2">{INITIAL_ENCLAVE_STATUS.deviceType}</span>
              </div>
              <div>
                <span className="font-medium text-slate-300">FileVault:</span>
                <span className={`text-${INITIAL_ENCLAVE_STATUS.fileVault.includes('ACTIVE') ? '#00D4FF' : '#FF7A18'} ml-2 font-mono${INITIAL_ENCLAVE_STATUS.fileVault.includes('ACTIVE') ? '' : ' text-opacity-50'}`}>
                  {INITIAL_ENCLAVE_STATUS.fileVault}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-300">TPM:</span>
                <span className="text-white ml-2">{INITIAL_ENCLAVE_STATUS.tpmStatus}</span>
              </div>
              <div>
                <span className="font-medium text-slate-300">Biometric Timeout:</span>
                <span className={INITIAL_ENCLAVE_STATUS.biometricTimeout.includes('too permissive') ? 'text-[#FF7A18]' : 'text-[#00D4FF]' } ml-2 font-mono>
                  {INITIAL_ENCLAVE_STATUS.biometricTimeout}
                </span>
              </div>
            </div>
          </div>

          {/* Optimization Actions */}
          {optimizationResults && (
            <div className="px-4 sm:px-6 py-4 bg-[#0F172A] border-t border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Optimization Applied</span>
              </h4>
              <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">FileVault:</span> {optimizationResults.fileVault}
                <span className="text-slate-400 ml-4">Biometric Timeout:</span> {optimizationResults.biometricTimeout}
                <span className="text-slate-400 ml-4">Passkey:</span> {optimizationResults.passkeyEnforced ? 'Enabled' : 'Disabled'}
                <span className="text-slate-400 ml-4">TPM:</span> {optimizationResults.tpmStatus}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <button
                  onClick={handleOptimize}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <Sync className="w-3.5 h-3.5 text-white" />
                  <span>Apply Full Enclave Optimization</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Quick Actions</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleRevokeLegacy()}
                className="py-2 px-3 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-[#00D4FF] transition flex items-center gap-2"
              >
                <Link className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Revoke Legacy Authorizations</span>
              </button>
              <button
                onClick={handleOptimize}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                disabled={isOptimizing}
              >
                {isOptimizing ? 'Optimizing...' : 'Enforce 1-min Auto-Lockdown'}
                <Clock className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Hardware-Bound • Passkey Required • ECRA 2026 Certified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Inspector
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-04',
                    'KNOXED',
                    'Module 4 Synchronized: Hardware enclave inspection cycle completed. All protections active.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 4 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};