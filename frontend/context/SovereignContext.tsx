import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { MODULE_AGENTS, ModuleFinding, FindingStatus } from '../module-catalog';
import { buildDossier, IdentityDossier } from '../utils/briefing';
import { calculateSha256 } from '../services/cryptoService';
import { ArchitectPipelineResult } from '../services/architectPipeline';

export type AuthMethod = 'PASSKEY' | 'GOOGLE' | 'ANON';

export interface UserSession {
  id: string;
  type: 'verified' | 'anonymous';
  email: string;
  displayName: string;
  authMethod: AuthMethod;
}

export interface ModuleState {
  record: Record<string, string>;
  findings: ModuleFinding[];
  hash: string;
  lastScanned: string | null;
  customized: boolean;
}

interface SovereignContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  modules: Record<string, ModuleState>;
  updateRecord: (moduleId: string, record: Record<string, string>) => Promise<void>;
  setFindings: (moduleId: string, findings: ModuleFinding[]) => void;
  patchFindingStatus: (moduleId: string, findingId: string, status: FindingStatus) => void;
  markVector: (moduleId: string, status: FindingStatus) => void;
  dossier: IdentityDossier;
  pipeline: ArchitectPipelineResult | null;
  setPipeline: (p: ArchitectPipelineResult | null) => void;
  clearSession: () => void;
  seedDemo: () => void;
}

const SovereignContext = createContext<SovereignContextType | undefined>(undefined);

function emptyState(): Record<string, ModuleState> {
  return Object.fromEntries(
    MODULE_AGENTS.map((m) => [
      m.id,
      { record: {}, findings: [], hash: '', lastScanned: null, customized: false },
    ])
  );
}

function demoState(): Record<string, ModuleState> {
  return Object.fromEntries(
    MODULE_AGENTS.map((m) => [
      m.id,
      {
        record: { ...m.demoRecord },
        findings: [...m.demoFindings],
        hash: '',
        lastScanned: new Date().toISOString(),
        customized: false,
      },
    ])
  );
}

const storageKey = (uid: string) => `agape.module-state.${uid}`;

export const SovereignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserSession | null>(null);
  const [modules, setModules] = useState<Record<string, ModuleState>>(emptyState);
  const [pipeline, setPipeline] = useState<ArchitectPipelineResult | null>(null);

  const persist = (uid: string, next: Record<string, ModuleState>) => {
    try {
      localStorage.setItem(storageKey(uid), JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  const setUser = (next: UserSession | null) => {
    setUserState(next);
    if (!next) {
      setModules(emptyState());
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(next.id));
      if (raw) {
        setModules({ ...emptyState(), ...JSON.parse(raw) });
        return;
      }
    } catch {
      /* ignore */
    }
    // Guests get the content-rich demo dossier so navigation is immediately understandable.
    if (next.type === 'anonymous') {
      const seeded = demoState();
      setModules(seeded);
      persist(next.id, seeded);
    } else {
      const seeded = demoState();
      setModules(seeded);
      persist(next.id, seeded);
    }
  };

  const updateRecord = async (moduleId: string, record: Record<string, string>) => {
    const payload = JSON.stringify(record);
    let hash = '';
    try {
      hash = await calculateSha256(`${user?.id || 'anon'}::${moduleId}::${payload}`);
    } catch {
      hash = '';
    }
    setModules((prev) => {
      const next = {
        ...prev,
        [moduleId]: {
          ...(prev[moduleId] || emptyState()[moduleId]),
          record,
          hash,
          customized: true,
        },
      };
      if (user) persist(user.id, next);
      return next;
    });
  };

  const setFindings = (moduleId: string, findings: ModuleFinding[]) => {
    setModules((prev) => {
      const next = {
        ...prev,
        [moduleId]: {
          ...(prev[moduleId] || emptyState()[moduleId]),
          findings,
          lastScanned: new Date().toISOString(),
        },
      };
      if (user) persist(user.id, next);
      return next;
    });
  };

  const patchFindingStatus = (moduleId: string, findingId: string, status: FindingStatus) => {
    setModules((prev) => {
      const row = prev[moduleId];
      if (!row) return prev;
      const next = {
        ...prev,
        [moduleId]: {
          ...row,
          findings: row.findings.map((f) => (f.id === findingId ? { ...f, status } : f)),
        },
      };
      if (user) persist(user.id, next);
      return next;
    });
  };

  const markVector = (moduleId: string, status: FindingStatus) => {
    setModules((prev) => {
      const row = prev[moduleId] || emptyState()[moduleId];
      const findings = (row.findings.length ? row.findings : [{
        id: `${moduleId}-vector`,
        status,
        label: status === 'NUKED' ? 'Vector marked NUKED' : status === 'KNOXED' ? 'Vector marked KNOXED' : 'Vector watched',
        detail: status === 'NUKED'
          ? 'Operator flagged this entire vector as live exposure. Architect will treat it as NUKED until it is knoxed.'
          : status === 'KNOXED'
            ? 'Operator hardened this entire vector. Re-scan after any account change.'
            : 'Operator is watching this vector.',
        remediation: status === 'NUKED' ? 'Remediate, then tap KNOX.' : 'Keep sealed. Re-run Architect compile before export.',
      }]).map((f) => ({ ...f, status }));
      const next = { ...prev, [moduleId]: { ...row, findings, lastScanned: new Date().toISOString() } };
      if (user) persist(user.id, next);
      return next;
    });
  };

  const seedDemo = () => {
    const seeded = demoState();
    setModules(seeded);
    if (user) persist(user.id, seeded);
  };

  const clearSession = () => {
    if (user) {
      try {
        localStorage.removeItem(storageKey(user.id));
      } catch {
        /* ignore */
      }
    }
    setUserState(null);
    setModules(emptyState());
    setPipeline(null);
  };

  const dossier = useMemo(
    () =>
      buildDossier({
        displayName: user?.displayName || 'Operator',
        email: user?.email || 'guest@sovereign.nyc',
        authMethod: user?.authMethod || 'ANON',
        modules: MODULE_AGENTS.map((m) => ({
          id: m.id,
          findings: modules[m.id]?.findings || [],
          record: modules[m.id]?.record || {},
        })),
      }),
    [user, modules]
  );

  useEffect(() => {
    // Hash demo records once so splash screens have a seal on first paint.
    (async () => {
      const updates: Record<string, string> = {};
      for (const m of MODULE_AGENTS) {
        const row = modules[m.id];
        if (row && !row.hash && Object.keys(row.record).length) {
          try {
            updates[m.id] = await calculateSha256(`${user?.id || 'demo'}::${m.id}::${JSON.stringify(row.record)}`);
          } catch {
            /* ignore */
          }
        }
      }
      if (Object.keys(updates).length) {
        setModules((prev) => {
          const next = { ...prev };
          for (const [id, hash] of Object.entries(updates)) {
            next[id] = { ...next[id], hash };
          }
          return next;
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SovereignContext.Provider
      value={{
        user,
        setUser,
        modules,
        updateRecord,
        setFindings,
        patchFindingStatus,
        markVector,
        dossier,
        pipeline,
        setPipeline,
        clearSession,
        seedDemo,
      }}
    >
      {children}
    </SovereignContext.Provider>
  );
};

export const useSovereign = () => {
  const context = useContext(SovereignContext);
  if (!context) throw new Error('useSovereign must be used within a SovereignProvider');
  return context;
};
