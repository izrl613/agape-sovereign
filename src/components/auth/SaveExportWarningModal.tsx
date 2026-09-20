import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, HardDrive, Download, X, Cloud } from 'lucide-react';
import { NEON, NeonButton, GlassCard } from '../UI';

interface Props {
  authType: 'passkey' | 'google' | 'demo';
  onConfirm: (destination: 'local' | 'drive' | 'download') => void;
  onCancel: () => void;
}

export const SaveExportWarningModal: React.FC<Props> = ({ authType, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060D1F]/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-xl w-full"
      >
        <GlassCard className="relative overflow-hidden border-[#FF2E9F]/30 p-8">
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-6 text-[#FF2E9F]">
            <AlertTriangle className="w-10 h-10" />
            <h2 className="text-2xl font-bold font-mono tracking-wider">SECURE EXPORT PROTOCOL</h2>
          </div>

          <div className="space-y-6 text-slate-300">
            <p>
              You are about to export a zero-knowledge Sovereign Identity Audit. 
              <strong> Agape Sovereign does not store this file on any central server.</strong>
            </p>

            {authType === 'passkey' && (
              <div className="bg-[#060D1F]/50 border border-[#00D4FF]/30 p-4 rounded-lg">
                <h3 className="text-[#00D4FF] font-mono font-bold flex items-center gap-2 mb-2">
                  <HardDrive className="w-5 h-5" />
                  DEVICE-BOUND VAULT
                </h3>
                <p className="text-sm">
                  Your PDF report will be securely encrypted and saved to this device's local vault. 
                  We maintain a <strong>26-month rolling archive</strong> of your DPCs.
                </p>
              </div>
            )}

            {authType === 'google' && (
              <div className="bg-[#060D1F]/50 border border-[#00D4FF]/30 p-4 rounded-lg">
                <h3 className="text-[#00D4FF] font-mono font-bold flex items-center gap-2 mb-2">
                  <Cloud className="w-5 h-5" />
                  GOOGLE DRIVE SYNC
                </h3>
                <p className="text-sm">
                  Your PDF report will be exported to your connected Google Drive account.
                </p>
              </div>
            )}

            <div className="bg-[#060D1F]/50 border border-slate-700/50 p-4 rounded-lg">
              <h3 className="text-white font-mono font-bold flex items-center gap-2 mb-2">
                <Download className="w-5 h-5" />
                DIRECT DOWNLOAD
              </h3>
              <p className="text-sm">
                Save a standard PDF copy to your local file system.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <NeonButton 
              variant="secondary" 
              onClick={() => onConfirm('download')}
              className="flex-1"
            >
              Direct Download
            </NeonButton>
            
            {authType === 'passkey' && (
              <NeonButton 
                variant="primary" 
                onClick={() => onConfirm('local')}
                className="flex-1 border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF]/10"
              >
                Save to Device Vault
              </NeonButton>
            )}

            {authType === 'google' && (
              <NeonButton 
                variant="primary" 
                onClick={() => onConfirm('drive')}
                className="flex-1 border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF]/10"
              >
                Save to Google Drive
              </NeonButton>
            )}
            
             {authType === 'demo' && (
              <NeonButton 
                variant="primary" 
                disabled
                className="flex-1 opacity-50 cursor-not-allowed"
                title="Vault and Drive export are disabled in demo mode"
              >
                Save Disabled (Demo)
              </NeonButton>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
