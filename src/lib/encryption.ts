/**
 * ============================================================
 * ARCHITECT AI — Client-Side Encryption
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * AES-256-GCM envelope encryption for all user DIFF data.
 * Zero-knowledge architecture: encrypted client-side before Firestore.
 *
 * KEY HIERARCHY:
 * 1. Data Encryption Key (DEK): Random 256-bit key used for data encryption.
 * 2. Passkey Wrapping Key (PWK): Derived from WebAuthn passkey secret.
 * 3. Recovery Wrapping Key (RWK): Derived from a plaintext recovery code.
 * ============================================================
 */

/**
 * Generate a random 256-bit Data Encryption Key (DEK)
 */
export const generateDEK = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(32));
};

/**
 * Derive a wrapping key from a secret (passphrase or recovery code)
 * Using PBKDF2 with SHA-256
 */
export const deriveWrappingKey = async (
  secret: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Wrap (encrypt) a key using another key
 */
export const wrapKey = async (
  keyToWrap: Uint8Array,
  wrappingKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    keyToWrap
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedKey),
    iv: arrayBufferToBase64(iv),
  };
};

/**
 * Unwrap (decrypt) a key using another key
 */
export const unwrapKey = async (
  ciphertext: string,
  iv: string,
  wrappingKey: CryptoKey
): Promise<Uint8Array> => {
  const encryptedData = base64ToArrayBuffer(ciphertext);
  const initVector = base64ToArrayBuffer(iv);

  const decryptedKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: initVector },
    wrappingKey,
    encryptedData
  );

  return new Uint8Array(decryptedKey);
};

/**
 * Encrypt data using AES-256-GCM and a DEK
 */
export const encryptWithDEK = async (
  data: unknown,
  dek: Uint8Array
): Promise<{
  ciphertext: string;
  iv: string;
}> => {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const plaintext = encoder.encode(dataString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    dek,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintext
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
  };
};

/**
 * Decrypt data using AES-256-GCM and a DEK
 */
export const decryptWithDEK = async (
  ciphertext: string,
  iv: string,
  dek: Uint8Array
): Promise<unknown> => {
  const encryptedData = base64ToArrayBuffer(ciphertext);
  const initVector = base64ToArrayBuffer(iv);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    dek,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: initVector },
    cryptoKey,
    encryptedData
  );

  const decoder = new TextDecoder();
  const decryptedString = decoder.decode(decryptedData);
  return JSON.parse(decryptedString);
};

/**
 * Generate a random salt for key derivation
 */
export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

/**
 * Hash data using SHA-256
 */
export const hashSHA256 = async (data: unknown): Promise<string> => {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToHex(hashBuffer);
};

/**
 * Generate a random UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ── Utility Functions ───────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

/**
 * Encrypted profile structure for storage
 */
export interface EncryptedSovereignProfile {
  userId: string;
  encryptedData: string;
  iv: string;
  sha256Seal: string;
  encryptedAt: number;
  // Wrapped DEKs
  wrappedDEK_passkey: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
  wrappedDEK_recovery: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
}
