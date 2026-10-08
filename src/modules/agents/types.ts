/**
 * ============================================================
 * ARCHITECT AI — Identity Vector Agent Type System
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Core interfaces for the 16-agent identity vector architecture.
 * Every module agent implements IIdentityAgent to ensure
 * uniform scan orchestration, reporting, and Firestore persistence.
 */

// ── Module IDs (canonical) ─────────────────────────────────────────────────────

export const MODULE_IDS = [
  'email-scanner',
  'social-map',
  'device-health',
  'system-security',
  'deep-web',
  'broker-removal',
  'network-vector',
  'cloud-enclave',
  'biometrics',
  'crypto-assets',
  'smart-home',
  'metadata-purge',
  'kernel-health',
  'bios-integrity',
  'sovereign-id',
  'shadow-purge',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

// ── Vectors ────────────────────────────────────────────────────────────────────

export const VECTOR_MAP: Record<ModuleId, string> = {
  'email-scanner':   'V-01',
  'social-map':      'V-02',
  'device-health':   'V-03',
  'system-security': 'V-04',
  'deep-web':        'V-05',
  'broker-removal':  'V-06',
  'network-vector':  'V-07',
  'cloud-enclave':   'V-08',
  'biometrics':      'V-09',
  'crypto-assets':   'V-10',
  'smart-home':      'V-11',
  'metadata-purge':  'V-12',
  'kernel-health':   'V-13',
  'bios-integrity':  'V-14',
  'sovereign-id':    'V-15',
  'shadow-purge':    'V-16',
};

// ── Finding statuses (match existing DIFF nomenclature) ────────────────────────

export type FindingStatus = 'NUKED' | 'KNOXED' | 'MONITORED';

// ── Agent Config ───────────────────────────────────────────────────────────────

export interface AgentConfig {
  /** Canonical module ID */
  moduleId: ModuleId;
  /** Vector label (V-01 through V-16) */
  vector: string;
  /** Human-readable module name */
  label: string;
  /** One-line description */
  description: string;
  /** Display icon (Unicode or Lucide name) */
  icon: string;
  /** Sovereign Score weight (0–1, all 16 should sum to 1.0) */
  weight: number;
  /** External services this agent integrates with */
  integratedWith: string[];
}

// ── Agent Finding ──────────────────────────────────────────────────────────────

export interface AgentFinding {
  /** NUKED = active exposure, KNOXED = secured, MONITORED = under watch */
  status: FindingStatus;
  /** Short label for the finding */
  label: string;
  /** Detailed description */
  detail: string;
  /** Severity score (0–100, higher = more critical) */
  severity: number;
  /** Suggested remediation step */
  remediation?: string;
  /** Source API/tool that surfaced this finding */
  source?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

// ── Agent Result ───────────────────────────────────────────────────────────────

export interface AgentResult {
  /** Which module produced this result */
  moduleId: ModuleId;
  /** Vector label */
  vector: string;
  /** Individual findings */
  findings: AgentFinding[];
  /** Module security score (0–100, higher = more secure) */
  score: number;
  /** Scan wall-clock time in ms */
  scanDuration: number;
  /** When the scan completed */
  timestamp: Date;
  /** Counts broken out for UI */
  counts: {
    nuked: number;
    knoxed: number;
    monitored: number;
  };
}

// ── Progress Callback ──────────────────────────────────────────────────────────

export type ScanProgressCallback = (
  currentStep: number,
  totalSteps: number,
  moduleId: string,
  subTask?: string
) => void;

// ── Identity Agent Interface ───────────────────────────────────────────────────

export interface IIdentityAgent {
  /** Static configuration for this agent */
  readonly config: AgentConfig;

  /**
   * Initialize the agent.
   * Load API keys, warm caches, validate prerequisites.
   */
  initialize(): Promise<void>;

  /**
   * Execute the identity vector scan for a user.
   * @param userId  - Firebase UID
   * @param email   - User email (used for breach checks etc.)
   * @param params  - Module-specific parameters (e.g. encrypted inputs)
   * @param onProgress - Optional progress callback for UI updates
   */
  execute(
    userId: string,
    email: string,
    params?: Record<string, string>,
    onProgress?: ScanProgressCallback
  ): Promise<AgentResult>;

  /**
   * Generate an AI-powered narrative report from raw findings.
   * Uses localAIService (LM Studio / Gemma) by default.
   */
  generateReport(findings: AgentFinding[]): Promise<string>;

  /**
   * Cleanup resources (close connections, flush caches).
   */
  shutdown(): Promise<void>;
}
