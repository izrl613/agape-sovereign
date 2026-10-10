import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Smartphone, 
  RefreshCw, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2, 
  Fingerprint, 
  ShieldAlert, 
  Search,
  Globe,
  Sliders
} from 'lucide-react';
import { PasskeyVaultEntry, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface PasskeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_PASSKEY_ENTRIES: PasskeyVaultEntry[] = [
  {
    id: 'pkv-01',
    serviceName: 'Primary Bank Online Banking',
    domain: 'secure.chase.com',
    relyingPartyId: 'chase.com',
    credentialType: 'SMS_2FA_FALLBACK',
    fallbackSmsNumber: '+1 (•••) •••-4912',
    hasPhishableSmsFallback: true,
    status: 'SMS_EXPOSED',
    sha256Receipt: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
    lastAuthenticated: 'Yesterday at 4:18 PM',
  },
  {
    id: 'pkv-02',
    serviceName: 'Google Cloud Platform Enclave',
    domain: 'accounts.google.com',
    relyingPartyId: 'google.com',
    credentialType: 'PASSKEY_RESIDENT',
    fallbackSmsNumber: '+1 (•••) •••-4912',
    hasPhishableSmsFallback: true,
    status: 'SMS_EXPOSED',
    sha256Receipt: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
    lastAuthenticated: 'Today at 10:45 AM',
  },
  {
    id: 'pkv-03',
    serviceName: 'GitHub Enterprise Organization',
    domain: 'github.com',
    relyingPartyId: 'github.com',
    credentialType: 'FIDO2_HARDWARE',
    hasPhishableSmsFallback: false,
    status: 'PASSKEY_ENFORCED_KNOXED',
    sha256Receipt: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
    lastAuthenticated: '3 hours ago',
  },
  {
    id: 'pkv-04',
    serviceName: 'Apple iCloud Security Enclave',
    domain: 'appleid.apple.com',
    relyingPartyId: 'apple.com',
    credentialType: 'FIDO2_HARDWARE',
    hasPhishableSmsFallback: false,
    status: 'PASSKEY_ENFORCED_KNOXED',
    sha256Receipt: '5a2190dfca7832bc0189ef451299cbaa011287eac9903124785bc0029312feae',
    lastAuthenticated: '5 days ago',
  }
];

export const PasskeyVaultModal: React.FC<PasskeyVaultModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [entries, setEntries] = useState<PasskeyVaultEntry[]>(INITIAL_PASSKEY_ENTRIES);
  const [activeTab, setActiveTab] = useState<'VAULT_CREDENTIALS' | 'SMS_CLEANUP' | 'AUDIT_LOGS'>('VAULT_CREDENTIALS');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeprecatingAllSms, setIsDeprecatingAllSms] = useState(false);

  // Counts
  const smsExposedCount = useMemo(() => entries.filter(e => e.hasPhishableSmsFallback && e.status === 'SMS_EXPOSED').length, [entries]);
  const passkeyEnforcedCount = useMemo(() => entries.filter(e => e.status === 'PASSKEY_ENFORCED_KNOXED').length, [entries]);
  const smsRevokedCount = useMemo(() => entries.filter(e => e.status === 'SMS_REVOKED_NUKED').length, [entries]);

  if (!isOpen) return null;

  // Revoke SMS 2FA Fallback (NUKE)
  const handleRevokeSmsFallback = async (entryId: string) => {
    const target = entries.find(e => e.id === entryId);
    if (!target) return;

    const receipt = await calculateSha256(`SMS_2FA_REVOKED::${target.relyingPartyId}::${Date.now()}::${userProfile.primaryEmail}`);
    const timeStr = new Date().toLocaleTimeString();

    setEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        return {
          ...e,
          hasPhishableSmsFallback: false,
          fallbackSmsNumber: undefined,
          status: 'SMS_REVOKED_NUKED',
          sha256Receipt: receipt,
        };
      }
      return e;
    }));

    const line = `[${timeStr}] 🔥 NUKED SMS 2FA: Severed SIM-swap phishable mobile fallback from "${target.serviceName}". Only FIDO2 passkeys permitted. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-07', 'NUKED', `Phishable SMS 2FA fallback revoked on ${target.serviceName}.`);
  };

  // Enforce Hardware Passkey Only Login (KNOX)
  const handleEnforcePasskeyOnly = async (entryId: string) => {
    const target = entries.find(e => e.id === entryId);
    if (!target) return;

    const receipt = await calculateSha256(`PASSKEY_ONLY_ENFORCED::${target.relyingPartyId}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    setEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        return {
          ...e,
          hasPhishableSmsFallback: false,
          credentialType: 'FIDO2_HARDWARE',
          status: 'PASSKEY_ENFORCED_KNOXED',
          sha256Receipt: receipt,
        };
      }
      return e;
    }));

    const line = `[${timeStr}] 🛡️ KNOXED FIDO2: Enforced biometric hardware passkey exclusivity for "${target.serviceName}" (RP: ${target.relyingPartyId}). Passwords barred. Proof: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-07', 'KNOXED', `Hardware FIDO2 passkey exclusivity enforced on ${target.serviceName}.`);
  };

  // Batch Deprecate All SMS Fallback Numbers
  const handleBatchDeprecateAllSms = async () => {
    setIsDeprecatingAllSms(true);
    const exposed = entries.filter(e => e.hasPhishableSmsFallback && e.status === 'SMS_EXPOSED');

    for (const item of exposed) {
      await new Promise(r => setTimeout(r, 280));
      await handleRevokeSmsFallback(item.id);
    }

    setIsDeprecatingAllSms(false);
    onUpdatePerimeterVector('diff-07', 'NUKED', `All phishable SMS 2FA recovery channels severed across ${exposed.length} linked accounts.`);
  };

  const filteredEntries = entries.filter(e => 
    e.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.relyingPartyId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <Fingerprint className="w-6 h-6 text-[#00D4FF] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 7: Universal Passkey & FIDO2 WebAuthn Vault
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    FIDO2 • ZERO-SMS-FALLBACK • 2026 ECRA
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Biometric Credential Matrix • SIM-Swap Vulnerability Elimination • Hardware Isolation
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

          {/* Navigation Bar */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('VAULT_CREDENTIALS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'VAULT_CREDENTIALS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>1. Enclave Passkey Vault ({entries.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('SMS_CLEANUP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'SMS_CLEANUP'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>2. SMS 2FA Phishing Vulnerabilities</span>
              </button>
              <button
                onClick={() => setActiveTab('AUDIT_LOGS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'AUDIT_LOGS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>3. FIDO2 Audit Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                {smsExposedCount} SMS 2FA FALLBACKS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 font-bold">
                {passkeyEnforcedCount} FIDO2 HARDENED
              </span>
            </div>
          </div>

          {/* TAB 1: VAULT CREDENTIALS */}
          {activeTab === 'VAULT_CREDENTIALS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Eliminate Phishable Passwords & SIM-Swap Fallbacks</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    SMS 2FA can be intercepted via SS7 telecommunication attacks and SIM-swapping. Use <strong className="text-[#FF2E9F]">NUKE</strong> to detach mobile phone recovery numbers or <strong className="text-[#00D4FF]">KNOX</strong> to lock authentication exclusively behind hardware FIDO2 passkeys.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchDeprecateAllSms}
                    disabled={isDeprecatingAllSms || smsExposedCount === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Sever All SMS 2FA Fallbacks ({smsExposedCount})</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search relying party or service..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00D4FF] font-mono"
                />
              </div>

              {/* Passkey Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEntries.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      item.status === 'PASSKEY_ENFORCED_KNOXED'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : item.status === 'SMS_REVOKED_NUKED'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                        : 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{item.serviceName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                            {item.relyingPartyId}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Credential Type: {item.credentialType}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        item.status === 'PASSKEY_ENFORCED_KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        item.status === 'SMS_REVOKED_NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      }`}>
                        {item.status === 'PASSKEY_ENFORCED_KNOXED' ? 'PASSKEY ENFORCED (KNOXED)' :
                         item.status === 'SMS_REVOKED_NUKED' ? 'SMS PURGED (NUKED) ✓' : 'PHISHABLE SMS FALLBACK'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>DOMAIN: {item.domain}</span>
                        <span>{item.lastAuthenticated}</span>
                      </div>
                      {item.fallbackSmsNumber ? (
                        <div className="text-orange-400 font-bold flex items-center gap-1.5 pt-0.5">
                          <Smartphone className="w-3.5 h-3.5 text-[#FF7A18]" />
                          <span>Fallback SMS: {item.fallbackSmsNumber} (Vulnerable to SIM-Swap)</span>
                        </div>
                      ) : (
                        <div className="text-green-400 font-bold flex items-center gap-1.5 pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Zero SMS Fallback • Passkey Exclusivity Active</span>
                        </div>
                      )}
                    </div>

                    {/* SHA-256 Digest */}
                    <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#00D4FF]" />
                        <span>FIDO2 Attestation:</span>
                      </span>
                      <span className="text-cyan-300 truncate max-w-[170px]" title={item.sha256Receipt}>
                        {item.sha256Receipt}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {item.status === 'SMS_EXPOSED' ? (
                        <>
                          <button
                            onClick={() => handleRevokeSmsFallback(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Sever SMS 2FA (Nuke)</span>
                          </button>

                          <button
                            onClick={() => handleEnforcePasskeyOnly(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>Enforce FIDO2 (Knox)</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Hardware Passkey Hardened • Phishing Immune</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SMS CLEANUP OVERVIEW */}
          {activeTab === 'SMS_CLEANUP' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF2E9F]" />
                  <span>SIM-Swapping & SS7 Interception Threat Intelligence</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  SMS 2FA provides a false sense of security. Attackers bribe or trick mobile carriers into routing SMS codes to an attacker-controlled SIM card. By migrating to FIDO2 passkeys, authentication is mathematically tied to the specific browser domain and verified inside your device's physical hardware enclave.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-cyan-300 font-bold uppercase">Passkey Defense Comparison:</div>
                <div className="space-y-2 text-slate-300">
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <span>Man-in-the-Middle (Evilginx / Reverse Proxy)</span>
                    <span className="text-green-400 font-bold">100% BLOCKED (PASSKEY IMMUNE)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <span>Credential Stuffing / Stolen Password Dumps</span>
                    <span className="text-green-400 font-bold">100% BLOCKED (NO SHARED SECRET)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <span>Carrier SIM-Swap & SS7 SMS Interception</span>
                    <span className="text-green-400 font-bold">100% MITIGATED (SMS BARRED)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Universal Passkey & FIDO2 Vault Audit Telemetry</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Sever an SMS fallback channel or enforce FIDO2 passkey exclusivity to append cryptographic audit entries.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5 font-mono text-xs space-y-2.5 shadow-inner">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="text-cyan-300 leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>FIDO Alliance 2026 Passkey Standard & WebAuthn Level 3 Certified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Vault
              </button>

              <button
                onClick={() => {
                  const finalStatus = smsExposedCount === 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-07',
                    finalStatus,
                    `Module 7 Synchronized: ${passkeyEnforcedCount} accounts FIDO2 hardened, ${smsRevokedCount} SMS fallbacks severed.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 7 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
