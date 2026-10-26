import React, { useState, useEffect } from 'react';
import { SovereignProvider, useSovereign } from './context/SovereignContext';
import { LoginPage } from './components/LoginPage';
import { ModuleInterface } from './components/ModuleInterface';
import { ZkFooter } from './components/ZkFooter';
import { DashboardView } from './components/DashboardView';
import { ArchitectAIView } from './components/ArchitectAIView';
import { ReportView } from './components/ReportView';
import { TopHeader } from './components/TopHeader';
import { LeftNav } from './components/LeftNav';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/legal/TermsOfServicePage';

export type AppView = 'DASHBOARD' | 'MODULE' | 'ARCHITECT' | 'REPORT';

export type LegalRoute = 'privacy' | 'terms' | null;

// Lightweight path matcher — Firebase hosting rewrites all paths to index.html
// so we just inspect window.location.pathname to decide what to render.
const normalizePath = () => window.location.pathname.replace(/\/+$/, '').toLowerCase();

const isLoginPath = () => {
  const p = normalizePath();
  return p === '/login' || p === '';
};

// Public legal pages: /privacy and /terms (+ /legal/* aliases). These must
// resolve without authentication — Google OAuth verification, app-store review,
// and crawlers all fetch them anonymously.
export const getLegalRoute = (): LegalRoute => {
  const p = normalizePath();
  if (p === '/privacy' || p === '/legal/privacy') return 'privacy';
  if (p === '/terms' || p === '/legal/terms' || p === '/terms-of-service') return 'terms';
  return null;
};

const AppContent: React.FC = () => {
  const { user, setUser, collectedVectors, addVector, clearSession } = useSovereign();
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Push browser URL to /login when not authed, /dashboard when authed
  const pushPath = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    // Never rewrite the URL while a public legal document is on screen.
    if (getLegalRoute()) return;

    if (!user) {
      pushPath('/login');
    } else {
      if (isLoginPath()) pushPath('/dashboard');
    }
    // Handle browser back/forward
    const onPop = () => { /* re-render triggers login check automatically */ };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [user]);

  const handleModuleSubmit = async (data: any[]) => {
    if (!user) return;
    try {
      const response = await fetch('/api/vector/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, moduleId: activeModule, data }),
      });
      if (response.ok) {
        addVector(activeModule!);
        setView('DASHBOARD');
      }
    } catch {
      // silently handle — user stays on current module
    }
  };

  // ── Public legal pages (no auth required) ──────────────────────
  const legalRoute = getLegalRoute();
  if (legalRoute === 'privacy') {
    return <PrivacyPolicyPage />;
  }
  if (legalRoute === 'terms') {
    return <TermsOfServicePage />;
  }

  // ── Unauthenticated: always show the login portal ──────────────
  if (!user) {
    return (
      <LoginPage
        onSuccess={() => {
          pushPath('/dashboard');
          setView('DASHBOARD');
        }}
        onNavigateHome={() => { window.location.href = '/'; }}
      />
    );
  }

  // ── Authenticated: full app shell ───────────────────────────────
  return (
    <div className="main-app">
      <TopHeader user={user} onLogout={clearSession} />
      <div className="app-body">
        <LeftNav
          activeView={view}
          onNavigate={setView}
          collectedVectors={collectedVectors}
        />
        <main className="content-area">
          {view === 'DASHBOARD' && (
            <DashboardView
              collectedVectors={collectedVectors}
              onSelectModule={(id) => {
                setActiveModule(id);
                setView('MODULE');
              }}
            />
          )}
          {view === 'MODULE' && activeModule && (
            <ModuleInterface
              moduleId={activeModule}
              onSubmit={handleModuleSubmit}
            />
          )}
          {view === 'ARCHITECT' && (
            <ArchitectAIView userId={user?.id || ''} collectedVectors={collectedVectors} />
          )}
          {view === 'REPORT' && (
            <ReportView userId={user?.id || ''} />
          )}
        </main>
      </div>
      <ZkFooter pageId={view.toLowerCase()} />
      <style>{`
        .main-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0a;
          color: white;
          font-family: 'Rajdhani', sans-serif;
        }
        .app-body { display: flex; flex: 1; overflow: hidden; }
        .content-area { flex: 1; padding: 40px; overflow-y: auto; background: #0f0f0f; }
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

