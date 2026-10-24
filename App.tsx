import React, { useState } from 'react';
import { SovereignProvider, useSovereign } from './frontend/context/SovereignContext';
import { PasskeyService, AuthMethod } from './frontend/auth/passkey-service';
import { ModuleInterface } from './frontend/components/ModuleInterface';
import { ZkFooter } from './frontend/components/ZkFooter';
import { DashboardView } from './frontend/components/DashboardView';
import { ArchitectAIView } from './frontend/components/ArchitectAIView';
import { ReportView } from './frontend/components/ReportView';
import { TopHeader } from './frontend/components/TopHeader';
import { LeftNav } from './frontend/components/LeftNav';

export type AppView = 'LOGIN' | 'DASHBOARD' | 'MODULE' | 'ARCHITECT' | 'REPORT';

const AppContent: React.FC = () => {
  const { user, setUser, collectedVectors, addVector, clearSession } = useSovereign();
  const [view, setView] = useState<AppView>('LOGIN');
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const handleAuth = async (method: AuthMethod) => {
    try {
      const result = await PasskeyService.authenticate(method);
      if (result.success || result.userId) {
        setUser({
          id: result.userId || 'user_session_123',
          type: method === 'ANON' ? 'anonymous' : 'verified'
        });
        setView('DASHBOARD');
      }
    } catch (e) {
      alert('Authentication failed');
    }
  };

  const handleModuleSubmit = async (data: any[]) => {
    if (!user) return;

    try {
      const response = await fetch('/api/vector/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleId: activeModule,
          data
        }),
      });

      if (response.ok) {
        addVector(activeModule!);
        setView('DASHBOARD');
      }
    } catch (e) {
      alert('Data submission failed');
    }
  };

  if (view === 'LOGIN') {
    return (
      <div className="login-screen">
        <div className="login-box">
          <h1 className="login-title">SOVEREIGN</h1>
          <p className="login-subtitle">Enter your digital identity</p>
          <div className="auth-grid">
            <button className="auth-btn" onClick={() => handleAuth('PASSKEY')}>Passkey Auth</button>
            <button className="auth-btn" onClick={() => handleAuth('GOOGLE')}>Google Sign-in</button>
            <button className="auth-btn" onClick={() => handleAuth('ANON')}>ANON Bypass</button>
          </div>
        </div>
        <ZkFooter pageId="login" />
        <style jsx>{`
          .login-screen {
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: radial-gradient(circle, #1a1a1a 0%, #000 100%);
            color: white;
            font-family: 'Rajdhani', sans-serif;
          }
          .login-box {
            text-align: center;
            padding: 60px;
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 30px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          }
          .login-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 3rem;
            letter-spacing: 10px;
            margin-bottom: 10px;
            background: linear-gradient(to right, #00d4ff, #bc13fe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .login-subtitle {
            font-size: 1.2rem;
            color: #aaa;
            margin-bottom: 40px;
          }
          .auth-grid {
            display: grid;
            gap: 20px;
          }
          .auth-btn {
            padding: 15px 30px;
            background: transparent;
            color: white;
            border: 1px solid #444;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s;
          }
          .auth-btn:hover {
            background: rgba(255,255,255,0.1);
            border-color: #00d4ff;
            box-shadow: 0 0 15px rgba(0,212,255,0.3);
          }
        `}</style>
      </div>
    );
  }

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
      <style jsx global>{`
        .main-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0a;
          color: white;
          font-family: 'Rajdhani', sans-serif;
        }
        .app-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .content-area {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          background: #0f0f0f;
        }
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
