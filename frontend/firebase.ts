/**
 * Firebase client — Agape Sovereign (project: agape-sovereign).
 *
 * Real authentication only. No fallbacks, no invented users:
 *  - Method 1: Passkey / WebAuthn via Cloud Functions (/api/auth/*)
 *  - Method 2: Sign in with Google (federated) — dual protection and
 *    grants the drive.file scope used to save the 26-month Identity
 *    Audit PDF into the user's own Google Drive.
 *  - Guest: real Firebase Anonymous auth (limited: no Drive save).
 *
 * The web API key below is a public client identifier (it also lives in
 * firebase-applet-config.json); access is governed by Firestore rules
 * and Google provider policy, not by hiding this value.
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g',
  authDomain: 'sovereign.nyc',
  projectId: 'agape-sovereign',
  storageBucket: 'agape-sovereign.firebasestorage.app',
  messagingSenderId: '956088455461',
  appId: '1:956088455461:web:5d83545efc8961e4904acc',
  measurementId: 'G-6YG9BGTWDD',
};

export const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'agape-sovereign');

/** Thrown when the user closes a Google popup before completing it. */
export const GOOGLE_CANCELLED = 'GOOGLE_SIGNIN_CANCELLED';

function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // drive.file: least-privilege scope — the app can only see/manage
  // files it created (the audit PDF), never the user's whole Drive.
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export interface GoogleSignInResult {
  user: User;
  accessToken: string | null;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    const credential = await signInWithPopup(auth, googleProvider());
    const oauth = GoogleAuthProvider.credentialFromResult(credential);
    return { user: credential.user, accessToken: oauth?.accessToken ?? null };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error(GOOGLE_CANCELLED);
    }
    throw err;
  }
}

/** Link Google onto an existing anonymous session (upgrade, keeps data). */
export async function linkGoogleToCurrentUser(): Promise<GoogleSignInResult> {
  if (!auth.currentUser) return signInWithGoogle();
  try {
    const credential = await linkWithPopup(auth.currentUser, googleProvider());
    const oauth = GoogleAuthProvider.credentialFromResult(credential);
    return { user: credential.user, accessToken: oauth?.accessToken ?? null };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/credential-already-in-use') {
      // Google account already has its own Agape account — sign into it.
      return signInWithGoogle();
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error(GOOGLE_CANCELLED);
    }
    throw err;
  }
}

export async function signInGuest(): Promise<User> {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export { onAuthStateChanged, fbSignOut };
export type { User };
