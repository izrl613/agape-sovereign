import React, { useState } from 'react';
import { Mail, Share2, HardDrive, Smartphone, Globe, Database, FileText, X, AlertTriangle, Loader2, Zap, Shield, Search, Cpu } from 'lucide-react';
import { NEON, NeonText, NeonButton, GlassCard, StatusBadge } from './UI';
import { useScan } from '../ScanContext';
import { generateSuspiciousReport, ScanFinding } from '../services/scanService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleProps {
  title: string;
  description: string;
  icon: string;
  vector: string;
  moduleId: string;
  scanLabel?: string;
}

export const DiffModule = ({ title, description, icon, vector, moduleId, scanLabel }: ModuleProps) => {
  const { findings: allFindings, triggerModuleScan, isScanning, scanProgress, currentModule, currentSubTask } = useScan();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const findings = allFindings.filter(f => f.module === moduleId);
  const nuked = findings.filter(f => f.status === 'NUKED').length;
  const knoxed = findings.filter(f => f.status === 'KNOXED').length;
  const monitored = findings.filter(f => f.status === 'MONITORED').length;
  
  let severity = 100;
  if (findings.length > 0) {
    const points = knoxed * 10 + monitored * 5;
    severity = Math.round((points / (findings.length * 10)) * 100);
  }

  const sevColor = severity > 80 ? NEON.blue : severity > 60 ? NEON.orange : NEON.magenta;

  // Fallback findings if none exist yet
  const displayFindings = findings.length > 0 ? findings.map(f => ({
    type: f.status,
    label: f.finding,
    detail: f.details,
    action: f.status === 'NUKED' ? 'NUKE' : f.status === 'KNOXED' ? 'KNOX' : 'REVIEW',
    original: f
  })) : [
    { type: "MONITORED" as const, label: "Awaiting Scan", detail: "Initiate a scan to populate intelligence.", action: "SCAN", original: null }
  ];

  return (
    <div style={{ animation: "fade-in 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <span style={{ color: sevColor, fontSize: "2rem", filter: `drop-shadow(0 0 8px ${sevColor})` }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>{vector} · DIFF MODULE</div>
          <NeonText color={sevColor} size="1.2rem" weight={700}>{title}</NeonText>
          <p style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: "4px" }}>{description}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <NeonButton 
            size="sm" 
            color={NEON.blue} 
            onClick={() => triggerModuleScan(moduleId)}
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
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
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

// Export specific modules
export const EmailModule = () => <DiffModule title="Email Breach & Metadata Scanner" description="Checks breach databases and analyzes exposed metadata patterns." icon="✉" vector="V-01" moduleId="email" scanLabel="Scan Emails" />;
export const SocialModule = () => <DiffModule title="Social Media Footprint Scanner" description="Public post scraping and username reuse detection." icon="◈" vector="V-02" moduleId="social" />;
export const DeviceModule = () => {
  const { triggerModuleScan, isScanning } = useScan();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DiffModule 
        title="Device File Scan" 
        description="File pattern analysis and metadata exposure detection." 
        icon="⬡" 
        vector="V-03" 
        moduleId="device" 
      />
      
      <GlassCard style={{ 
        padding: "32px", 
        textAlign: "center", 
        border: `1px solid ${NEON.blue}44`, 
        background: "linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(6, 13, 31, 0) 100%)",
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative element */}
        <div style={{ 
          position: 'absolute', 
          top: -20, 
          right: -20, 
          opacity: 0.05, 
          transform: 'rotate(15deg)' 
        }}>
          <HardDrive size={120} color={NEON.blue} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: 'rgba(0, 212, 255, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: `1px solid ${NEON.blue}33`,
            boxShadow: `0 0 20px ${NEON.blue}22`
          }}>
            <HardDrive size={32} color={NEON.blue} />
          </div>
          
          <NeonText color={NEON.blue} size="1.25rem" weight={800}>HARDWARE INTEGRITY PROTOCOL</NeonText>
          <p style={{ 
            color: NEON.textMuted, 
            fontSize: "0.9rem", 
            marginTop: "12px", 
            maxWidth: "600px", 
            margin: "12px auto 24px",
            lineHeight: 1.5
          }}>
            Perform an exhaustive audit of your device's security architecture. This includes UEFI/BIOS firmware verification, 
            DMA protection status, and OS-level kernel hardening analysis.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ textAlign: 'left', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>FIRMWARE STATUS</div>
              <div style={{ fontSize: '0.8rem', color: NEON.blue, fontWeight: 700 }}>VERIFIED</div>
            </div>
            <div style={{ textAlign: 'left', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>DMA PROTECTION</div>
              <div style={{ fontSize: '0.8rem', color: NEON.orange, fontWeight: 700 }}>ACTIVE</div>
            </div>
            <div style={{ textAlign: 'left', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>KERNEL INTEGRITY</div>
              <div style={{ fontSize: '0.8rem', color: NEON.blue, fontWeight: 700 }}>SECURED</div>
            </div>
          </div>

          <NeonButton 
            color={NEON.blue} 
            size="lg" 
            onClick={() => triggerModuleScan('device')}
            disabled={isScanning}
            style={{ 
              width: '100%', 
              maxWidth: "450px", 
              height: "56px",
              fontSize: "1rem",
              boxShadow: isScanning ? 'none' : `0 0 30px ${NEON.blue}33`
            }}
          >
            {isScanning ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                ANALYZING HARDWARE VECTORS...
              </div>
            ) : "⚡ INITIATE DEEP DEVICE RE-SCAN"}
          </NeonButton>
          
          <div style={{ marginTop: 16, fontSize: '0.7rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>
            ESTIMATED COMPLETION: 45 SECONDS · ARCHITECT AI ENGINE v2.4
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
export const SystemModule = () => <DiffModule title="Mobile & Laptop System Security" description="Passkey enforcement status and OS security posture." icon="◻" vector="V-04" moduleId="mobile" />;
export const DeepWebModule = () => <DiffModule title="Deep Web Exposure Monitoring" description="Pattern-based lookup and public data indexing scan." icon="◉" vector="V-05" moduleId="deepweb" />;
export const DataBrokerModule = () => <DiffModule title="Data Broker Removal Engine" description="Automated request templates for removal." icon="⧫" vector="V-06" moduleId="broker" />;
export const PasswordModule = () => <DiffModule title="Password Vault Analysis" description="Checks for weak, reused, or compromised credentials." icon="⬟" vector="V-07" moduleId="password" />;
export const LocationModule = () => <DiffModule title="Location Data Footprint" description="Analyzes historical GPS and IP-based location leaks." icon="◎" vector="V-08" moduleId="location" />;
export const BrowserModule = () => <DiffModule title="Browser & Cookie Tracker" description="Detects invasive tracking cookies and fingerprinting." icon="◯" vector="V-09" moduleId="browser" />;
export const FinancialModule = () => <DiffModule title="Financial Identity Exposure" description="Scans for exposed bank details or crypto addresses." icon="⬡" vector="V-10" moduleId="financial" />;
export const MedicalModule = () => <DiffModule title="Medical Data Footprint" description="Checks for leaks in health records or insurance data." icon="⊕" vector="V-11" moduleId="medical" />;
export const BiometricModule = () => <DiffModule title="Voice & Biometric Data" description="Analyzes exposure of facial or voice recognition data." icon="⊛" vector="V-12" moduleId="biometric" />;
export const IotModule = () => <DiffModule title="IoT & Smart Device Scan" description="Identifies vulnerabilities in connected home devices." icon="⊡" vector="V-13" moduleId="iot" />;
export const CloudModule = () => <DiffModule title="Cloud Storage Exposure" description="Scans for misconfigured S3 buckets or Drive permissions." icon="⊞" vector="V-14" moduleId="cloud" />;
export const DarkWebModule = () => {
  const { triggerModuleScan, isScanning } = useScan();
  
  const insights = [
    { title: "Tor & I2P Marketplace Surveillance", desc: "Active monitoring of 400+ illicit marketplaces for ID-related listings." },
    { title: "Breached Database Correlation", desc: "Cross-referencing 12B+ leaked credentials against your known markers." },
    { title: "Ransomware Leak Site Monitoring", desc: "Watching corporate extortion sites for mentions of your PII in enterprise dumps." },
    { title: "Credential Stuffing List Detection", desc: "Identifying your emails in automated bot-attack lists used by threat actors." }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DiffModule 
        title="Dark Web Monitoring" 
        description="Real-time monitoring of underground marketplaces and breached data dumps." 
        icon="◈" 
        vector="V-15" 
        moduleId="darkweb" 
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <GlassCard style={{ 
          padding: "32px", 
          textAlign: "center", 
          border: `1px solid ${NEON.magenta}44`, 
          background: "linear-gradient(135deg, rgba(255, 46, 159, 0.05) 0%, rgba(6, 13, 31, 0) 100%)",
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Background decorative element */}
          <div style={{ 
            position: 'absolute', 
            top: -20, 
            right: -20, 
            opacity: 0.05, 
            transform: 'rotate(15deg)' 
          }}>
            <Globe size={120} color={NEON.magenta} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              background: 'rgba(255, 46, 159, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: `1px solid ${NEON.magenta}33`,
              boxShadow: `0 0 20px ${NEON.magenta}22`
            }}>
              <Globe size={32} color={NEON.magenta} />
            </div>
            
            <NeonText color={NEON.magenta} size="1.25rem" weight={800}>DARK WEB SWEEP ENGINE</NeonText>
            <p style={{ 
              color: NEON.textMuted, 
              fontSize: "0.9rem", 
              marginTop: "12px", 
              maxWidth: "600px", 
              margin: "12px auto 24px",
              lineHeight: 1.5
            }}>
              The Architect performs an exhaustive sweep across Tor networks, I2P, and criminal forums, 
              correlating your digital markers against recent identity thefts and marketplace listings.
            </p>
            
            <NeonButton 
              color={NEON.magenta} 
              size="lg" 
              onClick={() => triggerModuleScan('darkweb')}
              disabled={isScanning}
              style={{ 
                width: '100%', 
                maxWidth: "350px", 
                height: "56px",
                fontSize: "1rem",
                boxShadow: isScanning ? 'none' : `0 0 30px ${NEON.magenta}33`
              }}
            >
              {isScanning ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  ANALYZING DARK VECTORS...
                </div>
              ) : "◈ INITIATE DARK WEB SWEEP"}
            </NeonButton>
            
            <div style={{ marginTop: 16, fontSize: '0.7rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>
              ESTIMATED COMPLETION: 60 SECONDS · ARCHITECT AI ENGINE v2.4
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '24px', border: `1px solid ${NEON.blue}22` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Database size={18} color={NEON.blue} />
            <NeonText color={NEON.blue} size="0.9rem" weight={700}>INTELLIGENCE INSIGHTS</NeonText>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {insights.map((insight, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: NEON.text, marginBottom: 4, fontFamily: "'Rajdhani'" }}>{insight.title}</div>
                <div style={{ fontSize: '0.65rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'", lineHeight: 1.4 }}>{insight.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: '12px', border: `1px dashed ${NEON.orange}44`, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={14} color={NEON.orange} />
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: NEON.orange, fontFamily: "'Orbitron'" }}>SURVEILLANCE NOTICE</div>
            </div>
            <div style={{ fontSize: '0.62rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'", lineHeight: 1.5 }}>
              Dark web exposures often include high-entropy identifiers (GUIDs) and cryptographic hashes. 
              Remediation typically requires full credential invalidation and hardware token enrollment.
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export const BehavioralModule = () => <DiffModule title="Behavioral Profile Analysis" description="Analyzes AI-generated behavioral advertising profiles." icon="⊟" vector="V-16" moduleId="behavioral" />;
