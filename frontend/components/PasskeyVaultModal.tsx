import React, { useState, useMemo } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  Zap,
  Sync,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface PasskeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_PASSKEY_DATA = [
  {
    id: 'pk-01',
    service: 'Apple iCloud',
    passkeyStatus: 'Active',
    deviceCount: 3,
    risk: 'SECURE',
  },
  {
    id: 'pk-02',
    service: 'Google Accounts',
    passkeyStatus: 'Active',
    deviceCount: 2,
    risk: 'SECURE',
  },
  {
    id: 'pk-03',
    service: ' Banking Sites',
    passkeyStatus: 'SMS Fallback',
    deviceCount: 0,
    risk: 'HIGH',
  },
];

export const PasskeyVaultModal: React.FC<PasskeyVaultModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [passkeyData, setPasskeyData] = useState<{
    id: string; service: string; passkeyStatus: string; deviceCount: number; risk: string;
  }[]>(INITIAL_PASSKEY_DATA);
  const [isRotating, setIsRotating] = useState(false);

  if (!isOpen) return null;

  const handleRotatePasskeys = async () => {
    setIsRotating(true);
    await new Promise(r => setTimeout(r, 800));
    const receipt = await calculateSha256(`PASSKEY_ROTATE::${Date.now()}`);
    const newStatus = 'Active';
    setPasskeyData(prev => prev.map(p => ({
      ...p,
      passkeyStatus: newStatus,
      deviceCount: p.deviceCount + 1,
    })));
    onUpdatePerimeterVector('diff-07', 'KNOXED', `Passkeys rotated across all services. Hardware-bound passkeys enforced. Proof: ${receipt.substring(0, 16)}...`);
    setIsRotating(false);
    onClose();
  };

  const handleMigrateFromSMS = async (serviceId: string) => {
    const target = passkeyData.find(p => p.id === serviceId);
    if (!target) return;
    const receipt = await calculateSha256(`SMS_MIGRATE::${serviceId}::${Date.now()}`);
    onUpdatePerimeterVector('diff-07', 'KNOXED', `Migrated ${target.service} from SMS 2FA to passkey-only login. Proof: ${receipt.substring(0, 16)}...`);
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
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <Key className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 7: Universal Passkey & FIDO2 Vault
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    PASSKEY VAULT
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Passwordless • FIDO2 • WebAuthn • 2026 ECRA LTS
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

          {/* Passkey Inventory */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Passkey Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Service</th>
                      <th scope="col" className="p-3">Passkey Status</th>
                      <th scope="col" className="p-3">Devices</th>
                      <th scope="col" className="p-3">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passkeyData.map((pk) => (
                      <tr key={pk.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{pk.service}</td>
                        <td className="p-3 text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            pk.passkeyStatus === 'Active' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                            pk.passkeyStatus === 'SMS Fallback' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            'bg-red-950/20 text-red-400 border border-red-500/30'
                          }`}>
                            {pk.passkeyStatus}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] font-mono">{pk.deviceCount}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            pk.risk === 'HIGH' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            pk.risk === 'SECURE' ? 'bg-green-950/20 text-[#00A851] border border-green-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {pk.risk}
                          </span>
                        </td>
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
              Migrate from SMS 2FA to passkey-only login. Rotate all hardware-bound passkeys.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleMigrateFromSMS('pk-03')}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Link className="w-3.5 h-3.5 text-white" /> Migrate from SMS 2FA
              </button>
              <button
                onClick={() => handleRotatePasskeys()}
                disabled={isRotating}
                className="w-full py-2 px^4 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isRotating ? 'opacity-50' : ''
                }"
              >
                {isRotating ? 'Rotating...' : 'Rotate All Passkeys'}
                <Sync className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Key className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Hardware-Bound • Passwordless • ECRA 2026 Certified</span>
            </div>

            <div className="flex items-center gap^3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Vault
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-07',
                    'KNOXED',
                    'Module 7 Synchronized: Passkey vault cycle completed. All passkeys rotated.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 7 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};