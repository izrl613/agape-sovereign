import { describe, it, expect, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

if (!(globalThis.crypto as Crypto | undefined)?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

vi.mock('../../firebase', () => ({
  db: { __mock: 'firestore' },
  getFederatedDriveToken: () => null,
}));
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(async () => ({ id: 'x' })),
  collection: () => ({}),
  serverTimestamp: () => new Date(),
  doc: () => ({}),
  setDoc: vi.fn(),
}));

import { compileIdentityAuditPdf } from '../identityAuditService';
import { RETENTION_MONTHS, retentionExpiry } from '../driveExportService';
import { ScanFinding } from '../scanService';

const IDENTITY = 'f'.repeat(64);

const verifiedFinding: ScanFinding = {
  userId: 'uid', module: 'email', finding: 'V-01 exposure confirmed by 1 third-party source(s)',
  status: 'NUKED', timestamp: new Date('2026-09-26T10:00:00Z'),
  details: 'XposedOrNot Breach Index: Address indexed in 2 breach dataset(s): Adobe-2019, LinkedIn-2012.',
  sha256Id: 'a'.repeat(64), seal: 'b'.repeat(64),
  verification: {
    thirdPartyVerified: true,
    statement: 'Third-party verified by XposedOrNot Breach Index.',
    sources: [{ source: 'XposedOrNot Breach Index', outcome: 'EXPOSED', verified: true, checkedAt: '2026-09-26T10:00:01Z' }],
  },
};

const unverifiedFinding: ScanFinding = {
  userId: 'uid', module: 'device', finding: 'V-03 on-device measurement (not third-party verified)',
  status: 'KNOXED', timestamp: new Date('2026-09-26T10:01:00Z'),
  details: 'Measured on device: 8 logical core(s). This result has NOT been confirmed by any external source.',
  sha256Id: 'c'.repeat(64), seal: 'd'.repeat(64),
  verification: { thirdPartyVerified: false, statement: 'No third-party source is registered for this vector.', sources: [] },
};

describe('26-month Identity Audit PDF', () => {
  it('uses a 26-month rolling retention window', () => {
    expect(RETENTION_MONTHS).toBe(26);
    const from = new Date('2026-09-26T00:00:00Z');
    const expiry = retentionExpiry(from, RETENTION_MONTHS);
    expect(expiry.toISOString().slice(0, 10)).toBe('2028-11-26');
  });

  it('compiles a real PDF whose digest matches its own bytes', async () => {
    const doc = await compileIdentityAuditPdf({
      identitySha256: IDENTITY,
      findings: [verifiedFinding, unverifiedFinding],
      sovereignScore: 62,
      classification: 'EXPOSED',
      authFactors: { googleFederated: true, passkeyBound: true, federatedEmail: 'sovereign@gmail.com' },
      generatedAt: new Date('2026-09-26T10:02:00Z'),
    });

    expect(doc.bytes.length).toBeGreaterThan(1000);
    expect(doc.blob.type).toBe('application/pdf');
    expect(String.fromCharCode(...doc.bytes.subarray(0, 5))).toBe('%PDF-');
    expect(doc.sha256Digest).toMatch(/^[0-9a-f]{64}$/);
    expect(doc.retentionMonths).toBe(26);
    expect(doc.expiresAt.toISOString().slice(0, 10)).toBe('2028-11-26');
    expect(doc.fileName).toContain('Identity-Audit-2026-09-26');
    expect(doc.fileName).toContain(doc.sha256Digest.slice(0, 8));

    // Recompute the digest from the returned bytes — it must match.
    const recomputed = await webcrypto.subtle.digest('SHA-256', doc.bytes.buffer as ArrayBuffer);
    const hex = Array.from(new Uint8Array(recomputed)).map(b => b.toString(16).padStart(2, '0')).join('');
    expect(hex).toBe(doc.sha256Digest);
  });

  it('counts vectors honestly — unscanned vectors are reported, not hidden', async () => {
    const doc = await compileIdentityAuditPdf({
      identitySha256: IDENTITY,
      findings: [verifiedFinding, unverifiedFinding],
      sovereignScore: 62,
      classification: 'EXPOSED',
      authFactors: { googleFederated: false, passkeyBound: false, federatedEmail: null },
    });
    expect(doc.counts.scanned).toBe(2);
    expect(doc.counts.unscanned).toBe(14);
    expect(doc.counts.thirdPartyVerified).toBe(1);
    expect(doc.counts.nuked).toBe(1);
    expect(doc.counts.knoxed).toBe(1);
  });

  it('produces a different digest for different evidence — the PDF is evidence-bound', async () => {
    const base = {
      identitySha256: IDENTITY,
      sovereignScore: 62,
      classification: 'EXPOSED',
      authFactors: { googleFederated: true, passkeyBound: false, federatedEmail: 'a@b.com' },
      generatedAt: new Date('2026-09-26T10:02:00Z'),
    };
    const a = await compileIdentityAuditPdf({ ...base, findings: [verifiedFinding] });
    const b = await compileIdentityAuditPdf({ ...base, findings: [unverifiedFinding] });
    expect(a.sha256Digest).not.toBe(b.sha256Digest);
  });
});
