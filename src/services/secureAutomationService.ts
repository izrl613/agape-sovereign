/**
 * ============================================================
 * Secure Automation Service (app adapter)
 * ============================================================
 *
 * Thin bridge between the React app and the hardened agent layer in
 * `agents/secure/`. It exists so the UI can adopt the secure pipeline
 * without importing the whole orchestrator directly.
 *
 * SECURITY: passkeySecret and recoverySecret are derived client-side
 * (passkey gesture + recovery code). They must NEVER be sent to a Cloud
 * Function, an MCP server, or Firestore. The orchestrator returns a
 * ciphertext-only envelope that is safe to persist.
 *
 * Migration note: `src/services/diffEngine.ts` and `remediationService.ts`
 * still contain legacy mock paths used by older screens. Prefer this service
 * for any new or migrated flow.
 */

import {
  SovereignScanOrchestrator,
  type ScanOptions,
  type ScanRunResult,
} from '../../agents/secure/index.ts';

/** Legacy two-state model still consumed by parts of the UI. */
export type LegacyVectorState = 'KNOXED' | 'NUKED';

export interface SecureScanSummary {
  subject: string;
  /** High-level run state: KNOXED | NUKED | MIXED. */
  state: ScanRunResult['state'];
  sovereignScore: number;
  /** Per-module legacy states. Conservative by default. */
  legacyStates: Map<string, LegacyVectorState>;
  /** SHA-256 receipt digest per module. */
  receipts: Record<string, string>;
  /** Full result (includes the ciphertext-only envelope). */
  result: ScanRunResult;
}

/**
 * Run the secure 16-vector scan.
 *
 * @param options Must include client-derived passkeySecret + recoverySecret.
 */
export async function runSecureSovereignScan(
  options: ScanOptions,
): Promise<SecureScanSummary> {
  const result = await new SovereignScanOrchestrator().run(options);

  const legacyStates = new Map<string, LegacyVectorState>();
  const receipts: Record<string, string> = {};

  for (const vector of result.vectors) {
    const hasNuked = vector.findings.some((finding) => finding.status === 'NUKED');
    legacyStates.set(vector.moduleId, hasNuked ? 'NUKED' : 'KNOXED');
    receipts[vector.moduleId] = vector.receipt.digest;
  }

  return {
    subject: result.subject,
    state: result.state,
    sovereignScore: result.sovereignScore,
    legacyStates,
    receipts,
    result,
  };
}

/**
 * Convert a secure run result into the legacy `KNOXED`/`NUKED` map.
 *
 * @param strict When true (default), MONITORED vectors map to NUKED so an
 *   unconfigured vector is never silently presented as secure.
 */
export function toLegacyStates(
  result: ScanRunResult,
  strict = true,
): Map<string, LegacyVectorState> {
  const states = new Map<string, LegacyVectorState>();
  for (const vector of result.vectors) {
    const hasNuked = vector.findings.some((f) => f.status === 'NUKED');
    const onlyMonitored = vector.findings.every((f) => f.status === 'MONITORED');
    states.set(
      vector.moduleId,
      hasNuked || (strict && onlyMonitored) ? 'NUKED' : 'KNOXED',
    );
  }
  return states;
}

/** Machine-readable policy for UI display / diagnostics. */
export function getSecureScanPolicy(): Record<string, unknown> {
  return {
    cipher: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA-256',
    kdfIterations: 210_000,
    receipts: 'SHA-256 per vector, re-verified after envelope round-trip',
    secrets: 'client-side only; never transmitted',
    remediation: 'fail-closed unless an authenticated transport is provided',
    unconfiguredVectors: 'MONITORED, never fabricated',
  };
}
