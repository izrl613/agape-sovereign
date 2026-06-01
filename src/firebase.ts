import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup, 
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User
} from 'firebase/auth';
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

// Test Firestore connection on boot
async function testConnection() {
  // Wait a bit to allow auth to initialize
  setTimeout(async () => {
    try {
      // Only test if we're not in a mock/bypass state and have a potential user
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

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
appleProvider.setCustomParameters({
  usePopup: 'true'
});

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error("Error signing in with Google:", error);
    
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/unauthorized-domain') {
        console.error("ACTION REQUIRED: This domain is not authorized in Firebase Console.");
        console.error("Please add these domains to Authentication > Settings > Authorized domains:");
        console.error("- ais-dev-ilvqfi4xw3xzhljrld2glb-330671455515.us-east1.run.app");
        console.error("- ais-pre-ilvqfi4xw3xzhljrld2glb-330671455515.us-east1.run.app");
      } else if (firebaseError.code === 'auth/internal-error') {
        console.error("This may be caused by third-party cookies being blocked in the iframe. Try opening the app in a new tab.");
      }
    }
    
    throw error;
  }
};

export const loginWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error("Error signing in with Apple:", error);
    throw error;
  }
};

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const firebaseError = error as { code?: string, message: string };
      if (firebaseError.code === 'auth/firebase-app-check-token-is-invalid' || firebaseError.code === 'auth/firebase-app-check-token-is-invalid.' || firebaseError.message?.includes('app-check')) {
        // Suppress console error for App Check, as it is handled gracefully by the bypass
      } else {
        console.error("Error signing in anonymously:", error);
      }
    } else {
      console.error("Error signing in anonymously:", error);
    }
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
