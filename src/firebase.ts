import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  initializeAuth,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { isPrivateBrowsing } from './utils/incognitoDetector';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { getRemoteConfig } from 'firebase/remote-config';
import { getDatabase } from 'firebase/database';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/**
 * Auth init with multi-persistence.
 * Prefer indexedDB (more reliable than localStorage under Safari ITP / storage partitioning).
 * authDomain remains sovereign.nyc (custom domain handler is live at /__/auth/handler).
 */
function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
    });
  } catch {
    // Already initialized (HMR / double import)
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)');
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const remoteConfig = getRemoteConfig(app);
export const database = getDatabase(app);

// Handle pending OAuth redirect result on app boot
getRedirectResult(auth).then((result) => {
  if (result?.user) {
    console.info('[FIREBASE] OAuth redirect completed for:', result.user.email);
  }
}).catch((error: unknown) => {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code: string }).code)
    : '';
  // Ignore benign "no redirect operation" style failures
  if (code && code !== 'auth/no-auth-event') {
    console.warn('[FIREBASE] OAuth redirect result error:', code);
  }
});

// Soft Firestore connectivity probe (non-fatal)
async function testConnection() {
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('[FIREBASE] Firestore offline during boot probe (often transient).');
      }
    }
  }, 3000);
}
testConnection();

export const analytics = typeof window !== 'undefined' && (firebaseConfig as { measurementId?: string }).measurementId
  ? isAnalyticsSupported().then(yes => yes ? getAnalytics(app) : null)
  : Promise.resolve(null);
export const messaging = typeof window !== 'undefined'
  ? isMessagingSupported().then(yes => yes ? getMessaging(app) : null)
  : Promise.resolve(null);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

function authErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code || '');
  }
  return '';
}

function humanizeAuthError(error: unknown): Error {
  const code = authErrorCode(error);
  const map: Record<string, string> = {
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Another sign-in is already in progress. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked by the browser. Allow pop-ups for this site, or we will try redirect sign-in.',
    'auth/unauthorized-domain': 'This domain is not authorized for Google Sign-In. Add it under Firebase Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'Google Sign-In is disabled in Firebase Authentication. Enable the Google provider in the console.',
    'auth/network-request-failed': 'Network error during sign-in. Check your connection and try again.',
    'auth/internal-error': 'Google Sign-In hit an internal error. Try a normal browser window (not an embedded preview) and disable strict third-party cookie blocking.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email using a different sign-in method.',
    'auth/invalid-api-key': 'Firebase API key is invalid. Check firebase-applet-config.json.',
    'auth/configuration-not-found': 'Auth configuration not found for this project. Verify Google provider setup in Firebase Console.',
  };
  if (code && map[code]) {
    const e = new Error(map[code]);
    (e as Error & { code?: string }).code = code;
    return e;
  }
  if (error instanceof Error) return error;
  return new Error('Google Sign-In failed. Please try again.');
}

/**
 * loginWithGoogle
 * 1. Set persistence for private vs normal browsing
 * 2. Prefer popup (works with custom authDomain sovereign.nyc)
 * 3. Fall back to redirect if popup is blocked
 */
export const loginWithGoogle = async () => {
  try {
    const isPrivate = await isPrivateBrowsing();
    if (isPrivate) {
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.info('[AUTH] Private mode — sessionStorage persistence.');
      } catch {
        await setPersistence(auth, inMemoryPersistence);
        console.warn('[AUTH] sessionStorage blocked — inMemoryPersistence.');
      }
    } else {
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch {
        await setPersistence(auth, browserLocalPersistence);
      }
    }

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const code = authErrorCode(error);

    if (code === 'auth/popup-blocked') {
      console.warn('[AUTH] Popup blocked — signInWithRedirect fallback.');
      try {
        await signInWithRedirect(auth, googleProvider);
        // Redirect navigates away; callers should treat null as "redirect started"
        return null;
      } catch (redirectError) {
        throw humanizeAuthError(redirectError);
      }
    }

    // User closed popup: surface a clean message
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw humanizeAuthError(error);
    }

    if (code === 'auth/unauthorized-domain') {
      console.error('[AUTH] Unauthorized domain. Current host:', window.location.hostname);
    }

    console.error('[AUTH] Google sign-in error:', code || error);
    throw humanizeAuthError(error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};
