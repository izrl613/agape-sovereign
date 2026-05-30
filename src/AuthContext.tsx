import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, functions, loginWithGoogle, loginAnonymously, logout } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { logEvent, AuditLogType } from './services/auditService';
import { initializeRemoteConfig } from './services/remoteConfigService';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

interface AuthContextType {
  user: User | null;
  userData: any;
  isAdmin: boolean;
  isAnonymous: boolean;
  sovereignScore: number;
  setupComplete: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  emergencyBypass: () => Promise<void>;
  bindPasskey: () => Promise<void>;
  setSetupComplete: (complete: boolean) => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sovereignScore, setSovereignScore] = useState(100);
  const [setupComplete, setSetupCompleteState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Initialize Remote Config for the user
        initializeRemoteConfig();
        
        const userRef = doc(db, 'users', currentUser.uid);
        
        try {
          const userSnap = await getDoc(userRef);
          
          const isSuperAdmin = currentUser.email === 'idin@agape.nyc' || 
                               currentUser.email === 'agape@sovereign.nyc' || 
                               (currentUser.isAnonymous && currentUser.uid === 'emergency-bypass-admin-999');
          
          if (!userSnap.exists()) {
            const initialData = {
              uid: currentUser.uid,
              email: currentUser.email || 'unknown@example.com',
              displayName: currentUser.displayName || '',
              role: isSuperAdmin ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              sovereignScore: 100,
              setupComplete: false,
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
        setSetupCompleteState(false);
        setUserData(null);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleEmergencyBypass = async () => {
    try {
      await loginAnonymously();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const firebaseError = err as { code?: string, message: string };
        if (firebaseError.code === 'auth/firebase-app-check-token-is-invalid' || firebaseError.code === 'auth/firebase-app-check-token-is-invalid.' || firebaseError.message?.includes('app-check')) {
          console.log("Falling back to local mock bypass due to App Check enforcement");
          const mockUser = {
            uid: 'emergency-bypass-admin-999',
            email: 'idin@agape.nyc', // Treat as super admin
            displayName: 'Sovereign Admin (Bypass)',
            photoURL: '',
            emailVerified: true,
            isAnonymous: true,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => '',
            getIdTokenResult: async () => ({} as import('firebase/auth').IdTokenResult),
            reload: async () => {},
            toJSON: () => ({}),
          } as unknown as User;
          
          setUser(mockUser);
          setIsAdmin(true);
          setSovereignScore(100);
          setSetupCompleteState(true);
          setLoading(false);
        } else {
          console.error("Emergency bypass failed", err);
          throw err;
        }
      } else {
        console.error("Emergency bypass failed", err);
        throw err;
      }
    }
  };

  const handleBindPasskey = async () => {
    const currentUser = user;
    if (!currentUser) {
      toast.error('You must be logged in to bind a passkey.');
      return;
    }
    try {
      // 1. Get registration options from backend
      const optionsRes = await fetch('/passkey/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.error || 'Failed to obtain registration options');
      }
      const options = await optionsRes.json();

      // 2. Create credential on client
      const attestationResponse = await startRegistration({ optionsJSON: options as any });

      // 3. Send attestation to backend for verification
      const verifyRes = await fetch('/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...attestationResponse, email: currentUser.email })
      });
      const verifyResult = await verifyRes.json();
      if (verifyResult.success) {
        toast.success('Universal Passkey bound to this device successfully.');
        logEvent(AuditLogType.SECURITY_EVENT, 'Passkey bound to device', currentUser.uid, currentUser.email || undefined);
      } else {
        throw new Error(verifyResult.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('WebAuthn registration error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Passkey registration cancelled by user.');
      } else {
        toast.error(`WebAuthn Error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleLoginWithPasskey = async (email: string) => {
    // Email is optional; we rely on Cloudflare Access JWT for UID.
    try {
      // 1. Get authentication options from backend
      const optionsRes = await fetch('/passkey/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.error || 'Failed to obtain authentication options');
      }
      const authOptions = await optionsRes.json();

      // 2. Perform authentication on client
      const assertionResponse = await startAuthentication({ optionsJSON: authOptions as any });

      // 3. Verify with backend and obtain custom token
      const verifyRes = await fetch('/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assertionResponse, email })
      });
      const verifyResult = await verifyRes.json();
      const { verified, customToken, error } = verifyResult;

      if (verified && customToken) {
        await signInWithCustomToken(auth, customToken);
        toast.success('Authenticated successfully with Passkey.');
      } else {
        throw new Error(error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('WebAuthn login error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Passkey login cancelled.');
      } else {
        toast.error(`Passkey Error: ${error.message || 'Unknown error'}`);
      }
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      isAdmin, 
      isAnonymous: user?.isAnonymous || false,
      sovereignScore, 
      setupComplete,
      loading, 
      login: handleLogin, 
      loginWithPasskey: handleLoginWithPasskey,
      logout: handleLogout, 
      emergencyBypass: handleEmergencyBypass,
      bindPasskey: handleBindPasskey,
      setSetupComplete: handleSetSetupComplete,
      updateProfile: handleUpdateProfile
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
