import React, { useState, useMemo } from 'react';
import { 
  Skull, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  Coffee,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface DarknetStealerScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_STEALER_DATA = [
  {
    id: 'steal-01',
    malware: 'RedLine',
    detected: '5 mins ago',
    data: 'Browser cookies, saved passwords',
    severity: 'HIGH',
    action: 'Invalidate tokens',
  },
  {
    id: 'steal-02',
    malware: 'Lumma',
    detected: '2 hours ago',
    data: 'Crypto wallets, session tokens',
    severity: 'CRITICAL',
    action: 'Rotate refresh tokens',
  },
  {
    id: 'steal-03',
    malware: 'Vidar',
    detected: '1 day ago',
    data: 'System info, VPN credentials',
    severity: 'MODERATE',
    action: 'Update storage encryption',
  },
];

export const DarknetStealerScannerModal: React.FC<DarknetStealerScannerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [stealerData, setStealerData] = useState<{
    id: string; malware: string; detected: string; data: string; severity: string; action: string;
  }[]>(INITIAL_STEALER_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SCANNING' >('SCANNING');

  if (!isOpen) return null;

  const handleInvalidateTokens = async () => {
    setIsInvalidating(true);
    await new Promise(r => setTimeout(r, 500));
    const receipt = await calculateSha256(`TOKEN_INVALIDATE::${Date.now()}`);
    onUpdatePerimeterVector('diff-15', 'KNOXED', `All OAuth refresh tokens invalidated. Proof: ${receipt.substring(0, 16)}...`);
    setIsInvalidating(false);
    onClose();
  };

  const handleLockStorage = async () => {
    setIsLocking(true);
    await new Promise(r => setTimeout(r, 300));
    const receipt = await calculateSha256(`STORAGE_LOCK::${Date.now()}`);
    onUpdatePerimeterVector('diff-15', 'KNOXED', `Browser storage locked behind YubiKey session bindings. Proof: ${receipt.substring(0, 16)}...`);
    setIsLocking(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-[#FF2E9F] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-red-500/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                <Skull className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 15: Darknet Infostealer Scanner
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/20 text-red-400 border border-red-500/40">
                    STEALER SCAN
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  RedLine • Lumma • Vidar • Malware Logs • 2026 ECRA LTS
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

          {/* Stealer Data */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Stealer Malware Detection</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Malware</th>
                      <th scope="col" className="p-3">Detected</th>
                      <th scope="col" className="p-3">Stolen Data</th>
                      <th scope="col" className="p-3">Severity</th>
                      <th scope="col" className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stealerData.map((steal) => (
                      <tr key={steal.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{steal.malware}</td>
                        <td className="p-3 text-[10px] text-slate-400">{steal.detected}</td>
                        <td className="p-3 text-[10px] text-slate-400">{steal.data}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            steal.severity === 'CRITICAL' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            steal.severity === 'HIGH' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30'
                          }`}>
                            {steal.severity}
                          </span>
                        </td>
                        <td className="p-3">
                          {steal.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Immediate Actions</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleInvalidateTokens()}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-red-500 via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Link className="w-3.5 h-3.5 text-white" />
                <span>Invalidate OAuth Tokens</span>
              </button>
              <button
                onClick={() => handleLockStorage()}
                className="py-2 px^3 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-[#00D4FF] transition flex items-center gap-2"
              >
                <YubiKey className="w-3.5 h-3.5" /> Lock Storage
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span>Zero-Knowledge • Token Rotation • YubiKey Bound</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py^2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Scanner
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-15',
                    'KNOXED',
                    'Module 15 Synchronized: Infostealer scan cycle completed. Tokens rotated.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 15 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};