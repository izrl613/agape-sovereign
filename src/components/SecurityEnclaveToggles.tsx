import React, { useState } from 'react';
import { Shield, Key, Fingerprint, Lock, AlertTriangle, Activity } from 'lucide-react';
import { NEON } from './UI';
import { motion, AnimatePresence } from 'framer-motion';

export const SecurityEnclaveToggles = ({ bindPasskey }: { bindPasskey: () => void }) => {
  const [activeEnclaves, setActiveEnclaves] = useState<Record<string, boolean>>({
    biometric: false,
    session: true,
    privacy: false
  });

  const toggleEnclave = (key: string) => {
    setActiveEnclaves(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enclaves = [
    {
      id: 'biometric',
      icon: Fingerprint,
      color: '#00D4FF',
      title: 'Biometric Auth',
      desc: 'Enable face or fingerprint verification for high-risk DIFF operations.',
      action: () => toggleEnclave('biometric')
    },
    {
      id: 'session',
      icon: Lock,
      color: '#FF2E9F',
      title: 'Session Lockdown',
      desc: 'Configure automatic session termination and zero-knowledge clearing.',
      action: () => toggleEnclave('session')
    },
    {
      id: 'privacy',
      icon: AlertTriangle,
      color: '#EAB308', // yellow-500
      title: 'Privacy Hardening',
      desc: 'Enable advanced obfuscation for your public metadata footprint.',
      action: () => toggleEnclave('privacy')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div 
        onClick={bindPasskey}
        className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Key size={60} />
        </div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF7A18]/10 rounded-lg group-hover:bg-[#FF7A18]/20 transition-colors">
              <Key className="w-4 h-4 text-[#FF7A18]" />
            </div>
            <div className="font-bold text-sm text-white">Passkey Management</div>
          </div>
          <span className="text-[10px] bg-[#FF7A18]/20 text-[#FF7A18] px-2 py-0.5 rounded font-mono font-bold border border-[#FF7A18]/30">
            REGISTER
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed relative z-10">Register a new device biometric or hardware security key for sovereign identity binding.</p>
        
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <Activity className="w-3 h-3 text-[#FF7A18]" />
            HARDWARE-BOUND FIDO2
          </div>
        </div>
      </div>

      {enclaves.map((enc) => {
        const isActive = activeEnclaves[enc.id];
        const Icon = enc.icon;
        
        return (
          <div 
            key={enc.id}
            onClick={enc.action}
            className={`p-4 border rounded-xl transition-all cursor-pointer group relative overflow-hidden
              ${isActive 
                ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Icon size={60} />
            </div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg transition-colors" style={{ background: isActive ? `${enc.color}20` : `${enc.color}10` }}>
                  <Icon className="w-4 h-4" style={{ color: enc.color }} />
                </div>
                <div className="font-bold text-sm text-white">{enc.title}</div>
              </div>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isActive ? 'bg-[#00D4FF]' : 'bg-slate-700'}`}>
                <motion.div 
                  className="w-3 h-3 bg-white rounded-full shadow-md"
                  animate={{ x: isActive ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed relative z-10">{enc.desc}</p>
            
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between relative z-10 overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: enc.color }}>
                    <Shield className="w-3 h-3" />
                    ENCLAVE ACTIVE
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    AWAITING TELEMETRY
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
