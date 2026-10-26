/**
 * Agape Sovereign — Firebase Sovereign Identity, Dual Security Auth & Google Drive 26-Month PDF Sync
 *
 * Authentication Methods:
 *  1. Primary Sovereign Auth: Passkey / WebAuthn (`@simplewebauthn/browser` <-> `/api/auth`) + Sovereign Email Enclave
 *  2. Federated Second Login Method: Sign-In With Google (`GoogleAuthProvider`) for Dual Security Protection
 *     and direct user-authorized export of the 26-month Identity Audit PDF to the user's Federated Google Account Drive (`drive.file`).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import type { EncryptedSovereignEnvelope } from './services/sovereignCrypto';

export const ADMIN_ALLOWLIST = ['idin@agape.nyc', 'agape@sovereign.nyc'] as const;

const isCustomDomain =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'sovereign.nyc' || window.location.hostname === 'www.sovereign.nyc');

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g',
  authDomain: isCustomDomain ? 'sovereign.nyc' : 'agape-sovereign.firebaseapp.com',
  projectId: 'agape-sovereign',
  storageBucket: 'agape-sovereign.firebasestorage.app',
  messagingSenderId: '956088455461',
  appId: '1:956088455461:web:5d83545efc8961e4904acc',
};

export const FIRESTORE_DATABASE_ID = 'agape-sovereign';
export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const storage = getStorage(app);

// Ephemeral RAM-only OAuth token cache for Google Drive `drive.file` upload (never persisted to disk)
let googleAccessTokenMemory: { token: string; expiresAtMs: number; hasDriveScope: boolean } | null = null;

export interface GoogleDriveAuditExportResult {
  fileId: string;
  name: string;
  webViewLink: string;
  createdTime: string;
  firebaseStoragePath?: string;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_ALLOWLIST.some((allowed) => allowed === normalized);
}

export function hasGoogleProviderLinked(user: User | null): boolean {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'google.com');
}

export function hasActiveDriveToken(): boolean {
  return Boolean(
    googleAccessTokenMemory &&
      googleAccessTokenMemory.hasDriveScope &&
      googleAccessTokenMemory.expiresAtMs > Date.now()
  );
}

/**
 * Method 2: Sign-In With Google (or Link Federated Google Account onto an active Passkey/Email session)
 * Provides Dual Security Protection and optional `drive.file` scope for saving the 26-month Identity Audit PDF.
 */
export async function authenticateWithGoogleFederated(options?: {
  requestDriveScope?: boolean;
  linkToCurrentSession?: boolean;
}): Promise<{ user: User; driveAuthorized: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('email');
  provider.addScope('profile');
  if (options?.requestDriveScope) {
    provider.addScope(GOOGLE_DRIVE_FILE_SCOPE);
  }

  let result;
  if (options?.linkToCurrentSession && auth.currentUser && !hasGoogleProviderLinked(auth.currentUser)) {
    try {
      result = await linkWithPopup(auth.currentUser, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/credential-already-in-use' || code === 'auth/provider-already-linked') {
        result = await signInWithPopup(auth, provider);
      } else {
        throw err;
      }
    }
  } else {
    result = await signInWithPopup(auth, provider);
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    googleAccessTokenMemory = {
      token: credential.accessToken,
      expiresAtMs: Date.now() + 50 * 60 * 1000,
      hasDriveScope: Boolean(options?.requestDriveScope),
    };
  }

  try {
    await setDoc(
      doc(db, 'users', result.user.uid),
      {
        email: (result.user.email || '').toLowerCase(),
        googleFederated: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-fatal if Firestore rules restrict metadata write prior to custom claims
  }

  return {
    user: result.user,
    driveAuthorized: Boolean(credential?.accessToken && options?.requestDriveScope),
  };
}

/**
 * Method 1A: Primary Hardware Passkey / WebAuthn Authentication (`/api/auth`)
 */
export async function authenticateWithPasskey(email?: string): Promise<User> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('WebAuthn Passkeys are not supported in this browser environment.');
  }

  const trimmedEmail = email?.trim().toLowerCase();
  const optionsRes = await fetch('/api/auth/login-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(trimmedEmail ? { email: trimmedEmail } : { reauth: true }),
  });

  if (!optionsRes.ok) {
    let errText = 'Passkey challenge request failed.';
    try {
      const errJson = (await optionsRes.json()) as { error?: string };
      if (errJson.error) errText = errJson.error;
    } catch {
      // keep fallback message
    }
    throw new Error(errText);
  }

  const options = await optionsRes.json();
  const assertion = await startAuthentication({ optionsJSON: options });

  const verifyRes = await fetch('/api/auth/verify-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(trimmedEmail ? { 'x-passkey-email': trimmedEmail } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ ...assertion, ...(trimmedEmail ? { email: trimmedEmail } : {}) }),
  });

  const verifyJson = (await verifyRes.json()) as {
    verified?: boolean;
    token?: string;
    error?: string;
  };

  if (!verifyRes.ok || !verifyJson.verified || !verifyJson.token) {
    throw new Error(verifyJson.error || 'Hardware Passkey verification failed.');
  }

  const cred = await signInWithCustomToken(auth, verifyJson.token);
  return cred.user;
}

/**
 * Binds a FIDO2 / WebAuthn Hardware Passkey to the currently signed-in account for Dual Security Protection.
 */
export async function registerHardwarePasskeyForCurrentUser(): Promise<{ credentialId: string }> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Sign in first (via Sovereign Email or Google) before binding a Hardware Passkey.');
  }
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('WebAuthn hardware enclave is not available on this device/browser.');
  }

  const idToken = await user.getIdToken();
  const optionsRes = await fetch('/api/auth/register-options', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ email: user.email.toLowerCase() }),
  });

  if (!optionsRes.ok) {
    let errText = 'Unable to initialize Passkey registration ceremony.';
    try {
      const errJson = (await optionsRes.json()) as { error?: string };
      if (errJson.error) errText = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errText);
  }

  const options = await optionsRes.json();
  const attestation = await startRegistration({ optionsJSON: options });

  const verifyRes = await fetch('/api/auth/verify-registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      ...attestation,
      email: user.email.toLowerCase(),
      userId: user.uid,
    }),
  });

  const verifyJson = (await verifyRes.json()) as {
    verified?: boolean;
    credentialId?: string;
    error?: string;
  };

  if (!verifyRes.ok || !verifyJson.verified || !verifyJson.credentialId) {
    throw new Error(verifyJson.error || 'Passkey attestation verification failed.');
  }

  return { credentialId: verifyJson.credentialId };
}

/**
 * Method 1B: Sovereign Email/Password Enclave Authentication (pairs with Hardware Passkey + Google Federation)
 */
export async function authenticateWithSovereignEmail(
  email: string,
  password: string,
  mode: 'signin' | 'enroll'
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cred =
    mode === 'enroll'
      ? await createUserWithEmailAndPassword(auth, cleanEmail, password)
      : await signInWithEmailAndPassword(auth, cleanEmail, password);

  try {
    await setDoc(
      doc(db, 'users', cred.user.uid),
      {
        email: cleanEmail,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // non-fatal
  }
  return cred.user;
}

export async function checkUserHasBoundPasskey(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return Boolean(snap.exists() && snap.data()?.hasPasskey);
  } catch {
    return false;
  }
}

/**
 * Persists a zero-knowledge encrypted audit commitment seal (never plaintext!) to Firestore (`sovereign_audits`).
 */
export async function syncZeroKnowledgeAuditSeal(
  uid: string,
  sha256Id: string,
  encryptedEnvelope: EncryptedSovereignEnvelope,
  retentionExpiresIso: string
): Promise<void> {
  await setDoc(
    doc(db, 'sovereign_audits', `${uid}_${encryptedEnvelope.moduleId}`),
    {
      uid,
      moduleId: encryptedEnvelope.moduleId,
      sha256Id,
      payloadCommitmentSha256: encryptedEnvelope.payloadCommitmentSha256,
      ivBase64: encryptedEnvelope.ivBase64,
      ciphertextBase64: encryptedEnvelope.ciphertextBase64,
      algorithm: encryptedEnvelope.algorithm,
      sealedAtIso: encryptedEnvelope.sealedAtIso,
      expiresAtIso: retentionExpiresIso,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Uploads the 26-month Identity Audit PDF directly to the user's Federated Google Account (Google Drive `drive.file` scope)
 * AND mirrors the encrypted-sealed PDF into the user's sovereign Firebase Storage vault (`diff_reports/pdfs/{uid}/...`).
 */
export async function save26MonthAuditPdfToFederatedGoogleAccount(
  pdfBlob: Blob,
  fileName: string,
  sha256Seal: string,
  retentionUntilIso: string
): Promise<GoogleDriveAuditExportResult> {
  if (!auth.currentUser) {
    throw new Error('Sign in with your Federated Google Account first to save your 26-month Identity Audit PDF.');
  }

  // Ensure an active OAuth 2.0 access token with `https://www.googleapis.com/auth/drive.file`
  if (!hasActiveDriveToken()) {
    await authenticateWithGoogleFederated({
      requestDriveScope: true,
      linkToCurrentSession: true,
    });
  }

  if (!googleAccessTokenMemory?.token) {
    throw new Error('Google Drive authorization was not granted. Please approve the Google Drive file permission.');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    description: `Agape Sovereign 26-Month Zero-Knowledge Identity Audit | SHA256 Seal: ${sha256Seal} | Retention Until: ${retentionUntilIso}`,
    appProperties: {
      sovereignAuditSealSha256: sha256Seal,
      retentionMonths: '26',
      retentionUntilIso,
    },
  };

  const boundary = `agape_sovereign_boundary_${crypto.randomUUID().replace(/-/g, '')}`;
  const metaPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/pdf\r\n\r\n`;
  const closingPart = `\r\n--${boundary}--`;

  const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
  const enc = new TextEncoder();
  const headBytes = enc.encode(metaPart);
  const tailBytes = enc.encode(closingPart);

  const multipartBody = new Uint8Array(headBytes.length + pdfBytes.length + tailBytes.length);
  multipartBody.set(headBytes, 0);
  multipartBody.set(pdfBytes, headBytes.length);
  multipartBody.set(tailBytes, headBytes.length + pdfBytes.length);

  const driveRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleAccessTokenMemory.token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!driveRes.ok) {
    if (driveRes.status === 401 || driveRes.status === 403) {
      googleAccessTokenMemory = null;
    }
    const errDetail = await driveRes.text().catch(() => '');
    throw new Error(
      `Google Drive API rejected PDF upload (HTTP ${driveRes.status})${errDetail ? `: ${errDetail.slice(0, 140)}` : ''}`
    );
  }

  const driveJson = (await driveRes.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
    createdTime?: string;
  };

  let firebaseStoragePath: string | undefined;
  try {
    firebaseStoragePath = `diff_reports/pdfs/${auth.currentUser.uid}/${fileName}`;
    const pdfStorageRef = storageRef(storage, firebaseStoragePath);
    await uploadBytes(pdfStorageRef, pdfBlob, {
      contentType: 'application/pdf',
      customMetadata: {
        sha256Seal,
        retentionMonths: '26',
        retentionUntilIso,
        googleDriveFileId: driveJson.id,
      },
    });
  } catch {
    // Non-fatal if Storage rules or bucket policy defer exclusively to Google Drive
    firebaseStoragePath = undefined;
  }

  return {
    fileId: driveJson.id,
    name: driveJson.name || fileName,
    webViewLink: driveJson.webViewLink || `https://drive.google.com/file/d/${driveJson.id}/view`,
    createdTime: driveJson.createdTime || new Date().toISOString(),
    firebaseStoragePath,
  };
}

export async function signOutSovereign(): Promise<void> {
  googleAccessTokenMemory = null;
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User };
