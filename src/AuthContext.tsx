import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout, loginAnonymously } from './firebase';
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
import { generateSessionNonce, hashGoogleIdentity, isValidSHA256 } from './services/sovereignHashService';
import { calculateEnhancedSovereignScore, getScanFindings } from './services/scanService';
import { localVaultService } from './services/localVaultService';
import { driveExportService, isFederatedGoogleUser, DriveExportResult, RETENTION_MONTHS } from './services/driveExportService';

interface AuthContextType {
  user: User | null;
  userData: any;
  isAdmin: boolean;
  isAnonymous: boolean;
  sovereignScore: number;
  sovereignHash: string | null;
  authType: 'google' | 'passkey' | 'anonymous' | null;
  setupComplete: boolean;
  vaultReady: boolean;
  loading: boolean;
  /** Federated Google account linked to this session, when present. */
  googleLinked: boolean;
  /** Passkey bound to this account — the second factor of dual protection. */
  passkeyBound: boolean;
  login: () => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  bindPasskey: () => Promise<void>;
  setSetupComplete: (complete: boolean) => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  saveToVault: (pdfBlob: Blob, metadata: any) => Promise<string>;
  /** Save the 26-month Identity Audit PDF to the federated Google Account. */
  exportAuditToDrive: (args: {
    pdfBlob: Blob;
    fileName: string;
    sha256Digest: string;
    sovereignScore?: number;
  }) => Promise<DriveExportResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sovereignScore, setSovereignScore] = useState(0);
  // OPERATION FRAMEWORK: SHA-256 identity hash (the sole session identifier)
  const [sovereignHash, setSovereignHash] = useState<string | null>(null);
  const [authType, setAuthType] = useState<'google' | 'passkey' | 'anonymous' | null>(null);
  const [setupComplete, setSetupCompleteState] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [passkeyBound, setPasskeyBound] = useState(false);

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
            
            // Check for admin custom claim instead of hardcoded emails
            const tokenResult = await currentUser.getIdTokenResult();
            const isSuperAdmin = tokenResult.claims.admin === true;
            
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

            // DUAL SECURITY PROTECTION — a Google federated identity plus a
            // device-bound passkey. Both facts are read from the credential,
            // never assumed.
            const providers = currentUser.providerData.map(p => p.providerId);
            setGoogleLinked(providers.includes('google.com'));
            setPasskeyBound(providers.includes('webauthn') || providers.includes('password') === false && sessionStorage.getItem('sovereign_passkey_credential') !== null);

            // Initialize local vault for passkey users
            if (resolvedAuthType === 'passkey') {
              try {
                await localVaultService.init();
                setVaultReady(true);
              } catch (vaultErr) {
                console.warn('[AUTH] Local vault initialization failed:', vaultErr);
                setVaultReady(false);
              }
            }

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
                // Never display a placeholder identity hash — derive a real
                // SHA-256 from the federated identity claims instead.
                const derived = await hashGoogleIdentity(
                  currentUser.uid,
                  currentUser.email || currentUser.uid,
                  resolvedAuthType,
                );
                setSovereignHash(derived);
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

            unsubscribeUserDoc = onSnapshot(userRef, async (userDocSnapshot) => {
              if (userDocSnapshot.exists()) {
                const data = userDocSnapshot.data();
                setUserData(data);
                setIsAdmin(data.role === 'admin' || isSuperAdmin);
                setSetupCompleteState(data.setupComplete || false);
                if (data.authType) setAuthType(data.authType);
                
                // Enhanced sovereign score calculation based on actual scan findings
                try {
                  const findings = await getScanFindings(currentUser.uid);
                  const enhancedScore = calculateEnhancedSovereignScore(findings);
                  setSovereignScore(enhancedScore);
                  
                  // Update user document with enhanced score if different
                  if (data.sovereignScore !== enhancedScore) {
                    await updateDoc(userRef, { 
                      sovereignScore: enhancedScore,
                      lastScoreUpdate: serverTimestamp()
                    });
                  }
                } catch (scoreError) {
                  console.warn('Failed to calculate enhanced sovereign score:', scoreError);
                  setSovereignScore(data.sovereignScore || 100);
                }
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
      } else if (error?.message?.includes('User verification required') || error?.message?.includes('could not be verified')) {
        toast.error('Biometric verification failed. Ensure your device fingerprint/Face ID is working.');
      } else {
        toast.error(`WebAuthn Error: ${error?.message || 'Unknown error'}`);
      }
      throw error;
    }
  };

  const handleLoginWithPasskey = async (email: string) => {
    const normalized = (email || '').trim().toLowerCase();
    
    // Allow empty email for resident key mode (direct passkey login)
    const isResidentKeyMode = !normalized;

    if (!isResidentKeyMode && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast.error('Please enter a valid email to login with passkey.');
      throw new Error('Please enter a valid email to login with passkey.');
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

      const requestBody = isResidentKeyMode 
        ? { reauth: true }
        : { email: normalized };

      let verified = false;
      let token: string | null = null;

      try {
        const optionsRes = await fetch('/api/auth/login-options', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const optionsBody = await optionsRes.json().catch(() => ({}));
        if (optionsRes.ok && optionsBody.challenge) {
          const assertionResponse = await startAuthentication({ optionsJSON: optionsBody });
          const credentialId = assertionResponse.id || assertionResponse.rawId;
          sessionStorage.setItem('sovereign_passkey_credential', String(credentialId));

          const verifyRes = await fetch('/api/auth/verify-login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assertionResponse),
          });

          const verifyBody = await verifyRes.json().catch(() => ({}));
          if (verifyRes.ok && verifyBody.verified && verifyBody.token) {
            verified = true;
            token = verifyBody.token;
          }
        }
      } catch (backendErr) {
        console.warn('[AUTH] WebAuthn verification endpoint unavailable:', backendErr);
      }

      if (verified && token) {
        await signInWithCustomToken(auth, token);
        toast.success('Authenticated successfully with Passkey.');
      } else {
        // A passkey assertion that the server could not verify is NOT a
        // passkey login. We refuse rather than presenting an unverified
        // session as authenticated — no simulated authentication.
        sessionStorage.removeItem('sovereign_passkey_auth');
        sessionStorage.removeItem('sovereign_passkey_nonce');
        sessionStorage.removeItem('sovereign_passkey_credential');
        sessionStorage.removeItem('sovereign_passkey_email');
        const err = new Error(
          'Passkey verification service is unavailable. Your assertion could not be verified, so no session was created. Try again, or use Sign in with Google.',
        );
        toast.error('PASSKEY NOT VERIFIED', { description: err.message, duration: 8000 });
        throw err;
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
      } else if (error?.message?.includes('User verification required') || error?.message?.includes('could not be verified')) {
        toast.error('Biometric verification failed. Ensure your device fingerprint/Face ID is working.');
      } else if (error?.message?.includes('No passkey') || error?.message?.includes('No account found')) {
        toast.error(error.message);
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

  const handleSaveToVault = async (pdfBlob: Blob, metadata: any): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to save to vault');
    }
    
    try {
      const reportId = await localVaultService.saveReport(user.uid, pdfBlob, metadata);
      toast.success('Report saved to local encrypted vault');
      logEvent(AuditLogType.SECURITY_EVENT, 'Report saved to local vault', user.uid, user.email || undefined);
      return reportId;
    } catch (error) {
      console.error('Failed to save to vault:', error);
      toast.error('Failed to save report to vault');
      throw error;
    }
  };

  const handleExportAuditToDrive = async (args: {
    pdfBlob: Blob;
    fileName: string;
    sha256Digest: string;
    sovereignScore?: number;
  }): Promise<DriveExportResult> => {
    if (!user) {
      return { success: false, error: 'Sign in first — the audit PDF is saved to your own account.' };
    }
    if (!isFederatedGoogleUser(user)) {
      return {
        success: false,
        error: 'This session is not federated with Google. Use "Sign in with Google" to save the Identity Audit PDF to your Google Account.',
      };
    }
    if (!sovereignHash || !isValidSHA256(sovereignHash)) {
      return { success: false, error: 'A valid SHA-256 session identity is required before an audit PDF can be exported.' };
    }

    try {
      const result = await driveExportService.exportAuditPdf(user, {
        pdfBlob: args.pdfBlob,
        fileName: args.fileName,
        sha256Digest: args.sha256Digest,
        identitySha256: sovereignHash,
        sovereignScore: args.sovereignScore,
      });
      if (result.success) {
        toast.success('AUDIT PDF SAVED TO YOUR GOOGLE ACCOUNT', {
          description: `${RETENTION_MONTHS}-month retention · SHA-256 ${args.sha256Digest.slice(0, 16)}…`,
          duration: 6000,
        });
        logEvent(AuditLogType.SECURITY_EVENT, `Identity audit PDF exported to federated Google Drive (${args.sha256Digest.slice(0, 16)}…)`, user.uid, user.email || undefined);
      } else {
        toast.error(result.error || 'Drive export failed');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to export to Drive: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
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
      vaultReady,
      loading,
      googleLinked,
      passkeyBound,
      login: handleLogin,
      loginWithPasskey: handleLoginWithPasskey,
      logout: handleLogout,
      bindPasskey: handleBindPasskey,
      setSetupComplete: handleSetSetupComplete,
      updateProfile: handleUpdateProfile,
      saveToVault: handleSaveToVault,
      exportAuditToDrive: handleExportAuditToDrive,
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
