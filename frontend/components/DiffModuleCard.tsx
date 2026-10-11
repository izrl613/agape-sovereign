import React from 'react';
import { DiffVector } from '../types';
<<<<<<< HEAD
import { 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Hash, 
  Eye, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Send, 
  Lock, 
  Skull, 
  ScanFace, 
  MapPin, 
  Share2, 
  CreditCard, 
  Tv, 
  Mail, 
  Wifi, 
  Cpu, 
  FileText, 
  KeyRound,
  Globe,
  Cloud
} from 'lucide-react';
=======
import { Flame, ShieldAlert, ShieldCheck, Hash, Eye, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)

interface DiffModuleCardProps {
  vector: DiffVector;
  onNuke: (id: string) => void;
  onKnox: (id: string) => void;
  onConsultAI: (vector: DiffVector) => void;
  onEdit: (vector: DiffVector) => void;
<<<<<<< HEAD
  onOpenEmailScanner?: () => void;
  onOpenSocialScrubber?: () => void;
  onOpenFileVault?: () => void;
  onOpenHardwareEnclave?: () => void;
  onOpenDeepWeb?: () => void;
  onOpenBrokerDispatcher?: () => void;
  onOpenDnsSurveillance?: () => void;
  onOpenFinancialTokenization?: () => void;
  onOpenBiometricDefense?: () => void;
  onOpenCloudBackup?: () => void;
  onOpenIdentityMdl?: () => void;
  onOpenSmartHomeTelemetry?: () => void;
  onOpenLocationScrubber?: () => void;
  onOpenStealerScanner?: () => void;
  onOpenPasswordStrength?: () => void;
=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
}

export const DiffModuleCard: React.FC<DiffModuleCardProps> = ({
  vector,
  onNuke,
  onKnox,
  onConsultAI,
  onEdit,
<<<<<<< HEAD
  onOpenEmailScanner,
  onOpenSocialScrubber,
  onOpenFileVault,
  onOpenHardwareEnclave,
  onOpenDeepWeb,
  onOpenBrokerDispatcher,
  onOpenDnsSurveillance,
  onOpenFinancialTokenization,
  onOpenBiometricDefense,
  onOpenCloudBackup,
  onOpenIdentityMdl,
  onOpenSmartHomeTelemetry,
  onOpenLocationScrubber,
  onOpenStealerScanner,
  onOpenPasswordStrength,
=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
}) => {
  const getStatusBadge = () => {
    switch (vector.status) {
      case 'NUKED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50 shadow-[0_0_10px_rgba(255,46,159,0.3)]">
            <Flame className="w-3.5 h-3.5 animate-pulse" /> NUKED (ERASED)
          </span>
        );
      case 'KNOXED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50 shadow-[0_0_10px_rgba(0,212,255,0.3)]">
            <ShieldCheck className="w-3.5 h-3.5" /> KNOXED (ENCLAVE)
          </span>
        );
      case 'EXPOSED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/50 shadow-[0_0_10px_rgba(255,122,24,0.3)]">
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> EXPOSED RISK
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-600">
            <Eye className="w-3.5 h-3.5" /> MONITORED
          </span>
        );
    }
  };

  const getRiskBorder = () => {
    if (vector.status === 'EXPOSED') {
      return 'border-[#FF7A18]/60 hover:border-[#FF2E9F] shadow-[0_0_15px_rgba(255,122,24,0.15)]';
    }
    if (vector.status === 'KNOXED') {
      return 'border-[#00D4FF]/50 shadow-[0_0_15px_rgba(0,212,255,0.1)]';
    }
    return 'border-[#FF2E9F]/50 shadow-[0_0_15px_rgba(255,46,159,0.1)]';
  };

<<<<<<< HEAD
  const isEmailModule = vector.id === 'diff-01' || vector.moduleNumber === 1;
  const isSocialModule = vector.id === 'diff-02' || vector.moduleNumber === 2;
  const isFileVaultModule = vector.id === 'diff-03' || vector.moduleNumber === 3;
  const isHardwareEnclaveModule = vector.id === 'diff-04' || vector.moduleNumber === 4;
  const isDeepWebModule = vector.id === 'diff-05' || vector.moduleNumber === 5;
  const isBrokerModule = vector.id === 'diff-06' || vector.moduleNumber === 6;
  const isDnsModule = vector.id === 'diff-08' || vector.moduleNumber === 8;
  const isFinancialModule = vector.id === 'diff-09' || vector.moduleNumber === 9;
  const isBiometricModule = vector.id === 'diff-10' || vector.moduleNumber === 10;
  const isCloudBackupModule = vector.id === 'diff-11' || vector.moduleNumber === 11;
  const isIdentityMdlModule = vector.id === 'diff-12' || vector.moduleNumber === 12;
  const isSmartHomeModule = vector.id === 'diff-13' || vector.moduleNumber === 13;
  const isLocationModule = vector.id === 'diff-14' || vector.moduleNumber === 14;
  const isStealerModule = vector.id === 'diff-15' || vector.moduleNumber === 15;
  const isPasswordStrengthModule = vector.id === 'diff-16' || vector.moduleNumber === 16;

=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
  return (
    <div className="relative group rounded-2xl p-[1.5px] transition-all duration-300 hover:scale-[1.01]">
      {/* Outer pulsing neon border gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] opacity-35 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

      {/* Main card body */}
      <div className={`relative h-full flex flex-col justify-between rounded-2xl bg-[#0F172A] p-5 border ${getRiskBorder()} backdrop-blur-xl transition-all`}>
        {/* Header: Module Number & Status */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#0B1020] border border-cyan-500/40 font-mono text-xs font-bold text-[#00D4FF] flex items-center justify-center shadow-inner">
                {vector.moduleNumber}
              </span>
              <span className="text-[11px] font-mono tracking-wider font-semibold uppercase text-cyan-300/80">
                {vector.category.replace('_', ' ')}
              </span>
            </div>
            {getStatusBadge()}
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-[#00D4FF] transition-colors leading-snug">
            {vector.name}
          </h3>

          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
            {vector.shortDesc}
          </p>

          {/* User Input & Exposure Summary */}
          <div className="mt-4 p-3 rounded-xl bg-[#0B1020]/90 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold text-slate-300">Identity Data Vector:</span>
              <button
                onClick={() => onEdit(vector)}
                className="text-[10px] text-[#00D4FF] hover:underline font-mono"
              >
                Edit
              </button>
            </div>
            <p className="font-mono text-xs text-white truncate font-medium">
              {vector.dataValue || 'None recorded'}
            </p>

            <div className="mt-2 text-[11px] text-[#FF7A18] flex items-start gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A18] mt-1.5 shrink-0" />
              <span>{vector.exposureDetails}</span>
            </div>
          </div>

<<<<<<< HEAD
          {/* Module 1: Email Breach Scanner */}
          {isEmailModule && onOpenEmailScanner && (
            <div className="mt-3">
              <button
                onClick={onOpenEmailScanner}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF2E9F]/20 to-[#FF7A18]/20 hover:from-[#00D4FF]/30 hover:to-[#FF2E9F]/30 border border-[#00D4FF]/50 hover:border-[#FF2E9F] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Mail className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open Email Breach & GDPR Art 17 Scanner</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF2E9F]" />
              </button>
            </div>
          )}

          {/* Module 2: Social Media Scrubber */}
          {isSocialModule && onOpenSocialScrubber && (
            <div className="mt-3">
              <button
                onClick={onOpenSocialScrubber}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF2E9F]/20 via-[#00D4FF]/20 to-[#FF7A18]/20 hover:from-[#FF2E9F]/30 hover:to-[#00D4FF]/30 border border-[#FF2E9F]/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Share2 className="w-4 h-4 text-[#FF2E9F] animate-pulse" />
                <span>Launch Social Scrubber & EXIF Eraser</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

          {/* Module 3: File Shredder & Vault */}
          {isFileVaultModule && onOpenFileVault && (
            <div className="mt-3">
              <button
                onClick={onOpenFileVault}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF7A18]/20 to-[#FF2E9F]/20 hover:from-[#00D4FF]/30 hover:to-[#FF2E9F]/30 border border-[#00D4FF]/50 hover:border-[#FF2E9F] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Lock className="w-4 h-4 text-[#00D4FF]" />
                <span>Open DoD Shredder & AES-GCM Vault</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF7A18]" />
              </button>
            </div>
          )}

          {/* Module 4: Hardware Enclave Inspector */}
          {isHardwareEnclaveModule && onOpenHardwareEnclave && (
            <div className="mt-3">
              <button
                onClick={onOpenHardwareEnclave}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF7A18]/20 to-[#FF2E9F]/20 hover:from-[#00D4FF]/30 hover:to-[#FF7A18]/30 border border-[#00D4FF]/50 hover:border-[#FF7A18] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Cpu className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open Enclave & Titan M2 Inspector</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF7A18]" />
              </button>
            </div>
          )}

          {/* Module 5: Deep Web Exposure & Darknet Index */}
          {isDeepWebModule && onOpenDeepWeb && (
            <div className="mt-3">
              <button
                onClick={onOpenDeepWeb}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500/20 via-[#FF2E9F]/20 to-[#00D4FF]/20 hover:from-purple-500/30 hover:to-[#FF2E9F]/30 border border-purple-500/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Globe className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>Open Onion & Pastebin Darknet Monitor</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

          {/* Module 6: Data Broker Dispatcher */}
          {isBrokerModule && onOpenBrokerDispatcher && (
            <div className="mt-3">
              <button
                onClick={onOpenBrokerDispatcher}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF2E9F]/20 via-[#00D4FF]/20 to-[#FF7A18]/20 hover:from-[#FF2E9F]/30 hover:to-[#00D4FF]/30 border border-[#FF2E9F]/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Flame className="w-4 h-4 text-[#FF2E9F] animate-pulse" />
                <span>Launch Opt-Out Dispatcher (CCPA / GDPR)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

          {/* Module 8: DNS Surveillance */}
          {isDnsModule && onOpenDnsSurveillance && (
            <div className="mt-3">
              <button
                onClick={onOpenDnsSurveillance}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF7A18]/20 to-[#FF2E9F]/20 hover:from-[#00D4FF]/30 hover:to-[#FF2E9F]/30 border border-[#00D4FF]/50 hover:border-[#FF7A18] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Wifi className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open DNS Snooping & WireGuard ODoH Shield</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF7A18]" />
              </button>
            </div>
          )}

          {/* Module 9: Financial Tokenization */}
          {isFinancialModule && onOpenFinancialTokenization && (
            <div className="mt-3">
              <button
                onClick={onOpenFinancialTokenization}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF2E9F]/20 to-[#FF7A18]/20 hover:from-[#00D4FF]/30 hover:to-[#FF2E9F]/30 border border-[#00D4FF]/50 hover:border-[#FF2E9F] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <CreditCard className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open Card Vault Purge & Token Masking</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF2E9F]" />
              </button>
            </div>
          )}

          {/* Module 10: Biometric Defense Shield */}
          {isBiometricModule && onOpenBiometricDefense && (
            <div className="mt-3">
              <button
                onClick={onOpenBiometricDefense}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF2E9F]/20 to-[#FF7A18]/20 hover:from-[#00D4FF]/30 hover:to-[#FF2E9F]/30 border border-[#00D4FF]/50 hover:border-[#FF2E9F] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <ScanFace className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open Clearview & PimEyes Biometric Shield</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF7A18]" />
              </button>
            </div>
          )}

          {/* Module 11: Cloud Backup Zero-Knowledge */}
          {isCloudBackupModule && onOpenCloudBackup && (
            <div className="mt-3">
              <button
                onClick={onOpenCloudBackup}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF7A18]/20 to-[#FF2E9F]/20 hover:from-[#00D4FF]/30 hover:to-[#00D4FF]/30 border border-[#00D4FF]/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Cloud className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open iCloud ADP & Google CSE Auditor</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF2E9F]" />
              </button>
            </div>
          )}

          {/* Module 12: Identity Document & mDL */}
          {isIdentityMdlModule && onOpenIdentityMdl && (
            <div className="mt-3">
              <button
                onClick={onOpenIdentityMdl}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 via-[#FF2E9F]/20 to-[#FF7A18]/20 hover:from-[#00D4FF]/30 hover:to-[#FF7A18]/30 border border-[#00D4FF]/50 hover:border-[#FF7A18] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <FileText className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                <span>Open ISO 18013-5 mDL & ID Shredder</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF7A18]" />
              </button>
            </div>
          )}

          {/* Module 13: Smart Home IoT */}
          {isSmartHomeModule && onOpenSmartHomeTelemetry && (
            <div className="mt-3">
              <button
                onClick={onOpenSmartHomeTelemetry}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF7A18]/20 via-[#00D4FF]/20 to-[#FF2E9F]/20 hover:from-[#FF7A18]/30 hover:to-[#00D4FF]/30 border border-[#FF7A18]/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Tv className="w-4 h-4 text-[#FF7A18] animate-pulse" />
                <span>Open Smart TV ACR & IoT Subnet Quarantine</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

          {/* Module 14: Ad ID & Geolocation Scrubber */}
          {isLocationModule && onOpenLocationScrubber && (
            <div className="mt-3">
              <button
                onClick={onOpenLocationScrubber}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF7A18]/20 via-[#00D4FF]/20 to-[#FF2E9F]/20 hover:from-[#FF7A18]/30 hover:to-[#00D4FF]/30 border border-[#FF7A18]/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <MapPin className="w-4 h-4 text-[#FF7A18] animate-pulse" />
                <span>Open Ad ID & Geolocation Scrubber</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

          {/* Module 15: Darknet Stealer Log Scanner */}
          {isStealerModule && onOpenStealerScanner && (
            <div className="mt-3">
              <button
                onClick={onOpenStealerScanner}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-500/20 via-[#FF2E9F]/20 to-[#00D4FF]/20 hover:from-red-500/30 hover:to-[#00D4FF]/30 border border-red-500/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <Skull className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Open RedLine & Lumma Stealer Scanner</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

          {/* Module 16: Password Hash Strength & Reuse */}
          {isPasswordStrengthModule && onOpenPasswordStrength && (
            <div className="mt-3">
              <button
                onClick={onOpenPasswordStrength}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF7A18]/20 via-[#00D4FF]/20 to-[#FF2E9F]/20 hover:from-[#FF7A18]/30 hover:to-[#00D4FF]/30 border border-[#FF7A18]/50 hover:border-[#00D4FF] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 shadow-md transition"
              >
                <KeyRound className="w-4 h-4 text-[#FF7A18] animate-pulse" />
                <span>Open Password Reuse & Argon2id Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D4FF]" />
              </button>
            </div>
          )}

=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="mt-3 px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-slate-300">
            <Hash className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
            <span className="text-slate-300">SHA-256:</span>
            <span className="truncate text-cyan-300 font-mono" title={vector.sha256Hash}>
              {vector.sha256Hash.substring(0, 18)}...
            </span>
          </div>

          <div className="mt-2 text-[10px] text-slate-300 flex items-center justify-between font-mono">
            <span>Inspiration: {vector.sourceInspiration}</span>
            <span>Scanned: {vector.lastScanned}</span>
          </div>
        </div>

        {/* Footer Actions: NUKED vs KNOXED & Ask AI */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* NUKE Button */}
            <button
              onClick={() => onNuke(vector.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all ${
                vector.status === 'NUKED'
                  ? 'bg-[#FF2E9F] text-white shadow-[0_0_12px_rgba(255,46,159,0.5)]'
                  : 'bg-[#FF2E9F]/15 hover:bg-[#FF2E9F]/30 text-[#FF2E9F] border border-[#FF2E9F]/40 hover:border-[#FF2E9F]'
              }`}
              title="Issue DSAR purge or scrub public record"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{vector.status === 'NUKED' ? 'NUKED ✓' : 'NUKE'}</span>
            </button>

            {/* KNOX Button */}
            <button
              onClick={() => onKnox(vector.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all ${
                vector.status === 'KNOXED'
                  ? 'bg-[#00D4FF] text-[#0B1020] shadow-[0_0_12px_rgba(0,212,255,0.5)] font-extrabold'
                  : 'bg-[#00D4FF]/15 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/40 hover:border-[#00D4FF]'
              }`}
              title="Encrypt with Web Crypto AES-GCM and bind to passkey"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{vector.status === 'KNOXED' ? 'KNOXED ✓' : 'KNOX'}</span>
            </button>
          </div>

          {/* Consult Architect AI Button */}
          <button
            onClick={() => onConsultAI(vector)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#111A33] hover:bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200 hover:text-[#00D4FF] transition"
          >
            <Sparkles className="w-3 h-3 text-[#FF2E9F]" />
            <span>Consult Architect AI on this vector</span>
          </button>
        </div>
      </div>
    </div>
  );
};
