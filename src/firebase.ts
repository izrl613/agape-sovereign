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
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
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
export const functions = getFunctions(app);

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export const loginWithGoogle = async () => {
  await setPersistence(auth, browserLocalPersistence);
  const provider = googleProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
};

export const completeGoogleRedirect = () => getRedirectResult(auth);

export const loginAnonymously = async () => {
  await setPersistence(auth, browserLocalPersistence);
  try {
    const result = await firebaseSignInAnonymously(auth);
    return result.user;
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
    if (
      code !== 'auth/operation-not-allowed' &&
      code !== 'auth/admin-restricted-operation' &&
      code !== 'auth/unauthorized-domain' &&
      code !== 'auth/internal-error'
    ) {
      throw error;
    }
    const res = await fetch('/api/auth/anon-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.token) {
      throw new Error(body.error || `Anonymous session failed (${res.status}).`);
    }
    const cred = await signInWithCustomToken(auth, body.token);
    return cred.user;
  }
};

export const logout = async () => {
  await signOut(auth);
};
