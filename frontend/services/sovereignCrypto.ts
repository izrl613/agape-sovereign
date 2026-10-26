/**
 * Agape Sovereign — Client-Side Zero-Knowledge Cryptographic Engine
 *
 * Uses native W3C Web Crypto API (`crypto.subtle`) exclusively:
 * - Session SHA256 ID derivation (256-bit cryptographic identity commitment)
 * - PBKDF2-SHA256 (100,000 iterations) -> non-extractable AES-256-GCM keys
 * - Authenticated AEAD envelopes bound to (sha256Id + moduleId)
 * - SHA-1 5-char k-anonymity range prefix helper (full hash never transmitted)
 */

export const RETENTION_MONTHS = 26;
const PBKDF2_ITERATIONS = 100_000;
const DEVICE_SALT_STORAGE_KEY = 'agape_sovereign_enclave_salt_v2';

export interface EncryptedSovereignEnvelope {
  version: 2;
  algorithm: 'AES-256-GCM+PBKDF2-SHA256';
  sha256Id: string;
  moduleId: string;
  ivBase64: string;
  ciphertextBase64: string;
  payloadCommitmentSha256: string;
  sealedAtIso: string;
  expiresAtIso: string;
}

function bytesToHex(bytes: Uint8Array, upper = false): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return upper ? out.toUpperCase() : out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(input: string | ArrayBuffer | Uint8Array): ArrayBuffer {
  if (typeof input === 'string') {
    const encoded = new TextEncoder().encode(input);
    return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
  }
  if (input instanceof Uint8Array) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  }
  return input;
}

export async function sha256Hex(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(input));
  return bytesToHex(new Uint8Array(digest), false);
}

/**
 * Computes uppercase SHA-1 solely for local HIBP Pwned Passwords k-anonymity range lookup.
 * Only the first 5 characters may ever leave the client.
 */
export async function sha1KAnonymityParts(secret: string): Promise<{ prefix5: string; suffix35: string }> {
  const digest = await crypto.subtle.digest('SHA-1', toArrayBuffer(secret));
  const full = bytesToHex(new Uint8Array(digest), true);
  return {
    prefix5: full.slice(0, 5),
    suffix35: full.slice(5),
  };
}

export function getOrCreateDeviceEnclaveSalt(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_SALT_STORAGE_KEY);
    if (existing && existing.length >= 32) {
      return existing;
    }
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hexSalt = bytesToHex(randomBytes, false);
    window.localStorage.setItem(DEVICE_SALT_STORAGE_KEY, hexSalt);
    return hexSalt;
  } catch {
    const fallbackBytes = new Uint8Array(32);
    crypto.getRandomValues(fallbackBytes);
    return bytesToHex(fallbackBytes, false);
  }
}

export function rotateDeviceEnclaveSalt(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hexSalt = bytesToHex(randomBytes, false);
  try {
    window.localStorage.setItem(DEVICE_SALT_STORAGE_KEY, hexSalt);
  } catch {
    // Ephemeral enclave mode if storage is restricted
  }
  return hexSalt;
}

/**
 * Derives the active zero-knowledge SHA256 ID binding the user's session and local device enclave.
 */
export async function deriveSessionSha256Id(identityAnchor: string): Promise<string> {
  const salt = getOrCreateDeviceEnclaveSalt();
  const material = `agape-sovereign:zk-sha256-id:v2:${identityAnchor}:${salt}`;
  return sha256Hex(material);
}

export function formatSha256Display(sha256Id: string, compact = false): string {
  if (!sha256Id) return 'INITIALIZING-ENCLAVE';
  const clean = sha256Id.toLowerCase();
  if (compact) {
    return `SHA256:${clean.slice(0, 10)}…${clean.slice(-8)}`;
  }
  return `SHA256:${clean}`;
}

export function compute26MonthExpiryIso(fromDate = new Date()): string {
  const target = new Date(fromDate.getTime());
  target.setMonth(target.getMonth() + RETENTION_MONTHS);
  return target.toISOString();
}

async function deriveAesGcmKey(sha256Id: string, moduleId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(sha256Id),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = encoder.encode(`agape-sovereign:aead:v2:${moduleId}`);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary user input or module telemetry inside browser RAM using AES-256-GCM
 * keyed and AEAD-authenticated with the session SHA256 ID.
 */
export async function encryptWithSha256Id<T>(
  payload: T,
  sha256Id: string,
  moduleId: string
): Promise<EncryptedSovereignEnvelope> {
  if (!sha256Id || sha256Id.length !== 64) {
    throw new Error('Cannot seal module payload without an active 256-bit SHA256 ID.');
  }

  const serialized = JSON.stringify(payload);
  const commitment = await sha256Hex(`${sha256Id}:${moduleId}:${serialized}`);
  const key = await deriveAesGcmKey(sha256Id, moduleId);

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const aad = new TextEncoder().encode(`${sha256Id}:${moduleId}`);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
      additionalData: aad.buffer.slice(aad.byteOffset, aad.byteOffset + aad.byteLength) as ArrayBuffer,
    },
    key,
    toArrayBuffer(serialized)
  );

  const now = new Date();
  return {
    version: 2,
    algorithm: 'AES-256-GCM+PBKDF2-SHA256',
    sha256Id,
    moduleId,
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
    payloadCommitmentSha256: commitment,
    sealedAtIso: now.toISOString(),
    expiresAtIso: compute26MonthExpiryIso(now),
  };
}

/**
 * Decrypts an EncryptedSovereignEnvelope strictly in client memory using the active SHA256 ID.
 */
export async function decryptWithSha256Id<T>(
  envelope: EncryptedSovereignEnvelope,
  sha256Id: string
): Promise<T> {
  if (envelope.sha256Id !== sha256Id) {
    throw new Error('SHA256 ID mismatch — zero-knowledge envelope rejected decryption.');
  }

  const key = await deriveAesGcmKey(sha256Id, envelope.moduleId);
  const iv = base64ToBytes(envelope.ivBase64);
  const ciphertext = base64ToBytes(envelope.ciphertextBase64);
  const aad = new TextEncoder().encode(`${sha256Id}:${envelope.moduleId}`);

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
      additionalData: aad.buffer.slice(aad.byteOffset, aad.byteOffset + aad.byteLength) as ArrayBuffer,
    },
    key,
    ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength) as ArrayBuffer
  );

  const decoded = new TextDecoder().decode(plaintextBuffer);
  return JSON.parse(decoded) as T;
}
