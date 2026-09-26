/**
 * MODULE AGENT SERVICE — Identity Vector Module (IVM) Gate Agents
 * ============================================================
 * Every one of the 16 Identity Vector Modules is gated by a Module Agent.
 * No user-entered value reaches storage, the dashboard, or Architect AI until
 * the agent has:
 *
 *   1. GATE      — confirmed an authenticated session and a valid SHA-256
 *                  identity hash (the sole session identifier).
 *   2. VALIDATE  — checked the value against the module's declared contract.
 *   3. HASH      — computed the SHA-256 ID of the canonical input record.
 *   4. ENCRYPT   — AES-256-GCM client-side encryption (plaintext never stored).
 *   5. SEAL      — bound uid + module + timestamp + data hash into an
 *                  integrity seal.
 *   6. PERSIST   — wrote ciphertext + hash only.
 *   7. VERIFY    — submitted the value to the module's third-party chain.
 *   8. REPORT    — derived a finding from real evidence only.
 *
 * Fabricated, placeholder, mock or simulated findings are banned. When no
 * third-party source answers, the result is reported as UNVERIFIED with a
 * factual statement of what was measured on-device.
 * ============================================================
 */

import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { encryptClientSide, generateSHA256 } from '../utils/crypto';
import { isValidSHA256 } from './sovereignHashService';
import {
  VerificationClient,
  VerificationChains,
  VerificationReport,
  VerificationSummary,
  verificationClient,
} from './thirdPartyVerificationService';

export type ModuleInputType = 'email' | 'handle' | 'domain' | 'password' | 'text' | 'software' | 'url' | 'hostname';

export interface ModuleAgentSpec {
  moduleId: string;
  vector: string;
  label: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputType: ModuleInputType;
  required: boolean;
  maxLength: number;
  pattern: RegExp | null;
  patternHint: string;
  /** Classification of the value the user enters. */
  piiClass: 'DIRECT_PII' | 'PSEUDONYMOUS' | 'DEVICE' | 'NONE';
  /** Third-party sources that will be queried for this module. */
  verificationChain: string[];
  /** Whether an on-device measurement backs this module. */
  localAttestation: boolean;
}

export const MODULE_AGENTS: ModuleAgentSpec[] = [
  {
    moduleId: 'email', vector: 'V-01', label: 'Email Breach Scanner',
    description: 'Breach-index lookup and mail-domain authentication audit.',
    inputLabel: 'Email address to audit', inputPlaceholder: 'you@example.com',
    inputType: 'email', required: true, maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternHint: 'Enter a valid email address.',
    piiClass: 'DIRECT_PII', verificationChain: ['xposedornot', 'dns-doh-google', 'haveibeenpwned'], localAttestation: false,
  },
  {
    moduleId: 'social', vector: 'V-02', label: 'Social Media Footprint',
    description: 'Public handle footprint check and certificate transparency exposure.',
    inputLabel: 'Username / handle', inputPlaceholder: '@yourhandle',
    inputType: 'handle', required: true, maxLength: 64,
    pattern: /^[A-Za-z0-9._@-]{2,64}$/, patternHint: 'Handles may contain letters, numbers, dot, underscore, dash.',
    piiClass: 'PSEUDONYMOUS', verificationChain: ['github-user-api', 'crt-sh'], localAttestation: false,
  },
  {
    moduleId: 'device', vector: 'V-03', label: 'Device File Scan',
    description: 'On-device hardware, storage and secure-context attestation.',
    inputLabel: 'Device label (optional)', inputPlaceholder: 'Work MacBook Pro',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'DEVICE', verificationChain: [], localAttestation: true,
  },
  {
    moduleId: 'mobile', vector: 'V-04', label: 'Mobile Security Layer',
    description: 'WebAuthn platform authenticator and passkey enrolment attestation.',
    inputLabel: 'Device model (optional)', inputPlaceholder: 'iPhone 15 Pro',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'DEVICE', verificationChain: [], localAttestation: true,
  },
  {
    moduleId: 'deepweb', vector: 'V-05', label: 'Deep Web Exposure',
    description: 'Malware-URL and certificate transparency checks for a host you supply.',
    inputLabel: 'Host or domain to check', inputPlaceholder: 'example.com',
    inputType: 'hostname', required: true, maxLength: 253,
    pattern: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, patternHint: 'Enter a hostname such as example.com.',
    piiClass: 'NONE', verificationChain: ['urlhaus', 'crt-sh'], localAttestation: false,
  },
  {
    moduleId: 'broker', vector: 'V-06', label: 'Data Broker Removal',
    description: 'No free third-party broker index exists; this vector is attestation-only.',
    inputLabel: 'Full name on record (optional)', inputPlaceholder: 'First Last',
    inputType: 'text', required: false, maxLength: 120,
    pattern: null, patternHint: '',
    piiClass: 'DIRECT_PII', verificationChain: [], localAttestation: false,
  },
  {
    moduleId: 'password', vector: 'V-07', label: 'Password Vault Analysis',
    description: 'SHA-1 k-anonymity credential check — only 5 hex characters leave the device.',
    inputLabel: 'Credential to test', inputPlaceholder: '••••••••',
    inputType: 'password', required: true, maxLength: 256,
    pattern: null, patternHint: '',
    piiClass: 'DIRECT_PII', verificationChain: ['pwnedpasswords'], localAttestation: false,
  },
  {
    moduleId: 'location', vector: 'V-08', label: 'Location Data Footprint',
    description: 'Browser geolocation permission state attestation.',
    inputLabel: 'Region label (optional)', inputPlaceholder: 'New York, NY',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'DEVICE', verificationChain: [], localAttestation: true,
  },
  {
    moduleId: 'browser', vector: 'V-09', label: 'Browser & Cookie Tracker',
    description: 'Fingerprint entropy measurement plus Observatory scoring for a host.',
    inputLabel: 'Site to score (optional)', inputPlaceholder: 'example.com',
    inputType: 'hostname', required: false, maxLength: 253,
    pattern: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, patternHint: 'Enter a hostname such as example.com.',
    piiClass: 'DEVICE', verificationChain: ['mozilla-observatory'], localAttestation: true,
  },
  {
    moduleId: 'financial', vector: 'V-10', label: 'Financial Identity Exposure',
    description: 'No free third-party source; PAN/IBAN values are never accepted.',
    inputLabel: 'Institution name (optional)', inputPlaceholder: 'Bank name only — never an account number',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'NONE', verificationChain: [], localAttestation: false,
  },
  {
    moduleId: 'medical', vector: 'V-11', label: 'Medical Data Footprint',
    description: 'No free third-party source; PHI values are never accepted.',
    inputLabel: 'Provider name (optional)', inputPlaceholder: 'Clinic name only — never a record number',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'NONE', verificationChain: [], localAttestation: false,
  },
  {
    moduleId: 'biometric', vector: 'V-12', label: 'Voice & Biometric Data',
    description: 'Camera and microphone permission-state attestation.',
    inputLabel: 'Sensor label (optional)', inputPlaceholder: 'Face ID',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'DEVICE', verificationChain: [], localAttestation: true,
  },
  {
    moduleId: 'iot', vector: 'V-13', label: 'IoT & Smart Device Scan',
    description: 'WebRTC LAN-candidate leakage plus NVD CVE lookup for firmware identifiers.',
    inputLabel: 'Device / firmware identifier (optional)', inputPlaceholder: 'Netgear R7000 1.0.11',
    inputType: 'software', required: false, maxLength: 120,
    pattern: null, patternHint: '',
    piiClass: 'DEVICE', verificationChain: ['nvd-cve'], localAttestation: true,
  },
  {
    moduleId: 'cloud', vector: 'V-14', label: 'Cloud Storage Exposure',
    description: 'Browser storage-quota attestation; Drive audit runs from the export panel.',
    inputLabel: 'Provider (optional)', inputPlaceholder: 'Google Drive',
    inputType: 'text', required: false, maxLength: 80,
    pattern: null, patternHint: '',
    piiClass: 'DEVICE', verificationChain: [], localAttestation: true,
  },
  {
    moduleId: 'darkweb', vector: 'V-15', label: 'Dark Web Monitoring',
    description: 'Credential-corpus monitoring via the same k-anonymity channel.',
    inputLabel: 'Credential or alias to monitor', inputPlaceholder: '••••••••',
    inputType: 'password', required: true, maxLength: 256,
    pattern: null, patternHint: '',
    piiClass: 'DIRECT_PII', verificationChain: ['pwnedpasswords', 'haveibeenpwned'], localAttestation: false,
  },
  {
    moduleId: 'behavioral', vector: 'V-16', label: 'Behavioral Profile Analysis',
    description: 'Tracking-surface attestation: cookies, referrer and permission surface.',
    inputLabel: 'Site you suspect profiles you (optional)', inputPlaceholder: 'example.com',
    inputType: 'hostname', required: false, maxLength: 253,
    pattern: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, patternHint: 'Enter a hostname such as example.com.',
    piiClass: 'DEVICE', verificationChain: [], localAttestation: true,
  },
];

export const MODULE_AGENT_INDEX: Record<string, ModuleAgentSpec> = MODULE_AGENTS.reduce(
  (acc, spec) => { acc[spec.moduleId] = spec; return acc; },
  {} as Record<string, ModuleAgentSpec>,
);

export const MODULE_VECTOR_LABELS: Record<string, string> = MODULE_AGENTS.reduce(
  (acc, spec) => { acc[spec.moduleId] = spec.vector; return acc; },
  {} as Record<string, string>,
);

/**
 * Single source of truth for which third-party sources back each vector.
 * Derived from the agent specs above so the two can never drift apart.
 */
export const MODULE_AGENT_CHAINS: VerificationChains = MODULE_AGENTS.reduce(
  (acc, spec) => {
    acc[spec.moduleId] = spec.verificationChain as VerificationChains[string];
    return acc;
  },
  {} as VerificationChains,
);

/** Verification client wired to the Module Agent registry. */
export const moduleVerificationClient: VerificationClient = verificationClient.withChains(MODULE_AGENT_CHAINS);

/* ─────────────────────────── gate ─────────────────────────── */

export type GateFailureCode =
  | 'AUTH_REQUIRED'
  | 'IDENTITY_HASH_MISSING'
  | 'IDENTITY_HASH_INVALID'
  | 'MODULE_UNKNOWN'
  | 'INPUT_REQUIRED'
  | 'INPUT_INVALID'
  | 'INPUT_TOO_LONG';

export interface ModuleGateContext {
  user: { uid: string; email: string | null } | null;
  sovereignHash: string | null;
  moduleId: string;
  rawValue: string;
}

export interface ModuleGateResult {
  ok: boolean;
  code?: GateFailureCode;
  reason?: string;
  spec?: ModuleAgentSpec;
}

export function runModuleGate(ctx: ModuleGateContext): ModuleGateResult {
  const spec = MODULE_AGENT_INDEX[ctx.moduleId];
  if (!spec) {
    return { ok: false, code: 'MODULE_UNKNOWN', reason: `No Module Agent is registered for "${ctx.moduleId}".` };
  }
  if (!ctx.user?.uid) {
    return { ok: false, code: 'AUTH_REQUIRED', reason: 'An authenticated session is required before a Module Agent will run.', spec };
  }
  if (!ctx.sovereignHash) {
    return { ok: false, code: 'IDENTITY_HASH_MISSING', reason: 'The session SHA-256 identity hash has not been issued yet.', spec };
  }
  // A degraded or placeholder hash is rejected — the displayed ID must be real.
  if (!isValidSHA256(ctx.sovereignHash)) {
    return { ok: false, code: 'IDENTITY_HASH_INVALID', reason: 'The session identity hash is not a valid SHA-256 digest. Re-authenticate.', spec };
  }

  const value = (ctx.rawValue ?? '').trim();
  if (spec.required && value.length === 0) {
    return { ok: false, code: 'INPUT_REQUIRED', reason: `${spec.inputLabel} is required for ${spec.vector}.`, spec };
  }
  if (value.length > spec.maxLength) {
    return { ok: false, code: 'INPUT_TOO_LONG', reason: `Value exceeds the ${spec.maxLength}-character limit for ${spec.vector}.`, spec };
  }
  if (spec.pattern && value.length > 0 && !spec.pattern.test(value)) {
    return { ok: false, code: 'INPUT_INVALID', reason: spec.patternHint || 'Value does not match the expected format.', spec };
  }
  return { ok: true, spec };
}

/* ──────────────────── on-device attestation ──────────────────── */

export interface LocalAttestation {
  measured: boolean;
  outcome: 'CLEAN' | 'EXPOSED' | 'INCONCLUSIVE';
  statement: string;
  facts: Record<string, string | number | boolean>;
}

async function measurePermissions(name: 'geolocation' | 'camera' | 'microphone'): Promise<string> {
  try {
    const nav = navigator as Navigator & { permissions?: Permissions };
    if (!nav.permissions?.query) return 'unsupported';
    const state = await nav.permissions.query({ name });
    return state.state;
  } catch {
    return 'unsupported';
  }
}

async function measureCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220; canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unavailable';
    ctx.textBaseline = 'top';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#FF2E9F';
    ctx.fillText('AGAPE-SOVEREIGN-FP', 2, 2);
    ctx.fillStyle = '#00D4FF';
    ctx.fillRect(60, 12, 50, 18);
    return await generateSHA256(canvas.toDataURL());
  } catch {
    return 'unavailable';
  }
}

async function measureWebRtcLeak(): Promise<{ leaked: boolean; detail: string }> {
  try {
    if (typeof RTCPeerConnection === 'undefined') return { leaked: false, detail: 'RTCPeerConnection unsupported' };
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const leaked = await new Promise<boolean>((resolve) => {
      let found = false;
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        if (/192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./.test(e.candidate.candidate)) found = true;
      };
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve(found));
      setTimeout(() => { try { pc.close(); } catch { /* noop */ } resolve(found); }, 1500);
    });
    return { leaked, detail: leaked ? 'LAN candidate emitted' : 'no LAN candidate emitted' };
  } catch {
    return { leaked: false, detail: 'WebRTC probe unavailable' };
  }
}

async function measureStorageQuota(): Promise<{ usage: number; quota: number }> {
  try {
    if (!navigator.storage?.estimate) return { usage: -1, quota: -1 };
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? -1, quota: est.quota ?? -1 };
  } catch {
    return { usage: -1, quota: -1 };
  }
}

/**
 * Real on-device measurements. Every statement below describes something that
 * was actually measured in this browser session — nothing is assumed.
 */
export async function attestLocally(moduleId: string): Promise<LocalAttestation> {
  const secureContext = typeof window !== 'undefined' && window.isSecureContext === true;
  const cryptoAvailable = typeof crypto !== 'undefined' && !!crypto?.subtle;

  switch (moduleId) {
    case 'device': {
      const cores = navigator.hardwareConcurrency || 0;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0;
      const storage = await measureStorageQuota();
      const facts = { cores, memoryGb: memory, platform: navigator.platform || 'unknown', secureContext, cryptoAvailable, storageUsage: storage.usage, storageQuota: storage.quota };
      return {
        measured: true,
        outcome: secureContext && cryptoAvailable ? 'CLEAN' : 'EXPOSED',
        statement: `Measured on device: ${cores || 'unknown'} logical core(s), ${memory || 'unknown'} GB reported memory, platform "${navigator.platform || 'unknown'}", secure context ${secureContext ? 'yes' : 'NO'}, WebCrypto ${cryptoAvailable ? 'available' : 'UNAVAILABLE'}.`,
        facts,
      };
    }
    case 'mobile': {
      const hasWebAuthn = typeof window !== 'undefined' && !!window.PublicKeyCredential;
      let biometric = 'unknown';
      if (hasWebAuthn && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        biometric = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          .then(v => (v ? 'available' : 'absent')).catch(() => 'unknown');
      }
      return {
        measured: true,
        outcome: biometric === 'available' ? 'CLEAN' : 'EXPOSED',
        statement: `WebAuthn ${hasWebAuthn ? 'supported' : 'NOT supported'}; user-verifying platform authenticator (biometric enclave) ${biometric}.`,
        facts: { webauthn: hasWebAuthn, biometricAuthenticator: biometric },
      };
    }
    case 'location': {
      const geo = await measurePermissions('geolocation');
      return {
        measured: true,
        outcome: geo === 'granted' ? 'EXPOSED' : geo === 'denied' ? 'CLEAN' : 'INCONCLUSIVE',
        statement: `Geolocation permission state measured as "${geo}".`,
        facts: { geolocation: geo },
      };
    }
    case 'browser': {
      const canvas = await measureCanvasFingerprint();
      const cookieEnabled = navigator.cookieEnabled;
      const doNotTrack = navigator.doNotTrack || 'unset';
      return {
        measured: true,
        outcome: 'INCONCLUSIVE',
        statement: `Canvas fingerprint digest ${canvas.slice(0, 16)}…, cookies ${cookieEnabled ? 'enabled' : 'disabled'}, Do-Not-Track ${doNotTrack}.`,
        facts: { canvasDigest: canvas, cookieEnabled, doNotTrack },
      };
    }
    case 'biometric': {
      const camera = await measurePermissions('camera');
      const microphone = await measurePermissions('microphone');
      const granted = camera === 'granted' || microphone === 'granted';
      return {
        measured: true,
        outcome: granted ? 'EXPOSED' : camera === 'denied' && microphone === 'denied' ? 'CLEAN' : 'INCONCLUSIVE',
        statement: `Camera permission "${camera}", microphone permission "${microphone}".`,
        facts: { camera, microphone },
      };
    }
    case 'iot': {
      const webrtc = await measureWebRtcLeak();
      return {
        measured: true,
        outcome: webrtc.leaked ? 'EXPOSED' : 'CLEAN',
        statement: `WebRTC probe: ${webrtc.detail}.`,
        facts: { webrtcLanLeak: webrtc.leaked, detail: webrtc.detail },
      };
    }
    case 'cloud': {
      const storage = await measureStorageQuota();
      return {
        measured: true,
        outcome: 'INCONCLUSIVE',
        statement: storage.quota > 0
          ? `Browser storage estimate: ${(storage.usage / 1048576).toFixed(1)} MB used of ${(storage.quota / 1048576).toFixed(1)} MB quota. Remote cloud buckets were not queried.`
          : 'Browser storage estimate unavailable; remote cloud buckets were not queried.',
        facts: { storageUsage: storage.usage, storageQuota: storage.quota },
      };
    }
    case 'behavioral': {
      const canvas = await measureCanvasFingerprint();
      const cookieEnabled = navigator.cookieEnabled;
      const languages = (navigator.languages || []).join(',');
      return {
        measured: true,
        outcome: 'INCONCLUSIVE',
        statement: `Fingerprintable surface measured locally: canvas digest ${canvas.slice(0, 16)}…, cookies ${cookieEnabled ? 'enabled' : 'disabled'}, advertised languages "${languages || 'none'}".`,
        facts: { canvasDigest: canvas, cookieEnabled, languages },
      };
    }
    default:
      return {
        measured: false,
        outcome: 'INCONCLUSIVE',
        statement: 'No on-device signal is measurable for this vector, and no third-party source is registered. Nothing was inferred.',
        facts: {},
      };
  }
}

/* ─────────────────────────── agent run ─────────────────────────── */

export type ModuleFindingStatus = 'NUKED' | 'KNOXED' | 'MONITORED';

export interface ModuleAgentSession {
  user: { uid: string; email: string | null };
  sovereignHash: string;
}

export interface ModuleAgentRunInput {
  session: ModuleAgentSession | null;
  moduleId: string;
  rawValue: string;
  /** Skip third-party calls (offline mode). Local attestation still runs. */
  skipVerification?: boolean;
  client?: VerificationClient;
}

export interface ModuleAgentResult {
  moduleId: string;
  vector: string;
  label: string;
  /** SHA-256 ID of the sealed input record — displayed in the UI. */
  sha256Id: string;
  /** The session identity SHA-256 the agent was gated on. */
  identitySha256: string;
  seal: string;
  ciphertext: string;
  piiClass: ModuleAgentSpec['piiClass'];
  attestation: LocalAttestation;
  verification: VerificationSummary;
  finding: {
    status: ModuleFindingStatus;
    finding: string;
    details: string;
    thirdPartyVerified: boolean;
  };
  persisted: { store: 'firestore'; path: string } | { store: 'none'; error: string };
  audited: boolean;
  completedAt: string;
}

export class ModuleGateError extends Error {
  code: GateFailureCode;
  constructor(code: GateFailureCode, message: string) {
    super(message);
    this.name = 'ModuleGateError';
    this.code = code;
  }
}

/** Canonical, deterministic serialisation used for hashing. */
export function canonicalRecord(moduleId: string, value: string, piiClass: string): string {
  return JSON.stringify({ moduleId, piiClass, value, schema: 'agape-sovereign/ivm/1' });
}

export async function computeModuleSha256(moduleId: string, value: string, piiClass: string): Promise<string> {
  return generateSHA256(canonicalRecord(moduleId, value, piiClass));
}

/**
 * Derive a finding strictly from real evidence.
 * Priority: third-party outcome → on-device attestation → UNVERIFIED.
 */
export function deriveFinding(
  spec: ModuleAgentSpec,
  verification: VerificationSummary,
  attestation: LocalAttestation,
): ModuleAgentResult['finding'] {
  const answering = verification.reports.filter(r => r.verified && r.sourceId !== 'local-attestation');

  if (answering.length > 0) {
    const exposed = answering.filter(r => r.outcome === 'EXPOSED');
    if (exposed.length > 0) {
      return {
        status: 'NUKED',
        finding: `${spec.vector} exposure confirmed by ${exposed.length} third-party source(s)`,
        details: exposed.map(r => `${r.source}: ${r.evidence}`).join(' | '),
        thirdPartyVerified: true,
      };
    }
    const clean = answering.filter(r => r.outcome === 'CLEAN');
    if (clean.length === answering.length) {
      return {
        status: 'KNOXED',
        finding: `${spec.vector} clear across all queried third-party sources`,
        details: clean.map(r => `${r.source}: ${r.evidence}`).join(' | '),
        thirdPartyVerified: true,
      };
    }
    return {
      status: 'MONITORED',
      finding: `${spec.vector} verification inconclusive`,
      details: answering.map(r => `${r.source} [${r.outcome}]: ${r.evidence}`).join(' | '),
      thirdPartyVerified: true,
    };
  }

  // No third party answered.
  const blocked = verification.reports.filter(r => r.outcome === 'UNAVAILABLE' || r.outcome === 'NOT_CONFIGURED');
  const blockedNote = blocked.length > 0
    ? ` Third-party sources could not be reached (${blocked.map(r => r.source).join(', ')}).`
    : spec.verificationChain.length > 0
      ? ' Registered third-party sources were not applicable to this input.'
      : ' No third-party source is registered for this vector.';

  if (attestation.measured) {
    // A real on-device measurement is evidence, but it is not third-party
    // confirmation — the label says so explicitly.
    const status: ModuleFindingStatus =
      attestation.outcome === 'EXPOSED' ? 'NUKED'
      : attestation.outcome === 'CLEAN' ? 'KNOXED'
      : 'MONITORED';
    return {
      status,
      finding: `${spec.vector} on-device measurement (not third-party verified)`,
      details: `${attestation.statement}${blockedNote} This result has NOT been confirmed by any external source.`,
      thirdPartyVerified: false,
    };
  }

  return {
    status: 'MONITORED',
    finding: `${spec.vector} UNVERIFIED — no evidence source available`,
    details: `No third-party source is available for this vector and no on-device signal could be measured.${blockedNote} This result has NOT been confirmed by any external source; no finding was generated or assumed.`,
    thirdPartyVerified: false,
  };
}

/**
 * Execute a Module Agent end-to-end.
 * Throws ModuleGateError when the gate refuses the run (nothing is written).
 */
export async function runModuleAgent(input: ModuleAgentRunInput): Promise<ModuleAgentResult> {
  const gate = runModuleGate({
    user: input.session ? { uid: input.session.user.uid, email: input.session.user.email } : null,
    sovereignHash: input.session?.sovereignHash ?? null,
    moduleId: input.moduleId,
    rawValue: input.rawValue,
  });

  if (!gate.ok || !gate.spec) {
    throw new ModuleGateError(gate.code || 'MODULE_UNKNOWN', gate.reason || 'Module Agent gate refused the run.');
  }

  const spec = gate.spec;
  const session = input.session as ModuleAgentSession;
  const value = (input.rawValue ?? '').trim();

  // 3 — HASH: the SHA-256 ID of what the user entered.
  const sha256Id = await computeModuleSha256(spec.moduleId, value, spec.piiClass);

  // 4 — ENCRYPT: AES-256-GCM, key derived from the session identity hash.
  const ciphertext = value ? await encryptClientSide(value, session.sovereignHash) : '';

  // 5 — SEAL.
  const completedAt = new Date().toISOString();
  const seal = await generateSHA256(
    `agape-sovereign/ivm-seal/1|${session.user.uid}|${spec.moduleId}|${completedAt}|${sha256Id}`,
  );

  // 7 — VERIFY (third-party chain).
  const client = input.client || moduleVerificationClient;
  const attestation = spec.localAttestation
    ? await attestLocally(spec.moduleId)
    : { measured: false, outcome: 'INCONCLUSIVE' as const, statement: 'No on-device signal is measurable for this vector.', facts: {} };

  let verification: VerificationSummary;
  if (input.skipVerification || client.sourcesFor(spec.moduleId).length === 0) {
    verification = {
      moduleId: spec.moduleId,
      reports: [],
      thirdPartyVerified: false,
      outcome: 'INCONCLUSIVE',
      statement: spec.verificationChain.length === 0
        ? 'No third-party source is registered for this vector — result is UNVERIFIED.'
        : 'Third-party verification was skipped for this run — result is UNVERIFIED.',
    };
  } else {
    verification = await client.verifyModule({
      moduleId: spec.moduleId,
      value,
      secondaryValue: spec.moduleId === 'email' ? value : undefined,
    });
  }

  // 8 — REPORT from evidence only.
  const finding = deriveFinding(spec, verification, attestation);

  // 6 — PERSIST ciphertext + hash only. Never plaintext.
  let persisted: ModuleAgentResult['persisted'];
  try {
    const docRef = doc(db, 'users', session.user.uid, 'module_data', 'active');
    await setDoc(docRef, {
      data: { [spec.moduleId]: ciphertext },
      hashes: { [`${spec.moduleId}Hash`]: sha256Id },
      seals: { [spec.moduleId]: seal },
      piiClass: { [spec.moduleId]: spec.piiClass },
      updatedAt: serverTimestamp(),
    }, { merge: true });
    persisted = { store: 'firestore', path: `users/${session.user.uid}/module_data/active` };
  } catch (err) {
    persisted = { store: 'none', error: err instanceof Error ? err.message : String(err) };
  }

  // Immutable audit record — hash only, never the value.
  let audited = false;
  try {
    await addDoc(collection(db, 'module_agent_audit'), {
      // Owner uid is stored so security rules can scope the record to its
      // owner. No user-entered value is ever written here — hash only.
      ownerUid: session.user.uid,
      sha256Id,
      identitySha256: session.sovereignHash,
      moduleId: spec.moduleId,
      vector: spec.vector,
      seal,
      piiClass: spec.piiClass,
      findingStatus: finding.status,
      thirdPartyVerified: finding.thirdPartyVerified,
      verification: verification.reports.map((r: VerificationReport) => ({
        source: r.sourceId,
        outcome: r.outcome,
        verified: r.verified,
        checkedAt: r.checkedAt,
      })),
      attestation: attestation.measured ? attestation.statement : null,
      persisted: persisted.store,
      completedAt: serverTimestamp(),
    });
    audited = true;
  } catch {
    audited = false;
  }

  return {
    moduleId: spec.moduleId,
    vector: spec.vector,
    label: spec.label,
    sha256Id,
    identitySha256: session.sovereignHash,
    seal,
    ciphertext,
    piiClass: spec.piiClass,
    attestation,
    verification,
    finding,
    persisted,
    audited,
    completedAt,
  };
}
