
import React from 'react';

export type AppView = 'DASHBOARD' | 'KNOXED' | 'NUKED' | 'ACCOUNTS' | 'HISTORY' | 'ADMIN';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isAuthenticated }) => {
  const navItems = [
    { id: 'DASHBOARD', icon: 'fa-shield-halved', label: 'Dashboard' },
    { id: 'KNOXED', icon: 'fa-lock', label: 'KNOXED' },
    { id: 'NUKED', icon: 'fa-bomb', label: 'NUKED' },
    { id: 'ACCOUNTS', icon: 'fa-users', label: 'Account Sync' },
    { id: 'HISTORY', icon: 'fa-clock-rotate-left', label: 'Scan History' },
    { id: 'ADMIN', icon: 'fa-user-shield', label: 'Admin' },
  ];

  return (
    <aside className="w-80 border-r border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-50">
      <div className="p-12 flex items-center gap-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-white/10">
          <i className="fas fa-shield-virus text-white text-sm"></i>
        </div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Privacy Core</h2>
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">v2024.1 Endgame</p>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-3 mt-6">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as AppView)}
            disabled={!isAuthenticated && item.id !== 'DASHBOARD'}
            className={`w-full flex items-center gap-5 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === item.id && isAuthenticated ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'text-slate-500'
            } ${
              isAuthenticated ? 'hover:text-white hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <i className={`fas ${item.icon} text-base w-6`}></i>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-10 border-t border-white/5 bg-black/20">
        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
          <p className={`text-xs font-black uppercase tracking-widest text-center ${isAuthenticated ? 'text-emerald-400' : 'text-red-400'}`}>
            {isAuthenticated ? 'AUTHENTICATED' : 'UNAUTHENTICATED'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
