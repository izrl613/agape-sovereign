
import React from 'react';

export type AppView = 'DASHBOARD' | 'KNOXED' | 'NUKED' | 'ACCOUNTS' | 'HISTORY' | 'ADMIN' | 'MCP';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isAuthenticated, isOpen, setIsOpen }) => {
  const navItems = [
    { id: 'DASHBOARD', icon: 'fa-shield-halved', label: 'Dashboard' },
    { id: 'KNOXED', icon: 'fa-lock', label: 'KNOXED' },
    { id: 'NUKED', icon: 'fa-bomb', label: 'NUKED' },
    { id: 'ACCOUNTS', icon: 'fa-users', label: 'Account Sync' },
    { id: 'HISTORY', icon: 'fa-clock-rotate-left', label: 'Scan History' },
    { id: 'ADMIN', icon: 'fa-user-shield', label: 'Admin' },
    { id: 'MCP', icon: 'fa-server', label: 'MCP' },
  ];

  return (
    <aside className={`transition-all duration-300 ${isOpen ? 'w-80' : 'w-28'} border-r border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-50`}>
       <div className={`p-12 flex items-center gap-5 ${!isOpen && 'justify-center'}`}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fire-horse to-cosmic-horror flex items-center justify-center shadow-[0_0_20px_rgba(213,89,41,0.4)] border border-white/10">
          <i className="fas fa-shield-virus text-white text-sm"></i>
        </div>
        <div className={`${!isOpen && 'hidden'}`}>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Privacy Core</h2>
          <p className="text-[8px] text-universal-irony font-black uppercase tracking-[0.3em] mt-1.5">v2024.1 Endgame</p>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-3 mt-6">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as AppView)}
            disabled={!isAuthenticated && item.id !== 'DASHBOARD'}
            className={`w-full flex items-center gap-5 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === item.id && isAuthenticated ? 'bg-shield-glow/10 text-shield-glow border border-shield-glow/30' : 'text-universal-irony'
            } ${
              isAuthenticated ? 'hover:text-white hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
            } ${!isOpen && 'justify-center'}`}
          >
            <i className={`fas ${item.icon} text-base w-6`}></i>
            <span className={`${!isOpen && 'hidden'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-10 border-t border-white/5 bg-black/20">
         <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 bg-white/5 border border-white/10 rounded-full flex justify-center items-center text-white/50 hover:text-white transition-colors">
            <i className={`fas ${isOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
