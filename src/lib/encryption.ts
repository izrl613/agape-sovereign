/**
 * ============================================================
 * ARCHITECT AI — Client-Side Encryption
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * AES-256-GCM encryption for all user DIFF data
 * Zero-knowledge architecture: encrypted client-side before Firestore
 */

/**
 * Generate a cryptographic key from a passphrase
 * Using PBKDF2 with SHA-256
 */
export const deriveKeyFromPassphrase = async (
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passphraseData = encoder.encode(passphrase);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passphraseData,
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
 * Generate a random salt for key derivation
 */
export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

/**
 * Encrypt data using AES-256-GCM
 */
export const encryptData = async (
  data: unknown,
  key: CryptoKey,
  iv?: Uint8Array
): Promise<{
  ciphertext: string;
  iv: string;
  tag: string;
}> => {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const plaintext = encoder.encode(dataString);

  // Generate IV if not provided
  const initVector = iv || crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: initVector,
    },
    key,
    plaintext
  );

  // Convert to base64 for storage
  const ciphertext = arrayBufferToBase64(encryptedData);
  const ivBase64 = arrayBufferToBase64(initVector);

  // Note: AES-GCM in SubtleCrypto includes the tag in the ciphertext
  // We extract the last 16 bytes as the tag for reference
  const tag = ciphertext.slice(-24); // Last 24 chars in base64 = 16 bytes

  return {
    ciphertext,
    iv: ivBase64,
    tag,
  };
};

/**
 * Decrypt data using AES-256-GCM
 */
export const decryptData = async (
  ciphertext: string,
  key: CryptoKey,
  iv: string
): Promise<unknown> => {
  try {
    const encryptedData = base64ToArrayBuffer(ciphertext);
    const initVector = base64ToArrayBuffer(iv);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: initVector,
      },
      key,
      encryptedData
    );

    // Convert back to JSON
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedData);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - integrity check failed or wrong key');
  }
};

/**
 * Hash data using SHA-256
 * For generating document seals and checksums
 */
export const hashSHA256 = async (data: unknown): Promise<string> => {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToHex(hashBuffer);
};

/**
 * Generate HMAC-SHA256 for message authentication
 */
export const generateHMAC = async (
  data: unknown,
  key: CryptoKey
): Promise<string> => {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  const hmacBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    dataBuffer
  );

  return arrayBufferToBase64(hmacBuffer);
};

/**
 * Verify HMAC-SHA256 signature
 */
export const verifyHMAC = async (
  data: unknown,
  signature: string,
  key: CryptoKey
): Promise<boolean> => {
  try {
    const signatureBuffer = base64ToArrayBuffer(signature);
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataString);

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      dataBuffer
    );
  } catch (error) {
    console.error('HMAC verification failed:', error);
    return false;
  }
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

// ─── Utility Functions ───────────────────────────────────────

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
 * Encrypt entire DIFF profile for storage
 */
export interface EncryptedDIFFProfile {
  userId: string;
  encryptedData: string;
  iv: string;
  salt: string;
  sha256Seal: string;
  encryptedAt: number;
}

export const encryptDIFFProfile = async (
  userId: string,
  diffProfile: unknown,
  passphrase: string
): Promise<EncryptedDIFFProfile> => {
  const salt = generateSalt();
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const { ciphertext, iv } = await encryptData(diffProfile, key);
  const sha256Seal = await hashSHA256(diffProfile);

  return {
    userId,
    encryptedData: ciphertext,
    iv,
    salt: arrayBufferToBase64(salt),
    sha256Seal,
    encryptedAt: Date.now(),
  };
};

/**
 * Decrypt DIFF profile from storage
 */
export const decryptDIFFProfile = async (
  encrypted: EncryptedDIFFProfile,
  passphrase: string
): Promise<unknown> => {
  const salt = base64ToArrayBuffer(encrypted.salt);
  const key = await deriveKeyFromPassphrase(passphrase, salt as Uint8Array);

  return decryptData(encrypted.encryptedData, key, encrypted.iv);
};

/**
 * Check if Web Crypto API is available
 */
export const isCryptoAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined'
  );
};
