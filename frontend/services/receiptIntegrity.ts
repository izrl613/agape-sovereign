/**
 * Receipt Integrity — tamper-evident SHA-256 attestation for module receipts.
 *
 * The app's `ModuleReceipt` proves *where* an entry was sealed; this adds a
 * cryptographic *binding* between the receipt metadata and the sealed entry,
 * in the exact canonical form used by `agents/secure/receipts.ts` and the
 * blind MCP server (`mcp_server/automation`).
 *
 * Contract (must stay byte-identical across languages):
 *   digest = SHA-256(canonicalJson({
 *     algorithm: 'SHA-256', version: 1,
 *     subject, moduleId, vector, issuedAt, body
 *   }))
 * where canonicalJson sorts object keys recursively and uses no whitespace.
 *
 * Nothing here is secret: `subject` is the already-hashed Sovereign ID, and
 * `body` holds only hashes, timestamps, status labels and field *names*.
 */
import { sha256Hex } from './sha256Vault';

export interface ModuleReceiptBody {
  /** SHA-256 ID of the sealed plaintext entry. */
  sha256Id: string;
  sealedAt: string;
  /** VerificationStatus, e.g. VERIFIED / SELF_ATTESTED / API_UNREACHABLE. */
  verificationStatus: string;
  /** Field names present at seal time — never their values. */
  fieldKeys: string[];
}

/** Mirrors `VerificationReceipt` from `agents/secure/receipts.ts`. */
export interface ModuleReceiptAttestation {
  algorithm: 'SHA-256';
  version: 1;
  /** 32-byte hex hash of the sovereign subject (here: the Sovereign ID). */
  subject: string;
  moduleId: string;
  vector: string;
  issuedAt: string;
  digest: string;
  /** Non-secret metadata that the digest commits to. */
  body: ModuleReceiptBody;
}

const HEX64 = /^[0-9a-f]{64}$/;

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) out[key] = sortJsonValue(src[key]);
    return out;
  }
  return value;
}

/** Deterministically serialize JSON (sorted keys, no whitespace). */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

async function digestOf(params: {
  subject: string;
  moduleId: string;
  vector: string;
  issuedAt: string;
  body: ModuleReceiptBody;
}): Promise<string> {
  return sha256Hex(
    canonicalJson({
      algorithm: 'SHA-256',
      version: 1,
      subject: params.subject,
      moduleId: params.moduleId,
      vector: params.vector,
      issuedAt: params.issuedAt,
      body: params.body,
    }),
  );
}

/** Create the attestation for a freshly sealed module receipt. */
export async function createReceiptAttestation(params: {
  subject: string;
  moduleId: string;
  vector: string;
  issuedAt: string;
  body: ModuleReceiptBody;
}): Promise<ModuleReceiptAttestation> {
  if (!HEX64.test(params.subject)) {
    throw new Error('createReceiptAttestation: subject must be a 32-byte hex hash');
  }
  const digest = await digestOf(params);
  return {
    algorithm: 'SHA-256',
    version: 1,
    subject: params.subject,
    moduleId: params.moduleId,
    vector: params.vector,
    issuedAt: params.issuedAt,
    digest,
    body: params.body,
  };
}

/**
 * Recompute and compare. Returns false on any structural anomaly or mismatch,
 * so callers can fail closed before persisting a receipt.
 */
export async function verifyReceiptAttestation(
  attestation: ModuleReceiptAttestation | null | undefined,
): Promise<boolean> {
  if (
    !attestation ||
    attestation.algorithm !== 'SHA-256' ||
    attestation.version !== 1 ||
    !HEX64.test(attestation.subject) ||
    !HEX64.test(attestation.digest) ||
    typeof attestation.moduleId !== 'string' ||
    typeof attestation.vector !== 'string' ||
    typeof attestation.issuedAt !== 'string' ||
    typeof attestation.body !== 'object' ||
    attestation.body === null
  ) {
    return false;
  }
  const expected = await digestOf({
    subject: attestation.subject,
    moduleId: attestation.moduleId,
    vector: attestation.vector,
    issuedAt: attestation.issuedAt,
    body: attestation.body,
  });
  // Constant-time-ish compare; both are 64 hex chars of fixed length.
  if (expected.length !== attestation.digest.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ attestation.digest.charCodeAt(i);
  }
  return diff === 0;
}
