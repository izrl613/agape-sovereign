import React, { createContext, useContext, useRef, useState } from 'react';
import { AuthService } from '../services/authService';
import { SovereignState } from '../services/diffEngine';
import {
  runSecureSovereignScan,
  toLegacyStates,
  type SecureScanSummary,
} from '../services/secureAutomationService';

/**
 * Result of a secure scan, safe to hand to the UI and to persist.
 * `envelope` is ciphertext only and never contains secrets or plaintext PII.
 */
export interface SovereignScanSummary {
  state: SecureScanSummary['state'];
  sovereignScore: number;
  subject: string;
  completedAt: string;
  envelope: SecureScanSummary['result']['envelope'];
}

export interface RunScanOptions {
  /** Per-vector probe inputs, e.g. `{ 'device-health': { fileText } }`. */
  params?: Record<string, Record<string, string>>;
  /** Dispatch remediation requests for NUKED vectors (fail-closed by default). */
  enableRemediation?: boolean;
}

interface SovereignContextType {
  userId: string | null;
  score: number;
  vectorStates: Map<string, SovereignState>;
  /** SHA-256 receipt digest per canonical module id. */
  receipts: Record<string, string>;
  isAuthenticated: boolean;
  isScanning: boolean;
  scanError: string | null;
  lastScan: SovereignScanSummary | null;
  /** True when both a passkey and a distinct recovery secret are unlocked. */
  canRunSealedScan: boolean;
  login: (provider: 'google' | 'apple') => Promise<void>;
  unlock: (secret: string, isRecovery: boolean) => Promise<void>;
  runScan: (options?: RunScanOptions) => Promise<SovereignScanSummary>;
}

const SovereignContext = createContext<SovereignContextType | null>(null);

/**
 * Convert the adapter's legacy string states into the enum used by the UI.
 * Kept explicit so the two taxonomies cannot drift silently.
 */
function toSovereignStateMap(
  states: Map<string, 'KNOXED' | 'NUKED'>,
): Map<string, SovereignState> {
  const converted = new Map<string, SovereignState>();
  states.forEach((value, key) => {
    converted.set(
      key,
      value === 'KNOXED' ? SovereignState.KNOXED : SovereignState.NUKED,
    );
  });
  return converted;
}

export const SovereignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [vectorStates, setVectorStates] = useState(new Map<string, SovereignState>());
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<SovereignScanSummary | null>(null);
  const [secretsPresent, setSecretsPresent] = useState({ passkey: false, recovery: false });

  const authServiceRef = useRef<AuthService | null>(null);
  if (!authServiceRef.current) authServiceRef.current = new AuthService();
  const authService = authServiceRef.current;

  // Unlock secrets live only in refs: never in state, never serialized, never logged.
  const passkeySecretRef = useRef<string | null>(null);
  const recoverySecretRef = useRef<string | null>(null);

  const login = async (provider: 'google' | 'apple') => {
    const session = await authService.loginFederated(provider);
    setUserId(session.userId);
    setIsAuthenticated(true);
  };

  const unlock = async (secret: string, isRecovery: boolean) => {
    if (isRecovery) {
      await authService.unlockWithRecoveryCode(secret);
      recoverySecretRef.current = secret;
      setSecretsPresent((prev) => ({ ...prev, recovery: true }));
    } else {
      await authService.unlockWithPasskey(secret);
      passkeySecretRef.current = secret;
      setSecretsPresent((prev) => ({ ...prev, passkey: true }));
    }
  };

  const runScan = async (options?: RunScanOptions): Promise<SovereignScanSummary> => {
    if (!userId) {
      throw new Error('runScan: sign in before running a scan.');
    }

    const passkeySecret = passkeySecretRef.current;
    const recoverySecret = recoverySecretRef.current;
    if (!passkeySecret || !recoverySecret) {
      // Fail closed: never fabricate a second secret, never seal with a weak pair.
      throw new Error(
        'runScan: a sealed scan needs both your passkey and a distinct recovery code. ' +
          'Call unlock(passkeySecret, false) and unlock(recoveryCode, true) first.',
      );
    }

    setIsScanning(true);
    setScanError(null);
    try {
      const summary = await runSecureSovereignScan({
        userId,
        passkeySecret,
        recoverySecret,
        params: options?.params,
        enableRemediation: options?.enableRemediation ?? false,
      });

      // strict=true: an unconfigured/MONITORED vector is never shown as secure.
      setVectorStates(toSovereignStateMap(toLegacyStates(summary.result, true)));
      setReceipts(summary.receipts);
      setScore(summary.sovereignScore);

      const scan: SovereignScanSummary = {
        state: summary.state,
        sovereignScore: summary.sovereignScore,
        subject: summary.subject,
        completedAt: summary.result.completedAt,
        envelope: summary.result.envelope,
      };
      setLastScan(scan);
      return scan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Secure scan failed.';
      setScanError(message);
      throw err;
    } finally {
      setIsScanning(false);
    }
  };

  const value: SovereignContextType = {
    userId,
    score,
    vectorStates,
    receipts,
    isAuthenticated,
    isScanning,
    scanError,
    lastScan,
    canRunSealedScan: secretsPresent.passkey && secretsPresent.recovery,
    login,
    unlock,
    runScan,
  };

  return <SovereignContext.Provider value={value}>{children}</SovereignContext.Provider>;
};

export const useSovereign = () => {
  const context = useContext(SovereignContext);
  if (!context) throw new Error('useSovereign must be used within SovereignProvider');
  return context;
};
