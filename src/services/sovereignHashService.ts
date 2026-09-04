/**
 * SOVEREIGN HASH SERVICE
 * ============================================================
 * OPERATION FRAMEWORK — Phase 1: The Gatekeeper
 * Architecture: Identity Abstraction via SHA-256 Hashing
 *
 * Core design principle: The PWA Dashboard must NEVER rely on raw PII for
 * internal state management. All identity data is immediately hashed via
 * SHA-256 on the client side. The hash is the sole identifier passed forward.
 *
 * Zero-retention policy: raw credentials/PII are wiped from memory immediately
 * after hashing. No record of data scraping through any means.
 * ============================================================
 */

/**
 * Compute SHA-256 of a string using the native Web Crypto API.
 * Returns a lowercase hex digest (64 chars).
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Path A — Google Federated Identity
 * Hash the composite of uid + email + provider claims.
 * Raw PII never leaves this function scope.
 */
export async function hashGoogleIdentity(
  uid: string,
  email: string,
  providerId: string = 'google.com'
): Promise<string> {
  // Use all key identifier claims for maximal entropy
  const composite = `${providerId}::${uid}::${email}`;
  const hash = await sha256(composite);
  // Zero-retention: composite string GC'd after this scope
  return hash;
}

/**
 * Path B — Passkey / WebAuthn Anonymous Identity
 * Hash the session nonce or WebAuthn credential ID.
 * No correlation to external identity.
 */
export async function hashPasskeyIdentity(
  credentialId: string,
  sessionNonce: string
): Promise<string> {
  const composite = `passkey::${credentialId}::${sessionNonce}`;
  const hash = await sha256(composite);
  return hash;
}

/**
 * Generate a cryptographically secure session nonce.
 * Used as entropy input for anonymous/passkey path.
 */
export function generateSessionNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a string is a valid SHA-256 hex digest.
 * SHA-256 produces exactly 64 hex characters.
 */
export function isValidSHA256(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash);
}

/**
 * Format the hash for display — shows first 8 + ... + last 8 chars.
 * e.g. "3a7f1b2e...d9c04ab1"
 */
export function formatHashDisplay(hash: string): string {
  if (!isValidSHA256(hash)) return 'INVALID';
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}
