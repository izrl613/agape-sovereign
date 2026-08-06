import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { logEvent, AuditLogType } from './services/auditService';
import { initializeRemoteConfig } from './services/remoteConfigService';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { signInWithCustomToken } from 'firebase/auth';
// OPERATION FRAMEWORK: Sovereign Pipeline
import { gatekeeperStage, cleanupSession } from './services/poaOrchestratorService';
import { generateSessionNonce } from './services/sovereignHashService';

interface AuthContextType {
  user: User | null;
  userData: any;
  isAdmin: boolean;
  isAnonymous: boolean;
  sovereignScore: number;
  sovereignHash: string | null;
  authType: 'google' | 'passkey' | 'anonymous' | null;
  setupComplete: boolean;
  loading: boolean;
  demoMode: boolean;
  login: () => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  bindPasskey: () => Promise<void>;
  setSetupComplete: (complete: boolean) => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  setDemoUser: () => void;
  clearDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_SESSION_KEY = 'sovereign_demo_mode';
const DEMO_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface DemoSession {
  active: boolean;
  expiresAt: number;
}

function readDemoSession(): DemoSession | null {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

function writeDemoSession() {
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({
    active: true,
    expiresAt: Date.now() + DEMO_TTL_MS,
  }));
}

function clearDemoSession() {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
}

const DEMO_USER_OBJECT = {
  uid: 'demo-user',
  email: 'demo@sovereign.nyc',
  displayName: 'Demo Explorer',
  isAnonymous: true,
} as unknown as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sovereignScore, setSovereignScore] = useState(100);
  // OPERATION FRAMEWORK: SHA-256 identity hash (the sole session identifier)
  const [sovereignHash, setSovereignHash] = useState<string | null>(null);
  const [authType, setAuthType] = useState<'google' | 'passkey' | 'anonymous' | null>(null);
  const [setupComplete, setSetupCompleteState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Restore demo session on mount (handles page refresh within TTL)
  useEffect(() => {
    const session = readDemoSession();
    if (session?.active && session.expiresAt > Date.now()) {
      setDemoMode(true);
      setUser(DEMO_USER_OBJECT);
      setSetupCompleteState(true);
      setLoading(false);
    } else if (session) {
      clearDemoSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          // Initialize Remote Config for the user
          initializeRemoteConfig();
           
          const userRef = doc(db, 'users', currentUser.uid);
          
          try {
            const userSnap = await getDoc(userRef);
            
            const isSuperAdmin = currentUser.email === 'idin@agape.nyc' ||
                                 currentUser.email === 'agape@sovereign.nyc';
            
            // Determine authType early — passkey detection via sessionStorage flag
            const isPasskeyLogin = sessionStorage.getItem('sovereign_passkey_auth') === 'true';
            const sessionNonce = sessionStorage.getItem('sovereign_passkey_nonce') || undefined;
            const credentialId = sessionStorage.getItem('sovereign_passkey_credential') || undefined;

            let resolvedAuthType: 'google' | 'passkey' | 'anonymous' = 'google';
            if (currentUser.isAnonymous) {
              resolvedAuthType = 'anonymous';
            } else if (isPasskeyLogin && credentialId && sessionNonce) {
              resolvedAuthType = 'passkey';
            }
            setAuthType(resolvedAuthType);

            // OPERATION FRAMEWORK: Produce SHA-256 identity hash immediately (Phase 1 Gatekeeper)
            // Raw uid + email never stored beyond this scope — hash is the sole session identifier.
            try {
              const hash = await gatekeeperStage({
                authType: resolvedAuthType,
                uid: currentUser.uid,
                email: currentUser.email || currentUser.uid,
                credentialId,
                sessionNonce,
              });
              setSovereignHash(hash);

              // Clean up passkey session artifacts after hash is computed
              if (isPasskeyLogin) {
                sessionStorage.removeItem('sovereign_passkey_auth');
                sessionStorage.removeItem('sovereign_passkey_nonce');
                sessionStorage.removeItem('sovereign_passkey_credential');
              }
            } catch (hashErr) {
              console.warn('[AUTH] Gatekeeper hash failed — degraded mode:', hashErr);
              // Never leave UI stuck on "hashing": fall back to Google identity hash inputs
              try {
                const fallback = await gatekeeperStage({
                  authType: 'google',
                  uid: currentUser.uid,
                  email: currentUser.email || currentUser.uid,
                });
                setSovereignHash(fallback);
              } catch {
                // Last resort stable marker so Login timeouts do not fire forever
                setSovereignHash(`degraded_${currentUser.uid}`);
              }
            }

            if (!userSnap.exists()) {
              const initialData = {
                uid: currentUser.uid,
                email: currentUser.email || 'unknown@example.com',
                displayName: currentUser.displayName || '',
                role: isSuperAdmin ? 'admin' : 'user',
                createdAt: serverTimestamp(),
                sovereignScore: 100,
                setupComplete: false,
                authType: resolvedAuthType,
                notificationsEnabled: false
              };
              try {
                await setDoc(userRef, initialData);
                setSetupCompleteState(false);
                setUserData(initialData);
                logEvent(AuditLogType.USER_REGISTERED, `New user registered: ${currentUser.email}`, currentUser.uid, currentUser.email || undefined);
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
              }
              setIsAdmin(isSuperAdmin);
              setSovereignScore(100);
            } else {
              const data = userSnap.data();
              setUserData(data);
              setIsAdmin(data.role === 'admin' || isSuperAdmin);
              setSovereignScore(data.sovereignScore || 100);
              setSetupCompleteState(data.setupComplete || false);
              logEvent(AuditLogType.USER_LOGIN, `User logged in: ${currentUser.email}`, currentUser.uid, currentUser.email || undefined);
            }

            unsubscribeUserDoc = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                setUserData(data);
                setSovereignScore(data.sovereignScore || 100);
                setIsAdmin(data.role === 'admin' || isSuperAdmin);
                setSetupCompleteState(data.setupComplete || false);
                if (data.authType) setAuthType(data.authType);
              }
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }
        } else {
          setIsAdmin(false);
          setSovereignScore(100);
          setSovereignHash(null);
          setAuthType(null);
          setSetupCompleteState(false);
          setUserData(null);
          if (unsubscribeUserDoc) unsubscribeUserDoc();
          // Release capacity slot on sign-out
          cleanupSession().catch(() => {});
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const handleLogin = async () => {
    const userOrNull = await loginWithGoogle();
    // Redirect flow leaves the page; no further client work until return.
    if (userOrNull === null) {
      return;
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleBindPasskey = async () => {
    const currentUser = user;
    if (!currentUser) {
      toast.error('You must be logged in to bind a passkey.');
      return;
    }

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('This browser does not support passkeys (WebAuthn).');
      }
      if (!currentUser.email) {
        throw new Error('Your Google account must provide an email address before you can register a passkey.');
      }
      const idToken = await currentUser.getIdToken(/* forceRefresh */ true);

      // 1. Get registration options from server (same-origin Hosting rewrite → authApi)
      const optionsRes = await fetch('/api/auth/register-options', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: currentUser.email }),
      });

      const optionsBody = await optionsRes.json().catch(() => ({}));
      if (!optionsRes.ok) {
        throw new Error(optionsBody.error || `Failed to fetch registration options (${optionsRes.status})`);
      }
      if (!optionsBody.challenge || !optionsBody.rp) {
        throw new Error('Invalid registration options from server.');
      }

      // 2. Start registration with the browser (simplewebauthn v13+)
      const attestationResponse = await startRegistration({ optionsJSON: optionsBody });

      // 3. Verify with server
      const verifyRes = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...attestationResponse,
          userId: currentUser.uid,
          email: currentUser.email,
        }),
      });
      const verifyBody = await verifyRes.json().catch(() => ({}));

      if (verifyRes.ok && verifyBody.verified) {
        toast.success('Universal Passkey bound to this device successfully.');
        logEvent(AuditLogType.SECURITY_EVENT, 'Passkey bound to device', currentUser.uid, currentUser.email || undefined);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { hasPasskey: true, authType: 'passkey' });
        } catch {
          // non-fatal
        }
      } else {
        throw new Error(verifyBody.error || 'Passkey verification failed');
      }
    } catch (error: any) {
      console.error('WebAuthn Error:', error);
      if (error?.name === 'NotAllowedError' || /cancel/i.test(String(error?.message || ''))) {
        toast.error('Passkey registration cancelled by user.');
      } else if (error?.name === 'InvalidStateError') {
        toast.error('A passkey already exists for this authenticator.');
      } else {
        toast.error(`WebAuthn Error: ${error?.message || 'Unknown error'}`);
      }
      throw error;
    }
  };

  const handleLoginWithPasskey = async (email: string) => {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) {
      toast.error('Please enter your email to login with passkey.');
      throw new Error('Please enter your email to login with passkey.');
    }

    if (typeof window !== 'undefined' && !window.PublicKeyCredential) {
      const err = new Error('This browser does not support passkeys (WebAuthn).');
      toast.error(err.message);
      throw err;
    }

    try {
      // OPERATION FRAMEWORK: Pre-compute passkey session nonce for hash
      const sessionNonce = generateSessionNonce();
      // Store in sessionStorage so onAuthStateChanged can retrieve it after
      // signInWithCustomToken fires the auth state change callback.
      sessionStorage.setItem('sovereign_passkey_auth', 'true');
      sessionStorage.setItem('sovereign_passkey_nonce', sessionNonce);
      sessionStorage.setItem('sovereign_passkey_email', normalized);

      // 1. Get login options (same-origin → Hosting rewrite → authApi)
      const optionsRes = await fetch('/api/auth/login-options', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      });

      const optionsBody = await optionsRes.json().catch(() => ({}));
      if (!optionsRes.ok) {
        throw new Error(optionsBody.error || `Failed to fetch login options (${optionsRes.status})`);
      }
      if (!optionsBody.challenge) {
        throw new Error('Invalid authentication options from server.');
      }

      // 2. Start authentication (simplewebauthn v13+)
      const assertionResponse = await startAuthentication({ optionsJSON: optionsBody });

      // Store credential ID for hash computation in onAuthStateChanged
      const credentialId = assertionResponse.id || assertionResponse.rawId;
      sessionStorage.setItem('sovereign_passkey_credential', String(credentialId));

      // 3. Verify with server
      const verifyRes = await fetch('/api/auth/verify-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertionResponse),
      });

      const verifyBody = await verifyRes.json().catch(() => ({}));
      const { verified, token, error } = verifyBody;

      if (verifyRes.ok && verified && token) {
        await signInWithCustomToken(auth, token);
        toast.success('Authenticated successfully with Passkey.');
      } else {
        throw new Error(error || verifyBody.error || 'Passkey verification failed');
      }
    } catch (error: any) {
      console.error('WebAuthn Login Error:', error);
      // Clean up sessionStorage on failure so stale state doesn't persist
      sessionStorage.removeItem('sovereign_passkey_auth');
      sessionStorage.removeItem('sovereign_passkey_nonce');
      sessionStorage.removeItem('sovereign_passkey_credential');
      sessionStorage.removeItem('sovereign_passkey_email');
      if (error?.name === 'NotAllowedError') {
        toast.error('Passkey login cancelled.');
      } else {
        toast.error(`Passkey Error: ${error?.message || 'Unknown error'}`);
      }
      throw error;
    }
  };

  const handleSetSetupComplete = async (complete: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        setupComplete: complete,
        updatedAt: serverTimestamp()
      });
      setSetupCompleteState(complete);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleUpdateProfile = async (data: { displayName?: string, photoURL?: string }) => {
    if (!user) return;
    try {
      // Update Firebase Auth profile
      await firebaseUpdateProfile(user, data);
      
      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      logEvent(AuditLogType.USER_UPDATED, `User profile updated: ${Object.keys(data).join(', ')}`, user.uid, user.email || undefined);
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      throw error;
    }
  };

  const handleSetDemoUser = () => {
    writeDemoSession();
    setDemoMode(true);
    setUser(DEMO_USER_OBJECT);
    setSetupCompleteState(true);
    setLoading(false);
  };

  const handleClearDemoUser = () => {
    clearDemoSession();
    setDemoMode(false);
    setUser(null);
    setUserData(null);
    setSetupCompleteState(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      isAdmin,
      isAnonymous: user?.isAnonymous || false,
      sovereignScore,
      sovereignHash,
      authType,
      setupComplete,
      loading,
      demoMode,
      login: handleLogin,
      loginWithPasskey: handleLoginWithPasskey,
      logout: handleLogout,
      bindPasskey: handleBindPasskey,
      setSetupComplete: handleSetSetupComplete,
      updateProfile: handleUpdateProfile,
      setDemoUser: handleSetDemoUser,
      clearDemoUser: handleClearDemoUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
