import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserSession {
  id: string;
  type: 'verified' | 'anonymous';
}

interface SovereignContextType {
  user: UserSession | null;
  collectedVectors: string[];
  setUser: (user: UserSession | null) => void;
  addVector: (moduleId: string) => void;
  clearSession: () => void;
}

const SovereignContext = createContext<SovereignContextType | undefined>(undefined);

export const SovereignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [collectedVectors, setCollectedVectors] = useState<string[]>([]);

  const addVector = (moduleId: string) => {
    setCollectedVectors(prev => prev.includes(moduleId) ? prev : [...prev, moduleId]);
  };

  const clearSession = () => {
    setUser(null);
    setCollectedVectors([]);
  };

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
