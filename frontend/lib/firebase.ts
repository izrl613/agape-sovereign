import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g",
  authDomain: "agape-sovereign.firebaseapp.com",
  databaseURL: "https://agape-sovereign-default-rtdb.firebaseio.com",
  projectId: "agape-sovereign",
  storageBucket: "agape-sovereign.firebasestorage.app",
  messagingSenderId: "956088455461",
  appId: "1:956088455461:web:5d83545efc8961e4904acc",
  measurementId: "G-6YG9BGTWDD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider, signInWithPopup, signInWithCustomToken, signOut, onAuthStateChanged };
