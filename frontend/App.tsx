import React, { useEffect, useState } from 'react';
import { SovereignProvider, useSovereign } from './context/SovereignContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ModuleInterface } from './components/ModuleInterface';
import { ZkFooter } from './components/ZkFooter';
import { DashboardView } from './components/DashboardView';
import { ArchitectAIView } from './components/ArchitectAIView';
import { ReportView } from './components/ReportView';
import { TopHeader } from './components/TopHeader';
import { LeftNav } from './components/LeftNav';
import { MODULE_CONFIGS } from './module-config';

export type AppView = 'HOME' | 'LOGIN' | 'DASHBOARD' | 'MODULE' | 'ARCHITECT' | 'REPORT';

function pathFor(view: AppView, moduleId: string | null): string {
  if (view === 'HOME') return '/';
  if (view === 'LOGIN') return '/login';
  if (view === 'MODULE' && moduleId) return `/dashboard/${moduleId}`;
  if (view === 'ARCHITECT') return '/dashboard/architect';
  if (view === 'REPORT') return '/dashboard/report';
  return '/dashboard';
}

function viewFromPath(): { view: AppView; moduleId: string | null } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/login') return { view: 'LOGIN', moduleId: null };
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'dashboard') {
    if (parts[1] === 'architect') return { view: 'ARCHITECT', moduleId: null };
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
    // If authenticated and currently on /login, move to dashboard
    if (user && window.location.pathname === '/login') {
      navigate('DASHBOARD');
    }
    // If not authenticated and attempting to view /dashboard, redirect to /login
    if (!user && window.location.pathname.startsWith('/dashboard')) {
      navigate('LOGIN');
    }
  }, [user, authReady]);

  if (!authReady) {
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
      />
    );
  }

  // Signed in: Command Center / 16-Module Workspace / Architect AI / Report
  return (
    <div className="main-app">
      <TopHeader
        user={user}
        sovereignId={sovereignId}
        onLogout={() => {
          void clearSession();
          navigate('HOME');
        }}
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
          {view === 'HOME' && (
            <DashboardView
              receipts={receipts}
              sovereignId={sovereignId}
              onSelectModule={(id) => navigate('MODULE', id)}
            />
          )}
          {view === 'DASHBOARD' && (
            <DashboardView
              receipts={receipts}
              sovereignId={sovereignId}
              onSelectModule={(id) => navigate('MODULE', id)}
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
          {view === 'REPORT' && <ReportView />}
        </main>
      </div>
      <ZkFooter pageId={view.toLowerCase()} />
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
    <SovereignProvider>
      <AppContent />
    </SovereignProvider>
  );
}
