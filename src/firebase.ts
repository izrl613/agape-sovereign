import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
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
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase App Check uses the production reCAPTCHA Enterprise score key registered
// to this Firebase web app. This is a public site key (not a server secret).
const appCheckSiteKey = (import.meta as any).env?.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY ||
  '6Ld9cnAtAAAAAMkuGPJvIvp5S2cuWKlVzxxzyK4h';

if (typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.info('[FIREBASE] App Check initialized with reCAPTCHA Enterprise');
  } catch (error) {
    console.error('[FIREBASE] App Check initialization failed:', error);
  }
}

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
// drive.file is optional and only used after explicit Drive export consent in-app.
// Do not add broader Drive scopes here — they break OAuth consent for basic login.

/**
 * True when the app is embedded (AI Studio preview, iframe) where popups and
 * third-party cookie partitions commonly break Firebase Google Sign-In.
 */
function isEmbeddedBrowserContext(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.top !== window.self) return true;
    if (window.location.hostname.includes('aistudio.google.com')) return true;
    if (document.referrer.includes('aistudio.google.com')) return true;
  } catch {
    // Cross-origin frame access throws — treat as embedded.
    return true;
  }
  return false;
}

/**
 * Build Google OAuth custom parameters.
 * - prompt: 'select_account' for first-time users (no cached hint)
 * - prompt: 'none' is avoided — it silently fails when no session exists.
 * - login_hint: skip the account picker for returning users whose email is
 *   stored in localStorage from a prior successful sign-in.
 */
function buildGoogleProviderParams(): Record<string, string> {
  const params: Record<string, string> = { prompt: 'select_account' };
  try {
    const hint = localStorage.getItem('sovereign_login_hint');
    if (hint) {
      params.login_hint = hint;
      // When a hint is present the account chooser is redundant — suppress it
      // so returning users land directly in the consent/grant screen.
      delete params.prompt;
    }
  } catch {
    // localStorage unavailable (private browsing, storage partitioning)
  }
  return params;
}

googleProvider.setCustomParameters(buildGoogleProviderParams());

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
    // Refresh OAuth params each attempt (hint may have changed).
    googleProvider.setCustomParameters(buildGoogleProviderParams());

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

    // Embedded previews (AI Studio / iframes) cannot reliably complete popup OAuth
    // against authDomain sovereign.nyc. Prefer full-page redirect on top window.
    if (isEmbeddedBrowserContext()) {
      console.warn('[AUTH] Embedded context detected — using redirect Google Sign-In.');
      try {
        // Break out of iframe when possible so authDomain handler can complete.
        if (window.top && window.top !== window.self) {
          const topOrigin = (() => {
            try { return window.top!.location.origin; } catch { return null; }
          })();
          if (!topOrigin) {
            // Cross-origin embed: open the real app origin for OAuth.
            window.open('https://sovereign.nyc/login?intent=google', '_blank', 'noopener,noreferrer');
            throw new Error(
              'Google Sign-In cannot complete inside this preview. Open https://sovereign.nyc/login in a normal browser tab.'
            );
          }
        }
      } catch (embedErr) {
        if (embedErr instanceof Error && embedErr.message.includes('sovereign.nyc')) {
          throw embedErr;
        }
      }
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    const result = await signInWithPopup(auth, googleProvider);
    // Persist email as login_hint so the next sign-in can skip the account picker
    try {
      if (result.user.email) {
        localStorage.setItem('sovereign_login_hint', result.user.email);
        // Refresh custom params for any subsequent provider use in this session
        googleProvider.setCustomParameters({ login_hint: result.user.email });
      }
    } catch {
      // Non-fatal — localStorage may be blocked in private mode
    }
    return result.user;
  } catch (error: unknown) {
    const code = authErrorCode(error);

    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/internal-error' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      console.warn('[AUTH] Popup failed (' + code + ') — signInWithRedirect fallback.');
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
      const e = new Error(
        `This domain (${window.location.hostname}) is not authorized for Google Sign-In. ` +
        'Add it under Firebase Authentication → Settings → Authorized domains, or open https://sovereign.nyc/login.'
      );
      (e as Error & { code?: string }).code = code;
      throw e;
    }

    console.error('[AUTH] Google sign-in error:', code || error);
    throw humanizeAuthError(error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    // Clear the login_hint so a different account can be chosen next time
    try { localStorage.removeItem('sovereign_login_hint'); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('[AUTH] Anonymous sign-in error:', error);
    throw error;
  }
};
