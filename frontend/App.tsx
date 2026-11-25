import React, { Suspense, lazy, useEffect, useState } from 'react';
import { SovereignProvider, useSovereign } from './context/SovereignContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ZkFooter } from './components/ZkFooter';
import { DashboardView } from './components/DashboardView';
import { TopHeader } from './components/TopHeader';
import { LeftNav } from './components/LeftNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RecoveryCodeModal } from './components/RecoveryCodeModal';
import { LegalPage } from './components/LegalPage';
import { MODULE_CONFIGS } from './module-config';

const ArenaAlphaRoot = lazy(() => import('./alpha/ArenaAlphaRoot'));
const ModuleInterface = lazy(() => import('./components/ModuleInterface').then((m) => ({ default: m.ModuleInterface })));
const ArchitectAIView = lazy(() => import('./components/ArchitectAIView').then((m) => ({ default: m.ArchitectAIView })));
const DignityRectificationView = lazy(() => import('./components/DignityRectificationView').then((m) => ({ default: m.DignityRectificationView })));
const PipelineView = lazy(() => import('./components/PipelineView').then((m) => ({ default: m.PipelineView })));
const ReportView = lazy(() => import('./components/ReportView').then((m) => ({ default: m.ReportView })));
const AdminPortal = lazy(() => import('./components/AdminPortal').then((m) => ({ default: m.AdminPortal })));
const ProfilePanel = lazy(() => import('./components/ProfilePanel').then((m) => ({ default: m.ProfilePanel })));

export type AppView = 'HOME' | 'LOGIN' | 'DASHBOARD' | 'MODULE' | 'ARCHITECT' | 'DIGNITY' | 'PIPELINE' | 'REPORT' | 'ALPHA' | 'TERMS' | 'PRIVACY' | 'CONTACT';

function pathFor(view: AppView, moduleId: string | null): string {
  if (view === 'HOME') return '/';
  if (view === 'LOGIN') return '/login';
  if (view === 'ALPHA') return '/alpha';
  if (view === 'TERMS') return '/terms';
  if (view === 'PRIVACY') return '/privacy';
  if (view === 'CONTACT') return '/contact';
  if (view === 'MODULE' && moduleId) return `/dashboard/${moduleId}`;
  if (view === 'ARCHITECT') return '/dashboard/architect';
  if (view === 'DIGNITY') return '/dashboard/dignity';
  if (view === 'PIPELINE') return '/dashboard/pipeline';
  if (view === 'REPORT') return '/dashboard/report';
  return '/dashboard';
}

function viewFromPath(): { view: AppView; moduleId: string | null } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/login') return { view: 'LOGIN', moduleId: null };
  if (path === '/alpha') return { view: 'ALPHA', moduleId: null };
  if (path === '/terms') return { view: 'TERMS', moduleId: null };
  if (path === '/privacy') return { view: 'PRIVACY', moduleId: null };
  if (path === '/contact') return { view: 'CONTACT', moduleId: null };
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'dashboard') {
    if (parts[1] === 'architect') return { view: 'ARCHITECT', moduleId: null };
    if (parts[1] === 'dignity') return { view: 'DIGNITY', moduleId: null };
    if (parts[1] === 'pipeline') return { view: 'PIPELINE', moduleId: null };
    if (parts[1] === 'report') return { view: 'REPORT', moduleId: null };
    if (parts[1] && MODULE_CONFIGS[parts[1]]) return { view: 'MODULE', moduleId: parts[1] };
    return { view: 'DASHBOARD', moduleId: null };
  }
  return { view: 'HOME', moduleId: null };
}

const AppContent: React.FC = () => {
  const { user, authReady, sovereignId, receipts, collectedVectors, clearSession } = useSovereign();
  const initial = viewFromPath();
  const [view, setView] = useState<AppView>(initial.view);
  const [activeModule, setActiveModule] = useState<string | null>(initial.moduleId);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navigate = (next: AppView, moduleId: string | null = null) => {
    setView(next);
    setActiveModule(moduleId);
    const path = pathFor(next, moduleId);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const onPop = () => {
      const v = viewFromPath();
      setView(v.view);
      setActiveModule(v.moduleId);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (user && window.location.pathname === '/login') {
      navigate('DASHBOARD');
    }
    if (!user && window.location.pathname.startsWith('/dashboard')) {
      navigate('LOGIN');
    }
  }, [user, authReady]);

  // Legal / compliance pages (/terms, /privacy, /contact) — work signed in or out
  if (view === 'TERMS' || view === 'PRIVACY' || view === 'CONTACT') {
    return <LegalPage kind={view} onBack={() => navigate(user ? 'DASHBOARD' : 'HOME')} />;
  }

  // Standalone Arena Alpha sandbox route (/alpha) — works signed in or out.
  // ISOLATED: simulated demo data only; never touches live enclave receipts.
  if (view === 'ALPHA') {
    return (
      <Suspense
        fallback={
          <div style={{ minHeight: '100vh', background: '#060c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff', fontFamily: "'Orbitron', monospace" }}>
            LOADING ARENA ALPHA SANDBOX…
          </div>
        }
      >
        <ArenaAlphaRoot onExit={() => navigate(user ? 'DASHBOARD' : 'HOME')} />
      </Suspense>
    );
  }

  // Only deep /dashboard routes need to wait for auth state resolution
  if (!authReady && window.location.pathname.startsWith('/dashboard')) {
    return (
      <div style={{ minHeight: '100vh', background: '#060c1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 54, height: 54, border: '3px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Signed out views: Home Landing Page or Login Portal
  if (!user) {
    if (view === 'LOGIN') {
      return (
        <LoginPage
          onSuccess={() => navigate('DASHBOARD')}
          onNavigateHome={() => navigate('HOME')}
        />
      );
    }
    return (
      <HomePage
        onBegin={() => navigate('LOGIN')}
        onLoginGoogle={() => navigate('LOGIN')}
        onLoginPasskey={() => navigate('LOGIN')}
        onLoginAnon={() => navigate('LOGIN')}
        onOpenAlpha={() => navigate('ALPHA')}
      />
    );
  }

  // Signed in: Command Center / 16-Module Workspace / Architect AI / HDI / Pipeline / Report
  return (
    <div className="main-app">
      <TopHeader
        user={user}
        sovereignId={sovereignId}
        onLogout={() => {
          void clearSession();
          navigate('HOME');
        }}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenAlpha={() => navigate('ALPHA')}
      />
      <div className="app-body">
        <LeftNav
          activeView={view}
          activeModule={activeModule}
          collectedVectors={collectedVectors}
          onNavigate={(v) => navigate(v)}
          onSelectModule={(id) => navigate('MODULE', id)}
        />
        <main className="content-area">
          <Suspense fallback={<div style={{ color: '#00d4ff', fontFamily: "'Share Tech Mono', monospace", padding: 24 }}>LOADING ENCLAVE MODULE…</div>}>
            {(view === 'HOME' || view === 'DASHBOARD') && (
              <DashboardView
                receipts={receipts}
                sovereignId={sovereignId}
                onSelectModule={(id) => navigate('MODULE', id)}
                onOpenDignity={() => navigate('DIGNITY')}
                onOpenPipeline={() => navigate('PIPELINE')}
                onOpenAlpha={() => navigate('ALPHA')}
              />
            )}
            {view === 'MODULE' && activeModule && (
              <ModuleInterface
                key={activeModule}
                moduleId={activeModule}
                onBack={() => navigate('DASHBOARD')}
              />
            )}
            {view === 'ARCHITECT' && <ArchitectAIView />}
            {view === 'DIGNITY' && (
              <DignityRectificationView onSelectModule={(id) => navigate('MODULE', id)} />
            )}
            {view === 'PIPELINE' && (
              <PipelineView onOpenReport={() => navigate('REPORT')} />
            )}
            {view === 'REPORT' && <ReportView />}
          </Suspense>
        </main>
      </div>
      <ZkFooter pageId={view.toLowerCase()} />
      <RecoveryCodeModal />
      <Suspense fallback={null}>
        {user.isAdmin && (
          <AdminPortal
            open={showAdmin}
            onClose={() => setShowAdmin(false)}
            onOpenAlpha={() => navigate('ALPHA')}
          />
        )}
        <ProfilePanel
          open={showProfile}
          onClose={() => setShowProfile(false)}
          onSignOut={() => {
            setShowProfile(false);
            void clearSession();
            navigate('HOME');
          }}
          onOpenAlpha={() => navigate('ALPHA')}
        />
      </Suspense>
      <style>{`
        .main-app { display: flex; flex-direction: column; height: 100vh; background: #060c1a; color: #e8f4ff; font-family: 'Rajdhani', sans-serif; }
        .app-body { display: flex; flex: 1; overflow: hidden; }
        .content-area { flex: 1; padding: clamp(18px, 3vw, 38px); overflow-y: auto; background:
          radial-gradient(circle at 15% 0%, rgba(0,212,255,0.05), transparent 45%),
          radial-gradient(circle at 90% 100%, rgba(255,46,159,0.04), transparent 45%), #080f20; }
        @media (max-width: 820px) { .app-body { flex-direction: column; } .content-area { padding: 16px; } }
      `}</style>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SovereignProvider>
        <AppContent />
      </SovereignProvider>
    </ErrorBoundary>
  );
}
