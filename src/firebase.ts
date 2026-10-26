import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseClientConfig from '../firebase-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseClientConfig.apiKey,
  authDomain: 'agape-sovereign.firebaseapp.com',
  projectId: firebaseClientConfig.projectId,
  storageBucket: firebaseClientConfig.storageBucket,
  messagingSenderId: firebaseClientConfig.messagingSenderId,
  appId: firebaseClientConfig.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'agape-sovereign');

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return { success: true, user: cred.user };
};

export const loginAnonymously = async () => {
  const cred = await signInAnonymously(auth);
  return cred.user;
};

export const logout = async () => {
  await signOut(auth);
};
