import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, HealthResponse } from '../services/api';

interface GenkitContextType {
  isInitialized: boolean;
  error: Error | null;
  health: HealthResponse | null;
  initialize: (backendUrl?: string) => Promise<void>;
}

const GenkitContext = createContext<GenkitContextType | undefined>(undefined);

export function GenkitProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const initialize = useCallback(async (backendUrl = 'http://localhost:3000') => {
    try {
      setError(null);
      api.setBaseUrl(backendUrl);
      const healthData = await api.health();
      setHealth(healthData);
      setIsInitialized(true);
    } catch (err) {
      setError(err as Error);
      setIsInitialized(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GenkitContext.Provider value={{ isInitialized, error, health, initialize }}>
      {children}
    </GenkitContext.Provider>
  );
}

export function useGenkit() {
  const context = useContext(GenkitContext);
  if (!context) {
    throw new Error('useGenkit must be used within a GenkitProvider');
  }
  return context;
}
