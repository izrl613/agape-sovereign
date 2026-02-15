
import React, { useState, useEffect } from 'react';
import Sidebar, { AppView } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Knoxed from './components/Knoxed';
import Nuked from './components/Nuked';
import Accounts from './components/Accounts';
import History from './components/History';
import Admin from './components/Admin';
import MCP from './components/MCP';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('isAuthenticated');
    if (sessionAuth) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (password: string) => {
    if (password === 'deleteme') { // WARNING: Do not use hardcoded passwords in production
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuthenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  const handleNavigation = (view: AppView) => {
    if (isAuthenticated) {
      setCurrentView(view);
    } else if (view === 'DASHBOARD') {
      setCurrentView(view);
    }
  };

  const renderView = () => {
    if (isLoading) return null;
    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard onNavigate={handleNavigation} />;
      case 'KNOXED':
        return <Knoxed />;
      case 'NUKED':
        return <Nuked />;
      case 'ACCOUNTS':
        return <Accounts />;
      case 'HISTORY':
        return <History />;
      case 'ADMIN':
        return <Admin />;
      case 'MCP':
        return <MCP />;
      default:
        return <Dashboard onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={handleNavigation} isAuthenticated={isAuthenticated} />
      <main className="flex-1 p-12 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
