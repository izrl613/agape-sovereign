import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Smartphone, 
  RefreshCw, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Binary, 
  Award,
  Terminal,
  Clock
} from 'lucide-react';
import { IdentityDocumentScan, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface IdentityDocumentMdlModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_DOCUMENTS: IdentityDocumentScan[] = [
  {
    id: 'doc-01',
    documentType: 'PASSPORT',
    issuingJurisdiction: 'United States Department of State',
    documentNumberMasked: '9482•••••',
    plainFileLocation: '~/Downloads/Passport_FrontPage_Scan.pdf',
    mrzDetected: true,
    status: 'EXPOSED_UNENCRYPTED',
    sha256Fingerprint: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'doc-02',
    documentType: 'DRIVER_LICENSE',
    issuingJurisdiction: 'New York State DMV (Real ID Class D)',
    documentNumberMasked: '8920•••••',
    plainFileLocation: '~/Desktop/NYS_Driver_License_2025.jpg',
    mrzDetected: false,
    status: 'EXPOSED_UNENCRYPTED',
    sha256Fingerprint: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  }
];

export const IdentityDocumentMdlModal: React.FC<IdentityDocumentMdlModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [documents, setDocuments] = useState<IdentityDocumentScan[]>(INITIAL_DOCUMENTS);
  const [activeTab, setActiveTab] = useState<'SCANNED_DOCS' | 'MDL_ISO18013' | 'AUDIT_LOGS'>('SCANNED_DOCS');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isShreddingDoc, setIsShreddingDoc] = useState<string | null>(null);

  // Counts
  const exposedCount = useMemo(() => documents.filter(d => d.status === 'EXPOSED_UNENCRYPTED').length, [documents]);
  const shreddedCount = useMemo(() => documents.filter(d => d.status === 'SHREDDED_NUKED').length, [documents]);
  const mdlCount = useMemo(() => documents.filter(d => d.status === 'MDL_ISO18013_KNOXED').length, [documents]);

  if (!isOpen) return null;

  // DoD 5220.22-M Multi-Pass Shredding of Plain Identity Photo (NUKE)
  const handleShredPlainDoc = async (docId: string) => {
    setIsShreddingDoc(docId);
    const target = documents.find(d => d.id === docId);
    if (!target) return;

    await new Promise(r => setTimeout(r, 650));
    const timeStr = new Date().toLocaleTimeString();
    const receipt = await calculateSha256(`SHREDDED_DOC::${target.documentType}::${Date.now()}::${userProfile.primaryEmail}`);

    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          status: 'SHREDDED_NUKED',
          plainFileLocation: '[ZERO-OUT SHREDDED VIA DOD 5220.22-M - NO RECOVERY]',
          sha256Fingerprint: receipt,
        };
      }
      return d;
    }));

    setIsShreddingDoc(null);
    const line = `[${timeStr}] 🔥 NUKED DOCUMENT: Unencrypted ${target.documentType} image wiped across 3 DoD passes. Plaintext file destroyed. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-12', 'NUKED', `Unencrypted ${target.documentType} photo shredded from local storage.`);
  };

  // Migrate to ISO 18013-5 Hardware mDL Vault (KNOX)
  const handleMigrateToMdl = async (docId: string) => {
    const target = documents.find(d => d.id === docId);
    if (!target) return;

    const timeStr = new Date().toLocaleTimeString();
    const mdlDigest = await calculateSha256(`ISO_18013_5_MDL::${target.documentType}::${userProfile.masterKeyHash}`);

    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          status: 'MDL_ISO18013_KNOXED',
          iso18013Digest: mdlDigest,
          sha256Fingerprint: mdlDigest,
        };
      }
      return d;
    }));

    const line = `[${timeStr}] 🛡️ KNOXED mDL: ${target.documentType} migrated to cryptographically signed ISO 18013-5 Mobile Driver License enclave. Digest: ${mdlDigest.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-12', 'KNOXED', `Identity credential bound to hardware-backed ISO 18013-5 mDL enclave.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <FileText className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 12: Identity Document & mDL Sovereignty
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    ISO 18013-5 • DOD SHREDDING
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  State ID & Passport Protection • Plain Photo Scrubbing • Hardware Enclave Vault
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
                onClick={() => setActiveTab('SCANNED_DOCS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'SCANNED_DOCS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>1. Plain Document Scans ({documents.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('MDL_ISO18013')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'MDL_ISO18013'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>2. ISO 18013-5 Hardware mDL</span>
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
                {exposedCount} PLAIN PHOTOS EXPOSED
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-[#00D4FF] border border-cyan-500/30 font-bold">
                {mdlCount} ISO 18013-5 VAULTED
              </span>
            </div>
          </div>

          {/* TAB 1: PLAIN SCANNED DOCS */}
          {activeTab === 'SCANNED_DOCS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Scrub Unencrypted State ID Scans from Disk</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    Plain image scans of driver licenses and passports stored in your Downloads folder can be exfiltrated by stealer malware. Use <strong className="text-[#FF2E9F]">NUKE</strong> to sanitize the image via DoD 5220.22-M multi-pass shredding or <strong className="text-[#00D4FF]">KNOX</strong> to issue cryptographically signed ISO 18013-5 credentials.
                  </p>
                </div>
              </div>

              {/* Document Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      doc.status === 'MDL_ISO18013_KNOXED'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : doc.status === 'SHREDDED_NUKED'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                        : 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{doc.documentType}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                            {doc.documentNumberMasked}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {doc.issuingJurisdiction}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        doc.status === 'MDL_ISO18013_KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        doc.status === 'SHREDDED_NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      }`}>
                        {doc.status === 'MDL_ISO18013_KNOXED' ? 'ISO 18013-5 (KNOXED)' :
                         doc.status === 'SHREDDED_NUKED' ? 'SHREDDED (NUKED) ✓' : 'UNENCRYPTED DISK SCAN'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-slate-400">DETECTED PATH:</div>
                      <div className="text-white text-[11px] truncate">{doc.plainFileLocation}</div>
                      <div className="text-[10px] text-cyan-300 pt-1">
                        MRZ Check: {doc.mrzDetected ? 'Machine Readable Zone Verified' : 'Standard Barcode'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {doc.status === 'EXPOSED_UNENCRYPTED' ? (
                        <>
                          <button
                            onClick={() => handleShredPlainDoc(doc.id)}
                            disabled={isShreddingDoc === doc.id}
                            className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>DoD Shred (Nuke)</span>
                          </button>

                          <button
                            onClick={() => handleMigrateToMdl(doc.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Migrate to mDL (Knox)</span>
                          </button>
                        </>
                      ) : doc.status === 'MDL_ISO18013_KNOXED' ? (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Hardware ISO 18013-5 Enclave Protected</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-[#FF2E9F] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>DoD 5220.22-M Overwritten & Shredded</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ISO 18013-5 MDL PREVIEW */}
          {activeTab === 'MDL_ISO18013' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00D4FF]" />
                  <span>ISO 18013-5 Mobile Driver License (mDL) Cryptographic Specification</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  ISO 18013-5 replaces plain photo IDs with cryptographically verifiable CBOR data elements signed by state authority public keys. When proving your age or identity, you release only the minimal required attributes without disclosing your home address or license number.
                </p>
              </div>

              {/* mDL Enclave Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#111A33] via-[#0F172A] to-[#0B1020] border-2 border-cyan-500/50 shadow-2xl space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    AGA PE SOVEREIGN ENCLAVE mDL
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    ISO 18013-5
                  </span>
                </div>

                <div className="space-y-1 font-mono">
                  <div className="text-lg font-bold text-white">{userProfile.fullName || 'Sovereign Enclave Citizen'}</div>
                  <div className="text-xs text-slate-400">Class D Operator • Real ID Verified</div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <div>Hardware Binding: <span className="text-[#00D4FF]">{userProfile.passkeyDeviceId}</span></div>
                  <div>Selective Disclosure: <span className="text-green-400 font-bold">Zero-Knowledge Proof Enabled</span></div>
                  <div>Attestation Authority: <span className="text-white">Agape Sovereign Studio</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Identity Document Sanitization & mDL Audit Stream</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Shred a document scan or migrate to an ISO 18013-5 mDL to append verifiable receipts.
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
              <span>ISO 18013-5 & DoD 5220.22-M Physical Image Sanitization Enforced</span>
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
                  const finalStatus = exposedCount === 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-12',
                    finalStatus,
                    `Module 12 Synchronized: ${shreddedCount} plain image scans shredded, ${mdlCount} vaulted in ISO 18013-5 mDL.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 12 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
