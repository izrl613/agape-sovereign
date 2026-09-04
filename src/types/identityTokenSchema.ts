/**
 * IDENTITY TOKEN SCHEMA
 * ============================================================
 * OPERATION FRAMEWORK — Cross-Module Identity Contract
 *
 * This is the single source of truth passed between ALL modules
 * in the Sovereign Pipeline. Keyed by SHA-256 hash only — no raw PII.
 *
 * Flow: Gatekeeper → Capacity → IVM → Architect AI → Export
 * Each stage reads/extends this token. Raw credentials never included.
 * ============================================================
 */

export type AuthType = 'google' | 'passkey' | 'anonymous';

export type SessionStatus =
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'CAPACITY_DENIED'
  | 'SCANNING'
  | 'AUDIT_COMPLETE'
  | 'EXPORTED'
  | 'EXPIRED'
  | 'FAILED';

export type VectorStatus = 'PENDING' | 'SCANNING' | 'KNOXED' | 'NUKED' | 'MONITORED' | 'SKIPPED';

/** Per-vector scan result — no raw PII, only status and risk signal. */
export interface VectorResult {
  vectorId: string;         // e.g. "V-01", "V-14"
  label: string;            // e.g. "Email Breach Scanner"
  status: VectorStatus;
  riskScore: number;        // 0–100 (100 = highest risk)
  findings: number;         // count of findings
  lastScanned: string;      // ISO timestamp
  sha256Checksum?: string;  // SHA-256 of scan payload (integrity proof)
}

/**
 * IdentityToken — The cross-module sovereign identity contract.
 * Created at gatekeeper stage. Extended by each pipeline stage.
 * Displayed via IdentityTokenBadge in every protected route.
 */
export interface IdentityToken {
  // ── Core identity (hash only — zero PII) ─────────────────────────────
  sha256Id: string;           // 64-char hex SHA-256 of uid+email or credentialId
  authType: AuthType;

  // ── Session state ─────────────────────────────────────────────────────
  sessionStatus: SessionStatus;
  capacitySlotReserved: boolean;
  capacitySlot?: number;       // Slot index (1–50)

  // ── Timestamps ────────────────────────────────────────────────────────
  createdAt: string;           // ISO timestamp of gatekeeper completion
  expiresAt?: string;          // ISO timestamp — session expiry
  auditCompletedAt?: string;

  // ── IVM Vector Results (Stage 3) ──────────────────────────────────────
  ivmVectors: VectorResult[];
  ivmStatus?: 'pending' | 'running' | 'complete' | 'failed';
  vectorsScanned: number;       // of 16 total
  vectorsTotal: number;         // always 16

  // ── Architect AI Audit (Stage 4) ──────────────────────────────────────
  sovereignAuditScore?: number; // 0–100 composite score
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  auditSummary?: string;

  // ── Export State (Stage 5) ────────────────────────────────────────────
  exportable: boolean;
  passportIssued?: boolean;
  passportExportedAt?: string;

  // ── Integrity ─────────────────────────────────────────────────────────
  tokenVersion: '1.0';
  agpSeal?: string;             // AGP-XXXX-XXXX-XXXX-XXXX integrity seal
}

/** Factory: create a blank token from gatekeeper output */
export function createIdentityToken(params: {
  sha256Id: string;
  authType: AuthType;
  capacitySlot?: number;
  agpSeal?: string;
}): IdentityToken {
  return {
    sha256Id: params.sha256Id,
    authType: params.authType,
    sessionStatus: 'AUTHENTICATED',
    capacitySlotReserved: true,
    capacitySlot: params.capacitySlot,
    createdAt: new Date().toISOString(),
    ivmVectors: [],
    vectorsScanned: 0,
    vectorsTotal: 16,
    exportable: false,
    tokenVersion: '1.0',
    agpSeal: params.agpSeal,
  };
}

/** Display helper: truncate sha256Id for UI */
export function truncateHash(hash: string, chars = 8): string {
  if (!hash || hash.length < chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/** Determine risk tier from sovereign audit score */
export function getRiskTier(score: number): IdentityToken['riskTier'] {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}

/** Status color map for UI rendering */
export const STATUS_COLORS: Record<SessionStatus, string> = {
  INITIALIZING: '#FF7A18',
  AUTHENTICATED: '#00D4FF',
  CAPACITY_DENIED: '#FF2E9F',
  SCANNING: '#FFD700',
  AUDIT_COMPLETE: '#00FF88',
  EXPORTED: '#A855F7',
  EXPIRED: '#6B7280',
  FAILED: '#EF4444',
};
