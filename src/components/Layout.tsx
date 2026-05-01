import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { NEON, NeonText, NeonButton } from './UI';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Settings, Search, Shield, ChevronDown, FileText, History } from 'lucide-react';

const DIFF_MODULES = [
  { id: "email", icon: "✉", label: "Email Breach Scanner", vector: "V-01", nuked: 3, knoxed: 12, monitored: 2, severity: 72, to: "/email" },
  { id: "social", icon: "◈", label: "Social Media Footprint", vector: "V-02", nuked: 7, knoxed: 8, monitored: 5, severity: 61, to: "/social" },
  { id: "device", icon: "⬡", label: "Device File Scan", vector: "V-03", nuked: 1, knoxed: 24, monitored: 3, severity: 88, to: "/device" },
  { id: "mobile", icon: "◻", label: "Mobile Security Layer", vector: "V-04", nuked: 0, knoxed: 18, monitored: 1, severity: 95, to: "/system" },
  { id: "deepweb", icon: "◉", label: "Deep Web Exposure", vector: "V-05", nuked: 5, knoxed: 3, monitored: 8, severity: 42, to: "/deepweb" },
  { id: "broker", icon: "⧫", label: "Data Broker Removal", vector: "V-06", nuked: 12, knoxed: 4, monitored: 6, severity: 38, to: "/databroker" },
  { id: "password", icon: "⬟", label: "Password Vault Analysis", vector: "V-07", nuked: 2, knoxed: 31, monitored: 0, severity: 91, to: "/password" },
  { id: "location", icon: "◎", label: "Location Data Footprint", vector: "V-08", nuked: 4, knoxed: 9, monitored: 7, severity: 55, to: "/location" },
  { id: "browser", icon: "◯", label: "Browser & Cookie Tracker", vector: "V-09", nuked: 8, knoxed: 6, monitored: 11, severity: 49, to: "/browser" },
  { id: "financial", icon: "⬡", label: "Financial Identity Exposure", vector: "V-10", nuked: 1, knoxed: 15, monitored: 2, severity: 87, to: "/financial" },
  { id: "medical", icon: "⊕", label: "Medical Data Footprint", vector: "V-11", nuked: 0, knoxed: 7, monitored: 1, severity: 93, to: "/medical" },
  { id: "biometric", icon: "⊛", label: "Voice & Biometric Data", vector: "V-12", nuked: 2, knoxed: 11, monitored: 4, severity: 79, to: "/biometric" },
  { id: "iot", icon: "⊡", label: "IoT & Smart Device Scan", vector: "V-13", nuked: 3, knoxed: 8, monitored: 5, severity: 66, to: "/iot" },
  { id: "cloud", icon: "⊞", label: "Cloud Storage Exposure", vector: "V-14", nuked: 1, knoxed: 19, monitored: 2, severity: 85, to: "/cloud" },
  { id: "darkweb", icon: "◈", label: "Dark Web Monitoring", vector: "V-15", nuked: 6, knoxed: 2, monitored: 9, severity: 34, to: "/darkweb" },
  { id: "behavioral", icon: "⊟", label: "Behavioral Profile Analysis", vector: "V-16", nuked: 4, knoxed: 13, monitored: 6, severity: 71, to: "/behavioral" },
];

const Sidebar = () => {
  const location = useLocation();
  const { findings } = useScan();
  const { isAdmin } = useAuth();
  const sections = [
    { id: "dashboard", icon: "⬡", label: "DASHBOARD", to: "/" },
    { id: "architect", icon: "◈", label: "ARCHITECT AI", to: "/architect" },
    { id: "security", icon: "🛡️", label: "SECURITY TIPS", to: "/security-tips" },
    { id: "settings", icon: "⚙", label: "SETTINGS", to: "/settings" },
    { id: "report", icon: "⊟", label: "IDENTITY AUDIT REPORT", to: "/" },
  ];

  if (isAdmin) {
    sections.push({ id: "admin", icon: "⬢", label: "ADMIN PORTAL", to: "/admin" });
  }

  const totalNuked = findings.filter(f => f.status === 'NUKED').length;
  const totalKnoxed = findings.filter(f => f.status === 'KNOXED').length;

  return (
    <div style={{ width: 260, height: "100vh", background: "rgba(6,13,31,0.97)", borderRight: "1px solid rgba(0,212,255,0.12)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }} className="sticky top-0">
      {/* Scanning line */}
      <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${NEON.blue}44, transparent)`, animation: "scan-line 4s linear infinite", pointerEvents: "none", zIndex: 10 }} />

      {/* Logo area */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg viewBox="0 0 32 32" width="28" style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
            <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.8" opacity="0.7" />
            <text x="16" y="20" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="8" fontWeight="900">AI</text>
          </svg>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", fontWeight: 700, color: NEON.blue, letterSpacing: "0.1em" }}>AGAPE SOVEREIGN</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>ARCHITECT AI 2026</div>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, background: "rgba(255,46,159,0.1)", borderRadius: 6, padding: "4px 8px", textAlign: "center", border: "1px solid rgba(255,46,159,0.2)" }}>
            <div style={{ color: NEON.magenta, fontFamily: "'Orbitron'", fontSize: "0.85rem", fontWeight: 700 }}>{totalNuked}</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.58rem", letterSpacing: "0.1em" }}>NUKED</div>
          </div>
          <div style={{ flex: 1, background: "rgba(0,212,255,0.08)", borderRadius: 6, padding: "4px 8px", textAlign: "center", border: "1px solid rgba(0,212,255,0.2)" }}>
            <div style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: "0.85rem", fontWeight: 700 }}>{totalKnoxed}</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.58rem", letterSpacing: "0.1em" }}>KNOXED</div>
          </div>
        </div>
      </div>

      {/* Main sections */}
      <div style={{ padding: "12px 8px 4px" }}>
        {sections.map(s => {
          const isActive = location.pathname === s.to;
          return (
            <NavLink 
              key={s.id} 
              to={s.to}
              className={({ isActive: isLinkActive }) => `nav-item ${isLinkActive ? "active" : ""}`}
              style={{ 
                padding: "10px 12px", 
                borderRadius: 8, 
                marginBottom: 2, 
                display: "flex", 
                alignItems: "center", 
                gap: 10, 
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill-main"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 212, 255, 0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    zIndex: 0,
                    boxShadow: `0 0 15px ${NEON.blue}22`
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <motion.span 
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  filter: isActive ? `drop-shadow(0 0 8px ${NEON.blue})` : 'none',
                  x: isActive ? 2 : 0
                }}
                style={{ color: isActive ? NEON.blue : 'rgba(0, 212, 255, 0.6)', fontSize: "1rem", width: 20, position: 'relative', zIndex: 1 }}
              >
                {s.icon}
              </motion.span>
              <motion.span 
                animate={{ x: isActive ? 2 : 0 }}
                style={{ 
                  fontFamily: "'Orbitron', monospace", 
                  fontSize: "0.68rem", 
                  fontWeight: 600, 
                  color: isActive ? NEON.blue : NEON.text, 
                  letterSpacing: "0.08em",
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {s.label}
              </motion.span>
            </NavLink>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ margin: "8px 16px", height: 1, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", opacity: 0.3 }} />

      {/* DIFF Modules label */}
      <div style={{ padding: "6px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>DIFF MODULES</span>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}44` }} />
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange }}>16</span>
      </div>

      {/* Scrollable modules */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {DIFF_MODULES.map((m) => {
          const isActive = (location.pathname === m.to && m.to !== '/') || (location.pathname.startsWith(m.to) && m.to !== '/');
          const moduleFindings = findings.filter(f => f.module === m.id);
          const nuked = moduleFindings.filter(f => f.status === 'NUKED').length;
          const knoxed = moduleFindings.filter(f => f.status === 'KNOXED').length;
          const monitored = moduleFindings.filter(f => f.status === 'MONITORED').length;

          let sev = 100;
          if (moduleFindings.length > 0) {
            const points = knoxed * 10 + monitored * 5;
            sev = Math.round((points / (moduleFindings.length * 10)) * 100);
          }

          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          const statusColor = nuked > 0 ? NEON.magenta : monitored > 0 ? NEON.orange : knoxed > 0 ? NEON.blue : 'rgba(255,255,255,0.1)';

          return (
            <NavLink 
              key={m.id} 
              to={m.to}
              className={({ isActive: isLinkActive }) => `nav-item ${isActive ? "active" : ""}`}
              style={{ 
                padding: "8px 10px", 
                borderRadius: 6, 
                marginBottom: 1, 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                textDecoration: 'none', 
                position: 'relative',
                transition: 'background 0.2s ease'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill-module"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(${sev > 80 ? "0,212,255" : sev > 60 ? "255,122,24" : "255,46,159"},0.08)`,
                    borderRadius: 6,
                    borderLeft: `2px solid ${sevColor}`,
                    zIndex: 0,
                    boxShadow: `0 0 12px ${sevColor}11`
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Mini Severity Progress Bar */}
              <div style={{ width: 32, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                <div style={{ 
                  width: '100%', 
                  height: 3, 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: 1.5, 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${sev}%` }}
                    style={{ 
                      height: '100%', 
                      background: sevColor,
                      boxShadow: `0 0 8px ${sevColor}`
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  {/* Scanning sweep animation */}
                  <motion.div
                    animate={{ x: [-32, 64] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: 16,
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                      zIndex: 2,
                      opacity: isActive ? 1 : 0.4
                    }}
                  />
                </div>
              </div>

              <motion.span 
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  filter: isActive ? `drop-shadow(0 0 6px ${sevColor})` : 'none',
                  x: isActive ? 2 : 0
                }}
                style={{ color: sevColor, fontSize: "0.85rem", width: 16, textAlign: "center", flexShrink: 0, position: 'relative', zIndex: 1 }}
              >
                {m.icon}
              </motion.span>
              <motion.div 
                animate={{ x: isActive ? 2 : 0 }}
                style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}
              >
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: isActive ? sevColor : NEON.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted }}>{m.vector} · {nuked}🔥 {knoxed}🛡️</div>
              </motion.div>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: "50%", 
                border: `1.5px solid ${sevColor}`, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
                background: isActive ? `${sevColor}11` : 'transparent'
              }}>
                <span style={{ fontFamily: "'Orbitron'", fontSize: "0.5rem", color: sevColor, fontWeight: 700 }}>{sev}</span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom pulsing line */}
      <div style={{ height: 2, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", opacity: 0.8 }} />
    </div>
  );
};

const Header = () => {
  const { user, isAdmin, isAnonymous, logout, sovereignScore, bindPasskey } = useAuth();
  const { isScanning } = useScan();
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { 
    const t = setInterval(() => setTime(new Date()), 1000); 
    return () => clearInterval(t); 
  }, []);

  const filteredModules = DIFF_MODULES.filter(m => 
    m.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.vector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: 56, background: "rgba(6,13,31,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, position: "relative" }} className="sticky top-0 z-10">
      <div style={{ height: 1, position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", backgroundSize: "200% 100%", animation: "rotate-gradient 4s linear infinite", opacity: 0.6 }} />

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: isScanning ? NEON.orange : "#0f0", boxShadow: `0 0 8px ${isScanning ? NEON.orange : "#0f0"}`, animation: "pulse-border 1.5s infinite" }} />
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: isScanning ? NEON.orange : "#0f0", letterSpacing: "0.1em" }}>
          {isScanning ? "SCANNING" : "LIVE"}
        </span>
      </div>

      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />

      {/* Time */}
      <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.blue }}>
        {time.toLocaleTimeString("en-US", { hour12: false })} UTC
      </span>

      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />

      <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.orange, letterSpacing: "0.08em" }}>
        ECRA 2026 · GDPR · CCPA
      </span>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00D4FF] opacity-70" />
          <input
            type="text"
            placeholder="Search DIFF Modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            style={{
              width: '100%',
              background: 'rgba(0,212,255,0.05)',
              border: `1px solid rgba(0,212,255,${isSearchFocused ? 0.4 : 0.1})`,
              borderRadius: 6,
              padding: '6px 12px 6px 36px',
              color: NEON.text,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.8rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: isSearchFocused ? `0 0 12px rgba(0,212,255,0.2)` : 'none'
            }}
          />
          {isSearchFocused && searchQuery && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 8,
              background: 'rgba(6,13,31,0.95)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 6,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              zIndex: 50,
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {filteredModules.length > 0 ? (
                filteredModules.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      navigate(m.to);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(0,212,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,212,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: NEON.blue }}>{m.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', color: NEON.text }}>{m.label}</div>
                      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: NEON.textMuted }}>{m.vector}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: NEON.textMuted, fontFamily: "'Share Tech Mono'", fontSize: '0.75rem' }}>
                  No modules found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DIFF label */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: NEON.textMuted }}>DIFF {isScanning ? "BUSY" : "ACTIVE"}</span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isScanning ? NEON.orange : NEON.blue, animation: "glow-pulse 2s infinite" }} />
      </div>

      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />

      {/* Admin portal button - only shown for admins */}
      {isAdmin && (
        <NavLink to="/admin" style={{ textDecoration: 'none' }}>
          <NeonButton color={NEON.orange} size="sm">⬡ ADMIN</NeonButton>
        </NavLink>
      )}

      {/* Profile button */}
      <div className="flex items-center gap-3 pl-6 border-l border-white/10 relative">
        {isAnonymous && (
          <button 
            onClick={bindPasskey}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FF7A18]/10 border border-[#FF7A18]/30 rounded-lg text-[#FF7A18] text-[10px] font-bold tracking-tighter hover:bg-[#FF7A18]/20 transition-all mr-2"
          >
            <Shield className="w-3 h-3" />
            BIND PASSKEY
          </button>
        )}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white group-hover:text-[#00D4FF] transition-colors">
              {isAnonymous ? 'Anonymous Sovereign' : (user?.displayName || 'Sovereign User')}
            </span>
            <span className="text-xs text-slate-400 font-mono">{sovereignScore} SCORE</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF2E9F] to-[#00D4FF] p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0B1020] flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
        </div>

        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-[#0B1020] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-white/5">
              <div className="text-xs font-mono text-[#00D4FF] mb-1">
                {isAnonymous ? 'TEMPORARY SESSION' : 'SOVEREIGN IDENTITY'}
              </div>
              <div className="text-sm font-medium text-white truncate">
                {isAnonymous ? 'Identity Not Bound' : user?.email}
              </div>
            </div>
            <div className="p-2 border-b border-white/5">
              <button 
                onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-[#00D4FF]" />
                Profile Settings
              </button>
              <button 
                onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              >
                <History className="w-4 h-4 text-[#FF2E9F]" />
                Score History
              </button>
            </div>
            <div className="p-2">
              {isAnonymous && (
                <button 
                  onClick={bindPasskey}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#FF7A18] hover:bg-[#FF7A18]/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer mb-1"
                >
                  <Shield className="w-4 h-4" />
                  Bind Google Passkey
                </button>
              )}
              <a 
                href="/TERMS.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors no-underline"
              >
                <FileText className="w-4 h-4 text-[#FF7A18]" />
                Terms of Service
              </a>
              <a 
                href="/privacy.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors no-underline"
              >
                <Shield className="w-4 h-4 text-[#00D4FF]" />
                Privacy Policy
              </a>
            </div>
            <div className="p-2 border-t border-white/5">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-[#FF2E9F] hover:bg-[#FF2E9F]/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Layout = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: NEON.bg, overflow: "hidden" }}>
      {/* Top border gradient */}
      <div style={{ height: 2, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", flexShrink: 0 }} />

      <Header />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar />

        {/* Main content */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {/* Background grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
          {/* Glow orbs */}
          <div style={{ position: "absolute", top: "20%", right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", left: "20%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
          
          <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-8 max-w-6xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom border gradient */}
      <div style={{ height: 2, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite reverse", flexShrink: 0 }} />
    </div>
  );
};
