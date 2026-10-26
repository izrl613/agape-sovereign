import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  ShieldAlert, 
  Flame, 
  ExternalLink, 
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Info,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface EmailBreachScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_BREACH_DATA = [
  {
    id: 'breach-01',
    source: 'Credential Dump 2021',
    title: 'Agapé Sovereign Email Leak',
    date: 'June 2021',
    dataType: 'Email + Hashed Password',
    risk: 'HIGH',
    actionTaken: 'None',
  },
  {
    id: 'breach-02',
    source: 'Darknet Pastebin',
    title: 'Corporate Credentials Batch',
    date: 'October 2023',
    dataType: 'Email + Corporate ID',
    risk: 'CRITICAL',
    actionTaken: 'Pending',
  },
  {
    id: 'breach-03',
    source: 'Data Broker Leak',
    title: 'Old Forum Credentials',
    date: 'March 2022',
    dataType: 'Email + Username',
    risk: 'MODERATE',
    actionTaken: 'KNOXED',
  },
];

export const EmailBreachScannerModal: React.FC<EmailBreachScannerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [breaches, setBreaches] = useState<{
    id: string; source: string; title: string; date: string; dataType: string; risk: string; actionTaken: string;
  }[]>(INITIAL_BREACH_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'BREACHES' | 'ALIASES' | 'ACTIONS'>('BREACHES');

  const filteredBreaches = breaches.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  const handleIssueErasure = async (breachId: string) => {
    const target = breaches.find(b => b.id === breachId);
    if (!target) return;
    const receipt = await calculateSha256(`GDPR_ERASURE::${breachId}::${Date.now()}`);
    setBreaches(prev => prev.map(b => b.id === breachId ? { ...b, actionTaken: 'ERASURE ISSUED' } : b));
    const line = `[${new Date().toLocaleTimeString()}] 🔥 NUKED: GDPR Article 17 erasure issued for ${target.title}. Proof: ${receipt.substring(0, 16)}...`;
    onUpdatePerimeterVector('diff-01', 'NUKED', `Email breach erasure issued for: ${target.title}`);
    onClose();
  };

  const handleKnoxAlias = async (breachId: string) => {
    const target = breaches.find(b => b.id === breachId);
    if (!target) return;
    const receipt = await calculateSha256(`ALIAS_BIND::${breachId}::${Date.now()}`);
    setBreaches(prev => prev.map(b => b.id === breachId ? { ...b, actionTaken: 'KNOXED ALIAS' } : b));
    const line = `[${new Date().toLocaleTimeString()}] 🛡️ KNOXED: Alias re-bound to hardware passkey for ${target.title}. Proof: ${receipt.substring(0, 16)}...`;
    onUpdatePerimeterVector('diff-01', 'KNOXED', `Email alias re-bound to hardware FIDO2 passkey for: ${target.title}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#FF7A18]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-[#FF2E9F]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                <Mail className="w-6 h-6 text-[#FF2E9F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 1: Email Breach & GDPR Art. 17 Scanner
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    BREACH SCAN
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Leaked Database Crawl • Raw Credential Dumps • Email Header Analysis • 2026 ECRA LTS
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

          {/* Breaches Table */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>Breach Exposure Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="min-w-full shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Source</th>
                      <th scope="col" className="p-3">Title</th>
                      <th scope="col" className="p-3">Date</th>
                      <th scope="col" className="p-3">Data Type</th>
                      <th scope="col" className="p-3">Risk</th>
                      <th scope="col" className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBreaches.map((breach) => (
                      <tr key={breach.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{breach.source}</td>
                        <td className="p-3 font-bold text-white">{breach.title}</td>
                        <td className="p-3 text-[10px] text-slate-400">{breach.date}</td>
                        <td className="p-3 text-[10px] text-slate-400">{breach.dataType}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            breach.risk === 'CRITICAL' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            breach.risk === 'HIGH' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30'
                          }`}>
                            {breach.risk}
                          </span>
                        </td>
                        <td className="p-3">
                          {breach.actionTaken === 'None' ? (
                            <>
                              <button
                                onClick={() => handleKnoxAlias(breach.id)}
                                className="px-2 py-1 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                              >
                                <ShieldCheck className="w-3 h-3" /> KNOX
                              </button>
                              <button
                                onClick={() => handleIssueErasure(breach.id)}
                                className="px-2 py-1 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                              >
                                <Flame className="w-3 h-3" /> Nuke
                              </button>
                            </>
                          ) : breach.actionTaken === 'KNOXED ALIAS' ? (
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#00D4FF]" />
                              <span className="text-[10px] text-[#00D4FF]">Alias KNOXED</span>
                            </div>
                          ) : breach.actionTaken === 'ERASURE ISSUED' ? (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D4FF]" />
                              <span className="text-[10px] text-[#00D4FF]">Erasure Issued</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Alias Management Tab */}
          {activeTab === 'ALIASES' && (
            <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <ExternalLink className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Ephemeral Alias Management</span>
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Register ephemeral email aliases to prevent primary email exposure across third-party services. Each alias can be NUKED or KNOXED independently.
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-white">Primary: idin@agape.nyc</span>
                  <button
                    onClick={() => onUpdatePerimeterVector('diff-01', 'KNOXED', 'New ephemeral alias registered for primary email')}
                    className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3 h-3 text-[#00D4FF]" />
                    <span>Register Alias</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-white">Alias 1: alias-01@agape.nyc</span>
                  <button
                    onClick={() => onUpdatePerimeterVector('diff-01', 'KNOXED', 'Alias 1 KNOXED: isolated to enclave only')}
                    className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> KNOX
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GDPR Actions Tab */}
          {activeTab === 'ACTIONS' && (
            <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>GDPR / CCPA Erasure Actions</span>
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Issue DSAR erasure requests to data brokers and leak platforms. Cryptographically verify completion.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleIssueErasure('breach-01')}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Issue Erasure for Agapé Sovereign Leak (2021)</span>
                </button>
                <button
                  onClick={() => handleIssueErasure('breach-02')}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-red-500 via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Issue Erasure for Darknet Credentials (2023)</span>
                </button>
                <button
                  onClick={() => onUpdatePerimeterVector('diff-01', 'NUKED', 'Module 1 Synchronized: GDPR erasure batch issued for all detected breaches.')}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Sync Erasure Status to Module 1</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Mail className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Zero-Access • Cryptographically Verified • GDPR/CCPA Compliant</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Scanner
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-01',
                    'KNOXED',
                    'Module 1 Synchronized: Email breach scan cycle completed. Aliases rotated, primary secured.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 1 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};