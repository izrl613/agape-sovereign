import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { collection, doc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import {
  auth,
  db,
  onAuthStateChanged,
  fbSignOut,
  signInWithGoogle,
  linkGoogleToCurrentUser,
  signInGuest,
} from '../firebase';
import { PasskeyService } from '../auth/passkey-service';
import { sovereignIdFor, unwrapDEKFromPasskey, generateDEK, wrapDEKWithPasskey, wrapDEKWithRecoveryCode, generateRecoveryCode } from '../services/sha256Vault';
import { ModuleReceipt } from '../services/moduleAgents';
import { verifyReceiptAttestation } from '../services/receiptIntegrity';

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
  dek: CryptoKey | null;
  /**
   * One-time recovery code for a freshly created enclave. It is held in memory
   * only and must be shown to the user once, then cleared (never logged).
   */
  recoveryCode: string | null;
  acknowledgeRecoveryCode: () => void;
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

async function openSovereignDB() {
  return new Promise<{ db: IDBDatabase }>((resolve, reject) => {
    const request = indexedDB.open('agape-sovereign-db', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'sha256Id' });
      }
    };
    request.onsuccess = () => resolve({ db: request.result });
    request.onerror = () => reject(request.error);
  });
}

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
  const dekRef = useRef<CryptoKey | null>(null);
  // Mirrored in state so consumers re-render once the enclave unlocks.
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  const getOrInitializeEnclave = useCallback(async (uid: string, email: string) => {
    const docRef = doc(db, 'users', uid, 'enclave', 'keys');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const { passkeyWrap } = snap.data();
      try {
        const restored = await unwrapDEKFromPasskey(passkeyWrap);
        dekRef.current = restored;
        setDek(restored);
        return;
      } catch (e) {
        console.error('Failed to unwrap DEK', e);
        throw new Error('Failed to recover sovereign enclave keys.');
      }
    }

    // Initialize new enclave
    const dek = await generateDEK();
    const passkeyWrap = await wrapDEKWithPasskey(dek);
    const recoveryCode = generateRecoveryCode();
    const recoveryCodeWrap = await wrapDEKWithRecoveryCode(dek, recoveryCode);

    await setDoc(docRef, { passkeyWrap, recoveryCodeWrap });
    dekRef.current = dek;
    setDek(dek);
    // Surface once through context for the UI to display and let the user save.
    // Never log it: console output is persisted by devtools and error reporters.
    setRecoveryCode(recoveryCode);
  }, []);

  const acknowledgeRecoveryCode = useCallback(() => setRecoveryCode(null), []);

  const adoptUser = useCallback(async (u: SovereignUser) => {
    methodRef.current = u.method;
    setUserState(u);
    setSovereignId(await sovereignIdFor(u.id, u.email, u.method));

    try {
      await getOrInitializeEnclave(u.id, u.email);
    } catch (e) {
      console.error('Enclave initialization failed', e);
    }

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

  const loginWithPasskeyDevice = useCallback(async (email?: string) => {
    const result = await PasskeyService.device_login(email);
    sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
    await adoptUser({
      id: result.userId,
      email: result.email,
      method: 'PASSKEY_DEVICE',
      isAdmin: ADMIN_EMAILS.includes(result.email.toLowerCase()),
    });
  }, [adoptUser]);

  const loginWithPasskey = useCallback(async (email?: string) => {
    const result = await PasskeyService.login(email);
    sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
    await adoptUser({
      id: result.userId,
      email: result.email,
      method: 'PASSKEY',
      isAdmin: ADMIN_EMAILS.includes(result.email.toLowerCase()),
    });
  }, [adoptUser]);

  const loginWithPasskeyDevice = useCallback(async (email?: string) => {
    const result = await PasskeyService.device_login(email);
    sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
    await adoptUser({
      id: result.userId,
      email: result.email,
      method: 'PASSKEY_DEVICE',
      isAdmin: ADMIN_EMAILS.includes(result.email.toLowerCase()),
    });
  }, [adoptUser]);

  const registerPasskey = useCallback(async (email: string) => {
    await PasskeyService.register(email);
    await loginWithPasskey(email);
  }, [loginWithPasskey]);

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

  const loginWithPasskeyDevice = useCallback(async (email?: string) => {
    const result = await PasskeyService.device_login(email);
    sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
    await adoptUser({
      id: result.userId,
      email: result.email,
      method: 'PASSKEY_DEVICE',
      isAdmin: ADMIN_EMAILS.includes(result.email.toLowerCase()),
    });
  }, [adoptUser]);

  const loginGuest = useCallback(async () => {
    const fbUser = await signInGuest();
    await adoptUser({ id: fbUser.uid, email: '', method: 'ANON', isAdmin: false });
  }, [adoptUser]);

  const loginWithPasskeyDevice = useCallback(async (email?: string) => {
    const result = await PasskeyService.device_login(email);
    sessionStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(result));
    await adoptUser({
      id: result.userId,
      email: result.email,
      method: 'PASSKEY_DEVICE',
      isAdmin: ADMIN_EMAILS.includes(result.email.toLowerCase()),
    });
  }, [adoptUser]);

  const attachGoogle = useCallback(async (): Promise<string | null> => {
    if (user?.method === 'PASSKEY') {
      // Passkey accounts live outside Firebase Auth, so "attaching" means
      // a real Google sign-in; local passkey receipts stay on this device.
      return loginWithGoogle();
    }
    const { user: fbUser, accessToken } = await linkGoogleToCurrentUser();
    setGoogleAccessToken(accessToken);
    await adoptUser({
      id: fbUser.uid,
      email: fbUser.email ?? '',
      method: 'GOOGLE',
      isAdmin: ADMIN_EMAILS.includes((fbUser.email ?? '').toLowerCase()),
    });
    return accessToken;
  }, [adoptUser, loginWithGoogle, user]);

  // Declared before `addReceipt` so its dependency array cannot hit a
  // temporal-dead-zone ReferenceError at runtime.
  const syncReceipts = useCallback(async () => {
    if (!user) return;
    try {
      const { db: idb } = await openSovereignDB();
      const tx = idb.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const all = await new Promise<ModuleReceipt[]>((res) => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
      });

      if (all.length === 0) return;

      // Batch in chunks of 5 to stay safe under 15 RPM
      for (let i = 0; i < all.length; i += 5) {
        const batch = all.slice(i, i + 5);
        await Promise.all(batch.map(async (r) => {
          try {
            await setDoc(doc(db, 'users', user.id, 'receipts', r.sha256Id), {
              ...r,
              storage: 'FIRESTORE+LOCAL',
            });
          } catch (e) {
            console.error('Batch write failed for', r.sha256Id, e);
          }
        }));
        // Small delay to prevent burst quota hits
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Clear outbox
      const clearTx = idb.transaction('outbox', 'readwrite');
      clearTx.objectStore('outbox').clear();
    } catch (e) {
      console.error('Sync failed', e);
    }
  }, [user]);

  const addReceipt = useCallback(
    async (receipt: ModuleReceipt, entryValues: Record<string, string>): Promise<ModuleReceipt> => {
      if (!user) throw new Error('Not signed in.');

      // Fail closed: never persist a receipt whose attestation does not verify.
      // Legacy receipts (pre-attestation) are still accepted so upgrades do not
      // strand existing users.
      if (receipt.attestation && !(await verifyReceiptAttestation(receipt.attestation))) {
        throw new Error(
          'Receipt integrity check failed — the receipt was modified and was not saved.',
        );
      }

      // 1. Save to local IndexedDB outbox first (Zero-Trust)
      try {
        const { db: idb } = await openSovereignDB();
        const tx = idb.transaction('outbox', 'readwrite');
        tx.objectStore('outbox').put(receipt);
      } catch (e) {
        console.error('IndexedDB write failed', e);
      }

      // 2. Update local session state immediately for responsiveness
      const stored: ModuleReceipt = { ...receipt, storage: 'LOCAL_ONLY' };
      setReceipts((prev) => {
        const next = [...prev.filter((r) => r.sha256Id !== stored.sha256Id), stored];
        localStorage.setItem(receiptsKey(user.id), JSON.stringify(next));
        return next;
      });

      const safeValues = { ...entryValues };
      delete safeValues.passwordCheck;
      setSessionEntries((prev) => ({ ...prev, [stored.sha256Id]: safeValues }));

      // 3. Trigger background sync
      void syncReceipts();

      return stored;
    },
    [user, syncReceipts],
  );

  const clearSession = useCallback(async () => {
    sessionStorage.removeItem(PASSKEY_SESSION_KEY);
    setGoogleAccessToken(null);
    setSessionEntries({});
    setReceipts([]);
    setUserState(null);
    setSovereignId(null);
    dekRef.current = null;
    setDek(null);
    setRecoveryCode(null);
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
        dek,
        recoveryCode,
        acknowledgeRecoveryCode,
        loginWithPasskey,
        loginWithPasskeyDevice,
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
