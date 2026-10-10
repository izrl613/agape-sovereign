import React from 'react';
import { 
  Mail, 
  Share2, 
  Laptop, 
  Search, 
  Database, 
  KeyRound, 
  ShieldCheck, 
  Flame, 
  Layers, 
  GlobeLock, 
  CreditCard, 
  FileLock,
  Cpu,
  Radio,
  Wifi,
  Sparkles
} from 'lucide-react';
import { VectorCategory } from '../types';

interface SidebarProps {
  activeCategory: VectorCategory | 'ALL';
  onSelectCategory: (cat: VectorCategory | 'ALL') => void;
  onOpenOnboarding: () => void;
  onRunDeepScan: () => void;
  isScanning: boolean;
  exposedCount: number;
  knoxedCount: number;
  nukedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenOnboarding,
  onRunDeepScan,
  isScanning,
  exposedCount,
  knoxedCount,
  nukedCount,
}) => {
  const categories: { id: VectorCategory | 'ALL'; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'ALL', label: 'All 16 Vectors', icon: <Layers className="w-4 h-4" />, count: 16 },
    { id: 'COMMUNICATIONS', label: 'Email & Cloud Vaults', icon: <Mail className="w-4 h-4" />, count: 3 },
    { id: 'DIGITAL_PRESENCE', label: 'Social & Biometrics', icon: <Share2 className="w-4 h-4" />, count: 3 },
    { id: 'DEVICES_SYSTEMS', label: 'Devices, IoT & Hardware', icon: <Laptop className="w-4 h-4" />, count: 4 },
    { id: 'DEEP_WEB_BROKERS', label: 'Data Brokers & Darknet', icon: <Search className="w-4 h-4" />, count: 3 },
    { id: 'CREDENTIALS_FINANCE', label: 'Passkeys & Finance', icon: <CreditCard className="w-4 h-4" />, count: 3 },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* Perimeter Status Card */}
      <div className="relative p-[1.5px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
        <div className="relative rounded-2xl bg-[#0F172A] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              DIFF PERIMETER STATUS
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2">
            <div className="p-2 rounded-xl bg-[#0B1020] border border-orange-500/30">
              <div className="text-lg font-mono font-extrabold text-[#FF7A18]">{exposedCount}</div>
              <div className="text-[10px] font-bold text-slate-300">EXPOSED</div>
            </div>
            <div className="p-2 rounded-xl bg-[#0B1020] border border-cyan-500/30">
              <div className="text-lg font-mono font-extrabold text-[#00D4FF]">{knoxedCount}</div>
              <div className="text-[10px] font-bold text-slate-300">KNOXED</div>
            </div>
            <div className="p-2 rounded-xl bg-[#0B1020] border border-pink-500/30">
              <div className="text-lg font-mono font-extrabold text-[#FF2E9F]">{nukedCount}</div>
              <div className="text-[10px] font-bold text-slate-300">NUKED</div>
            </div>
          </div>

          {/* Scan button */}
          <button
            onClick={onRunDeepScan}
            disabled={isScanning}
            className="w-full mt-4 py-2.5 px-4 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Radio className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'SCANNING 16 VECTORS...' : 'RUN REAL-TIME DIFF SCAN'}</span>
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono tracking-wider font-bold text-slate-300 uppercase">
          Identity Vector Categories
        </div>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#111A33]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#00D4FF]' : 'text-slate-400'}>{cat.icon}</span>
                <span>{cat.label}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isActive ? 'bg-[#00D4FF]/30 text-white' : 'bg-[#0B1020] text-slate-400'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Onboarding / Re-seed Splash Trigger */}
      <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-4">
        <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF2E9F]" />
          Identity Data Onboarding
        </h4>
        <p className="text-xs text-slate-300 mb-3">
          Update all 16 identity data fields in a streamlined, zero-access modal.
        </p>
        <button
          onClick={onOpenOnboarding}
          className="w-full py-2 px-3 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-200 hover:text-white transition"
        >
          Open 16-Vector Input Wizard
        </button>
      </div>

      {/* Compliance standards footer snippet */}
      <div className="px-4 py-3 rounded-xl bg-[#0B1020] border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
        <div className="text-slate-300 font-semibold">2026 ERCA / ECRA COMPLIANCE</div>
        <div>• Zero Plaintext Storage Engine</div>
        <div>• Web Crypto SHA-256 Validated</div>
        <div>• Passkey Bound Hardware Enclave</div>
      </div>
    </aside>
  );
};
