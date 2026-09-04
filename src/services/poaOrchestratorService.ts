/**
 * POA ORCHESTRATOR SERVICE — Sovereign Identity Flow Engine
 * ============================================================
 * OPERATION FRAMEWORK — Master Control Program
 *
 * The POAOrchestrator ties together all 4 sovereign modules:
 *   1. SHA-256 Gatekeeper (Phase 1)
 *   2. Capacity Check (Phase 1.5)
 *   3. IVM Agent (Phase 2 — Data Collector)
 *   4. Architect AI Agent (Phase 2 — Cognitive Core)
 *   5. Export/Recovery Agent (Phase 4 — Sovereign Passport)
 *
 * All state is keyed by SHA-256 hash only — no raw PII flows between stages.
 * Zero-retention: raw payloads purged after each stage transition.
 * ============================================================
 */

import { hashGoogleIdentity, hashPasskeyIdentity, isValidSHA256 } from './sovereignHashService';
import { checkAndReserveCapacity, releaseCapacitySlot } from './capacityService';
import { executeIVMAgent, persistIVMResult } from './ivmAgentService';
import { executeArchitectAIAgent } from './architectAIAgentService';
import { generateSovereignPassport, SovereignPassport } from './exportRecoveryService';
import { logEvent, AuditLogType } from './auditService';
import type { AuditReport } from './architectAIAgentService';

export type AuthType = 'google' | 'passkey' | 'anonymous';

export interface SessionState {
  sha256Id: string;
  authType: AuthType;
  status: 'AUTHENTICATED' | 'CAPACITY_DENIED' | 'FAILED';
  timestamp: string;
  capacitySlotReserved: boolean;
}

export interface POARunResult {
  success: boolean;
  sessionState: SessionState;
  auditReport?: AuditReport;
  passport?: SovereignPassport;
  error?: string;
}

/**
 * Stage 1: Gatekeeper — Produce SHA-256 identity hash.
 * Raw credentials are passed in and never stored or forwarded.
 */
export async function gatekeeperStage(params: {
  authType: AuthType;
  uid?: string;
  email?: string;
  credentialId?: string;
  sessionNonce?: string;
}): Promise<string> {
  const { authType, uid, email, credentialId, sessionNonce } = params;

  if (authType === 'google' && uid && email) {
    return hashGoogleIdentity(uid, email);
  }

  if ((authType === 'passkey' || authType === 'anonymous') && credentialId && sessionNonce) {
    return hashPasskeyIdentity(credentialId, sessionNonce);
  }

  throw new Error('[GATEKEEPER] Insufficient identity claims for hashing.');
}

/**
 * Stage 2: Capacity Gate — Reserve a slot or deny access.
 */
export async function capacityStage(sha256Id: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const result = await checkAndReserveCapacity(sha256Id);
  return { allowed: result.available, reason: result.reason };
}

/**
 * Full POA run — Gatekeeper → Capacity → IVM → Architect AI
 * (Export is triggered separately by the user on demand)
 */
export async function runPOAFlow(params: {
  authType: AuthType;
  uid?: string;
  email?: string;
  credentialId?: string;
  sessionNonce?: string;
  skipIVM?: boolean; // Skip if just logging in, not running full audit
}): Promise<POARunResult> {
  const timestamp = new Date().toISOString();
  let sha256Id: string = '';

  try {
    // STAGE 1: Produce SHA-256 identity hash
    sha256Id = await gatekeeperStage(params);

    if (!isValidSHA256(sha256Id)) {
      throw new Error('Gatekeeper produced an invalid hash.');
    }

    await logEvent(
      AuditLogType.USER_LOGIN,
      `[POA] Gatekeeper: SHA-256 identity hash produced (auth: ${params.authType})`,
      undefined, // no uid — hash only
      undefined
    );

    // STAGE 2: Capacity check
    const capacity = await capacityStage(sha256Id);
    if (!capacity.allowed) {
      return {
        success: false,
        sessionState: {
          sha256Id,
          authType: params.authType,
          status: 'CAPACITY_DENIED',
          timestamp,
          capacitySlotReserved: false,
        },
        error: capacity.reason,
      };
    }

    const sessionState: SessionState = {
      sha256Id,
      authType: params.authType,
      status: 'AUTHENTICATED',
      timestamp,
      capacitySlotReserved: true,
    };

    // Return early if full audit not requested (login only)
    if (params.skipIVM) {
      return { success: true, sessionState };
    }

    // STAGE 3: IVM Agent — collect identity vectors
    const ivmPayload = await executeIVMAgent(sha256Id);
    await persistIVMResult(ivmPayload);

    await logEvent(
      AuditLogType.SCAN_INITIATED,
      `[POA] IVM: ${ivmPayload.status} — ${Object.keys(ivmPayload.vectors).length}/16 vectors`,
      undefined
    );

    // STAGE 4: Architect AI Agent — structured audit inference
    const auditReport = await executeArchitectAIAgent(ivmPayload);

    await logEvent(
      AuditLogType.SCAN_COMPLETED,
      `[POA] Architect AI: score=${auditReport.reportableData.sovereignAuditScore} model=${auditReport.llmModel}`,
      undefined
    );

    return {
      success: true,
      sessionState,
      auditReport,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[POA CRITICAL FAILURE]', msg);

    // Release capacity slot on failure
    if (sha256Id) {
      await releaseCapacitySlot().catch(() => {});
    }

    return {
      success: false,
      sessionState: {
        sha256Id: sha256Id || '',
        authType: params.authType,
        status: 'FAILED',
        timestamp,
        capacitySlotReserved: false,
      },
      error: msg,
    };
  }
}

/**
 * Export stage — called explicitly from user action, not auto-run.
 * Requires a completed audit report from runPOAFlow.
 */
export async function runExportStage(
  sha256Id: string,
  auditReport: AuditReport
): Promise<SovereignPassport> {
  return generateSovereignPassport(sha256Id, auditReport);
}

/**
 * Cleanup — call on sign-out to release the capacity slot.
 */
export async function cleanupSession(): Promise<void> {
  await releaseCapacitySlot();
}
