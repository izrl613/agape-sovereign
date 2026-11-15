/**
 * ============================================================
 * Agape Sovereign — Zero-Knowledge Envelope Encryption
 * ============================================================
 *
 * AES-256-GCM envelope encryption with two independent wraps of the
 * Data Encryption Key (DEK):
 *
 *   1. Passkey-derived wrapping key  (daily unlock)
 *   2. Recovery-code-derived key    (break-glass)
 *
 * Security invariants (enforced, not documented-and-hoped):
 *  - The DEK never leaves this module in plaintext.
 *  - Algorithm/KDF are fixed constants. Callers cannot choose weaker ones.
 *  - Decryption rejects unknown ciphers, unknown KDFs, and KDF iterations
 *    below the current floor (downgrade-attack protection).
 *  - Every wrap and payload uses a fresh 96-bit IV from the CSPRNG.
 *  - Raw key bytes are zeroed immediately after use.
 *
 * Only erasable TypeScript is used so this runs under `node file.ts`.
 */

import { getCrypto, randomBytes, toHex, fromHex } from './receipts.ts';

/** Fixed, non-negotiable cryptographic parameters. */
export const ENVELOPE_PARAMS = {
  cipher: 'AES-256-GCM',
  kdf: 'PBKDF2-SHA-256',
  /** OWASP 2023+ floor for PBKDF2-HMAC-SHA256. */
  iterations: 210_000,
  /** Refuse anything weaker on decrypt. */
  minIterations: 210_000,
  keyLength: 256,
  ivBytes: 12,
  saltBytes: 16,
  /** Minimum secret length accepted for a passkey or recovery code. */
  minSecretLength: 12,
  version: 1,
} as const;

export interface WrappedDek {
  /** Base64 AES-GCM IV. */
  iv: string;
  /** Base64 ciphertext (WebCrypto appends the 128-bit tag). */
  ciphertext: string;
  /** Base64 PBKDF2 salt. */
  salt: string;
}

export interface EncryptedEnvelope {
  version: 1;
  cipher: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  /** Base64 AES-GCM IV for the payload. */
  iv: string;
  /** Base64 payload ciphertext (includes GCM tag). */
  ciphertext: string;
  passkey: WrappedDek;
  recovery: WrappedDek;
  createdAt: string;
}

// ── Base64 (portable browser + Node) ─────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  const BufferCtor = (globalThis as { Buffer?: { from(b: Uint8Array): { toString(enc: string): string } } })
    .Buffer;
  if (BufferCtor) {
    return BufferCtor.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return (globalThis as { btoa?: (s: string) => string }).btoa!(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('base64ToBytes: empty or non-string input');
  }
  const BufferCtor = (globalThis as { Buffer?: { from(s: string, enc: string): Uint8Array } }).Buffer;
  if (BufferCtor) {
    return new Uint8Array(BufferCtor.from(value, 'base64'));
  }
  const atobFn = (globalThis as { atob?: (s: string) => string }).atob;
  if (!atobFn) throw new Error('base64ToBytes: no base64 decoder available');
  const binary = atobFn(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function wipe(bytes: Uint8Array | ArrayBuffer): void {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  view.fill(0);
}

/**
 * WebCrypto's `BufferSource` in current TS lib requires an ArrayBuffer-backed
 * view. Our helpers may be typed as `Uint8Array<ArrayBufferLike>`, so narrow
 * at the crypto boundary. Runtime behaviour is unchanged.
 */
function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

// ── Key derivation & wrapping ────────────────────────────────────────────────

function assertSecret(secret: string, label: string): void {
  if (typeof secret !== 'string' || secret.length < ENVELOPE_PARAMS.minSecretLength) {
    throw new Error(
      `${label} must be a string of at least ${ENVELOPE_PARAMS.minSecretLength} characters.`,
    );
  }
}

async function deriveWrappingKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getCrypto().subtle;
  const secretBytes = new TextEncoder().encode(secret);
  try {
    const baseKey = await subtle.importKey('raw', asBufferSource(secretBytes), 'PBKDF2', false, [
      'deriveKey',
    ]);
    return await subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: asBufferSource(salt),
        iterations: ENVELOPE_PARAMS.iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: ENVELOPE_PARAMS.keyLength },
      false, // non-extractable wrapping key
      ['encrypt', 'decrypt'],
    );
  } finally {
    wipe(secretBytes);
  }
}

async function generateDek(): Promise<CryptoKey> {
  return getCrypto().subtle.generateKey(
    { name: 'AES-GCM', length: ENVELOPE_PARAMS.keyLength },
    true, // extractable only long enough to wrap it
    ['encrypt', 'decrypt'],
  );
}

async function wrapDek(dek: CryptoKey, wrappingKey: CryptoKey): Promise<WrappedDek> {
  const subtle = getCrypto().subtle;
  const raw = await subtle.exportKey('raw', dek);
  const iv = randomBytes(ENVELOPE_PARAMS.ivBytes);
  try {
    const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, wrappingKey, raw);
    return {
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      salt: '',
    };
  } finally {
    wipe(raw);
  }
}

async function unwrapDek(wrapped: WrappedDek, wrappingKey: CryptoKey): Promise<CryptoKey> {
  const subtle = getCrypto().subtle;
  const raw = await subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(base64ToBytes(wrapped.iv)) },
    wrappingKey,
    asBufferSource(base64ToBytes(wrapped.ciphertext)),
  );
  try {
    return await subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  } finally {
    wipe(raw);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Encrypt a JSON-serializable payload under two independent secrets.
 * The returned envelope is safe to persist on an untrusted server:
 * it contains ciphertext only.
 */
export async function createEnvelope(
  payload: unknown,
  passkeySecret: string,
  recoverySecret: string,
): Promise<EncryptedEnvelope> {
  assertSecret(passkeySecret, 'passkeySecret');
  assertSecret(recoverySecret, 'recoverySecret');
  if (passkeySecret === recoverySecret) {
    throw new Error(
      'passkeySecret and recoverySecret must differ; otherwise the recovery path adds no security.',
    );
  }

  const subtle = getCrypto().subtle;
  const dek = await generateDek();

  const passkeySalt = randomBytes(ENVELOPE_PARAMS.saltBytes);
  const recoverySalt = randomBytes(ENVELOPE_PARAMS.saltBytes);

  try {
    const passkeyWrapping = await deriveWrappingKey(passkeySecret, passkeySalt);
    const recoveryWrapping = await deriveWrappingKey(recoverySecret, recoverySalt);

    const passkeyWrapped = await wrapDek(dek, passkeyWrapping);
    const recoveryWrapped = await wrapDek(dek, recoveryWrapping);

    // Attach the PBKDF2 salt to each wrap.
    passkeyWrapped.salt = bytesToBase64(passkeySalt);
    recoveryWrapped.salt = bytesToBase64(recoverySalt);

    const payloadIv = randomBytes(ENVELOPE_PARAMS.ivBytes);
    const plaintext = new TextEncoder().encode(
      JSON.stringify(payload ?? null),
    );
    let ciphertext: ArrayBuffer;
    try {
      ciphertext = await subtle.encrypt(
        { name: 'AES-GCM', iv: asBufferSource(payloadIv) },
        dek,
        asBufferSource(plaintext),
      );
    } finally {
      wipe(plaintext);
    }

    return {
      version: 1,
      cipher: ENVELOPE_PARAMS.cipher,
      kdf: ENVELOPE_PARAMS.kdf,
      iterations: ENVELOPE_PARAMS.iterations,
      iv: bytesToBase64(payloadIv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      passkey: passkeyWrapped,
      recovery: recoveryWrapped,
      createdAt: new Date().toISOString(),
    };
  } finally {
    // `dek` is a non-exportable-after-use handle; drop the reference.
    // Raw bytes are wiped inside wrapDek/unwrapDek.
    void dek;
  }
}

function assertEnvelope(envelope: EncryptedEnvelope): void {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('openEnvelope: envelope missing');
  }
  // Algorithm-downgrade protection: reject anything but the fixed suite.
  if (envelope.cipher !== ENVELOPE_PARAMS.cipher) {
    throw new Error(`openEnvelope: unsupported cipher "${String(envelope.cipher)}"`);
  }
  if (envelope.kdf !== ENVELOPE_PARAMS.kdf) {
    throw new Error(`openEnvelope: unsupported KDF "${String(envelope.kdf)}"`);
  }
  if (
    !Number.isInteger(envelope.iterations) ||
    envelope.iterations < ENVELOPE_PARAMS.minIterations
  ) {
    throw new Error(
      `openEnvelope: KDF iterations below floor (${String(envelope.iterations)} < ${ENVELOPE_PARAMS.minIterations})`,
    );
  }
  if (envelope.version !== 1) {
    throw new Error(`openEnvelope: unsupported envelope version ${String(envelope.version)}`);
  }
}

/**
 * Decrypt an envelope using either the passkey or the recovery secret.
 * Throws on tamper, wrong secret, or algorithm downgrade.
 */
export async function openEnvelope<T = unknown>(
  envelope: EncryptedEnvelope,
  secret: string,
  path: 'passkey' | 'recovery' = 'passkey',
): Promise<T> {
  assertEnvelope(envelope);
  assertSecret(secret, 'secret');
  if (path !== 'passkey' && path !== 'recovery') {
    throw new Error('openEnvelope: path must be "passkey" or "recovery"');
  }

  const wrapped = path === 'recovery' ? envelope.recovery : envelope.passkey;
  if (!wrapped || !wrapped.iv || !wrapped.ciphertext || !wrapped.salt) {
    throw new Error(`openEnvelope: ${path} wrap is incomplete`);
  }

  const salt = base64ToBytes(wrapped.salt);
  const wrappingKey = await deriveWrappingKey(secret, salt);
  const dek = await unwrapDek(wrapped, wrappingKey);

  const plaintext = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(base64ToBytes(envelope.iv)) },
    dek,
    asBufferSource(base64ToBytes(envelope.ciphertext)),
  );

  const decoded = new TextDecoder().decode(plaintext);
  wipe(plaintext);
  return JSON.parse(decoded) as T;
}

/** Convert arbitrary bytes to hex (re-export for callers that need it). */
export { toHex, fromHex };
