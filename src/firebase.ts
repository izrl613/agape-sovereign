import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "sovereign-nyc.firebaseapp.com",
  projectId: "sovereign-nyc",
  storageBucket: "sovereign-nyc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const loginWithGoogle = async () => {
  console.log('Google login triggered');
  return { success: true };
};
