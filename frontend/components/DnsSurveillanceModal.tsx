import React, { useState, useMemo } from 'react';
import { 
  Wifi, 
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

interface DnsSurveillanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_DNS_DATA = [
  {
    id: 'dns-01',
    dnsType: 'Standard DNS',
    isEncrypted: false,
    isOdoh: false,
    risk: 'MODERATE',
    exposure: 'Home router exposed to ISP transparent proxy',
  },
  {
    id: 'dns-02',
    dnsType: 'DoH (DNS over HTTPS)',
    isEncrypted: true,
    isOdoh: false,
    risk: 'LOW',
    exposure: 'Encrypted but provider-logged',
  },
  {
    id: 'dns-03',
    dnsType: 'OdOH (Oblivious DNS over HTTPS)',
    isEncrypted: true,
    isOdoh: true,
    risk: 'LOW',
    exposure: 'Maximum privacy - no server sees both client and destination',
  },
];

export const DnsSurveillanceModal: React.FC<DnsSurveillanceModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [dnsData, setDnsData] = useState<{
    id: string; dnsType: string; isEncrypted: boolean; isOdoh: boolean; risk: string; exposure: string;
  }[]>(INITIAL_DNS_DATA);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const handleSwitchDns = async (dnsId: string) => {
    const target = dnsData.find(d => d.id === dnsId);
    if (!target) return;
    setIsSwitching(true);
    await new Promise(r => setTimeout(r, 600));
    const receipt = await calculateSha256(`DNS_SWITCH::${dnsId}::${Date.now()}`);
    const newType = target.id === 'dns-01' ? 'DoH' : target.id === 'dns-02' ? 'OdOH' : 'Standard DNS';
    setDnsData(prev => prev.map(d => d.id === dnsId ? { ...d, dnsType: newType, isEncrypted: newType !== 'Standard DNS', isOdoh: newType === 'OdOH', risk: newType === 'OdOH' ? 'LOW' : 'MODERATE' } : d));
    onUpdatePerimeterVector('diff-08', 'KNOXED', `DNS protocol switched to ${newType}. Proof: ${receipt.substring(0, 16)}...`);
    setIsSwitching(false);
    onClose();
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
                <Wifi className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 8: DNS Surveillance & WireGuard ODoH Shield
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    DNS SHIELD
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  DNS Queries • DoH • OdOH • WireGuard • 2026 ECRA LTS
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

          {/* DNS Data */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>DNS Protocol Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">DNS Type</th>
                      <th scope="col" className="p-3">Encrypted</th>
                      <th scope="col" className="p-3">OdOH</th>
                      <th scope="col" className="p-3">Risk</th>
                      <th scope="col" className="p-3">Exposure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsData.map((dns) => (
                      <tr key={dns.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{dns.dnsType}</td>
                        <td className="p-3 text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            dns.isEncrypted ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                            'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30'
                          }`}>
                            {dns.isEncrypted ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3 text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            dns.isOdoh ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {dns.isOdoh ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            dns.risk === 'HIGH' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            dns.risk === 'MODERATE' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            'bg-green-950/20 text-[#00A851] border border-green-500/30'
                          }`}>
                            {dns.risk}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{dns.exposure}</td>
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
              <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Protocol Switching</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Switch between Standard DNS, DNS over HTTPS (DoH), and Oblivious DNS over HTTPS (OdOH) to protect your queries from ISP monitoring.
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <button
                onClick={() => handleSwitchDns('dns-01')}
                className="w-full py-2 px^3 rounded-xl bg-gradient-to-r from-orange-500 via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Wifi className="w-3.5 h-3.5 text-white" /> Switch to DoH
              </button>
              <button
                onClick={() => handleSwitchDns('dns-02')}
                disabled={isSwitching}
                className="w-full py-2 px^3 rounded-xl bg-cyan-950/20 hover:bg-cyan-800 border border-cyan-500/50 text-[#00D4FF] text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Wifi className="w-3.5 h-3.5 text-[#00D4FF]" /> Switch to DoH
              </button>
              <button
                onClick={() => handleSwitchDns('dns-03')}
                disabled={isSwitching}
                className="w-full py-2 px^3 rounded-xl bg-purple-950/20 hover:bg-purple-900 border border-purple-500/50 text-purple-400 text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" /> Switch to OdOH
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Wifi className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Encrypted DNS • ODoH • ISP-Proof • ECRA 2026</span>
            </div>

            <div className="flex items-center gap^3">
              <button
                onClick={onClose}
                className="px^4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close DNS Shield
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-08',
                    'KNOXED',
                    'Module 8 Synchronized: DNS surveillance cycle completed. Protocol optimized.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 8 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};