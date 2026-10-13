import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertTriangle,
  Lock,
  Zap,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface FinancialTokenizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_TOKENIZATION_DATA = [
  {
    id: 'token-01',
    merchant: 'E-Commerce Cart',
    cardStatus: 'Raw Number Stored',
    tokenized: false,
    risk: 'HIGH',
    lastScan: '4 hours ago',
  },
  {
    id: 'token-02',
    merchant: 'Subscription Service',
    cardStatus: 'Tokenized',
    tokenized: true,
    risk: 'LOW',
    lastScan: '12 hours ago',
  },
  {
    id: 'token-03',
    merchant: 'Old Retail Site',
    cardStatus: 'Expired Raw',
    tokenized: false,
    risk: 'CRITICAL',
    lastScan: '2 days ago',
  },
];

export const FinancialTokenizationModal: React.FC<FinancialTokenizationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [tokenizationData, setTokenizationData] = useState<{
    id: string; merchant: string; cardStatus: string; tokenized: boolean; risk: string; lastScan: string;
  }[]>(INITIAL_TOKENIZATION_DATA);
  const [isDispatching, setIsDispatching] = useState(false);

  if (!isOpen) return null;

  const handleDispatchPurge = async (merchantId: string) => {
    const target = tokenizationData.find(m => m.id === merchantId);
    if (!target) return;
    setIsDispatching(true);
    await new Promise(r => setTimeout(r, 600));
    const receipt = await calculateSha256(`MERCHANT_PURGE::${merchantId}::${Date.now()}`);
    onUpdatePerimeterVector('diff-09', 'NUKED', `Merchant card purge dispatched: ${target.merchant} - automated DSAR and account closure. Proof: ${receipt.substring(0, 16)}...`);
    setIsDispatching(false);
    onClose();
  };

  const handleBatchPurge = async () => {
    const untokenized = tokenizationData.filter(m => !m.tokenized);
    setIsDispatching(true);
    for (const merchant of untokenized) {
      await new Promise(r => setTimeout(r, 400));
      await handleDispatchPurge(merchant.id);
    }
    onUpdatePerimeterVector('diff-09', 'NUKED', `Batch merchant purge completed: ${untokenized.length} stale merchant accounts closed and card purges dispatched.`);
    setIsDispatching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#00D4FF]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <CreditCard className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 9: Financial Footprint & Tokenization
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    TOKENIZATION
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Merchant Purge • Virtual Cards • Zero-Knowledge • 2026 ECRA LTS
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

          {/* Tokenization Data */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Merchant Tokenization Status</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Merchant</th>
                      <th scope="col" className="p-3">Card Status</th>
                      <th scope="col" className="p-3">Tokenized</th>
                      <th scope="col" className="p-3">Risk</th>
                      <th scope="col" className="p-3">Last Scan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokenizationData.map((token) => (
                      <tr key={token.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{token.merchant}</td>
                        <td className="p^3 text-[10px] text-slate-400">{token.cardStatus}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            token.tokenized ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                            'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30'
                          }`}>
                            {token.tokenized ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            token.risk === 'CRITICAL' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            token.risk === 'HIGH' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            token.risk === 'LOW' ? 'bg-green-950/20 text-[#00A851] border border-green-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {token.risk}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{token.lastScan}</td>
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
              <span>Merchant Purge Actions</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Dispatch automated merchant card purge and close stale merchant accounts.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleDispatchPurge('token-01')}
                disabled={isDispatching}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isDispatching ? 'opacity-50' : ''
                }"
              >
                <CreditCard className="w-3.5 h-3.5 text-white" /> Purge E-Commerce Cart
              </button>
              <button
                onClick={() => handleDispatchPurge('token-03')}
                disabled={isDispatching}
                className="w-full py-2 px^4 rounded-xl bg-gradient-to-r from-red-500 via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isDispatching ? 'opacity-50' : ''
                }"
              >
                <CreditCard className="w-3.5 h-3.5 text-white" /> Purge Old Retail Site
              </button>
              <button
                onClick={handleBatchPurge}
                disabled={isDispatching}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isDispatching ? 'opacity-50' : ''
                }"
              >
                {isDispatching ? 'Purging...' : `Purge ${tokenizationData.filter(m => !m.tokenized).length} Untokenized Merchants`}
                <CheckCircle2 className="w-3.5 h-3.5 text-white ml-2" />
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <CreditCard className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Virtual Masked Cards • Zero-Knowledge • ECRA 2026</span>
            </div>

            <div className="flex items-center gap^3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Tokenization
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-09',
                    'NUKED',
                    'Module 9 Synchronized: Financial tokenization cycle completed. Stale merchants purged.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 9 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};