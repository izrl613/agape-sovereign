import React, { useState } from 'react';
import { X, Check, Hash, Sparkles, Layers, ShieldCheck, Flame } from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: DiffVector[];
  onSaveVectors: (updated: DiffVector[]) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  vectors,
  onSaveVectors,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    vectors.forEach(v => {
      map[v.id] = v.dataValue;
    });
    return map;
  });

  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const handleInputChange = (id: string, val: string) => {
    setFormData(prev => ({ ...prev, [id]: val }));
  };

  const handleSaveAndEncrypt = async () => {
    const updated: DiffVector[] = [];
    for (const v of vectors) {
      const newVal = formData[v.id] || v.dataValue;
      const newHash = await calculateSha256(`${v.name}::${newVal}::2026_AGAPE_ENCLAVE`);
      updated.push({
        ...v,
        dataValue: newVal,
        sha256Hash: newHash,
      });
    }
    onSaveVectors(updated);
    onClose();
  };

  // Group by 4 items per page for easy wizard navigation
  const chunkSize = 4;
  const totalSteps = Math.ceil(vectors.length / chunkSize);
  const currentVectors = vectors.slice(activeStep * chunkSize, (activeStep + 1) * chunkSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl p-[2px] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#111A33] border border-cyan-500/40 flex items-center justify-center">
                <Layers className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  16-Vector Identity Onboarding Wizard
                </h3>
                <p className="text-xs text-cyan-300 font-mono">
                  Client-Side Encrypted Matrix (Zero Plaintext Transmission)
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

          {/* Stepper Progress */}
          <div className="px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold uppercase">
              Phase {activeStep + 1} of {totalSteps}: Modules {activeStep * chunkSize + 1} to {Math.min((activeStep + 1) * chunkSize, vectors.length)}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    activeStep === idx
                      ? 'bg-[#00D4FF] text-[#0B1020]'
                      : 'bg-[#111A33] text-slate-400 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Vector input list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {currentVectors.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-cyan-500/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#0B1020] text-[#00D4FF] border border-cyan-500/30">
                      Module #{v.moduleNumber}
                    </span>
                    <h4 className="font-bold text-sm text-white">{v.name}</h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300">
                    Category: {v.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3">{v.shortDesc}</p>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-cyan-200 mb-1">
                    YOUR IDENTITY VALUE / IDENTIFIER:
                  </label>
                  <input
                    type="text"
                    value={formData[v.id] || ''}
                    onChange={(e) => handleInputChange(v.id, e.target.value)}
                    placeholder={`e.g., Enter ${v.name.toLowerCase()} footprint`}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B1020] border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Hash className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Live Hash: {v.sha256Hash.substring(0, 24)}...</span>
                  </div>
                  <span className="text-[#FF7A18]">Risk: {v.riskLevel}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Controls */}
          <div className="p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 transition"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              {activeStep < totalSteps - 1 ? (
                <button
                  onClick={() => setActiveStep(prev => Math.min(totalSteps - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-cyan-400 text-xs font-bold text-[#0B1020] transition"
                >
                  Next Phase
                </button>
              ) : (
                <button
                  onClick={handleSaveAndEncrypt}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-bold shadow-lg hover:opacity-90 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Encrypt & Commit 16 Vectors</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
