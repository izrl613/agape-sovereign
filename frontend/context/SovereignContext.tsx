import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface UserSession {
  id: string;
  type: 'verified' | 'anonymous';
  email?: string;
  name?: string;
  /** Identity provider, lowercased: google | apple | passkey | anonymous. */
  provider?: string;
  /** Raw authentication method as reported by PasskeyService. */
  method?: 'GOOGLE' | 'PASSKEY' | 'ANON';
}

interface SovereignContextType {
  user: UserSession | null;
  collectedVectors: string[];
  setUser: (user: UserSession | null) => void;
  addVector: (moduleId: string) => void;
  clearSession: () => void;
}

const SovereignContext = createContext<SovereignContextType | undefined>(undefined);

const SESSION_KEY = 'sovereign.session';
const VECTORS_KEY = 'sovereign.vectors';

/**
 * Session persistence.
 *
 * `sessionStorage` — not `localStorage` — because the Privacy Policy promises
 * that the only browser storage we use is technically necessary session state
 * and that it is cleared on sign-out: "These are cleared when you sign out."
 * It also survives a reload of /dashboard, which is what makes a hard
 * navigation (or a Google OAuth round-trip back to /dashboard) land in the app
 * instead of bouncing to the login screen.
 */
const readSession = (): UserSession | null => {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
};

const readVectors = (): string[] => {
  try {
    const raw = window.sessionStorage.getItem(VECTORS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const persist = (key: string, value: unknown) => {
  try {
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Private-mode / storage-disabled browsers: session stays in memory only.
  }
};

export const SovereignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Hydrate synchronously so the first paint already knows whether we're authed
  // — otherwise /dashboard flashes the login screen on reload.
  const [user, setUserState] = useState<UserSession | null>(readSession);
  const [collectedVectors, setCollectedVectors] = useState<string[]>(readVectors);

  const setUser = useCallback((next: UserSession | null) => {
    setUserState(next);
    persist(SESSION_KEY, next);
    if (!next) {
      setCollectedVectors([]);
      persist(VECTORS_KEY, []);
    }
  }, []);

  const addVector = useCallback((moduleId: string) => {
    setCollectedVectors((prev) => {
      if (prev.includes(moduleId)) return prev;
      const next = [...prev, moduleId];
      persist(VECTORS_KEY, next);
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    setUserState(null);
    setCollectedVectors([]);
    persist(SESSION_KEY, null);
    persist(VECTORS_KEY, []);
  }, []);

  return (
    <SovereignContext.Provider value={{ user, setUser, collectedVectors, addVector, clearSession }}>
      {children}
    </SovereignContext.Provider>
  );
};

export const useSovereign = () => {
  const context = useContext(SovereignContext);
  if (!context) throw new Error('useSovereign must be used within a SovereignProvider');
  return context;
};
