/**
 * ============================================================
 * ARCHITECT AI — WebAuthn Client-Side Utilities
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Browser-only WebAuthn helpers.
 * All server-side logic (challenge generation, verification, credential
 * storage) lives exclusively in Cloud Functions (functions/src/architect-ai.ts).
 *
 * The actual registration / authentication flows use @simplewebauthn/browser
 * via AuthContext.tsx → startRegistration() / startAuthentication().
 */

// ─── WebAuthn Configuration ─────────────────────────────────
export const WEBAUTHN_CONFIG = {
  rpID: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  rpName: 'Agape Sovereign Enclave',
  origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
};

// ─── Passkey Credential shape (client mirror of Firestore doc) ─
export interface PasskeyCredential {
  id: string;
  publicKey: string;      // base64url-encoded, stored in Firestore
  counter: number;
  transports?: string[];
  createdAt: number;
  lastUsedAt: number;
}

// ─── Browser capability checks ───────────────────────────────

/**
 * Returns true when the browser exposes the WebAuthn APIs needed
 * for passkey registration and authentication.
 */
export const isWebAuthnSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
};

/**
 * Returns true when the device has a built-in (platform) authenticator
 * such as Touch ID, Face ID, or Windows Hello.
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// ─── Encoding helpers ────────────────────────────────────────

/** Convert an ArrayBuffer to a URL-safe base64 string. */
export function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Convert a URL-safe base64 string back to an ArrayBuffer. */
export function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
