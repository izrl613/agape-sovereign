import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { genkit, Genkit, z } from 'genkit';
import { ollama } from 'genkitx-ollama';

interface GenkitContextType {
  ai: Genkit | null;
  isInitialized: boolean;
  error: Error | null;
  initialize: (serverAddress?: string) => Promise<void>;
}

const GenkitContext = createContext<GenkitContextType | undefined>(undefined);

export function GenkitProvider({ children }: { children: ReactNode }) {
  const [ai, setAi] = useState<Genkit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async (serverAddress = 'http://127.0.0.1:11434') => {
    try {
      setError(null);
      const aiInstance = genkit({
        plugins: [
          ollama({
            models: [
              { name: 'llama3.2', type: 'chat' },
              { name: 'llama3.2:1b', type: 'chat' },
              { name: 'gemma2:2b', type: 'chat' },
              { name: 'phi3:mini', type: 'chat' },
              { name: 'qwen2.5:0.5b', type: 'chat' },
              { name: 'nomic-embed-text', type: 'embed' },
            ],
            serverAddress,
          }),
        ],
      });
      setAi(aiInstance);
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
    <GenkitContext.Provider value={{ ai, isInitialized, error, initialize }}>
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