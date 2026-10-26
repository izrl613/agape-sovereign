import React, { useEffect, useState } from 'react';
import { SovereignProvider, useSovereign } from './context/SovereignContext';
import { AdminPortal } from './components/AdminPortal';
import { ArchitectAIView } from './components/ArchitectAIView';
import { DashboardView } from './components/DashboardView';
import { LandingPage } from './components/LandingPage';
import { LeftNav } from './components/LeftNav';
import { LoginPage } from './components/LoginPage';
import { ModuleInterface } from './components/ModuleInterface';
import { ReportView } from './components/ReportView';
import { TopHeader } from './components/TopHeader';
import { ZkFooter } from './components/ZkFooter';

type RouteScreen = 'landing' | 'login' | 'workspace';

function resolveInitialScreen(): RouteScreen {
  if (typeof window === 'undefined') return 'landing';
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/app') || pathname.startsWith('/dashboard')) return 'workspace';
  return 'landing';
}

const SovereignShell: React.FC = () => {
  const {
    user,
    authLoading,
    activeView,
    signInWithGoogle,
  } = useSovereign();

  const [screen, setScreen] = useState<RouteScreen>(resolveInitialScreen);

  useEffect(() => {
    if (user && screen !== 'workspace') {
      setScreen('workspace');
      if (window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [user, screen]);

  const navigateScreen = (next: RouteScreen) => {
    setScreen(next);
    const nextPath = next === 'login' ? '/login' : next === 'workspace' ? '/app' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050914] text-emerald-300 flex items-center justify-center font-mono-code text-xs">
        Initializing Web Crypto SHA-256 Zero-Knowledge Enclave…
      </div>
    );
  }

  if (screen === 'login') {
    return (
      <LoginPage
        onBackToLanding={() => navigateScreen('landing')}
        onAuthenticated={() => navigateScreen('workspace')}
      />
    );
  }

  if (screen === 'landing' && !user) {
    return (
      <LandingPage
        onOpenLogin={() => navigateScreen('login')}
        onEnterWorkspacePreview={() => navigateScreen('workspace')}
        onSignInGoogleQuick={async () => {
          try {
            await signInWithGoogle({ requestDriveScope: true });
            navigateScreen('workspace');
          } catch {
            navigateScreen('login');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050914] text-[#e8f4ff] flex flex-col">
      <TopHeader
        onOpenLoginModal={() => navigateScreen('login')}
        onGoHome={() => {
          if (!user) {
            navigateScreen('landing');
          }
        }}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        <LeftNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'modules' && <ModuleInterface />}
          {activeView === 'architect' && <ArchitectAIView />}
          {activeView === 'audit-pdf' && <ReportView />}
          {activeView === 'admin' && <AdminPortal />}
        </main>
      </div>

      <ZkFooter />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SovereignProvider>
      <SovereignShell />
    </SovereignProvider>
  );
};

export default App;
