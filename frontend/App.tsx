import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NEON, GRADIENT_BORDER } from './constants';
import { GlobalStyles } from './components/GlobalStyles';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingSplash } from './components/OnboardingSplash';
import { TopHeader } from './components/TopHeader';
import { LeftNav } from './components/LeftNav';
import { DashboardView } from './components/DashboardView';
import { ModuleDetailView } from './components/ModuleDetailView';
import { ArchitectAIView } from './components/ArchitectAIView';
import { ReportView } from './components/ReportView';
import { AdminPortal } from './components/AdminPortal';
import { ProfilePanel } from './components/ProfilePanel';
import { auth, onAuthStateChanged } from './lib/firebase';

const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then(m => ({ default: m.TermsOfService })));
const Contact = lazy(() => import('./components/Contact').then(m => ({ default: m.Contact })));

const LoadingFallback = () => (
  <div className="w-screen h-screen flex items-center justify-center" style={{ background: NEON.bg }}>
    <div className="text-center">
      <div className="w-12 h-12 rounded-full mx-auto mb-4" style={{ border: `3px solid rgba(0,212,255,0.2)`, borderTop: `3px solid ${NEON.blue}`, animation: "spinner 1s linear infinite" }} />
      <div className="text-sm font-['Share_Tech_Mono']" style={{ color: NEON.text }}>LOADING...</div>
    </div>
    <style jsx>{`@keyframes spinner { to { transform: rotate(360deg); } }`}</style>
  </div>
);

interface UserType {
  name: string;
  email: string;
  provider: string;
  photoURL?: string;
  nukedCount?: number;
  knoxedCount?: number;
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || "Sovereign User",
          email: firebaseUser.email || "user@agape.nyc",
          provider: firebaseUser.providerData[0]?.providerId || "custom",
          photoURL: firebaseUser.photoURL || ""
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || "Sovereign User",
          email: firebaseUser.email || "user@agape.nyc",
          provider: firebaseUser.providerData[0]?.providerId || "custom",
          photoURL: firebaseUser.photoURL || ""
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <>
        <GlobalStyles />
        <AuthScreen onAuth={(u) => {}} />
      </>
    );
  }

  if (!isOnboarded) {
    return (
      <>
        <GlobalStyles />
        <OnboardingSplash onComplete={(completedUser) => {
          setIsOnboarded(true);
        }} />
      </>
    );
  }

  const handleModuleClick = (id: string) => { 
    setActiveModule(id); 
    setActiveSection("modules"); 
  };

  const renderMain = () => {
    if (activeSection === "architect") return <ArchitectAIView />;
    if (activeSection === "report") return <ReportView />;
    if (activeSection === "modules" && activeModule) return <ModuleDetailView moduleId={activeModule} />;
    return <DashboardView onModuleClick={handleModuleClick} user={user} />;
  };

  return (
    <>
      <GlobalStyles />
      
      {/* App shell */}
      <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ background: NEON.bg }}>
        {/* Top border gradient */}
        <div className="h-[2px] shrink-0" style={{ background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite" }} />
        
        <TopHeader user={user} onAdmin={() => setShowAdmin(true)} onProfile={() => setShowProfile(true)} />

        <div className="flex-1 flex overflow-hidden">
          <LeftNav activeModule={activeModule} setActiveModule={setActiveModule} activeSection={activeSection} setActiveSection={setActiveSection} />

          {/* Main content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            
            {/* Glow orbs */}
            <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />
            <div className="absolute bottom-[20%] left-[20%] w-[200px] h-[200px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)" }} />
            
            <div className="relative z-10 h-full overflow-y-auto">
              {renderMain()}
            </div>
          </div>
        </div>

        {/* Bottom border gradient */}
        <div className="h-[2px] shrink-0" style={{ background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite reverse" }} />
      </div>

      {showAdmin && <AdminPortal onClose={() => setShowAdmin(false)} />}
      {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes - no auth required */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Auth route - shows AuthScreen for unauthenticated */}
          <Route path="/auth" element={
            <>
              <GlobalStyles />
              <AuthScreen onAuth={(u) => {}} />
            </>
          } />
          
          {/* Private routes - require authentication */}
          <Route path="/app/*" element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          } />
          
          {/* Redirect /app to dashboard */}
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}