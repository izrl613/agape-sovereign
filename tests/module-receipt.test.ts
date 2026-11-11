// @vitest-environment node
/**
 * Cross-language receipt integrity + vault compatibility.
 *
 * These tests run the *live* frontend gate (`frontend/services/moduleAgents`)
 * and then verify the produced attestation with the secure layer's verifier
 * (`agents/secure/receipts`), which is the same code path the blind MCP server
 * uses. If canonicalisation ever drifts between app and server, this fails.
 */
import { describe, expect, it } from 'vitest';
import {
  generateDEK,
  generateRecoveryCode,
  unwrapDEKFromRecoveryCode,
  wrapDEKWithRecoveryCode,
} from '../frontend/services/sha256Vault';
import { runModuleAgent } from '../frontend/services/moduleAgents';
import { verifyReceiptAttestation } from '../frontend/services/receiptIntegrity';
import { verifyReceipt } from '../agents/secure/receipts';

const UID = 'test-uid';
const SOVEREIGN_ID = 'a'.repeat(64); // 32-byte hex, as produced by sha256Hex

async function assertSameKey(original: CryptoKey, recovered: CryptoKey): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const message = new TextEncoder().encode('sovereign-roundtrip');
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, original, message);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, recovered, ciphertext);
  expect(new TextDecoder().decode(plaintext)).toBe('sovereign-roundtrip');
}

/** Build a legacy (v1) recovery wrap: constant salt, 100k iterations, no `v`. */
async function legacyRecoveryWrap(dek: CryptoKey, recoveryCodeB64: string): Promise<string> {
  const codeBytes = atob(recoveryCodeB64).split('').map((c) => c.charCodeAt(0));
  const codeKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(codeBytes),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const wrappedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('agape-dek-recovery-salt'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    codeKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappedKey,
    await crypto.subtle.exportKey('raw', dek),
  );
  const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
  return btoa(JSON.stringify({ iv: b64(iv), data: b64(new Uint8Array(enc)) }));
}

describe('module receipt attestation', () => {
  it('binds the sealed entry and verifies with the secure layer verifier', async () => {
    const dek = await generateDEK();
    const values = {
      provider: 'Acme Health',
      policyId: 'HP-123456',
      emergencyContact: '+1 555 0100',
    };

    const { receipt } = await runModuleAgent('health', values, UID, SOVEREIGN_ID, dek);

    expect(receipt.attestation).toBeDefined();
    expect(receipt.sha256Id).toMatch(/^[0-9a-f]{64}$/);
    expect([...receipt.fieldKeys].sort()).toEqual([
      'emergencyContact',
      'policyId',
      'provider',
    ]);

    // 1. Local (app) verification.
    await expect(verifyReceiptAttestation(receipt.attestation)).resolves.toBe(true);

    // 2. Cross-language verification: same digest contract as the MCP server.
    const { body, ...meta } = receipt.attestation!;
    await expect(verifyReceipt(meta, body)).resolves.toBe(true);
  });

  it('fails closed when the attestation body is tampered with', async () => {
    const dek = await generateDEK();
    const { receipt } = await runModuleAgent(
      'health',
      { provider: 'Acme', policyId: 'HP-1', emergencyContact: '+1 555 0101' },
      UID,
      SOVEREIGN_ID,
      dek,
    );

    const tampered = {
      ...receipt.attestation!,
      body: { ...receipt.attestation!.body, sha256Id: 'b'.repeat(64) },
    };

    await expect(verifyReceiptAttestation(tampered)).resolves.toBe(false);
    const { body, ...meta } = tampered;
    await expect(verifyReceipt(meta, body)).resolves.toBe(false);
  });
});

describe('recovery-code wrap', () => {
  it('round-trips a v2 wrap (per-wrap random salt, 210k iterations)', async () => {
    const dek = await generateDEK();
    const code = generateRecoveryCode();
    const wrap = await wrapDEKWithRecoveryCode(dek, code);

    const parsed = JSON.parse(atob(wrap)) as { v?: number; salt?: string };
    expect(parsed.v).toBe(2);
    expect(typeof parsed.salt).toBe('string');

    const recovered = await unwrapDEKFromRecoveryCode(code, wrap);
    await assertSameKey(dek, recovered);
  });

  it('still unwraps a legacy v1 wrap', async () => {
    const dek = await generateDEK();
    const code = generateRecoveryCode();
    const legacy = await legacyRecoveryWrap(dek, code);

    const parsed = JSON.parse(atob(legacy)) as { v?: number };
    expect(parsed.v).toBeUndefined();

    const recovered = await unwrapDEKFromRecoveryCode(code, legacy);
    await assertSameKey(dek, recovered);
  });
});
