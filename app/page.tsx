
'use client';

import React, { useState } from 'react';
import Sidebar, { AppView } from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Knoxed from '../components/Knoxed';
import Nuked from '../components/Nuked';
import Accounts from '../components/Accounts';
import History from '../components/History';
import Admin from '../components/Admin';
import MCP from '../components/MCP';

const Home = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard />;
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
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-white flex">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} isAuthenticated={isAuthenticated} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-grow p-12">
        {renderView()}
      </main>
    </div>
  );
};

export default Home;
