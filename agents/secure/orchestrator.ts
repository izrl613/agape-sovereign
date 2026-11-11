/**
 * ============================================================
 * Agape Sovereign — Secure Scan Orchestrator
 * ============================================================
 *
 * Runs all 16 identity vectors, issues a SHA-256 receipt per vector,
 * verifies every receipt (recursive feedback loop), seals the run in a
 * zero-knowledge envelope, and gates remediation on confirmed NUKED state.
 *
 * This is the secure replacement for the mock `DIFFEngine.checkExposure`
 * that returned `Math.random() > 0.7`.
 *
 * Guarantees:
 *  - No fabricated findings. Unconfigured vectors are MONITORED.
 *  - Secrets are validated, never logged, never serialized.
 *  - Every vector result is bound to a SHA-256 receipt.
 *  - Receipts are re-verified after the envelope round-trip.
 *  - Remediation is fail-closed unless an explicit transport is supplied.
 */

import {
  createReceipt,
  verifyReceipt,
  sha256Hex,
  type VerificationReceipt,
  type Hex,
} from './receipts.ts';
import {
  createEnvelope,
  openEnvelope,
  ENVELOPE_PARAMS,
  type EncryptedEnvelope,
} from './envelope.ts';
import {
  IDENTITY_VECTORS,
  assertCompleteRegistry,
  type VectorDef,
  type VectorCategory,
} from './vectors.ts';
import {
  registerBuiltInProbes,
  getProbe,
  notConfiguredFinding,
  type ProbeFinding,
  type FindingStatus,
} from './probes.ts';
import {
  SecureRemediationDispatcher,
  remediationActionFor,
  type RemediationRequest,
  type RemediationTransport,
} from './remediation.ts';

export interface VectorResult {
  moduleId: string;
  vector: string;
  label: string;
  category: VectorCategory;
  probe: string;
  findings: ProbeFinding[];
  score: number;
  receipt: VerificationReceipt;
  durationMs: number;
}

export type SovereignState = 'KNOXED' | 'NUKED' | 'MIXED';
export type RunStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface ScanRunResult {
  status: RunStatus;
  /** SHA-256 hash of the user reference — never the raw UID. */
  subject: Hex;
  state: SovereignState;
  sovereignScore: number;
  vectors: VectorResult[];
  /** Ciphertext-only artifact, safe to persist on an untrusted server. */
  envelope: EncryptedEnvelope;
  verification: {
    receiptsValid: boolean;
    checked: number;
    sealedRoundTrip: boolean;
  };
  remediation: RemediationRequest[];
  completedAt: string;
}

export interface ScanOptions {
  /** Firebase UID or any stable user reference. Hashed before use. */
  userId: string;
  email?: string;
  /** Daily-unlock secret. At least 12 chars. Never stored or logged. */
  passkeySecret: string;
  /** Break-glass secret. Must differ from passkeySecret. */
  recoverySecret: string;
  /** Per-module string parameters (e.g. { 'device-health': { fileText } }). */
  params?: Record<string, Record<string, string>>;
  /** Dispatch remediation for confirmed NUKED vectors. Fail-closed by default. */
  enableRemediation?: boolean;
  /** Optional authenticated transport for real remediation. */
  remediationTransport?: RemediationTransport;
  /** Per-probe timeout in ms (default 10s). */
  probeTimeoutMs?: number;
  onProgress?: (event: { index: number; total: number; vector: string; message: string }) => void;
}

export class ReceiptVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptVerificationError';
  }
}

const MAX_PARAMS_BYTES = 1_000_000;
const DEFAULT_PROBE_TIMEOUT_MS = 10_000;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Score a set of findings: KNOXED=10, MONITORED=5, NUKED=0 points per finding. */
export function scoreFindings(findings: ProbeFinding[]): number {
  if (findings.length === 0) return 100;
  let earned = 0;
  for (const finding of findings) {
    if (finding.status === 'KNOXED') earned += 10;
    else if (finding.status === 'MONITORED') earned += 5;
    // NUKED contributes 0.
  }
  return clampScore((earned / (findings.length * 10)) * 100);
}

function classifyState(vectors: VectorResult[]): SovereignState {
  if (vectors.some((v) => v.findings.some((f) => f.status === 'NUKED'))) {
    return 'NUKED';
  }
  if (
    vectors.length > 0 &&
    vectors.every((v) => v.findings.length > 0 && v.findings.every((f) => f.status === 'KNOXED'))
  ) {
    return 'KNOXED';
  }
  return 'MIXED';
}

function weightedSovereignScore(vectors: VectorResult[]): number {
  if (vectors.length === 0) return 0;
  let weightSum = 0;
  let weighted = 0;
  for (const result of vectors) {
    const def = IDENTITY_VECTORS.find((v) => v.moduleId === result.moduleId);
    const weight = def?.weight ?? 1 / IDENTITY_VECTORS.length;
    weightSum += weight;
    weighted += result.score * weight;
  }
  if (weightSum === 0) return 0;
  return clampScore(weighted / weightSum);
}

function assertScanOptions(options: ScanOptions): void {
  if (!options || typeof options !== 'object') {
    throw new Error('run: options object is required');
  }
  if (typeof options.userId !== 'string' || options.userId.trim().length === 0) {
    throw new Error('run: userId is required');
  }
  if (
    typeof options.passkeySecret !== 'string' ||
    options.passkeySecret.length < ENVELOPE_PARAMS.minSecretLength
  ) {
    throw new Error(
      `run: passkeySecret must be at least ${ENVELOPE_PARAMS.minSecretLength} characters`,
    );
  }
  if (
    typeof options.recoverySecret !== 'string' ||
    options.recoverySecret.length < ENVELOPE_PARAMS.minSecretLength
  ) {
    throw new Error(
      `run: recoverySecret must be at least ${ENVELOPE_PARAMS.minSecretLength} characters`,
    );
  }
  if (options.passkeySecret === options.recoverySecret) {
    throw new Error('run: passkeySecret and recoverySecret must differ');
  }
  if (options.params !== undefined) {
    let serialized: string;
    try {
      serialized = JSON.stringify(options.params);
    } catch {
      throw new Error('run: params must be JSON-serializable');
    }
    if (serialized.length > MAX_PARAMS_BYTES) {
      throw new Error(`run: params exceed ${MAX_PARAMS_BYTES} bytes`);
    }
  }
}

/** Resolve a probe result, failing closed to MONITORED on error or timeout. */
async function runProbeSafely(
  def: VectorDef,
  options: ScanOptions,
  timeoutMs: number,
): Promise<{ probeId: string; findings: ProbeFinding[] }> {
  const probe = getProbe(def.moduleId);
  if (!probe) {
    return { probeId: 'not-configured', findings: [notConfiguredFinding(def)] };
  }

  const failClosed = (message: string): { probeId: string; findings: ProbeFinding[] } => ({
    probeId: probe.id,
    findings: [
      {
        status: 'MONITORED',
        label: `${def.vector} probe failed closed`,
        detail: message,
        severity: 0,
        source: probe.id,
      },
    ],
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('probe timed out')), timeoutMs);
  });

  try {
    const findings = await Promise.race([
      probe.run({
        userId: options.userId,
        email: options.email,
        params: options.params?.[def.moduleId],
      }),
      timeout,
    ]);
    if (!Array.isArray(findings)) {
      return failClosed('Probe returned a non-array result. No findings fabricated.');
    }
    // Defensive normalization: reject invalid statuses/severities.
    const normalized: ProbeFinding[] = findings
      .filter((f): f is ProbeFinding => !!f && typeof f === 'object')
      .map((f) => {
        const status: FindingStatus =
          f.status === 'NUKED' || f.status === 'KNOXED' || f.status === 'MONITORED'
            ? f.status
            : 'MONITORED';
        return {
          status,
          label: String(f.label ?? 'Unnamed finding').slice(0, 200),
          detail: String(f.detail ?? '').slice(0, 2000),
          severity: clampScore(Number(f.severity ?? 0)),
          remediation: f.remediation ? String(f.remediation).slice(0, 500) : undefined,
          source: f.source ? String(f.source).slice(0, 100) : probe.id,
        };
      });
    return {
      probeId: probe.id,
      findings: normalized.length > 0 ? normalized : [notConfiguredFinding(def)],
    };
  } catch (err) {
    return failClosed(
      `Probe error: ${err instanceof Error ? err.message : 'unknown'}. Fail-closed; no findings fabricated.`,
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class SovereignScanOrchestrator {
  async run(options: ScanOptions): Promise<ScanRunResult> {
    assertCompleteRegistry();
    assertScanOptions(options);
    registerBuiltInProbes();

    const timeoutMs = options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
    const subject = await sha256Hex(`sovereign|${options.userId}`);
    const total = IDENTITY_VECTORS.length;
    const vectors: VectorResult[] = [];

    for (let index = 0; index < total; index++) {
      const def = IDENTITY_VECTORS[index];
      options.onProgress?.({
        index,
        total,
        vector: def.vector,
        message: `Scanning ${def.label}`,
      });

      const startedAt = Date.now();
      const { probeId, findings } = await runProbeSafely(def, options, timeoutMs);
      const score = scoreFindings(findings);
      const receiptBody = { findings, score };
      const receipt = await createReceipt({
        subject,
        moduleId: def.moduleId,
        vector: def.vector,
        body: receiptBody,
      });

      vectors.push({
        moduleId: def.moduleId,
        vector: def.vector,
        label: def.label,
        category: def.category,
        probe: probeId,
        findings,
        score,
        receipt,
        durationMs: Date.now() - startedAt,
      });
    }

    // ── Verification feedback loop ──────────────────────────────────────────
    let checked = 0;
    for (const result of vectors) {
      const ok = await verifyReceipt(result.receipt, {
        findings: result.findings,
        score: result.score,
      });
      checked++;
      if (!ok) {
        throw new ReceiptVerificationError(
          `Receipt verification failed for ${result.vector} (${result.moduleId}).`,
        );
      }
    }

    const state = classifyState(vectors);
    const sovereignScore = weightedSovereignScore(vectors);

    // ── Remediation (fail-closed) ───────────────────────────────────────────
    const remediation: RemediationRequest[] = [];
    if (options.enableRemediation) {
      const dispatcher = new SecureRemediationDispatcher(options.remediationTransport);
      for (const result of vectors) {
        if (!result.findings.some((f) => f.status === 'NUKED')) continue;
        const request = await dispatcher.dispatch({
          moduleId: result.moduleId,
          vector: result.vector,
          action: remediationActionFor(result.moduleId),
          evidence: result.receipt.digest,
        });
        remediation.push(request);
      }
    }

    const completedAt = new Date().toISOString();
    const sealedPayload = {
      schema: 'agape.sovereign.scan.v1',
      subject,
      state,
      sovereignScore,
      completedAt,
      vectors,
      remediation,
    };

    // ── Seal in a zero-knowledge envelope ───────────────────────────────────
    const envelope = await createEnvelope(
      sealedPayload,
      options.passkeySecret,
      options.recoverySecret,
    );

    // ── Seal round-trip verification ────────────────────────────────────────
    const reopened = await openEnvelope<typeof sealedPayload>(
      envelope,
      options.passkeySecret,
      'passkey',
    );
    if (
      reopened.subject !== subject ||
      reopened.sovereignScore !== sovereignScore ||
      reopened.vectors.length !== vectors.length
    ) {
      throw new ReceiptVerificationError(
        'Sealed envelope round-trip verification failed (subject/score/vector mismatch).',
      );
    }
    for (const result of reopened.vectors) {
      const ok = await verifyReceipt(result.receipt, {
        findings: result.findings,
        score: result.score,
      });
      if (!ok) {
        throw new ReceiptVerificationError(
          `Sealed receipt verification failed for ${result.vector}.`,
        );
      }
    }

    const status: RunStatus =
      state === 'KNOXED' ? 'SUCCESS' : state === 'MIXED' ? 'PARTIAL' : 'SUCCESS';

    return {
      status,
      subject,
      state,
      sovereignScore,
      vectors,
      envelope,
      verification: {
        receiptsValid: true,
        checked,
        sealedRoundTrip: true,
      },
      remediation,
      completedAt,
    };
  }
}

export const sovereignScanOrchestrator = new SovereignScanOrchestrator();
