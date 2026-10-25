import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithCustomToken,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/** Public web client config — project agape-sovereign, custom auth domain sovereign.nyc */
export const firebaseConfig = {
  apiKey: 'AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g',
  authDomain: 'sovereign.nyc',
  databaseURL: 'https://agape-sovereign-default-rtdb.firebaseio.com',
  projectId: 'agape-sovereign',
  storageBucket: 'agape-sovereign.firebasestorage.app',
  messagingSenderId: '956088455461',
  appId: '1:956088455461:web:5d83545efc8961e4904acc',
  measurementId: 'G-6YG9BGTWDD',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'agape-sovereign');

const googleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

async function persistUserDoc(user: User, authType: 'google' | 'passkey' | 'anonymous') {
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email || (authType === 'anonymous' ? 'guest@sovereign.nyc' : ''),
        displayName: user.displayName || (authType === 'anonymous' ? 'Guest Operator' : ''),
        authType,
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[auth] user doc write skipped:', err);
  }
}

export async function loginWithGoogle(preferRedirect = false): Promise<User | null> {
  await setPersistence(auth, browserLocalPersistence);
  const provider = googleProvider();
  if (preferRedirect) {
    await signInWithRedirect(auth, provider);
    return null;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    void persistUserDoc(result.user, 'google');
    return result.user;
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function completeGoogleRedirect(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  if (result?.user) {
    void persistUserDoc(result.user, result.user.isAnonymous ? 'anonymous' : 'google');
    return result.user;
  }
  return null;
}

export async function loginAnonymously(): Promise<User> {
  await setPersistence(auth, browserLocalPersistence);
  const result = await firebaseSignInAnonymously(auth);
  sessionStorage.setItem('sovereign_anon_started', String(Date.now()));
  void persistUserDoc(result.user, 'anonymous');
  return result.user;
}

export async function loginWithPasskey(email: string): Promise<User> {
  const { startAuthentication } = await import('@simplewebauthn/browser');
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Enter a valid email to locate your passkey.');
  }
  if (typeof window !== 'undefined' && !window.PublicKeyCredential) {
    throw new Error('This browser does not support passkeys (WebAuthn).');
  }

  sessionStorage.setItem('sovereign_passkey_auth', 'true');
  sessionStorage.setItem('sovereign_passkey_email', normalized);

  const optionsRes = await fetch('/api/auth/login-options', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalized }),
  });
  const optionsBody = await optionsRes.json().catch(() => ({}));
  if (!optionsRes.ok || !optionsBody.challenge) {
    sessionStorage.removeItem('sovereign_passkey_auth');
    throw new Error(optionsBody.error || `Unable to begin passkey sign-in (${optionsRes.status}).`);
  }

  const assertion = await startAuthentication({ optionsJSON: optionsBody });
  sessionStorage.setItem('sovereign_passkey_credential', String(assertion.id || assertion.rawId));

  const verifyRes = await fetch('/api/auth/verify-login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Passkey-Email': normalized,
    },
    body: JSON.stringify({ ...assertion, email: normalized }),
  });
  const verifyBody = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok || !verifyBody.verified || !verifyBody.token) {
    sessionStorage.removeItem('sovereign_passkey_auth');
    throw new Error(verifyBody.error || `Passkey verification failed (${verifyRes.status}).`);
  }

  const cred = await signInWithCustomToken(auth, verifyBody.token);
  void persistUserDoc(cred.user, 'passkey');
  return cred.user;
}

export async function logout(): Promise<void> {
  sessionStorage.removeItem('sovereign_anon_started');
  sessionStorage.removeItem('sovereign_passkey_auth');
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };
