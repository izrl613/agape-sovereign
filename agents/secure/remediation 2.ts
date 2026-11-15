/**
 * ============================================================
 * Agape Sovereign — Secure Remediation Dispatcher
 * ============================================================
 *
 * Replaces the mock dispatcher that used Math.random() identifiers and a
 * setTimeout that unconditionally reported success.
 *
 * Security properties:
 *  - Identifiers come from the CSPRNG (UUIDv4), never Math.random().
 *  - Status is only VERIFIED when a transport explicitly verifies it.
 *  - The default transport is fail-closed: it refuses to act and reports
 *    BLOCKED. No action is ever reported as complete without evidence.
 *  - Every dispatched request can be bound to a SHA-256 receipt.
 */

import { randomId, sha256Hex } from './receipts.ts';

export const REMEDIATION_ACTIONS = [
  'DATA_BROKER_DELETE',
  'OAUTH_REVOKE',
  'METADATA_PURGE',
  'CREDENTIAL_ROTATE',
] as const;

export type RemediationActionType = (typeof REMEDIATION_ACTIONS)[number];

export type RemediationStatus = 'BLOCKED' | 'DISPATCHED' | 'VERIFIED' | 'FAILED';

export interface RemediationRequest {
  id: string;
  moduleId: string;
  vector: string;
  action: RemediationActionType;
  status: RemediationStatus;
  createdAt: string;
  detail: string;
  receipt?: string;
}

export interface TransportResult {
  ok: boolean;
  /** Concrete evidence that the action completed. Required for VERIFIED. */
  verified?: boolean;
  detail: string;
}

/** A transport performs the actual external action (API call, email, etc.). */
export interface RemediationTransport {
  readonly name: string;
  dispatch(request: RemediationRequest): Promise<TransportResult>;
}

/**
 * Default transport: performs nothing and reports the reason.
 * This is the secure default — silent no-ops and fake success are bugs.
 */
export class FailClosedTransport implements RemediationTransport {
  readonly name = 'fail-closed';

  async dispatch(): Promise<TransportResult> {
    return {
      ok: false,
      verified: false,
      detail:
        'No remediation transport is configured. Action blocked (fail-closed). Configure an authenticated transport to enable remediation.',
    };
  }
}

export class SecureRemediationDispatcher {
  private transport: RemediationTransport | null;
  private requests = new Map<string, RemediationRequest>();

  constructor(transport?: RemediationTransport) {
    this.transport = transport ?? null;
  }

  /**
   * Dispatch an action for a vector with NUKED findings.
   * Returns a BLOCKED request when no transport is configured.
   */
  async dispatch(params: {
    moduleId: string;
    vector: string;
    action: RemediationActionType;
    evidence?: string;
  }): Promise<RemediationRequest> {
    if (!REMEDIATION_ACTIONS.includes(params.action)) {
      throw new Error(`dispatch: unsupported remediation action "${String(params.action)}"`);
    }

    const id = randomId('rem');
    const request: RemediationRequest = {
      id,
      moduleId: params.moduleId,
      vector: params.vector,
      action: params.action,
      status: 'BLOCKED',
      createdAt: new Date().toISOString(),
      detail: 'Pending transport acknowledgement.',
    };

    const transport = this.transport;
    if (!transport) {
      request.detail =
        'No remediation transport configured. Action blocked (fail-closed).';
      request.receipt = await sha256Hex(
        JSON.stringify({
          id,
          moduleId: request.moduleId,
          vector: request.vector,
          action: request.action,
          status: request.status,
          createdAt: request.createdAt,
        }),
      );
      this.requests.set(id, request);
      return request;
    }

    try {
      const result = await transport.dispatch(request);
      request.detail = result.detail;
      request.status = result.ok
        ? result.verified
          ? 'VERIFIED'
          : 'DISPATCHED'
        : 'BLOCKED';
    } catch (err) {
      request.status = 'FAILED';
      request.detail = `Transport error: ${err instanceof Error ? err.message : 'unknown error'}`;
    }

    request.receipt = await sha256Hex(
      JSON.stringify({
        id,
        moduleId: request.moduleId,
        vector: request.vector,
        action: request.action,
        status: request.status,
        createdAt: request.createdAt,
      }),
    );
    this.requests.set(id, request);
    return request;
  }

  get(id: string): RemediationRequest | undefined {
    return this.requests.get(id);
  }

  list(): RemediationRequest[] {
    return Array.from(this.requests.values());
  }
}

/** Map a vector to the most appropriate remediation action. */
export function remediationActionFor(moduleId: string): RemediationActionType {
  switch (moduleId) {
    case 'broker-removal':
    case 'shadow-purge':
      return 'DATA_BROKER_DELETE';
    case 'social-map':
      return 'OAUTH_REVOKE';
    case 'metadata-purge':
      return 'METADATA_PURGE';
    default:
      return 'CREDENTIAL_ROTATE';
  }
}
