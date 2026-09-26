import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// jsdom does not implement SubtleCrypto — use Node's WebCrypto.
if (!(globalThis.crypto as Crypto | undefined)?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

vi.mock('../../firebase', () => ({
  db: { __mock: 'firestore' },
  getFederatedDriveToken: () => null,
}));

const setDocMock = vi.fn(async () => undefined);
const addDocMock = vi.fn(async () => ({ id: 'audit-1' }));
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => ({ path: args.join('/') }),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: (...args: unknown[]) => ({ path: args.join('/') }),
  serverTimestamp: () => new Date(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
}));

import {
  MODULE_AGENTS,
  MODULE_AGENT_INDEX,
  computeModuleSha256,
  deriveFinding,
  runModuleAgent,
  runModuleGate,
  ModuleGateError,
} from '../moduleAgentService';
import { VerificationClient, summarizeVerification } from '../thirdPartyVerificationService';

const VALID_HASH = 'a'.repeat(64);
const session = { user: { uid: 'uid-123', email: 'sovereign@example.com' }, sovereignHash: VALID_HASH };

describe('Module Agent registry', () => {
  it('registers exactly 16 Identity Vector Modules with unique vectors V-01..V-16', () => {
    expect(MODULE_AGENTS).toHaveLength(16);
    const vectors = MODULE_AGENTS.map(m => m.vector).sort();
    expect(vectors).toEqual(
      Array.from({ length: 16 }, (_, i) => `V-${String(i + 1).padStart(2, '0')}`).sort(),
    );
    const ids = new Set(MODULE_AGENTS.map(m => m.moduleId));
    expect(ids.size).toBe(16);
  });

  it('declares a third-party chain or explicitly none for every module', () => {
    for (const spec of MODULE_AGENTS) {
      expect(Array.isArray(spec.verificationChain)).toBe(true);
      expect(MODULE_AGENT_INDEX[spec.moduleId]).toBe(spec);
    }
  });
});

describe('Module Agent gate', () => {
  it('refuses an unauthenticated run', () => {
    const result = runModuleGate({ user: null, sovereignHash: VALID_HASH, moduleId: 'email', rawValue: 'a@b.com' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('AUTH_REQUIRED');
  });

  it('refuses a missing or malformed identity hash — no placeholder hashes accepted', () => {
    expect(runModuleGate({ user: session.user, sovereignHash: null, moduleId: 'email', rawValue: 'a@b.com' }).code)
      .toBe('IDENTITY_HASH_MISSING');
    expect(runModuleGate({ user: session.user, sovereignHash: 'degraded_uid', moduleId: 'email', rawValue: 'a@b.com' }).code)
      .toBe('IDENTITY_HASH_INVALID');
    expect(runModuleGate({ user: session.user, sovereignHash: 'e3b0c442', moduleId: 'email', rawValue: 'a@b.com' }).code)
      .toBe('IDENTITY_HASH_INVALID');
  });

  it('refuses unknown modules and missing required input', () => {
    expect(runModuleGate({ user: session.user, sovereignHash: VALID_HASH, moduleId: 'not-a-module', rawValue: 'x' }).code)
      .toBe('MODULE_UNKNOWN');
    expect(runModuleGate({ user: session.user, sovereignHash: VALID_HASH, moduleId: 'password', rawValue: '' }).code)
      .toBe('INPUT_REQUIRED');
  });

  it('enforces the declared format contract', () => {
    expect(runModuleGate({ user: session.user, sovereignHash: VALID_HASH, moduleId: 'email', rawValue: 'not-an-email' }).code)
      .toBe('INPUT_INVALID');
    expect(runModuleGate({ user: session.user, sovereignHash: VALID_HASH, moduleId: 'email', rawValue: 'a@b.com' }).ok)
      .toBe(true);
    const long = 'x'.repeat(200);
    expect(runModuleGate({ user: session.user, sovereignHash: VALID_HASH, moduleId: 'device', rawValue: long }).code)
      .toBe('INPUT_TOO_LONG');
  });
});

describe('SHA-256 identity of module input', () => {
  it('is a 64-hex digest and is deterministic per value', async () => {
    const a = await computeModuleSha256('email', 'sovereign@example.com', 'DIRECT_PII');
    const b = await computeModuleSha256('email', 'sovereign@example.com', 'DIRECT_PII');
    const c = await computeModuleSha256('email', 'other@example.com', 'DIRECT_PII');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('produces different IDs for the same value in different modules', async () => {
    const email = await computeModuleSha256('email', 'shared-value', 'DIRECT_PII');
    const password = await computeModuleSha256('password', 'shared-value', 'DIRECT_PII');
    expect(email).not.toBe(password);
  });
});

describe('Finding derivation — no fabricated evidence', () => {
  const spec = MODULE_AGENT_INDEX.email;

  it('marks a result NUKED only when a third party confirmed exposure', () => {
    const summary = summarizeVerification('email', [
      {
        sourceId: 'xposedornot', source: 'XposedOrNot Breach Index', endpoint: 'https://api.xposedornot.com',
        query: 'a@b.com', checkedAt: new Date().toISOString(), verified: true, outcome: 'EXPOSED',
        evidence: 'Address indexed in 3 breach datasets.',
      },
    ]);
    const finding = deriveFinding(spec, summary, { measured: false, outcome: 'INCONCLUSIVE', statement: '', facts: {} });
    expect(finding.status).toBe('NUKED');
    expect(finding.thirdPartyVerified).toBe(true);
    expect(finding.details).toContain('XposedOrNot');
  });

  it('marks a result KNOXED only when every queried source answered clean', () => {
    const summary = summarizeVerification('email', [
      {
        sourceId: 'dns-doh-google', source: 'Google Public DNS (DNS-over-HTTPS)', endpoint: 'https://dns.google/resolve',
        query: 'example.com', checkedAt: new Date().toISOString(), verified: true, outcome: 'CLEAN',
        evidence: 'SPF and DMARC present.',
      },
    ]);
    const finding = deriveFinding(spec, summary, { measured: false, outcome: 'INCONCLUSIVE', statement: '', facts: {} });
    expect(finding.status).toBe('KNOXED');
    expect(finding.thirdPartyVerified).toBe(true);
  });

  it('reports UNVERIFIED when no source answered, and says so in the details', () => {
    const summary = summarizeVerification('email', [
      {
        sourceId: 'xposedornot', source: 'XposedOrNot Breach Index', endpoint: 'https://api.xposedornot.com',
        query: 'a@b.com', checkedAt: new Date().toISOString(), verified: false, outcome: 'UNAVAILABLE',
        evidence: 'Third-party source did not return a usable response.', error: 'fetch failed',
      },
    ]);
    const finding = deriveFinding(spec, summary, { measured: false, outcome: 'INCONCLUSIVE', statement: '', facts: {} });
    expect(finding.status).toBe('MONITORED');
    expect(finding.thirdPartyVerified).toBe(false);
    expect(finding.finding).toContain('UNVERIFIED');
    expect(finding.details).toContain('XposedOrNot');
    expect(finding.details).toContain('NOT been confirmed by any external source');
  });
});

describe('runModuleAgent end-to-end', () => {
  beforeEach(() => {
    setDocMock.mockClear();
    addDocMock.mockClear();
  });

  it('throws ModuleGateError and writes nothing when the gate refuses', async () => {
    await expect(
      runModuleAgent({ session: null, moduleId: 'email', rawValue: 'a@b.com' }),
    ).rejects.toBeInstanceOf(ModuleGateError);
    expect(setDocMock).not.toHaveBeenCalled();
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it('hashes, encrypts and persists ciphertext only — never the plaintext', async () => {
    const client = new VerificationClient({ fetchImpl: vi.fn() as unknown as typeof fetch });
    const result = await runModuleAgent({
      session,
      moduleId: 'password',
      rawValue: 'Sup3r-Secret-Passphrase!',
      client,
    });

    expect(result.sha256Id).toMatch(/^[0-9a-f]{64}$/);
    expect(result.sha256Id).toBe(await computeModuleSha256('password', 'Sup3r-Secret-Passphrase!', 'DIRECT_PII'));
    expect(result.ciphertext).not.toContain('Sup3r-Secret-Passphrase!');
    expect(result.ciphertext.length).toBeGreaterThan(0);
    expect(result.seal).toMatch(/^[0-9a-f]{64}$/);

    const written = setDocMock.mock.calls[0][1] as Record<string, any>;
    expect(JSON.stringify(written)).not.toContain('Sup3r-Secret-Passphrase!');
    expect(written.hashes.passwordHash).toBe(result.sha256Id);

    // Audit trail records the hash, never the value.
    const audit = addDocMock.mock.calls[0][1] as Record<string, any>;
    expect(audit.sha256Id).toBe(result.sha256Id);
    expect(JSON.stringify(audit)).not.toContain('Sup3r-Secret-Passphrase!');
  });

  it('runs the registered third-party chain and reports provenance', async () => {
    const rangeResponse = `${'B'.repeat(39)}:4`;
    const fetchImpl = vi.fn(async () =>
      new Response(rangeResponse, { status: 200 }),
    ) as unknown as typeof fetch;

    const client = new VerificationClient({ fetchImpl, chains: { password: ['pwnedpasswords'] } });
    const result = await runModuleAgent({ session, moduleId: 'password', rawValue: 'hunter2', client });

    expect(result.verification.reports).toHaveLength(1);
    expect(result.verification.reports[0].sourceId).toBe('pwnedpasswords');
    expect(result.finding.thirdPartyVerified).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns an UNVERIFIED result rather than inventing one when sources fail', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch;
    const client = new VerificationClient({ fetchImpl, chains: { email: ['xposedornot'] } });

    const result = await runModuleAgent({ session, moduleId: 'email', rawValue: 'sovereign@example.com', client });

    expect(result.finding.thirdPartyVerified).toBe(false);
    expect(result.verification.reports[0].outcome).toBe('UNAVAILABLE');
    expect(result.finding.details).toContain('NOT been confirmed by any external source');
  });

  it('records on-device attestation facts for attestation modules', async () => {
    const client = new VerificationClient({ fetchImpl: vi.fn() as unknown as typeof fetch });
    const result = await runModuleAgent({ session, moduleId: 'device', rawValue: 'Work Laptop', client });
    expect(result.attestation.measured).toBe(true);
    expect(result.attestation.statement).toContain('secure context');
    expect(result.finding.thirdPartyVerified).toBe(false);
  });
});
