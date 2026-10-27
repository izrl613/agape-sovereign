/**
 * Firebase client — Agape Sovereign (project: agape-sovereign).
 *
 * Real authentication only. No fallbacks, no invented users:
 *  - Method 1: Passkey / WebAuthn via Cloud Functions (/api/auth/*)
 *  - Method 2: Sign in with Google (federated). drive.file is requested
 *    only when the operator saves the Identity Audit PDF.
 *  - Guest: Firebase Anonymous auth, or authApi custom token if the
 *    Anonymous provider is disabled.
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
  signInWithCustomToken,
  linkWithPopup,
  reauthenticateWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
  measurementId: appletConfig.measurementId,
};

export const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, appletConfig.firestoreDatabaseId);

/** Thrown when the user closes a Google popup before completing it. */
export const GOOGLE_CANCELLED = 'GOOGLE_SIGNIN_CANCELLED';

function googleProvider(withDrive = false): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // drive.file is requested only at PDF export, never at login.
  if (withDrive) {
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });
  } else {
    provider.setCustomParameters({ prompt: 'select_account' });
  }
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
  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (
      code !== 'auth/operation-not-allowed' &&
      code !== 'auth/admin-restricted-operation' &&
      code !== 'auth/unauthorized-domain' &&
      code !== 'auth/internal-error'
    ) {
      throw err;
    }
    const csrfRes = await fetch('/api/auth/csrf-token', { credentials: 'include' });
    if (!csrfRes.ok) throw err;
    const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
    const res = await fetch('/api/auth/anon-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: '{}',
    });
    if (!res.ok) throw err;
    const data = (await res.json()) as { token?: string };
    if (!data.token) throw err;
    const credential = await signInWithCustomToken(auth, data.token);
    return credential.user;
  }
}

/** Incremental drive.file consent — only when the operator saves the audit PDF. */
export async function requestDriveAccess(): Promise<string | null> {
  const provider = googleProvider(true);
  try {
    const current = auth.currentUser;
    const credential = current && !current.isAnonymous
      ? await reauthenticateWithPopup(current, provider).catch(() => signInWithPopup(auth, provider))
      : await signInWithPopup(auth, provider);
    const oauth = GoogleAuthProvider.credentialFromResult(credential);
    return oauth?.accessToken ?? null;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error(GOOGLE_CANCELLED);
    }
    throw err;
  }
}

export { onAuthStateChanged, fbSignOut, signInWithCustomToken };
export type { User };
