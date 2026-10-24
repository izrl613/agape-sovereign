import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint, ArrowLeft, Shield, EyeOff, ChevronRight, UserRound,
  Send, Bot, User, Loader2, Trash2, Sparkles, FileText, Check,
  AlertTriangle, Rss, ShieldAlert, Globe, ShieldCheck, Download,
  LayoutDashboard, MessageSquare, FilePieChart, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  updateFindingStatus,
  recalculateSovereignScore,
  IDENTITY_VECTORS
} from '../services/scanService';
import { chatComplete } from '../services/localAIService';
import { generateSovereignReport } from '../services/pdfReportService';

// ── Brand palette ──────────────────────────────────────────────
const NEON = {
  magenta: '#FF2E9F',
  blue: '#00D4FF',
  orange: '#FF7A18',
  bg: '#060D1F',
  bgCard: 'rgba(8, 18, 40, 0.85)',
  bgGlass: 'rgba(0, 212, 255, 0.04)',
  text: '#E8F4FF',
  textMuted: '#7B9BB5',
} as const;

const GRADIENT_BORDER = `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.blue} 50%, ${NEON.orange} 100%)`;

// ── Global Styles ──────────────────────────────────────────────
const GlobalStyle = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${NEON.bg}; color: ${NEON.text}; font-family: 'Rajdhani', sans-serif; overflow: hidden; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      ::-webkit-scrollbar-thumb { background: ${NEON.blue}; border-radius: 2px; }

      @keyframes pulse-border { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      @keyframes scan-line { 0% { top: -2px; } 100% { top: 100%; } }
      @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
      @keyframes glow-pulse {
        0%,100% { box-shadow: 0 0 8px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.3); }
        33% { box-shadow: 0 0 8px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.3); }
        66% { box-shadow: 0 0 8px ${NEON.orange}, 0 0 20px rgba(255,122,24,0.3); }
      }
      @keyframes text-glow {
        0%,100% { text-shadow: 0 0 10px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.5); }
        50% { text-shadow: 0 0 10px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.5); }
      }
      @keyframes slide-in-left { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes slide-in-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes rotate-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes data-stream { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
      @keyframes nuke-flash { 0%,100% { background: rgba(255,46,159,0.1); } 50% { background: rgba(255,46,159,0.25); } }
      @keyframes knox-pulse { 0%,100% { background: rgba(0,212,255,0.1); } 50% { background: rgba(0,212,255,0.2); } }
      @keyframes spinner { to { transform: rotate(360deg); } }

      .neon-border { position: relative; }
      .neon-border::before {
        content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
        background: ${GRADIENT_BORDER}; background-size: 200% 200%;
        animation: rotate-gradient 4s linear infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor; mask-composite: exclude;
        pointer-events: none; z-index: 1;
      }
      .pulse-border::before { animation: rotate-gradient 3s linear infinite, pulse-border 2s ease-in-out infinite; }
      .btn-neon { position: relative; overflow: hidden; transition: all 0.3s ease; cursor: pointer; border: none; outline: none; }
      .btn-neon:hover { transform: translateY(-2px); animation: glow-pulse 2s infinite; }
      .module-card { transition: all 0.3s ease; cursor: pointer; }
      .module-card:hover { transform: translateY(-2px); border-color: ${NEON.blue} !important; box-shadow: 0 8px 32px rgba(0,212,255,0.2) !important; }
      .nav-item { transition: all 0.25s ease; cursor: pointer; }
      .nav-item:hover, .nav-item.active { background: rgba(0,212,255,0.08); border-left: 2px solid ${NEON.blue}; padding-left: 14px; }
      .chat-bubble { animation: slide-in-up 0.3s ease; }
      .score-ring { filter: drop-shadow(0 0 12px ${NEON.blue}); }
      .thinking-dot { width: 6px; height: 6px; border-radius: 50%; background: ${NEON.blue}; animation: pulse-border 0.8s ease-in-out infinite; }
      .thinking-dot:nth-child(2) { animation-delay: 0.15s; background: ${NEON.magenta}; }
      .thinking-dot:nth-child(3) { animation-delay: 0.3s; background: ${NEON.orange}; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ── Utility Components ──────────────────────────────────────────
const NeonText = ({ children, color = NEON.blue, size = "1rem", weight = 700, style = {} }: any) => (
  <span style={{ fontFamily: "'Orbitron', monospace", color, fontSize: size, fontWeight: weight, textShadow: `0 0 10px ${color}66`, letterSpacing: "0.05em", ...style }}>
    {children}
  </span>
);

const GlassCard = ({ children, style = {}, className = "", onClick }: any) => (
  <div className={`neon-border ${className}`} onClick={onClick} style={{
    background: NEON.bgCard, backdropFilter: "blur(20px)", borderRadius: 12,
    border: "1px solid rgba(0,212,255,0.15)", position: "relative", ...style
  }}>
    {children}
  </div>
);

const NeonButton = ({ children, onClick, color = NEON.blue, style = {}, disabled = false, size = "md" }: any) => {
  const pad = size === "sm" ? "8px 18px" : size === "lg" ? "14px 32px" : "10px 24px";
  const fs = size === "sm" ? "0.75rem" : size === "lg" ? "1rem" : "0.85rem";
  return (
    <button className="btn-neon neon-border" onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      padding: pad, borderRadius: 8, background: `rgba(${color === NEON.blue ? "0,212,255" : color === NEON.magenta ? "255,46,159" : "255,122,24"},0.1)`,
      color, fontFamily: "'Orbitron', monospace", fontSize: fs, fontWeight: 600, letterSpacing: "0.08em",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style
    }}>
      {children}
    </button>
  );
};

const StatusBadge = ({ type }: { type: 'NUKED' | 'KNOXED' | 'MONITORED' | 'SCANNING' }) => {
  const cfg = {
    NUKED: { color: NEON.magenta, bg: "rgba(255,46,159,0.12)", label: "🔥 NUKED" },
    KNOXED: { color: NEON.blue, bg: "rgba(0,212,255,0.12)", label: "🛡️ KNOXED" },
    MONITORED: { color: NEON.orange, bg: "rgba(255,122,24,0.12)", label: "👁️ MONITORED" },
    SCANNING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "⟳ SCANNING" },
  };
  const c = cfg[type] || cfg.MONITORED;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Orbitron', monospace", border: `1px solid ${c.color}44` }}>
      {c.label}
    </span>
  );
};

// ─── Sovereign Score Arc ──────────────────────────────────────
const SovereignScore = ({ score }: { score: number }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 1.5s ease" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="22" fontWeight="900">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SOVEREIGN</text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SCORE</text>
      </svg>
    </div>
  );
};

// ─── Views ─────────────────────────────────────────────────────

const DashboardView = ({ findings, onModuleClick }: { findings: any[], onModuleClick: (id: string) => void }) => {
  const sovereignScore = Math.round(IDENTITY_VECTORS.reduce((s, m) => s + (findings.find(f => f.module === m.id)?.severity || 100), 0) / (IDENTITY_VECTORS.length || 1));
  const totalExposures = findings.filter(f => f.status === 'NUKED' || f.status === 'MONITORED').length;
  const totalSecured = findings.filter(f => f.status === 'KNOXED').length;
  const criticalModules = IDENTITY_VECTORS.filter(m => (findings.find(f => f.module === m.id)?.severity || 100) < 60);

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fade-in 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 6 }}>DIGITAL IDENTITY FEDERATED FOOTPRINT</div>
          <NeonText color={NEON.blue} size="1.5rem" weight={900}>DIFF COMMAND CENTER</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: 4 }}>16-Layer identity vector analysis · Real-time threat intelligence</div>
        </div>
        <SovereignScore score={sovereignScore} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "VECTORS ACTIVE", value: "16", sub: "All layers online", color: NEON.blue },
          { label: "EXPOSURES FOUND", value: totalExposures, sub: "Across all surfaces", color: NEON.magenta },
          { label: "SECURED", value: totalSecured, sub: "KNOXED & hardened", color: NEON.blue },
          { label: "CRITICAL FLAGS", value: criticalModules.length, sub: "Require attention", color: NEON.orange },
        ].map((kpi) => (
          <GlassCard key={kpi.label} style={{ padding: "16px" }}>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em", marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.8rem", fontWeight: 900, color: kpi.color, textShadow: `0 0 12px ${kpi.color}66` }}>{kpi.value}</div>
            <div style={{ fontSize: "0.7rem", color: NEON.textMuted, marginTop: 4 }}>{kpi.sub}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <NeonText color={NEON.orange} size="0.75rem" weight={700}>IDENTITY VECTOR MODULES</NeonText>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}33` }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {IDENTITY_VECTORS.map((m) => {
          const finding = findings.find(f => f.module === m.id);
          const sev = finding?.severity || 100;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <GlassCard key={m.id} className="module-card" onClick={() => onModuleClick(m.id)} style={{ padding: "14px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: sevColor, fontSize: "1.2rem" }}>{m.icon}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Orbitron'", fontSize: "0.7rem", color: sevColor, fontWeight: 700 }}>{sev}%</span>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.5rem", color: NEON.textMuted }}>{m.id}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: "0.72rem", fontWeight: 600, color: NEON.text, marginBottom: 8, lineHeight: 1.3 }}>{m.name}</div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${sev}%`, background: sevColor, borderRadius: 1, boxShadow: `0 0 6px ${sevColor}`, transition: "width 1s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.magenta }}>🔥{findings.filter(f => f.module === m.id && f.status === 'NUKED').length}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.blue }}>🛡️{findings.filter(f => f.module === m.id && f.status === 'KNOXED').length}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.orange }}>👁️{findings.filter(f => f.module === m.id && f.status === 'MONITORED').length}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

const ModuleDetailView = ({ findings, moduleId, onScan }: { findings: any[], moduleId: string, onScan: (id: string) => void }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [completedStages, setCompletedStages] = useState([]);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);

  const m = IDENTITY_VECTORS.find(x => x.id === moduleId);
  if (!m) return null;
  const moduleFindings = findings.filter(f => f.module === moduleId);
  const sev = moduleFindings.length > 0 ? Math.min(...moduleFindings.map(f => f.severity)) : 100;
  const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;

  const baseStages = [
    "INITIALIZING SENSORS",
    "ESTABLISHING SECURE CONNECTION",
    `QUERYING ${m.name.toUpperCase()} REGISTRIES`,
    "ANALYZING METADATA FOOTPRINT",
    "CROSS-REFERENCING THREAT INTEL",
    "COMPILING DIFF VECTORS",
    "SCAN COMPLETE"
  ];

  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setCompletedStages([]);
    setActiveStageIndex(0);
    setCurrentStage(baseStages[0]);

    let current = 0;
    const interval = setInterval(() => {
      if (current < baseStages.length) {
        const progress = Math.min(100, Math.floor(((current + 1) / baseStages.length) * 100));
        setScanProgress(progress);
        setCurrentStage(baseStages[current]);
        setActiveStageIndex(current);
        if (current > 0) setCompletedStages(prev => [...prev, baseStages[current-1]]);
        current++;
      } else {
        setCompletedStages(prev => [...prev, baseStages[baseStages.length-1]]);
        setActiveStageIndex(-1);
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 3000);
      }
    }, 1200);
  };

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fade-in 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <span style={{ color: sevColor, fontSize: "2rem", filter: `drop-shadow(0 0 8px ${sevColor})` }}>{m.icon}</span>
        <div>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>{m.id} · DIFF MODULE</div>
          <NeonText color={sevColor} size="1.2rem" weight={700}>{m.name}</NeonText>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Orbitron'", fontSize: "2rem", fontWeight: 900, color: sevColor, textShadow: `0 0 20px ${sevColor}` }}>{sev}%</div>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>SOVEREIGN SCORE</div>
        </div>
      </div>

      <GlassCard style={{ padding: "16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.textMuted }}>SECURITY POSTURE</span>
          <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: sevColor }}>{sev > 80 ? "SECURED" : sev > 60 ? "MODERATE" : "EXPOSED"}</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${sev}%`, background: `linear-gradient(90deg, ${NEON.magenta}, ${sevColor})`, borderRadius: 3, boxShadow: `0 0 10px ${sevColor}`, transition: "width 1.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 12 }}>
          {[
            { l: "NUKED", v: moduleFindings.filter(f => f.status === 'NUKED').length, c: NEON.magenta },
            { l: "KNOXED", v: moduleFindings.filter(f => f.status === 'KNOXED').length, c: NEON.blue },
            { l: "MONITORED", v: moduleFindings.filter(f => f.status === 'MONITORED').length, c: NEON.orange }
          ].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: "center", background: `rgba(${s.c === NEON.magenta ? "255,46,159" : s.c === NEON.blue ? "0,212,255" : "255,122,24"},0.08)`, borderRadius: 8, padding: "10px 0", border: `1px solid ${s.c}22` }}>
              <div style={{ fontFamily: "'Orbitron'", fontSize: "1.4rem", fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div style={{ marginBottom: 16 }}>
        <NeonText color={NEON.orange} size="0.72rem">INTELLIGENCE FINDINGS</NeonText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {moduleFindings.map((f, i) => (
          <div key={i} className={f.status === "NUKED" ? "nuked-item" : f.status === "KNOXED" ? "knoxed-item" : ""} style={{ borderRadius: 10, padding: "14px 16px", border: `1px solid ${f.status === "NUKED" ? NEON.magenta : f.status === "KNOXED" ? NEON.blue : NEON.orange}33`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flexShrink: 0 }}><StatusBadge type={f.status as any} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: "0.85rem", color: NEON.text }}>{f.finding}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted, marginTop: 2 }}>{f.details}</div>
            </div>
            <div>
              <NeonButton size="sm" color={f.status === "NUKED" ? NEON.magenta : f.status === "KNOXED" ? NEON.blue : NEON.orange}>
                {f.status === "NUKED" ? "NUKE" : f.status === "KNOXED" ? "KNOX" : "REVIEW"}
              </NeonButton>
            </div>
          </div>
        ))}
      </div>

      {isScanning && (
        <GlassCard style={{ padding: "20px", marginBottom: 20, border: `1px solid ${NEON.blue}55`, background: "rgba(0, 212, 255, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: "'Orbitron'", fontSize: "0.85rem", color: NEON.blue, fontWeight: 800 }}>VECTOR ANALYSIS ACTIVE</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>{m.id}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: "'Orbitron'", fontSize: "1.1rem", color: NEON.blue, fontWeight: 900 }}>{scanProgress}%</span>
            </div>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", marginBottom: 20, border: '1px solid rgba(0,212,255,0.1)' }}>
            <div style={{ height: "100%", width: `${scanProgress}%`, background: `linear-gradient(90deg, ${NEON.blue}88, ${NEON.blue})`, boxShadow: `0 0 15px ${NEON.blue}`, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 20px' }}>
            {baseStages.map((stage, idx) => {
              const isCompleted = completedStages.includes(stage);
              const isActive = activeStageIndex === idx;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: isCompleted || isActive ? 1 : 0.3, transition: 'all 0.3s ease' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${isCompleted ? NEON.blue : isActive ? NEON.orange : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCompleted ? NEON.blue : 'transparent' }}>
                    {isCompleted && <span style={{ color: NEON.bg, fontSize: '0.5rem', fontWeight: 900 }}>✓</span>}
                    {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: NEON.orange, animation: 'pulse-border 1s infinite' }} />}
                  </div>
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: isActive ? NEON.orange : isCompleted ? NEON.blue : NEON.textMuted, fontWeight: isActive ? 700 : 400 }}>{stage}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid rgba(0,212,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2,3].map(i => <div key={i} style={{ width: 2, height: 10, background: NEON.blue, opacity: 0.3 + (i * 0.2) }} />)}
             </div>
             <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', color: NEON.blue, letterSpacing: '0.1em' }}>CURRENT: {currentStage}</div>
          </div>
        </GlassCard>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <NeonButton onClick={handleScan} disabled={isScanning} color={NEON.orange} style={{ flex: 1 }}>⟳ INITIATE VECTOR SWEEP</NeonButton>
        <NeonButton disabled={isScanning} color={NEON.magenta} style={{ flex: 1 }}>🔥 NUKE ALL EXPOSURES</NeonButton>
        <NeonButton disabled={isScanning} color={NEON.blue} style={{ flex: 1 }}>🛡️ KNOX ALL SECURED</NeonButton>
      </div>
    </div>
  );
};

const ArchitectAIView = ({ user, findings, onSendMessage }: { user: any, findings: any[], onSendMessage: (msg: string) => Promise<void> }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string, timestamp: Date }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
    setLoading(true);
    try {
      await onSendMessage(userMsg);
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", content: "⚠️ Secure channel temporarily interrupted. Reconnecting...", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    "What are my highest-risk exposures?",
    "How do I NUKE my data broker profiles?",
    "Explain ECRA 2026 compliance",
    "What does KNOXED mean for my files?",
    "How is my Sovereign Score calculated?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>AI INTELLIGENCE ENGINE</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>ARCHITECT AI</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Real-time security & privacy intelligence · ECRA 2026 compliant · Gemini-powered</div>
      </div>
      <div style={{ height: 1, background: GRADIENT_BORDER, marginBottom: 16, opacity: 0.5 }} />
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((msg, i) => (
          <div key={i} className="chat-bubble" style={{ display: "flex", gap: 12, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "model" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                <span style={{ fontSize: "0.75rem", color: NEON.blue }}>AI</span>
              </div>
            )}
            <div style={{ maxWidth: "78%", background: msg.role === "user" ? "rgba(255,46,159,0.1)" : NEON.bgCard, borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "12px 16px", border: `1px solid ${msg.role === "user" ? NEON.magenta : NEON.blue}33`, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", lineHeight: 1.6, color: NEON.text }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.75rem", color: NEON.blue }}>AI</span>
            </div>
            <div style={{ background: NEON.bgCard, borderRadius: "4px 16px 16px 16px", padding: "12px 20px", border: `1px solid ${NEON.blue}33`, display: "flex", gap: 6, alignItems: "center" }}>
              <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>
      {messages.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {suggestedQueries.map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ background: "rgba(0,212,255,0.06)", border: `1px solid ${NEON.blue}33`, borderRadius: 20, padding: "6px 14px", color: NEON.blue, fontFamily: "'Rajdhani'", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
              {q}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <div className="neon-border" style={{ flex: 1, borderRadius: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask Architect AI about your digital sovereignty..." style={{ width: "100%", background: "rgba(0,212,255,0.04)", border: "none", outline: "none", padding: "12px 16px", borderRadius: 10, color: NEON.text, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem" }} />
        </div>
        <NeonButton onClick={handleSend} disabled={loading || !input.trim()} color={NEON.blue} style={{ padding: "12px 20px" }}>
          {loading ? "..." : "SEND"}
        </NeonButton>
      </div>
    </div>
  );
};

const ReportView = ({ findings }: { findings: any[] }) => {
  const avgScore = Math.round(IDENTITY_VECTORS.reduce((s, m) => s + (findings.find(f => f.module === m.id)?.severity || 100), 0) / (IDENTITY_VECTORS.length || 1));
  const totalNuked = findings.filter(f => f.status === 'NUKED').length;
  const totalKnoxed = findings.filter(f => f.status === 'KNOXED').length;

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fade-in 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>LIGHTHOUSE-STYLE AUDIT</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>DIFF SOVEREIGNTY REPORT</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Generate your complete Digital Identity Federated Footprint audit · Firebase-backed · Encrypted PDF</div>
      </div>
      <div style={{ height: 1, background: GRADIENT_BORDER, marginBottom: 24, opacity: 0.5 }} />
      <GlassCard style={{ padding: "24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <NeonText color={NEON.blue} size="1rem">AGAPE SOVEREIGN ENCLAVE 2026</NeonText>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.textMuted, marginTop: 4 }}>DIGITAL IDENTITY FEDERATED FOOTPRINT REPORT</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, marginTop: 4 }}>ECRA 2026 · GDPR · CCPA COMPLIANT</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron'", fontSize: "2.5rem", fontWeight: 900, color: avgScore > 75 ? NEON.blue : avgScore > 50 ? NEON.orange : NEON.magenta, textShadow: `0 0 20px ${avgScore > 75 ? NEON.blue : NEON.orange}` }}>{avgScore}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>SOVEREIGN SCORE</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "IDENTITY VECTORS SCANNED", value: "16 / 16", color: NEON.blue },
            { label: "TOTAL EXPOSURES", value: `${totalNuked} found`, color: NEON.magenta },
            { label: "SECURED ASSETS", value: `${totalKnoxed} hardened`, color: NEON.blue },
            { label: "COMPLIANCE STATUS", value: "ECRA 2026", color: NEON.orange },
            { label: "PASSKEY STATUS", value: "✓ Device-bound", color: NEON.blue },
            { label: "ENCRYPTION", value: "✓ AES-256-GCM", color: NEON.blue },
            { label: "REPORT TYPE", value: "Lighthouse-v3", color: NEON.orange },
            { label: "CLOUD AUDIT ID", value: `ASE-${Date.now().toString(36).toUpperCase()}`, color: NEON.textMuted },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,212,255,0.03)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.08)" }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>{row.label}</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: row.color, fontWeight: 700 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <div style={{ marginBottom: 12 }}>
        <NeonText color={NEON.orange} size="0.72rem">VECTOR-BY-VECTOR BREAKDOWN</NeonText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {IDENTITY_VECTORS.slice(0, 8).map(m => {
          const finding = findings.find(f => f.module === m.id);
          const sev = finding?.severity || 100;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,212,255,0.02)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.07)" }}>
              <span style={{ color: sevColor, fontSize: "0.8rem", width: 20 }}>{m.icon}</span>
              <span style={{ fontFamily: "'Rajdhani'", fontSize: "0.75rem", color: NEON.text, flex: 1 }}>{m.name}</span>
              <div style={{ width: 80, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${sev}%`, background: sevColor, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: sevColor, width: 30, textAlign: "right" }}>{sev}%</span>
            </div>
          );
        })}
      </div>
      <NeonButton onClick={() => {}} color={NEON.blue} style={{ width: "100%", padding: "16px" }}>⬡ GENERATE DIFF PDF REPORT</NeonButton>
    </div>
  );
};

const AdminPortalView = ({ onClose }: { onClose: () => void }) => {
  const stats = { webauthLogs: 1247, cloudRunStatus: "HEALTHY", firestoreOps: 38291, nodeHealth: "99.7%", activeUsers: 1, sessionsToday: 3 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", animation: "fade-in 0.3s ease" }}>
      <GlassCard style={{ width: "min(900px, 95vw)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,122,24,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: NEON.orange, fontSize: "1.2rem" }}>⬡</span>
          <div>
            <NeonText color={NEON.orange} size="1rem" weight={700}>ADMIN PORTAL</NeonText>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>AGAPE SOVEREIGN · RESTRICTED ACCESS</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: "#0f0" }}>● idin@agape.nyc</div>
          <button onClick={onClose} style={{ background: "rgba(255,122,24,0.1)", border: "1px solid rgba(255,122,24,0.3)", borderRadius: 6, padding: "6px 12px", color: NEON.orange, cursor: "pointer", fontFamily: "'Orbitron'", fontSize: "0.65rem" }}>CLOSE</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: 12 }}><NeonText color={NEON.orange} size="0.7rem">FIREBASE INFRASTRUCTURE · GCP FREE TIER</NeonText></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
            {[
              { label: "WebAuthn Logs", value: stats.webauthLogs.toLocaleString(), unit: "events", color: NEON.blue },
              { label: "Cloud Run Status", value: stats.cloudRunStatus, unit: "containerized", color: "#0f0" },
              { label: "Firestore Ops", value: stats.firestoreOps.toLocaleString(), unit: "reads/writes", color: NEON.blue },
              { label: "Node Health", value: stats.nodeHealth, unit: "uptime", color: "#0f0" },
              { label: "Active Users", value: stats.activeUsers, unit: "live sessions", color: NEON.orange },
              { label: "Sessions Today", value: stats.sessionsToday, unit: "authenticated", color: NEON.orange },
            ].map(s => (
              <div key={s.label} style={{ padding: "14px", background: "rgba(0,212,255,0.03)", borderRadius: 8, border: `1px solid ${s.color}22` }}>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.textMuted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Orbitron'", fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, marginTop: 2 }}>{s.unit}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}><NeonText color={NEON.blue} size="0.7rem">FIREBASE SERVICES STATUS</NeonText></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {[
              { svc: "Firebase Authentication", status: "ACTIVE", note: "Google + Apple OAuth · WebAuthn passkeys" },
              { svc: "Cloud Firestore", status: "ACTIVE", note: "AES-256-GCM encrypted · Zero-knowledge architecture" },
              { svc: "Firebase Storage", status: "ACTIVE", note: "PDF reports · Encrypted user data" },
              { svc: "Cloud Functions", status: "ACTIVE", note: "PDF generation · DIFF scan orchestration" },
              { svc: "Firebase App Check", status: "ACTIVE", note: "Request attestation · Abuse prevention" },
              { svc: "Firebase Hosting", status: "ACTIVE", note: "CDN-backed · HTTPS enforced" },
              { svc: "Firebase Analytics", status: "ACTIVE", note: "Privacy-mode · No PII collection" },
              { svc: "Gemini AI (Free Tier)", status: "ACTIVE", note: "Context-bound sessions · Rate-limited guardrails" },
            ].map(s => (
              <div key={s.svc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.08)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f0", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.text, width: 220 }}>{s.svc}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: "#0f0", width: 60 }}>{s.status}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.textMuted }}>{s.note}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const ProfilePanel = ({ user, onClose }: { user: any, onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState(["user@agape.nyc"]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 900, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", backdropFilter: "blur(6px)", animation: "fade-in 0.2s ease" }} onClick={onClose}>
      <GlassCard style={{ width: 340, margin: "56px 16px 0 0", padding: "20px", animation: "slide-in-left 0.3s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <NeonText color={NEON.magenta} size="0.9rem">SOVEREIGN PROFILE</NeonText>
          <button onClick={onClose} style={{ background: "none", border: "none", color: NEON.textMuted, cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(255,46,159,0.06)", borderRadius: 8, marginBottom: 16, border: "1px solid rgba(255,46,159,0.15)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: GRADIENT_BORDER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron'", fontWeight: 900, color: "#fff", fontSize: "1.2rem" }}>{user?.displayName?.[0] || "S"}</div>
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, color: NEON.text }}>{user?.displayName}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted }}>{user?.email}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.blue, marginTop: 2 }}>● {user?.provider} · Passkey bound</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, marginBottom: 8, letterSpacing: "0.1em" }}>MONITORED EMAIL ADDRESSES</div>
          {savedEmails.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(0,212,255,0.04)", borderRadius: 6, marginBottom: 4, border: "1px solid rgba(0,212,255,0.1)" }}>
              <span style={{ color: NEON.blue, fontSize: "0.75rem" }}>✉</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.text, flex: 1 }}>{e}</span>
              <StatusBadge type="KNOXED" />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div className="neon-border" style={{ flex: 1, borderRadius: 6 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Add email to monitor" style={{ width: "100%", background: "rgba(0,212,255,0.04)", border: "none", outline: "none", padding: "8px 10px", borderRadius: 6, color: NEON.text, fontFamily: "'Rajdhani'", fontSize: "0.8rem" }} />
            </div>
            <NeonButton size="sm" color={NEON.blue} onClick={() => { if (email.trim()) { setSavedEmails(p => [...p, email.trim()]); setEmail(""); } }}>ADD</NeonButton>
          </div>
        </div>
        <div style={{ height: 1, background: `${NEON.blue}22`, margin: "12px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[["🔑", "Passkey Settings", NEON.blue], ["☁️", "Backup to Google Account", NEON.blue], ["🍎", "Backup to Apple Account", NEON.textMuted], ["🔓", "Sign Out", NEON.magenta]].map(([icon, label, color]) => (
            <button key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "transparent", border: `1px solid ${color}22`, borderRadius: 6, color, fontFamily: "'Rajdhani'", fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// ─── MAIN APP SHELL ─────────────────────────────────────────────────
export function ArchitectAIApp({ user }: { user: any }) {
  const { findings, triggerModuleScan, isScanning, scanProgress, currentModule } = useScan();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string, timestamp: Date }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (msg: string) => {
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg, timestamp: new Date() }]);
    setLoading(true);
    try {
      const response = await chatComplete(msg, "", false, messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content
      })));
      setMessages(prev => [...prev, { role: "model", content: response.text, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", content: "⚠️ Secure channel temporarily interrupted.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMain = () => {
    if (activeSection === "architect") return <ArchitectAIView user={user} findings={findings} onSendMessage={handleSendMessage} />;
    if (activeSection === "report") return <ReportView findings={findings} />;
    if (activeSection === "modules" && activeModule) return <ModuleDetailView findings={findings} moduleId={activeModule} onScan={triggerModuleScan} />;
    return <DashboardView findings={findings} onModuleClick={(id) => { setActiveModule(id); setActiveSection("modules"); }} />;
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: NEON.bg, overflow: "hidden" }}>
        <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", flexShrink: 0 }} />
        <div style={{ height: 56, background: "rgba(6,13,31,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, position: "relative" }}>
          <div style={{ height: 1, position: "absolute", bottom: 0, left: 0, right: 0, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 4s linear infinite", opacity: 0.6 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f0", boxShadow: "0 0 8px #0f0", animation: "pulse-border 1.5s infinite" }} />
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: "#0f0", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
          <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.blue }}>
            {new Date().toLocaleTimeString("en-US", { hour12: false })} UTC
          </span>
          <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.orange, letterSpacing: "0.08em" }}>ECRA 2026 · GDPR · CCPA</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: NEON.textMuted }}>DIFF ACTIVE</span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: NEON.blue, animation: "glow-pulse 2s infinite" }} />
          </div>
          <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />
          {user?.isAdmin && (
            <NeonButton onClick={() => setShowAdmin(true)} color={NEON.orange} size="sm">⬡ ADMIN</NeonButton>
          )}
          <button className="btn-neon neon-border" onClick={() => setShowProfile(true)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,46,159,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NEON.magenta, fontSize: "1rem" }}>
            {user?.displayName ? user.displayName[0] : "S"}
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ width: 260, height: "100vh", background: "rgba(6,13,31,0.97)", borderRight: "1px solid rgba(0,212,255,0.12)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${NEON.blue}44, transparent)`, animation: "scan-line 4s linear infinite", pointerEvents: "none", zIndex: 10 }} />
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 32 32" width="28" style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
                  <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
                  <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.8" opacity="0.7" />
                  <text x="16" y="20" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="8" fontWeight="900">AI</text>
                </svg>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", fontWeight: 700, color: NEON.blue, letterSpacing: "0.1em" }}>ARCHITECT AI</div>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>AGAPE SOVEREIGN 2026</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1, background: "rgba(255,46,159,0.1)", borderRadius: 6, padding: "4px 8px", textAlign: "center", border: "1px solid rgba(255,46,159,0.2)" }}>
                  <div style={{ color: NEON.magenta, fontFamily: "'Orbitron'", fontSize: "0.85rem", fontWeight: 700 }}>{findings.filter(f => f.status === 'NUKED').length}</div>
                  <div style={{ color: NEON.textMuted, fontSize: "0.58rem", letterSpacing: "0.1em" }}>NUKED</div>
                </div>
                <div style={{ flex: 1, background: "rgba(0,212,255,0.08)", borderRadius: 6, padding: "4px 8px", textAlign: "center", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <div style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: "0.85rem", fontWeight: 700 }}>{findings.filter(f => f.status === 'KNOXED').length}</div>
                  <div style={{ color: NEON.textMuted, fontSize: "0.58rem", letterSpacing: "0.1em" }}>KNOXED</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 8px 4px" }}>
              {[
                { id: "dashboard", icon: "⬡", label: "DASHBOARD" },
                { id: "architect", icon: "◈", label: "ARCHITECT AI" },
                { id: "report", icon: "⊟", label: "DIFF REPORT" },
              ].map(s => (
                <div key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`} onClick={() => { setActiveSection(s.id); setActiveModule(null); }} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 2, display: "flex", alignItems: "center", gap: 10, borderLeft: activeSection === s.id ? `2px solid ${NEON.blue}` : "2px solid transparent" }}>
                  <span style={{ color: NEON.blue, fontSize: "1rem", width: 20 }}>{s.icon}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: 600, color: activeSection === s.id ? NEON.blue : NEON.text, letterSpacing: "0.08em" }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ margin: "8px 16px", height: 1, background: GRADIENT_BORDER, opacity: 0.3 }} />
            <div style={{ padding: "6px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>DIFF MODULES</span>
              <div style={{ flex: 1, height: 1, background: `${NEON.orange}44` }} />
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange }}>16</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
              {IDENTITY_VECTORS.map((m) => {
                const isActive = activeModule === m.id;
                const finding = findings.find(f => f.module === m.id);
                const sev = finding?.severity || 100;
                const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
                return (
                  <div key={m.id} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => { setActiveModule(m.id); setActiveSection("modules"); }} style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 1, display: "flex", alignItems: "center", gap: 8, borderLeft: isActive ? `2px solid ${sevColor}` : "2px solid transparent", background: isActive ? `rgba(${sev > 80 ? "0,212,255" : sev > 60 ? "255,122,24" : "255,46,159"},0.06)` : "transparent" }}>
                    <span style={{ color: sevColor, fontSize: "0.85rem", width: 16, textAlign: "center", flexShrink: 0 }}>{m.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: isActive ? sevColor : NEON.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted }}>{m.id} · {findings.filter(f => f.module === m.id && f.status === 'NUKED').length}🔥 {findings.filter(f => f.module === m.id && f.status === 'KNOXED').length}🛡️</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: `1.5px solid ${sevColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Orbitron'", fontSize: "0.5rem", color: sevColor, fontWeight: 700 }}>{sev}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", opacity: 0.8 }} />
          </div>
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "20%", right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "20%", left: "20%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto" }}>
              {renderMain()}
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear reverse infinite", flexShrink: 0 }} />
      </div>
      {showAdmin && <AdminPortalView onClose={() => setShowAdmin(false)} />}
      {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}

export default ArchitectAIApp;
