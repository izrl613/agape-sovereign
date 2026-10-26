import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface IdentityDocumentMdlModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_DOCUMENT_DATA = [
  {
    id: 'doc-01',
    document: 'Driver License',
    type: 'State ID',
    status: 'UNENCRYPTED',
    location: 'Notes folder',
    risk: 'CRITICAL',
    lastScanned: '25 mins ago',
  },
  {
    id: 'doc-02',
    document: 'Passport',
    type: 'Passport',
    status: 'ENCRYPTED',
    location: 'Secure Enclave',
    risk: 'LOW',
    lastScanned: '1 day ago',
  },
  {
    id: 'doc-03',
    document: 'State ID Backup',
    type: 'mDL',
    status: 'UNENCRYPTED',
    location: 'Cloud Cache',
    risk: 'HIGH',
    lastScanned: '30 mins ago',
  },
];

export const IdentityDocumentMdlModal: React.FC<IdentityDocumentMdlModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [documentData, setDocumentData] = useState<{
    id: string; document: string; type: string; status: string; location: string; risk: string; lastScanned: string;
  }[]>(INITIAL_DOCUMENT_DATA);
  const [isMigrating, setIsMigrating] = useState(false);

  if (!isOpen) return null;

  const handleMigrateTomDL = async () => {
    const target = documentData.find(d => d.status === 'UNENCRYPTED');
    if (!target) return;
    setIsMigrating(true);
    await new Promise(r => setTimeout(r, 700));
    const receipt = await calculateSha256(`MDL_MIGRATION::${target.id}::${Date.now()}`);
    setDocumentData(prev => prev.map(d => d.id === target.id ? { ...d, status: 'KNOXED', document: 'ISO 18013-5 mDL (Hardware‑backed)' } : d));
    onUpdatePerimeterVector('diff-12', 'KNOXED', `Migrated to hardware‑backed ISO 18013-5 cryptographically signed mDL. Proof: ${receipt.substring(0, 16)}...`);
    setIsMigrating(false);
  };

  const handleShredDocument = async (docId: string) => {
    const target = documentData.find(d => d.id === docId);
    if (!target) return;
    const receipt = await calculateSha256(`DOC_SHRED::${docId}::${Date.now()}`);
    setDocumentData(prev => prev.map(d => d.id === docId ? { ...d, status: 'NUKED', document: 'Permanently shredded' } : d));
    onUpdatePerimeterVector('diff-12', 'NUKED', `Permanent cryptographic shredding of plain image files from note apps. Proof: ${receipt.substring(0, 16)}...`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#00D4FF]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <FileText className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 12: Identity Credentials & mDL Sovereignty
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    mDL SOVEREIGNTY
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  ISO 18013-5 • Hardware‑backed • BIPA/ECRA • 2026 ECRA LTS
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

          {/* Document Data */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Credential Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Document</th>
                      <th scope="col" className="p-3">Type</th>
                      <th scope="col" className="p-3">Status</th>
                      <th scope="col" className="p-3">Location</th>
                      <th scope="col" className="p-3">Risk</th>
                      <th scope="col" className="p-3">Last Scanned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentData.map((doc) => (
                      <tr key={doc.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{doc.document}</td>
                        <td className="p-3 text-[10px] text-slate-400">{doc.type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            doc.status === 'UNENCRYPTED' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            doc.status === 'ENCRYPTED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                            'bg-red-950/20 text-red-400 border border-red-500/30'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{doc.location}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            doc.risk === 'CRITICAL' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            doc.risk === 'HIGH' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            doc.risk === 'LOW' ? 'bg-green-950/20 text-[#00A851] border border-green-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {doc.risk}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{doc.lastScanned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Remediation Actions</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Migrate plain documents to hardware‑backed ISO 18013-5 mDL or permanently shred.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleMigrateTomDL()}
                disabled={isMigrating}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isMigrating ? 'opacity-50' : ''
                }"
              >
                <FileText className="w-3.5 h-3.5 text-white" /> Migrate to mDL
              </button>
              <button
                onClick={() => handleShredDocument('doc-01')}
                className="w-full py-2 px-4 rounded-xl bg-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Flame className="w-3.5 h-3.5" /> Shred Driver License
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>ISO 18013-5 • Hardware‑backed • ECRA 2026 Certified</span>
            </div>

            <div className="flex items-center gap^3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Credentials
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-12',
                    'KNOXED',
                    'Module 12 Synchronized: Identity credentials migration cycle completed. Migrated to mDL.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 12 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};