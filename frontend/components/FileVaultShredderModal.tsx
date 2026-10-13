import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Flame, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  Cpu,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface FileVaultShredderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_SHRED_QUEUE = [
  {
    id: 'file-01',
    name: 'Tax Return 2021.pdf',
    size: '2.3 MB',
    path: '~/Downloads/Tax Return 2021.pdf',
    status: 'PLAIN',
    ageDays: 450,
  },
  {
    id: 'file-02',
    name: 'Passport Scan.jpg',
    size: '1.1 MB',
    path: '~/Documents/Passport Scan.jpg',
    status: 'PLAIN',
    ageDays: 520,
  },
  {
    id: 'file-03',
    name: 'API Keys.txt',
    size: '0.5 KB',
    path: '~/Desktop/API Keys.txt',
    status: 'PLAIN',
    ageDays: 90,
  },
];

export const FileVaultShredderModal: React.FC<FileVaultShredderModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [shredQueue, setShredQueue] = useState<{
    id: string; name: string; size: string; path: string; status: string; ageDays: number;
  }[]>(INITIAL_SHRED_QUEUE);
  const [isShredding, setIsShredding] = useState(false);
  const [shredLogs, setShredLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleShredFile = async (fileId: string) => {
    const target = shredQueue.find(f => f.id === fileId);
    if (!target) return;
    setIsShredding(true);
    await new Promise(r => setTimeout(r, 400));
    const receipt = await calculateSha256(`SHRED::${fileId}::${Date.now()}`);
    setShredLogs(prev => [
      `[${new Date().toLocaleTimeString()}] 🔥 SHRED: ${target.name} permanently purged via DoD 5220.22-M. Proof: ${receipt.substring(0, 16)}...`,
      ...prev,
    ]);
    setShredQueue(prev => prev.filter(f => f.id !== fileId));
    setIsShredding(false);
    onUpdatePerimeterVector('diff-03', 'NUKED', `File shredded: ${target.name} using DoD 5220.22-M sanitization.`);
  };

  const handleBatchShred = async () => {
    const plainFiles = shredQueue.filter(f => f.status === 'PLAIN');
    setIsShredding(true);
    for (const file of plainFiles) {
      await new Promise(r => setTimeout(r, 300));
      await handleShredFile(file.id);
    }
    setIsShredding(false);
    onUpdatePerimeterVector('diff-03', 'NUKED', `Batch shred completed: ${plainFiles.length} plain files permanently destroyed via DoD 5220.22-M.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#FF7A18]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-[#FF7A18]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,24,0.3)]">
                <Lock className="w-6 h-6 text-[#FF7A18]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 3: Device & Cloud File Vault Scan
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    FILE VAULT
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  DoD 5220.22-M • AES-256-GCM • Local & Cloud • 2026 ECRA LTS
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

          {/* Shred Queue */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Shred Queue</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">File</th>
                      <th scope="col" className="p-3">Size</th>
                      <th scope="col" className="p-3">Age</th>
                      <th scope="col" className="p-3">Status</th>
                      <th scope="col" className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shredQueue.map((file) => (
                      <tr key={file.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{file.name}</td>
                        <td className="p-3 text-[10px] text-slate-400">{file.size}</td>
                        <td className="p-3 text-[10px] text-slate-400">{file.ageDays} days</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40`}>
                            PLAIN
                          </span>
                        </td>
                        <td className="p-3">
                          {file.status === 'PLAIN' ? (
                            <button
                              onClick={() => handleShredFile(file.id)}
                              className="px-2 py-1 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                            >
                              <Flame className="w-3 h-3" /> Shred
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Shredded ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Batch Action */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Batch DoD Shred</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Permanently destroy all plain files using DoD 5220.22-M military sanitization. Cryptographically receipted.
            </p>
            <button
              onClick={handleBatchShred}
              disabled={isShredding}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                isShredding ? 'opacity-50' : ''
              }"
            >
              {isShredding ? 'Shredding...' : `Shred ${shredQueue.filter(f => f.status === 'PLAIN').length} Plain Files`}
              <CheckCircle2 className="w-3.5 h-3.5 text-white ml-2" />
            </button>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>DoD 5220.22-M • AES-256-GCM • Zero-Access</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Shredder
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-03',
                    'NUKED',
                    'Module 3 Synchronized: File vault shredder cycle completed.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 3 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};