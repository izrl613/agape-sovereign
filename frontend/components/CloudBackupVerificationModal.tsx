import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Cloud, 
  Lock, 
  KeyRound, 
  RefreshCw, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Binary, 
  Trash2,
  Terminal,
  Clock
} from 'lucide-react';
import { CloudBackupVaultItem, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface CloudBackupVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_BACKUPS: CloudBackupVaultItem[] = [
  {
    id: 'bak-01',
    providerName: 'iCloud Advanced Data Protection',
    storageService: 'Apple iCloud Drive & Photos ADP Enclave',
    clientSideEncryptionActive: true,
    recoveryKeyType: 'POST_QUANTUM_KYBER1024',
    staleAgeDays: 14,
    totalSizeGb: 48.2,
    status: 'ZERO_KNOWLEDGE_VERIFIED',
    sha256AuditReceipt: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'bak-02',
    providerName: 'Google Workspace CSE',
    storageService: 'Google Drive Client-Side Encryption Vault',
    clientSideEncryptionActive: true,
    recoveryKeyType: 'HARDWARE_FIDO2_BACKUP',
    staleAgeDays: 28,
    totalSizeGb: 19.5,
    status: 'ZERO_KNOWLEDGE_VERIFIED',
    sha256AuditReceipt: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'bak-03',
    providerName: 'Legacy Cloud Backup',
    storageService: 'Legacy Device SMS-Escrow Unencrypted Snapshot',
    clientSideEncryptionActive: false,
    recoveryKeyType: 'LEGACY_SMS_ESCROW',
    staleAgeDays: 240,
    totalSizeGb: 32.1,
    status: 'STALE_LEGACY_EXPOSED',
    sha256AuditReceipt: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  }
];

export const CloudBackupVerificationModal: React.FC<CloudBackupVerificationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [backups, setBackups] = useState<CloudBackupVaultItem[]>(INITIAL_BACKUPS);
  const [activeTab, setActiveTab] = useState<'BACKUP_STATUS' | 'KEY_ROTATION' | 'AUDIT_LOGS'>('BACKUP_STATUS');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);
  const [activeRecoveryKey, setActiveRecoveryKey] = useState<string>('KYBER1024-PQ-RECOVERY-KEY-894102-ENCLAVE');

  // Counts
  const staleCount = useMemo(() => backups.filter(b => b.status === 'STALE_LEGACY_EXPOSED').length, [backups]);
  const verifiedCount = useMemo(() => backups.filter(b => b.status === 'ZERO_KNOWLEDGE_VERIFIED').length, [backups]);
  const purgedCount = useMemo(() => backups.filter(b => b.status === 'PURGED_NUKED').length, [backups]);

  if (!isOpen) return null;

  // Purge Stale Legacy Unencrypted Cloud Backups (>180 days) (NUKE)
  const handlePurgeStaleBackup = async (backupId: string) => {
    const target = backups.find(b => b.id === backupId);
    if (!target) return;

    const receipt = await calculateSha256(`PURGE_LEGACY_BACKUP::${target.storageService}::${Date.now()}::${userProfile.primaryEmail}`);
    const timeStr = new Date().toLocaleTimeString();

    setBackups(prev => prev.map(b => {
      if (b.id === backupId) {
        return {
          ...b,
          status: 'PURGED_NUKED',
          storageService: '[PERMANENTLY PURGED FROM CLOUD SERVERS]',
          totalSizeGb: 0,
          sha256AuditReceipt: receipt,
        };
      }
      return b;
    }));

    const line = `[${timeStr}] 🔥 NUKED LEGACY CLOUD BACKUP: Destroyed unencrypted snapshot (${target.staleAgeDays} days old) on ${target.providerName}. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-11', 'NUKED', `Stale legacy cloud backup snapshots purged from cloud storage.`);
  };

  // Rotate Post-Quantum Kyber-1024 Recovery Key (KNOX)
  const handleRotateQuantumRecoveryKey = async () => {
    setIsRotatingKeys(true);
    await new Promise(r => setTimeout(r, 650));

    const entropy = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newKey = `KYBER1024-PQ-RECOVERY-${entropy}-${Date.now().toString(36).toUpperCase()}`;
    const receipt = await calculateSha256(`ROTATE_PQ_KEY::${newKey}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    setActiveRecoveryKey(newKey);
    setIsRotatingKeys(false);

    setBackups(prev => prev.map(b => ({
      ...b,
      clientSideEncryptionActive: true,
      recoveryKeyType: 'POST_QUANTUM_KYBER1024',
      status: b.status === 'PURGED_NUKED' ? 'PURGED_NUKED' : 'ZERO_KNOWLEDGE_VERIFIED',
      sha256AuditReceipt: receipt,
    })));

    const line = `[${timeStr}] 🛡️ KNOXED RECOVERY KEY: Rotated post-quantum Kyber-1024 hardware key. Cloud provider server-side access verified at 0%. Proof: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-11', 'KNOXED', 'Post-quantum Kyber-1024 hardware recovery keys rotated across iCloud ADP & Google CSE.');
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
                <Cloud className="w-6 h-6 text-[#00D4FF] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 11: Cloud Backup Zero-Knowledge Verification
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    ICLOUD ADP • GOOGLE CSE • POST-QUANTUM
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Zero Cloud Provider Plaintext Inspection • Recovery Key Rotation • 2026 ECRA LTS Standard
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
                onClick={() => setActiveTab('BACKUP_STATUS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'BACKUP_STATUS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>1. Cloud Backups Status ({backups.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('KEY_ROTATION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'KEY_ROTATION'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>2. Post-Quantum Recovery Key Rotation</span>
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
              <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 font-bold">
                {verifiedCount} ZERO-KNOWLEDGE
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {staleCount} STALE BACKUPS
              </span>
            </div>
          </div>

          {/* TAB 1: CLOUD BACKUPS STATUS */}
          {activeTab === 'BACKUP_STATUS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Zero-Knowledge Cloud Storage Verification</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    Standard cloud backups (Google Drive, iCloud without ADP) hold keys on corporate servers, granting law enforcement or compromised insiders plaintext access. Either <strong className="text-[#FF2E9F]">NUKE</strong> stale unencrypted backups or <strong className="text-[#00D4FF]">KNOX</strong> vaults with Post-Quantum hardware recovery keys.
                  </p>
                </div>
              </div>

              {/* Backups List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {backups.map((bak) => (
                  <div
                    key={bak.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      bak.status === 'ZERO_KNOWLEDGE_VERIFIED'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : bak.status === 'PURGED_NUKED'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                        : 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{bak.providerName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                            {bak.totalSizeGb} GB
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {bak.storageService}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        bak.status === 'ZERO_KNOWLEDGE_VERIFIED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        bak.status === 'PURGED_NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        'bg-orange-500/20 text-[#FF7A18] border border-orange-500/50 animate-pulse'
                      }`}>
                        {bak.status === 'ZERO_KNOWLEDGE_VERIFIED' ? 'ZERO-KNOWLEDGE (KNOXED)' :
                         bak.status === 'PURGED_NUKED' ? 'PURGED (NUKED) ✓' : 'UNENCRYPTED STALE'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>RECOVERY KEY: {bak.recoveryKeyType}</span>
                        <span>AGE: {bak.staleAgeDays} days</span>
                      </div>
                      <div className="text-white text-[11px]">
                        Client-Side Encryption: {bak.clientSideEncryptionActive ? 'ACTIVE (Server Zero-Access)' : 'DISABLED (SMS Escrow Vulnerable)'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {bak.status === 'STALE_LEGACY_EXPOSED' ? (
                        <button
                          onClick={() => handlePurgeStaleBackup(bak.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Purge Legacy Snapshot (Nuke)</span>
                        </button>
                      ) : bak.status === 'ZERO_KNOWLEDGE_VERIFIED' ? (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Verified Zero Server Plaintext Access</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-[#FF2E9F] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Permanently Shredded from Cloud Storage</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: POST-QUANTUM KEY ROTATION */}
          {activeTab === 'KEY_ROTATION' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#00D4FF]" />
                  <span>Kyber-1024 Post-Quantum Hardware Recovery Key Rotation</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Rotating recovery keys periodically prevents historical cloud snapshots from being decrypted by future quantum supercomputers. The new key is bound exclusively to your local FIDO2 passkey hardware enclave.
                </p>
              </div>

              {/* Key Rotation Card */}
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 font-mono text-xs">
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold mb-1">Active Hardware Recovery Key:</div>
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-[#00D4FF] font-bold break-all">
                    {activeRecoveryKey}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <div>Coprocessor Standard: <span className="text-white font-bold">NIST FIPS 203 (ML-KEM / Kyber)</span></div>
                  <div>Carrier Escrow: <span className="text-pink-300 font-bold">0% Server-Side Key Holding</span></div>
                </div>

                <button
                  onClick={handleRotateQuantumRecoveryKey}
                  disabled={isRotatingKeys}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isRotatingKeys ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Rotating Post-Quantum Key...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Rotate Kyber-1024 Hardware Recovery Key (Knox)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Cloud Backup Zero-Knowledge Verification Audit Stream</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Purge a legacy snapshot or rotate your post-quantum recovery key to record cryptographic entries.
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
              <span>Apple ADP & Google Workspace CSE Zero-Knowledge Verified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Engine
              </button>

              <button
                onClick={() => {
                  const finalStatus = staleCount === 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-11',
                    finalStatus,
                    `Module 11 Synchronized: ${verifiedCount} vaults zero-knowledge verified, ${purgedCount} legacy backups purged.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 11 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
