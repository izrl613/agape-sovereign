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
  onAuthStateChanged,
  User
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
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)');
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const remoteConfig = getRemoteConfig(app);
export const database = getDatabase(app);

// Handle pending OAuth redirect result on app boot
getRedirectResult(auth).then((result) => {
  if (result) {
    console.log('[FIREBASE] OAuth redirect completed for:', result.user?.email);
  }
}).catch((error) => {
  console.warn('[FIREBASE] OAuth redirect result error:', error?.code || error?.message || error);
});

// Test Firestore connection on boot
async function testConnection() {
  // Wait a bit to allow auth to initialize
  setTimeout(async () => {
    try {
      // Only test if we have a potential user and a live Firestore connection
      // or if we just want to verify the config is valid.
      // We use getDocFromServer to force a network request.
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      // If it's a permission error, the config is actually fine, just the rules blocked it.
      // If it's "offline", it might be a real config issue OR just a transient network thing.
      if(error instanceof Error && error.message.includes('the client is offline')) {
        // Only log if it's consistently failing or if we're sure it's a config issue.
        // For now, let's just log it as a warning instead of a scary error if it's likely transient.
        console.warn("Firestore connection test: client is offline. This is expected if you are using Emergency Bypass or have no internet connection.");
      }
    }
  }, 3000);
}
testConnection();

// Initialize Analytics & Messaging conditionally
export const analytics = typeof window !== 'undefined' && (firebaseConfig as { measurementId?: string }).measurementId 
  ? isAnalyticsSupported().then(yes => yes ? getAnalytics(app) : null) 
  : Promise.resolve(null);
export const messaging = typeof window !== 'undefined' 
  ? isMessagingSupported().then(yes => yes ? getMessaging(app) : null) 
  : Promise.resolve(null);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * loginWithGoogle — Incognito-bypass auth
 * ─────────────────────────────────────────────────────────────────────────────
 * Strategy:
 *   1. Detect private browsing mode and set appropriate persistence.
 *   2. Always attempt signInWithPopup first — it doesn't require third-party
 *      cookies and works reliably in Chrome/Edge/Safari/Firefox incognito.
 *   3. If the popup is explicitly blocked by the browser (auth/popup-blocked),
 *      fall through to signInWithRedirect as a last resort.
 *   4. In private mode, use browserSessionPersistence so the session lives
 *      for the tab session only (no localStorage writes that may be blocked).
 */
export const loginWithGoogle = async () => {
  try {
    // ── Step 1: Configure persistence for the environment ──────────────────
    const isPrivate = await isPrivateBrowsing();
    if (isPrivate) {
      // Session-only persistence: survives page refresh but not tab close.
      // Avoids localStorage writes that Safari/Firefox block in private mode.
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.info('[AUTH] Private mode detected — using sessionStorage persistence.');
      } catch {
        // Absolute fallback: in-memory (won't survive reload but won't throw)
        await setPersistence(auth, inMemoryPersistence);
        console.warn('[AUTH] sessionStorage blocked — falling back to inMemoryPersistence.');
      }
    } else {
      // Normal mode: persist across browser restarts
      await setPersistence(auth, browserLocalPersistence);
    }

    // ── Step 2: Popup-first (works in incognito, no third-party cookie req) ─
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;

  } catch (error: unknown) {
    const code = (error instanceof Error && 'code' in error)
      ? (error as { code: string }).code
      : '';

    // ── Step 3: Popup was blocked by the browser — fall back to redirect ──
    if (code === 'auth/popup-blocked') {
      console.warn('[AUTH] Popup blocked — falling back to signInWithRedirect.');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error('[AUTH] Redirect fallback also failed:', redirectError);
        throw redirectError;
      }
    }

    // ── Step 4: User cancelled (popup closed) — let callers handle it ─────
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      const cancelled = new Error('Sign-in popup was closed. Please try again.');
      (cancelled as any).code = code;
      throw cancelled;
    }

    // ── Step 5: Domain not authorised ──────────────────────────────────────
    if (code === 'auth/unauthorized-domain') {
      console.error('[AUTH] Domain not authorized in Firebase Console. Add to Authentication > Authorized domains.');
    }

    if (code === 'auth/internal-error') {
      console.error('[AUTH] Internal error — may be caused by third-party cookie restrictions in an iframe.');
    }

    console.error('[AUTH] Google sign-in error:', error);
    throw error;
  }
};


export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
