
import React, { useState } from 'react';
import Sidebar, { AppView } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Knoxed from './components/Knoxed';
import Nuked from './components/Nuked';
import Accounts from './components/Accounts';
import History from './components/History';
import Admin from './components/Admin';
import Login from './components/Login';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (password: string) => {
    // Replace with a more secure authentication method
    if (password === 'password') {
      setIsAuthenticated(true);
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard onNavigate={setCurrentView} />;
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
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-white flex overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} isAuthenticated={isAuthenticated} />
      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </main>
      <div className="neon-atmosphere"></div>
    </div>
  );
};

export default App;
