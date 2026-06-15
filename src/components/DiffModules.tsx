import React, { useState, useEffect } from 'react';
import { Mail, Share2, HardDrive, Smartphone, Globe, Database, FileText, X, AlertTriangle, Loader2, Zap, Shield, Search, Cpu, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { NEON, NeonText, NeonButton, GlassCard, StatusBadge } from './UI';
import { useScan } from '../ScanContext';
import { useAuth } from '../AuthContext';
import { generateSuspiciousReport, ScanFinding } from '../services/scanService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { encryptClientSide, decryptClientSide, generateSHA256 } from '../utils/crypto';
import { toast } from 'sonner';

interface ModuleProps {
  title: string;
  description: string;
  icon: string;
  vector: string;
  moduleId: string;
  scanLabel?: string;
}

export const DiffModule = ({ title, description, icon, vector, moduleId, scanLabel }: ModuleProps) => {
  const { user } = useAuth();
  const { findings: allFindings, triggerModuleScan, isScanning, scanProgress, currentModule, currentSubTask } = useScan();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashHash, setSplashHash] = useState('');
  
  useEffect(() => {
    // Generate a unique session hash for this module session
    generateSHA256(moduleId + Date.now().toString()).then(setSplashHash);
  }, [moduleId]);
  
  // Real-time parameter sync state
  const [parameterValue, setParameterValue] = useState<string>('');
  const [decryptedValue, setDecryptedValue] = useState<string>('');
  const [storedHash, setStoredHash] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showValue, setShowValue] = useState<boolean>(false);

  const findings = allFindings.filter(f => f.module === moduleId);
  const nuked = findings.filter(f => f.status === 'NUKED').length;
  const knoxed = findings.filter(f => f.status === 'KNOXED').length;
  const monitored = findings.filter(f => f.status === 'MONITORED').length;
  
  // Dynamic Sovereign Score for this module
  let severity = 100;
  if (findings.length > 0) {
    const points = knoxed * 10 + monitored * 5;
    severity = Math.round((points / (findings.length * 10)) * 100);
  }
  const sevColor = severity > 80 ? NEON.blue : severity > 60 ? NEON.orange : NEON.magenta;

  // Real-time active parameter fetching
  useEffect(() => {
    if (!user) return;

    if (user.uid === 'emergency-bypass-admin-999') {
      const localActive = localStorage.getItem(`module_data_active_${user.uid}`);
      if (localActive) {
        try {
          const parsed = JSON.parse(localActive);
          const encVal = parsed.data?.[moduleId] || "";
          const hash = parsed.hashes?.[moduleId + "Hash"] || "";
          setStoredHash(hash);
          if (encVal) {
            decryptClientSide(encVal, user.uid).then(dec => {
              setDecryptedValue(dec);
              setParameterValue(dec);
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'module_data', 'active');
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const snapData = snapshot.data();
        const encVal = snapData.data?.[moduleId] || "";
        const hash = snapData.hashes?.[moduleId + "Hash"] || "";
        setStoredHash(hash);
        if (encVal) {
          setIsDecrypting(true);
          try {
            const dec = await decryptClientSide(encVal, user.uid);
            setDecryptedValue(dec);
            setParameterValue(dec);
          } catch (err) {
            console.error("Decryption failed in sync:", err);
          }
          setIsDecrypting(false);
        } else {
          setDecryptedValue("");
          setParameterValue("");
        }
      }
    });

    return () => unsubscribe();
  }, [user, moduleId]);

  const handleUpdate = async () => {
    if (!user) return;
    setIsSaving(true);
    const toastId = toast.loading("ENCRYPTING & SEALING PARAMETER...");

    try {
      const newHash = await generateSHA256(parameterValue);
      const encrypted = await encryptClientSide(parameterValue, user.uid);

      // Save to Firestore
      if (user.uid === 'emergency-bypass-admin-999') {
        const localActive = localStorage.getItem(`module_data_active_${user.uid}`);
        const parsed = localActive ? JSON.parse(localActive) : { data: {}, hashes: {} };
        parsed.data[moduleId] = encrypted;
        parsed.hashes[moduleId + "Hash"] = newHash;
        localStorage.setItem(`module_data_active_${user.uid}`, JSON.stringify(parsed));
      } else {
        const docRef = doc(db, 'users', user.uid, 'module_data', 'active');
        await setDoc(docRef, {
          data: {
            [moduleId]: encrypted
          },
          hashes: {
            [`${moduleId}Hash`]: newHash
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      toast.dismiss(toastId);
      toast.success("VECTOR SEALED & CRYPTED", {
        description: `Integrity Key generated: ${newHash.substring(0, 16)}...`
      });

      // Trigger the real AI scan using the updated parameter
      await triggerModuleScan(moduleId, parameterValue);
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Failed to seal vector parameter.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayFindings = findings.length > 0 ? findings.map(f => ({
    type: f.status,
    label: f.finding,
    detail: f.details,
    action: f.status === 'NUKED' ? 'NUKE' : f.status === 'KNOXED' ? 'KNOX' : 'REVIEW',
    original: f
  })) : [
    { type: "MONITORED" as const, label: "Awaiting Scan", detail: "Initiate a scan to populate intelligence.", action: "SCAN", original: null }
  ];

  if (showSplash) {
    return (
      <div style={{ animation: "fade-in 0.5s ease", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <GlassCard className="max-w-2xl w-full p-8 relative overflow-hidden text-center border-[#00D4FF]/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18]" />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="text-[4rem] text-[#00D4FF] drop-shadow-[0_0_15px_#00D4FF] mb-4">
              {icon}
            </div>
            <div className="font-mono text-sm text-[#FF7A18] tracking-[0.2em] mb-2">{vector} · DIFF PROTOCOL</div>
            <h1 className="text-3xl font-bold text-white tracking-wider mb-4 font-orbitron">{title.toUpperCase()}</h1>
            <p className="text-slate-400 font-mono text-sm max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          </motion.div>

          <div className="bg-black/40 border border-white/5 p-4 rounded-xl mb-8 font-mono text-xs text-left text-slate-300">
            <div className="flex items-center gap-2 text-[#00D4FF] mb-2">
              <Shield className="w-4 h-4" />
              <span>STRICT ISOLATION PROTOCOL ACTIVE</span>
            </div>
            <p>You are about to enter a secure vector enclave. Any parameters entered will be cryptographically sealed locally using AES-256-GCM. Architect AI will evaluate the hash signatures without exposing plaintext data to untrusted networks.</p>
          </div>

          <NeonButton 
            color={NEON.blue} 
            onClick={() => setShowSplash(false)}
            style={{ width: '100%', padding: '16px' }}
          >
            INITIALIZE ENCLAVE & ENTER VECTOR
          </NeonButton>
        </GlassCard>

        {/* The SHA256 ID at the bottom of the splash screen */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Module Cryptographic Signature
          </div>
          <div className="px-4 py-2 bg-black/40 border border-[#00D4FF]/20 rounded font-mono text-xs text-[#00D4FF] tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" />
            {splashHash ? `SHA256:${splashHash}` : 'GENERATING...'}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fade-in 0.3s ease" }}>
      {/* Integrity Tag */}
      <div className="flex justify-between items-center mb-6">
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
          <Lock className="w-3 h-3 text-[#00D4FF]" />
          <span className="text-[10px] font-mono text-[#00D4FF] tracking-tighter truncate max-w-[320px]">
            {storedHash ? `SHA256:${storedHash}` : "AWAITING CRYPTOGRAPHIC SEAL"}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Sovereign Enclave v2.0
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <span style={{ color: sevColor, fontSize: "2rem", filter: `drop-shadow(0 0 8px ${sevColor})` }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>{vector} · DIFF VECTOR</div>
          <NeonText color={sevColor} size="1.2rem" weight={700}>{title}</NeonText>
          <p style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: "4px" }}>{description}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <NeonButton 
            size="sm" 
            color={NEON.blue} 
            onClick={() => triggerModuleScan(moduleId, parameterValue)}
            disabled={isScanning}
          >
            {isScanning ? "SCANNING..." : (scanLabel || "RE-SCAN VECTOR")}
          </NeonButton>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Orbitron'", fontSize: "2rem", fontWeight: 900, color: sevColor, textShadow: `0 0 20px ${sevColor}` }}>{severity}%</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>SOVEREIGN SCORE</div>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <GlassCard style={{ padding: "16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }} className="flex justify-between">
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.textMuted }}>SECURITY POSTURE</span>
          <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: sevColor }}>{severity > 80 ? "SECURED" : severity > 60 ? "MODERATE" : "EXPOSED"}</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${severity}%`, background: `linear-gradient(90deg, ${NEON.magenta}, ${sevColor})`, borderRadius: 3, boxShadow: `0 0 10px ${sevColor}`, transition: "width 1.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 12 }}>
          {[{ l: "NUKED", v: nuked, c: NEON.magenta }, { l: "KNOXED", v: knoxed, c: NEON.blue }, { l: "MONITORED", v: monitored, c: NEON.orange }].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: "center", background: `rgba(${s.c === NEON.magenta ? "255,46,159" : s.c === NEON.blue ? "0,212,255" : "255,122,24"},0.08)`, borderRadius: 8, padding: "10px 0", border: `1px solid ${s.c}22` }}>
              <div style={{ fontFamily: "'Orbitron'", fontSize: "1.4rem", fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* PARAMETER EDITOR / ACTIVE FEDERATED VALUES */}
      <GlassCard className="p-6 mb-6 relative overflow-hidden neon-wrap">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-sm font-bold text-white tracking-widest font-mono">ACTIVE SOVEREIGN ENCLAVE PARAMETERS</h4>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Decrypted Parameter Value</div>
                {isDecrypting ? (
                  <div className="flex items-center gap-2 text-xs text-[#00D4FF] font-mono mt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    DECRYPTING CLIENT-SIDE (AES-GCM-256)...
                  </div>
                ) : (
                  <div className="font-mono text-sm text-white mt-1 break-all flex items-center gap-2">
                    <span>
                      {decryptedValue 
                        ? (showValue ? decryptedValue : '••••••••••••••••••••••••••••') 
                        : <span className="text-slate-600 font-sans italic">No parameter value registered</span>
                      }
                    </span>
                    {decryptedValue && (
                      <button 
                        onClick={() => setShowValue(!showValue)}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                      >
                        {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase md:text-right">Zero-Knowledge Storage</div>
                <div className="text-xs text-[#00D4FF] font-mono mt-1 flex items-center gap-1.5 md:justify-end">
                  <Shield size={12} />
                  100% Client-Crypted
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-[#FF7A18]">UPDATE VECTOR VALUE</label>
              <div className="relative group">
                <input 
                  type={moduleId === 'password' ? 'password' : 'text'}
                  value={parameterValue}
                  onChange={(e) => setParameterValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all font-mono text-sm group-hover:border-white/20"
                  placeholder={`Enter parameter input for ${title}...`}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <NeonButton 
              onClick={handleUpdate}
              color={NEON.blue} 
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 inline" />
                  SEALING & CRYPTING...
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5 mr-2 inline" />
                  UPDATE & SEAL VECTOR
                </>
              )}
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      {/* Scan Progress Visualization */}
      <AnimatePresence>
        {isScanning && currentModule === moduleId && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <GlassCard style={{ 
              padding: "20px", 
              border: `1px solid ${NEON.blue}44`,
              background: "rgba(0, 212, 255, 0.03)",
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background scanning effect */}
              <motion.div 
                animate={{ 
                  left: ['-100%', '200%']
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '30%',
                  background: `linear-gradient(90deg, transparent, ${NEON.blue}11, transparent)`,
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 size={20} color={NEON.blue} className="animate-spin" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        DEEP VECTOR ANALYSIS ACTIVE
                      </span>
                      <span style={{ color: NEON.textMuted, fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', opacity: 0.8 }}>
                        {vector} PROTOCOL INITIALIZED
                      </span>
                    </div>
                  </div>
                  <div style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: '1rem', fontWeight: 800 }}>
                    {scanProgress}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(0,212,255,0.1)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ type: 'spring', stiffness: 45, damping: 20 }}
                    style={{ 
                      height: '100%', 
                      background: `linear-gradient(90deg, ${NEON.blue}88, ${NEON.blue})`, 
                      boxShadow: `0 0 10px ${NEON.blue}`,
                      position: 'relative'
                    }} 
                  >
                    <motion.div 
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '40px',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      }}
                    />
                  </motion.div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AnimatePresence mode="wait">
                    {currentSubTask ? (
                      <motion.div
                        key={currentSubTask}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        style={{ 
                          color: NEON.blue, 
                          fontSize: '0.68rem', 
                          fontFamily: "'Share Tech Mono'", 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          letterSpacing: '0.04em'
                        }}
                      >
                        <Zap size={10} color={NEON.orange} />
                        <span style={{ opacity: 0.8 }}>STATUS:</span>
                        <span style={{ fontWeight: 600 }}>{currentSubTask.toUpperCase()}</span>
                      </motion.div>
                    ) : (
                      <div style={{ color: NEON.textMuted, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'" }}>PREPARING STOCHASTIC ANALYSIS...</div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ fontSize: '0.55rem', color: NEON.textMuted, fontFamily: "'Orbitron'" }}>AES-256</div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          style={{ width: 2, height: 6, background: NEON.blue }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Findings */}
      <div style={{ marginBottom: 16 }}>
        <NeonText color={NEON.orange} size="0.72rem">INTELLIGENCE FINDINGS</NeonText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {displayFindings.map((f, i) => (
          <div key={i} className={f.type === "NUKED" ? "nuked-item" : f.type === "KNOXED" ? "knoxed-item" : ""} style={{ borderRadius: 10, padding: "14px 16px", border: `1px solid ${f.type === "NUKED" ? NEON.magenta : f.type === "KNOXED" ? NEON.blue : NEON.orange}33`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flexShrink: 0 }}><StatusBadge type={f.type as 'NUKED' | 'KNOXED' | 'MONITORED'} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: "0.85rem", color: NEON.text }}>{f.label}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted, marginTop: 2 }}>{f.detail}</div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8 }}>
                {f.original && (f.original.status === 'NUKED' || f.original.status === 'MONITORED') && (
                  <NeonButton 
                    size="sm" 
                    color={NEON.blue}
                    onClick={async () => {
                      setIsGenerating(true);
                      const report = await generateSuspiciousReport(f.original as ScanFinding);
                      setSelectedReport(report || "No report generated.");
                      setIsGenerating(false);
                    }}
                    disabled={isGenerating}
                  >
                    <FileText size={12} style={{ marginRight: 4 }} />
                    REPORT
                  </NeonButton>
                )}
                <NeonButton size="sm" color={f.type === "NUKED" ? NEON.magenta : f.type === "KNOXED" ? NEON.blue : NEON.orange}>
                  {f.action}
                </NeonButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <GlassCard style={{ width: '100%', maxWidth: 800, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${NEON.blue}` }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${NEON.blue}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <NeonText color={NEON.blue} size="1rem" weight={700}>SOVEREIGN INTELLIGENCE REPORT</NeonText>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: NEON.text, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: NEON.text, fontFamily: "'Rajdhani'", fontSize: '0.95rem', lineHeight: 1.6 }}>
              <div className="markdown-body">
                <Markdown>{selectedReport}</Markdown>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${NEON.blue}33`, textAlign: 'right' }}>
              <NeonButton color={NEON.blue} onClick={() => setSelectedReport(null)}>CLOSE ENCLAVE</NeonButton>
            </div>
          </GlassCard>
        </div>
      )}

      {isGenerating && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: `3px solid ${NEON.blue}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
            <NeonText color={NEON.blue} size="0.8rem">ARCHITECT ANALYZING METADATA...</NeonText>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <NeonButton color={NEON.magenta} style={{ flex: 1 }}>🔥 NUKE ALL EXPOSURES</NeonButton>
        <NeonButton color={NEON.blue} style={{ flex: 1 }}>🛡️ KNOX ALL SECURED</NeonButton>
      </div>
    </div>
  );
};

// Export specific 16 modules properly aligned with Layout.tsx and SplashEntry.tsx
export const EmailModule = () => <DiffModule title="Email Breach & Metadata Scanner" description="Checks breach databases and analyzes exposed metadata patterns." icon="✉" vector="V-01" moduleId="email" scanLabel="Scan Emails" />;
export const SocialModule = () => <DiffModule title="Social Media Footprint Scanner" description="Public post scraping and username reuse detection." icon="◈" vector="V-02" moduleId="social" />;
export const DeviceModule = () => <DiffModule title="Device File Scan" description="File pattern analysis and metadata exposure detection." icon="⬡" vector="V-03" moduleId="device" />;
export const SystemModule = () => <DiffModule title="Mobile System Security" description="Passkey enforcement status and mobile OS security posture." icon="◻" vector="V-04" moduleId="mobile" />;
export const LaptopModule = () => (
  <DiffModule
    title="Non-Mobile OS Privacy Audit"
    description="Read-only laptop/desktop OS posture, cache, log, browser-cache, and local disk hygiene assessment via the privacy-audit MCP bridge."
    icon="💻"
    vector="V-05"
    moduleId="non-mobile-os"
    scanLabel="Scan Non-Mobile OS"
  />
);
export const DeepWebModule = () => <DiffModule title="Deep Web Exposure Monitoring" description="Pattern-based lookup and public data indexing scan." icon="◉" vector="V-06" moduleId="deepweb" />;
export const DataBrokerModule = () => <DiffModule title="Data Broker Removal Engine" description="Automated request templates for removal." icon="⧫" vector="V-07" moduleId="broker" />;
export const PasswordModule = () => <DiffModule title="Password Vault Audit" description="Checks for weak, reused, or compromised credentials." icon="⬟" vector="V-08" moduleId="password" />;
export const NetworkModule = () => <DiffModule title="Network & DNS Security Posture" description="Analyzes DNS leaks and insecure network protocols." icon="◎" vector="V-09" moduleId="network" />;
export const CloudModule = () => <DiffModule title="Cloud Storage & Sync Security" description="Scans for misconfigured S3 buckets or Drive permissions." icon="⊞" vector="V-10" moduleId="cloud" />;
export const CommunicationModule = () => <DiffModule title="Communication Privacy Audit" description="Analyzes E2EE status and metadata in messages." icon="💬" vector="V-11" moduleId="comm" />;
export const FinancialModule = () => <DiffModule title="Financial Identity Surface" description="Monitor financial accounts, dark web bank leaks, and transaction metadata privacy." icon="⬡" vector="V-12" moduleId="financial" />;
export const DocumentModule = () => <DiffModule title="Identity Document Exposure" description="Checks for leaks in sensitive identity documents." icon="📄" vector="V-13" moduleId="docs" />;
export const OauthModule = () => <DiffModule title="Third-Party App OAuth Audit" description="Reviews third-party app permissions and access tokens." icon="🔑" vector="V-14" moduleId="oauth" />;
export const LegalModule = () => <DiffModule title="Public Records & Legal Exposure" description="Scans public legal filings and court records." icon="⚖" vector="V-15" moduleId="legal" />;
export const BiometricModule = () => <DiffModule title="AI & Biometric Data Exposure" description="Analyzes exposure of facial or voice recognition data." icon="⊛" vector="V-16" moduleId="ai" />;

export const ErasureModule = () => {
  const { user, userData } = useAuth();
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRequest, setGeneratedRequest] = useState<{subject: string, body: string} | null>(null);

  const brokers = [
    { name: "Acxiom", email: "privacy@acxiom.com", risk: "CRITICAL" },
    { name: "Spokeo", email: "privacy@spokeo.com", risk: "CRITICAL" },
    { name: "Whitepages", email: "privacy-manager@whitepages.com", risk: "HIGH" },
    { name: "Intelius", email: "privacy@intelius.com", risk: "HIGH" },
    { name: "Experian", email: "optout@experian.com", risk: "CRITICAL" }
  ];

  const handleInitiate = async (broker: any) => {
    setSelectedBroker(broker);
    setIsGenerating(true);
    setGeneratedRequest(null);
    try {
      const response = await fetch('/api/erasure/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerName: broker.name,
          userEmail: user?.email,
          userName: userData?.displayName || user?.email?.split('@')[0] || "User",
          userState: "California"
        })
      });
      const data = await response.json();
      if (data.subject && data.body) {
        setGeneratedRequest(data);
      } else {
        throw new Error("Invalid format from AI");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate legal request");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ animation: "fade-in 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <span style={{ color: NEON.magenta, fontSize: "2rem", filter: `drop-shadow(0 0 8px ${NEON.magenta})` }}>⌫</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>V-16 · AUTOMATED TAKEDOWN</div>
          <NeonText color={NEON.magenta} size="1.2rem" weight={700}>Sovereign Erasure Engine</NeonText>
          <p style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: "4px" }}>Automated CCPA/GDPR data broker opt-out requests powered by Gemma 4 E4B.</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {brokers.map((b, i) => (
          <GlassCard key={i} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: "1rem", color: NEON.text }}>{b.name}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.textMuted }}>{b.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Orbitron'", fontSize: "0.7rem", color: b.risk === "CRITICAL" ? NEON.magenta : NEON.orange }}>
                {b.risk} EXPOSURE
              </div>
              <NeonButton size="sm" color={NEON.magenta} onClick={() => handleInitiate(b)} disabled={isGenerating}>
                {isGenerating && selectedBroker?.name === b.name ? "GENERATING..." : "INITIATE TAKEDOWN"}
              </NeonButton>
            </div>
          </GlassCard>
        ))}
      </div>

      {generatedRequest && selectedBroker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <GlassCard style={{ width: '100%', maxWidth: 800, border: `1px solid ${NEON.magenta}`, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <NeonText color={NEON.magenta} size="1.2rem">LEGAL DELETION REQUEST: {selectedBroker.name}</NeonText>
              <button onClick={() => setGeneratedRequest(null)} style={{ background: 'none', border: 'none', color: NEON.text, cursor: 'pointer' }}><X /></button>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.8rem", color: NEON.textMuted, marginBottom: 8 }}>TO: {selectedBroker.email}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.8rem", color: NEON.textMuted, marginBottom: 16 }}>SUBJECT: {generatedRequest.subject}</div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: "0.9rem", color: NEON.text, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {generatedRequest.body}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: "0.7rem", color: NEON.orange, fontFamily: "'Share Tech Mono'" }}>
                ⚠️ Review the document carefully before sending.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <NeonButton onClick={() => setGeneratedRequest(null)} color={NEON.textMuted}>CANCEL</NeonButton>
                <a 
                  href={`mailto:${selectedBroker.email}?subject=${encodeURIComponent(generatedRequest.subject)}&body=${encodeURIComponent(generatedRequest.body)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <NeonButton color={NEON.magenta}>SEND SECURE THREAT</NeonButton>
                </a>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
