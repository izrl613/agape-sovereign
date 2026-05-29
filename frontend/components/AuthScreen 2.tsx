import React, { useState } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText, NeonButton } from './ui/NeonElements';

interface AuthScreenProps {
  onAuth: (user: { name: string, email: string, provider: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [step, setStep] = useState<"landing" | "passkey" | "creating">("landing");
  const [scanning, setScanning] = useState(false);

  const handleProvider = (provider: string) => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setStep("passkey"); }, 2000);
  };

  const handlePasskey = () => {
    setStep("creating");
    setTimeout(() => onAuth({ name: "Sovereign User", email: "user@agape.nyc", provider: "google" }), 2500);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden" style={{ background: NEON.bg }}>
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", animation: "fade-in 1s ease" }} />
      
      {/* Radial glows */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)" }} />
      <div className="absolute top-[70%] left-[20%] w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)" }} />
      
      <GlassCard className="w-[480px] p-12 text-center" style={{ animation: "slide-in-up 0.6s ease" }}>
        {/* Logo */}
        <div className="mb-8" style={{ animation: "float 4s ease-in-out infinite" }}>
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <svg viewBox="0 0 80 80" className="w-full" style={{ filter: `drop-shadow(0 0 12px ${NEON.blue})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
              <text x="40" y="46" textAnchor="middle" fill={NEON.blue} className="font-['Orbitron'] text-base font-black">AI</text>
            </svg>
          </div>
          <NeonText color={NEON.blue} size="1.6rem" weight={900}>ARCHITECT AI</NeonText>
          <div className="text-[0.7rem] mt-1 tracking-[0.15em] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
            AGAPE SOVEREIGN ENCLAVE 2026
          </div>
        </div>

        {/* Neon separator */}
        <div className="h-[1px] mb-7 rounded-sm opacity-70" style={{ background: GRADIENT_BORDER }} />

        {step === "landing" && !scanning && (
          <div style={{ animation: "fade-in 0.4s ease" }}>
            <div className="text-[0.9rem] mb-2 font-medium" style={{ color: NEON.text }}>Digital Identity Federated Footprint</div>
            <div className="text-[0.78rem] mb-7 leading-relaxed" style={{ color: NEON.textMuted }}>
              Authenticate to begin your <span className="font-bold" style={{ color: NEON.magenta }}>DIFF</span> analysis. Your sovereignty begins here.
            </div>
            <div className="flex flex-col gap-3">
              <button className="btn-neon neon-border py-3 px-5 rounded-lg text-white font-semibold flex items-center justify-center gap-3 text-[0.95rem]" onClick={() => handleProvider("google")} style={{ background: "rgba(66,133,244,0.1)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continue with Google
              </button>
              <button className="btn-neon neon-border py-3 px-5 rounded-lg text-white font-semibold flex items-center justify-center gap-3 text-[0.95rem]" onClick={() => handleProvider("apple")} style={{ background: "rgba(255,255,255,0.06)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" /></svg>
                Continue with Apple
              </button>
            </div>
            <div className="mt-5 text-[0.7rem] leading-relaxed" style={{ color: NEON.textMuted }}>
              🔒 All data encrypted client-side. Zero-knowledge architecture.<br />
              Your identity. Your sovereignty. Your rules.
            </div>
          </div>
        )}

        {scanning && (
          <div className="py-5" style={{ animation: "fade-in 0.3s ease" }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-5" style={{ border: `3px solid rgba(0,212,255,0.2)`, borderTop: `3px solid ${NEON.blue}`, animation: "spinner 1s linear infinite" }} />
            <div className="text-[0.8rem] font-['Share_Tech_Mono']" style={{ color: NEON.blue }}>AUTHENTICATING IDENTITY...</div>
            <div className="text-[0.7rem] mt-2" style={{ color: NEON.textMuted }}>Establishing secure federated session</div>
          </div>
        )}

        {step === "passkey" && (
          <div style={{ animation: "fade-in 0.4s ease" }}>
            <div className="text-4xl mb-4">🔑</div>
            <NeonText color={NEON.orange} size="1rem">BIND UNIVERSAL PASSKEY</NeonText>
            <div className="text-[0.8rem] my-3 mb-6 leading-relaxed" style={{ color: NEON.textMuted }}>
              Your passkey will be device-bound to this session.<br />No password. No breach. Pure sovereignty.
            </div>
            <NeonButton onClick={handlePasskey} color={NEON.orange} size="lg" className="w-full">
              CREATE PASSKEY & ENTER
            </NeonButton>
          </div>
        )}

        {step === "creating" && (
          <div className="py-5" style={{ animation: "fade-in 0.3s ease" }}>
            <div className="flex justify-center gap-2 mb-5">
              {[0, 1, 2].map(i => <div key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            <div className="text-[0.8rem] font-['Share_Tech_Mono']" style={{ color: NEON.blue }}>INITIALIZING ARCHITECT AI...</div>
            <div className="text-[0.7rem] mt-2" style={{ color: NEON.textMuted }}>Preparing your DIFF sovereignty console</div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
