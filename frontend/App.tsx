import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SovereignProvider, useSovereign } from './context/SovereignContext';
import { LoginPage } from './components/LoginPage';
import { ModuleInterface } from './components/ModuleInterface';
import { ZkFooter } from './components/ZkFooter';
import { DashboardView } from './components/DashboardView';
import { ArchitectAIView } from './components/ArchitectAIView';
import { ReportView } from './components/ReportView';
import { TopHeader } from './components/TopHeader';
import { LeftNav } from './components/LeftNav';
import { AdminPortal } from './components/AdminPortal';
import { ProfilePanel } from './components/ProfilePanel';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/legal/TermsOfServicePage';
import { buildDiffModules } from './module-status';

export type AppView = 'DASHBOARD' | 'MODULE' | 'ARCHITECT' | 'REPORT';

/** Section ids understood by LeftNav. */
export type AppSection = 'dashboard' | 'architect' | 'report' | 'modules';

export type LegalRoute = 'privacy' | 'terms' | null;

/** Where an authenticated session is supposed to live. */
export const DASHBOARD_PATH = '/dashboard';

// Lightweight path matcher — Firebase hosting rewrites all paths to index.html
// so we just inspect window.location.pathname to decide what to render.
const normalizePath = () => window.location.pathname.replace(/\/+$/, '').toLowerCase();

const isLoginPath = () => {
  const p = normalizePath();
  return p === '/login' || p === '';
};

/** Path that matches a given app section, so the URL always describes the view. */
const pathForSection = (section: AppSection, moduleId?: string | null): string => {
  switch (section) {
    case 'architect':
      return '/architect';
    case 'report':
      return '/report';
    case 'modules':
      return moduleId ? `/modules/${moduleId}` : '/dashboard';
    case 'dashboard':
    default:
      return DASHBOARD_PATH;
  }
};

/** Sections that require a session. */
const isProtectedPath = () => {
  const p = normalizePath();
  return (
    p === '/' + 'dashboard' ||
    p === '/dashboard' ||
    p === '/architect' ||
    p === '/report' ||
    p === '/modules' ||
    p.startsWith('/modules/')
  );
};

const sectionFromPath = (): AppSection => {
  const p = normalizePath();
  if (p === '/architect') return 'architect';
  if (p === '/report') return 'report';
  if (p === '/modules' || p.startsWith('/modules/')) return 'modules';
  return 'dashboard';
};

const moduleIdFromPath = (): string | null => {
  const p = normalizePath();
  const match = p.match(/^\/modules\/([a-z0-9-]+)$/);
  return match ? match[1] : null;
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

  const [section, setSection] = useState<AppSection>(() => sectionFromPath());
  const [activeModule, setActiveModule] = useState<string | null>(() => moduleIdFromPath());
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const diffModules = useMemo(() => buildDiffModules(collectedVectors), [collectedVectors]);
  const view: AppView = section === 'architect' ? 'ARCHITECT' : section === 'report' ? 'REPORT' : section === 'modules' ? 'MODULE' : 'DASHBOARD';

  /**
   * Keep the address bar in sync with the rendered view.
   * `replace` for the auth redirect (so Back doesn't return to the login form),
   * `push` for in-app navigation.
   */
  const syncPath = useCallback(
    (nextPath: string, mode: 'push' | 'replace' = 'push') => {
      if (window.location.pathname === nextPath) return;
      if (mode === 'replace') window.history.replaceState({}, '', nextPath);
      else window.history.pushState({}, '', nextPath);
    },
    [],
  );

  // ── Auth guard + post-login redirect ───────────────────────────────
  useEffect(() => {
    // Never touch the URL while a public legal document is on screen.
    if (getLegalRoute()) return;

    if (!user) {
      // Unauthenticated: any protected URL collapses back to the portal.
      if (!isLoginPath()) syncPath('/login', 'replace');
      return;
    }

    // Authenticated: a full page load (or OAuth round-trip) on /, /login or an
    // unknown path lands on /dashboard. A deep link to a real section is kept.
    if (isLoginPath() || !isProtectedPath()) {
      const target = sectionFromPath();
      syncPath(pathForSection(target, moduleIdFromPath()), 'replace');
      setSection(target);
      setActiveModule(moduleIdFromPath());
      return;
    }

    syncPath(pathForSection(section, activeModule), 'replace');
  }, [user, section, activeModule, syncPath]);

  // ── Back / forward ─────────────────────────────────────────────────
  useEffect(() => {
    const onPop = () => {
      if (getLegalRoute()) return;
      setSection(sectionFromPath());
      setActiveModule(moduleIdFromPath());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goToSection = useCallback(
    (next: AppSection, moduleId: string | null = null) => {
      setSection(next);
      setActiveModule(next === 'modules' ? moduleId : null);
      syncPath(pathForSection(next, moduleId));
    },
    [syncPath],
  );

  const handleModuleSubmit = async (data: any[]) => {
    if (!user) return;
    // The vector is collected locally first — that's the zero-knowledge
    // contract. The network write is best-effort and must never block the
    // return to the dashboard.
    addVector(activeModule!);
    goToSection('dashboard');
    try {
      await fetch('/api/vector/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, moduleId: activeModule, data }),
      });
    } catch {
      // offline / backend not provisioned — the local session already has it
    }
  };

  const handleLogout = () => {
    setShowProfile(false);
    clearSession();
    setSection('dashboard');
    setActiveModule(null);
    syncPath('/login', 'replace');
  };

  // ── Public legal pages (no auth required) ──────────────────────────
  const legalRoute = getLegalRoute();
  if (legalRoute === 'privacy') {
    return <PrivacyPolicyPage />;
  }
  if (legalRoute === 'terms') {
    return <TermsOfServicePage />;
  }

  // ── Unauthenticated: always show the login portal ──────────────────
  if (!user) {
    return (
      <LoginPage
        onSuccess={(session) => {
          // Establish the destination *before* the first authenticated render
          // so /dashboard is the address bar entry, then hand the session over.
          syncPath(DASHBOARD_PATH, 'replace');
          setSection('dashboard');
          setActiveModule(null);
          if (session) setUser(session);
        }}
        onNavigateHome={() => { window.location.href = '/'; }}
      />
    );
  }

  // ── Authenticated: full app shell ──────────────────────────────────
  return (
    <AppErrorBoundary
      onReset={() => {
        setSection('dashboard');
        setActiveModule(null);
      }}
    >
      <div className="main-app">
        <TopHeader
          user={user}
          onAdmin={() => setShowAdmin(true)}
          onProfile={() => setShowProfile(true)}
          onLogout={handleLogout}
        />
        <div className="app-body">
          <LeftNav
            diffModules={diffModules}
            activeModule={activeModule}
            setActiveModule={(id: string) => goToSection('modules', id)}
            activeSection={section}
            setActiveSection={(next: AppSection) => goToSection(next)}
          />
          <main className="content-area">
            {section === 'dashboard' && (
              <DashboardView
                diffModules={diffModules}
                onModuleClick={(id: string) => goToSection('modules', id)}
              />
            )}
            {section === 'modules' && activeModule && (
              <ModuleInterface
                moduleId={activeModule}
                onSubmit={handleModuleSubmit}
                onBack={() => goToSection('dashboard')}
              />
            )}
            {section === 'modules' && !activeModule && (
              <DashboardView
                diffModules={diffModules}
                onModuleClick={(id: string) => goToSection('modules', id)}
              />
            )}
            {section === 'architect' && (
              <ArchitectAIView userId={user.id} collectedVectors={collectedVectors} />
            )}
            {section === 'report' && <ReportView userId={user.id} />}
          </main>
        </div>

        {showAdmin && <AdminPortal onClose={() => setShowAdmin(false)} />}
        {showProfile && (
          <ProfilePanel
            user={user}
            onClose={() => setShowProfile(false)}
            onSignOut={handleLogout}
          />
        )}

        <ZkFooter pageId={view.toLowerCase()} />
        <style>{`
        .main-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #060C1A;
          color: #eaf4ff;
          font-family: 'Rajdhani', sans-serif;
        }
        .app-body { display: flex; flex: 1; overflow: hidden; }
        .content-area { flex: 1; padding: 0; overflow-y: auto; background: #060C1A; }
      `}</style>
      </div>
    </AppErrorBoundary>
  );
};

export default function App() {
  return (
    <SovereignProvider>
      <AppContent />
    </SovereignProvider>
  );
}
