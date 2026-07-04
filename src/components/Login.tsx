import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { NEON, NeonText, GlassCard, NeonButton } from './UI';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

export const Login = () => {
  const { login, loginWithPasskey, emergencyBypass } = useAuth();
  const [step, setStep] = useState<'landing' | 'creating'>('landing');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email to use your passkey.");
      return;
    }
    try {
      await loginWithPasskey(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Passkey authentication failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await login();
      setStep('creating');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google authentication failed.");
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: NEON.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* Animated grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      {/* Radial glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "70%", left: "20%", width: 400, height: 400, background: "radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <GlassCard style={{ width: 480, padding: "48px 40px", textAlign: "center" }}>
        {/* Logo */}
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ width: 80, height: 80, margin: "0 auto 16px", position: "relative" }}>
            <svg viewBox="0 0 80 80" style={{ width: "100%", filter: `drop-shadow(0 0 12px ${NEON.blue})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
              <text x="40" y="46" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="16" fontWeight="900">AI</text>
            </svg>
          </div>
          <NeonText color={NEON.blue} size="1.6rem" weight={900}>ARCHITECT AI</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.7rem", fontFamily: "'Share Tech Mono'", marginTop: 4, letterSpacing: "0.15em" }}>
            AGAPE SOVEREIGN ENCLAVE 2026
          </div>
        </motion.div>

        {/* Neon separator */}
        <div style={{ height: 1, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", marginBottom: 28, borderRadius: 1, opacity: 0.7 }} />

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-left text-xs text-red-200">
            {error}
          </div>
        )}

        {step === "landing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ color: NEON.text, fontSize: "0.9rem", marginBottom: 8, fontWeight: 500 }}>Digital Identity Federated Footprint</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.78rem", marginBottom: 20, lineHeight: 1.6 }}>
              Authenticate to begin your <span style={{ color: NEON.magenta, fontWeight: 700 }}>DIFF</span> analysis. Your sovereignty begins here.
            </div>
            
            <div style={{ marginBottom: 20, textAlign: "left" }}>
              <input 
                type="email" 
                placeholder="Enter your sovereign email..." 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                style={{ 
                  width: "100%", 
                  padding: "12px 16px", 
                  background: "rgba(0,0,0,0.3)", 
                  border: `1px solid ${emailError ? '#ef4444' : 'rgba(0,212,255,0.2)'}`, 
                  borderRadius: 8, 
                  color: "#fff", 
                  fontFamily: "'Share Tech Mono'", 
                  fontSize: "0.9rem",
                  outline: "none",
                  boxShadow: emailError ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none',
                  transition: "all 0.2s ease"
                }}
              />
              {emailError && (
                <div style={{ color: "#ef4444", fontSize: "0.7rem", marginTop: 6, fontFamily: "'Rajdhani'" }}>
                  {emailError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button 
                className="btn-neon neon-border" 
                onClick={handleGoogleLogin} 
                style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(66,133,244,0.1)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <button 
                className="btn-neon neon-border" 
                onClick={handlePasskeyLogin} 
                style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(0,212,255,0.05)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}
              >
                <Fingerprint width="20" height="20" style={{ color: NEON.blue }} />
                Login with Passkey
              </button>
            </div>
            <div style={{ marginTop: 20, color: NEON.textMuted, fontSize: "0.7rem", lineHeight: 1.5 }}>
              🔒 All data encrypted client-side. Zero-knowledge architecture.<br/>
              Your identity. Your sovereignty. Your rules.
            </div>
            <button 
              onClick={async () => {
                setError(null);
                try {
                  await emergencyBypass();
                  setStep('creating');
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : "Emergency bypass failed.");
                }
              }}
              className="mt-6 text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest font-mono transition-colors"
            >
              [ Initialize Emergency Bypass ]
            </button>
          </motion.div>
        )}

        {step === "creating" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "20px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {[0,1,2].map(i => <div key={i} className="thinking-dot" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
            <div style={{ color: NEON.blue, fontFamily: "'Share Tech Mono'", fontSize: "0.8rem" }}>INITIALIZING ARCHITECT AI...</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.7rem", marginTop: 8 }}>Preparing your DIFF sovereignty console</div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
};
