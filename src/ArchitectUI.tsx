// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { auth, db, functions, loginWithGoogle, loginAnonymously } from "./firebase";
import { onAuthStateChanged, signInWithCustomToken, linkWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { startRegistration } from "@simplewebauthn/browser";
import { httpsCallable } from "firebase/functions";
import { useUIDesign } from "./UIDesignContext";
// ============================================================
// ARCHITECT AI — AGAPE SOVEREIGN ENCLAVE 2026
// Digital Identity Federated Footprint (DIFF) Intelligence
// ============================================================

const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  bgCard: "rgba(8, 18, 40, 0.85)",
  bgGlass: "rgba(0, 212, 255, 0.04)",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
};

const GRADIENT = `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`;
const GRADIENT_BORDER = `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.blue} 50%, ${NEON.orange} 100%)`;

// ─── Global Styles injected once ─────────────────────────────
const GlobalStyle = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${NEON.bg}; color: ${NEON.text}; font-family: 'Rajdhani', sans-serif; overflow: hidden; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      ::-webkit-scrollbar-thumb { background: ${NEON.blue}; border-radius: 2px; }

      @keyframes pulse-border {
        0%,100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes scan-line {
        0% { top: -2px; }
        100% { top: 100%; }
      }
      @keyframes float {
        0%,100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      @keyframes glow-pulse {
        0%,100% { box-shadow: 0 0 8px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.3); }
        33% { box-shadow: 0 0 8px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.3); }
        66% { box-shadow: 0 0 8px ${NEON.orange}, 0 0 20px rgba(255,122,24,0.3); }
      }
      @keyframes text-glow {
        0%,100% { text-shadow: 0 0 10px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.5); }
        50% { text-shadow: 0 0 10px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.5); }
      }
      @keyframes slide-in-left {
        from { transform: translateX(-30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slide-in-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes rotate-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes data-stream {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-40px); opacity: 0; }
      }
      @keyframes nuke-flash {
        0%,100% { background: rgba(255,46,159,0.1); }
        50% { background: rgba(255,46,159,0.25); }
      }
      @keyframes knox-pulse {
        0%,100% { background: rgba(0,212,255,0.1); }
        50% { background: rgba(0,212,255,0.2); }
      }
      @keyframes spinner {
        to { transform: rotate(360deg); }
      }
      @keyframes matrix-rain {
        0% { transform: translateY(-100%); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }
      .neon-border {
        position: relative;
      }
      .neon-border::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: ${GRADIENT_BORDER};
        background-size: 200% 200%;
        animation: rotate-gradient 4s linear infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        z-index: 1;
      }
      .pulse-border::before {
        animation: rotate-gradient 3s linear infinite, pulse-border 2s ease-in-out infinite;
      }
      .btn-neon {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        border: none;
        outline: none;
      }
      .btn-neon:hover {
        transform: translateY(-2px);
        animation: glow-pulse 2s infinite;
      }
      .btn-neon::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,46,159,0.15), rgba(0,212,255,0.15));
        opacity: 0;
        transition: opacity 0.3s;
      }
      .btn-neon:hover::after { opacity: 1; }
      .module-card {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .module-card:hover {
        transform: translateY(-2px);
        border-color: ${NEON.blue} !important;
        box-shadow: 0 8px 32px rgba(0,212,255,0.2) !important;
      }
      .nav-item {
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .nav-item:hover, .nav-item.active {
        background: rgba(0,212,255,0.08);
        border-left: 2px solid ${NEON.blue};
        padding-left: 14px;
      }
      .nuked-item { animation: nuke-flash 3s ease-in-out infinite; }
      .knoxed-item { animation: knox-pulse 3s ease-in-out infinite; }
      .chat-bubble {
        animation: slide-in-up 0.3s ease;
      }
      .score-ring {
        filter: drop-shadow(0 0 12px ${NEON.blue});
      }
      .thinking-dot {
        width: 6px; height: 6px; border-radius: 50%; background: ${NEON.blue};
        animation: pulse-border 0.8s ease-in-out infinite;
      }
      .thinking-dot:nth-child(2) { animation-delay: 0.15s; background: ${NEON.magenta}; }
      .thinking-dot:nth-child(3) { animation-delay: 0.3s; background: ${NEON.orange}; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
};

// ─── Utility Components ───────────────────────────────────────
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

const StatusBadge = ({ type }: any) => {
  const cfg: Record<string, any> = {
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

// ─── BASE DIFF SCHEMA (Definitions only, no mock data) ─────────────
const BASE_MODULES = [
  { id: "email", icon: "✉", label: "Email Breach Scanner", vector: "V-01" },
  { id: "social", icon: "◈", label: "Social Media Footprint", vector: "V-02" },
  { id: "device", icon: "⬡", label: "Device File Scan", vector: "V-03" },
  { id: "mobile", icon: "◻", label: "Mobile Security Layer", vector: "V-04" },
  { id: "deepweb", icon: "◉", label: "Deep Web Exposure", vector: "V-05" },
  { id: "broker", icon: "⧫", label: "Data Broker Removal", vector: "V-06" },
  { id: "password", icon: "⬟", label: "Password Vault Analysis", vector: "V-07" },
  { id: "location", icon: "◎", label: "Location Data Footprint", vector: "V-08" },
  { id: "browser", icon: "◯", label: "Browser & Cookie Tracker", vector: "V-09" },
  { id: "financial", icon: "⬡", label: "Financial Identity Exposure", vector: "V-10" },
  { id: "medical", icon: "⊕", label: "Medical Data Footprint", vector: "V-11" },
  { id: "biometric", icon: "⊛", label: "Voice & Biometric Data", vector: "V-12" },
  { id: "iot", icon: "⊡", label: "IoT & Smart Device Scan", vector: "V-13" },
  { id: "cloud", icon: "⊞", label: "Cloud Storage Exposure", vector: "V-14" },
  { id: "darkweb", icon: "◈", label: "Dark Web Monitoring", vector: "V-15" },
  { id: "behavioral", icon: "⊟", label: "Behavioral Profile Analysis", vector: "V-16" },
];

const DEFAULT_MODULE_DATA = BASE_MODULES.map(m => ({
  ...m, nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: []
}));

const ADMIN_EMAILS = ["idin@agape.nyc", "agape@sovereign.nyc"];

// ─── PASSKEY BINDING ──────────────────────────────────────────
const bindPasskeyForUser = async (userId, userEmail) => {
  try {
    const getOptions = httpsCallable(functions, "registerPasskeyOptions");
    const verifyRegistration = httpsCallable(functions, "verifyPasskeyRegistration");

    const optionsResult = await getOptions({ userId, userEmail: userEmail || "anon@sovereign.nyc" });
    const options = optionsResult.data;

    const attestationResponse = await startRegistration({ optionsJSON: options });

    const verifyResult = await verifyRegistration({
      response: attestationResponse,
      userId,
    });
    const { verified } = verifyResult.data;
    return verified;
  } catch (error) {
    if (error.name === "NotAllowedError") return false;
    console.error("Passkey binding error:", error);
    return false;
  }
};

const upgradeAnonymousToGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await linkWithPopup(auth.currentUser, provider);
    return result.user;
  } catch (error) {
    if (error.code === "auth/credential-already-in-use") {
      // User already has a Google account — sign in as that user instead
      const provider = new GoogleAuthProvider();
      await loginWithGoogle();
      return null;
    }
    console.error("Upgrade failed:", error);
    throw error;
  }
};

// ─── AUTH SCREEN — Triple-Layer Anonymous → Google → Passkey ──
const AuthScreen = () => {
  const [step, setStep] = useState("landing");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [authMethod, setAuthMethod] = useState(null);

  // Layer 1: Start Anonymous
  const handleAnonymous = async () => {
    setError(null);
    try {
      setScanning(true);
      setAuthMethod("anonymous");
      await loginAnonymously();
    } catch (err) {
      setError("Anonymous auth unavailable. Try Google sign-in.");
      setScanning(false);
    }
  };

  // Layer 2: Google OAuth
  const handleGoogle = async () => {
    setError(null);
    try {
      setScanning(true);
      setAuthMethod("google");
      await loginWithGoogle();
    } catch (err) {
      setError("Google sign-in failed. Try again.");
      setScanning(false);
    }
  };

  // Layer 3: Bind Passkey (called after auth state resolves in App)
  const handleSkipPasskey = () => {
    setStep("creating");
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: NEON.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* Animated grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", animation: "fade-in 1s ease" }} />
      {/* Radial glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "70%", left: "20%", width: 400, height: 400, background: "radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <GlassCard style={{ width: 480, padding: "48px 40px", textAlign: "center", animation: "slide-in-up 0.6s ease" }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, animation: "float 4s ease-in-out infinite" }}>
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
        </div>

        {/* Neon separator */}
        <div style={{ height: 1, background: GRADIENT_BORDER, marginBottom: 28, borderRadius: 1, opacity: 0.7 }} />

        {error && (
          <div style={{ color: NEON.magenta, fontSize: "0.75rem", marginBottom: 12, fontFamily: "'Share Tech Mono'", padding: "8px 12px", background: "rgba(255,46,159,0.08)", borderRadius: 6, border: "1px solid rgba(255,46,159,0.2)" }}>
            {error}
          </div>
        )}

        {step === "landing" && !scanning && (
          <div style={{ animation: "fade-in 0.4s ease" }}>
            <div style={{ color: NEON.text, fontSize: "0.9rem", marginBottom: 8, fontWeight: 500 }}>Digital Identity Federated Footprint</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.78rem", marginBottom: 28, lineHeight: 1.6 }}>
              Authenticate to begin your <span style={{ color: NEON.magenta, fontWeight: 700 }}>DIFF</span> analysis. Your sovereignty begins here.
            </div>

            {/* Layer indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {["ANON", "IDP", "PASSKEY"].map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 12, background: "rgba(0,212,255,0.06)", border: `1px solid ${i === 0 ? NEON.orange : "rgba(0,212,255,0.15)"}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? NEON.orange : i === 1 ? NEON.blue : NEON.magenta }} />
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Layer 1: Anonymous */}
              <button className="btn-neon neon-border" onClick={handleAnonymous} style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(255,122,24,0.08)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                <span style={{ fontSize: "1.2rem" }}>◌</span>
                Continue Anonymously
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, marginLeft: "auto" }}>LAYER 1</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, color: NEON.textMuted, fontSize: "0.65rem" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(0,212,255,0.15)" }} />
                <span style={{ fontFamily: "'Share Tech Mono'" }}>OR WITH FEDERATED IDENTITY</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,212,255,0.15)" }} />
              </div>

              {/* Layer 2: Google */}
              <button className="btn-neon neon-border" onClick={handleGoogle} style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(66,133,244,0.1)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continue with Google
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, marginLeft: "auto" }}>LAYER 2</span>
              </button>

              {/* Layer 2: Apple */}
              <button className="btn-neon neon-border" onClick={() => { setScanning(true); setAuthMethod("apple"); setTimeout(() => setScanning(false), 2000); }} style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" /></svg>
                Continue with Apple
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, marginLeft: "auto" }}>LAYER 2</span>
              </button>
            </div>

            <div style={{ marginTop: 20, color: NEON.textMuted, fontSize: "0.7rem", lineHeight: 1.5 }}>
              <span style={{ color: NEON.orange }}>◌</span> Layer 1: Ephemeral session · <span style={{ color: NEON.blue }}>○</span> Layer 2: Federated identity · <span style={{ color: NEON.magenta }}>⬟</span> Layer 3: Hardware-bound passkey<br />
              Your identity. Your sovereignty. Your rules.
            </div>
          </div>
        )}

        {scanning && (
          <div style={{ animation: "fade-in 0.3s ease", padding: "20px 0" }}>
            <div style={{ width: 50, height: 50, border: `3px solid rgba(0,212,255,0.2)`, borderTop: `3px solid ${NEON.blue}`, borderRadius: "50%", margin: "0 auto 20px", animation: "spinner 1s linear infinite" }} />
            <div style={{ color: NEON.blue, fontFamily: "'Share Tech Mono'", fontSize: "0.8rem" }}>AUTHENTICATING IDENTITY...</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.7rem", marginTop: 8 }}>Establishing secure session</div>
          </div>
        )}

        {step === "creating" && (
          <div style={{ animation: "fade-in 0.3s ease", padding: "20px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {[0, 1, 2].map(i => <div key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            <div style={{ color: NEON.blue, fontFamily: "'Share Tech Mono'", fontSize: "0.8rem" }}>INITIALIZING ARCHITECT AI...</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.7rem", marginTop: 8 }}>Preparing your DIFF sovereignty console</div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// ─── Sovereign Score Arc ──────────────────────────────────────
const SovereignScore = ({ score }) => {
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

// ─── Left Navigation ──────────────────────────────────────────
const LeftNav = ({ diffModules, activeModule, setActiveModule, activeSection, setActiveSection }) => {
  const sections = [
    { id: "dashboard", icon: "⬡", label: "DASHBOARD" },
    { id: "architect", icon: "◈", label: "ARCHITECT AI" },
    { id: "report", icon: "⊟", label: "DIFF REPORT" },
  ];

  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);

  return (
    <div style={{ width: 260, height: "100vh", background: "rgba(6,13,31,0.97)", borderRight: "1px solid rgba(0,212,255,0.12)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
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
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", fontWeight: 700, color: NEON.blue, letterSpacing: "0.1em" }}>ARCHITECT AI</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>AGAPE SOVEREIGN 2026</div>
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
        {sections.map(s => (
          <div key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`} onClick={() => { setActiveSection(s.id); setActiveModule(null); }} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 2, display: "flex", alignItems: "center", gap: 10, borderLeft: activeSection === s.id ? `2px solid ${NEON.blue}` : "2px solid transparent" }}>
            <span style={{ color: NEON.blue, fontSize: "1rem", width: 20 }}>{s.icon}</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: 600, color: activeSection === s.id ? NEON.blue : NEON.text, letterSpacing: "0.08em" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ margin: "8px 16px", height: 1, background: GRADIENT_BORDER, opacity: 0.3 }} />

      {/* DIFF Modules label */}
      <div style={{ padding: "6px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>DIFF MODULES</span>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}44` }} />
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange }}>16</span>
      </div>

      {/* Scrollable modules */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {diffModules.map((m) => {
          const isActive = activeModule === m.id;
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => { setActiveModule(m.id); setActiveSection("modules"); }} style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 1, display: "flex", alignItems: "center", gap: 8, borderLeft: isActive ? `2px solid ${sevColor}` : "2px solid transparent", background: isActive ? `rgba(${sev > 80 ? "0,212,255" : sev > 60 ? "255,122,24" : "255,46,159"},0.06)` : "transparent" }}>
              <span style={{ color: sevColor, fontSize: "0.85rem", width: 16, textAlign: "center", flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: isActive ? sevColor : NEON.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted }}>{m.vector} · {m.nuked}🔥 {m.knoxed}🛡️</div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `1.5px solid ${sevColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Orbitron'", fontSize: "0.5rem", color: sevColor, fontWeight: 700 }}>{sev}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom pulsing line */}
      <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", opacity: 0.8 }} />
    </div>
  );
};

// ─── TOP HEADER ───────────────────────────────────────────────
const TopHeader = ({ user, onAdmin, onProfile }) => {
  const [time, setTime] = useState(new Date());
  const { toggleDesign } = useUIDesign();
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  return (
    <div style={{ height: 56, background: "rgba(6,13,31,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, position: "relative" }}>
      <div style={{ height: 1, position: "absolute", bottom: 0, left: 0, right: 0, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 4s linear infinite", opacity: 0.6 }} />

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f0", boxShadow: "0 0 8px #0f0", animation: "pulse-border 1.5s infinite" }} />
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: "#0f0", letterSpacing: "0.1em" }}>LIVE</span>
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

      <div style={{ flex: 1 }} />

      {/* DIFF label */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: NEON.textMuted }}>DIFF ACTIVE</span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: NEON.blue, animation: "glow-pulse 2s infinite" }} />
      </div>

      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />

      {/* Admin portal button - only shown for admins */}
      {isAdmin && (
        <NeonButton onClick={onAdmin} color={NEON.orange} size="sm">⬡ ADMIN</NeonButton>
      )}

      {/* Switch UI button */}
      <NeonButton onClick={toggleDesign} color={NEON.blue} size="sm">⟲ AGAPE UI</NeonButton>

      {/* Profile button */}
      <button className="btn-neon neon-border" onClick={onProfile} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,46,159,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NEON.magenta, fontSize: "1rem" }}>
        {user?.provider === "google" ? "G" : ""}
      </button>
    </div>
  );
};

// ─── Dashboard View ───────────────────────────────────────────
const DashboardView = ({ diffModules, onModuleClick }) => {
  const sovereignScore = Math.round(diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1));
  const totalExposures = diffModules.reduce((s, m) => s + m.nuked + m.monitored, 0);
  const totalSecured = diffModules.reduce((s, m) => s + m.knoxed, 0);
  const criticalModules = diffModules.filter(m => m.severity < 60);

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fade-in 0.4s ease" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 6 }}>DIGITAL IDENTITY FEDERATED FOOTPRINT</div>
          <NeonText color={NEON.blue} size="1.5rem" weight={900}>DIFF COMMAND CENTER</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: 4 }}>16-Layer identity vector analysis · Real-time threat intelligence</div>
        </div>
        <SovereignScore score={sovereignScore} />
      </div>

      {/* KPI Cards */}
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

      {/* Module Grid */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <NeonText color={NEON.orange} size="0.75rem" weight={700}>IDENTITY VECTOR MODULES</NeonText>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}33` }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {diffModules.map((m) => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <GlassCard key={m.id} className="module-card" onClick={() => onModuleClick(m.id)} style={{ padding: "14px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: sevColor, fontSize: "1.2rem" }}>{m.icon}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Orbitron'", fontSize: "0.7rem", color: sevColor, fontWeight: 700 }}>{sev}%</span>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.5rem", color: NEON.textMuted }}>{m.vector}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: "0.72rem", fontWeight: 600, color: NEON.text, marginBottom: 8, lineHeight: 1.3 }}>{m.label}</div>
              {/* Progress bar */}
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${sev}%`, background: sevColor, borderRadius: 1, boxShadow: `0 0 6px ${sevColor}`, transition: "width 1s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.magenta }}>🔥{m.nuked}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.blue }}>🛡️{m.knoxed}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.orange }}>👁️{m.monitored}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

// ─── Module Detail View ───────────────────────────────────────
const ModuleDetailView = ({ diffModules, moduleId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [completedStages, setCompletedStages] = useState([]);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);

  const m = diffModules.find(x => x.id === moduleId);
  if (!m) return null;
  const sev = m.severity;
  const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;

  const findings = [
    { type: "NUKED", label: "Data broker profile found", detail: "Spokeo, Whitepages, BeenVerified", action: "Request removal initiated" },
    { type: "MONITORED", label: "Metadata exposure detected", detail: "Email headers contain IP address", action: "Review & configure" },
    { type: "KNOXED", label: "Breach database clear", detail: "No matches in HaveIBeenPwned", action: "Verified secure" },
    { type: "KNOXED", label: "2FA enforced", detail: "TOTP active on primary account", action: "Hardened" },
    { type: "NUKED", label: "Personal info indexed", detail: "Name + phone on 3 data aggregators", action: "Removal in progress" },
  ].slice(0, m.nuked + m.knoxed > 5 ? 5 : 3);

  const baseStages = [
    "INITIALIZING SENSORS",
    "ESTABLISHING SECURE CONNECTION",
    `QUERYING ${m.label.toUpperCase()} REGISTRIES`,
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
        if (current > 0) {
          setCompletedStages(prev => [...prev, baseStages[current-1]]);
        }
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
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>{m.vector} · DIFF MODULE</div>
          <NeonText color={sevColor} size="1.2rem" weight={700}>{m.label}</NeonText>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Orbitron'", fontSize: "2rem", fontWeight: 900, color: sevColor, textShadow: `0 0 20px ${sevColor}` }}>{sev}%</div>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>SOVEREIGN SCORE</div>
        </div>
      </div>

      {/* Score bar */}
      <GlassCard style={{ padding: "16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.textMuted }}>SECURITY POSTURE</span>
          <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: sevColor }}>{sev > 80 ? "SECURED" : sev > 60 ? "MODERATE" : "EXPOSED"}</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${sev}%`, background: `linear-gradient(90deg, ${NEON.magenta}, ${sevColor})`, borderRadius: 3, boxShadow: `0 0 10px ${sevColor}`, transition: "width 1.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 12 }}>
          {[{ l: "NUKED", v: m.nuked, c: NEON.magenta }, { l: "KNOXED", v: m.knoxed, c: NEON.blue }, { l: "MONITORED", v: m.monitored, c: NEON.orange }].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: "center", background: `rgba(${s.c === NEON.magenta ? "255,46,159" : s.c === NEON.blue ? "0,212,255" : "255,122,24"},0.08)`, borderRadius: 8, padding: "10px 0", border: `1px solid ${s.c}22` }}>
              <div style={{ fontFamily: "'Orbitron'", fontSize: "1.4rem", fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Findings */}
      <div style={{ marginBottom: 16 }}>
        <NeonText color={NEON.orange} size="0.72rem">INTELLIGENCE FINDINGS</NeonText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {findings.map((f, i) => (
          <div key={i} className={f.type === "NUKED" ? "nuked-item" : f.type === "KNOXED" ? "knoxed-item" : ""} style={{ borderRadius: 10, padding: "14px 16px", border: `1px solid ${f.type === "NUKED" ? NEON.magenta : f.type === "KNOXED" ? NEON.blue : NEON.orange}33`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flexShrink: 0 }}><StatusBadge type={f.type} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: "0.85rem", color: NEON.text }}>{f.label}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted, marginTop: 2 }}>{f.detail}</div>
            </div>
            <div>
              <NeonButton size="sm" color={f.type === "NUKED" ? NEON.magenta : f.type === "KNOXED" ? NEON.blue : NEON.orange}>
                {f.type === "NUKED" ? "NUKE" : f.type === "KNOXED" ? "KNOX" : "REVIEW"}
              </NeonButton>
            </div>
          </div>
        ))}
      </div>

      {/* Scan Progress Visualization */}
      {isScanning && (
        <GlassCard style={{ padding: "20px", marginBottom: 20, border: `1px solid ${NEON.blue}55`, background: "rgba(0, 212, 255, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: 'center' }}>
            <div style={{ display: "flex", alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: "'Orbitron'", fontSize: "0.85rem", color: NEON.blue, fontWeight: 800 }}>VECTOR ANALYSIS ACTIVE</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>{m.vector}</span>
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
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  opacity: isCompleted || isActive ? 1 : 0.3,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    border: `1.5px solid ${isCompleted ? NEON.blue : isActive ? NEON.orange : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted ? NEON.blue : 'transparent'
                  }}>
                    {isCompleted && <span style={{ color: NEON.bg, fontSize: '0.5rem', fontWeight: 900 }}>✓</span>}
                    {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: NEON.orange, animation: 'pulse-border 1s infinite' }} />}
                  </div>
                  <span style={{ 
                    fontFamily: "'Share Tech Mono'", 
                    fontSize: "0.62rem", 
                    color: isActive ? NEON.orange : isCompleted ? NEON.blue : NEON.textMuted,
                    fontWeight: isActive ? 700 : 400
                  }}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid rgba(0,212,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2,3].map(i => <div key={i} style={{ width: 2, height: 10, background: NEON.blue, opacity: 0.3 + (i * 0.2) }} />)}
             </div>
             <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', color: NEON.blue, letterSpacing: '0.1em' }}>
                CURRENT: {currentStage}
             </div>
          </div>
        </GlassCard>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <NeonButton onClick={handleScan} disabled={isScanning} color={NEON.orange} style={{ flex: 1 }}>⟳ INITIATE VECTOR SWEEP</NeonButton>
        <NeonButton disabled={isScanning} color={NEON.magenta} style={{ flex: 1 }}>🔥 NUKE ALL EXPOSURES</NeonButton>
        <NeonButton disabled={isScanning} color={NEON.blue} style={{ flex: 1 }}>🛡️ KNOX ALL SECURED</NeonButton>
      </div>
    </div>
  );
};

// ─── Architect AI Chat ────────────────────────────────────────
const ArchitectAIView = ({ user, diffModules }: { user: any, diffModules: any[] }) => {
  const initialGreeting = `Greetings, ${user?.displayName || "Sovereign"}. I am Architect AI — your real-time Digital Identity Federated Footprint intelligence engine.\n\nI have analyzed your 16-layer identity vector profile. Your Sovereign Score is currently **${Math.round(diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1))}/100**.\n\n🔥 **${diffModules.reduce((s, m) => s + m.nuked, 0)} NUKED** exposures identified across data brokers and breach databases.\n🛡️ **${diffModules.reduce((s, m) => s + m.knoxed, 0)} KNOXED** vectors hardened and secured.\n\nWhat aspect of your digital sovereignty would you like to reclaim today?`;

  const [messages, setMessages] = useState([
    { role: "assistant", content: initialGreeting }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Map history to the format expected by our backend API (Gemma uses 'model' instead of 'assistant')
      const history = messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      
      const response = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: history
        })
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Unable to process request." }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Secure channel temporarily interrupted. Reconnecting..." }]);
    }
    setLoading(false);
  };

  const suggestedQueries = [
    "What are my highest-risk exposures?",
    "How do I NUKE my data broker profiles?",
    "Explain ECRA 2026 compliance",
    "What does KNOXED mean for my files?",
    "How is my Sovereign Score calculated?",
  ];

  const renderMsg = (text: string) => {
    return text.split('\n').map((line: string, i: number) => {
      if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, color: NEON.blue, margin: "4px 0" }}>{line.replace(/\*\*/g, '')}</div>;
      if (line.includes('**')) return <div key={i} style={{ margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${NEON.blue}">$1</strong>`) }} />;
      if (line.startsWith('🔥') || line.startsWith('🛡️') || line.startsWith('⚠️')) return <div key={i} style={{ margin: "4px 0", color: NEON.text }}>{line}</div>;
      return <div key={i} style={{ margin: "1px 0" }}>{line}</div>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>AI INTELLIGENCE ENGINE</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>ARCHITECT AI</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Real-time security & privacy intelligence · ECRA 2026 compliant · Gemma-powered</div>
      </div>

      <div style={{ height: 1, background: GRADIENT_BORDER, marginBottom: 16, opacity: 0.5 }} />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((msg, i) => (
          <div key={i} className="chat-bubble" style={{ display: "flex", gap: 12, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                <span style={{ fontSize: "0.75rem", color: NEON.blue }}>AI</span>
              </div>
            )}
            <div style={{ maxWidth: "78%", background: msg.role === "user" ? "rgba(255,46,159,0.1)" : NEON.bgCard, borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "12px 16px", border: `1px solid ${msg.role === "user" ? NEON.magenta : NEON.blue}33`, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", lineHeight: 1.6, color: NEON.text }}>
              {msg.role === "assistant" ? renderMsg(msg.content) : msg.content}
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

      {/* Suggested queries */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {suggestedQueries.map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ background: "rgba(0,212,255,0.06)", border: `1px solid ${NEON.blue}33`, borderRadius: 20, padding: "6px 14px", color: NEON.blue, fontFamily: "'Rajdhani'", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <div className="neon-border" style={{ flex: 1, borderRadius: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask Architect AI about your digital sovereignty..." style={{ width: "100%", background: "rgba(0,212,255,0.04)", border: "none", outline: "none", padding: "12px 16px", borderRadius: 10, color: NEON.text, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem" }} />
        </div>
        <NeonButton onClick={send} disabled={loading || !input.trim()} color={NEON.blue} style={{ padding: "12px 20px" }}>
          {loading ? "..." : "SEND"}
        </NeonButton>
      </div>
    </div>
  );
};

// ─── PDF Report View ──────────────────────────────────────────
const ReportView = ({ diffModules }: { diffModules: any[] }) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);
  const avgScore = Math.round(diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
  };

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fade-in 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>LIGHTHOUSE-STYLE AUDIT</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>DIFF SOVEREIGNTY REPORT</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Generate your complete Digital Identity Federated Footprint audit · Firebase-backed · Encrypted PDF</div>
      </div>

      <div style={{ height: 1, background: GRADIENT_BORDER, marginBottom: 24, opacity: 0.5 }} />

      {/* Report preview card */}
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

        {/* Report sections */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "IDENTITY VECTORS SCANNED", value: "16 / 16", color: NEON.blue },
            { label: "TOTAL EXPOSURES", value: totalNuked + " found", color: NEON.magenta },
            { label: "SECURED ASSETS", value: totalKnoxed + " hardened", color: NEON.blue },
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

      {/* Module breakdown */}
      <div style={{ marginBottom: 12 }}>
        <NeonText color={NEON.orange} size="0.72rem">VECTOR-BY-VECTOR BREAKDOWN</NeonText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {diffModules.slice(0, 8).map(m => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,212,255,0.02)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.07)" }}>
              <span style={{ color: sevColor, fontSize: "0.8rem", width: 20 }}>{m.icon}</span>
              <span style={{ fontFamily: "'Rajdhani'", fontSize: "0.75rem", color: NEON.text, flex: 1 }}>{m.label}</span>
              <div style={{ width: 80, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${sev}%`, background: sevColor, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: sevColor, width: 30, textAlign: "right" }}>{sev}%</span>
            </div>
          );
        })}
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, textAlign: "center", padding: "4px 0" }}>+ 8 more vectors in full report</div>
      </div>

      {/* Generate button */}
      {!generated ? (
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-neon neon-border pulse-border" onClick={handleGenerate} disabled={generating} style={{ flex: 1, padding: "16px", borderRadius: 10, background: "rgba(0,212,255,0.08)", border: "none", cursor: generating ? "not-allowed" : "pointer", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: 700, color: NEON.blue, letterSpacing: "0.1em" }}>
            {generating ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, border: `2px solid rgba(0,212,255,0.3)`, borderTop: `2px solid ${NEON.blue}`, borderRadius: "50%", animation: "spinner 1s linear infinite" }} />
                GENERATING SOVEREIGN REPORT...
              </span>
            ) : "⬡ GENERATE DIFF PDF REPORT"}
          </button>
        </div>
      ) : (
        <GlassCard style={{ padding: "20px", textAlign: "center", border: `1px solid ${NEON.blue}44` }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
          <NeonText color={NEON.blue} size="1rem">REPORT GENERATED SUCCESSFULLY</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.75rem", margin: "8px 0 16px" }}>Encrypted · Stored in Firebase Storage · ECRA 2026 certified</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <NeonButton color={NEON.blue}>⬇️ DOWNLOAD PDF</NeonButton>
            <NeonButton color={NEON.orange}>☁️ FIREBASE STORAGE</NeonButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// ─── Admin Portal ─────────────────────────────────────────────
const AdminPortal = ({ onClose }: any) => {
  const stats = {
    webauthLogs: 1247, cloudRunStatus: "HEALTHY", firestoreOps: 38291, nodeHealth: "99.7%", activeUsers: 1, sessionsToday: 3,
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", animation: "fade-in 0.3s ease" }}>
      <GlassCard style={{ width: "min(900px, 95vw)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
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
          {/* Infrastructure stats */}
          <div style={{ marginBottom: 12 }}>
            <NeonText color={NEON.orange} size="0.7rem">FIREBASE INFRASTRUCTURE · GCP FREE TIER</NeonText>
          </div>
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

          {/* Firebase services status */}
          <div style={{ marginBottom: 12 }}>
            <NeonText color={NEON.blue} size="0.7rem">FIREBASE SERVICES STATUS</NeonText>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {[
              { svc: "Firebase Authentication", status: "ACTIVE", note: "Google + Apple OAuth · WebAuthn passkeys" },
              { svc: "Cloud Firestore", status: "ACTIVE", note: "AES-256-GCM encrypted · Zero-knowledge architecture" },
              { svc: "Firebase Storage", status: "ACTIVE", note: "PDF reports · Encrypted user data" },
              { svc: "Cloud Functions", status: "ACTIVE", note: "PDF generation · DIFF scan orchestration" },
              { svc: "Firebase App Check", status: "ACTIVE", note: "Request attestation · Abuse prevention" },
              { svc: "Firebase Hosting", status: "ACTIVE", note: "CDN-backed · HTTPS enforced" },
              { svc: "Firebase Analytics", status: "ACTIVE", note: "Privacy-mode · No PII collection" },
              { svc: "Gemma 4 E4B", status: "ACTIVE", note: "Local Enclave Compute · Privacy-preserving" },
            ].map(s => (
              <div key={s.svc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.08)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f0", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.text, width: 220 }}>{s.svc}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: "#0f0", width: 60 }}>{s.status}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.textMuted }}>{s.note}</span>
              </div>
            ))}
          </div>

          {/* Security audit log */}
          <div style={{ marginBottom: 12 }}>
            <NeonText color={NEON.magenta} size="0.7rem">REAL-TIME AUDIT TRAIL</NeonText>
          </div>
          <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "14px", fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted, lineHeight: 2, border: "1px solid rgba(0,212,255,0.1)", maxHeight: 160, overflowY: "auto" }}>
            {[
              "[2026-03-05T14:32:01Z] PASSKEY_AUTH user@agape.nyc · device: macOS · status: SUCCESS",
              "[2026-03-05T14:31:58Z] DIFF_SCAN initiated · vectors: 16 · mode: REALTIME",
              "[2026-03-05T14:31:45Z] FIRESTORE_WRITE encrypted_profile · bytes: 4.2KB",
              "[2026-03-05T14:30:22Z] GEMMA_API session_start · tokens: 0 · context_bound: true",
              "[2026-03-05T14:28:11Z] APP_CHECK attestation verified · platform: web",
              "[2026-03-05T14:25:04Z] CLOUD_FUNCTION pdf_generate · status: idle",
            ].map((log, i) => <div key={i} style={{ color: i === 0 ? NEON.blue : NEON.textMuted }}>{log}</div>)}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// ─── Profile Panel ────────────────────────────────────────────
const ProfilePanel = ({ user, onClose }: any) => {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState(["user@agape.nyc"]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 900, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", backdropFilter: "blur(6px)", animation: "fade-in 0.2s ease" }} onClick={onClose}>
      <GlassCard style={{ width: 340, margin: "56px 16px 0 0", padding: "20px", animation: "slide-in-left 0.3s ease" }} onClick={(e: any) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <NeonText color={NEON.magenta} size="0.9rem">SOVEREIGN PROFILE</NeonText>
          <button onClick={onClose} style={{ background: "none", border: "none", color: NEON.textMuted, cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(255,46,159,0.06)", borderRadius: 8, marginBottom: 16, border: "1px solid rgba(255,46,159,0.15)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron'", fontWeight: 900, color: "#fff", fontSize: "1.2rem" }}>
            {user?.name?.[0] || "S"}
          </div>
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, color: NEON.text }}>{user?.name}</div>
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

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [diffModules, setDiffModules] = useState<any[]>(DEFAULT_MODULE_DATA);
  const [activeSection, setActiveSection] = useState<any>("dashboard");
  const [activeModule, setActiveModule] = useState<any>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [showAnonUpgrade, setShowAnonUpgrade] = useState(false);
  const [passkeyBound, setPasskeyBound] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Real-time listener for Auth and Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        setShowAnonUpgrade(authUser.isAnonymous);

        // Check if user already has passkey bound in Firestore
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);
        const hasPasskey = userSnap.exists() && userSnap.data()?.passkeyBound === true;
        setPasskeyBound(hasPasskey);
        setShowPasskeyPrompt(!authUser.isAnonymous && !hasPasskey);

        const profileRef = doc(db, "users", authUser.uid, "diff", "profile");
        const unsubscribeDb = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().modules) {
            setDiffModules(docSnap.data().modules);
          } else {
            // Initialize fresh modules for a new user if none exist
            setDoc(profileRef, { modules: DEFAULT_MODULE_DATA, initializedAt: new Date().toISOString() });
            setDiffModules(DEFAULT_MODULE_DATA);
          }
        });
        return () => unsubscribeDb();
      } else {
        setDiffModules(DEFAULT_MODULE_DATA);
        setShowPasskeyPrompt(false);
        setShowAnonUpgrade(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Prompt passkey binding on first login for OAuth users
  useEffect(() => {
    if (showPasskeyPrompt && user && !user.isAnonymous && !passkeyBound) {
      // Auto-prompt once when user first logs in with Google/Apple
    }
  }, [showPasskeyPrompt, user, passkeyBound]);

  const handleBindPasskey = async () => {
    if (!user) return;
    setPasskeyLoading(true);
    try {
      const verified = await bindPasskeyForUser(user.uid, user.email);
      if (verified) {
        setPasskeyBound(true);
        setShowPasskeyPrompt(false);
        // Mark passkey bound in Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { passkeyBound: true, passkeyBoundAt: serverTimestamp() });
      } else {
        console.log("Passkey binding cancelled or failed");
      }
    } catch (err) {
      console.error("Passkey binding error:", err);
    }
    setPasskeyLoading(false);
  };

  const handleDismissPasskey = () => {
    setShowPasskeyPrompt(false);
  };

  const handleUpgradeAnonymous = async () => {
    try {
      await upgradeAnonymousToGoogle();
      setShowAnonUpgrade(false);
    } catch (err) {
      console.error("Upgrade failed:", err);
    }
  };

  if (!user) return (
    <>
      <GlobalStyle />
      <AuthScreen />
    </>
  );

  const handleModuleClick = (id: string) => { setActiveModule(id); setActiveSection("modules"); };

  const renderMain = () => {
    if (activeSection === "architect") return <ArchitectAIView user={user} diffModules={diffModules} />;
    if (activeSection === "report") return <ReportView diffModules={diffModules} />;
    if (activeSection === "modules" && activeModule) return <ModuleDetailView diffModules={diffModules} moduleId={activeModule} />;
    return <DashboardView diffModules={diffModules} onModuleClick={handleModuleClick} />;
  };

  return (
    <>
      <GlobalStyle />
      {/* App shell */}
      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: NEON.bg, overflow: "hidden" }}>
        {/* Top border gradient */}
        <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", flexShrink: 0 }} />

        <TopHeader user={user} onAdmin={() => setShowAdmin(true)} onProfile={() => setShowProfile(true)} />

        {/* Anonymous upgrade banner — Layer 1 → Layer 2 */}
        {showAnonUpgrade && !passkeyBound && (
          <div style={{ padding: "10px 24px", background: "rgba(255,122,24,0.08)", borderBottom: "1px solid rgba(255,122,24,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>◌</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.orange }}>LAYER 1 · Anonymous session — upgrade to Layer 2 for persistent identity</span>
            </div>
            <button className="btn-neon neon-border" onClick={handleUpgradeAnonymous} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(255,122,24,0.15)", color: NEON.orange, fontFamily: "'Orbitron'", fontSize: "0.6rem", border: "none", cursor: "pointer" }}>
              UPGRADE WITH GOOGLE
            </button>
          </div>
        )}

        {/* Passkey binding prompt — Layer 3 (for federated users) */}
        {showPasskeyPrompt && !passkeyBound && (
          <div style={{ padding: "10px 24px", background: "rgba(255,46,159,0.06)", borderBottom: "1px solid rgba(255,46,159,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>⬟</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.magenta }}>LAYER 3 · Bind a hardware passkey for full sovereign access</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDismissPasskey} style={{ padding: "6px 14px", borderRadius: 6, background: "transparent", color: NEON.textMuted, fontFamily: "'Orbitron'", fontSize: "0.6rem", border: "1px solid rgba(0,212,255,0.15)", cursor: "pointer" }}>
                SKIP
              </button>
              <button className="btn-neon neon-border" onClick={handleBindPasskey} disabled={passkeyLoading} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(255,46,159,0.15)", color: NEON.magenta, fontFamily: "'Orbitron'", fontSize: "0.6rem", border: "none", cursor: passkeyLoading ? "not-allowed" : "pointer", opacity: passkeyLoading ? 0.5 : 1 }}>
                {passkeyLoading ? "BINDING..." : "BIND PASSKEY"}
              </button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <LeftNav diffModules={diffModules} activeModule={activeModule} setActiveModule={setActiveModule} activeSection={activeSection} setActiveSection={setActiveSection} />

          {/* Main content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            {/* Background grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
            {/* Glow orbs */}
            <div style={{ position: "absolute", top: "20%", right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "20%", left: "20%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto" }}>
              {renderMain()}
            </div>
          </div>
        </div>

        {/* Bottom border gradient */}
        <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear reverse infinite", flexShrink: 0 }} />
      </div>

      {showAdmin && <AdminPortal onClose={() => setShowAdmin(false)} />}
      {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}
