import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  onAuthStateChanged,
  fbSignOut,
  signInWithGoogle,
  signInGuest,
  signInWithCustomToken,
  requestDriveAccess,
} from '../firebase';
import { PasskeyService } from '../auth/passkey-service';
import { sovereignIdFor } from '../services/sha256Vault';
import { ModuleReceipt } from '../services/moduleAgents';

export type LoginMethod = 'PASSKEY' | 'GOOGLE' | 'ANON';

export interface SovereignUser {
  id: string;
  email: string;
  method: LoginMethod;
  isAdmin: boolean;
}

interface SovereignContextType {
  user: SovereignUser | null;
  authReady: boolean;
  /** The session's lit-up SHA-256 Sovereign ID (null when signed out). */
  sovereignId: string | null;
  receipts: ModuleReceipt[];
  /** Module ids with at least one sealed receipt. */
  collectedVectors: string[];
  /** Session-only plaintext entries for the PDF (never persisted). */
  sessionEntries: Record<string, Record<string, string>>;
  googleAccessToken: string | null;
  loginWithPasskey: (email?: string) => Promise<void>;
  registerPasskey: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<string | null>;
  loginGuest: () => Promise<void>;
  /** Attach Google (dual protection + Drive) to the current session. */
  attachGoogle: () => Promise<string | null>;
  addReceipt: (receipt: ModuleReceipt, entryValues: Record<string, string>) => Promise<ModuleReceipt>;
  clearSession: () => Promise<void>;
}

const ADMIN_EMAILS = ['idin@agape.nyc', 'agape@sovereign.nyc'];
const SovereignContext = createContext<SovereignContextType | undefined>(undefined);

const receiptsKey = (uid: string) => `agape-receipts::${uid}`;
const PASSKEY_SESSION_KEY = 'agape-passkey-session';

function loadLocalReceipts(uid: string): ModuleReceipt[] {
  try {
    return JSON.parse(localStorage.getItem(receiptsKey(uid)) ?? '[]');
  } catch {
    return [];
  }
}

export const SovereignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<SovereignUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sovereignId, setSovereignId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ModuleReceipt[]>([]);
  const [sessionEntries, setSessionEntries] = useState<Record<string, Record<string, string>>>({});
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const methodRef = useRef<LoginMethod>('GOOGLE');

  const adoptUser = useCallback(async (u: SovereignUser) => {
    methodRef.current = u.method;
    setUserState(u);
    setSovereignId(await sovereignIdFor(u.id, u.email, u.method));
    const local = loadLocalReceipts(u.id);
    setReceipts(local);
    if (u.method !== 'PASSKEY') {
      try {
        const snap = await getDocs(collection(db, 'users', u.id, 'receipts'));
        const remote = snap.docs.map((d) => d.data() as ModuleReceipt);
        const merged = [...remote, ...local.filter((r) => !remote.some((x) => x.sha256Id === r.sha256Id))]
          .sort((a, b) => a.sealedAt.localeCompare(b.sealedAt));
        setReceipts(merged);
        localStorage.setItem(receiptsKey(u.id), JSON.stringify(merged));
      } catch {
        // Firestore unavailable/rules — local sealed receipts remain authoritative on this device.
      }
    }
  }, []);

  // Restore Firebase sessions (Google / Anonymous) and passkey sessions.
  useEffect(() => {
    const passkeyRaw = sessionStorage.getItem(PASSKEY_SESSION_KEY);
    if (passkeyRaw) {
      try {
        const p = JSON.parse(passkeyRaw) as { userId: string; email: string };
        void adoptUser({ id: p.userId, email: p.email, method: 'PASSKEY', isAdmin: ADMIN_EMAILS.includes(p.email) })
          .finally(() => setAuthReady(true));
        return;
      } catch { sessionStorage.removeItem(PASSKEY_SESSION_KEY); }
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const method: LoginMethod = fbUser.isAnonymous ? 'ANON' : 'GOOGLE';
        await adoptUser({
          id: fbUser.uid,
          email: fbUser.email ?? '',
          method,
          isAdmin: ADMIN_EMAILS.includes((fbUser.email ?? '').toLowerCase()),
        });
      } else if (methodRef.current !== 'PASSKEY') {
        setUserState(null);
        setSovereignId(null);
        setReceipts([]);
      }
      setAuthReady(true);
    });
    return unsub;
  }, [adoptUser]);

  const loginWithPasskey = useCallback(async (email?: string) => {
    const result = await PasskeyService.login(email);
    sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
    if (result.token) {
      try { await signInWithCustomToken(auth, result.token); } catch { /* session still valid locally */ }
    }
    await adoptUser({
      id: result.userId,
      email: result.email,
      method: 'PASSKEY',
      isAdmin: ADMIN_EMAILS.includes(result.email.toLowerCase()),
    });
  }, [adoptUser]);

  const registerPasskey = useCallback(async (email: string) => {
    const token = await PasskeyService.register(email);
    if (token) {
      const cred = await signInWithCustomToken(auth, token);
      const result = { userId: cred.user.uid, email };
      sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
      await adoptUser({
        id: cred.user.uid,
        email,
        method: 'PASSKEY',
        isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
      });
      return;
    }
    await loginWithPasskey(email);
  }, [loginWithPasskey, adoptUser]);

  const loginWithGoogle = useCallback(async (): Promise<string | null> => {
    const { user: fbUser, accessToken } = await signInWithGoogle();
    setGoogleAccessToken(accessToken);
    await adoptUser({
      id: fbUser.uid,
      email: fbUser.email ?? '',
      method: 'GOOGLE',
      isAdmin: ADMIN_EMAILS.includes((fbUser.email ?? '').toLowerCase()),
    });
    return accessToken;
  }, [adoptUser]);

  const loginGuest = useCallback(async () => {
    const fbUser = await signInGuest();
    await adoptUser({ id: fbUser.uid, email: '', method: 'ANON', isAdmin: false });
  }, [adoptUser]);

  const attachGoogle = useCallback(async (): Promise<string | null> => {
    const token = await requestDriveAccess();
    setGoogleAccessToken(token);
    return token;
  }, []);

  const addReceipt = useCallback(
    async (receipt: ModuleReceipt, entryValues: Record<string, string>): Promise<ModuleReceipt> => {
      if (!user) throw new Error('Not signed in.');
      let stored = receipt;
      if (user.method !== 'PASSKEY' && auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', user.id, 'receipts', receipt.sha256Id), {
            ...receipt,
            storage: 'FIRESTORE+LOCAL',
          });
          stored = { ...receipt, storage: 'FIRESTORE+LOCAL' };
        } catch {
          stored = { ...receipt, storage: 'LOCAL_ONLY' };
        }
      }
      setReceipts((prev) => {
        const next = [...prev.filter((r) => r.sha256Id !== stored.sha256Id), stored];
        localStorage.setItem(receiptsKey(user.id), JSON.stringify(next));
        return next;
      });
      const safeValues = { ...entryValues };
      delete safeValues.passwordCheck;
      setSessionEntries((prev) => ({ ...prev, [stored.sha256Id]: safeValues }));
      return stored;
    },
    [user],
  );

  const clearSession = useCallback(async () => {
    sessionStorage.removeItem(PASSKEY_SESSION_KEY);
    setGoogleAccessToken(null);
    setSessionEntries({});
    setReceipts([]);
    setUserState(null);
    setSovereignId(null);
    methodRef.current = 'GOOGLE';
    try { await fbSignOut(auth); } catch { /* passkey sessions have no Firebase user */ }
  }, []);

  return (
    <SovereignContext.Provider
      value={{
        user,
        authReady,
        sovereignId,
        receipts,
        collectedVectors: Array.from(new Set(receipts.map((r) => r.moduleId))),
        sessionEntries,
        googleAccessToken,
        loginWithPasskey,
        registerPasskey,
        loginWithGoogle,
        loginGuest,
        attachGoogle,
        addReceipt,
        clearSession,
      }}
    >
      {children}
    </SovereignContext.Provider>
  );
};

export const useSovereign = () => {
  const ctx = useContext(SovereignContext);
  if (!ctx) throw new Error('useSovereign must be used within a SovereignProvider');
  return ctx;
};
