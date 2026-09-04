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
  email: "/email", social: "/social", device: "/device", mobile: "/system",
  laptop: "/system", deepweb: "/deepweb", broker: "/databroker", password: "/password",
  network: "/network", cloud: "/cloud", comm: "/communication", financial: "/financial",
  docs: "/documents", oauth: "/oauth", legal: "/legal", ai: "/ai",
};

const StatusCard = ({ label, count, color, glow }: { label: string; count: number; color: string; glow: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      flex: 1,
      minWidth: 180,
      padding: '24px 20px',
      borderRadius: 14,
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1.5px solid ${color}44`,
      boxShadow: `0 0 30px ${glow}`,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(circle at 50% 0%, ${color}12 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />
    <div style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: '2.2rem',
      fontWeight: 900,
      color,
      textShadow: `0 0 20px ${color}88`,
      lineHeight: 1,
      marginBottom: 8,
      position: 'relative',
    }}>
      {count}
    </div>
    <div style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: '0.65rem',
      fontWeight: 700,
      color,
      letterSpacing: '0.15em',
      opacity: 0.9,
      position: 'relative',
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
        padding: '20px 24px',
        borderRadius: 12,
        background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
        border: `1px solid ${statusColor}22`,
        borderLeft: `4px solid ${statusColor}`,
        boxShadow: finding.status === 'NUKED' ? `0 0 20px ${statusColor}15` : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px',
              borderRadius: 6,
              background: `${statusColor}15`,
              border: `1px solid ${statusColor}33`,
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.6rem',
              fontWeight: 700,
              color: statusColor,
              letterSpacing: '0.08em',
            }}>
              {statusIcon} {finding.status}
            </span>
            <span style={{
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.6rem',
              color: NEON.textMuted,
              letterSpacing: '0.1em',
            }}>
              {finding.module?.toUpperCase()} · {finding.timestamp?.toLocaleTimeString?.() || '—'}
            </span>
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1rem',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.3,
            marginBottom: 8,
          }}>
            {finding.finding}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.8rem',
            color: NEON.textMuted,
            lineHeight: 1.6,
          }}>
            {finding.details}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.3)',
              color: NEON.blue,
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            📄 REPORT
          </motion.button>
          {finding.status === 'NUKED' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: `${NEON.magenta}15`,
                border: `1px solid ${NEON.magenta}44`,
                color: NEON.magenta,
                fontFamily: "'Orbitron', monospace",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              NUKE
            </motion.button>
          )}
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

  const modules = useMemo(() => {
    return MODULE_CONFIG.map(config => {
      const moduleFindings = findings.filter(f => f.module === config.id);
      const nuked = moduleFindings.filter(f => f.status === 'NUKED').length;
      const knoxed = moduleFindings.filter(f => f.status === 'KNOXED').length;
      const monitored = moduleFindings.filter(f => f.status === 'MONITORED').length;
      let severity = 100;
      if (moduleFindings.length > 0) {
        const points = knoxed * 10 + monitored * 5;
        severity = Math.round((points / (moduleFindings.length * 10)) * 100);
      }
      return { ...config, nuked, knoxed, monitored, severity };
    });
  }, [findings]);

  const currentModuleLabel = useMemo(() => {
    if (!currentModule) return "";
    return MODULE_CONFIG.find(m => m.id === currentModule)?.label || currentModule.toUpperCase();
  }, [currentModule]);

  const handleNukeAll = () => {
    // TODO: Implement nuke all exposures
    console.log('Nuke all exposures');
  };

  const handleKnoxAll = () => {
    // TODO: Implement knox all secured
    console.log('Knox all secured');
  };

  return (
    <div style={{ position: 'relative' }}>
      <PasskeyLockOverlay zone="identity" />

      <div style={{
        animation: "fade-in 0.4s ease",
        filter: isLocked ? 'blur(12px)' : 'none',
        transition: 'filter 0.3s ease',
        pointerEvents: isLocked ? 'none' : 'auto',
      }}>
        {/* ── Status Cards ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <StatusCard label="NUKED" count={stats.nuked} color={NEON.magenta} glow={`${NEON.magenta}22`} />
          <StatusCard label="KNOXED" count={stats.knoxed} color={NEON.orange} glow={`${NEON.orange}22`} />
          <StatusCard label="MONITORED" count={stats.monitored} color={NEON.blue} glow={`${NEON.blue}22`} />
        </div>

        {/* ── Intelligence Findings ── */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            color: NEON.orange,
            letterSpacing: '0.12em',
          }}>
            INTELLIGENCE FINDINGS
          </span>
          <div style={{ flex: 1, height: 1, background: `${NEON.orange}33` }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
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
              padding: '40px 24px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>⬡</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.8rem', color: NEON.textMuted }}>
                NO INTELLIGENCE FINDINGS
              </div>
              <div style={{ fontSize: '0.7rem', color: NEON.textMuted, marginTop: 4, opacity: 0.6 }}>
                Initiate scan to populate feed
              </div>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${NEON.magenta}44` }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNukeAll}
            disabled={isScanning || stats.nuked === 0}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${NEON.magenta}20 0%, ${NEON.magenta}08 100%)`,
              border: `1.5px solid ${NEON.magenta}44`,
              color: NEON.magenta,
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              cursor: isScanning || stats.nuked === 0 ? 'not-allowed' : 'pointer',
              opacity: isScanning || stats.nuked === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.3s ease',
            }}
          >
            🔥 NUKE ALL EXPOSURES
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${NEON.blue}44` }}
            whileTap={{ scale: 0.98 }}
            onClick={handleKnoxAll}
            disabled={isScanning}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${NEON.blue}20 0%, ${NEON.blue}08 100%)`,
              border: `1.5px solid ${NEON.blue}44`,
              color: NEON.blue,
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              opacity: isScanning ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.3s ease',
            }}
          >
            🛡️ KNOX ALL SECURED
          </motion.button>
        </div>

        {/* ── Scanning Progress ── */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              marginBottom: 24,
              padding: '16px 20px',
              borderRadius: 12,
              background: `${NEON.orange}08`,
              border: `1px solid ${NEON.orange}22`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.75rem',
                color: NEON.orange,
              }}>
                V-VECTOR {currentStep + 1}/{totalSteps}: {currentModuleLabel}
              </span>
              <span style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.7rem',
                color: NEON.orange,
              }}>
                {scanProgress}% ANALYZED
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${NEON.orange}, ${NEON.magenta})`,
                  boxShadow: `0 0 10px ${NEON.orange}`,
                }}
              />
            </div>
          </motion.div>
        )}

        {/* ── Module Grid ── */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            color: NEON.blue,
            letterSpacing: '0.12em',
          }}>
            IDENTITY VECTOR MODULES
          </span>
          <div style={{ flex: 1, height: 1, background: `${NEON.blue}33` }} />
          <span style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: '0.65rem',
            color: NEON.textMuted,
          }}>
            {MODULE_CONFIG.length}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}>
          {modules.map((m, idx) => {
            const sev = m.severity;
            const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
            const route = MODULE_ROUTES[m.id] || '/';

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                whileHover={{ y: -2, boxShadow: `0 8px 24px ${sevColor}18` }}
                onClick={() => navigate(route)}
                style={{
                  cursor: 'pointer',
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${sevColor}18`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 8,
                  background: `${sevColor}10`,
                  border: `1px solid ${sevColor}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: sevColor, fontSize: '1rem' }}>{m.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {m.label}
                  </div>
                  <div style={{
                    fontFamily: "'Share Tech Mono'",
                    fontSize: '0.58rem',
                    color: NEON.textMuted,
                    marginTop: 2,
                  }}>
                    {m.vector} · {m.nuked}🔥 {m.knoxed}🛡️
                  </div>
                </div>
                <div style={{
                  width: 38, height: 38,
                  borderRadius: '50%',
                  border: `2px solid ${sevColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${sevColor}33`,
                }}>
                  <span style={{
                    fontFamily: "'Orbitron'",
                    fontSize: '0.55rem',
                    color: sevColor,
                    fontWeight: 700,
                  }}>
                    {sev}
                  </span>
                </div>
              </motion.div>
            );
          })}
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
    </div>
  );
};
