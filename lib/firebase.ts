// ============================================================
// ARCHITECT AI — FIREBASE INITIALIZATION
// Agape Sovereign Enclave 2026
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration - Agape Sovereign Enclave
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "agape-sovereign.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://agape-sovereign-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "agape-sovereign",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "agape-sovereign.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "956088455461",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:956088455461:web:5d83545efc8961e4904acc",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6YG9BGTWDD",
};

// Initialize Firebase (singleton pattern for Next.js)
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize analytics (only in browser)
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

// ─── LOCAL EMULATOR SETUP (Development) ───────────────────
// Uncomment to use local Firebase emulator for development
/*
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
  } catch (e) {
    // Emulator already connected
  }
}
*/

// ─── FIRESTORE USER DATA SCHEMA ───────────────────────────
// Used for type safety and documentation
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  provider: "google" | "apple";
  createdAt: Date;
  passKeyBound: boolean;
  passKeyPublicKey?: string;
  monitoredEmails: string[];
  sovereignScore: number;
  lastDIFFScan: Date;
}

export interface DIFFScanResult {
  userId: string;
  timestamp: Date;
  scanId: string;
  vectorResults: Record<string, VectorResult>;
  sovereignScore: number;
  totalNuked: number;
  totalKnoxed: number;
  totalMonitored: number;
  sha256Hash: string; // Unique hash for audit trail
}

export interface VectorResult {
  vectorId: string; // V-01 through V-16
  vectorName: string;
  severity: number; // 0-100
  nukedCount: number;
  knoxedCount: number;
  monitoredCount: number;
  findings: Finding[];
  timestamp: Date;
}

export interface Finding {
  id: string;
  type: "NUKED" | "KNOXED" | "MONITORED";
  label: string;
  detail: string;
  source?: string;
  actionRequired: boolean;
  actionTaken?: string;
}

export interface DIFFReport {
  userId: string;
  reportId: string;
  createdAt: Date;
  scanResults: DIFFScanResult;
  sovereignScore: number;
  recommendations: string[];
  pdfStoragePath: string;
  sha256Digest: string;
  expiresAt: Date; // 2-year retention
}

export default app;
