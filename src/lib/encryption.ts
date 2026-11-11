/**
 * Hardened Sovereign Encryption Library
 * Implements AES-256-GCM Envelope Encryption with Memory Sanitization.
 */

export interface WrappedDEK {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  tag: Uint8Array;
}

/**
 * WebCrypto's `BufferSource` requires an ArrayBuffer-backed view in the current
 * TS lib. Narrow at the crypto boundary; runtime behaviour is unchanged.
 */
function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

export class SovereignEncryption {
  private static readonly ALGO_NAME = 'AES-GCM';
  private static readonly KEY_LEN = 256;
  private static readonly SALT_LEN = 16;
  private static readonly IV_LEN = 12;

  /**
   * Memory Sanitization: Overwrites a buffer with zeros.
   * Mitigates risk of sensitive keys remaining in RAM.
   */
  static sanitizeBuffer(buffer: ArrayBuffer | Uint8Array): void {
    const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    view.fill(0);
  }

  /**
   * Generate a deterministic SHA‑256 integrity hash.
   * The hash is computed over the concatenation of `moduleId`, `data`, `salt`
   * and optional `pepper`, separated by the pipe character (`|`).
   * Returns a lowercase hex string.
   */
  static async generateIntegrityHash(
    moduleId: string,
    data: string,
    salt: string,
    pepper?: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const payload = pepper !== undefined && pepper !== ''
      ? `${moduleId}|${data}|${salt}|${pepper}`
      : `${moduleId}|${data}|${salt}`;
    const bytes = encoder.encode(payload);
    // `globalThis.crypto` is the same WebCrypto object in browsers and Node 18+.
    // Using it (instead of `import('crypto')`) keeps the browser bundle clean and
    // avoids pulling a Node builtin into the client build.
    const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
    if (!cryptoObj?.subtle) {
      throw new Error(
        'WebCrypto unavailable: a secure context (browser) or Node 18+ runtime is required.',
      );
    }
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async generateSovereignDEK(): Promise<CryptoKey> {
    return await globalThis.crypto.subtle.generateKey(
      {
        name: this.ALGO_NAME,
        length: this.KEY_LEN,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async deriveWrappingKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const secretBuffer = encoder.encode(secret);

    const baseKey = await globalThis.crypto.subtle.importKey(
      'raw',
      secretBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const wrappingKey = await globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: asBufferSource(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: this.ALGO_NAME, length: this.KEY_LEN },
      true,
      ['encrypt', 'decrypt']
    );

    // Sanitize the temporary secret buffer
    this.sanitizeBuffer(secretBuffer);

    return wrappingKey;
  }

  static async wrapSovereignDEK(dek: CryptoKey, wrappingKey: CryptoKey): Promise<WrappedDEK> {
    const exportedDek = await globalThis.crypto.subtle.exportKey('raw', dek);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(this.IV_LEN));

    const ciphertext = await globalThis.crypto.subtle.encrypt(
      {
        name: this.ALGO_NAME,
        iv: asBufferSource(iv),
      },
      wrappingKey,
      exportedDek
    );

    // Sanitize the exported DEK immediately after wrapping
    this.sanitizeBuffer(exportedDek);

    return {
      ciphertext,
      iv,
      salt: new Uint8Array(),
      tag: new Uint8Array(),
    };
  }

  static async unwrapSovereignDEK(wrapped: WrappedDEK, wrappingKey: CryptoKey): Promise<CryptoKey> {
    const rawDek = await globalThis.crypto.subtle.decrypt(
      {
        name: this.ALGO_NAME,
        iv: asBufferSource(wrapped.iv),
      },
      wrappingKey,
      wrapped.ciphertext
    );

    const dek = await globalThis.crypto.subtle.importKey(
      'raw',
      rawDek,
      this.ALGO_NAME,
      true,
      ['encrypt', 'decrypt']
    );

    // Sanitize the raw DEK buffer
    this.sanitizeBuffer(rawDek);

    return dek;
  }

  static async encryptPII(data: string, dek: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(this.IV_LEN));

    const ciphertext = await globalThis.crypto.subtle.encrypt(
      {
        name: this.ALGO_NAME,
        iv: asBufferSource(iv),
      },
      dek,
      encodedData
    );

    // Sanitize the encoded data buffer
    this.sanitizeBuffer(encodedData);

    return { ciphertext, iv };
  }

  static async decryptPII(ciphertext: ArrayBuffer, iv: Uint8Array, dek: CryptoKey): Promise<string> {
    const decrypted = await globalThis.crypto.subtle.decrypt(
      {
        name: this.ALGO_NAME,
        iv: asBufferSource(iv),
      },
      dek,
      ciphertext
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);

    // Sanitize the decrypted buffer
    this.sanitizeBuffer(decrypted);

    return result;
  }
}

// ── Immutability hardening ────────────────────────────────────────────────────
// Freeze the cryptographic surface so runtime code (or a compromised dependency)
// cannot replace primitives such as generateSovereignDEK. This is required by the
// Googleplex audit in verification-test.ts and by the Zero-Knowledge mandate.
// In strict mode (ES modules) any reassignment attempt throws a TypeError.
Object.freeze(SovereignEncryption);
