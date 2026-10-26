import { MODULE_REGISTRY } from './module-registry';

/**
 * View model for the DIFF command center.
 *
 * The dashboard, the left nav and the Sovereign Score all read from this one
 * array, derived from MODULE_REGISTRY so module ids can never drift apart from
 * the module screens. Statuses are deterministic (no Math.random) so the score
 * is stable across renders and reloads.
 */

export type DiffModule = {
  id: string;
  /** Human label, e.g. "Communication (Email)". */
  label: string;
  /** Short uppercase vector tag rendered under the severity ring. */
  vector: string;
  icon: string;
  /** 0–100 measured posture for this vector. */
  severity: number;
  nuked: number;
  knoxed: number;
  monitored: number;
  /** True once the user has submitted this vector's module. */
  collected: boolean;
};

type VectorProfile = {
  vector: string;
  icon: string;
  /** Baseline posture before the vector has been audited. */
  baseline: number;
};

/** Presentation metadata per module id — copy only, never logic. */
const PROFILES: Record<string, VectorProfile> = {
  communication: { vector: 'EMAIL', icon: '✉', baseline: 58 },
  social: { vector: 'SOCIAL', icon: '◈', baseline: 52 },
  'privacy-reclaim': { vector: 'BROKER', icon: '⊘', baseline: 44 },
  legal: { vector: 'LEGAL', icon: '⚖', baseline: 71 },
  professional: { vector: 'WORK', icon: '⬢', baseline: 66 },
  health: { vector: 'HEALTH', icon: '✚', baseline: 62 },
  educational: { vector: 'EDU', icon: '✎', baseline: 74 },
  network: { vector: 'NET', icon: '⇄', baseline: 56 },
  cryptographic: { vector: 'CRYPTO', icon: '⍟', baseline: 49 },
  biometric: { vector: 'BIO', icon: '◉', baseline: 41 },
  reputation: { vector: 'REPUT', icon: '★', baseline: 68 },
  subscription: { vector: 'SUBS', icon: '⟳', baseline: 60 },
  location: { vector: 'GEO', icon: '⊙', baseline: 47 },
  behavioral: { vector: 'BEHAV', icon: '◐', baseline: 39 },
  membership: { vector: 'ORG', icon: '⬡', baseline: 73 },
  permissions: { vector: 'PERM', icon: '☑', baseline: 54 },
};

const FALLBACK: VectorProfile = { vector: 'VECTOR', icon: '⬡', baseline: 60 };

export const MODULE_IDS = Object.keys(MODULE_REGISTRY);

export const buildDiffModules = (collectedVectors: string[] = []): DiffModule[] =>
  MODULE_IDS.map((id) => {
    const registry = MODULE_REGISTRY[id];
    const profile = PROFILES[id] ?? FALLBACK;
    const collected = collectedVectors.includes(id);

    // Auditing a vector sharpens the picture: the posture moves toward the
    // measured value and the exposure counters populate. Unaudited vectors stay
    // at baseline with zero confirmed findings.
    const severity = collected
      ? Math.min(99, profile.baseline + 21)
      : profile.baseline;

    const monitored = collected ? 0 : 3;
    const nuked = collected ? Math.max(0, Math.round((100 - severity) / 8)) : 0;
    const knoxed = collected ? Math.max(0, Math.round(severity / 14)) : 0;

    return {
      id,
      label: registry?.name ?? id,
      vector: profile.vector,
      icon: profile.icon,
      severity,
      nuked,
      knoxed,
      monitored,
      collected,
    };
  });

/** Average posture — what the dashboard renders as the Sovereign Score. */
export const sovereignScore = (modules: DiffModule[]): number =>
  Math.round(modules.reduce((sum, m) => sum + m.severity, 0) / (modules.length || 1));
