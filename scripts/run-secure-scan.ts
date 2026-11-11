/**
 * ============================================================
 * Agape Sovereign — End-to-End Secure Scan Runner
 * ============================================================
 *
 * Run with:   node scripts/run-secure-scan.ts
 *
 * This script:
 *   1. Generates demo passkey + recovery secrets from the CSPRNG.
 *   2. Runs all 16 vectors through the secure orchestrator using
 *      clearly-labeled SYNTHETIC test fixtures.
 *   3. Verifies every SHA-256 receipt and the envelope round-trip.
 *   4. Proves tamper + downgrade rejection.
 *   5. Writes ciphertext-only artifacts to workspace_outputs/.
 *
 * SYNTHETIC DATA NOTICE
 * ---------------------
 * The fixtures below (fake SSN / GPS tag) are deliberately fabricated to
 * exercise the *real* local probes. They are not real user data. Probes
 * that require external sources remain MONITORED — never fabricated.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  SovereignScanOrchestrator,
  openEnvelope,
  verifyReceipt,
  toHex,
  randomBytes,
  ENVELOPE_PARAMS,
  type EncryptedEnvelope,
  type VectorResult,
} from '../agents/secure/index.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function line(label: string, value: string | number): void {
  console.log(`  ${label.padEnd(28)} ${value}`);
}

async function main(): Promise<void> {
  console.log('============================================================');
  console.log('  AGAPE SOVEREIGN — SECURE AUTOMATION VERIFICATION');
  console.log('============================================================\n');

  // 256-bit demo secrets from the platform CSPRNG.
  const passkeySecret = toHex(randomBytes(32));
  const recoverySecret = toHex(randomBytes(32));
  assert(passkeySecret !== recoverySecret, 'demo secrets must differ');

  const orchestrator = new SovereignScanOrchestrator();

  console.log('[1/6] Running 16-vector secure scan (synthetic fixtures)...');
  const result = await orchestrator.run({
    userId: 'demo-user-0001',
    email: 'demo+alias@example.test',
    passkeySecret,
    recoverySecret,
    enableRemediation: true,
    params: {
      // SYNTHETIC: exercises the real local PII probe (V-03).
      'device-health': {
        fileText:
          'SYNTHETIC TEST FIXTURE — not a real identity.\n' +
          'ssn: 123-45-6789\ncard: 4242 4242 4242 4242\n',
      },
      // SYNTHETIC: exercises the real GPS metadata probe (V-12).
      'metadata-purge': {
        fileText: 'EXIF dump\nGPSLatitude: 40.7128\nGPSLongitude: -74.0060\n',
      },
    },
    onProgress: ({ index, total, vector }) => {
      process.stdout.write(`\r      ${index + 1}/${total} ${vector} scanned…`);
    },
  });
  process.stdout.write('\r' + ' '.repeat(48) + '\r');

  assert(result.vectors.length === 16, 'all 16 vectors must be present');
  assert(result.verification.receiptsValid, 'all receipts must be valid');
  assert(result.verification.checked === 16, 'all 16 receipts must be checked');
  assert(result.verification.sealedRoundTrip, 'sealed envelope must round-trip');

  const nuked = result.vectors.filter((v) =>
    v.findings.some((f) => f.status === 'NUKED'),
  );
  const knoxed = result.vectors.filter((v) =>
    v.findings.every((f) => f.status === 'KNOXED'),
  );
  const monitored = result.vectors.filter((v) =>
    v.findings.some((f) => f.status === 'MONITORED') &&
    !v.findings.some((f) => f.status === 'NUKED'),
  );

  console.log('\n[2/6] Scan summary');
  line('Subject (SHA-256)', result.subject);
  line('Sovereign State', result.state);
  line('Sovereign Score', `${result.sovereignScore}/100`);
  line('Vectors NUKED', nuked.length);
  line('Vectors KNOXED', knoxed.length);
  line('Vectors MONITORED', monitored.length);
  line('Receipts verified', result.verification.checked);

  console.log('\n[3/6] Receipt integrity + tamper detection');
  const sample: VectorResult = result.vectors[0];
  const body = { findings: sample.findings, score: sample.score };
  assert(await verifyReceipt(sample.receipt, body), 'receipt must verify');
  const tamperedReceipt = {
    ...sample.receipt,
    digest: '0'.repeat(64),
  };
  assert(!(await verifyReceipt(tamperedReceipt, body)), 'tampered receipt must fail');
  console.log('      ✓ original receipt verifies');
  console.log('      ✓ tampered receipt rejected');

  console.log('\n[4/6] Zero-knowledge envelope round-trip');
  const recovered = await openEnvelope<{ subject: string; sovereignScore: number }>(
    result.envelope,
    recoverySecret,
    'recovery',
  );
  assert(recovered.subject === result.subject, 'recovery path subject mismatch');
  assert(recovered.sovereignScore === result.sovereignScore, 'recovery score mismatch');
  console.log('      ✓ recovery-code path decrypts the sealed run');

  // Wrong secret must fail (AES-GCM authentication).
  let wrongSecretRejected = false;
  try {
    await openEnvelope(result.envelope, 'wrong-secret-should-fail-000000', 'passkey');
  } catch {
    wrongSecretRejected = true;
  }
  assert(wrongSecretRejected, 'wrong secret must be rejected');
  console.log('      ✓ wrong secret rejected (GCM auth failure)');

  console.log('\n[5/6] Algorithm-downgrade protection');
  const downgradedCipher = {
    ...result.envelope,
    cipher: 'AES-256-CBC',
  } as unknown as EncryptedEnvelope;
  let cipherRejected = false;
  try {
    await openEnvelope(downgradedCipher, passkeySecret, 'passkey');
  } catch {
    cipherRejected = true;
  }
  assert(cipherRejected, 'cipher downgrade must be rejected');

  const weakKdf = {
    ...result.envelope,
    iterations: 1000,
  } as EncryptedEnvelope;
  let kdfRejected = false;
  try {
    await openEnvelope(weakKdf, passkeySecret, 'passkey');
  } catch {
    kdfRejected = true;
  }
  assert(kdfRejected, 'KDF iteration downgrade must be rejected');
  console.log(`      ✓ non-${ENVELOPE_PARAMS.cipher} cipher rejected`);
  console.log(`      ✓ KDF iterations below ${ENVELOPE_PARAMS.minIterations} rejected`);

  console.log('\n[6/6] Remediation is fail-closed');
  for (const request of result.remediation) {
    assert(
      request.status === 'BLOCKED' || request.status === 'DISPATCHED' || request.status === 'VERIFIED',
      'remediation status must be explicit',
    );
  }
  assert(
    result.remediation.every((r) => r.status === 'BLOCKED'),
    'without a transport, every remediation must be BLOCKED',
  );
  console.log(`      ✓ ${result.remediation.length} action(s) blocked (no transport configured)`);

  // ── Persist ciphertext-only artifacts ─────────────────────────────────────
  const outDir = path.join(process.cwd(), 'workspace_outputs');
  await mkdir(outDir, { recursive: true });

  const envelopePath = path.join(outDir, 'secure-scan.envelope.json');
  const receiptsPath = path.join(outDir, 'secure-scan.receipts.json');

  await writeFile(envelopePath, JSON.stringify(result.envelope, null, 2) + '\n', 'utf8');
  await writeFile(
    receiptsPath,
    JSON.stringify(
      {
        schema: 'agape.sovereign.receipts.v1',
        subject: result.subject,
        state: result.state,
        sovereignScore: result.sovereignScore,
        completedAt: result.completedAt,
        verification: result.verification,
        remediation: result.remediation,
        vectors: result.vectors.map((v) => ({
          moduleId: v.moduleId,
          vector: v.vector,
          label: v.label,
          category: v.category,
          probe: v.probe,
          score: v.score,
          receipt: v.receipt,
          findings: v.findings,
        })),
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log('\nArtifacts written (no secrets, ciphertext only):');
  console.log(`  ${envelopePath}`);
  console.log(`  ${receiptsPath}`);
  console.log('\n============================================================');
  console.log('  ✅ SECURE AUTOMATION VERIFIED');
  console.log('============================================================');
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED');
  console.error(err);
  process.exitCode = 1;
});
