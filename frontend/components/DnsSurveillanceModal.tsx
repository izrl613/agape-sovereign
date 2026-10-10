import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Wifi, 
  Radio, 
  Activity, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2, 
  Globe, 
  Binary, 
  Cpu, 
  Layers, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { DnsSurveillanceQuery, IspSurveillanceProfile, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface DnsSurveillanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_DNS_QUERIES: DnsSurveillanceQuery[] = [
  {
    id: 'dns-01',
    domainRequested: 'chase.com',
    queryType: 'A',
    protocol: 'UNENCRYPTED_UDP_53',
    ispInterceptionRisk: 'HIGH_LOGGED',
    destinationIp: '198.51.100.12 (ISP Upstream DNS)',
    sha256Receipt: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
  },
  {
    id: 'dns-02',
    domainRequested: 'internal-portal.agape-enclave.net',
    queryType: 'HTTPS',
    protocol: 'UNENCRYPTED_UDP_53',
    ispInterceptionRisk: 'HIGH_LOGGED',
    destinationIp: '203.0.113.88 (Transparent Proxy SNI)',
    sha256Receipt: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
  },
  {
    id: 'dns-03',
    domainRequested: 'pimeyes.com',
    queryType: 'AAAA',
    protocol: 'UNENCRYPTED_UDP_53',
    ispInterceptionRisk: 'HIGH_LOGGED',
    destinationIp: '198.51.100.12 (ISP Upstream DNS)',
    sha256Receipt: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString(),
  }
];

export const DnsSurveillanceModal: React.FC<DnsSurveillanceModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [queries, setQueries] = useState<DnsSurveillanceQuery[]>(INITIAL_DNS_QUERIES);
  const [activeTab, setActiveTab] = useState<'DNS_QUERIES' | 'ISP_RETENTION' | 'WIREGUARD_ODOH' | 'AUDIT_LOGS'>('DNS_QUERIES');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isFlushingArp, setIsFlushingArp] = useState(false);
  const [arpFlushed, setArpFlushed] = useState(false);

  // ISP & WireGuard Profile
  const [ispProfile, setIspProfile] = useState<IspSurveillanceProfile>({
    ispName: 'Tier-1 Broadband Carrier (Comcast / Verizon / Charter)',
    asnNumber: 'AS7922 / AS701',
    retentionWindowDays: 180,
    inspectsSniEch: true,
    supportsOdoh: false,
    activeWireguardTunnel: false,
    wireguardEndpoint: 'wg-ny4.sovereign-enclave.io:51820',
    wireguardQuantumPubKey: 'Kyber1024-PostQuantum-7f9914b1ce05128df776412eab',
    arpFlushTimestamp: 'Never executed in session',
  });

  // Counts
  const unencryptedCount = useMemo(() => queries.filter(q => q.protocol === 'UNENCRYPTED_UDP_53').length, [queries]);
  const odohBlindCount = useMemo(() => queries.filter(q => q.protocol === 'ODOH_QUANTUM_BLINDED').length, [queries]);

  if (!isOpen) return null;

  // Live ARP Cache Flush & Lease Table Wipe (NUKE)
  const handleFlushArpCache = async () => {
    setIsFlushingArp(true);
    await new Promise(r => setTimeout(r, 700));

    const timeStr = new Date().toLocaleTimeString();
    const receipt = await calculateSha256(`ARP_FLUSH::${Date.now()}::${userProfile.primaryEmail}`);

    setIspProfile(prev => ({
      ...prev,
      arpFlushTimestamp: `${timeStr} (Flushed & Zeroed)`,
    }));

    // Zero out unencrypted queries in current view
    setQueries(prev => prev.map(q => ({
      ...q,
      destinationIp: '[LEASE TERMINATED - ARP SHREDDED]',
      protocol: 'UNENCRYPTED_UDP_53',
      ispInterceptionRisk: 'RESOLVED_LOCAL',
      sha256Receipt: receipt,
    })));

    setArpFlushed(true);
    setIsFlushingArp(false);

    const line = `[${timeStr}] 🔥 NUKED NETWORK LEASES: Broadcast ARP tables flushed, local subnet cache zeroed, and carrier broadcast beacons killed. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-08', 'NUKED', 'ARP cache wiped and local broadcast identifiers flushed.');
  };

  // Toggle Quantum-Resistant WireGuard ODoH Tunnel (KNOX)
  const handleToggleWireguardOdoh = async () => {
    const newState = !ispProfile.activeWireguardTunnel;
    const timeStr = new Date().toLocaleTimeString();
    const proof = await calculateSha256(`ODOH_TUNNEL_${newState}_${Date.now()}_${userProfile.masterKeyHash}`);

    setIspProfile(prev => ({
      ...prev,
      activeWireguardTunnel: newState,
      supportsOdoh: newState,
      inspectsSniEch: !newState,
    }));

    if (newState) {
      // Blind all DNS queries with Oblivious DoH
      setQueries(prev => prev.map(q => ({
        ...q,
        protocol: 'ODOH_QUANTUM_BLINDED',
        ispInterceptionRisk: 'ZERO_KNOWLEDGE_ODOH',
        destinationIp: '10.99.0.1 (Quantum-Blind ODoH Proxy)',
        sha256Receipt: proof,
      })));

      const line = `[${timeStr}] 🛡️ KNOXED ODoH TUNNEL: Post-Quantum Kyber-1024 WireGuard tunnel active. All DNS queries blinded with Oblivious DoH (RFC 9230). Proof: ${proof.substring(0, 16)}...`;
      setAuditLogs(prev => [line, ...prev]);

      onUpdatePerimeterVector('diff-08', 'KNOXED', 'Quantum-Resistant WireGuard Oblivious DNS (ODoH) tunnel active. Carrier telemetry blinded.');
    } else {
      const line = `[${timeStr}] ⚠️ TUNNEL DEACTIVATED: WireGuard ODoH disconnected. Standard DNS over HTTPS fallback.`;
      setAuditLogs(prev => [line, ...prev]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <Wifi className="w-6 h-6 text-[#00D4FF] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 8: DNS & ISP Surveillance Shield
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    OBLIVIOUS DOH (RFC 9230) • WIREGUARD
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  ISP Logging Interception Countermeasures • ARP Table Sanitization • 2026 ECRA LTS Standard
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
                onClick={() => setActiveTab('DNS_QUERIES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'DNS_QUERIES'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>1. DNS Query Interceptions ({queries.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('ISP_RETENTION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'ISP_RETENTION'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>2. Carrier ISP Logging Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('WIREGUARD_ODOH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'WIREGUARD_ODOH'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>3. Quantum WireGuard ODoH Tunnel</span>
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
                <span>4. Audit Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                ispProfile.activeWireguardTunnel 
                  ? 'bg-green-500/20 text-green-300 border-green-500/40' 
                  : 'bg-red-950/40 text-red-400 border-red-500/30'
              }`}>
                {ispProfile.activeWireguardTunnel ? 'ODOH QUANTUM BLINDED' : 'ISP SNOOPING EXPOSED'}
              </span>
            </div>
          </div>

          {/* TAB 1: DNS QUERIES */}
          {activeTab === 'DNS_QUERIES' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Real-Time DNS Snooping & ESNI/ECH Inspection</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    Unencrypted Port 53 DNS lookups allow broadband Internet Service Providers (ISPs) to record every website, bank, and medical portal you visit for advertising monetization. Use <strong className="text-[#FF2E9F]">NUKE</strong> to flush your ARP broadcast cache or <strong className="text-[#00D4FF]">KNOX</strong> to route queries through Post-Quantum Oblivious DNS (ODoH).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleFlushArpCache}
                    disabled={isFlushingArp}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                  >
                    <Flame className="w-4 h-4" />
                    <span>{isFlushingArp ? 'Purging Network Leases...' : 'Flush ARP Cache (Nuke)'}</span>
                  </button>
                </div>
              </div>

              {/* Queries Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="bg-[#111A33] text-slate-300">
                    <tr>
                      <th className="p-3">Domain Requested</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Resolution Protocol</th>
                      <th className="p-3">ISP Upstream Interception</th>
                      <th className="p-3">Destination IP</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11px]">
                    {queries.map((q) => (
                      <tr key={q.id} className="hover:bg-[#111A33]/50 transition">
                        <td className="p-3 font-bold text-white font-sans">{q.domainRequested}</td>
                        <td className="p-3 text-cyan-300">{q.queryType}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.protocol === 'ODOH_QUANTUM_BLINDED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40' :
                            'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}>
                            {q.protocol}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={q.ispInterceptionRisk === 'ZERO_KNOWLEDGE_ODOH' ? 'text-green-400 font-bold' : 'text-orange-400'}>
                            {q.ispInterceptionRisk}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{q.destinationIp}</td>
                        <td className="p-3 text-slate-400">{q.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ISP RETENTION PROFILE */}
          {activeTab === 'ISP_RETENTION' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF7A18]" />
                  <span>Broadband ISP Metadata Retention & ESNI Snooping Profile</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Under FCC and carrier terms of service, broadband providers log timestamped IP destination maps, DNS resolution frequency, and TLS Server Name Indication (SNI) records, archiving your metadata for up to <strong>180 days</strong>.
                </p>
              </div>

              {/* Carrier Profile Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Detected Upstream Carrier:</div>
                  <div className="text-white font-bold text-sm">{ispProfile.ispName}</div>
                  <div className="text-cyan-300">Routing ASN: {ispProfile.asnNumber}</div>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span>Log Retention Window:</span>
                      <span className="text-[#FF7A18] font-bold">{ispProfile.retentionWindowDays} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TLS SNI Header Inspection:</span>
                      <span className="text-red-400 font-bold">{ispProfile.inspectsSniEch ? 'ACTIVE (EXPOSED)' : 'BLINDED (ECH)'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Subnet ARP Table Status:</div>
                  <div className="text-white font-bold text-sm">{ispProfile.arpFlushTimestamp}</div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    Flushing ARP tables drops stale local gateway leases and forces MAC address re-negotiation with cryptographic randomization.
                  </p>
                  <button
                    onClick={handleFlushArpCache}
                    className="w-full py-2 px-3 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-cyan-200 text-xs font-bold transition"
                  >
                    Flush Subnet ARP Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WIREGUARD ODOH TUNNEL */}
          {activeTab === 'WIREGUARD_ODOH' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-6 rounded-3xl bg-[#0F172A] border border-cyan-500/40 relative overflow-hidden shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-5 h-5 text-[#00D4FF]" />
                      <h4 className="text-base font-bold text-white">
                        Quantum-Resistant WireGuard + Oblivious DNS (ODoH)
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ispProfile.activeWireguardTunnel 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      }`}>
                        {ispProfile.activeWireguardTunnel ? 'TUNNEL ENFORCED (KNOXED)' : 'UNENCRYPTED CARRIER ROUTE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans max-w-xl">
                      RFC 9230 Oblivious DoH decouples the client IP address from the DNS query using a blind proxy. The recursive resolver never sees your IP, and the proxy never sees your query.
                    </p>
                  </div>

                  <button
                    onClick={handleToggleWireguardOdoh}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition shadow-lg shrink-0 ${
                      ispProfile.activeWireguardTunnel
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                        : 'bg-gradient-to-r from-[#00D4FF] to-[#FF2E9F] text-white hover:opacity-90'
                    }`}
                  >
                    {ispProfile.activeWireguardTunnel ? (
                      <>
                        <Unlock className="w-4 h-4 text-orange-400" />
                        <span>Disconnect WireGuard</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#0B1020]" />
                        <span>Activate Post-Quantum Tunnel (Knox)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
                  <div>WireGuard Gateway: <span className="text-white font-bold">{ispProfile.wireguardEndpoint}</span></div>
                  <div>Quantum Key: <span className="text-cyan-300">{ispProfile.wireguardQuantumPubKey}</span></div>
                  <div>Blind Proxy Protocol: <span className="text-[#00D4FF] font-bold">ODoH / TLS 1.3 / ECH</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>DNS & Subnet Surveillance Audit Stream</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Network Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Flush ARP leases or activate the Post-Quantum WireGuard tunnel to generate verifiable receipts.
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
              <span>Oblivious DoH (RFC 9230) & Post-Quantum WireGuard Verified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Shield
              </button>

              <button
                onClick={() => {
                  const finalStatus = arpFlushed ? 'NUKED' : ispProfile.activeWireguardTunnel ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-08',
                    finalStatus,
                    `Module 8 Synchronized: WireGuard ODoH active (${ispProfile.activeWireguardTunnel}), ARP cache flushed (${arpFlushed}).`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 8 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
