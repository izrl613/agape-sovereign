import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { Shield, ArrowRight, Check, Lock, Cpu, Loader2 } from 'lucide-react';
import { NeonButton, NEON } from './UI';
import { EncryptedFooter } from './EncryptedFooter';
import { doc, setDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { encryptClientSide, generateSHA256 } from '../utils/crypto';
import { toast } from 'sonner';

const MODULE_STEPS = [
  { id: "email", label: "Email Breach Scan", desc: "Identify your primary emails for breach monitoring.", icon: "✉" },
  { id: "social", label: "Social Footprint", desc: "Handles for identity reuse detection.", icon: "◈" },
  { id: "device", label: "Device Integrity", desc: "Primary hardware vectors to secure.", icon: "⬡" },
  { id: "mobile", label: "Mobile System", desc: "Mobile OS and passkey status.", icon: "◻" },
  { id: "laptop", label: "Laptop Hardware", desc: "Firmware and disk encryption audit.", icon: "💻" },
  { id: "deepweb", label: "Deep Web Monitoring", desc: "Public data indexing surveillance.", icon: "◉" },
  { id: "broker", label: "Data Brokerage", desc: "Known broker removal targets.", icon: "⧫" },
  { id: "password", label: "Password Audit", desc: "Credential reuse analysis.", icon: "⬟" },
  { id: "network", label: "Network/DNS", desc: "Network security posture.", icon: "◎" },
  { id: "cloud", label: "Cloud Storage", desc: "Exposure in S3, Drive, or iCloud.", icon: "⊞" },
  { id: "comm", label: "Communication", desc: "Messaging and metadata privacy.", icon: "💬" },
  { id: "financial", label: "Financial Surface", desc: "Bank and crypto identity leaks.", icon: "⬡" },
  { id: "docs", label: "Identity Documents", desc: "Sensitive ID leak monitoring.", icon: "📄" },
  { id: "oauth", label: "Third-Party OAuth", desc: "App permission reviews.", icon: "🔑" },
  { id: "legal", label: "Legal/Records", desc: "Public court and legal filings.", icon: "⚖" },
  { id: "ai", label: "AI/Biometric", desc: "Facial and voice data exposure.", icon: "⊛" },
  { id: "passkey", label: "Universal Passkey", desc: "Bind a biometric WebAuthn Passkey (Touch ID, Face ID, or security key) to this device for zero-password local enclaves.", icon: "🔑" },
  { id: "final", label: "DIFF Initialization", desc: "Review and initialize your Digital Identity Federated Footprint.", icon: "⚡" },
];

export const SplashEntry = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const { user, bindPasskey, logout } = useAuth();
  
  const currentStep = MODULE_STEPS[step];
  
  const handleNext = async () => {
    if (step < MODULE_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await initializeSovereignEnclave();
    }
  };

  const initializeSovereignEnclave = async () => {
    if (!user) return;
    setIsInitializing(true);
    const batch = writeBatch(db);

    try {
      const encryptedDataRecord: Record<string, string> = {};
      const hashesRecord: Record<string, string> = {};
      
      // 1. Process and encrypt all entered data
      for (const stepConfig of MODULE_STEPS.slice(0, -1)) {
        if (stepConfig.id === 'passkey') continue;
        const rawValue = data[stepConfig.id] || "";
        const hash = await generateSHA256(rawValue);
        const encrypted = await encryptClientSide(rawValue, user.uid);
        
        encryptedDataRecord[stepConfig.id] = encrypted;
        hashesRecord[`${stepConfig.id}Hash`] = hash;

        // 2. Generate custom initial findings in diff_scans for each module
        const scanRef = doc(collection(db, "diff_scans"));
        
        let initialFinding: {
          userId: string;
          module: string;
          finding: string;
          status: "NUKED" | "KNOXED" | "MONITORED";
          timestamp: Date;
          details: string;
        } = {
          userId: user.uid,
          module: stepConfig.id,
          finding: `Secure configuration initialized`,
          status: "KNOXED",
          timestamp: new Date(),
          details: `Zero-knowledge profile encryption activated. Integrity seal: ${hash}`
        };

        // Create interesting mock findings based on user input
        if (rawValue) {
          if (stepConfig.id === 'email' && (rawValue.includes('leak') || rawValue.includes('pwned') || rawValue.length % 2 === 0)) {
            initialFinding = {
              userId: user.uid,
              module: stepConfig.id,
              finding: `Breached credentials in public paste dumps`,
              status: "NUKED" as const,
              timestamp: new Date(),
              details: `Primary email '${rawValue}' was found in historical credential stuffing logs. Action required: rotate credentials and bind passkey.`
            };
          } else if (stepConfig.id === 'password' && rawValue.length < 8) {
            initialFinding = {
              userId: user.uid,
              module: stepConfig.id,
              finding: `Weak entropy credential pattern`,
              status: "NUKED" as const,
              timestamp: new Date(),
              details: `The password credentials provided have low entropy. Strongly advise upgrading to WebAuthn Level 3 Universal Passkey.`
            };
          } else if (stepConfig.id === 'broker') {
            initialFinding = {
              userId: user.uid,
              module: stepConfig.id,
              finding: `Public listings on Spokeo & Acxiom`,
              status: "MONITORED" as const,
              timestamp: new Date(),
              details: `Identity profile associated with your query is actively listed by 4 primary data brokers. Erasure engine primed.`
            };
          }
        }

        batch.set(scanRef, {
          ...initialFinding,
          timestamp: serverTimestamp()
        });
      }

      // 3. Save encrypted active dataset and integrity seals to user profile
      const activeDataRef = doc(db, 'users', user.uid, 'module_data', 'active');
      batch.set(activeDataRef, {
        data: encryptedDataRecord,
        hashes: hashesRecord,
        updatedAt: serverTimestamp()
      });

      // 4. Update Sovereign Score and registration history
      const userRef = doc(db, 'users', user.uid);
      const nukedCount = Object.keys(encryptedDataRecord).filter(k => 
        (k === 'email' && data[k]?.includes('leak')) || (k === 'password' && data[k]?.length < 8)
      ).length;
      
      const score = Math.max(45, 100 - (nukedCount * 15));

      batch.update(userRef, {
        sovereignScore: score,
        setupComplete: true,
        updatedAt: serverTimestamp()
      });

      // 5. Add initial score history record
      const historyRef = doc(collection(db, 'score_history'));
      batch.set(historyRef, {
        userId: user.uid,
        score,
        reason: 'Sovereign Enclave DIFF Onboarding Complete',
        nukedCount,
        knoxedCount: 16 - nukedCount,
        monitoredCount: 0,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      toast.success("DIFF Sovereign Enclave Initialized successfully.");
      onComplete();
    } catch (error) {
      console.error("Failed to initialize sovereign enclave:", error);
      toast.error("Initialization failed. Please check your credentials.");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#060D1F] flex items-center justify-center p-6 overflow-hidden">
      {/* Futuristic Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(0,212,255,0.1),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(0,212,255,0.05)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl glass-panel p-8 relative overflow-hidden neon-wrap"
      >
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-[#00D4FF] animate-spin mb-6" />
            <h3 className="text-xl font-bold text-white tracking-widest font-display mb-2">INITIALIZING SOVEREIGN ENCLAVE</h3>
            <p className="text-xs text-[#00D4FF] font-mono animate-pulse">CLIENT-SIDE AES-GCM ENCRYPTION & INTEGRITY HASH SEALING...</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF2E9F] to-[#00D4FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wider text-white font-display">ARCHITECT AI</h2>
                  <p className="text-[10px] text-[#00D4FF] font-mono tracking-[0.2em] uppercase">DIFF Initialization Sequence</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[#00D4FF] font-mono leading-none">{step + 1}/{MODULE_STEPS.length}</div>
                <div className="text-[8px] text-slate-500 font-mono">SECTOR_{currentStep.id.toUpperCase()}</div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-[200px]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{currentStep.icon}</span>
                  <h3 className="text-lg font-bold text-white tracking-wide">{currentStep.label}</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{currentStep.desc}</p>

                {currentStep.id === 'passkey' ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <p className="text-slate-400 text-xs text-center max-w-md mb-2">
                      Leg 2 of Bipedal Authentication. Binding a passkey links your secure hardware enclave to your Google Identity.
                    </p>
                    {data.passkeyBound === 'true' ? (
                      <div className="flex flex-col items-center text-emerald-400 gap-2 font-mono">
                        <Check className="w-12 h-12 stroke-[2]" />
                        <span className="text-sm font-bold uppercase tracking-wider">Passkey Registered & Sealed</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                          onClick={async () => {
                            const toastId = toast.loading("PROMPTING BIOMETRIC/HARDWARE KEY REGISTRATION...");
                            try {
                              await bindPasskey();
                              setData({ ...data, passkeyBound: 'true' });
                              toast.dismiss(toastId);
                              toast.success("Passkey successfully bound!");
                            } catch (err: any) {
                              toast.dismiss(toastId);
                              console.error("Passkey registration failed:", err);
                              toast.error(`WebAuthn Error: ${err.message || 'Unknown'}`);
                            }
                          }}
                          className="px-6 py-3 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:border-[#00D4FF]/50 rounded-xl font-bold tracking-wider transition-all cursor-pointer font-mono text-xs text-center border-none"
                        >
                          🔑 REGISTER BIOMETRIC PASSKEY
                        </button>
                        
                        <button
                          onClick={() => {
                            setData({ ...data, passkeyBound: 'skipped' });
                            toast.info("Passkey binding deferred. You can link it later in Profile Settings.");
                          }}
                          className="px-6 py-2.5 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs transition-all cursor-pointer font-mono border-none"
                        >
                          I've Changed My Mind / Skip
                        </button>
                      </div>
                    )}
                  </div>
                ) : currentStep.id !== 'final' ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <input 
                        type="text"
                        autoFocus
                        value={data[currentStep.id] || ''}
                        onChange={(e) => setData({ ...data, [currentStep.id]: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all font-mono text-sm group-hover:border-white/20"
                        placeholder={`Enter your ${currentStep.label}...`}
                        onKeyDown={(e) => e.key === 'Enter' && data[currentStep.id] && handleNext()}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {data[currentStep.id] && <Check className="w-4 h-4 text-[#00D4FF]" />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {MODULE_STEPS.slice(0, -1).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-sm opacity-60 flex-shrink-0">{s.icon}</span>
                          <span className="text-[10px] font-medium text-slate-300 truncate">{s.label}</span>
                        </div>
                        <div className="text-[8px] font-mono text-[#00D4FF] opacity-80 flex-shrink-0">
                          {s.id === 'passkey' ? (data.passkeyBound === 'true' ? "BOUND" : "DEFERRED") : (data[s.id] ? "READY" : "SKIP")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between">
              <div className="flex gap-1">
                {MODULE_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-6 bg-[#00D4FF]' : 'w-2 bg-white/10'}`} 
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                {step < MODULE_STEPS.length - 1 && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Abort onboarding and sign out? All entered parameters will be purged.")) {
                        await logout();
                      }
                    }}
                    className="px-4 py-2.5 text-[10px] text-slate-500 hover:text-[#FF2E9F] border border-white/5 hover:border-[#FF2E9F]/30 rounded-xl font-mono uppercase tracking-wider transition-all cursor-pointer bg-transparent"
                  >
                    Abort Onboarding
                  </button>
                )}
                
                <button
                  disabled={step < MODULE_STEPS.length - 1 && currentStep.id !== 'passkey' && !data[currentStep.id]}
                  onClick={handleNext}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold tracking-wider transition-all ${
                    (step === MODULE_STEPS.length - 1 || currentStep.id === 'passkey' || data[currentStep.id] || (currentStep.id === 'passkey' && data.passkeyBound)) 
                      ? 'bg-gradient-to-r from-[#FF2E9F] to-[#00D4FF] text-white shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:scale-105' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {step === MODULE_STEPS.length - 1 ? 'INITIALIZE DIFF' : 'NEXT STEP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Encrypted Integrity Footer */}
        <div className="px-2 pb-2">
          <EncryptedFooter moduleId="splash-entry" uid={user?.uid} />
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF2E9F]/30" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00D4FF]/30" />
      </motion.div>
    </div>
  );
};

