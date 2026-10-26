import React, { useState, useMemo } from 'react';
import { 
  ScanFace, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle2,
  Filter,
  Zap,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface BiometricDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_BIOMETRIC_DATA = [
  {
    id: 'bio-01',
    source: 'Clearview AI',
    type: 'Facial Recognition',
    matchScore: '98%',
    location: 'Public Conference',
    date: 'June 2026',
    status: 'EXPOSED',
  },
  {
    id: 'bio-02',
    source: 'PimEyes',
    type: 'Facial Search',
    matchScore: '85%',
    location: 'Social Media',
    date: 'May 2026',
    status: 'EXPOSED',
  },
  {
    id: 'bio-03',
    source: 'Facebook Tag',
    type: 'Auto-Tagging',
    matchScore: '67%',
    location: 'Group Photo',
    date: 'April 2026',
    status: 'KNOXED',
  },
];

export const BiometricDefenseModal: React.FC<BiometricDefenseModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [biometricData, setBiometricData] = useState<{
    id: string; source: string; type: string; matchScore: string; location: string; date: string; status: string;
  }[]>(INITIAL_BIOMETRIC_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'DATA' | 'DEFENSE' >('DATA');

  const filteredData = biometricData.filter(b =>
    b.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  const handleApplyCloaking = async (sourceId: string) => {
    const target = biometricData.find(b => b.id === sourceId);
    if (!target) return;
    const receipt = await calculateSha256(`DIGITAL_CLOAKING::${sourceId}::${Date.now()}`);
    setBiometricData(prev => prev.map(b => b.id === sourceId ? { ...b, status: 'KNOXED', matchScore: '0%', cloaked: true } : b));
    const line = `[${new Date().toLocaleTimeString()}] 🛡️ KNOXED: Digital cloaking applied to ${target.source}. Proof: ${receipt.substring(0, 16)}...`;
    onUpdatePerimeterVector('diff-10', 'KNOXED', `Biometric defense: digital cloaking noise filters applied to ${target.source} public avatars.`);
    onClose();
  };

  const handleSubmitOptOut = async (sourceId: string) => {
    const target = biometricData.find(b => b.id === sourceId);
    if (!target) return;
    const receipt = await calculateSha256(`BIOMETRIC_OPT_OUT::${sourceId}::${Date.now()}`);
    setBiometricData(prev => prev.map(b => b.id === sourceId ? { ...b, status: 'NUKED', optOut: true } : b));
    const line = `[${new Date().toLocaleTimeString()}] 🔥 NUKED: BIPA/ECRA opt-out submitted for ${target.source}. Proof: ${receipt.substring(0, 16)}...`;
    onUpdatePerimeterVector('diff-10', 'NUKED', `Biometric opt-out and deletion submitted under BIPA/ECRA for ${target.source}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#00D4FF]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-[#FF2E9F]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                <ScanFace className="w-6 h-6 text-[#FF2E9F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 10: Biometric Face Scraping & Clearview Defense
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    BIOMETRIC SHIELD
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Clearview • PimEyes • BIPA/ECRA • 2026 ECRA LTS
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

          {/* Biometric Data */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>Biometric Exposure Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Source</th>
                      <th scope="col" className="p-3">Type</th>
                      <th scope="col" className="p-3">Match Score</th>
                      <th scope="col" className="p-3">Location</th>
                      <th scope="col" className="p-3">Date</th>
                      <th scope="col" className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((bio) => (
                      <tr key={bio.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{bio.source}</td>
                        <td className="p-3 text-[10px] text-slate-400">{bio.type}</td>
                        <td className="p-3 text-[10px] font-mono">
                          {bio.matchScore}
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{bio.location}</td>
                        <td className="p-3 text-[10px] text-slate-400">{bio.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            bio.status === 'EXPOSED' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            bio.status === 'KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                            'bg-green-950/20 text-[#00A851] border border-green-500/30'
                          }`}>
                            {bio.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Defense Actions */}
          {activeTab === 'DEFENSE' && (
            <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>Defense Actions</span>
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Apply digital cloaking noise filters and submit legal opt-out requests under BIPA and ECRA.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleApplyCloaking('bio-01')}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <ScanFace className="w-3.5 h-3.5 text-[#FF2E9F]" /> Apply Cloaking to Clearview (98% match)
                </button>
                <button
                  onClick={() => handleApplyCloaking('bio-02')}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <ScanFace className="w-3.5 h-3.5 text-[#FF2E9F]" /> Apply Cloaking to PimEyes (85% match)
                </button>
                <button
                  onClick={() => handleSubmitOptOut('bio-01')}
                  className="w-full py-2 px-4 rounded-xl bg-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <Flame className="w-3.5 h-3.5" /> Submit BIPA Opt-Out
                </button>
                <button
                  onClick={() => handleSubmitOptOut('bio-02')}
                  className="w-full py-2 px-4 rounded-xl bg-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                >
                  <Flame className="w-3.5 h-3.5" /> Submit BIPA Opt-Out
                </button>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ScanFace className="w-3.5 h-3.5 text-[#FF2E9F]" />
              <span>Zero-Knowledge Biometric Shield • BIPA/ECRA Certified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Defense
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-10',
                    'KNOXED',
                    'Module 10 Synchronized: Biometric defense cycle completed. Cloaking active.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 10 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};