import { toast } from 'sonner';
import { updateFindingStatus } from '../services/scanService';
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { NEON } from './UI';
import { motion, AnimatePresence } from 'framer-motion';
import { PasskeyLockOverlay } from './auth/PasskeyLockOverlay';
import { passkeyLockService } from '../services/passkeyLockService';
import { EncryptedFooter } from './EncryptedFooter';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { calculateEnhancedSovereignScore, calculateSovereignScoreWithDetails } from '../services/scanService';
import { Cpu, Lock, ShieldCheck, FileText, Sparkles, ArrowRight, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { ThirdPartyVerificationModal } from './ThirdPartyVerificationModal';

// Header component for neon title
const Header = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      marginBottom: 32,
      textAlign: 'center',
      fontFamily: "'Orbitron', monospace",
      fontSize: '2.5rem',
      fontWeight: 900,
      color: '#fff',
      textShadow: `0 0 20px ${NEON.magenta}, 0 0 40px ${NEON.magenta}`,
      letterSpacing: '0.15em',
    }}
  >
    SOVEREIGN DASHBOARD
  </motion.div>
);

const MODULE_CONFIG = [
  { id: "email",      icon: "✉", label: "Email Breach Scanner",        vector: "V-01" },
  { id: "social",     icon: "◈", label: "Social Media Footprint",       vector: "V-02" },
  { id: "device",     icon: "⬡", label: "Device File Scan",             vector: "V-03" },
  { id: "mobile",     icon: "◻", label: "Mobile Security Layer",        vector: "V-04" },
  { id: "laptop",     icon: "💻", label: "Laptop System Security",      vector: "V-05" },
  { id: "deepweb",    icon: "◉", label: "Deep Web Exposure",            vector: "V-06" },
  { id: "broker",     icon: "⧫", label: "Data Broker Removal",          vector: "V-07" },
  { id: "password",   icon: "⬟", label: "Password Vault Analysis",      vector: "V-08" },
  { id: "network",    icon: "◎", label: "Network & DNS Security",       vector: "V-09" },
  { id: "cloud",      icon: "⊞", label: "Cloud Storage Exposure",       vector: "V-10" },
  { id: "comm",       icon: "💬", label: "Communication Privacy",        vector: "V-11" },
  { id: "financial",  icon: "⬡", label: "Financial Identity Surface",   vector: "V-12" },
  { id: "docs",       icon: "📄", label: "Identity Document Exposure",  vector: "V-13" },
  { id: "oauth",      icon: "🔑", label: "Third-Party OAuth Audit",     vector: "V-14" },
  { id: "legal",      icon: "⚖", label: "Public Records & Legal",       vector: "V-15" },
  { id: "ai",         icon: "⊛", label: "AI & Biometric Exposure",      vector: "V-16" },
];

const MODULE_ROUTES: Record<string, string> = {
  email:     "/dashboard/email",
  social:    "/dashboard/social",
  device:    "/dashboard/device",
  mobile:    "/dashboard/system",
  laptop:    "/dashboard/laptop",
  deepweb:   "/dashboard/deepweb",
  broker:    "/dashboard/databroker",
  password:  "/dashboard/password",
  network:   "/dashboard/network",
  cloud:     "/dashboard/cloud",
  comm:      "/dashboard/communication",
  financial: "/dashboard/financial",
  docs:      "/dashboard/documents",
  oauth:     "/dashboard/oauth",
  legal:     "/dashboard/legal",
  ai:        "/dashboard/ai",
};

const StatusCard = ({ label, count, color, glow, classification }: { label: string; count: number; color: string; glow: string; classification?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      flex: 1,
      minWidth: 180,
      position: 'relative',
      background: `${color}11`,
      border: `1px solid ${color}44`,
      borderTop: `4px solid ${color}`,
      boxShadow: `inset 0 0 20px ${color}11, 0 4px 20px ${glow}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
    }}
  >
    <div style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: '3.5rem',
      fontWeight: 900,
      color: '#fff',
      textShadow: `0 0 20px ${color}`,
      lineHeight: 1,
      marginBottom: 12,
      position: 'relative',
    }}>
      {count}
    </div>
    <div style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: '0.9rem',
      fontWeight: 800,
      color,
      letterSpacing: '0.25em',
      position: 'relative',
      textTransform: 'uppercase'
    }}>
      {label}
    </div>
  </motion.div>
);

const FindingCard = ({ finding }: { finding: any }) => {
  const statusColor = finding.status === 'NUKED' ? NEON.magenta : finding.status === 'KNOXED' ? NEON.blue : NEON.orange;
  const statusIcon = finding.status === 'NUKED' ? '🔥' : finding.status === 'KNOXED' ? '🛡️' : '👁️';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        padding: '24px 32px',
        position: 'relative',
        background: `linear-gradient(90deg, ${statusColor}22 0%, rgba(11,16,32,0.6) 100%)`,
        border: `1px solid ${statusColor}55`,
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)',
        boxShadow: `0 4px 15px rgba(0,0,0,0.3)`,
        marginBottom: 16,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#fff',
            textShadow: `0 0 10px ${statusColor}55`,
            marginBottom: 8,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: '1.5rem' }}>{statusIcon}</span>
            {finding.finding}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            marginBottom: 16,
            maxWidth: '90%'
          }}>
            {finding.details}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${statusColor}33`, paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 16px',
              background: `${statusColor}33`,
              borderRadius: 16,
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.1em',
              textShadow: `0 0 5px ${statusColor}`,
            }}>
              {finding.status}
            </span>
            <span style={{
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.1em',
            }}>
              {finding.module?.toUpperCase()} · {finding.timestamp?.toLocaleTimeString?.() || '—'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 24px',
                borderRadius: 4,
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.4)',
                color: NEON.blue,
                fontFamily: "'Orbitron', monospace",
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              📄 REPORT
            </motion.button>
            {finding.status === 'NUKED' && (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON.magenta}66` }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 32px',
                  borderRadius: 4,
                  background: `${NEON.magenta}44`,
                  border: `1px solid ${NEON.magenta}`,
                  color: '#fff',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  textShadow: `0 0 8px ${NEON.magenta}`,
                }}
              >
                NUKE
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Dashboard = () => {
  const { user, sovereignScore, sovereignHash, demoMode } = useAuth();
  const { findings, isLoading, isScanning, scanProgress, currentStep, totalSteps, currentModule, lastScanDate, error, triggerFullScan } = useScan();
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(passkeyLockService.getState().identityLocked && passkeyLockService.getState().identityEnabled);

  useEffect(() => {
    return passkeyLockService.subscribe(state => {
      setIsLocked(state.identityLocked && state.identityEnabled);
    });
  }, []);

  const stats = useMemo(() => {
    const nuked = findings.filter(f => f.status === 'NUKED').length;
    const knoxed = findings.filter(f => f.status === 'KNOXED').length;
    const monitored = findings.filter(f => f.status === 'MONITORED').length;
    return { nuked, knoxed, monitored };
  }, [findings]);

  const sovereignScoreData = useMemo(() => {
    return calculateSovereignScoreWithDetails(findings);
  }, [findings]);

  const currentModuleLabel = useMemo(() => {
    if (!currentModule) return "";
    return MODULE_CONFIG.find(m => m.id === currentModule)?.label || currentModule.toUpperCase();
  }, [currentModule]);

  const handleNukeAll = async () => {
    if (findings.length === 0) return;
    toast.info("Remediating all detected exposures via Sovereign Enclave...");
    for (const f of findings) {
      if (f.status === "NUKED" && f.id) {
        await updateFindingStatus(f.id, "KNOXED");
      }
    }
    toast.success("All exposures remediated & sealed.");
  };

  const handleKnoxAll = async () => {
    if (findings.length === 0) return;
    toast.info("Enforcing KNOXED security state on all monitored vectors...");
    for (const f of findings) {
      if (f.id) {
        await updateFindingStatus(f.id, "KNOXED");
      }
    }
    toast.success("All vectors locked in KNOXED status.");
  };

  const [isThirdPartyModalOpen, setIsThirdPartyModalOpen] = useState(false);

  const dashboardVectorData = useMemo(() => {
    const data: Record<string, any> = {};
    for (const mod of MODULE_CONFIG) {
      data[mod.id] = {
        vector: mod.vector,
        label: mod.label,
        status: stats.nuked > 0 ? 'MONITORED' : 'KNOXED',
        sha256Hash: sovereignHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        details: `Active in Sovereign Matrix · ${mod.label}`,
        fieldsCount: 4,
      };
    }
    return data;
  }, [stats, sovereignHash]);

  return (
    <div style={{ position: 'relative', padding: '16px' }}>
      <PasskeyLockOverlay zone="identity" />
        <Header />

      <div style={{
        animation: "fade-in 0.4s ease",
        filter: isLocked ? 'blur(12px)' : 'none',
        transition: 'filter 0.3s ease',
        pointerEvents: isLocked ? 'none' : 'auto',
      }}>
        {/* Architect AI Cognitive Engine HUD Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#060d1f] via-[#08132e] to-[#040914] border border-[#00d4ff]/40 shadow-[0_0_30px_rgba(0,212,255,0.12)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" /> ARCHITECT AI MODEL: nemotron-3-nano:4b (2.8GB OFFLINE)
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] font-mono text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ZERO-KNOWLEDGE ENCLAVE
                </div>
              </div>

              <h2 className="text-xl font-orbitron font-extrabold text-white tracking-wide">
                16 IDENTITY VECTORS <span className="text-[#00d4ff]">INTEGRITY MATRIX</span>
              </h2>
              <p className="text-xs font-mono text-slate-400 max-w-xl">
                All 16 identity vector modules are encrypted client-side using AES-GCM 256-bit cryptography with SHA-256 integrity seals. Architect AI processes data locally via <span className="text-emerald-400 font-bold">nemotron-3-nano:4b</span>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsThirdPartyModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-cyan-500 hover:from-cyan-400 hover:to-[#00d4ff] text-slate-950 font-orbitron font-bold text-xs shadow-lg shadow-[#00d4ff]/20 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> VERIFY & EXPORT PASSPORT
              </button>
            </div>
          </div>
        </motion.div>

        {/* Card hover effect */}
        <motion.div whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${NEON.magenta}` }} style={{
          display: 'flex',
          gap: 16,
          marginBottom: 40,
        }}>
          <StatusCard label="NUKED" count={stats.nuked} color={NEON.magenta} glow={`${NEON.magenta}22`} />
          <StatusCard label="KNOXED" count={stats.knoxed} color={NEON.blue} glow={`${NEON.blue}22`} />
          <StatusCard label="MONITORED" count={stats.monitored} color={NEON.orange} glow={`${NEON.orange}22`} />
        </motion.div>

        {/* ── 16 Identity Vector Modules Navigation Grid ── */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.85rem',
            fontWeight: 800,
            color: NEON.blue,
            letterSpacing: '0.15em',
            textShadow: `0 0 10px ${NEON.blue}55`
          }}>
            16 IDENTITY VECTOR MODULES
          </span>
          <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${NEON.blue}88, transparent)` }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {MODULE_CONFIG.map((mod) => (
            <motion.div
              key={mod.id}
              whileHover={{ scale: 1.03, translateY: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(MODULE_ROUTES[mod.id] || `/dashboard/${mod.id}`)}
              className="p-4 rounded-xl bg-[#060d1f]/80 hover:bg-[#0a1633] border border-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all cursor-pointer group flex flex-col justify-between h-28 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]">{mod.icon}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] font-mono text-[9px] font-bold">
                  {mod.vector}
                </span>
              </div>
              <div>
                <div className="font-orbitron font-bold text-xs text-white group-hover:text-[#00d4ff] transition-colors truncate">
                  {mod.label}
                </div>
                <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 flex items-center justify-between mt-1">
                  <span>CONFIGURE & SEAL</span>
                  <ArrowRight className="w-3 h-3 text-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Intelligence Findings ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.85rem',
            fontWeight: 800,
            color: NEON.orange,
            letterSpacing: '0.15em',
            textShadow: `0 0 10px ${NEON.orange}55`
          }}>
            INTELLIGENCE FINDINGS
          </span>
          <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${NEON.orange}88, transparent)` }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{
                padding: '20px 24px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 80, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ width: 120, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div style={{ height: 16, width: '80%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
                <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
              </div>
            ))
          ) : findings.length > 0 ? (
            findings.slice(0, 5).map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))
          ) : (
            <div style={{
              padding: '60px 24px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              background: 'rgba(0,212,255,0.02)',
              border: '1px solid rgba(0,212,255,0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.2 }}>⬡</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '1rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>
                NO INTELLIGENCE FINDINGS DETECTED
              </div>
              <div style={{ fontSize: '0.75rem', color: NEON.blue, marginTop: 8, opacity: 0.8 }}>
                Awaiting scan initialization...
              </div>
            </div>
          )}
        </div>

        {/* ── Scanning Progress ── */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              marginBottom: 40,
              padding: '24px 32px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              background: `${NEON.orange}08`,
              border: `1px solid ${NEON.orange}33`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.85rem',
                color: NEON.orange,
                letterSpacing: '0.1em'
              }}>
                V-VECTOR {currentStep + 1}/{totalSteps}: {currentModuleLabel}
              </span>
              <span style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.85rem',
                color: NEON.orange,
                fontWeight: 700
              }}>
                {scanProgress}% ANALYZED
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${NEON.orange}, ${NEON.magenta})`,
                  boxShadow: `0 0 15px ${NEON.orange}`,
                }}
              />
            </div>
          </motion.div>
        )}

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginBottom: 40 }}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${NEON.blue}66` }}
            whileTap={{ scale: 0.98 }}
            onClick={triggerFullScan}
            disabled={isScanning}
            style={{
              padding: '16px 32px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              background: `linear-gradient(135deg, ${NEON.blue}30 0%, ${NEON.magenta}30 100%)`,
              border: `1px solid ${NEON.blue}`,
              color: '#FFFFFF',
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: `0 0 20px rgba(0,212,255,0.3)`
            }}
          >
            {isScanning ? '⚡ SCANNING...' : '🚀 RUN LIVE DIFF SCAN'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${NEON.blue}44` }}
            whileTap={{ scale: 0.98 }}
            onClick={handleKnoxAll}
            disabled={isScanning}
            style={{
              padding: '16px 32px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              background: `linear-gradient(135deg, ${NEON.blue}20 0%, ${NEON.blue}08 100%)`,
              border: `1px solid ${NEON.blue}44`,
              color: NEON.blue,
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            🛡️ KNOX ALL SECURED
          </motion.button>
        </div>

        {/* ── Encrypted Footer Seal ── */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(0,212,255,0.02)',
          border: '1px solid rgba(0,212,255,0.06)',
          borderRadius: 10,
        }}>
          <EncryptedFooter
            moduleId="dashboard"
            uid={user?.uid ?? 'anon'}
            showFullHash={true}
          />
        </div>
      </div>

      {/* THIRD-PARTY AGENT LIVE VERIFICATION MODAL */}
      {user && (
        <ThirdPartyVerificationModal
          isOpen={isThirdPartyModalOpen}
          onClose={() => setIsThirdPartyModalOpen(false)}
          userId={user.uid}
          userEmail={user.email || ''}
          sovereignScore={sovereignScore}
          sha256Id={sovereignHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
          vectorData={dashboardVectorData}
        />
      )}
    </div>
  );
};

