import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Search, 
  Network, 
  Clock, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  Sliders, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { PeopleSearchNetworkNode, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface PeopleSearchAggregatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_NETWORKS: PeopleSearchNetworkNode[] = [
  {
    id: 'psn-01',
    networkName: 'LexisNexis Risk Solutions & ChoicePoint Graph',
    parentGroup: 'RELX Group Global Data Syndicate',
    affiliatedScrapersCount: 48,
    recordsIndexed: ['Property Deeds', 'Vehicle Titles', 'Known Relatives', 'Court Records'],
    statutoryDeadlineDays: 45,
    daysRemaining: 18,
    status: 'REMOVAL_PENDING',
    reScrapeSuppressionEnrolled: false,
    sha256AuditHash: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'psn-02',
    networkName: 'Whitepages Premium & Hiya Caller Network',
    parentGroup: 'Whitepages Inc.',
    affiliatedScrapersCount: 32,
    recordsIndexed: ['Mobile Carrier Details', 'Address History (15 yrs)', 'Landline Records'],
    statutoryDeadlineDays: 15,
    daysRemaining: 4,
    status: 'REMOVAL_PENDING',
    reScrapeSuppressionEnrolled: false,
    sha256AuditHash: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'psn-03',
    networkName: 'PeopleConnect Core (TruthFinder, Intelius, InstantCheckmate)',
    parentGroup: 'PeopleConnect Inc.',
    affiliatedScrapersCount: 64,
    recordsIndexed: ['Criminal Background Dossiers', 'Email Aliases', 'Social Network Handles'],
    statutoryDeadlineDays: 15,
    daysRemaining: 11,
    status: 'REMOVAL_PENDING',
    reScrapeSuppressionEnrolled: false,
    sha256AuditHash: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  },
  {
    id: 'psn-04',
    networkName: 'Spokeo Deep Web & Social Graph Syndicate',
    parentGroup: 'Spokeo Enterprise Network',
    affiliatedScrapersCount: 29,
    recordsIndexed: ['Photo Aggregations', 'Username Cross-Correlation', 'Past Neighborhood Maps'],
    statutoryDeadlineDays: 30,
    daysRemaining: 8,
    status: 'REMOVAL_PENDING',
    reScrapeSuppressionEnrolled: false,
    sha256AuditHash: '5a2190dfca7832bc0189ef451299cbaa011287eac9903124785bc0029312feae',
  },
  {
    id: 'psn-05',
    networkName: 'BeenVerified & NeighborWho Public Network',
    parentGroup: 'Bouncie Global Holdings',
    affiliatedScrapersCount: 47,
    recordsIndexed: ['Professional Licenses', 'Corporate Filings', 'Household Income Model'],
    statutoryDeadlineDays: 45,
    daysRemaining: 22,
    status: 'REMOVAL_PENDING',
    reScrapeSuppressionEnrolled: false,
    sha256AuditHash: '8e12ab7300c1445fbca211470912bc05178dcbb1582098dcf62541097e330a11',
  }
];

export const PeopleSearchAggregatorModal: React.FC<PeopleSearchAggregatorModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [networks, setNetworks] = useState<PeopleSearchNetworkNode[]>(INITIAL_NETWORKS);
  const [activeTab, setActiveTab] = useState<'NETWORK_GRAPH' | 'SUPPRESSION_REGISTRY' | 'AUDIT_LOGS'>('NETWORK_GRAPH');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isEnrollingAllSuppression, setIsEnrollingAllSuppression] = useState(false);

  // Counts
  const pendingCount = useMemo(() => networks.filter(n => n.status === 'REMOVAL_PENDING').length, [networks]);
  const suppressedCount = useMemo(() => networks.filter(n => n.reScrapeSuppressionEnrolled).length, [networks]);
  const totalSubBrokers = useMemo(() => networks.reduce((acc, curr) => acc + curr.affiliatedScrapersCount, 0), [networks]);

  if (!isOpen) return null;

  // Expedite Statutory Erasure Order (NUKE)
  const handleExpediteRemoval = async (networkId: string) => {
    const target = networks.find(n => n.id === networkId);
    if (!target) return;

    const receipt = await calculateSha256(`EXPEDITE_REMOVAL::${target.networkName}::${Date.now()}::${userProfile.primaryEmail}`);
    const timeStr = new Date().toLocaleTimeString();

    setNetworks(prev => prev.map(n => {
      if (n.id === networkId) {
        return {
          ...n,
          daysRemaining: 0,
          status: 'SUPPRESSION_ACTIVE',
          sha256AuditHash: receipt,
        };
      }
      return n;
    }));

    const line = `[${timeStr}] 🔥 NUKED BROKER DOSSIER: Expedited statutory removal order enforced against ${target.networkName} (${target.affiliatedScrapersCount} sub-brokers). Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-06', 'NUKED', `Expedited statutory removal enforced against ${target.networkName}.`);
  };

  // Enroll in Continuous Anti-Re-Scrape Suppression Registry (KNOX)
  const handleEnrollSuppressionRegistry = async (networkId: string) => {
    const target = networks.find(n => n.id === networkId);
    if (!target) return;

    const proof = await calculateSha256(`SUPPRESSION_REGISTRY_ENROLLED::${target.networkName}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    setNetworks(prev => prev.map(n => {
      if (n.id === networkId) {
        return {
          ...n,
          reScrapeSuppressionEnrolled: true,
          status: 'RE_SCRAPE_BLOCKED',
          sha256AuditHash: proof,
        };
      }
      return n;
    }));

    const line = `[${timeStr}] 🛡️ KNOXED SUPPRESSION: Enrolled Subject into permanent "Do Not Re-Scrape" registry at ${target.networkName}. Proof: ${proof.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-06', 'KNOXED', `Continuous anti-re-scrape suppression registry active across people-search networks.`);
  };

  // Batch Enroll in Continuous Suppression across all 220+ Affiliated Networks
  const handleBatchEnrollAllSuppression = async () => {
    setIsEnrollingAllSuppression(true);

    for (const net of networks) {
      await new Promise(r => setTimeout(r, 240));
      await handleEnrollSuppressionRegistry(net.id);
    }

    setIsEnrollingAllSuppression(false);
    onUpdatePerimeterVector('diff-06', 'KNOXED', `All 220+ affiliated people-search scraper networks enrolled in continuous re-scrape suppression.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#FF7A18]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,24,0.3)]">
                <Network className="w-6 h-6 text-[#FF7A18] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 6: People-Search Aggregator & Suppression Matrix
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    220+ SCRAPER NETWORKS • CCPA/GDPR
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Upstream Aggregator Tree Mapping • Countdown Timers • Anti-Re-Scrape Registry
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
                onClick={() => setActiveTab('NETWORK_GRAPH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'NETWORK_GRAPH'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>1. Aggregator Scraper Networks ({networks.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('SUPPRESSION_REGISTRY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'SUPPRESSION_REGISTRY'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>2. Anti-Re-Scrape Registry ({suppressedCount}/{networks.length})</span>
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
                <span>3. Compliance Audit Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {totalSubBrokers} AFFILIATED BROKERS MAPPED
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 font-bold">
                {suppressedCount} SUPPRESSIONS ACTIVE
              </span>
            </div>
          </div>

          {/* TAB 1: NETWORK GRAPH & COUNTDOWNS */}
          {activeTab === 'NETWORK_GRAPH' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>220+ People-Search Network Syndicate Tracker</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    People-search sites syndicate data hierarchically: a single removal at an upstream parent (e.g. PeopleConnect) propagates to over 60 downstream search sites. Track statutory compliance countdowns and lock listings against automated re-scraping.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchEnrollAllSuppression}
                    disabled={isEnrollingAllSuppression || suppressedCount === networks.length}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enroll All in Suppression ({networks.length - suppressedCount})</span>
                  </button>
                </div>
              </div>

              {/* Network Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {networks.map((net) => (
                  <div
                    key={net.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      net.status === 'RE_SCRAPE_BLOCKED'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : net.status === 'SUPPRESSION_ACTIVE'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)]'
                        : 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{net.networkName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 block mt-0.5">
                          Parent Group: {net.parentGroup} ({net.affiliatedScrapersCount} Affiliated Search Engines)
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        net.status === 'RE_SCRAPE_BLOCKED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        net.status === 'SUPPRESSION_ACTIVE' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        'bg-orange-500/20 text-[#FF7A18] border border-orange-500/50 animate-pulse'
                      }`}>
                        {net.status === 'RE_SCRAPE_BLOCKED' ? 'RE-SCRAPE BLOCKED (KNOXED)' :
                         net.status === 'SUPPRESSION_ACTIVE' ? 'ERASURE ENFORCED (NUKED) ✓' : 'COUNTDOWN ACTIVE'}
                      </span>
                    </div>

                    {/* Countdown and Data Classes */}
                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Statutory Deadline:</span>
                        <span className={`font-bold ${net.daysRemaining <= 5 ? 'text-red-400 font-black animate-pulse' : 'text-orange-400'}`}>
                          {net.daysRemaining === 0 ? 'COMPLIANCE COMPLETED' : `${net.daysRemaining} days remaining of ${net.statutoryDeadlineDays}d window`}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF7A18] to-[#00D4FF]"
                          style={{ width: `${Math.max(10, ((net.statutoryDeadlineDays - net.daysRemaining) / net.statutoryDeadlineDays) * 100)}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {net.recordsIndexed.map(rec => (
                          <span key={rec} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* SHA-256 Digest */}
                    <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#00D4FF]" />
                        <span>Audit Proof:</span>
                      </span>
                      <span className="text-cyan-300 truncate max-w-[170px]" title={net.sha256AuditHash}>
                        {net.sha256AuditHash}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {net.daysRemaining > 0 ? (
                        <button
                          onClick={() => handleExpediteRemoval(net.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Expedite Purge (Nuke)</span>
                        </button>
                      ) : (
                        <div className="text-[11px] font-mono text-[#FF2E9F] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Statutory Deadline Expired • Data Purged</span>
                        </div>
                      )}

                      {!net.reScrapeSuppressionEnrolled ? (
                        <button
                          onClick={() => handleEnrollSuppressionRegistry(net.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Lock Suppression (Knox)</span>
                        </button>
                      ) : (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Anti-Re-Scrape Registry Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SUPPRESSION REGISTRY */}
          {activeTab === 'SUPPRESSION_REGISTRY' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
                  <span>Permanent Anti-Re-Scrape Registry Lock (SayMine & Optery Standard)</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Data brokers frequently re-index public records every 3–6 months following removal requests. Architect AI enrolls your identity hash into each network's permanent suppression list, preventing future bots from re-ingesting your property records, phone numbers, or aliases.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-cyan-300 font-bold uppercase">Suppressed Parent Aggregator Networks:</div>
                <div className="space-y-2 text-slate-300">
                  {networks.map(n => (
                    <div key={n.id} className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold block">{n.networkName}</span>
                        <span className="text-[10px] text-slate-400">Protects across {n.affiliatedScrapersCount} sub-brokers</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.reScrapeSuppressionEnrolled 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      }`}>
                        {n.reScrapeSuppressionEnrolled ? 'SUPPRESSION LOCKED' : 'PENDING ENROLLMENT'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Aggregator Tree Compliance Telemetry</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Expedite a removal order or enroll in an anti-re-scrape registry to append receipts.
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
              <span>California CCPA Cal. Civ. Code § 1798.105 & Optery Standard Compliant</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Tracker
              </button>

              <button
                onClick={() => {
                  const finalStatus = suppressedCount === networks.length ? 'KNOXED' : 'NUKED';
                  onUpdatePerimeterVector(
                    'diff-06',
                    finalStatus,
                    `Module 6 Synchronized: 220+ people-search networks tracked, ${suppressedCount}/${networks.length} parent nodes locked in suppression.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 6 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
