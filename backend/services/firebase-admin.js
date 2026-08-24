/**
 * Firebase Admin SDK — Backend Initialization
 * Agape Sovereign Enclave 2026
 *
 * Centralized Admin SDK setup for the backend proxy server.
 * Supports two credential strategies:
 *   1. Explicit serviceAccountKey.json (if present at project root)
 *   2. Application Default Credentials (ADC) fallback
 *
 * Usage:
 *   import { admin, db, auth, storage } from './services/firebase-admin.js';
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database URL for RTDB access
const DATABASE_URL = 'https://agape-sovereign-default-rtdb.firebaseio.com';

// Firestore database ID (named database)
const FIRESTORE_DATABASE_ID = 'agape-sovereign';

/**
 * Initialize Firebase Admin SDK (idempotent — safe to import multiple times).
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    console.log('[Firebase Admin] Already initialized, reusing existing app.');
    return;
  }

  // Look for service account key at the project root (two levels up from services/)
  const serviceAccountPath = resolve(__dirname, '../../serviceAccountKey.json');

  if (existsSync(serviceAccountPath)) {
    console.log('[Firebase Admin] Found serviceAccountKey.json — initializing with explicit credentials.');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: DATABASE_URL,
    });
  } else {
    console.log('[Firebase Admin] No serviceAccountKey.json found — using Application Default Credentials.');
    admin.initializeApp({
      databaseURL: DATABASE_URL,
    });
  }

  console.log('[Firebase Admin] Initialized successfully.');
}

// Run initialization immediately on import
initializeFirebaseAdmin();

// ── Exports ──────────────────────────────────────────────────
// Firestore: use named database 'agape-sovereign' to match client config
const db = admin.firestore();
db.settings({ databaseId: FIRESTORE_DATABASE_ID });

const auth = admin.auth();
const storage = admin.storage();
const database = admin.database();

export { admin, db, auth, storage, database };
export default admin;
