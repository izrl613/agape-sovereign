import React, { useState } from 'react';
import { NEON, GRADIENT_BORDER, DIFF_MODULES } from '../constants';
import { GlassCard, NeonText, NeonButton } from './ui/NeonElements';
import { Shield, Fingerprint, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

interface OnboardingSplashProps {
  onComplete: (user: { name: string; email: string; provider: string; nukedCount: number; knoxedCount: number }) => void;
}

export const OnboardingSplash: React.FC<OnboardingSplashProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [dataInputs, setDataInputs] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Track status classifications selected by user for each module
  const [decisions, setDecisions] = useState<Record<string, "NUKED" | "KNOXED">>({});

  const currentModule = DIFF_MODULES[step];

  const handleVerify = async () => {
    setIsVerifying(true);
    
    try {
      const email = "user@agape.nyc";
      
      // 1. Get authentication options from backend
      const optionsRes = await fetch('/passkey/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.error || 'Failed to obtain authentication options');
      }
      const authOptions = await optionsRes.json();

      // 2. Perform authentication on client (triggers native OS/browser prompt!)
      const assertionResponse = await startAuthentication({ optionsJSON: authOptions });

      // 3. Verify with backend
      const verifyRes = await fetch('/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assertionResponse, email })
      });
      const verifyResult = await verifyRes.json();
      
      if (verifyResult.customToken || verifyResult.verified) {
        setIsUnlocked(true);
      } else {
        throw new Error('Verification failed');
      }
    } catch (error: any) {
      console.error('WebAuthn verification error:', error);
      alert(`WebAuthn Error: ${error.message || 'Verification failed. Make sure you registered a passkey during sign-in.'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDecision = (decision: "NUKED" | "KNOXED") => {
    setDecisions(prev => ({
      ...prev,
      [currentModule.id]: decision
    }));

    // Move to next step or complete onboarding
    setIsUnlocked(false);
    if (step < DIFF_MODULES.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate results and finish
      const nukedList = Object.values({ ...decisions, [currentModule.id]: decision }).filter(d => d === "NUKED");
      const knoxedList = Object.values({ ...decisions, [currentModule.id]: decision }).filter(d => d === "KNOXED");
      
      onComplete({
        name: "Sovereign User",
        email: "user@agape.nyc",
        provider: "google",
        nukedCount: nukedList.length,
        knoxedCount: knoxedList.length
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: NEON.bg }}>
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] pointer-events-none rounded-full" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] pointer-events-none rounded-full" style={{ background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)" }} />

      <GlassCard className="w-full max-w-2xl p-8 relative overflow-hidden" style={{ border: `1px solid rgba(0,212,255,0.15)` }}>
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF2E9F] to-[#00D4FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.25)]">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-md font-bold tracking-wider text-white">DIFF SOVEREIGN ONBOARDING</h2>
              <p className="text-[9px] text-[#00D4FF] font-mono tracking-widest uppercase">Layer 3 Hardware Passkey Enclave</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xl font-black text-[#00D4FF]">{step + 1}/{DIFF_MODULES.length}</div>
            <div className="text-[8px] text-[#7B9BB5] uppercase tracking-wider">{currentModule.vector}</div>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex gap-1 mb-8">
          {DIFF_MODULES.map((_, i) => (
            <div 
              key={i} 
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: i <= step ? `linear-gradient(90deg, ${NEON.magenta}, ${NEON.blue})` : 'rgba(255,255,255,0.05)' }}
            />
          ))}
        </div>

        {/* Dynamic Step Content */}
        {!isUnlocked ? (
          <div className="space-y-6" style={{ animation: "fade-in 0.3s ease" }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl" style={{ color: NEON.blue }}>{currentModule.icon}</span>
              <h3 className="text-lg font-bold text-white">{currentModule.label} Input</h3>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed font-mono">
              Provide input data for this sector. All entries are hashed and processed within your local enclaves.
            </p>

            <div className="relative group">
              <input 
                type="text"
                autoFocus
                value={dataInputs[currentModule.id] || ''}
                onChange={(e) => setDataInputs({ ...dataInputs, [currentModule.id]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all font-mono text-sm"
                placeholder={`Enter data for ${currentModule.label}...`}
                onKeyDown={(e) => e.key === 'Enter' && dataInputs[currentModule.id] && handleVerify()}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={!dataInputs[currentModule.id]}
                onClick={handleVerify}
                className={`py-3 px-8 rounded-xl font-bold tracking-wider font-mono text-xs transition-all flex items-center gap-2 ${
                  dataInputs[currentModule.id] 
                    ? 'bg-gradient-to-r from-[#FF2E9F] to-[#00D4FF] text-white hover:scale-105 shadow-[0_0_15px_rgba(0,212,255,0.3)]' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                🔑 VERIFY WITH PASSKEY
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6" style={{ animation: "fade-in 0.4s ease" }}>
            {/* Decrypted Identity Reveal & Decision */}
            <div className="flex items-center gap-3">
              <span className="text-3xl" style={{ color: NEON.orange }}>🔓</span>
              <div>
                <h3 className="text-lg font-bold text-white font-mono">ENCLAVE DECRYPTED: {currentModule.label}</h3>
                <p className="text-[10px] text-[#7B9BB5] font-mono mt-0.5">Verified Identity Vector: "{dataInputs[currentModule.id]}"</p>
              </div>
            </div>

            {/* Simulated Scan Results */}
            <GlassCard className="p-4 bg-black/40 border border-white/5 space-y-3 font-mono">
              <div className="flex justify-between items-center text-[10px] pb-2 border-b border-white/5">
                <span className="text-[#00D4FF]">⬟ INTEGRITY DECRYPT SUCCESSFUL</span>
                <span className="text-[#FF2E9F]">ALERT LEVEL: HIGH</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                <p>⚡ Breach sweep found data footprints across external registries.</p>
                <p>⚡ Action Required: Choose whether to completely purge (NUKE) this footprint from tracking lists or seal (KNOX) it using hardware-based cryptographic credentials.</p>
              </div>
            </GlassCard>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => handleDecision("NUKED")}
                className="flex-1 btn-neon py-3.5 px-6 rounded-xl text-white font-bold tracking-wider font-mono text-xs flex items-center justify-center gap-2 border border-red-500/30 hover:scale-[1.02] transition-all"
                style={{ background: "rgba(255,46,159,0.12)", color: NEON.magenta, textShadow: `0 0 10px ${NEON.magenta}44` }}
              >
                🔥 NUKE EXPOSURE
              </button>
              <button 
                onClick={() => handleDecision("KNOXED")}
                className="flex-1 btn-neon py-3.5 px-6 rounded-xl text-white font-bold tracking-wider font-mono text-xs flex items-center justify-center gap-2 border border-blue-500/30 hover:scale-[1.02] transition-all"
                style={{ background: "rgba(0,212,255,0.12)", color: NEON.blue, textShadow: `0 0 10px ${NEON.blue}44` }}
              >
                🛡️ KNOX SECURE
              </button>
            </div>
          </div>
        )}

        {/* Biometric Verification Dialog/Overlay */}
        {isVerifying && (
          <div className="absolute inset-0 bg-[#060D1F]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
            <div className="relative mb-6">
              {/* Outer scanning rings */}
              <div className="absolute -inset-4 rounded-full border border-[#00D4FF]/30 animate-ping" />
              <div className="absolute -inset-2 rounded-full border-2 border-[#00D4FF]/50 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00D4FF]/20 to-[#FF2E9F]/10 border border-[#00D4FF]/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                <Fingerprint className="w-10 h-10 text-[#00D4FF] animate-pulse" />
              </div>
            </div>
            <h4 className="text-md font-bold tracking-widest text-white font-mono uppercase mb-2">Asserting Sovereign Passkey</h4>
            <p className="text-[10px] text-[#00D4FF] font-mono animate-pulse uppercase tracking-[0.2em]">Contacting WebAuthn Authenticator Device...</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
