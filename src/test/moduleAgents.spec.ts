import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { generateSHA256, encryptClientSide, decryptClientSide } from '../utils/crypto';
import {
  MODULE_AGENTS,
  getAgentForModule,
  sealModuleValue,
  getLocalAgentGates,
  agentProviderMeta,
} from '../services/moduleAgentService';
import { isValidSHA256, generateSessionNonce, formatHashDisplay } from '../services/sovereignHashService';
import { compileIdentityAuditReport, AUDIT_RETENTION_MONTHS } from '../services/pdfService';
import { driveExportService } from '../services/driveExportService';

// Deterministic fetch stub: XposedOrNot answers 404 (address clean) —
// everything else fails closed (network unreachable is a real outcome).
const realFetch = globalThis.fetch;
const fetchStub = vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.includes('xposedornot')) {
    return new Response('{}', { status: 404 });
  }
  throw new Error('offline-in-test');
});

beforeEach(() => {
  localStorage.clear();
  globalThis.fetch = fetchStub as unknown as typeof fetch;
  fetchStub.mockClear();
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

const TEST_UID = 'test-uid-123';
const TEST_SHA256_ID = 'a'.repeat(64);

describe('utils/crypto — real WebCrypto primitives', () => {
  it('SHA-256 produces a 64-char lowercase hex digest', async () => {
    const h = await generateSHA256('hello sovereign');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('AES-256-GCM encrypt/decrypt round-trips a secret', async () => {
    const secret = 'my-real-secret-value';
    const enc = await encryptClientSide(secret, TEST_UID);
    expect(enc).not.toContain(secret);
    const dec = await decryptClientSide(enc, TEST_UID);
    expect(dec).toBe(secret);
  });

  it('ciphertext differs across runs (random IV)', async () => {
    const a = await encryptClientSide('same', TEST_UID);
    const b = await encryptClientSide('same', TEST_UID);
    expect(a).not.toBe(b);
  });
});

describe('sovereignHashService', () => {
  it('validates SHA-256 shape', () => {
    expect(isValidSHA256(TEST_SHA256_ID)).toBe(true);
    expect(isValidSHA256('nope')).toBe(false);
    expect(isValidSHA256(TEST_SHA256_ID.toUpperCase())).toBe(false);
  });

  it('generates 32-byte session nonces', () => {
    const n = generateSessionNonce();
    expect(n).toMatch(/^[0-9a-f]{64}$/);
    expect(generateSessionNonce()).not.toBe(n);
  });

  it('formats a hash for display', () => {
    const h = 'b'.repeat(64);
    expect(formatHashDisplay(h)).toBe('bbbbbbbb...bbbbbbbb');
  });
});

describe('MODULE_AGENTS registry — gating contract for 16 vectors', () => {
  const canonical = ['email', 'social', 'device', 'mobile', 'deepweb', 'broker', 'password',
    'location', 'browser', 'financial', 'medical', 'biometric', 'iot', 'cloud', 'darkweb', 'behavioral'];

  it('covers all 16 canonical identity vectors', () => {
    for (const id of canonical) {
      const agent = getAgentForModule(id);
      expect(agent.moduleId).toBe(id);
      expect(agent.vector).toMatch(/^V-/);
      expect(agent.agentName.length).toBeGreaterThan(3);
    }
  });

  it('every vector has a real verification provider label (no mocks)', () => {
    for (const id of canonical) {
      const meta = agentProviderMeta(id);
      expect(meta.provider.length).toBeGreaterThan(3);
      expect(['THIRD_PARTY_API', 'LOCAL_ENCLAVE_SENSOR']).toContain(meta.type);
    }
  });

  it('rejects empty or malformed input at the gate', () => {
    expect(getAgentForModule('email').validate('')).toBeTruthy();
    expect(getAgentForModule('email').validate('not-an-email')).toBeTruthy();
    expect(getAgentForModule('email').validate('real@person.com')).toBeNull();
    expect(getAgentForModule('password').validate('abc')).toBeTruthy();
  });
});

describe('sealModuleValue — the full agent gate pipeline (demo path)', () => {
  it('seals a value: SHA-256 → AES-GCM → SHA-256-ID binding → local gate', async () => {
    const result = await sealModuleValue({
      moduleId: 'email',
      value: 'citizen@example.org',
      uid: TEST_UID,
      sha256Id: TEST_SHA256_ID,
      demoMode: true,
    });

    expect(isValidSHA256(result.dataHash)).toBe(true);
    expect(isValidSHA256(result.moduleSeal)).toBe(true);
    expect(result.gate.state).toBe('SEALED');
    expect(result.gate.sha256Id).toBe(TEST_SHA256_ID);
    expect(result.encrypted).not.toContain('citizen@example.org');

    // gate persisted locally for the dashboard mesh
    const gates = getLocalAgentGates(TEST_UID);
    expect(gates.email?.state).toBe('SEALED');
    expect(gates.email?.moduleSeal).toBe(result.moduleSeal);

    // encrypted module payload persisted + decrypts back
    const active = JSON.parse(localStorage.getItem(`module_data_active_${TEST_UID}`) || '{}');
    const dec = await decryptClientSide(active.data.email, TEST_UID);
    expect(dec).toBe('citizen@example.org');
    expect(active.hashes.emailHash).toBe(result.dataHash);
  });

  it('verification ran against the real provider path (XposedOrNot 404 → KNOXED)', async () => {
    const result = await sealModuleValue({
      moduleId: 'email',
      value: 'clean@example.org',
      uid: TEST_UID,
      sha256Id: TEST_SHA256_ID,
      demoMode: true,
    });
    expect(result.verification).not.toBeNull();
    expect(result.verification?.provider).toContain('XposedOrNot');
    expect(result.verification?.verdict).toBe('KNOXED');
    expect(fetchStub).toHaveBeenCalled();
  });

  it('different data produces different seals (no placeholder determinism)', async () => {
    const a = await sealModuleValue({ moduleId: 'password', value: 'Tr0ub4dor&3-real', uid: TEST_UID, sha256Id: TEST_SHA256_ID, demoMode: true });
    const b = await sealModuleValue({ moduleId: 'password', value: 'X#correctHorseBattery!', uid: TEST_UID, sha256Id: TEST_SHA256_ID, demoMode: true });
    expect(a.moduleSeal).not.toBe(b.moduleSeal);
    expect(a.dataHash).not.toBe(b.dataHash);
  });

  it('falls back to a derived binding when the session hash is degraded', async () => {
    const r = await sealModuleValue({ moduleId: 'device', value: 'device posture note', uid: TEST_UID, sha256Id: null, demoMode: true });
    expect(isValidSHA256(r.gate.sha256Id)).toBe(true);
    expect(r.gate.sha256Id).not.toBe(TEST_SHA256_ID);
  });

  it('hard-rejects invalid input before any crypto work', async () => {
    await expect(
      sealModuleValue({ moduleId: 'email', value: 'bad@@', uid: TEST_UID, sha256Id: TEST_SHA256_ID, demoMode: true }),
    ).rejects.toThrow(/Agent/i);
  });
});

describe('pdfService — 26-month Identity Audit PDF compile', () => {
  it('produces a real PDF blob with the cumulative seal and a 26-month filename', async () => {
    const compiled = await compileIdentityAuditReport({
      userId: TEST_UID,
      userEmail: 'operator@example.org',
      userName: 'Operator',
      sovereignScore: 88,
      nukedCount: 1,
      knoxedCount: 12,
      monitoredCount: 3,
      modulesData: [
        { id: 'email', label: 'Email Breach Scanner', vector: 'V-01', status: 'KNOXED', value: 'x', hash: await generateSHA256('v1'), finding: 'ok', details: 'ok' },
        { id: 'social', label: 'Social Media Footprint', vector: 'V-02', status: 'MONITORED', value: 'y', hash: await generateSHA256('v2'), finding: 'watch', details: 'watch' },
      ],
    });

    expect(isValidSHA256(compiled.seal)).toBe(true);
    expect(compiled.blob).toBeTruthy();
    expect((compiled.blob as Blob).type).toBe('application/pdf');
    expect((compiled.blob as Blob).size).toBeGreaterThan(1000);
    expect(compiled.fileName).toContain('26Month');
    expect(AUDIT_RETENTION_MONTHS).toBe(26);
  }, 30000);
});

describe('driveExportService — federated Drive availability contract', () => {
  it('is only available for Google-authenticated sessions', () => {
    expect(driveExportService.isAvailable('google')).toBe(true);
    expect(driveExportService.isAvailable('passkey')).toBe(false);
    expect(driveExportService.isAvailable('anonymous')).toBe(false);
    expect(driveExportService.isAvailable(null)).toBe(false);
  });

  it('never uses the Firebase API key as an OAuth client id', async () => {
    // ensureToken must fail cleanly rather than mint an invalid client_id
    driveExportService.clear();
    await expect(
      driveExportService.exportToDrive(new Blob(['x'], { type: 'application/pdf' }), 't.pdf'),
    ).resolves.toMatchObject({ success: false });
  });
});
