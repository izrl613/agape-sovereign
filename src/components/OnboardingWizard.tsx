import React, { useState } from 'react';
import { IdentityModuleInput } from './IdentityModuleInput';
import { SOVEREIGN_PALETTE } from '../theme/tokens';
import { motion, AnimatePresence } from 'framer-motion';

const MODULES = [
  { id: 'comm_1', label: 'Email Breach & Metadata Scanner', category: 'Communications' },
  { id: 'comm_2', label: 'Phone, VoIP & SIM-Swap Vector', category: 'Communications' },
  { id: 'comm_3', label: 'Credential & Password Entropy Vault', category: 'Communications' },
  { id: 'comm_4', label: 'Universal Passkey & WebAuthn Registry', category: 'Communications' },
  { id: 'soc_1', label: 'Social Media Posts & Account Scanner', category: 'Social/Deep Web' },
  { id: 'soc_2', label: 'Data Broker Exposure & Removal', category: 'Social/Deep Web' },
  { id: 'soc_3', label: 'Deep Web & Darknet Index Monitor', category: 'Social/Deep Web' },
  { id: 'soc_4', label: 'Search Engine & Public Record De-Indexing', category: 'Social/Deep Web' },
  { id: 'hw_1', label: 'Local Computer & Laptop File Scanner', category: 'Hardware/Network' },
  { id: 'hw_2', label: 'Mobile Device Posture & Telemetry Audit', category: 'Hardware/Network' },
  { id: 'hw_3', label: 'Cloud Drive & Federated Storage Scanner', category: 'Hardware/Network' },
  { id: 'hw_4', label: 'Network, DNS, IP & Geolocation Footprint', category: 'Hardware/Network' },
  { id: 'fin_1', label: 'Financial, Credit & Crypto Identity Vector', category: 'Financial/Legal' },
  { id: 'fin_2', label: 'Biometric, Voice & AI-Clone Defense', category: 'Financial/Legal' },
  { id: 'fin_3', label: 'Application OAuth & API Token Revocation', category: 'Financial/Legal' },
  { id: 'fin_4', label: 'ECRA/ERCA 2026 Compliance Ledger', category: 'Financial/Legal' },
];

export const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, { value: string, hash: string }>>({});

  const handleValueChange = (moduleId: string, value: string, hash: string) => {
    setFormData(prev => ({
      ...prev,
      [moduleId]: { value, hash },
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, MODULES.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const currentModule = MODULES[currentStep];
  const progress = ((currentStep + 1) / MODULES.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: SOVEREIGN_PALETTE.canvas }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full p-8 sovereign-border bg-[#111830] rounded-2xl shadow-2xl"
      >
        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#0B1020] rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: SOVEREIGN_PALETTE.ice }}>
            Sovereign Intake
          </h1>
          <p className="text-sm" style={{ color: SOVEREIGN_PALETTE.cyan }}>
            Vector {currentStep + 1} of 16: {currentModule.category}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentModule.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <IdentityModuleInput
              moduleId={currentModule.id}
              label={currentModule.label}
              onValueChange={(val, hash) => handleValueChange(currentModule.id, val, hash)}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-12">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${currentStep === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#00D4FF] hover:text-[#0B1020]'}`}
            style={{ color: SOVEREIGN_PALETTE.ice, border: `1px solid ${SOVEREIGN_PALETTE.cyan}` }}
          >
            Previous
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-2 rounded-lg font-bold bg-gradient-to-r from-[#FF2E9F] to-[#00D4FF] text-[#0B1020] hover:scale-105 transition-transform"
          >
            {currentStep === MODULES.length - 1 ? 'Complete' : 'Next Vector'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
