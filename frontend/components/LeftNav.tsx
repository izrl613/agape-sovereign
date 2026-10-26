import React from 'react';
import {
  Bot,
  FileText,
  Grid,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';
import { ActiveWorkspaceView, useSovereign } from '../context/SovereignContext';

export const LeftNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    scannedVectorCount,
    isAdmin,
  } = useSovereign();

  const items: Array<{
    id: ActiveWorkspaceView;
    label: string;
    badge?: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'dashboard',
      label: 'Sovereign Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'modules',
      label: '16 Identity Vectors',
      badge: `${scannedVectorCount}/16`,
      icon: <Grid className="h-4 w-4" />,
    },
    {
      id: 'architect',
      label: 'Architect AI Backbone',
      badge: 'ZK',
      icon: <Bot className="h-4 w-4" />,
    },
    {
      id: 'audit-pdf',
      label: '26-Month Audit PDF',
      badge: 'Drive',
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  if (isAdmin) {
    items.push({
      id: 'admin',
      label: 'Admin Governance',
      badge: 'HQ',
      icon: <ShieldAlert className="h-4 w-4" />,
    });
  }

  return (
    <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-[#060c1a]">
      <nav className="flex lg:flex-col gap-1.5 overflow-x-auto p-3 lg:p-4">
        {items.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                active
                  ? 'border border-emerald-400/60 bg-emerald-500/15 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                  : 'border border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono-code ${
                    active
                      ? 'bg-emerald-400/20 text-emerald-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
