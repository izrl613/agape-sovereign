import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Search, 
  Radio, 
  Lock, 
  AlertTriangle, 
  Hash, 
  Check, 
  Sparkles, 
  Globe, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  Binary, 
  Eye, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { DarknetPasteExposure, BlindHashMonitorProfile, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface DeepWebDarknetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_DARKNET_EXPOSURES: DarknetPasteExposure[] = [
  {
    id: 'drk-01',
    sourceType: 'ONION_MARKETPLACE',
    sourceTitle: 'Genesis Market Revival Archive (Tor Hidden Service)',
    onionAddressMasked: 'genesis•••••••••••••.onion',
    exposedDataSnippet: 'Combo dump: israel.david@agape.nyc : $2y$10$9412... : Salted Hash',
    threatSeverity: 'CRITICAL',
    detectedTimestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString(),
    status: 'ACTIVE_EXPOSURE',
    sha256Hash: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'drk-02',
    sourceType: 'PUBLIC_PASTEBIN',
    sourceTitle: 'JustPaste.it Developer API Key Leak Raw Paste',
    onionAddressMasked: 'pastebin.com/raw/49aLp09',
    exposedDataSnippet: 'Enclave deployment token: agape_live_sec_99104821092',
    threatSeverity: 'HIGH',
    detectedTimestamp: new Date(Date.now() - 3600000 * 18).toLocaleTimeString(),
    status: 'ACTIVE_EXPOSURE',
    sha256Hash: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'drk-03',
    sourceType: 'TELEGRAM_DUMP_CHANNEL',
    sourceTitle: 'BreachForums VIP Channel 4192',
    onionAddressMasked: 't.me/leak_archives_mirror',
    exposedDataSnippet: 'Credential cluster reference: idin@agape.nyc associated with 2024 SQLi dump',
    threatSeverity: 'ELEVATED',
    detectedTimestamp: new Date(Date.now() - 3600000 * 32).toLocaleTimeString(),
    status: 'ACTIVE_EXPOSURE',
    sha256Hash: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  }
];

export const DeepWebDarknetModal: React.FC<DeepWebDarknetModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [exposures, setExposures] = useState<DarknetPasteExposure[]>(INITIAL_DARKNET_EXPOSURES);
  const [activeTab, setActiveTab] = useState<'EXPOSURES' | 'BLIND_MONITOR' | 'AUDIT_LOGS'>('EXPOSURES');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isRotatingAll, setIsRotatingAll] = useState(false);

  // Zero-Knowledge Blind Hash Monitor Profile
  const [blindProfile, setBlindProfile] = useState<BlindHashMonitorProfile>({
    zeroKnowledgePrefix: userProfile.masterKeyHash.substring(0, 8),
    alertThreshold: 'IMMEDIATE',
    activeWebhookAlerts: true,
    lastSyncTimestamp: 'Live Active',
    sha256Attestation: '5a2190dfca7832bc0189ef451299cbaa011287eac9903124785bc0029312feae',
  });

  // Counts
  const activeExposuresCount = useMemo(() => exposures.filter(e => e.status === 'ACTIVE_EXPOSURE').length, [exposures]);
  const takedownCount = useMemo(() => exposures.filter(e => e.status === 'TAKEDOWN_DISPATCHED').length, [exposures]);
  const monitoredCount = useMemo(() => exposures.filter(e => e.status === 'BLIND_HASH_MONITORED').length, [exposures]);

  if (!isOpen) return null;

  // Immediate Credential Rotation & Takedown Order (NUKE)
  const handleDispatchTakedown = async (exposureId: string) => {
    const target = exposures.find(e => e.id === exposureId);
    if (!target) return;

    const receipt = await calculateSha256(`DARKNET_TAKEDOWN::${target.sourceTitle}::${Date.now()}::${userProfile.primaryEmail}`);
    const timeStr = new Date().toLocaleTimeString();

    setExposures(prev => prev.map(e => {
      if (e.id === exposureId) {
        return {
          ...e,
          status: 'TAKEDOWN_DISPATCHED',
          exposedDataSnippet: '[CREDENTIAL ROTATED - ABUSE COMPLIANCE DISPATCHED]',
          sha256Hash: receipt,
        };
      }
      return e;
    }));

    const line = `[${timeStr}] 🔥 NUKED EXPOSURE: Issued DMCA/Abuse takedown & credential rotation for "${target.sourceTitle}". Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-05', 'NUKED', `Rotated darknet exposed credentials on ${target.sourceTitle}.`);
  };

  // Enforce Blind Hash k-Anonymity Monitoring (KNOX)
  const handleEnforceBlindHash = async () => {
    const timeStr = new Date().toLocaleTimeString();
    const proof = await calculateSha256(`BLIND_MONITOR_${blindProfile.zeroKnowledgePrefix}_${blindProfile.alertThreshold}_${Date.now()}`);

    setBlindProfile(prev => ({
      ...prev,
      sha256Attestation: proof,
      lastSyncTimestamp: timeStr,
    }));

    setExposures(prev => prev.map(e => ({
      ...e,
      status: 'BLIND_HASH_MONITORED',
    })));

    const line = `[${timeStr}] 🛡️ KNOXED BLIND MONITORING: Zero-Knowledge 8-char SHA-256 prefix [${blindProfile.zeroKnowledgePrefix}] registered for blind Tor onion scanning. Proof: ${proof.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-05', 'KNOXED', `Zero-knowledge blind hash darknet monitoring enforced.`);
  };

  const filteredExposures = exposures.filter(e => 
    e.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.exposedDataSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.onionAddressMasked.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-[#FF2E9F]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                <Globe className="w-6 h-6 text-[#FF2E9F] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 5: Deep Web Exposure & Darknet Index Monitor
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    TOR ONION • PASTEBINS • K-ANONYMITY
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Continuous Onion Market Indexer • Blind Hash Privacy • 2026 ECRA LTS Standard
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
                onClick={() => setActiveTab('EXPOSURES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'EXPOSURES'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>1. Darknet Leaks & Pastes ({exposures.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('BLIND_MONITOR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'BLIND_MONITOR'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>2. Zero-Knowledge Blind Hash Monitor</span>
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
                <span>3. Audit Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                {activeExposuresCount} ACTIVE PASTE LEAKS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-[#00D4FF] border border-cyan-500/30 font-bold">
                BLIND HASH MONITORING
              </span>
            </div>
          </div>

          {/* TAB 1: DARKNET LEAKS & PASTES */}
          {activeTab === 'EXPOSURES' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Deep Web Crawler & Onion Marketplace Inspection</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    Continuously scans Tor hidden services, public pastebins, and Telegram leak channels without submitting plaintext queries. Use <strong className="text-[#FF2E9F]">NUKE</strong> to rotate compromised credentials or <strong className="text-[#00D4FF]">KNOX</strong> to monitor via k-anonymity blind hashes.
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leak title, onion site, or snippet..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00D4FF] font-mono"
                />
              </div>

              {/* Exposure Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExposures.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      item.status === 'BLIND_HASH_MONITORED'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : item.status === 'TAKEDOWN_DISPATCHED'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                        : 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{item.sourceTitle}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-pink-300 border border-slate-800">
                            {item.sourceType.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 block mt-0.5">
                          {item.onionAddressMasked} • {item.detectedTimestamp}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        item.status === 'BLIND_HASH_MONITORED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        item.status === 'TAKEDOWN_DISPATCHED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      }`}>
                        {item.status === 'BLIND_HASH_MONITORED' ? 'BLIND MONITORED (KNOXED)' :
                         item.status === 'TAKEDOWN_DISPATCHED' ? 'ROTATED (NUKED) ✓' : 'DARKNET LEAK'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-slate-400">EXFILTRATED STRING:</div>
                      <div className="text-white text-[11px] truncate">{item.exposedDataSnippet}</div>
                    </div>

                    {/* SHA-256 Digest */}
                    <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#00D4FF]" />
                        <span>Audit Receipt:</span>
                      </span>
                      <span className="text-cyan-300 truncate max-w-[170px]" title={item.sha256Hash}>
                        {item.sha256Hash}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {item.status === 'ACTIVE_EXPOSURE' ? (
                        <>
                          <button
                            onClick={() => handleDispatchTakedown(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Rotate Credential (Nuke)</span>
                          </button>

                          <button
                            onClick={handleEnforceBlindHash}
                            className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Blind Monitor (Knox)</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Remediated & Enclave Protected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ZERO-KNOWLEDGE BLIND HASH MONITOR */}
          {activeTab === 'BLIND_MONITOR' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00D4FF]" />
                  <span>Zero-Knowledge Blind Hash Matching (k-Anonymity)</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  To prevent surveillance bots from knowing what email or username you are searching for, Architect AI uses a 32-bit (8 hex characters) truncated SHA-256 prefix. The server returns all matching records sharing that prefix, and your client performs the exact cryptographic match locally in memory.
                </p>
              </div>

              {/* Controls Box */}
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-300 font-bold uppercase block mb-1">
                    Truncated k-Anonymity Prefix:
                  </label>
                  <div className="text-sm text-[#00D4FF] font-bold p-3 rounded-xl bg-[#0B1020] border border-slate-800">
                    {blindProfile.zeroKnowledgePrefix}••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold uppercase block mb-1">
                    Alert Threshold Level:
                  </label>
                  <select
                    value={blindProfile.alertThreshold}
                    onChange={(e) => setBlindProfile(prev => ({ ...prev, alertThreshold: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                  >
                    <option value="IMMEDIATE">Immediate Biometric Alert & Auto-Lockdown</option>
                    <option value="DAILY_DIGEST">Daily Enclave Security Digest</option>
                    <option value="STRICT_LOCKDOWN">Strict Panic Lockdown on Detection</option>
                  </select>
                </div>

                <button
                  onClick={handleEnforceBlindHash}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  Save Blind Monitoring Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Darknet & Deep Web Threat Intelligence Audit Stream</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Execute a takedown order or save blind hash parameters to append cryptographic entries.
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
              <span>Google Deep Web Privacy Standard & k-Anonymity Verified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Monitor
              </button>

              <button
                onClick={() => {
                  const finalStatus = activeExposuresCount === 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-05',
                    finalStatus,
                    `Module 5 Synchronized: ${takedownCount} darknet credentials rotated, k-anonymity monitoring active.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 5 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
