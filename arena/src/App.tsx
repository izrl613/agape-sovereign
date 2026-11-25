import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  FileText,
  Scale,
  Cpu,
  Menu,
  X,
  Server,
  User,
  Flame,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  INITIAL_DIFF_MODULES,
  NEON,
  type DiffModule,
  type FindingStatus,
  type SovereignUser,
} from './data/sovereignData';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { ModuleDetailView } from './components/ModuleDetailView';
import { DignityRectificationView } from './components/DignityRectificationView';
import { PipelineView } from './components/PipelineView';
import { ArchitectAIView } from './components/ArchitectAIView';
import { ReportView } from './components/ReportView';
import { AdminPortal } from './components/AdminPortal';
import { ProfilePanel } from './components/ProfilePanel';
import { NeonButton } from './components/ui';

type SectionId = 'dashboard' | 'architect' | 'dignity' | 'pipeline' | 'report' | 'modules';

export default function App() {
  const [user, setUser] = useState<SovereignUser | null>(null);
  const [diffModules, setDiffModules] = useState<DiffModule[]>(INITIAL_DIFF_MODULES);
  const [hdiScore, setHdiScore] = useState<number>(82.0);
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSweepingAll, setIsSweepingAll] = useState(false);
  const [utcClock, setUtcClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setUtcClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user) {
    return <LoginScreen onAuthenticate={(u) => setUser(u)} />;
  }

  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);

  const recalcModule = (m: DiffModule, findings: DiffModule['findings']): DiffModule => {
    const nuked = findings.filter((f) => f.type === 'NUKED').length;
    const knoxed = findings.filter((f) => f.type === 'KNOXED').length;
    const monitored = findings.filter((f) => f.type === 'MONITORED').length;
    const total = findings.length || 1;
    const severity = Math.min(99, Math.max(45, Math.round((knoxed * 100 + monitored * 65 + nuked * 55) / total)));
    return { ...m, findings, nuked, knoxed, monitored, severity };
  };

  const handleUpdateFinding = (moduleId: string, findingId: string, nextStatus: FindingStatus) => {
    setDiffModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const updatedFindings = m.findings.map((f) =>
          f.id === findingId ? { ...f, type: nextStatus } : f
        );
        return recalcModule(m, updatedFindings);
      })
    );
  };

  const handleBulkAction = (moduleId: string, action: 'NUKE_ALL' | 'KNOX_ALL') => {
    const target: FindingStatus = action === 'NUKE_ALL' ? 'NUKED' : 'KNOXED';
    setDiffModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const updatedFindings = m.findings.map((f) => ({ ...f, type: target }));
        return recalcModule(m, updatedFindings);
      })
    );
  };

  const handleSweepAll = () => {
    if (isSweepingAll) return;
    setIsSweepingAll(true);
    setTimeout(() => {
      setDiffModules((prev) =>
        prev.map((m) => ({ ...m, severity: Math.min(99, m.severity + 4) }))
      );
      setIsSweepingAll(false);
    }, 1100);
  };

  const navItems: { id: Exclude<SectionId, 'modules'>; label: string; Icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'DASHBOARD', Icon: LayoutDashboard },
    { id: 'architect', label: 'ARCHITECT AI', Icon: Bot },
    { id: 'dignity', label: 'HDI RECTIFICATION', Icon: Scale },
    { id: 'pipeline', label: '9-AGENT PIPELINE', Icon: Cpu },
    { id: 'report', label: 'DIFF REPORT', Icon: FileText },
  ];

  const activeModule = diffModules.find((m) => m.id === activeModuleId) || null;

  const guestMinutesLeft =
    user.provider === 'guest' && user.guestExpiresAt
      ? Math.max(0, Math.ceil((user.guestExpiresAt - utcClock.getTime()) / 60000))
      : null;

  const sidebarContent = (
    <div className="relative flex h-full w-64 flex-col border-r border-[#00D4FF]/15 bg-[#060D1F]/98">
      <div
        className="animate-scan-line pointer-events-none absolute right-0 left-0 z-10 h-0.5"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.35), transparent)' }}
      />

      <div className="border-b border-[#00D4FF]/10 p-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" width="28" style={{ filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.6" />
            <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.9" opacity="0.7" />
            <text x="16" y="20" textAnchor="middle" fill={NEON.blue} className="font-orbitron" fontSize="8" fontWeight="900">
              AI
            </text>
          </svg>
          <div>
            <div className="font-orbitron text-xs font-bold tracking-wider text-[#00D4FF]">
              AGAPE SOVEREIGN
            </div>
            <div className="font-mono-tech text-[10px] tracking-widest text-[#7B9BB5]">
              ENCLAVE 2026 PWA
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-[#FF2E9F]/25 bg-[#FF2E9F]/10 px-2 py-1 text-center">
            <div className="font-orbitron flex items-center justify-center gap-1 text-sm font-bold text-[#FF2E9F]">
              <Flame className="h-3.5 w-3.5" />
              {totalNuked}
            </div>
            <div className="font-mono-tech text-[10px] text-[#7B9BB5]">NUKED</div>
          </div>
          <div className="rounded-md border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-2 py-1 text-center">
            <div className="font-orbitron flex items-center justify-center gap-1 text-sm font-bold text-[#00D4FF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {totalKnoxed}
            </div>
            <div className="font-mono-tech text-[10px] text-[#7B9BB5]">KNOXED</div>
          </div>
        </div>
      </div>

      <div className="space-y-0.5 p-2">
        {navItems.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveSection(id);
                setActiveModuleId(null);
                setMobileNavOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-left transition-all ${
                active
                  ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]'
                  : 'border-transparent text-[#E8F4FF]/80 hover:bg-[#00D4FF]/5'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="font-orbitron text-[11px] font-semibold tracking-wider">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-4 my-1 h-px bg-gradient-to-r from-[#FF2E9F]/40 via-[#00D4FF]/40 to-[#FF7A18]/40" />

      <div className="flex items-center gap-2 px-4 py-1.5">
        <span className="font-mono-tech text-[10px] tracking-widest text-[#FF7A18]">DIFF MODULES</span>
        <div className="h-px flex-1 bg-[#FF7A18]/30" />
        <span className="font-mono-tech text-[10px] text-[#FF7A18]">16</span>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {diffModules.map((m) => {
          const active = activeSection === 'modules' && activeModuleId === m.id;
          const sevColor = m.severity >= 80 ? NEON.blue : m.severity >= 65 ? NEON.orange : NEON.magenta;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveModuleId(m.id);
                setActiveSection('modules');
                setMobileNavOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md border-l-2 px-2.5 py-1.5 text-left transition ${
                active ? 'bg-white/5' : 'border-transparent hover:bg-white/5'
              }`}
              style={{ borderColor: active ? sevColor : 'transparent' }}
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-[#E8F4FF]">{m.label}</div>
                <div className="font-mono-tech text-[10px] text-[#7B9BB5]">{m.vector}</div>
              </div>
              <span
                className="font-orbitron flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold"
                style={{ borderColor: sevColor, color: sevColor }}
              >
                {m.severity}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#060D1F]">
      {/* Top Neon Bar */}
      <div className="h-0.5 shrink-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18]" />

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#00D4FF]/15 bg-[#060D1F]/98 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="rounded-md border border-[#00D4FF]/30 p-1.5 text-[#00D4FF] lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="animate-pulse-border h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="font-mono-tech text-xs text-emerald-400">LIVE</span>
          </div>
          <span className="font-mono-tech hidden text-xs text-[#00D4FF] sm:inline">
            {utcClock.toISOString().slice(11, 19)} UTC
          </span>
          <span className="font-mono-tech hidden text-xs text-[#FF7A18] md:inline">
            ECRA 2026 · GDPR ART. 16 · UDHR ART. 12
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {guestMinutesLeft !== null && (
            <div className="font-mono-tech hidden items-center gap-1.5 rounded-full border border-[#FF2E9F]/40 bg-[#FF2E9F]/10 px-3 py-1 text-[11px] text-[#FF2E9F] sm:flex">
              <Clock className="h-3 w-3" />
              GUEST TTL: {guestMinutesLeft}m · DATA NOT SAVED
            </div>
          )}
          {user.isAdmin && (
            <NeonButton onClick={() => setShowAdmin(true)} color={NEON.orange} size="sm">
              <Server className="h-3.5 w-3.5" />
              ADMIN
            </NeonButton>
          )}
          <button
            onClick={() => setShowProfile(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FF2E9F]/50 bg-[#FF2E9F]/15 text-[#FF2E9F] hover:bg-[#FF2E9F]/25"
            aria-label="Open profile"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden">
        <aside className="hidden lg:block">{sidebarContent}</aside>

        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 flex bg-black/70 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>{sidebarContent}</div>
          </div>
        )}

        <main className="relative flex-1 overflow-y-auto">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative z-10 h-full">
            {activeSection === 'architect' && (
              <ArchitectAIView user={user} diffModules={diffModules} hdiScore={hdiScore} />
            )}
            {activeSection === 'dignity' && (
              <DignityRectificationView hdiScore={hdiScore} onHdiUpdated={setHdiScore} />
            )}
            {activeSection === 'pipeline' && (
              <PipelineView diffModules={diffModules} hdiScore={hdiScore} />
            )}
            {activeSection === 'report' && (
              <ReportView user={user} diffModules={diffModules} hdiScore={hdiScore} />
            )}
            {activeSection === 'modules' && activeModule && (
              <ModuleDetailView
                module={activeModule}
                onBack={() => {
                  setActiveSection('dashboard');
                  setActiveModuleId(null);
                }}
                onUpdateFinding={handleUpdateFinding}
                onBulkAction={handleBulkAction}
              />
            )}
            {(activeSection === 'dashboard' || (activeSection === 'modules' && !activeModule)) && (
              <DashboardView
                diffModules={diffModules}
                hdiScore={hdiScore}
                onModuleClick={(id) => {
                  setActiveModuleId(id);
                  setActiveSection('modules');
                }}
                onSweepAll={handleSweepAll}
                onOpenDignity={() => setActiveSection('dignity')}
                isSweepingAll={isSweepingAll}
              />
            )}
          </div>
        </main>
      </div>

      {showAdmin && <AdminPortal user={user} onClose={() => setShowAdmin(false)} />}
      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
          onSignOut={() => {
            setShowProfile(false);
            setUser(null);
          }}
        />
      )}
    </div>
  );
}
