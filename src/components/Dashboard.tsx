import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { NEON, NeonText, GlassCard, NeonButton, StatusBadge, Skeleton } from './UI';
import { motion } from 'framer-motion';
import { Download, Filter, ArrowUpDown, TrendingUp } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const MODULE_CONFIG = [
  { id: "email", icon: "✉", label: "Email Breach Scanner", vector: "V-01", to: "/email" },
  { id: "social", icon: "◈", label: "Social Media Footprint", vector: "V-02", to: "/social" },
  { id: "device", icon: "⬡", label: "Device File Scan", vector: "V-03", to: "/device" },
  { id: "mobile", icon: "◻", label: "Mobile Security Layer", vector: "V-04", to: "/system" },
  { id: "deepweb", icon: "◉", label: "Deep Web Exposure", vector: "V-05", to: "/deepweb" },
  { id: "broker", icon: "⧫", label: "Data Broker Removal", vector: "V-06", to: "/databroker" },
  { id: "password", icon: "⬟", label: "Password Vault Analysis", vector: "V-07", to: "/password" },
  { id: "location", icon: "◎", label: "Location Data Footprint", vector: "V-08", to: "/location" },
  { id: "browser", icon: "◯", label: "Browser & Cookie Tracker", vector: "V-09", to: "/browser" },
  { id: "medical", icon: "⊕", label: "Medical Data Footprint", vector: "V-10", to: "/medical" },
  { id: "biometric", icon: "⊛", label: "Voice & Biometric Data", vector: "V-11", to: "/biometric" },
  { id: "iot", icon: "⊡", label: "IoT & Smart Device Scan", vector: "V-12", to: "/iot" },
  { id: "cloud", icon: "⊞", label: "Cloud Storage Exposure", vector: "V-13", to: "/cloud" },
  { id: "darkweb", icon: "◈", label: "Dark Web Monitoring", vector: "V-14", to: "/darkweb" },
  { id: "behavioral", icon: "⊟", label: "Behavioral Profile Analysis", vector: "V-15", to: "/behavioral" },
  { id: "erasure", icon: "⌫", label: "Sovereign Erasure Engine", vector: "V-16", to: "/erasure" },
];

const SovereignScore = ({ score }: { score: number }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle 
          cx={cx} cy={cy} r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth="8"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round" 
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="22" fontWeight="900">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SOVEREIGN</text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SCORE</text>
      </svg>
    </div>
  );
};

const ModuleScoreRing = ({ score, size = 42 }: { score: number, size?: number }) => {
  const r = (size / 2) - 4;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 80 ? NEON.blue : score > 60 ? NEON.orange : NEON.magenta;
  
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ filter: score > 0 ? `drop-shadow(0 0 4px ${color}44)` : 'none' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <motion.circle 
          cx={cx} cy={cy} r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth="3"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round" 
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text 
          x={cx} 
          y={cy + 1} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill={color} 
          fontFamily="Orbitron" 
          fontSize={size > 40 ? "9" : "8"} 
          fontWeight="900"
        >
          {score}
        </text>
      </svg>
    </div>
  );
};

export const Dashboard = () => {
  const { user, sovereignScore } = useAuth();
  const { findings, isLoading, isScanning, scanProgress, currentStep, totalSteps, currentModule, lastScanDate, error, triggerFullScan } = useScan();
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NUKED' | 'KNOXED' | 'MONITORED'>('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [scoreHistory, setScoreHistory] = useState<{ score: number, timestamp: string }[]>([]);

  const currentModuleLabel = useMemo(() => {
    if (!currentModule) return "";
    return MODULE_CONFIG.find(m => m.id === currentModule)?.label || currentModule.toUpperCase();
  }, [currentModule]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "score_history"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        score: doc.data().score,
        timestamp: doc.data().timestamp?.toDate().toLocaleDateString() || ''
      }));
      setScoreHistory(history);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'score_history');
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const nuked = findings.filter(f => f.status === 'NUKED').length;
    const knoxed = findings.filter(f => f.status === 'KNOXED').length;
    const monitored = findings.filter(f => f.status === 'MONITORED').length;
    return { nuked, knoxed, monitored };
  }, [findings]);

  const recentFindings = useMemo(() => {
    let filtered = [...findings];
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }
    
    return filtered
      .sort((a, b) => {
        const timeA = a.timestamp.getTime();
        const timeB = b.timestamp.getTime();
        return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
      })
      .slice(0, 10); // Increased slice to show more when filtered
  }, [findings, filterStatus, sortOrder]);

  const modules = useMemo(() => {
    return MODULE_CONFIG.map(config => {
      const moduleFindings = findings.filter(f => f.module === config.id);
      const nuked = moduleFindings.filter(f => f.status === 'NUKED').length;
      const knoxed = moduleFindings.filter(f => f.status === 'KNOXED').length;
      const monitored = moduleFindings.filter(f => f.status === 'MONITORED').length;
      
      // Calculate severity for this module
      let severity = 100;
      if (moduleFindings.length > 0) {
        const points = knoxed * 10 + monitored * 5;
        severity = Math.round((points / (moduleFindings.length * 10)) * 100);
      }

      return { ...config, nuked, knoxed, monitored, severity };
    });
  }, [findings]);

  const exportToCSV = () => {
    if (findings.length === 0) return;

    const headers = ["Module", "Finding", "Status", "Timestamp", "Details"];
    const rows = findings.map(f => [
      f.module.toUpperCase(),
      `"${f.finding.replace(/"/g, '""')}"`,
      f.status,
      f.timestamp.toISOString(),
      `"${f.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `diff_scan_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ animation: "fade-in 0.4s ease" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 6 }}>DIGITAL IDENTITY FEDERATED FOOTPRINT</div>
          <NeonText color={NEON.blue} size="1.5rem" weight={900}>IDENTITY COMMAND CENTER</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: 4 }}>16-Layer identity vector analysis · Real-time threat intelligence for {user?.email}</div>
          
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
              <NeonButton 
                onClick={triggerFullScan} 
                disabled={isScanning} 
                color={NEON.orange}
                style={{ padding: "12px 24px", position: 'relative', overflow: 'hidden' }}
              >
                {isScanning && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    style={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: 0, 
                      bottom: 0, 
                      background: 'rgba(255, 122, 24, 0.3)', 
                      zIndex: 0 
                    }} 
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {isScanning ? `⟳ SCANNING ${scanProgress}%` : "⚡ INITIATE FULL DIFF SCAN"}
                </span>
              </NeonButton>

              {isScanning && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.85rem", color: NEON.blue, whiteSpace: 'nowrap' }} className="animate-pulse">
                      V-VECTOR {currentStep + 1}/{totalSteps}: {currentModuleLabel}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.orange }}>
                      {scanProgress}% ANALYZED
                    </div>
                  </div>
                  <div style={{ width: 240, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      style={{ height: '100%', background: NEON.blue, boxShadow: `0 0 8px ${NEON.blue}` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <NeonButton 
              onClick={exportToCSV} 
              disabled={isScanning || findings.length === 0} 
              color={NEON.blue}
              style={{ padding: "12px 24px", display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={16} /> EXPORT CSV
            </NeonButton>
            
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.85rem" }}>
              {!isScanning && (
                <>
                  {error ? (
                    <span style={{ color: NEON.magenta }}>Error: {error}</span>
                  ) : lastScanDate ? (
                    <span style={{ color: "#0f0" }}>Scan Complete ({lastScanDate.toLocaleTimeString()})</span>
                  ) : (
                    <span style={{ color: NEON.textMuted }}>Ready to scan</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <SovereignScore score={sovereignScore} />
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <GlassCard key={i} style={{ padding: "16px" }}>
              <Skeleton width="60%" height="0.6rem" style={{ marginBottom: 12 }} />
              <Skeleton width="40%" height="1.8rem" style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height="0.7rem" />
            </GlassCard>
          ))
        ) : (
          [
            { label: "VECTORS ACTIVE", value: "16", sub: "All layers online", color: NEON.blue, mid: "kpi-vectors" },
            { label: "EXPOSURES FOUND", value: stats.nuked + stats.monitored, sub: "Across all surfaces", color: NEON.magenta, mid: "kpi-exposure" },
            { label: "SECURED", value: stats.knoxed, sub: "KNOXED & hardened", color: NEON.blue, mid: "kpi-secured" },
            { label: "CRITICAL FLAGS", value: stats.nuked, sub: "Require attention", color: NEON.orange, mid: "kpi-critical" },
          ].map((kpi) => (
            <GlassCard key={kpi.label} style={{ padding: "16px" }} footerSeal moduleId={kpi.mid} uid={user?.uid}>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em", marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.8rem", fontWeight: 900, color: kpi.color, textShadow: `0 0 12px ${kpi.color}66` }}>{kpi.value}</div>
              <div style={{ fontSize: "0.7rem", color: NEON.textMuted, marginTop: 4 }}>{kpi.sub}</div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Trend Graph */}
      <GlassCard style={{ padding: "20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <TrendingUp size={18} color={NEON.blue} />
          <NeonText color={NEON.blue} size="0.8rem" weight={700}>SOVEREIGN SCORE TREND</NeonText>
        </div>
        <div style={{ height: 200, width: '100%' }}>
          {isLoading ? (
            <Skeleton width="100%" height="100%" />
          ) : scoreHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreHistory}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NEON.blue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={NEON.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke={NEON.textMuted} 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke={NEON.textMuted} 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: NEON.bgCard, 
                    border: `1px solid ${NEON.blue}44`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'Rajdhani',
                    boxShadow: `0 4px 12px rgba(0, 212, 255, 0.1)`
                  }}
                  itemStyle={{ color: NEON.blue, fontWeight: 700, fontFamily: "'Orbitron', monospace" }}
                  labelStyle={{ color: NEON.textMuted, marginBottom: '4px', fontFamily: "'Share Tech Mono'" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke={NEON.blue} 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  strokeWidth={2}
                  animationDuration={1500}
                  dot={{ r: 3, fill: NEON.bgCard, stroke: NEON.blue, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: NEON.blue, stroke: NEON.bgCard, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: NEON.textMuted, fontFamily: "'Share Tech Mono'", fontSize: "0.8rem" }}>
              INSUFFICIENT DATA FOR TREND ANALYSIS
            </div>
          )}
        </div>
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <div>
          {/* Module Grid */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <NeonText color={NEON.orange} size="0.75rem" weight={700}>IDENTITY VECTOR MODULES</NeonText>
            <div style={{ flex: 1, height: 1, background: `${NEON.orange}33` }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <GlassCard key={i} style={{ padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <Skeleton width="24px" height="24px" borderRadius="50%" />
                    <Skeleton width="40px" height="14px" />
                  </div>
                  <Skeleton width="80%" height="0.8rem" style={{ marginBottom: 12 }} />
                  <Skeleton width="100%" height="2px" style={{ marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton width="20px" height="10px" />
                    <Skeleton width="20px" height="10px" />
                    <Skeleton width="20px" height="10px" />
                  </div>
                </GlassCard>
              ))
            ) : (
              modules.map((m) => {
                const sev = m.severity;
                const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
                return (
                  <GlassCard 
                    key={m.id} 
                    className="module-card" 
                    style={{ 
                      padding: "14px", 
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                    onClick={() => navigate(m.to)}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '8px', 
                        background: `${sevColor}11`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${sevColor}22`
                      }}>
                        <span style={{ color: sevColor, fontSize: "1.1rem" }}>{m.icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontFamily: "'Rajdhani'", 
                          fontSize: "0.85rem", 
                          fontWeight: 700, 
                          color: NEON.text, 
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {m.label}
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, marginTop: 2 }}>{m.vector}</div>
                      </div>
                      <ModuleScoreRing score={sev} />
                    </div>

                    
                    {/* Status Pill Counts */}
                    <div style={{ display: "flex", gap: 4 }}>
                      <div style={{ 
                        flex: 1, 
                        background: `${NEON.magenta}11`, 
                        border: `1px solid ${NEON.magenta}22`, 
                        borderRadius: 4, 
                        padding: "4px 6px", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center" 
                      }}>
                        <span style={{ fontSize: "0.5rem", color: NEON.magenta, fontWeight: 700, fontFamily: "'Orbitron'" }}>NUKED</span>
                        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.75rem", color: NEON.text, fontWeight: 700 }}>{m.nuked}</span>
                      </div>
                      <div style={{ 
                        flex: 1, 
                        background: `${NEON.blue}11`, 
                        border: `1px solid ${NEON.blue}22`, 
                        borderRadius: 4, 
                        padding: "4px 6px", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center" 
                      }}>
                        <span style={{ fontSize: "0.5rem", color: NEON.blue, fontWeight: 700, fontFamily: "'Orbitron'" }}>KNOX</span>
                        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.75rem", color: NEON.text, fontWeight: 700 }}>{m.knoxed}</span>
                      </div>
                      <div style={{ 
                        flex: 1, 
                        background: `${NEON.orange}11`, 
                        border: `1px solid ${NEON.orange}22`, 
                        borderRadius: 4, 
                        padding: "4px 6px", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center" 
                      }}>
                        <span style={{ fontSize: "0.5rem", color: NEON.orange, fontWeight: 700, fontFamily: "'Orbitron'" }}>WATCH</span>
                        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.75rem", color: NEON.text, fontWeight: 700 }}>{m.monitored}</span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>

        <div>
          {/* Latest Intelligence Feed */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <NeonText color={NEON.blue} size="0.75rem" weight={700}>INTELLIGENCE FEED</NeonText>
            <div style={{ flex: 1, height: 1, background: `${NEON.blue}33` }} />
          </div>

          <GlassCard style={{ padding: "16px", minHeight: 400 }} footerSeal moduleId="intelligence-feed" uid={user?.uid}>
            {/* Filter and Sort Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Filter size={12} color={NEON.textMuted} />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'NUKED' | 'KNOXED' | 'MONITORED')}
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    color: NEON.blue, 
                    fontFamily: "'Share Tech Mono'", 
                    fontSize: "0.7rem",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="ALL">ALL STATUS</option>
                  <option value="NUKED">NUKED</option>
                  <option value="KNOXED">KNOXED</option>
                  <option value="MONITORED">MONITORED</option>
                </select>
              </div>
              
              <button 
                onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: NEON.textMuted, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  cursor: "pointer",
                  fontFamily: "'Share Tech Mono'",
                  fontSize: "0.7rem"
                }}
              >
                <ArrowUpDown size={12} />
                {sortOrder === 'DESC' ? 'NEWEST' : 'OLDEST'}
              </button>
            </div>

            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} style={{ paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Skeleton width="70%" height="0.8rem" />
                      <Skeleton width="60px" height="18px" borderRadius="10px" />
                    </div>
                    <Skeleton width="40%" height="0.6rem" />
                  </div>
                ))}
              </div>
            ) : recentFindings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentFindings.map((finding) => {
                  const statusColor = finding.status === 'NUKED' ? NEON.magenta : finding.status === 'KNOXED' ? NEON.blue : NEON.orange;
                  return (
                    <motion.div 
                      key={finding.id} 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      style={{ 
                        padding: "12px", 
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.02)",
                        borderLeft: `3px solid ${statusColor}`,
                        boxShadow: finding.status === 'NUKED' ? `0 0 15px ${statusColor}11` : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontFamily: "'Rajdhani'", fontSize: "0.85rem", fontWeight: 600, color: NEON.text, flex: 1, paddingRight: 12 }}>{finding.finding}</div>
                        <StatusBadge type={finding.status} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.textMuted }}>
                          {finding.module.toUpperCase()} · {finding.timestamp.toLocaleTimeString()}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: statusColor, fontFamily: "'Orbitron'", fontWeight: 700, letterSpacing: '0.05em' }}>
                          {finding.status === 'NUKED' ? 'CRITICAL' : finding.status === 'KNOXED' ? 'SECURED' : 'WATCHING'}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: NEON.textMuted, textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: 12, opacity: 0.3 }}>⬡</div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.8rem" }}>NO RECENT INTELLIGENCE</div>
                <div style={{ fontSize: "0.7rem", marginTop: 4 }}>Initiate scan to populate feed</div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
