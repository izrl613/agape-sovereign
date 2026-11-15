/**
 * ============================================================
 * Agape Sovereign — Cryptographic Receipt Primitives
 * ============================================================
 *
 * Every identity vector MUST carry a mathematical verification receipt
 * (SHA-256) per the DIFF Vector Specialist mandate.
 *
 * Design rules enforced here:
 *  - CSPRNG only (platform WebCrypto). Never Math.random().
 *  - Deterministic canonical JSON so receipts verify cross-language.
 *  - Constant-time comparison to avoid timing oracles.
 *  - Portable across browsers and Node 18+ (globalThis.crypto).
 *
 * This file is intentionally dependency-free and uses only erasable
 * TypeScript syntax so it can run directly under `node file.ts`.
 */

/** Lowercase hexadecimal string. */
export type Hex = string;

/** Typed accessor for the platform CSPRNG / SubtleCrypto. */
export function getCrypto(): Crypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || !c.subtle || typeof c.getRandomValues !== 'function') {
    throw new Error(
      'WebCrypto unavailable: a secure context (browser) or Node 18+ runtime is required.',
    );
  }
  return c;
}

/** Fill a buffer from the platform CSPRNG. */
export function randomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error(`randomBytes: invalid length (${length})`);
  }
  const buf = new Uint8Array(length);
  getCrypto().getRandomValues(buf);
  return buf;
}

/**
 * Cryptographic identifier. Uses UUIDv4 from the platform CSPRNG.
 * Never use Math.random() for security-relevant identifiers.
 */
export function randomId(prefix: string): string {
  if (!/^[a-z0-9-]{1,32}$/i.test(prefix)) {
    throw new Error('randomId: prefix must be alphanumeric or dash (max 32)');
  }
  return `${prefix}_${getCrypto().randomUUID()}`;
}

/** Encode bytes as lowercase hex. */
export function toHex(bytes: Uint8Array): Hex {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Decode lowercase/uppercase hex. Throws on malformed input. */
export function fromHex(hex: Hex): Uint8Array {
  if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 !== 0) {
    throw new Error('fromHex: invalid hex string');
  }
  if (!/^[0-9a-f]+$/i.test(hex)) {
    throw new Error('fromHex: non-hex characters present');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** SHA-256 digest of a string (UTF-8) or raw bytes, as lowercase hex. */
export async function sha256Hex(input: string | Uint8Array): Promise<Hex> {
  const subtle = getCrypto().subtle;
  const data =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  // Narrow to BufferSource: our helper may be typed as Uint8Array<ArrayBufferLike>.
  const digest = await subtle.digest('SHA-256', data as unknown as BufferSource);
  return toHex(new Uint8Array(digest));
}

/**
 * Constant-time string comparison.
 * Returns false immediately on length mismatch (length is not secret here).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Deterministically serialize a JSON-compatible value (sorted keys, no spaces). */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) {
      out[key] = sortJsonValue(src[key]);
    }
    return out;
  }
  return value;
}

/** A tamper-evident SHA-256 receipt bound to a single vector result. */
export interface VerificationReceipt {
  algorithm: 'SHA-256';
  version: 1;
  /** Hash of the sovereign user reference — never the raw UID or email. */
  subject: Hex;
  moduleId: string;
  vector: string;
  issuedAt: string;
  digest: Hex;
}

/** Internal canonical form that is actually hashed. Never includes secrets. */
interface ReceiptBody {
  algorithm: 'SHA-256';
  version: 1;
  subject: Hex;
  moduleId: string;
  vector: string;
  issuedAt: string;
  body: unknown;
}

function canonicalReceiptInput(params: ReceiptBody): string {
  return canonicalJson({
    algorithm: params.algorithm,
    version: params.version,
    subject: params.subject,
    moduleId: params.moduleId,
    vector: params.vector,
    issuedAt: params.issuedAt,
    body: params.body,
  });
}

/**
 * Create a verification receipt over an arbitrary (non-secret) body.
 * The body MUST NOT contain plaintext PII or key material.
 */
export async function createReceipt(params: {
  subject: Hex;
  moduleId: string;
  vector: string;
  body: unknown;
  issuedAt?: string;
}): Promise<VerificationReceipt> {
  if (!/^[0-9a-f]{64}$/.test(params.subject)) {
    throw new Error('createReceipt: subject must be a 32-byte hex hash');
  }
  const issuedAt = params.issuedAt ?? new Date().toISOString();
  const digest = await sha256Hex(
    canonicalReceiptInput({
      algorithm: 'SHA-256',
      version: 1,
      subject: params.subject,
      moduleId: params.moduleId,
      vector: params.vector,
      issuedAt,
      body: params.body,
    }),
  );
  return {
    algorithm: 'SHA-256',
    version: 1,
    subject: params.subject,
    moduleId: params.moduleId,
    vector: params.vector,
    issuedAt,
    digest,
  };
}

/**
 * Recompute and compare a receipt against its body.
 * Fails closed on any structural anomaly or digest mismatch.
 */
export async function verifyReceipt(
  receipt: VerificationReceipt,
  body: unknown,
): Promise<boolean> {
  if (
    !receipt ||
    receipt.algorithm !== 'SHA-256' ||
    receipt.version !== 1 ||
    !/^[0-9a-f]{64}$/.test(receipt.subject) ||
    !/^[0-9a-f]{64}$/.test(receipt.digest) ||
    typeof receipt.moduleId !== 'string' ||
    typeof receipt.vector !== 'string' ||
    typeof receipt.issuedAt !== 'string'
  ) {
    return false;
  }
  const expected = await sha256Hex(
    canonicalReceiptInput({
      algorithm: 'SHA-256',
      version: 1,
      subject: receipt.subject,
      moduleId: receipt.moduleId,
      vector: receipt.vector,
      issuedAt: receipt.issuedAt,
      body,
    }),
  );
  return timingSafeEqual(expected, receipt.digest);
}
