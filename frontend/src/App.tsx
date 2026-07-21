import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Menu, Settings, Bot, MessageSquare, ChevronLeft, ChevronRight, X, Sun, Moon, Monitor } from 'lucide-react';
import { useUI } from './context/UIContext';
import { ChatInterface } from './components/ChatInterface';
import { ModelManager } from './components/ModelManager';
import { SettingsPanel } from './components/SettingsPanel';

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useUI();

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'models', label: 'Models', icon: Bot },
  ];

  return (
    <aside
      className={clsx(
        'fixed top-16 left-0 bottom-0 bg-surface-900/80 backdrop-blur-sm border-r border-surface-700 z-20 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16 lg:w-16' : 'w-72 lg:w-72'
      )}
      aria-label="Sidebar navigation"
    >
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id as 'chat' | 'models'); setSidebarOpen(false); }}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-left',
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border-l-2 border-primary-500'
                  : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-700">
        <button
          onClick={onToggle}
          className={clsx(
            'flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg transition-colors',
            collapsed ? 'text-surface-400 hover:text-surface-100' : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function Header({ onMenuClick, onSettingsClick }: { onMenuClick: () => void; onSettingsClick: () => void }) {
  const { isOnline } = useUI();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-950/80 backdrop-blur-sm border-b border-surface-700 z-30 flex items-center justify-between px-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 flex items-center justify-center">
        <h1 className="font-medium text-surface-100 hidden sm:block">Local LLM PWA</h1>
        <span className="text-xs text-surface-500 sm:hidden">LocalLLM</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={clsx('flex items-center gap-1.5 text-xs px-2 py-1 rounded-full',
          isOnline ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

function App() {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUI();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-950">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => {}}
      />

      <main className={clsx(
        'pt-16 transition-all duration-300 min-h-[calc(100vh-4rem)]',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'
      )}>
        <Routes>
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/models" element={<ModelManager />} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;