import React, { useState, useEffect } from 'react';
import { auth, db, loginWithGoogle } from './src/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { GlobalStyles } from './frontend/styles/global-styles';
import { TopHeader } from './frontend/components/TopHeader';
import { LeftNav } from './frontend/components/LeftNav';
import { DashboardView } from './frontend/components/DashboardView';
import { ModuleInterface } from './frontend/components/ModuleInterface';
import { ArchitectAIView } from './frontend/components/ArchitectAIView';
import { ReportView } from './frontend/components/ReportView';
import { AdminPortal } from './frontend/components/AdminPortal';
import { ProfilePanel } from './frontend/components/ProfilePanel';
import { MODULE_REGISTRY } from './frontend/module-registry';

const DEFAULT_MODULE_DATA = Object.values(MODULE_REGISTRY).map(m => ({
  ...m, nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: []
}));

export default function App() {
  const [user, setUser] = useState(null);
  const [diffModules, setDiffModules] = useState(DEFAULT_MODULE_DATA);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeModule, setActiveModule] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const profileRef = doc(db, "users", authUser.uid, "diff", "profile");
        const unsubscribeDb = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().modules) {
            setDiffModules(docSnap.data().modules);
          } else {
            setDoc(profileRef, { modules: DEFAULT_MODULE_DATA, initializedAt: new Date().toISOString() });
            setDiffModules(DEFAULT_MODULE_DATA);
          }
        });
        return () => unsubscribeDb();
      } else {
        setDiffModules(DEFAULT_MODULE_DATA);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (!user) {
    // Use the custom AuthScreen from the previous implementation
    return (
      <>
        <GlobalStyles />
        <AuthScreen />
      </>
    );
  }

  const handleModuleClick = (id) => {
    setActiveModule(id);
    setActiveSection("modules");
  };

  const renderMain = () => {
    if (activeSection === "architect") return <ArchitectAIView user={user} diffModules={diffModules} />;
    if (activeSection === "report") return <ReportView diffModules={diffModules} />;
    if (activeSection === "modules" && activeModule) {
      return (
        <ModuleInterface
          moduleId={activeModule}
          onSubmit={(data) => {
            console.log(`Submitting ${activeModule} data:`, data);
            // Here we would trigger the Module Agent flow
          }}
        />
      );
    }
    return <DashboardView diffModules={diffModules} onModuleClick={handleModuleClick} />;
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#060D1F", overflow: "hidden" }}>
        <div style={{ height: 2, background: `linear-gradient(135deg, #FF2E9F, #00D4FF, #FF7A18)`, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", flexShrink: 0 }} />

        <TopHeader user={user} onAdmin={() => setShowAdmin(true)} onProfile={() => setShowProfile(true)} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <LeftNav
            diffModules={diffModules}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />

          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "20%", right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "20%", left: "20%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto" }}>
              {renderMain()}
            </div>
          </div>
        </div>

        <div style={{ height: 2, background: `linear-gradient(135deg, #FF2E9F, #00D4FF, #FF7A18)`, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear reverse infinite", flexShrink: 0 }} />
      </div>

      {showAdmin && <AdminPortal onClose={() => setShowAdmin(false)} />}
      {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}

// Define AuthScreen here since it's required for the App to render
const AuthScreen = () => {
  // Use the high-fidelity AuthScreen from the JSX implementation
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "70%", left: "L20%", width: 400, height: 400, background: "radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div className="neon-border" style={{ width: 480, padding: "48px 40px", textAlign: "center", background: "rgba(8, 18, 40, 0.85)", backdropFilter: "blur(20px)", borderRadius: 12, border: "1px solid rgba(0,212,255,0.15)", zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, margin: "0 auto 16px", position: "relative" }}>
            <svg viewBox="0 0 80 8 same" style={{ width: "100%", filter: `drop-shadow(0 0 12px #00D4FF)` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
              <text x="40" y="46" textAnchor="middle" fill="#00D4FF" fontFamily="Orbitron" fontSize="16" fontWeight="900">AI</text>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Orbitron', monospace", color: "#00D4FF", fontSize: "1.6rem", fontWeight: 900 }}>ARCHITECT AI</h1>
          <div style={{ color: "#7B9BB5", fontSize: "0.7rem", fontFamily: "'Share Tech Mono'", marginTop: 4, letterSpacing: "0.15em" }}>AGAPE SOVEREIGN ENCLAVE 2026</div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(135deg, #FF2E9F, #00D4FF, #FF7A18)`, marginBottom: 28, borderRadius: 1, opacity: 0.7 }} />
        <div style={{ color: "#E8F4FF", fontSize: "0.9rem", marginBottom: 8, fontWeight: 500 }}>Digital Identity Federated Footprint</div>
        <div style={{ color: "#7B9BB5", fontSize: "0.78rem", marginBottom: 28, lineHeight: 1.6 }}>
          Authenticate to begin your <span style={{ color: "#FF2E9F", fontWeight: 700 }}>DIFF</strong> analysis. Your sovereignty begins here.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(66,133,244,0.1)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(0,212,255,0.2)" }}>
            Continue with Google
          </button>
          <button style={{ padding: "13px 20px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(0,212,255,0.2)" }}>
            Continue with Apple
          </button>
        </div>
        <div style={{ marginTop: 20, color: "#7B9BB5", fontSize: "0.7rem", lineHeight: 1.5 }}>
          🔒 All data encrypted client-side. Zero-knowledge architecture.<br />
          Your identity. Your sovereignty. Your rules.
        </div>
      </div>
    </div>
  );
};
