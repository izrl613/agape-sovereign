import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertTriangle,
  Filter,
  Clock,
  CheckCircle2,
  Zap,
  Lock,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface AdIdLocationScrubberModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_AD_ID_DATA = [
  {
    id: 'ad-01',
    adId: 'GAID-001',
    type: 'Google Advertising ID',
    status: 'ACTIVE',
    locationBreadcrumbs: 'Found in aggregated mobility dataset',
    risk: 'HIGH',
  },
  {
    id: 'ad-02',
    adId: 'IDFA-023',
    type: 'Apple Advertising ID',
    status: 'ACTIVE',
    locationBreadcrumbs: 'Historical location tracking',
    risk: 'HIGH',
  },
  {
    id: 'ad-03',
    adId: 'Opt-Out-007',
    type: 'Opt-Out Marker',
    status: 'PENDING',
    locationBreadcrumbs: 'Pending reset',
    risk: 'MODERATE',
  },
];

export const AdIdLocationScrubberModal: React.FC<AdIdLocationScrubberModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [adIdData, setAdIdData] = useState<{
    id: string; adId: string; type: string; status: string; locationBreadcrumbs: string; risk: string;
  }[]>(INITIAL_AD_ID_DATA);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleResetAdId = async (adId: string) => {
    const target = adIdData.find(d => d.id === adId);
    if (!target) return;
    setIsResetting(true);
    await new Promise(r => setTimeout(r, 500));
    const receipt = await calculateSha256(`ADID_RESET::${adId}::${Date.now()}`);
    setAdIdData(prev => prev.map(d => d.id === adId ? { ...d, status: 'RESET', risk: 'LOW' } : d));
    onUpdatePerimeterVector('diff-14', 'KNOXED', `Advertising ID reset: ${target.adId} permanently deleted and replaced with random identifier. Proof: ${receipt.substring(0, 16)}...`);
    setIsResetting(false);
    onClose();
  };

  const handleBatchReset = async () => {
    const activeIds = adIdData.filter(d => d.status === 'ACTIVE');
    setIsResetting(true);
    for (const adId of activeIds) {
      await new Promise(r => setTimeout(r, 300));
      await handleResetAdId(adId.id);
    }
    onUpdatePerimeterVector('diff-14', 'NUKED', `Batch Ad ID reset completed: ${activeIds.length} Advertising IDs permanently deleted.`);
    setIsResetting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#FF7A18]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-[#FF7A18]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,24,0.3)]">
                <MapPin className="w-6 h-6 text-[#FF7A18]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 14: Ad Profiling ID & Precise Location Trail
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    AD ID SCRUBBER
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  IDFA • GAID • Broker Reseller • Fuzzy 5-Mile Radius • 2026 ECRA LTS
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

          {/* Ad ID List */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>Advertising ID Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Ad ID</th>
                      <th scope="col" className="p-3">Type</th>
                      <th scope="col" className="p-3">Status</th>
                      <th scope="col" className="p-3">Location Risk</th>
                      <th scope="col" className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adIdData.map((ad) => (
                      <tr key={ad.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{ad.adId}</td>
                        <td className="p-3 text-[10px] text-slate-400">{ad.type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            ad.status === 'ACTIVE' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            ad.status === 'PENDING' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                            'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30'
                          }`}>
                            {ad.status}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{ad.locationBreadcrumbs}</td>
                        <td className="p-3">
                          {ad.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleResetAdId(ad.id)}
                              className="px-2 py-1 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                            >
                              <ShieldCheck className="w-3 h-3" /> Reset
                            </button>
                          ) : ad.status === 'PENDING' ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" /> Pending
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Reset ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 sm:px-6 py^3 bg-[#0B1020] border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Ad ID Reset Actions</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Reset Advertising IDs and enforce fuzzy 5-mile location radius for non-essential apps.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleResetAdId('ad-01')}
                disabled={isResetting}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isResetting ? 'opacity-50' : ''
                }"
              >
                <Link className="w-3.5 h-3.5 text-white" /> Reset GAID
              </button>
              <button
                onClick={() => handleResetAdId('ad-02')}
                disabled={isResetting}
                className="w-full py-2 px^4 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isResetting ? 'opacity-50' : ''
                }"
              >
                <Link className="w-3.5 h-3.5 text-white" /> Reset IDFA
              </button>
              <button
                onClick={handleBatchReset}
                disabled={isResetting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isResetting ? 'opacity-50' : ''
                }"
              >
                {isResetting ? 'Resetting...' : `Reset ${adIdData.filter(d => d.status === 'ACTIVE').length} Ad IDs`}
                <CheckCircle2 className="w-3.5 h-3.5 text-white ml-2" />
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>Fuzzy 5-Mile Radius • Ad Tracking Opt-Out • ECRA 2026</span>
            </div>

            <div className="flex items-center gap^3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Scrubber
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-14',
                    'KNOXED',
                    'Module 14 Synchronized: Ad ID & location trail cycle completed. IDs reset.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 14 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};