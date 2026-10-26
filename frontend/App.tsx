import React, { useEffect, useState } from 'react';
import { SovereignProvider, useSovereign, AuthMethod, UserSession } from './context/SovereignContext';
import { MODULE_AGENTS, getModule } from './module-catalog';
import { LeftNav, AppSection } from './components/LeftNav';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { ModuleWorkspace } from './components/ModuleWorkspace';
import { ArchitectAIView } from './components/ArchitectAIView';
import { ReportView } from './components/ReportView';
import { LoginPage } from './components/LoginPage';
import { GlobalStyles } from './styles/global-styles';
import { NEON, FONTS } from './theme';
import { auth, bindPasskey, completeGoogleRedirect, logout, onAuthStateChanged, type User } from './firebase';

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function navigate(to: string) {
  if (currentPath() === to) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function sessionFromFirebase(fbUser: User): UserSession {
  const isAnon =
    fbUser.isAnonymous ||
    sessionStorage.getItem('sovereign_anon_auth') === 'true' ||
    (!fbUser.email && (fbUser.providerData?.length ?? 0) === 0);
  const method: AuthMethod = isAnon
    ? 'ANON'
    : sessionStorage.getItem('sovereign_passkey_auth') === 'true'
      ? 'PASSKEY'
      : 'GOOGLE';
  return {
    id: fbUser.uid,
    type: isAnon ? 'anonymous' : 'verified',
    email: fbUser.email || (isAnon ? 'guest@sovereign.nyc' : 'operator@sovereign.nyc'),
    displayName: fbUser.displayName || (isAnon ? 'Guest Operator' : 'Sovereign Operator'),
    authMethod: method,
  };
}

const AppContent: React.FC = () => {
  const { user, setUser, clearSession, dossier, modules } = useSovereign();
  const [path, setPath] = useState(currentPath);
  const [authReady, setAuthReady] = useState(false);
  const [section, setSection] = useState<AppSection>('dashboard');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [moduleKey, setModuleKey] = useState(0);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById('agape-global-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'agape-global-styles';
    tag.innerHTML = GlobalStyles;
    document.head.appendChild(tag);
  }, []);

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    completeGoogleRedirect().catch((err) => console.warn('[auth] redirect result', err));
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(sessionFromFirebase(fbUser));
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (user && path === '/login') navigate('/dashboard');
  }, [authReady, user, path]);

  const openModule = (id: string) => {
    setActiveModule(id);
    setSection('module');
    setModuleKey((k) => k + 1);
  };

  const goSection = (s: AppSection) => {
    setSection(s);
    setActiveModule(null);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('sovereign_anon_auth');
    sessionStorage.removeItem('sovereign_passkey_auth');
    try {
      await logout();
    } catch {
      /* already signed out */
    }
    clearSession();
    navigate('/');
  };

  const handleAuthenticated = () => {
    // Firebase onAuthStateChanged maps the session; the effect routes /login → /dashboard.
  };

  const handleBindPasskey = async () => {
    setPasskeyNotice('Waiting for authenticator…');
    try {
      await bindPasskey();
      setPasskeyNotice('Passkey bound to this device.');
    } catch (err) {
      setPasskeyNotice(err instanceof Error ? err.message : 'Passkey registration failed.');
    }
  };

  if (path === '/') {
    return null;
  }

  if (path === '/login') {
    if (!authReady) return null;
    if (user) return null;
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  if (!authReady) return null;

  if (!user) {
    navigate('/login');
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  const currentLabel = activeModule
    ? getModule(activeModule)?.name
    : section === 'architect'
      ? 'Architect AI'
      : section === 'report'
        ? 'DIFF Report'
        : 'Command Center';

  const collected = MODULE_AGENTS.filter((m) => (modules[m.id]?.findings || []).length > 0).map((m) => m.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: NEON.bg, color: NEON.text, fontFamily: FONTS.rajdhani }}>
      <TopHeader currentLabel={currentLabel} onLogout={handleLogout} onBindPasskey={handleBindPasskey} />
      {passkeyNotice && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.08em', padding: '6px 16px', background: 'rgba(0,212,255,0.08)', color: NEON.blue }}>
          {passkeyNotice}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftNav
          section={activeModule ? 'module' : section}
          activeModule={activeModule}
          onSection={goSection}
          onModule={openModule}
        />
        <main style={{ flex: 1, overflow: 'hidden', background: '#070e22', position: 'relative' }}>
          {!activeModule && section === 'dashboard' && <DashboardView onModuleClick={openModule} />}
          {activeModule && (
            <ModuleWorkspace key={`${activeModule}-${moduleKey}`} module={getModule(activeModule)!} />
          )}
          {!activeModule && section === 'architect' && (
            <ArchitectAIView userId={user.id} collectedVectors={collected} />
          )}
          {!activeModule && section === 'report' && <ReportView />}
        </main>
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 10,
          left: 270,
          right: 16,
          fontFamily: FONTS.mono,
          fontSize: '0.52rem',
          color: NEON.textMuted,
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        ZK · {dossier.emailMasked} · SCORE {dossier.score} · {dossier.oneLiner}
      </div>
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
