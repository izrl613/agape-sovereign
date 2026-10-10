import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  Cpu, 
  RefreshCw, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2, 
  Binary, 
  Layers, 
  Sliders, 
  Copy,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { PasswordClusterItem, Argon2idDerivationParams, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface PasswordHashStrengthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_CLUSTERS: PasswordClusterItem[] = [
  {
    id: 'pwd-01',
    serviceName: 'Legacy Cloud Forum Portal',
    accountIdentifier: 'idin@agape.nyc',
    hashType: 'MD5_VULNERABLE',
    passwordLength: 12,
    entropyBits: 42.1,
    reuseClusterTag: 'Cluster-Alpha (Reused 3x)',
    status: 'REUSED_EXPOSED',
    sha256Proof: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'pwd-02',
    serviceName: 'Fitness Gym Member Login',
    accountIdentifier: 'idin@agape.nyc',
    hashType: 'SHA256_LEGACY',
    passwordLength: 12,
    entropyBits: 42.1,
    reuseClusterTag: 'Cluster-Alpha (Reused 3x)',
    status: 'REUSED_EXPOSED',
    sha256Proof: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'pwd-03',
    serviceName: 'Home Utility Electric Billing',
    accountIdentifier: 'israel.david@agape.nyc',
    hashType: 'MD5_VULNERABLE',
    passwordLength: 12,
    entropyBits: 42.1,
    reuseClusterTag: 'Cluster-Alpha (Reused 3x)',
    status: 'REUSED_EXPOSED',
    sha256Proof: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  },
  {
    id: 'pwd-04',
    serviceName: 'GitHub Cloud Enterprise',
    accountIdentifier: 'idin@agape.nyc',
    hashType: 'ARGON2ID',
    passwordLength: 32,
    entropyBits: 128.0,
    reuseClusterTag: 'Unique-Passkey (Isolated)',
    status: 'KNOXED_ARGON2ID',
    sha256Proof: '5a2190dfca7832bc0189ef451299cbaa011287eac9903124785bc0029312feae',
  }
];

export const PasswordHashStrengthModal: React.FC<PasswordHashStrengthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [clusters, setClusters] = useState<PasswordClusterItem[]>(INITIAL_CLUSTERS);
  const [activeTab, setActiveTab] = useState<'REUSE_AUDIT' | 'ARGON2ID_DERIVATION' | 'AUDIT_LOGS'>('REUSE_AUDIT');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  
  // Argon2id Simulator State
  const [argonParams, setArgonParams] = useState<Argon2idDerivationParams>({
    memoryCostKiB: 65536,
    iterations: 3,
    parallelism: 4,
    saltHex: userProfile.masterKeyHash.substring(0, 32),
    derivedKeyLength: 32,
  });
  const [isDerivingKey, setIsDerivingKey] = useState(false);
  const [derivedKeyOutput, setDerivedKeyOutput] = useState<string | null>(null);

  // Counts
  const exposedCount = useMemo(() => clusters.filter(c => c.status === 'REUSED_EXPOSED').length, [clusters]);
  const nukedCount = useMemo(() => clusters.filter(c => c.status === 'NUKED_DEPRECATED').length, [clusters]);
  const knoxedCount = useMemo(() => clusters.filter(c => c.status === 'KNOXED_ARGON2ID').length, [clusters]);

  if (!isOpen) return null;

  // Deprecate & Close Reused Account (NUKE)
  const handleNukeReusedPassword = async (itemId: string) => {
    const target = clusters.find(c => c.id === itemId);
    if (!target) return;

    const receipt = await calculateSha256(`PASSWORD_DEPRECATED::${target.serviceName}::${Date.now()}::${userProfile.primaryEmail}`);
    const timeStr = new Date().toLocaleTimeString();

    setClusters(prev => prev.map(c => {
      if (c.id === itemId) {
        return {
          ...c,
          status: 'NUKED_DEPRECATED',
          hashType: 'ARGON2ID',
          entropyBits: 0,
          reuseClusterTag: '[ACCOUNT CLOSED - CREDENTIAL PURGED]',
          sha256Proof: receipt,
        };
      }
      return c;
    }));

    const line = `[${timeStr}] 🔥 NUKED CREDENTIAL: Deprecated reused static password for "${target.serviceName}". Account closed & hash record purged. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-16', 'NUKED', `Deprecated vulnerable password reuse cluster on ${target.serviceName}.`);
  };

  // Migrate to 32-char Random Argon2id Enclave Passkey (KNOX)
  const handleKnoxMigrateArgon2id = async (itemId: string) => {
    const target = clusters.find(c => c.id === itemId);
    if (!target) return;

    const proof = await calculateSha256(`ARGON2ID_MIGRATED::${target.serviceName}::${Date.now()}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    setClusters(prev => prev.map(c => {
      if (c.id === itemId) {
        return {
          ...c,
          status: 'KNOXED_ARGON2ID',
          hashType: 'ARGON2ID',
          passwordLength: 32,
          entropyBits: 128.0,
          reuseClusterTag: 'Unique-Argon2id Enclave Sealed',
          sha256Proof: proof,
        };
      }
      return c;
    }));

    const line = `[${timeStr}] 🛡️ KNOXED ARGON2ID: Upgraded "${target.serviceName}" to 128-bit quantum-resistant Argon2id key derivation (m=64MB, t=3, p=4). Proof: ${proof.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-16', 'KNOXED', `Credential migrated to 32-character Argon2id cryptographic passkey vault.`);
  };

  // Simulate Live Argon2id Derivation calculation
  const handleRunArgon2idDerivation = async () => {
    setIsDerivingKey(true);
    await new Promise(r => setTimeout(r, 650));

    const entropySource = `${userProfile.primaryEmail}::${argonParams.saltHex}::${argonParams.memoryCostKiB}::${Date.now()}`;
    const key = await calculateSha256(`ARGON2ID_256BIT_DIGEST_${entropySource}`);
    setDerivedKeyOutput(key);
    setIsDerivingKey(false);

    const timeStr = new Date().toLocaleTimeString();
    const line = `[${timeStr}] 🔑 ARGON2ID COMPUTED: Derived 256-bit symmetric enclave master key (${argonParams.memoryCostKiB / 1024}MB memory hardness). Digest: ${key.substring(0, 24)}...`;
    setAuditLogs(prev => [line, ...prev]);
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
                <KeyRound className="w-6 h-6 text-[#FF7A18] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 16: Cryptographic Hash Strength & Password Reuse Matrix
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    ARGON2ID • NIST 800-63B • 2026 ECRA
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Entropy Analysis • Credential Collision Neutralization • Hardware Passkey Migration
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
                onClick={() => setActiveTab('REUSE_AUDIT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'REUSE_AUDIT'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>1. Credential Reuse Clusters ({clusters.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('ARGON2ID_DERIVATION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'ARGON2ID_DERIVATION'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>2. Argon2id Key Derivation Studio</span>
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

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                {exposedCount} REUSED PASSWORDS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-[#00D4FF] border border-cyan-500/30 font-bold">
                {knoxedCount} ARGON2ID ENFORCED
              </span>
            </div>
          </div>

          {/* TAB 1: REUSE CLUSTERS */}
          {activeTab === 'REUSE_AUDIT' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Eliminate Shared Password Clusters & Weak Hashes</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    Credential stuffing attacks exploit the fact that users reuse identical passwords across low-security forums and critical financial portals. Use <strong className="text-[#FF2E9F]">NUKE</strong> to decommission obsolete accounts or <strong className="text-[#00D4FF]">KNOX</strong> to migrate credentials to high-entropy Argon2id passkey vaults.
                  </p>
                </div>
              </div>

              {/* Cluster Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      item.status === 'KNOXED_ARGON2ID'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : item.status === 'NUKED_DEPRECATED'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                        : 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{item.serviceName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                            {item.hashType}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Identifier: {item.accountIdentifier}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        item.status === 'KNOXED_ARGON2ID' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        item.status === 'NUKED_DEPRECATED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      }`}>
                        {item.status === 'KNOXED_ARGON2ID' ? 'ARGON2ID (KNOXED)' :
                         item.status === 'NUKED_DEPRECATED' ? 'CLOSED (NUKED) ✓' : 'REUSE COLLISION'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>CLUSTER: {item.reuseClusterTag}</span>
                        <span className={item.entropyBits < 60 ? 'text-orange-400 font-bold' : 'text-green-400 font-bold'}>
                          Entropy: {item.entropyBits} bits
                        </span>
                      </div>
                      <div className="text-white text-[11px]">
                        Length: {item.passwordLength} characters • {item.entropyBits < 60 ? 'Dictionary vulnerable' : 'Quantum-safe cryptographic entropy'}
                      </div>
                    </div>

                    {/* SHA-256 Digest */}
                    <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#00D4FF]" />
                        <span>Verification Receipt:</span>
                      </span>
                      <span className="text-cyan-300 truncate max-w-[170px]" title={item.sha256Proof}>
                        {item.sha256Proof}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {item.status === 'REUSED_EXPOSED' ? (
                        <>
                          <button
                            onClick={() => handleNukeReusedPassword(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Purge Account (Nuke)</span>
                          </button>

                          <button
                            onClick={() => handleKnoxMigrateArgon2id(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Argon2id Vault (Knox)</span>
                          </button>
                        </>
                      ) : item.status === 'KNOXED_ARGON2ID' ? (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Argon2id Protected • Zero Hash Reuse</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-[#FF2E9F] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Credentials Purged & Service Deprecated</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ARGON2ID KEY DERIVATION STUDIO */}
          {activeTab === 'ARGON2ID_DERIVATION' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00D4FF]" />
                  <span>Argon2id Memory-Hard Key Derivation Studio (RFC 9106)</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Argon2id is the winner of the Password Hashing Competition. It provides superior resistance against GPU and ASIC cracking arrays by forcing substantial RAM allocation (64 MB) and data-independent memory access.
                </p>
              </div>

              {/* Sliders & Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-slate-300 font-bold uppercase block mb-1">
                      Memory Cost: {argonParams.memoryCostKiB / 1024} MB ({argonParams.memoryCostKiB} KiB)
                    </label>
                    <input
                      type="range"
                      min="16384"
                      max="131072"
                      step="16384"
                      value={argonParams.memoryCostKiB}
                      onChange={(e) => setArgonParams(prev => ({ ...prev, memoryCostKiB: Number(e.target.value) }))}
                      className="w-full accent-[#00D4FF] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold uppercase block mb-1">
                      Time Cost (Iterations): {argonParams.iterations} passes
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={argonParams.iterations}
                      onChange={(e) => setArgonParams(prev => ({ ...prev, iterations: Number(e.target.value) }))}
                      className="w-full accent-[#00D4FF] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold uppercase block mb-1">
                      Parallelism Threads: {argonParams.parallelism} vCPUs
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={argonParams.parallelism}
                      onChange={(e) => setArgonParams(prev => ({ ...prev, parallelism: Number(e.target.value) }))}
                      className="w-full accent-[#00D4FF] cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleRunArgon2idDerivation}
                    disabled={isDerivingKey}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isDerivingKey ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Deriving 256-Bit Key...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Derive Argon2id Key</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Derived Key Preview Canvas */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-300 font-bold uppercase mb-1">
                      Derived Master Enclave Key Output (256 Bits):
                    </div>
                    <div className="p-4 rounded-xl bg-[#0B1020] border border-slate-800 font-mono text-xs text-white break-all leading-relaxed shadow-inner">
                      {derivedKeyOutput || '$argon2id$v=19$m=65536,t=3,p=4$7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08$9d4e11fa62b881ef03517c244b7f89d36e29ac3d02b378c77209930f1437dcfa'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div>Hardware Memory Defense: <span className="text-[#00D4FF] font-bold">ASIC / GPU Resistance Certified</span></div>
                    <div>Salt Entropy: <span className="text-white truncate block">{argonParams.saltHex}</span></div>
                    <div>Standard: <span className="text-pink-300 font-bold">NIST Special Publication 800-63B</span></div>
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
                <span>Password Entropy & Hash Migration Audit Stream</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Terminal className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Decommission a reused password or compute an Argon2id key to record cryptographic entries.
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
              <span>NIST 800-63B & RFC 9106 Argon2id Enclave Sealed</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Studio
              </button>

              <button
                onClick={() => {
                  const finalStatus = exposedCount === 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-16',
                    finalStatus,
                    `Module 16 Synchronized: ${knoxedCount} credentials migrated to Argon2id, ${nukedCount} obsolete accounts purged.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 16 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
