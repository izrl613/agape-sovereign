import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { DIFFEngine, SovereignState } from '../services/diffEngine';
import { SovereignScoreService } from '../services/scoreService';

interface SovereignContextType {
  userId: string | null;
  score: number;
  vectorStates: Map<string, SovereignState>;
  isAuthenticated: boolean;
  login: (provider: 'google' | 'apple') => Promise<void>;
  unlock: (secret: string, isRecovery: boolean) => Promise<void>;
  runScan: () => Promise<void>;
}

const SovereignContext = createContext<SovereignContextType | null>(null);

export const SovereignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [vectorStates, setVectorStates] = useState(new Map<string, SovereignState>());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const authService = new AuthService();
  const diffEngine = new DIFFEngine();

  const login = async (provider: 'google' | 'apple') => {
    const session = await authService.loginFederated(provider);
    setUserId(session.userId);
    setIsAuthenticated(true);
  };

  const unlock = async (secret: string, isRecovery: boolean) => {
    await authService.unlockWithPasskey(secret); // simplified
    // In real app, we'd check success and set session state
  };

  const runScan = async () => {
    const newStates = new Map<string, SovereignState>();
    const vectors = [
      'comm_email', 'comm_phone', 'comm_creds', 'comm_passkeys',
      'social_scanner', 'social_brokers', 'social_deepweb', 'social_search',
      'hard_local', 'hard_mobile', 'hard_cloud', 'hard_network',
      'fin_identity', 'fin_biometric', 'fin_oauth', 'fin_legal'
    ];

    for (const vId of vectors) {
      const result = await diffEngine.evaluateVector(vId, {});
      newStates.set(vId, result.state);
    }

    setVectorStates(newStates);
    setScore(SovereignScoreService.calculateScore(newStates));
  };

  return (
    <SovereignContext.Provider value={{ userId, score, vectorStates, isAuthenticated, login, unlock, runScan }}>
      {children}
    </SovereignContext.Provider>
  );
};

export const useSovereign = () => {
  const context = useContext(SovereignContext);
  if (!context) throw new Error('useSovereign must be used within SovereignProvider');
  return context;
};
