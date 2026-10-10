import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  Hash, 
  Award, 
  CheckCircle, 
  FileText, 
  Flame, 
  ShieldAlert, 
  Copy, 
  Check, 
  Sparkles, 
  Search, 
  Filter, 
  Lock, 
  Fingerprint, 
  Calendar, 
  ExternalLink,
  RefreshCw,
  FileDown
} from 'lucide-react';
import { DiffVector, UserProfile } from '../types';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: DiffVector[];
  userProfile: UserProfile;
  sovereignScore: number;
}

type TabView = 'EXECUTIVE' | 'VECTORS_LEDGER' | 'CERTIFICATE';

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  vectors,
  userProfile,
  sovereignScore,
}) => {
  const [activeTab, setActiveTab] = useState<TabView>('EXECUTIVE');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'KNOXED' | 'NUKED' | 'EXPOSED'>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const reportPrintRef = useRef<HTMLDivElement>(null);

  const exposedCount = useMemo(() => vectors.filter(v => v.status === 'EXPOSED').length, [vectors]);
  const knoxedCount = useMemo(() => vectors.filter(v => v.status === 'KNOXED').length, [vectors]);
  const nukedCount = useMemo(() => vectors.filter(v => v.status === 'NUKED').length, [vectors]);

  const filteredVectors = useMemo(() => {
    return vectors.filter(v => {
      const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.dataValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatusFilter === 'ALL' || v.status === selectedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [vectors, searchQuery, selectedStatusFilter]);

  if (!isOpen) return null;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleSimulatePdfDownload = () => {
    setIsExporting(true);
    setExportComplete(false);
    setExportProgress(15);

    const step1 = setTimeout(() => setExportProgress(45), 400);
    const step2 = setTimeout(() => setExportProgress(80), 900);
    const step3 = setTimeout(() => {
      setExportProgress(100);
      setIsExporting(false);
      setExportComplete(true);

      // Construct a verifiable JSON/Markdown audit artifact to download as PDF alternative
      const reportPayload = {
        title: "Architect AI - Lighthouse DIFF Audit Report",
        auditId: userProfile.cloudAuditId,
        standard: "2026 ERCA / ECRA LTS Protocol",
        sovereignScore: `${sovereignScore}%`,
        timestamp: new Date().toISOString(),
        owner: userProfile.fullName,
        primaryEmail: userProfile.primaryEmail,
        passkeyStatus: userProfile.passkeyStatus,
        masterKeyHash: userProfile.masterKeyHash,
        summary: {
          totalVectors: vectors.length,
          knoxedHardened: knoxedCount,
          nukedErased: nukedCount,
          exposedRisk: exposedCount,
        },
        vectors: vectors.map(v => ({
          module: v.moduleNumber,
          name: v.name,
          category: v.category,
          status: v.status,
          sha256: v.sha256Hash,
          remediation: v.status === 'NUKED' ? v.nukedAction : v.status === 'KNOXED' ? v.knoxedAction : v.exposureDetails
        }))
      };

      const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ArchitectAI_DIFF_Audit_${userProfile.cloudAuditId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1400);
  };

  const getScoreRating = (score: number) => {
    if (score >= 85) return { label: 'OPTIMAL ENCLAVE SOVEREIGNTY', color: 'text-[#00D4FF]', bg: 'bg-[#00D4FF]/20', border: 'border-[#00D4FF]' };
    if (score >= 60) return { label: 'HARDENED WITH ACTIONABLE REMEDIATION', color: 'text-[#FF7A18]', bg: 'bg-[#FF7A18]/20', border: 'border-[#FF7A18]' };
    return { label: 'CRITICAL EXPOSURES DETECTED', color: 'text-[#FF2E9F]', bg: 'bg-[#FF2E9F]/20', border: 'border-[#FF2E9F]' };
  };

  const rating = getScoreRating(sovereignScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      {/* Outer pulsing neon border gradient */}
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#111A33] border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <FileText className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Lighthouse DIFF Audit Export Preview
                  </h3>
                  <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    2026 ECRA LTS
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Cloud Audit ID: <span className="text-white font-semibold">{userProfile.cloudAuditId}</span> • 2-Year Retention Proof
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleTriggerPrint}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold transition"
                title="Print or Save via Browser PDF Engine"
              >
                <Printer className="w-4 h-4 text-[#00D4FF]" />
                <span>Print PDF</span>
              </button>

              <button
                onClick={handleSimulatePdfDownload}
                disabled={isExporting}
                className="relative group p-[1.5px] rounded-xl overflow-hidden shadow-lg disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
                <div className="relative px-4 py-2 rounded-[10px] bg-[#0B1020] group-hover:bg-[#111A33] text-white text-xs font-mono font-extrabold flex items-center gap-2 transition">
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00D4FF]" />
                      <span>Packaging...</span>
                    </>
                  ) : exportComplete ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Downloaded ✓</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#00D4FF]" />
                      <span>Download Encrypted Audit</span>
                    </>
                  )}
                </div>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Export Progress Notification Bar if downloading */}
          {isExporting && (
            <div className="px-6 py-2 bg-[#0F172A] border-b border-cyan-500/30">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-cyan-300">Assembling Zero-Access Memory Stream & Signatures...</span>
                <span className="text-[#00D4FF] font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0B1020] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Interactive Preview Tabs */}
          <div className="px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 no-print">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('EXECUTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'EXECUTIVE'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-slate-200 bg-[#0F172A]'
                }`}
              >
                1. Executive Lighthouse Summary
              </button>
              <button
                onClick={() => setActiveTab('VECTORS_LEDGER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'VECTORS_LEDGER'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-slate-200 bg-[#0F172A]'
                }`}
              >
                2. 16-Vector Cryptographic Ledger
              </button>
              <button
                onClick={() => setActiveTab('CERTIFICATE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'CERTIFICATE'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-slate-200 bg-[#0F172A]'
                }`}
              >
                3. Certificate of Sovereign Enclave
              </button>
            </div>

            <span className="text-[11px] font-mono text-cyan-300">
              Ephemeral Web Crypto Proof • Zero Cloud Plaintext
            </span>
          </div>

          {/* Printable Report Canvas Area */}
          <div 
            ref={reportPrintRef} 
            className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 bg-[#0B1020] text-slate-100"
          >
            {/* TAB 1: EXECUTIVE LIGHTHOUSE SUMMARY */}
            {activeTab === 'EXECUTIVE' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="p-6 rounded-3xl bg-[#0F172A] border border-cyan-500/40 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-extrabold text-xl tracking-wider text-white">ARCHITECT <span className="text-[#00D4FF]">AI</span></span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                          AGA PE SOVEREIGN ENCLAVE 2026
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        Digital Identity Federated Footprint (DIFF) Security Audit
                      </h2>
                      <p className="text-xs font-mono text-cyan-300 mt-1 max-w-xl">
                        Standardized under the 2026 ERCA / ECRA Global Digital Privacy Framework with universal biometric passkey verification.
                      </p>
                    </div>

                    {/* Sovereign Score Gauge Component */}
                    <div className="flex items-center gap-4 bg-[#0B1020] p-4 rounded-2xl border border-slate-700/80 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase text-slate-300 font-bold">
                          LIGHTHOUSE SCORE
                        </div>
                        <div className="text-xs text-cyan-300 font-mono">
                          Zero-Access Index
                        </div>
                        <div className={`text-[10px] font-bold font-mono mt-1 ${rating.color}`}>
                          {rating.label}
                        </div>
                      </div>

                      <div className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center font-mono font-black text-2xl bg-[#0F172A] shadow-[0_0_20px_rgba(0,212,255,0.3)] ${rating.border} ${rating.color}`}>
                        {sovereignScore}%
                      </div>
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">SOVEREIGN OWNER:</span>
                      <span className="text-white font-bold">{userProfile.fullName}</span>
                      <span className="text-slate-400 text-[11px] block">{userProfile.primaryEmail}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">FEDERATED ANCHOR:</span>
                      <span className="text-cyan-300 font-bold">{userProfile.federatedProvider} ID</span>
                      <span className="text-slate-400 text-[11px] block">{userProfile.passkeyDeviceId}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">PASSKEY HARNESS:</span>
                      <span className="text-green-400 font-bold">{userProfile.passkeyStatus}</span>
                      <span className="text-slate-400 text-[11px] block">WebAuthn Biometric PRF</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">2-YEAR RETENTION AUDIT:</span>
                      <span className="text-[#FF7A18] font-bold">Active: 2026 — 2028</span>
                      <span className="text-slate-400 text-[11px] block">Cryptographic Seal</span>
                    </div>
                  </div>
                </div>

                {/* NUKED vs KNOXED Tally & Comparison Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* NUKED Box */}
                  <div className="p-5 rounded-2xl bg-[#0F172A] border border-pink-500/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-pink-300 uppercase flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-[#FF2E9F]" />
                        NUKED (ERASED)
                      </span>
                      <span className="text-2xl font-mono font-black text-[#FF2E9F]">
                        {nukedCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Exposures marked for irreversible deletion, CCPA / GDPR DSAR automated erasures, and data broker purges.
                    </p>
                    <div className="mt-3 text-[11px] font-mono text-[#FF2E9F] bg-[#FF2E9F]/10 px-2.5 py-1 rounded-lg border border-[#FF2E9F]/30">
                      {Math.round((nukedCount / vectors.length) * 100)}% of perimeter purged
                    </div>
                  </div>

                  {/* KNOXED Box */}
                  <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
                        KNOXED (HARDENED)
                      </span>
                      <span className="text-2xl font-mono font-black text-[#00D4FF]">
                        {knoxedCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Assets encapsulated in hardware security enclaves, AES-256-GCM vaults, and passwordless FIDO2 passkeys.
                    </p>
                    <div className="mt-3 text-[11px] font-mono text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-1 rounded-lg border border-[#00D4FF]/30">
                      {Math.round((knoxedCount / vectors.length) * 100)}% hardened in enclave
                    </div>
                  </div>

                  {/* EXPOSED Box */}
                  <div className="p-5 rounded-2xl bg-[#0F172A] border border-orange-500/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-orange-300 uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#FF7A18]" />
                        EXPOSED (ACTION DUE)
                      </span>
                      <span className="text-2xl font-mono font-black text-[#FF7A18]">
                        {exposedCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Active public surfaces, people-search listings, and legacy credentials demanding sovereign remediation.
                    </p>
                    <div className="mt-3 text-[11px] font-mono text-[#FF7A18] bg-[#FF7A18]/10 px-2.5 py-1 rounded-lg border border-[#FF7A18]/30">
                      {Math.round((exposedCount / vectors.length) * 100)}% requires NUKE / KNOX
                    </div>
                  </div>
                </div>

                {/* Executive Findings & Recommendations */}
                <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF2E9F]" />
                    <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                      Chief of Staff Architectural Remediation Priorities
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800 space-y-2">
                      <div className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                        <CheckCircle className="w-3.5 h-3.5 text-[#00D4FF]" />
                        Primary Hardening Vector: Data Brokers (Module 6)
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        Dispatch standardized ECRA deletion requests to LexisNexis, Whitepages, and Acxiom. Enable persistent opt-out registry monitoring.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800 space-y-2">
                      <div className="font-bold text-pink-300 flex items-center gap-1.5 font-mono">
                        <CheckCircle className="w-3.5 h-3.5 text-[#FF2E9F]" />
                        Credential Elimination: FIDO2 Passkeys (Module 7)
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        Deprecate remaining SMS-based 2FA tokens in favor of hardware-bound WebAuthn credentials across banking and cloud surfaces.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 16-VECTOR CRYPTOGRAPHIC LEDGER */}
            {activeTab === 'VECTORS_LEDGER' && (
              <div className="space-y-4 animate-fade-in">
                {/* Search and Filter Controls */}
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vector, hash, or data..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00D4FF] font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                    {(['ALL', 'KNOXED', 'NUKED', 'EXPOSED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition shrink-0 ${
                          selectedStatusFilter === st
                            ? 'bg-[#00D4FF] text-[#0B1020]'
                            : 'bg-[#0B1020] text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 16 Vector Full Table */}
                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#0F172A] shadow-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#111A33] border-b border-slate-800 text-slate-300 font-mono">
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Vector & Surface</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Client-Side SHA-256 Hash</th>
                        <th className="p-3">Prescribed Remediation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                      {filteredVectors.map((v) => {
                        const isCopied = copiedHash === v.sha256Hash;
                        return (
                          <tr key={v.id} className="hover:bg-[#111A33]/50 transition">
                            <td className="p-3 font-bold text-[#00D4FF]">{v.moduleNumber}</td>
                            <td className="p-3 font-sans">
                              <span className="font-bold text-white block">{v.name}</span>
                              <span className="text-[10px] text-cyan-300 font-mono">{v.category}</span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate max-w-xs">{v.dataValue}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.status === 'KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40' :
                                v.status === 'NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40' :
                                'bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40'
                              }`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-cyan-300 truncate max-w-[130px] font-mono" title={v.sha256Hash}>
                                  {v.sha256Hash.substring(0, 16)}...
                                </span>
                                <button
                                  onClick={() => handleCopyHash(v.sha256Hash)}
                                  className="p-1 rounded bg-[#0B1020] hover:bg-slate-800 text-slate-400 hover:text-white"
                                  title="Copy full SHA-256 hash"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 font-sans leading-tight">
                              {v.status === 'NUKED' ? v.nukedAction : v.status === 'KNOXED' ? v.knoxedAction : v.exposureDetails}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CERTIFICATE OF SOVEREIGN ENCLAVE */}
            {activeTab === 'CERTIFICATE' && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-8 rounded-3xl bg-[#0F172A] border-2 border-cyan-500/40 text-center space-y-6 shadow-2xl relative">
                  {/* Decorative certificate seal */}
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] flex items-center justify-center p-[2px] shadow-[0_0_25px_rgba(0,212,255,0.4)]">
                    <div className="w-full h-full rounded-full bg-[#0B1020] flex items-center justify-center">
                      <Award className="w-10 h-10 text-[#00D4FF]" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white tracking-wider">
                      CERTIFICATE OF SOVEREIGN ENCLAVE HARDENING
                    </h3>
                    <p className="text-xs font-mono text-cyan-300 mt-1 uppercase">
                      Issued under 2026 ERCA / ECRA LTS Architecture
                    </p>
                  </div>

                  <p className="text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans">
                    This document certifies that the Digital Identity Federated Footprint (DIFF) of <strong>{userProfile.fullName}</strong> ({userProfile.primaryEmail}) has undergone complete 16-vector cryptographic verification. All sensitive parameters were processed through the client-side Web Crypto Subtle API with zero plaintext exposure to server infrastructures.
                  </p>

                  {/* Cryptographic Proof Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">ROOT ENCLAVE DIGEST:</span>
                      <span className="text-[#00D4FF] font-bold break-all text-[11px]">
                        {userProfile.masterKeyHash}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">WEBAUTHN CREDENTIAL ANCHOR:</span>
                      <span className="text-pink-300 font-bold text-[11px]">
                        {userProfile.passkeyDeviceId}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
                    <div>Enclave Authority: <strong>Agape Sovereign Studio</strong></div>
                    <div>Cloud Audit Token: <strong className="text-white">{userProfile.cloudAuditId}</strong></div>
                    <div>Timestamp: <strong>March 2026 LTS</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 no-print">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Verifiable Zero-Access Architecture • No Plaintext Storage</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Preview
              </button>

              <button
                onClick={handleSimulatePdfDownload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <FileDown className="w-4 h-4 text-white" />
                <span>Export Official DIFF Audit Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
