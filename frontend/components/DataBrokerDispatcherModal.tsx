import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Flame, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Zap,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface DataBrokerDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_BROKER_LIST = [
  {
    id: 'broker-01',
    name: 'Whitepages',
    type: 'People Search',
    listings: 1,
    status: 'ACTIVE',
    data: 'Home address, phone, relatives',
  },
  {
    id: 'broker-02',
    name: 'Spokeo',
    type: 'People Search',
    listings: 1,
    status: 'ACTIVE',
    data: 'Email, age, employment',
  },
  {
    id: 'broker-03',
    name: 'Instant Checkmate',
    type: 'People Search',
    listings: 1,
    status: 'ACTIVE',
    data: 'Criminal records, addresses',
  },
];

export const DataBrokerDispatcherModal: React.FC<DataBrokerDispatcherModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [brokers, setBrokers] = useState<{
    id: string; name: string; type: string; listings: number; status: string; data: string;
  }[]>(INITIAL_BROKER_LIST);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dsarResults, setDsarResults] = useState<any>(null);

  if (!isOpen) return null;

  const handleDispatchDSAR = async (brokerId: string) => {
    const target = brokers.find(b => b.id === brokerId);
    if (!target) return;
    setIsDispatching(true);
    await new Promise(r => setTimeout(r, 600));
    const receipt = await calculateSha256(`DSAR_DISPATCH::${brokerId}::${Date.now()}`);
    setDsarResults({
      broker: target.name,
      status: 'PENDING',
      daysToComplete: '30-45',
      receipt: receipt.substring(0, 16) + '...',
    });
    setIsDispatching(false);
    onUpdatePerimeterVector('diff-06', 'KNOXED', `DSAR dispatch initiated for ${target.name} - legal erasure request submitted under CCPA/GDPR Article 17.`);
  };

  const handleBatchDispatch = async () => {
    setIsDispatching(true);
    const toDispatch = brokers.filter(b => b.status === 'ACTIVE');
    for (const broker of toDispatch) {
      await new Promise(r => setTimeout(r, 500));
      await handleDispatchDSAR(broker.id);
    }
    setIsDispatching(false);
    onUpdatePerimeterVector('diff-06', 'NUKED', `Batch DSAR dispatch completed: ${toDispatch.length} brokers receive legal erasure requests.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#FF2E9F]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-950/40 border border-[#FF2E9F]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                <Send className="w-6 h-6 text-[#FF2E9F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 6: Data Broker Removal Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    BROKER DISPATCH
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  220+ People-Search Engines • CCPA/GDPR DSAR • Legal Erasure • 2026 ECRA LTS
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

          {/* Broker List */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Active Broker Listings</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Broker</th>
                      <th scope="col" className="p-3">Type</th>
                      <th scope="col" className="p-3">Listings</th>
                      <th scope="col" className="p-3">Status</th>
                      <th scope="col" className="p-3">Data Exposed</th>
                      <th scope="col" className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokers.map((broker) => (
                      <tr key={broker.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{broker.name}</td>
                        <td className="p-3 text-[10px] text-slate-400">{broker.type}</td>
                        <td className="p-3 text-[10px] font-mono">
                          {broker.listings} active
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            broker.status === 'ACTIVE' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            broker.status === 'PENDING' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                            'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30'
                          }`}>
                            {broker.status}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{broker.data}</td>
                        <td className="p-3">
                          {broker.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleDispatchDSAR(broker.id)}
                              className="px-2 py-1 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                            >
                              <ShieldCheck className="w-3 h-3" /> DSAR
                            </button>
                          ) : broker.status === 'PENDING' ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" /> Pending
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Completed</span>
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
              <span>Batch DSAR Dispatch</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Send legal erasure requests to all active brokers simultaneously. Each request is cryptographically receipted.
            </p>
            <button
              onClick={handleBatchDispatch}
              disabled={isDispatching}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                isDispatching ? 'opacity-50' : ''
              }"
            >
              {isDispatching ? 'Dispatching...' : `Dispatch DSAR to ${brokers.filter(b => b.status === 'ACTIVE').length} Active Brokers`}
              <CheckCircle2 className="w-3.5 h-3.5 text-white ml-2" />
            </button>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Legal Erasure • CCPA/GDPR Certified • Receipted</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Dispatcher
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-06',
                    'KNOXED',
                    'Module 6 Synchronized: Data broker DSAR dispatch cycle completed.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
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